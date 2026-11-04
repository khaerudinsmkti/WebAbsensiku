<?php

namespace App\Http\Controllers;

use App\Models\SchoolSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PrincipalGreetingController extends Controller
{
    /**
     * Show the form for editing the principal greeting.
     */
    public function edit(): Response
    {
        $setting = SchoolSetting::getSetting();

        return Inertia::render('publisher/greeting', [
            'greeting' => [
                'principal_name' => $setting->principal_name,
                'principal_nip' => $setting->principal_nip,
                'principal_greeting_title' => $setting->principal_greeting_title ?? 'Sambutan Hangat Kepala Sekolah',
                'principal_greeting' => $setting->principal_greeting,
                'principal_greeting_active' => (bool) ($setting->principal_greeting_active ?? true),
                'principal_photo_url' => $setting->principal_photo_url,
            ],
            'school_name' => $setting->name,
        ]);
    }

    /**
     * Update the principal greeting in storage.
     */
    public function update(Request $request): RedirectResponse
    {
        $setting = SchoolSetting::getSetting();

        $validated = $request->validate([
            'principal_name' => 'required|string|max:150',
            'principal_nip' => 'nullable|string|max:50',
            'principal_greeting_title' => 'required|string|max:200',
            'principal_greeting' => 'required|string',
            'principal_greeting_active' => 'boolean',
            'principal_photo' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
            'principal_photo_base64' => 'nullable|string',
            'remove_photo' => 'nullable|boolean',
        ], [
            'principal_name.required' => 'Nama kepala sekolah wajib diisi.',
            'principal_greeting_title.required' => 'Judul sambutan kepala sekolah wajib diisi.',
            'principal_greeting.required' => 'Isi teks sambutan kepala sekolah wajib diisi.',
            'principal_photo.mimes' => 'Format foto harus berupa JPG, PNG, atau WEBP.',
            'principal_photo.max' => 'Ukuran file foto maksimal 5 MB.',
        ]);

        $photoPath = $setting->principal_photo_path;

        // Handle remove photo
        if ($request->boolean('remove_photo')) {
            if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                Storage::disk('public')->delete($photoPath);
            }
            $photoPath = null;
        }

        // Handle binary file upload
        if ($request->hasFile('principal_photo') && $request->file('principal_photo')->isValid()) {
            if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                Storage::disk('public')->delete($photoPath);
            }
            $photoPath = $request->file('principal_photo')->store('school_photos', 'public');
        } elseif ($request->filled('principal_photo_base64') && ! $request->boolean('remove_photo')) {
            // Handle client-side compressed base64
            $newPhoto = $this->storeBase64Image($request->input('principal_photo_base64'));
            if ($newPhoto) {
                if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                    Storage::disk('public')->delete($photoPath);
                }
                $photoPath = $newPhoto;
            }
        }

        $setting->update([
            'principal_name' => $validated['principal_name'],
            'principal_nip' => $validated['principal_nip'] ?? null,
            'principal_greeting_title' => $validated['principal_greeting_title'],
            'principal_greeting' => $validated['principal_greeting'],
            'principal_greeting_active' => $request->boolean('principal_greeting_active', true),
            'principal_photo_path' => $photoPath,
        ]);

        return back()->with('success', 'Sambutan dan profil kepala sekolah berhasil diperbarui.');
    }

    /**
     * Store base64 compressed image into storage.
     */
    protected function storeBase64Image(string $base64Data): ?string
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
            $data = substr($base64Data, strpos($base64Data, ',') + 1);
            $ext = strtolower($type[1]);
            if ($ext === 'jpeg') {
                $ext = 'jpg';
            }
            if (! in_array($ext, ['jpg', 'png', 'webp'])) {
                $ext = 'jpg';
            }

            $decoded = base64_decode($data);
            if ($decoded === false) {
                return null;
            }

            $fileName = 'school_photos/' . Str::random(40) . '.' . $ext;
            Storage::disk('public')->put($fileName, $decoded);

            return $fileName;
        }

        return null;
    }
}

