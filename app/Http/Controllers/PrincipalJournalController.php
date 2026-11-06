<?php

namespace App\Http\Controllers;

use App\Models\PrincipalJournal;
use App\Models\SchoolSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrincipalJournalController extends Controller
{
    protected array $monthNames = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    protected function ensurePrincipalOnly(Request $request): void
    {
        $user = $request->user();
        if (! $user || $user->role !== 'principal') {
            abort(403, 'Fitur Jurnal Kepala Sekolah hanya dapat diakses oleh Kepala Sekolah.');
        }
    }

    /**
     * Build filtered query and period metadata.
     */
    protected function buildFilteredQuery(Request $request): array
    {
        PrincipalJournal::ensureTableExists();

        $search = trim((string) $request->input('search', ''));
        $filterType = (string) $request->input('filter_type', 'monthly'); // monthly, weekly, date, range
        if (! in_array($filterType, ['monthly', 'weekly', 'date', 'range'], true)) {
            $filterType = 'monthly';
        }
        $month = (int) $request->input('month', Carbon::today()->month);
        $year = (int) $request->input('year', Carbon::today()->year);
        $week = (int) $request->input('week', (int) ceil(Carbon::today()->day / 7));
        $date = (string) $request->input('date', Carbon::today()->toDateString());
        $startDate = (string) $request->input('start_date', Carbon::today()->startOfMonth()->toDateString());
        $endDate = (string) $request->input('end_date', Carbon::today()->toDateString());

        $query = PrincipalJournal::with('author:id,name,nip')
            ->orderByDesc('activity_date')
            ->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('activity_name', 'like', "%{$search}%")
                    ->orWhere('activity_content', 'like', "%{$search}%");
            });
        }

        $periodLabel = 'Bulan ' . ($this->monthNames[$month] ?? '') . ' ' . $year;

        if ($filterType === 'monthly') {
            $mStart = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
            $mEnd = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();
            $query->whereBetween('activity_date', [$mStart, $mEnd]);
            $periodLabel = 'Bulan ' . ($this->monthNames[$month] ?? '') . ' ' . $year;
        } elseif ($filterType === 'weekly') {
            $monthCarbon = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $daysInMonth = $monthCarbon->daysInMonth;
            $maxWeek = (int) ceil($daysInMonth / 7);
            $week = max(1, min($week, $maxWeek));

            $startDay = (($week - 1) * 7) + 1;
            $endDay = min($week * 7, $daysInMonth);

            $wStart = Carbon::createFromDate($year, $month, $startDay)->toDateString();
            $wEnd = Carbon::createFromDate($year, $month, $endDay)->toDateString();
            $query->whereBetween('activity_date', [$wStart, $wEnd]);

            $monthName = $this->monthNames[$month] ?? '';
            $periodLabel = "Minggu ke-{$week} {$monthName} {$year} ({$startDay}-{$endDay} {$monthName})";
        } elseif ($filterType === 'date') {
            if ($date !== '') {
                $query->whereDate('activity_date', $date);
                $periodLabel = 'Tanggal ' . Carbon::parse($date)->locale('id')->isoFormat('D MMMM Y');
            }
        } elseif ($filterType === 'range') {
            if ($startDate !== '' && $endDate !== '') {
                $query->whereBetween('activity_date', [$startDate, $endDate]);
                $periodLabel = Carbon::parse($startDate)->format('d/m/Y') . ' s.d. ' . Carbon::parse($endDate)->format('d/m/Y');
            }
        }

        return [
            'query' => $query,
            'periodLabel' => $periodLabel,
            'filters' => [
                'search' => $search,
                'filter_type' => $filterType,
                'month' => $month,
                'year' => $year,
                'week' => $week,
                'date' => $date,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ];
    }

    /**
     * Display Principal Journal list (Default 10 per page).
     */
    public function index(Request $request): Response
    {
        $this->ensurePrincipalOnly($request);

        $resolved = $this->buildFilteredQuery($request);
        $journals = $resolved['query']->paginate(10)->withQueryString();

        $totalPhotos = 0;
        foreach (PrincipalJournal::select('images', 'image_path')->get() as $j) {
            if (! empty($j->images) && is_array($j->images)) {
                $totalPhotos += count($j->images);
            } elseif ($j->image_path) {
                $totalPhotos += 1;
            }
        }

        $totalBytes = (int) PrincipalJournal::sum('file_size');
        $thisMonthStart = Carbon::today()->startOfMonth()->toDateString();
        $thisMonthEnd = Carbon::today()->endOfMonth()->toDateString();

        $stats = [
            'total_journals' => PrincipalJournal::count(),
            'this_month_journals' => PrincipalJournal::whereBetween('activity_date', [$thisMonthStart, $thisMonthEnd])->count(),
            'total_photos' => $totalPhotos,
            'total_size_formatted' => $this->formatBytes($totalBytes),
        ];

        return Inertia::render('principal/journals', [
            'journals' => $journals,
            'stats' => $stats,
            'filters' => $resolved['filters'],
            'periodLabel' => $resolved['periodLabel'],
            'monthNames' => $this->monthNames,
        ]);
    }

    /**
     * Store a new Principal Journal entry with compressed (non-cropped) documentation photos.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->ensurePrincipalOnly($request);
        PrincipalJournal::ensureTableExists();

        $rules = [
            'activity_date' => 'required|date',
            'activity_name' => 'required|string|max:255',
            'activity_content' => 'required|string|max:5000',
            'images_base64' => 'nullable|array',
            'images_base64.*' => 'string',
        ];

        if ($request->hasFile('images')) {
            $rules['images.*'] = 'file|mimes:jpeg,png,jpg,webp,gif|max:15360';
        }

        $validator = Validator::make($request->all(), $rules, [
            'activity_date.required' => 'Tanggal kegiatan wajib diisi.',
            'activity_name.required' => 'Kegiatan yang diikuti wajib diisi.',
            'activity_content.required' => 'Isi kegiatan wajib diisi.',
            'images.*.mimes' => 'Format foto dokumentasi harus JPG, JPEG, PNG, WebP, atau GIF.',
            'images.*.max' => 'Ukuran asli setiap foto maksimal 15 MB.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        $storedPaths = [];
        $totalBytes = 0;

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imgFile) {
                if ($imgFile->isValid()) {
                    $res = $this->compressAndSaveRawImageBytes(file_get_contents($imgFile->getRealPath()));
                    if ($res) {
                        $storedPaths[] = $res['path'];
                        $totalBytes += $res['size'];
                    }
                }
            }
        }

        if (! empty($validated['images_base64']) && is_array($validated['images_base64'])) {
            foreach ($validated['images_base64'] as $b64) {
                $res = $this->compressAndStoreBase64Image($b64);
                if ($res) {
                    $storedPaths[] = $res['path'];
                    $totalBytes += $res['size'];
                }
            }
        }

        PrincipalJournal::create([
            'activity_date' => $validated['activity_date'],
            'activity_name' => $validated['activity_name'],
            'activity_content' => $validated['activity_content'],
            'image_path' => $storedPaths[0] ?? null,
            'images' => ! empty($storedPaths) ? $storedPaths : null,
            'file_size' => $totalBytes,
            'user_id' => $request->user()?->id,
        ]);

        return back()->with('success', 'Jurnal Kepala Sekolah berhasil disimpan dan foto dokumentasi telah dikompresi tanpa crop.');
    }

    /**
     * Update an existing Principal Journal entry.
     */
    public function update(Request $request, PrincipalJournal $principalJournal): RedirectResponse
    {
        $this->ensurePrincipalOnly($request);
        PrincipalJournal::ensureTableExists();

        $rules = [
            'activity_date' => 'required|date',
            'activity_name' => 'required|string|max:255',
            'activity_content' => 'required|string|max:5000',
            'existing_images' => 'nullable|array',
            'existing_images.*' => 'string',
            'images_base64' => 'nullable|array',
            'images_base64.*' => 'string',
        ];

        if ($request->hasFile('images')) {
            $rules['images.*'] = 'file|mimes:jpeg,png,jpg,webp,gif|max:15360';
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        $currentImages = is_array($principalJournal->images)
            ? $principalJournal->images
            : ($principalJournal->image_path ? [$principalJournal->image_path] : []);

        $keptImages = [];
        if ($request->has('existing_images')) {
            $keptInput = (array) $request->input('existing_images', []);
            foreach ($keptInput as $img) {
                if (is_string($img) && in_array($img, $currentImages)) {
                    $keptImages[] = $img;
                }
            }

            foreach ($currentImages as $oldImg) {
                if (! in_array($oldImg, $keptImages) && Storage::disk('public')->exists($oldImg)) {
                    Storage::disk('public')->delete($oldImg);
                }
            }
        } else {
            $keptImages = $currentImages;
        }

        $newPaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imgFile) {
                if ($imgFile->isValid()) {
                    $res = $this->compressAndSaveRawImageBytes(file_get_contents($imgFile->getRealPath()));
                    if ($res) {
                        $newPaths[] = $res['path'];
                    }
                }
            }
        }

        if (! empty($validated['images_base64']) && is_array($validated['images_base64'])) {
            foreach ($validated['images_base64'] as $b64) {
                $res = $this->compressAndStoreBase64Image($b64);
                if ($res) {
                    $newPaths[] = $res['path'];
                }
            }
        }

        $finalImages = array_values(array_unique(array_merge($keptImages, $newPaths)));

        $totalBytes = 0;
        foreach ($finalImages as $path) {
            if (Storage::disk('public')->exists($path)) {
                $totalBytes += Storage::disk('public')->size($path);
            }
        }

        $principalJournal->update([
            'activity_date' => $validated['activity_date'],
            'activity_name' => $validated['activity_name'],
            'activity_content' => $validated['activity_content'],
            'image_path' => $finalImages[0] ?? null,
            'images' => ! empty($finalImages) ? $finalImages : null,
            'file_size' => $totalBytes,
        ]);

        return back()->with('success', 'Data Jurnal Kepala Sekolah berhasil diperbarui.');
    }

    /**
     * Delete a Principal Journal entry and its documentation photos.
     */
    public function destroy(Request $request, PrincipalJournal $principalJournal): RedirectResponse
    {
        $this->ensurePrincipalOnly($request);
        PrincipalJournal::ensureTableExists();

        $allImages = is_array($principalJournal->images) ? $principalJournal->images : [];
        if ($principalJournal->image_path && ! in_array($principalJournal->image_path, $allImages)) {
            $allImages[] = $principalJournal->image_path;
        }

        foreach ($allImages as $img) {
            if ($img && Storage::disk('public')->exists($img)) {
                Storage::disk('public')->delete($img);
            }
        }

        $principalJournal->delete();

        return back()->with('success', 'Jurnal Kepala Sekolah beserta foto dokumentasinya berhasil dihapus.');
    }

    /**
     * Export filtered Principal Journals to Excel (.xlsx) with embedded documentation images.
     */
    public function exportExcel(Request $request): StreamedResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $this->ensurePrincipalOnly($request);

        $resolved = $this->buildFilteredQuery($request);
        $journals = $resolved['query']->reorder()->orderBy('activity_date')->orderBy('id')->get();
        $periodLabel = $resolved['periodLabel'];
        $school = SchoolSetting::getSetting();
        $user = $request->user();

        $safePeriod = str_replace([' ', '/', '.'], '_', $periodLabel);
        $fileName = "Jurnal_Kepala_Sekolah_{$safePeriod}.xlsx";

        $tempFile = tempnam(sys_get_temp_dir(), 'jurnal_ks_') . '.xlsx';
        $this->buildExcelXlsxWithImages($tempFile, $journals, $periodLabel, $school, $user);

        return response()->download($tempFile, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Build a native OpenXML (.xlsx) file with embedded documentation photos in Column E.
     */
    protected function buildExcelXlsxWithImages(string $targetPath, $journals, string $periodLabel, $school, $user): void
    {
        $zip = new \ZipArchive();
        $zip->open($targetPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);

        $xmlEsc = fn (?string $str) => htmlspecialchars(
            preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', (string) $str) ?? '',
            ENT_XML1 | ENT_QUOTES,
            'UTF-8'
        );

        $cellInlineStr = function (string $cellRef, string $text, int $styleIdx) use ($xmlEsc): string {
            return '<c r="' . $cellRef . '" s="' . $styleIdx . '" t="inlineStr"><is><t xml:space="preserve">' . $xmlEsc($text) . '</t></is></c>';
        };

        $cellNum = function (string $cellRef, int|float $num, int $styleIdx): string {
            return '<c r="' . $cellRef . '" s="' . $styleIdx . '"><v>' . $num . '</v></c>';
        };

        $schoolTitle = strtoupper($school->name ?? 'SEKOLAH DIGITAL');
        $principalName = $school->principal_name ?: ($user->name ?? '-');
        $principalNip = $school->principal_nip ?: ($user->nip ?? '-');
        $subTitle = "Periode: {$periodLabel} | Nama Kepala Sekolah: {$principalName}";

        $sheetRowsXml = '';
        $mergeCells = [
            'A1:E1',
            'A2:E2',
            'A3:E3',
        ];

        // Row 1: School Name
        $sheetRowsXml .= '<row r="1" ht="22" customHeight="1">'
            . $cellInlineStr('A1', $schoolTitle, 1)
            . $cellInlineStr('B1', '', 1)
            . $cellInlineStr('C1', '', 1)
            . $cellInlineStr('D1', '', 1)
            . $cellInlineStr('E1', '', 1)
            . '</row>';

        // Row 2: Report Title
        $sheetRowsXml .= '<row r="2" ht="22" customHeight="1">'
            . $cellInlineStr('A2', 'JURNAL KEGIATAN KEPALA SEKOLAH', 1)
            . $cellInlineStr('B2', '', 1)
            . $cellInlineStr('C2', '', 1)
            . $cellInlineStr('D2', '', 1)
            . $cellInlineStr('E2', '', 1)
            . '</row>';

        // Row 3: Subtitle
        $sheetRowsXml .= '<row r="3" ht="18" customHeight="1">'
            . $cellInlineStr('A3', $subTitle, 2)
            . $cellInlineStr('B3', '', 2)
            . $cellInlineStr('C3', '', 2)
            . $cellInlineStr('D3', '', 2)
            . $cellInlineStr('E3', '', 2)
            . '</row>';

        // Row 4: Empty spacer
        $sheetRowsXml .= '<row r="4" ht="12" customHeight="1"/>';

        // Row 5: Table Header
        $sheetRowsXml .= '<row r="5" ht="28" customHeight="1">'
            . $cellInlineStr('A5', 'No', 3)
            . $cellInlineStr('B5', 'Hari / Tanggal', 3)
            . $cellInlineStr('C5', 'Kegiatan yang Diikuti', 3)
            . $cellInlineStr('D5', 'Isi / Uraian Kegiatan', 3)
            . $cellInlineStr('E5', 'Dokumentasi', 3)
            . '</row>';

        $currentRow = 6;
        $drawings = [];
        $picCounter = 1;

        if ($journals->isEmpty()) {
            $mergeCells[] = "A{$currentRow}:E{$currentRow}";
            $sheetRowsXml .= '<row r="' . $currentRow . '" ht="26" customHeight="1">'
                . $cellInlineStr("A{$currentRow}", 'Belum ada data jurnal kegiatan pada periode ini.', 7)
                . $cellInlineStr("B{$currentRow}", '', 7)
                . $cellInlineStr("C{$currentRow}", '', 7)
                . $cellInlineStr("D{$currentRow}", '', 7)
                . $cellInlineStr("E{$currentRow}", '', 7)
                . '</row>';
            $currentRow++;
        } else {
            $no = 1;
            foreach ($journals as $journal) {
                $paths = is_array($journal->images) && ! empty($journal->images)
                    ? $journal->images
                    : ($journal->image_path ? [$journal->image_path] : []);

                $validImages = [];
                foreach ($paths as $relPath) {
                    $fullPath = storage_path('app/public/' . $relPath);
                    if (is_file($fullPath)) {
                        $prepared = $this->prepareImageForExcel($fullPath, 140, 100);
                        if ($prepared !== null) {
                            $validImages[] = $prepared;
                        }
                    }
                }

                // Estimate row height needed for text vs embedded photo grid (2 photos per row in Column E)
                $contentLines = substr_count((string) $journal->activity_content, "\n") + 1;
                $wrappedLines = (int) ceil(mb_strlen((string) $journal->activity_content) / 60);
                $textLines = max($contentLines, $wrappedLines, 2);
                $textHeightPt = max(32, $textLines * 15 + 12);

                $photoCount = count($validImages);
                $photoRowsCount = $photoCount > 0 ? (int) ceil($photoCount / 2) : 0;
                // Each photo row is 100px + 8px gap = 108px (~81pt), plus 10px top/bottom padding
                $photoHeightPx = $photoRowsCount > 0 ? ($photoRowsCount * 108 + 8) : 0;
                $photoHeightPt = (int) ceil($photoHeightPx * 0.75);

                $rowHeightPt = max($textHeightPt, $photoHeightPt, 32);
                if ($rowHeightPt > 409) {
                    $rowHeightPt = 409; // Excel maximum single-row height in points
                }

                $docCellText = $photoCount > 0 ? '' : 'Tidak ada foto';

                $sheetRowsXml .= '<row r="' . $currentRow . '" ht="' . $rowHeightPt . '" customHeight="1">'
                    . $cellNum("A{$currentRow}", $no++, 5)
                    . $cellInlineStr("B{$currentRow}", (string) $journal->formatted_date, 4)
                    . $cellInlineStr("C{$currentRow}", (string) $journal->activity_name, 6)
                    . $cellInlineStr("D{$currentRow}", str_replace("\r\n", "\n", (string) $journal->activity_content), 4)
                    . $cellInlineStr("E{$currentRow}", $docCellText, 7)
                    . '</row>';

                // Anchor each photo inside Column E (0-based col = 4, 0-based row = $currentRow - 1)
                foreach ($validImages as $idx => $imgData) {
                    $gridCol = $idx % 2;
                    $gridRow = intdiv($idx, 2);

                    // Center image inside its 140x100 slot
                    $slotX = 8 + ($gridCol * 148) + intdiv(140 - $imgData['width'], 2);
                    $slotY = 6 + ($gridRow * 108) + intdiv(100 - $imgData['height'], 2);

                    $mediaName = "image{$picCounter}.jpg";
                    $zip->addFromString("xl/media/{$mediaName}", $imgData['bytes']);

                    $drawings[] = [
                        'id' => $picCounter,
                        'media' => $mediaName,
                        'col' => 4,
                        'row' => $currentRow - 1,
                        'colOff' => $slotX * 9525,
                        'rowOff' => $slotY * 9525,
                        'cx' => $imgData['width'] * 9525,
                        'cy' => $imgData['height'] * 9525,
                    ];
                    $picCounter++;
                }

                $currentRow++;
            }
        }

        // Blank spacer before signature
        $currentRow++;

        // Signature rows in Column D:E
        $cityDate = ($school->city ?? 'Jakarta') . ', ' . Carbon::today()->locale('id')->isoFormat('D MMMM Y');
        $headmasterTitle = 'Kepala Sekolah ' . ($school->name ?? '');

        $mergeCells[] = "D{$currentRow}:E{$currentRow}";
        $sheetRowsXml .= '<row r="' . $currentRow . '" ht="18" customHeight="1">'
            . $cellInlineStr("D{$currentRow}", $cityDate, 8)
            . $cellInlineStr("E{$currentRow}", '', 8)
            . '</row>';
        $currentRow++;

        $mergeCells[] = "D{$currentRow}:E{$currentRow}";
        $sheetRowsXml .= '<row r="' . $currentRow . '" ht="18" customHeight="1">'
            . $cellInlineStr("D{$currentRow}", $headmasterTitle, 8)
            . $cellInlineStr("E{$currentRow}", '', 8)
            . '</row>';
        $currentRow += 4;

        $mergeCells[] = "D{$currentRow}:E{$currentRow}";
        $sheetRowsXml .= '<row r="' . $currentRow . '" ht="18" customHeight="1">'
            . $cellInlineStr("D{$currentRow}", $principalName, 9)
            . $cellInlineStr("E{$currentRow}", '', 9)
            . '</row>';
        $currentRow++;

        $mergeCells[] = "D{$currentRow}:E{$currentRow}";
        $sheetRowsXml .= '<row r="' . $currentRow . '" ht="18" customHeight="1">'
            . $cellInlineStr("D{$currentRow}", 'NIP. ' . $principalNip, 8)
            . $cellInlineStr("E{$currentRow}", '', 8)
            . '</row>';

        $hasDrawings = ! empty($drawings);

        // 1. [Content_Types].xml
        $contentTypesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . '<Default Extension="jpg" ContentType="image/jpeg"/>'
            . '<Default Extension="jpeg" ContentType="image/jpeg"/>'
            . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            . '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            . ($hasDrawings ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : '')
            . '</Types>';
        $zip->addFromString('[Content_Types].xml', $contentTypesXml);

        // 2. _rels/.rels
        $rootRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            . '</Relationships>';
        $zip->addFromString('_rels/.rels', $rootRelsXml);

        // 3. xl/workbook.xml & xl/_rels/workbook.xml.rels
        $workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            . '<sheets><sheet name="Jurnal Kepala Sekolah" sheetId="1" r:id="rId1"/></sheets>'
            . '</workbook>';
        $zip->addFromString('xl/workbook.xml', $workbookXml);

        $workbookRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            . '</Relationships>';
        $zip->addFromString('xl/_rels/workbook.xml.rels', $workbookRelsXml);

        // 4. xl/styles.xml
        $stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            . '<fonts count="5">'
            . '<font><sz val="11"/><color rgb="FF0F172A"/><name val="Arial"/></font>'
            . '<font><b/><sz val="14"/><color rgb="FF0F172A"/><name val="Arial"/></font>'
            . '<font><sz val="10"/><color rgb="FF475569"/><name val="Arial"/></font>'
            . '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>'
            . '<font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Arial"/></font>'
            . '</fonts>'
            . '<fills count="3">'
            . '<fill><patternFill patternType="none"/></fill>'
            . '<fill><patternFill patternType="gray125"/></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FFEA580C"/><bgColor indexed="64"/></patternFill></fill>'
            . '</fills>'
            . '<borders count="2">'
            . '<border><left/><right/><top/><bottom/><diagonal/></border>'
            . '<border>'
            . '<left style="thin"><color rgb="FF94A3B8"/></left>'
            . '<right style="thin"><color rgb="FF94A3B8"/></right>'
            . '<top style="thin"><color rgb="FF94A3B8"/></top>'
            . '<bottom style="thin"><color rgb="FF94A3B8"/></bottom>'
            . '<diagonal/>'
            . '</border>'
            . '</borders>'
            . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            . '<cellXfs count="10">'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            . '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            . '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            . '<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>'
            . '<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf>'
            . '<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf>'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            . '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            . '</cellXfs>'
            . '</styleSheet>';
        $zip->addFromString('xl/styles.xml', $stylesXml);

        // 5. xl/worksheets/sheet1.xml
        $mergeXml = '<mergeCells count="' . count($mergeCells) . '">';
        foreach ($mergeCells as $ref) {
            $mergeXml .= '<mergeCell ref="' . $ref . '"/>';
        }
        $mergeXml .= '</mergeCells>';

        $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            . '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
            . '<sheetFormatPr defaultRowHeight="18"/>'
            . '<cols>'
            . '<col min="1" max="1" width="7" customWidth="1"/>'
            . '<col min="2" max="2" width="24" customWidth="1"/>'
            . '<col min="3" max="3" width="35" customWidth="1"/>'
            . '<col min="4" max="4" width="55" customWidth="1"/>'
            . '<col min="5" max="5" width="44" customWidth="1"/>'
            . '</cols>'
            . '<sheetData>' . $sheetRowsXml . '</sheetData>'
            . $mergeXml
            . '<pageMargins left="0.5" right="0.5" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>'
            . ($hasDrawings ? '<drawing r:id="rId1"/>' : '')
            . '</worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);

        // 6. Drawings if photos exist
        if ($hasDrawings) {
            $sheetRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>'
                . '</Relationships>';
            $zip->addFromString('xl/worksheets/_rels/sheet1.xml.rels', $sheetRelsXml);

            $drawingXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                . '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">';
            $drawingRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';

            foreach ($drawings as $d) {
                $rId = 'rId' . $d['id'];
                $drawingRelsXml .= '<Relationship Id="' . $rId . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/' . $d['media'] . '"/>';

                $drawingXml .= '<xdr:oneCellAnchor>'
                    . '<xdr:from>'
                    . '<xdr:col>' . $d['col'] . '</xdr:col>'
                    . '<xdr:colOff>' . $d['colOff'] . '</xdr:colOff>'
                    . '<xdr:row>' . $d['row'] . '</xdr:row>'
                    . '<xdr:rowOff>' . $d['rowOff'] . '</xdr:rowOff>'
                    . '</xdr:from>'
                    . '<xdr:ext cx="' . $d['cx'] . '" cy="' . $d['cy'] . '"/>'
                    . '<xdr:pic>'
                    . '<xdr:nvPicPr>'
                    . '<xdr:cNvPr id="' . $d['id'] . '" name="Dokumentasi ' . $d['id'] . '"/>'
                    . '<xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>'
                    . '</xdr:nvPicPr>'
                    . '<xdr:blipFill>'
                    . '<a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="' . $rId . '"/>'
                    . '<a:stretch><a:fillRect/></a:stretch>'
                    . '</xdr:blipFill>'
                    . '<xdr:spPr>'
                    . '<a:xfrm><a:off x="0" y="0"/><a:ext cx="' . $d['cx'] . '" cy="' . $d['cy'] . '"/></a:xfrm>'
                    . '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
                    . '</xdr:spPr>'
                    . '</xdr:pic>'
                    . '<xdr:clientData/>'
                    . '</xdr:oneCellAnchor>';
            }

            $drawingXml .= '</xdr:wsDr>';
            $drawingRelsXml .= '</Relationships>';

            $zip->addFromString('xl/drawings/drawing1.xml', $drawingXml);
            $zip->addFromString('xl/drawings/_rels/drawing1.xml.rels', $drawingRelsXml);
        }

        $zip->close();
    }

    /**
     * Prepare an image file as proportional JPEG bytes + target pixel dimensions for Excel embedding (no crop).
     *
     * @return array{bytes: string, width: int, height: int}|null
     */
    protected function prepareImageForExcel(string $fullPath, int $maxWidth = 140, int $maxHeight = 100): ?array
    {
        $raw = @file_get_contents($fullPath);
        if ($raw === false || strlen($raw) === 0) {
            return null;
        }

        if (function_exists('imagecreatefromstring')) {
            $src = @imagecreatefromstring($raw);
            if ($src !== false) {
                $srcW = max(1, imagesx($src));
                $srcH = max(1, imagesy($src));

                $ratio = min($maxWidth / $srcW, $maxHeight / $srcH, 1.0);
                $dstW = max(1, (int) round($srcW * $ratio));
                $dstH = max(1, (int) round($srcH * $ratio));

                $dst = imagecreatetruecolor($dstW, $dstH);
                $white = imagecolorallocate($dst, 255, 255, 255);
                imagefill($dst, 0, 0, $white);
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $dstW, $dstH, $srcW, $srcH);

                ob_start();
                imagejpeg($dst, null, 82);
                $jpegBytes = ob_get_clean();

                imagedestroy($src);
                imagedestroy($dst);

                if ($jpegBytes !== false && strlen($jpegBytes) > 0) {
                    return [
                        'bytes' => $jpegBytes,
                        'width' => $dstW,
                        'height' => $dstH,
                    ];
                }
            }
        }

        $info = @getimagesize($fullPath);
        $srcW = max(1, (int) ($info[0] ?? $maxWidth));
        $srcH = max(1, (int) ($info[1] ?? $maxHeight));
        $ratio = min($maxWidth / $srcW, $maxHeight / $srcH, 1.0);

        return [
            'bytes' => $raw,
            'width' => max(1, (int) round($srcW * $ratio)),
            'height' => max(1, (int) round($srcH * $ratio)),
        ];
    }

    /**
     * Export filtered Principal Journals to PDF (with embedded documentation photos).
     */
    public function exportPdf(Request $request): HttpResponse
    {
        $this->ensurePrincipalOnly($request);

        $resolved = $this->buildFilteredQuery($request);
        $journals = $resolved['query']->reorder()->orderBy('activity_date')->orderBy('id')->get();
        $periodLabel = $resolved['periodLabel'];
        $school = SchoolSetting::getSetting();
        $user = $request->user();

        $logoBase64 = null;
        if ($school->logo_path && file_exists(storage_path('app/public/' . $school->logo_path))) {
            $imageData = base64_encode(file_get_contents(storage_path('app/public/' . $school->logo_path)));
            $mime = mime_content_type(storage_path('app/public/' . $school->logo_path));
            $logoBase64 = "data:{$mime};base64,{$imageData}";
        }

        // Prepare base64 thumbnails for each journal's documentation photos
        $journalsData = $journals->map(function (PrincipalJournal $j) {
            $paths = is_array($j->images) && ! empty($j->images)
                ? $j->images
                : ($j->image_path ? [$j->image_path] : []);

            $photosBase64 = [];
            foreach (array_slice($paths, 0, 3) as $p) {
                $fullPath = storage_path('app/public/' . $p);
                if (file_exists($fullPath)) {
                    $mime = mime_content_type($fullPath) ?: 'image/jpeg';
                    $photosBase64[] = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($fullPath));
                }
            }

            return [
                'id' => $j->id,
                'formatted_date' => $j->formatted_date,
                'activity_name' => $j->activity_name,
                'activity_content' => $j->activity_content,
                'photos_base64' => $photosBase64,
                'total_photos' => count($paths),
            ];
        });

        $safePeriod = str_replace([' ', '/', '.'], '_', $periodLabel);
        $fileName = "Jurnal_Kepala_Sekolah_{$safePeriod}.pdf";

        $pdf = Pdf::loadView('principal.journal-pdf', [
            'journals' => $journalsData,
            'periodLabel' => $periodLabel,
            'school' => $school,
            'logoBase64' => $logoBase64,
            'principalName' => $school->principal_name ?: ($user->name ?? '-'),
            'principalNip' => $school->principal_nip ?: ($user->nip ?? '-'),
            'printedAt' => Carbon::today()->locale('id')->isoFormat('D MMMM Y'),
            'title' => 'Jurnal Kegiatan Kepala Sekolah - ' . $periodLabel,
        ]);

        $pdf->setPaper('a4', 'portrait');

        return $pdf->download($fileName);
    }

    /**
     * Decode base64 image string, compress via GD without cropping, and save to disk.
     *
     * @return array{path: string, size: int}|null
     */
    protected function compressAndStoreBase64Image(string $base64Data): ?array
    {
        if (str_contains($base64Data, ',')) {
            $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        }

        $decoded = base64_decode($base64Data);
        if ($decoded === false || strlen($decoded) === 0) {
            return null;
        }

        return $this->compressAndSaveRawImageBytes($decoded);
    }

    /**
     * Resize proportionally (NO CROP, max 1280px) and compress image bytes using PHP GD to save server disk capacity.
     *
     * @return array{path: string, size: int}|null
     */
    protected function compressAndSaveRawImageBytes(string $rawBytes, int $maxDimension = 1280, int $quality = 72): ?array
    {
        if (function_exists('imagecreatefromstring')) {
            $srcImg = @imagecreatefromstring($rawBytes);
            if ($srcImg !== false) {
                $srcWidth = imagesx($srcImg);
                $srcHeight = imagesy($srcImg);

                $targetWidth = $srcWidth;
                $targetHeight = $srcHeight;

                // Proportional scale down only (NO CROP)
                if ($srcWidth > $maxDimension || $srcHeight > $maxDimension) {
                    if ($srcWidth >= $srcHeight) {
                        $targetWidth = $maxDimension;
                        $targetHeight = (int) max(1, round(($srcHeight / $srcWidth) * $maxDimension));
                    } else {
                        $targetHeight = $maxDimension;
                        $targetWidth = (int) max(1, round(($srcWidth / $srcHeight) * $maxDimension));
                    }
                }

                $dstImg = imagecreatetruecolor($targetWidth, $targetHeight);
                $white = imagecolorallocate($dstImg, 255, 255, 255);
                imagefill($dstImg, 0, 0, $white);

                imagecopyresampled(
                    $dstImg,
                    $srcImg,
                    0,
                    0,
                    0,
                    0,
                    $targetWidth,
                    $targetHeight,
                    $srcWidth,
                    $srcHeight
                );

                ob_start();
                imagejpeg($dstImg, null, $quality);
                $compressedBytes = ob_get_clean();

                imagedestroy($srcImg);
                imagedestroy($dstImg);

                if ($compressedBytes !== false && strlen($compressedBytes) > 0) {
                    $fileName = 'principal_journals/' . Str::random(40) . '.jpg';
                    Storage::disk('public')->put($fileName, $compressedBytes);

                    return [
                        'path' => $fileName,
                        'size' => strlen($compressedBytes),
                    ];
                }
            }
        }

        $fileName = 'principal_journals/' . Str::random(40) . '.jpg';
        Storage::disk('public')->put($fileName, $rawBytes);

        return [
            'path' => $fileName,
            'size' => strlen($rawBytes),
        ];
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 KB';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 1) . ' ' . $units[$i];
    }
}

