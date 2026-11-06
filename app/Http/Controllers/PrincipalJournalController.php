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
        $filterType = (string) $request->input('filter_type', 'monthly'); // all, monthly, date, range
        $month = (int) $request->input('month', Carbon::today()->month);
        $year = (int) $request->input('year', Carbon::today()->year);
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

        $periodLabel = 'Semua Periode';

        if ($filterType === 'monthly') {
            $mStart = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
            $mEnd = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();
            $query->whereBetween('activity_date', [$mStart, $mEnd]);
            $periodLabel = 'Bulan ' . ($this->monthNames[$month] ?? '') . ' ' . $year;
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
        } else {
            $filterType = 'all';
        }

        return [
            'query' => $query,
            'periodLabel' => $periodLabel,
            'filters' => [
                'search' => $search,
                'filter_type' => $filterType,
                'month' => $month,
                'year' => $year,
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
     * Export filtered Principal Journals to Excel (.xls).
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $this->ensurePrincipalOnly($request);

        $resolved = $this->buildFilteredQuery($request);
        $journals = $resolved['query']->reorder()->orderBy('activity_date')->orderBy('id')->get();
        $periodLabel = $resolved['periodLabel'];
        $school = SchoolSetting::getSetting();
        $user = $request->user();

        $safePeriod = str_replace([' ', '/', '.'], '_', $periodLabel);
        $fileName = "Jurnal_Kepala_Sekolah_{$safePeriod}.xls";

        return response()->streamDownload(function () use ($journals, $periodLabel, $school, $user) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            $output = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            $output .= '<head>';
            $output .= '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
            $output .= '<style>';
            $output .= 'table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; width: 100%; }';
            $output .= 'th, td { border: 1px solid #94A3B8; padding: 8px 10px; vertical-align: top; }';
            $output .= 'th { background-color: #EA580C; color: #FFFFFF; font-weight: bold; text-align: center; }';
            $output .= '.text-center { text-align: center; }';
            $output .= '.font-bold { font-weight: bold; }';
            $output .= '.meta-title { font-size: 15px; font-weight: bold; color: #0F172A; text-align: center; border: none; }';
            $output .= '.meta-sub { font-size: 11px; color: #475569; text-align: center; border: none; }';
            $output .= '</style>';
            $output .= '</head><body>';

            $output .= '<table>';
            $output .= '<tr><td colspan="5" class="meta-title">' . htmlspecialchars(strtoupper($school->name ?? 'SEKOLAH DIGITAL')) . '</td></tr>';
            $output .= '<tr><td colspan="5" class="meta-title">JURNAL KEGIATAN KEPALA SEKOLAH</td></tr>';
            $output .= '<tr><td colspan="5" class="meta-sub">Periode: ' . htmlspecialchars($periodLabel) . ' | Nama Kepala Sekolah: ' . htmlspecialchars($school->principal_name ?: ($user->name ?? '-')) . '</td></tr>';
            $output .= '<tr><td colspan="5" style="border:none;">&nbsp;</td></tr>';
            $output .= '</table>';

            $output .= '<table>';
            $output .= '<thead>';
            $output .= '<tr>';
            $output .= '<th style="width:45px;">No</th>';
            $output .= '<th style="width:150px;">Hari / Tanggal</th>';
            $output .= '<th style="width:240px;">Kegiatan yang Diikuti</th>';
            $output .= '<th style="width:380px;">Isi / Uraian Kegiatan</th>';
            $output .= '<th style="width:160px;">Dokumentasi</th>';
            $output .= '</tr>';
            $output .= '</thead>';
            $output .= '<tbody>';

            if ($journals->isEmpty()) {
                $output .= '<tr><td colspan="5" class="text-center">Belum ada data jurnal kegiatan pada periode ini.</td></tr>';
            } else {
                $no = 1;
                foreach ($journals as $journal) {
                    $photoCount = is_array($journal->images) ? count($journal->images) : ($journal->image_path ? 1 : 0);
                    $docText = $photoCount > 0 ? "{$photoCount} Foto Terlampir" : 'Tidak ada foto';
                    $output .= '<tr>';
                    $output .= '<td class="text-center font-bold">' . $no++ . '</td>';
                    $output .= '<td>' . htmlspecialchars($journal->formatted_date) . '</td>';
                    $output .= '<td class="font-bold">' . htmlspecialchars($journal->activity_name) . '</td>';
                    $output .= '<td>' . nl2br(htmlspecialchars($journal->activity_content)) . '</td>';
                    $output .= '<td class="text-center">' . htmlspecialchars($docText) . '</td>';
                    $output .= '</tr>';
                }
            }

            $output .= '</tbody>';
            $output .= '</table>';

            $output .= '<br/>';
            $output .= '<table>';
            $output .= '<tr>';
            $output .= '<td colspan="3" style="border:none;"></td>';
            $output .= '<td colspan="2" style="border:none; text-align:center;">'
                . htmlspecialchars($school->city ?? 'Jakarta') . ', ' . Carbon::today()->locale('id')->isoFormat('D MMMM Y')
                . '<br/>Kepala Sekolah ' . htmlspecialchars($school->name ?? '')
                . '<br/><br/><br/><br/><b>' . htmlspecialchars($school->principal_name ?: ($user->name ?? '-')) . '</b>'
                . '<br/>NIP. ' . htmlspecialchars($school->principal_nip ?: ($user->nip ?? '-'))
                . '</td>';
            $output .= '</tr>';
            $output .= '</table>';

            $output .= '</body></html>';

            fwrite($handle, $output);
            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control' => 'max-age=0',
        ]);
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

