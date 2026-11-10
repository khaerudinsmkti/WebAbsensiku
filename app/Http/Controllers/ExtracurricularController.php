<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ExtracurricularMember;
use App\Models\ExtracurricularReport;
use App\Models\ExtracurricularReportAttendee;
use App\Models\SchoolSetting;
use App\Models\Student;
use BaconQrCode\Renderer\Color\Rgb;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\Fill;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ExtracurricularController extends Controller
{
    /**
     * Display a listing of extracurricular reports.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasPermission('extracurricular', 'view')) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat modul Ekstrakurikuler.');
        }

        $isCoach = $user->isCoach();
        $isPrincipal = $user->isPrincipal();
        $isAdmin = $user->isAdmin();

        $query = ExtracurricularReport::query()
            ->with(['coach', 'approvedBy'])
            ->withCount([
                'attendees',
                'presentAttendees',
            ]);

        // If coach, show only their own reports
        if ($isCoach && ! $isAdmin && ! $isPrincipal) {
            $query->where('coach_id', $user->id);
        }

        // Filters
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('session_type') && $request->session_type !== 'all') {
            $query->where('session_type', $request->session_type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('extracurricular_name', 'like', "%{$search}%")
                    ->orWhere('activity_material', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhereHas('coach', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        $reports = $query->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        // Stats calculation
        $baseStatsQuery = ExtracurricularReport::query();
        if ($isCoach && ! $isAdmin && ! $isPrincipal) {
            $baseStatsQuery->where('coach_id', $user->id);
        }

        $stats = [
            'total' => (clone $baseStatsQuery)->count(),
            'pending' => (clone $baseStatsQuery)->where('status', 'pending')->count(),
            'approved' => (clone $baseStatsQuery)->where('status', 'approved')->count(),
            'rejected' => (clone $baseStatsQuery)->where('status', 'rejected')->count(),
            'total_roster' => $isCoach ? ExtracurricularMember::where('coach_id', $user->id)->count() : 0,
        ];

        return Inertia::render('extracurricular/index', [
            'reports' => $reports,
            'filters' => [
                'status' => $request->status ?? 'all',
                'session_type' => $request->session_type ?? 'all',
                'search' => $request->search ?? '',
                'date' => $request->date ?? '',
            ],
            'stats' => $stats,
            'userRole' => $user->role,
        ]);
    }

    /**
     * Show the form for creating a new report.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasPermission('extracurricular', 'create')) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuat laporan kegiatan ekstrakurikuler.');
        }

        // Fetch coach's default roster
        $defaultRoster = ExtracurricularMember::where('coach_id', $user->id)
            ->with(['student.classroom'])
            ->get()
            ->map(fn ($m) => [
                'student_id' => $m->student_id,
                'name' => $m->student->name,
                'nisn' => $m->student->nisn,
                'classroom_name' => $m->student->classroom->name ?? '-',
                'is_present' => true,
                'notes' => '',
            ]);

        // Fetch all active students for manual search/picker
        $allStudents = Student::where('is_active', true)
            ->with('classroom')
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'nisn' => $s->nisn,
                'classroom_id' => $s->classroom_id,
                'classroom_name' => $s->classroom->name ?? '-',
            ]);

        // Get last used extracurricular name by this coach
        $lastEkskulName = ExtracurricularReport::where('coach_id', $user->id)
            ->latest('id')
            ->value('extracurricular_name') ?? '';

        return Inertia::render('extracurricular/create', [
            'defaultRoster' => $defaultRoster,
            'allStudents' => $allStudents,
            'lastEkskulName' => $lastEkskulName,
            'sessionTypes' => [
                'Latihan terjadwal (sesuai ketetapan Sudin)',
                'Latihan tambahan',
            ],
        ]);
    }

    /**
     * Store a newly created report in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermission('extracurricular', 'create')) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuat laporan kegiatan ekstrakurikuler.');
        }

        if ($request->has('attendees') && is_string($request->input('attendees'))) {
            $decoded = json_decode($request->input('attendees'), true);
            if (is_array($decoded)) {
                $request->merge(['attendees' => $decoded]);
            }
        }

        $validated = $request->validate([
            'extracurricular_name' => 'required|string|max:100',
            'session_type' => 'required|string|in:Latihan terjadwal (sesuai ketetapan Sudin),Latihan tambahan',
            'date' => 'required|date',
            'start_time' => 'required|string|max:10',
            'end_time' => 'required|string|max:10',
            'location' => 'required|string|max:150',
            'activity_material' => 'required|string',
            'student_progress' => 'required|string',
            'obstacles_and_followup' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'photos' => 'nullable|array|max:10',
            'photos.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'attendees' => 'required|array|min:1',
            'attendees.*.student_id' => 'required|exists:students,id',
            'attendees.*.is_present' => 'nullable',
            'attendees.*.notes' => 'nullable|string|max:100',
        ]);

        $photoPaths = [];

        // Support multiple uploaded photos
        if ($request->hasFile('photos')) {
            $files = $request->file('photos');
            if (is_array($files)) {
                foreach ($files as $file) {
                    if ($file && $file->isValid()) {
                        $saved = $this->compressAndSaveImage($file);
                        if ($saved) {
                            $photoPaths[] = $saved;
                        }
                    }
                }
            }
        }

        // Support single photo upload
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            if ($file && $file->isValid()) {
                $saved = $this->compressAndSaveImage($file);
                if ($saved) {
                    $photoPaths[] = $saved;
                }
            }
        }

        $primaryPhotoPath = $photoPaths[0] ?? null;

        DB::transaction(function () use ($request, $validated, $primaryPhotoPath, $photoPaths) {
            $report = ExtracurricularReport::create([
                'coach_id' => $request->user()->id,
                'extracurricular_name' => $validated['extracurricular_name'],
                'session_type' => $validated['session_type'],
                'date' => $validated['date'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'location' => $validated['location'],
                'activity_material' => $validated['activity_material'],
                'student_progress' => $validated['student_progress'],
                'obstacles_and_followup' => $validated['obstacles_and_followup'],
                'photo_path' => $primaryPhotoPath,
                'photos' => ! empty($photoPaths) ? $photoPaths : null,
                'status' => 'pending', // Menunggu persetujuan kepala sekolah
            ]);

            $attendeeRows = [];
            foreach ($validated['attendees'] as $att) {
                $attendeeRows[] = [
                    'extracurricular_report_id' => $report->id,
                    'student_id' => $att['student_id'],
                    'is_present' => filter_var($att['is_present'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'notes' => $att['notes'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            ExtracurricularReportAttendee::insert($attendeeRows);
        });

        return redirect()->route('extracurricular.index')->with('success', 'Laporan ekskul berhasil diajukan dan sedang menunggu persetujuan Kepala Sekolah.');
    }

    /**
     * Display the specified report.
     */
    public function show(ExtracurricularReport $report): Response
    {
        $user = request()->user();
        if ($user && ! $user->hasPermission('extracurricular', 'view')) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat rincian laporan ekstrakurikuler.');
        }

        $report->load([
            'coach',
            'approvedBy',
            'attendees.student.classroom',
        ]);

        return Inertia::render('extracurricular/show', [
            'report' => $report,
        ]);
    }

    /**
     * Show the form for editing the specified report.
     */
    public function edit(Request $request, ExtracurricularReport $report): Response
    {
        $user = $request->user();

        if (! $user->hasPermission('extracurricular', 'edit')) {
            abort(403, 'Anda tidak berwenang mengedit laporan ini.');
        }

        // Authorization check: only owner coach or admin can edit
        if (! $user->isAdmin() && $report->coach_id !== $user->id) {
            abort(403, 'Anda tidak berwenang mengedit laporan ini.');
        }

        // If already approved, coaches cannot edit without admin
        if ($report->status === 'approved' && ! $user->isAdmin()) {
            abort(403, 'Laporan yang telah disetujui Kepala Sekolah tidak dapat diubah kembali.');
        }

        $report->load(['attendees.student.classroom']);

        $attendees = $report->attendees->map(fn ($att) => [
            'student_id' => $att->student_id,
            'name' => $att->student->name,
            'nisn' => $att->student->nisn,
            'classroom_name' => $att->student->classroom->name ?? '-',
            'is_present' => (bool) $att->is_present,
            'notes' => $att->notes ?? '',
        ]);

        $allStudents = Student::where('is_active', true)
            ->with('classroom')
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'nisn' => $s->nisn,
                'classroom_id' => $s->classroom_id,
                'classroom_name' => $s->classroom->name ?? '-',
            ]);

        return Inertia::render('extracurricular/edit', [
            'report' => $report,
            'currentAttendees' => $attendees,
            'allStudents' => $allStudents,
            'sessionTypes' => [
                'Latihan terjadwal (sesuai ketetapan Sudin)',
                'Latihan tambahan',
            ],
        ]);
    }

    /**
     * Update the specified report in storage.
     */
    public function update(Request $request, ExtracurricularReport $report): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermission('extracurricular', 'edit')) {
            abort(403, 'Anda tidak berwenang mengupdate laporan ini.');
        }

        if (! $user->isAdmin() && $report->coach_id !== $user->id) {
            abort(403, 'Anda tidak berwenang mengupdate laporan ini.');
        }

        if ($request->has('attendees') && is_string($request->input('attendees'))) {
            $decoded = json_decode($request->input('attendees'), true);
            if (is_array($decoded)) {
                $request->merge(['attendees' => $decoded]);
            }
        }

        $validated = $request->validate([
            'extracurricular_name' => 'required|string|max:100',
            'session_type' => 'required|string|in:Latihan terjadwal (sesuai ketetapan Sudin),Latihan tambahan',
            'date' => 'required|date',
            'start_time' => 'required|string|max:10',
            'end_time' => 'required|string|max:10',
            'location' => 'required|string|max:150',
            'activity_material' => 'required|string',
            'student_progress' => 'required|string',
            'obstacles_and_followup' => 'required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'photos' => 'nullable|array|max:10',
            'photos.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'existing_photos' => 'nullable',
            'remove_photo' => 'nullable|boolean',
            'attendees' => 'required|array|min:1',
            'attendees.*.student_id' => 'required|exists:students,id',
            'attendees.*.is_present' => 'nullable',
            'attendees.*.notes' => 'nullable|string|max:100',
        ]);

        // Retain surviving existing photos
        $existingPhotos = [];
        if ($request->has('existing_photos')) {
            $rawExisting = $request->input('existing_photos');
            if (is_string($rawExisting)) {
                $decoded = json_decode($rawExisting, true);
                if (is_array($decoded)) {
                    $existingPhotos = $decoded;
                }
            } elseif (is_array($rawExisting)) {
                $existingPhotos = $rawExisting;
            }
        } elseif (! $request->boolean('remove_photo')) {
            $existingPhotos = $report->photos ?? ($report->photo_path ? [$report->photo_path] : []);
        }

        // Delete discarded photos from disk
        $currentAll = $report->photos ?? ($report->photo_path ? [$report->photo_path] : []);
        $toDelete = array_diff($currentAll, $existingPhotos);
        foreach ($toDelete as $delPath) {
            if ($delPath && Storage::disk('public')->exists($delPath)) {
                Storage::disk('public')->delete($delPath);
            }
        }

        $photoPaths = array_values($existingPhotos);

        // Upload and compress new photos
        if ($request->hasFile('photos')) {
            $files = $request->file('photos');
            if (is_array($files)) {
                foreach ($files as $file) {
                    if ($file && $file->isValid()) {
                        $saved = $this->compressAndSaveImage($file);
                        if ($saved) {
                            $photoPaths[] = $saved;
                        }
                    }
                }
            }
        }

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            if ($file && $file->isValid()) {
                $saved = $this->compressAndSaveImage($file);
                if ($saved) {
                    $photoPaths[] = $saved;
                }
            }
        }

        $primaryPhotoPath = $photoPaths[0] ?? null;

        DB::transaction(function () use ($report, $validated, $primaryPhotoPath, $photoPaths) {
            // If was rejected, resetting status to pending on update
            $newStatus = $report->status === 'rejected' ? 'pending' : $report->status;

            $report->update([
                'extracurricular_name' => $validated['extracurricular_name'],
                'session_type' => $validated['session_type'],
                'date' => $validated['date'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'location' => $validated['location'],
                'activity_material' => $validated['activity_material'],
                'student_progress' => $validated['student_progress'],
                'obstacles_and_followup' => $validated['obstacles_and_followup'],
                'photo_path' => $primaryPhotoPath,
                'photos' => ! empty($photoPaths) ? $photoPaths : null,
                'status' => $newStatus,
            ]);

            // Sync attendees
            $report->attendees()->delete();

            $attendeeRows = [];
            foreach ($validated['attendees'] as $att) {
                $attendeeRows[] = [
                    'extracurricular_report_id' => $report->id,
                    'student_id' => $att['student_id'],
                    'is_present' => filter_var($att['is_present'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'notes' => $att['notes'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            ExtracurricularReportAttendee::insert($attendeeRows);
        });

        return redirect()->route('extracurricular.index')->with('success', 'Laporan ekskul berhasil diperbarui.');
    }

    /**
     * Remove the specified report from storage.
     */
    public function destroy(Request $request, ExtracurricularReport $report): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermission('extracurricular', 'delete')) {
            abort(403, 'Anda tidak berwenang menghapus laporan ini.');
        }

        if (! $user->isAdmin() && $report->coach_id !== $user->id) {
            abort(403, 'Anda tidak berwenang menghapus laporan ini.');
        }

        if (is_array($report->photos)) {
            foreach ($report->photos as $p) {
                if ($p && Storage::disk('public')->exists($p)) {
                    Storage::disk('public')->delete($p);
                }
            }
        } elseif ($report->photo_path && Storage::disk('public')->exists($report->photo_path)) {
            Storage::disk('public')->delete($report->photo_path);
        }

        $report->delete();

        return redirect()->route('extracurricular.index')->with('success', 'Laporan ekskul berhasil dihapus.');
    }

    /**
     * Principal / Admin approves or rejects the report.
     */
    public function approve(Request $request, ExtracurricularReport $report): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermission('extracurricular', 'approve')) {
            abort(403, 'Hanya pengguna dengan hak persetujuan yang berwenang memberikan validasi laporan.');
        }

        if (! $user->isAdmin() && ! $user->isPrincipal()) {
            abort(403, 'Hanya Kepala Sekolah atau Administrator yang berwenang memberikan persetujuan.');
        }

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'approval_notes' => 'nullable|string|max:500',
        ]);

        if ($validated['action'] === 'approve') {
            $report->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'approval_notes' => $validated['approval_notes'] ?? null,
            ]);

            return back()->with('success', 'Laporan ekskul berhasil disetujui. Dokumen cetak resmi kini telah dapat diunduh.');
        } else {
            $report->update([
                'status' => 'rejected',
                'approved_by' => $user->id,
                'approval_notes' => $validated['approval_notes'] ?? 'Perlu perbaikan laporan oleh pelatih.',
            ]);

            return back()->with('success', 'Status laporan telah diubah menjadi Perlu Revisi dengan catatan terkirim ke pelatih.');
        }
    }

    /**
     * Display printable view for an approved report.
     */
    public function print(ExtracurricularReport $report): Response
    {
        $user = request()->user();
        if ($user && ! $user->hasPermission('extracurricular', 'print') && ! $user->hasPermission('extracurricular', 'view')) {
            abort(403, 'Anda tidak memiliki izin mencetak laporan ekstrakurikuler.');
        }

        $report->load([
            'coach',
            'approvedBy',
            'attendees.student.classroom',
        ]);

        $setting = SchoolSetting::getSetting();

        // Use encrypted/random verification_token in public scan URL
        $verifyUrl = route('extracurricular.verify', $report->verification_token);
        $qrCodeSvg = $report->status === 'approved' ? $this->generateQrCodeSvg($verifyUrl, 110) : null;
        $qrCodeBase64 = $qrCodeSvg ? 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg) : null;

        return Inertia::render('extracurricular/print', [
            'report' => $report,
            'school' => $setting,
            'verifyUrl' => $verifyUrl,
            'qrCodeSvg' => $qrCodeSvg,
            'qrCodeBase64' => $qrCodeBase64,
        ]);
    }

    /**
     * Download official PDF report formatted identical to Principal Journal PDF.
     */
    public function exportPdf(string|ExtracurricularReport $identifier): HttpResponse
    {
        $user = auth()->user();
        if ($user && ! $user->hasPermission('extracurricular', 'print') && ! $user->hasPermission('extracurricular', 'view')) {
            abort(403, 'Anda tidak memiliki izin mengunduh PDF laporan ekstrakurikuler.');
        }

        $report = $identifier instanceof ExtracurricularReport
            ? $identifier
            : ExtracurricularReport::query()
                ->where('verification_token', $identifier)
                ->orWhere('id', is_numeric($identifier) ? (int) $identifier : 0)
                ->firstOrFail();

        $report->load([
            'coach',
            'approvedBy',
            'attendees.student.classroom',
        ]);

        $school = SchoolSetting::getSetting();

        $logoBase64 = null;
        if ($school->logo_path && file_exists(storage_path('app/public/' . $school->logo_path))) {
            $imageData = base64_encode(file_get_contents(storage_path('app/public/' . $school->logo_path)));
            $mime = mime_content_type(storage_path('app/public/' . $school->logo_path));
            $logoBase64 = "data:{$mime};base64,{$imageData}";
        }

        $photos = is_array($report->photos) && ! empty($report->photos)
            ? $report->photos
            : ($report->photo_path ? [$report->photo_path] : []);

        $photosBase64 = [];
        foreach ($photos as $p) {
            $fullPath = storage_path('app/public/' . $p);
            if (file_exists($fullPath)) {
                $mime = mime_content_type($fullPath) ?: 'image/jpeg';
                $photosBase64[] = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($fullPath));
            }
        }

        $coachName = $report->coach->name ?? 'Pelatih Ekskul';
        $coachNip = $report->coach->nip ?? null;

        $principalName = $report->approvedBy->name ?? ($school->principal_name ?: 'Kepala Sekolah');
        $principalNip = $report->approvedBy->nip ?? ($school->principal_nip ?: null);

        $presentCount = $report->attendees->where('is_present', true)->count();
        $totalAttendees = $report->attendees->count();
        $attendancePercent = $totalAttendees > 0 ? round(($presentCount / $totalAttendees) * 100) : 0;

        $formattedDate = Carbon::parse($report->date)->locale('id')->isoFormat('dddd, D MMMM Y');
        $printedAt = Carbon::today()->locale('id')->isoFormat('D MMMM Y');
        $approvedAtFormatted = $report->approved_at
            ? Carbon::parse($report->approved_at)->locale('id')->isoFormat('D MMMM Y, HH:mm [WIB]')
            : Carbon::parse($report->updated_at)->locale('id')->isoFormat('D MMMM Y, HH:mm [WIB]');

        // Use encrypted/random verification_token in QR code barcode
        $verifyUrl = route('extracurricular.verify', $report->verification_token);
        $qrCodeSvg = $report->status === 'approved' ? $this->generateQrCodeSvg($verifyUrl, 110) : null;
        $qrCodeBase64 = $qrCodeSvg ? 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg) : null;

        $safeEkskul = Str::slug($report->extracurricular_name);
        $safeDate = Carbon::parse($report->date)->format('Y-m-d');
        $fileName = "Laporan_Ekskul_{$safeEkskul}_{$safeDate}.pdf";

        $pdf = Pdf::loadView('extracurricular.report-pdf', [
            'report' => $report,
            'school' => $school,
            'logoBase64' => $logoBase64,
            'photosBase64' => $photosBase64,
            'coachName' => $coachName,
            'coachNip' => $coachNip,
            'principalName' => $principalName,
            'principalNip' => $principalNip,
            'attendees' => $report->attendees,
            'presentCount' => $presentCount,
            'attendancePercent' => $attendancePercent,
            'formattedDate' => $formattedDate,
            'printedAt' => $printedAt,
            'approvedAtFormatted' => $approvedAtFormatted,
            'verifyUrl' => $verifyUrl,
            'qrCodeBase64' => $qrCodeBase64,
            'title' => "Laporan Kegiatan {$report->extracurricular_name} - {$formattedDate}",
        ]);

        $pdf->setPaper('a4', 'portrait');

        return $pdf->download($fileName);
    }

    /**
     * Public verification page for scanned report QR code / barcode.
     */
    public function verify(string|ExtracurricularReport $identifier): Response
    {
        $report = $identifier instanceof ExtracurricularReport
            ? $identifier
            : ExtracurricularReport::query()
                ->where('verification_token', $identifier)
                ->orWhere('id', is_numeric($identifier) ? (int) $identifier : 0)
                ->firstOrFail();

        $report->load([
            'coach',
            'approvedBy',
            'attendees.student.classroom',
        ]);

        $setting = SchoolSetting::getSetting();

        return Inertia::render('extracurricular/verify', [
            'report' => $report,
            'school' => $setting,
        ]);
    }

    /**
     * Generate clean SVG QR Code string using BaconQrCode.
     */
    protected function generateQrCodeSvg(string $url, int $size = 110): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size, 1, null, null, Fill::uniformColor(new Rgb(255, 255, 255), new Rgb(15, 23, 42))),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $svg = $writer->writeString($url);

        return trim(substr($svg, strpos($svg, "\n") + 1));
    }

    /**
     * Display and manage the default student roster for the coach.
     */
    public function roster(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasPermission('extracurricular', 'roster')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola data anggota ekstrakurikuler.');
        }

        $members = ExtracurricularMember::where('coach_id', $user->id)
            ->with(['student.classroom'])
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'student_id' => $m->student_id,
                'name' => $m->student->name,
                'nisn' => $m->student->nisn,
                'classroom_name' => $m->student->classroom->name ?? '-',
                'notes' => $m->notes,
            ]);

        $allStudents = Student::where('is_active', true)
            ->with('classroom')
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'nisn' => $s->nisn,
                'classroom_id' => $s->classroom_id,
                'classroom_name' => $s->classroom->name ?? '-',
            ]);

        $classrooms = Classroom::orderBy('name')->get(['id', 'name']);

        return Inertia::render('extracurricular/roster', [
            'members' => $members,
            'allStudents' => $allStudents,
            'classrooms' => $classrooms,
        ]);
    }

    /**
     * Save the coach's default roster of students.
     */
    public function saveRoster(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermission('extracurricular', 'roster')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola data anggota ekstrakurikuler.');
        }

        $validated = $request->validate([
            'student_ids' => 'present|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $userId = $request->user()->id;
        $studentIds = array_unique($validated['student_ids']);

        DB::transaction(function () use ($userId, $studentIds) {
            // Remove unselected members
            ExtracurricularMember::where('coach_id', $userId)
                ->whereNotIn('student_id', $studentIds)
                ->delete();

            // Insert newly added members
            $existing = ExtracurricularMember::where('coach_id', $userId)
                ->pluck('student_id')
                ->toArray();

            $newIds = array_diff($studentIds, $existing);
            $rows = [];
            foreach ($newIds as $sId) {
                $rows[] = [
                    'coach_id' => $userId,
                    'student_id' => $sId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (! empty($rows)) {
                ExtracurricularMember::insert($rows);
            }
        });

        return back()->with('success', 'Daftar anggota ekskul default berhasil disimpan. Anggota ini akan otomatis dimuat saat Anda menginput laporan ekskul baru.');
    }

    /**
     * Compress an image file without cropping, keeping exact proportional aspect ratio.
     * Resizes proportionally only if dimensions exceed $maxDimension (1280px),
     * and re-encodes to JPEG at $quality (75%) to drastically save disk space.
     */
    protected function compressAndSaveImage($file, int $maxDimension = 1280, int $quality = 75): ?string
    {
        $rawBytes = null;
        if (is_string($file)) {
            $rawBytes = $file;
        } elseif ($file instanceof \Illuminate\Http\UploadedFile) {
            $rawBytes = file_get_contents($file->getRealPath());
        }

        if (! $rawBytes) {
            return null;
        }

        if (function_exists('imagecreatefromstring')) {
            $srcImg = @imagecreatefromstring($rawBytes);
            if ($srcImg !== false) {
                $srcWidth = imagesx($srcImg);
                $srcHeight = imagesy($srcImg);

                $targetWidth = $srcWidth;
                $targetHeight = $srcHeight;

                // Scale down proportionally without cropping if dimensions exceed limit
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
                // Fill white background in case source PNG/WebP has transparency
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
                    $fileName = 'extracurricular/' . Str::random(40) . '.jpg';
                    Storage::disk('public')->put($fileName, $compressedBytes);

                    return $fileName;
                }
            }
        }

        // Fallback if GD fails or not an image
        if ($file instanceof \Illuminate\Http\UploadedFile) {
            return $file->store('extracurricular', 'public');
        }

        return null;
    }
}
