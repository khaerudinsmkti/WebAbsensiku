<?php

namespace App\Http\Controllers;

use App\Models\SchoolSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SchoolProfileController extends Controller
{
    /**
     * Show the form for managing school profile & vision/mission.
     */
    public function edit(): Response
    {
        $setting = SchoolSetting::getSetting();

        return Inertia::render('publisher/school-profile', [
            'profile' => [
                'name' => $setting->name,
                'school_motto' => $setting->school_motto,
                'accreditation' => $setting->accreditation,
                'profile_description' => $setting->profile_description,
                'vision' => $setting->vision,
                'mission' => $setting->mission,
                'profile_image_url' => $setting->profile_image_url,
                'address' => $setting->address,
                'city' => $setting->city,
                'principal_name' => $setting->principal_name,
            ],
            'school_name' => $setting->name,
        ]);
    }

    /**
     * Update the school profile & vision/mission in storage.
     */
    public function update(Request $request): RedirectResponse
    {
        $setting = SchoolSetting::getSetting();

        $validated = $request->validate([
            'school_motto' => 'nullable|string|max:255',
            'accreditation' => 'nullable|string|max:100',
            'profile_description' => 'required|string|max:5000',
            'vision' => 'required|string|max:2000',
            'mission' => 'required|string|max:5000',
            'profile_image' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_image' => 'nullable|boolean',
        ], [
            'profile_description.required' => 'Profil singkat sekolah wajib diisi.',
            'vision.required' => 'Visi sekolah wajib diisi.',
            'mission.required' => 'Misi sekolah wajib diisi.',
            'profile_image.mimes' => 'Format gambar harus berupa JPG, PNG, atau WEBP.',
            'profile_image.max' => 'Ukuran file gambar maksimal 5 MB.',
        ]);

        $imagePath = $setting->profile_image_path;

        if ($request->boolean('remove_image')) {
            if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = null;
        }

        if ($request->hasFile('profile_image')) {
            if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = $request->file('profile_image')->store('school-profile', 'public');
        }

        $setting->update([
            'school_motto' => $validated['school_motto'] ?? null,
            'accreditation' => $validated['accreditation'] ?? null,
            'profile_description' => $validated['profile_description'],
            'vision' => $validated['vision'],
            'mission' => $validated['mission'],
            'profile_image_path' => $imagePath,
        ]);

        \App\Services\PwaManifestService::syncManifest();

        return back()
            ->with('success', 'Profil dan Visi Misi Sekolah berhasil diperbarui!')
            ->with('flash_message', 'Profil dan Visi Misi Sekolah berhasil diperbarui!');
    }
}

