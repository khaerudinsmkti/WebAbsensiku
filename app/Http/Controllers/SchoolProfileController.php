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
     * Show the form for managing school profile, vision/mission, core values & hero banner.
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
                'hero_badge' => $setting->hero_badge,
                'hero_title' => $setting->hero_title,
                'hero_highlight' => $setting->hero_highlight,
                'hero_description' => $setting->hero_description,
                'hero_image_url' => $setting->hero_image_url,
                'hero_pillars' => $setting->hero_pillars,
                'core_values' => $setting->core_values,
                'address' => $setting->address,
                'city' => $setting->city,
                'principal_name' => $setting->principal_name,
            ],
            'school_name' => $setting->name,
        ]);
    }

    /**
     * Update the school profile, vision/mission, core values & hero banner in storage.
     */
    public function update(Request $request): RedirectResponse
    {
        $setting = SchoolSetting::getSetting();

        // Decode JSON strings if sent via multipart FormData
        if (is_string($request->input('core_values'))) {
            $decodedCoreValues = json_decode($request->input('core_values'), true);
            if (is_array($decodedCoreValues)) {
                $request->merge(['core_values' => $decodedCoreValues]);
            }
        }

        if (is_string($request->input('hero_pillars'))) {
            $decodedHeroPillars = json_decode($request->input('hero_pillars'), true);
            if (is_array($decodedHeroPillars)) {
                $request->merge(['hero_pillars' => $decodedHeroPillars]);
            }
        }

        $validated = $request->validate([
            'school_motto' => 'nullable|string|max:255',
            'accreditation' => 'nullable|string|max:100',
            'profile_description' => 'required|string|max:5000',
            'vision' => 'required|string|max:2000',
            'mission' => 'required|string|max:5000',
            'profile_image' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_image' => 'nullable|boolean',
            'hero_badge' => 'nullable|string|max:255',
            'hero_title' => 'nullable|string|max:255',
            'hero_highlight' => 'nullable|string|max:255',
            'hero_description' => 'nullable|string|max:2000',
            'hero_image' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_hero_image' => 'nullable|boolean',
            'hero_pillars' => 'nullable|array|min:1|max:8',
            'hero_pillars.*.title' => 'required|string|max:150',
            'hero_pillars.*.description' => 'required|string|max:500',
            'core_values' => 'nullable|array|min:1|max:8',
            'core_values.*.title' => 'required|string|max:150',
            'core_values.*.description' => 'required|string|max:500',
        ], [
            'profile_description.required' => 'Profil singkat sekolah wajib diisi.',
            'vision.required' => 'Visi sekolah wajib diisi.',
            'mission.required' => 'Misi sekolah wajib diisi.',
            'profile_image.mimes' => 'Format gambar harus berupa JPG, PNG, atau WEBP.',
            'profile_image.max' => 'Ukuran file gambar maksimal 5 MB.',
            'hero_image.mimes' => 'Format gambar hero harus berupa JPG, PNG, atau WEBP.',
            'hero_image.max' => 'Ukuran file gambar hero maksimal 5 MB.',
            'core_values.*.title.required' => 'Judul nilai utama wajib diisi.',
            'core_values.*.description.required' => 'Deskripsi nilai utama wajib diisi.',
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

        $heroImagePath = $setting->hero_image_path;

        if ($request->boolean('remove_hero_image')) {
            if ($heroImagePath && Storage::disk('public')->exists($heroImagePath)) {
                Storage::disk('public')->delete($heroImagePath);
            }
            $heroImagePath = null;
        }

        if ($request->hasFile('hero_image')) {
            if ($heroImagePath && Storage::disk('public')->exists($heroImagePath)) {
                Storage::disk('public')->delete($heroImagePath);
            }
            $heroImagePath = $request->file('hero_image')->store('school-profile', 'public');
        }

        $updateData = [
            'school_motto' => $validated['school_motto'] ?? null,
            'accreditation' => $validated['accreditation'] ?? null,
            'profile_description' => $validated['profile_description'],
            'vision' => $validated['vision'],
            'mission' => $validated['mission'],
            'profile_image_path' => $imagePath,
            'hero_image_path' => $heroImagePath,
        ];

        if ($request->has('hero_badge')) {
            $updateData['hero_badge'] = $validated['hero_badge'] ?: null;
        }
        if ($request->has('hero_title')) {
            $updateData['hero_title'] = $validated['hero_title'] ?: null;
        }
        if ($request->has('hero_highlight')) {
            $updateData['hero_highlight'] = $validated['hero_highlight'] ?: null;
        }
        if ($request->has('hero_description')) {
            $updateData['hero_description'] = $validated['hero_description'] ?: null;
        }
        if (! empty($validated['hero_pillars'])) {
            $updateData['hero_pillars'] = array_values($validated['hero_pillars']);
        }
        if (! empty($validated['core_values'])) {
            $updateData['core_values'] = array_values($validated['core_values']);
        }

        $setting->update($updateData);

        \App\Services\PwaManifestService::syncManifest();

        return back()
            ->with('success', 'Profil, Nilai-Nilai Utama, dan Hero Banner Sekolah berhasil diperbarui!')
            ->with('flash_message', 'Profil, Nilai-Nilai Utama, dan Hero Banner Sekolah berhasil diperbarui!');
    }

    /**
     * Quick update for Hero Banner directly from the public homepage or hero manager.
     */
    public function updateHero(Request $request): RedirectResponse
    {
        $setting = SchoolSetting::getSetting();

        if (is_string($request->input('hero_pillars'))) {
            $decodedHeroPillars = json_decode($request->input('hero_pillars'), true);
            if (is_array($decodedHeroPillars)) {
                $request->merge(['hero_pillars' => $decodedHeroPillars]);
            }
        }

        $validated = $request->validate([
            'hero_badge' => 'nullable|string|max:255',
            'hero_title' => 'required|string|max:255',
            'hero_highlight' => 'required|string|max:255',
            'hero_description' => 'required|string|max:2000',
            'hero_image' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_hero_image' => 'nullable|boolean',
            'hero_pillars' => 'nullable|array|min:1|max:8',
            'hero_pillars.*.title' => 'required|string|max:150',
            'hero_pillars.*.description' => 'required|string|max:500',
        ], [
            'hero_title.required' => 'Judul utama hero banner wajib diisi.',
            'hero_highlight.required' => 'Teks highlight hero banner wajib diisi.',
            'hero_description.required' => 'Deskripsi hero banner wajib diisi.',
            'hero_image.mimes' => 'Format gambar hero harus berupa JPG, PNG, atau WEBP.',
            'hero_image.max' => 'Ukuran file gambar hero maksimal 5 MB.',
        ]);

        $heroImagePath = $setting->hero_image_path;

        if ($request->boolean('remove_hero_image')) {
            if ($heroImagePath && Storage::disk('public')->exists($heroImagePath)) {
                Storage::disk('public')->delete($heroImagePath);
            }
            $heroImagePath = null;
        }

        if ($request->hasFile('hero_image')) {
            if ($heroImagePath && Storage::disk('public')->exists($heroImagePath)) {
                Storage::disk('public')->delete($heroImagePath);
            }
            $heroImagePath = $request->file('hero_image')->store('school-profile', 'public');
        }

        $setting->update([
            'hero_badge' => $validated['hero_badge'] ?: null,
            'hero_title' => $validated['hero_title'],
            'hero_highlight' => $validated['hero_highlight'],
            'hero_description' => $validated['hero_description'],
            'hero_image_path' => $heroImagePath,
            'hero_pillars' => ! empty($validated['hero_pillars']) ? array_values($validated['hero_pillars']) : $setting->hero_pillars,
        ]);

        return back()
            ->with('success', 'Hero Banner di halaman publik berhasil diperbarui!')
            ->with('flash_message', 'Hero Banner di halaman publik berhasil diperbarui!');
    }
}


