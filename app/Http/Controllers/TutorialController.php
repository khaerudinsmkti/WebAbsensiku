<?php

namespace App\Http\Controllers;

use App\Models\Tutorial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TutorialController extends Controller
{
    /**
     * Display a listing of tutorials visible to the current authenticated user's role.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $availableRoles = Tutorial::getAvailableRoles();

        $query = Tutorial::query()
            ->where('is_active', true)
            ->forRole($user->role)
            ->orderBy('order', 'asc')
            ->latest('id');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($roleFilter = $request->input('role')) {
            $query->whereJsonContains('target_roles', $roleFilter);
        }

        $tutorials = $query->get();

        return Inertia::render('tutorials/index', [
            'tutorials' => $tutorials,
            'availableRoles' => $availableRoles,
            'userRole' => $user->role,
            'isAdmin' => $user->role === 'admin',
            'filters' => [
                'search' => $request->input('search', ''),
                'role' => $request->input('role', ''),
            ],
        ]);
    }

    /**
     * Display the admin tutorial management console.
     */
    public function adminIndex(Request $request): Response
    {
        $availableRoles = Tutorial::getAvailableRoles();

        $query = Tutorial::query()
            ->with('createdBy:id,name')
            ->orderBy('order', 'asc')
            ->latest('id');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($roleFilter = $request->input('role')) {
            $query->whereJsonContains('target_roles', $roleFilter);
        }

        if ($request->has('status') && $request->input('status') !== null && $request->input('status') !== '') {
            $query->where('is_active', filter_var($request->input('status'), FILTER_VALIDATE_BOOLEAN));
        }

        $tutorials = $query->paginate(12)->withQueryString();

        // Calculate statistics
        $allTutorials = Tutorial::all();
        $roleCounts = [];
        foreach (array_keys($availableRoles) as $rKey) {
            $roleCounts[$rKey] = $allTutorials->filter(function ($t) use ($rKey) {
                return is_array($t->target_roles) && in_array($rKey, $t->target_roles);
            })->count();
        }

        $stats = [
            'total' => $allTutorials->count(),
            'active' => $allTutorials->where('is_active', true)->count(),
            'inactive' => $allTutorials->where('is_active', false)->count(),
            'role_counts' => $roleCounts,
        ];

        return Inertia::render('admin/tutorials/index', [
            'tutorials' => $tutorials,
            'stats' => $stats,
            'availableRoles' => $availableRoles,
            'filters' => [
                'search' => $request->input('search', ''),
                'role' => $request->input('role', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }

    /**
     * Store a newly created tutorial in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $allowedRoles = implode(',', array_keys(Tutorial::getAvailableRoles()));

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'youtube_url' => 'required|string|max:500',
            'target_roles' => 'required|array|min:1',
            'target_roles.*' => "required|string|in:{$allowedRoles}",
            'description' => 'nullable|string|max:2000',
            'order' => 'nullable|integer|min:0|max:9999',
            'is_active' => 'nullable|boolean',
        ], [
            'title.required' => 'Judul video tutorial wajib diisi.',
            'youtube_url.required' => 'Link URL video YouTube wajib diisi.',
            'target_roles.required' => 'Pilih minimal satu kategori peran target untuk video ini.',
            'target_roles.min' => 'Pilih minimal satu kategori peran target untuk video ini.',
            'target_roles.*.in' => 'Kategori peran yang dipilih tidak valid.',
        ]);

        $youtubeId = Tutorial::extractYoutubeId($validated['youtube_url']);
        if (! $youtubeId) {
            return back()->withErrors([
                'youtube_url' => 'Format link YouTube tidak valid. Harap gunakan format seperti https://www.youtube.com/watch?v=... atau https://youtu.be/...',
            ])->withInput();
        }

        Tutorial::create([
            'title' => $validated['title'],
            'youtube_url' => $validated['youtube_url'],
            'youtube_id' => $youtubeId,
            'target_roles' => array_values(array_unique($validated['target_roles'])),
            'description' => $validated['description'] ?? null,
            'order' => (int) ($validated['order'] ?? 0),
            'is_active' => $request->boolean('is_active', true),
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Video tutorial baru berhasil ditambahkan.');
    }

    /**
     * Update the specified tutorial in storage.
     */
    public function update(Request $request, Tutorial $tutorial): RedirectResponse
    {
        $allowedRoles = implode(',', array_keys(Tutorial::getAvailableRoles()));

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'youtube_url' => 'required|string|max:500',
            'target_roles' => 'required|array|min:1',
            'target_roles.*' => "required|string|in:{$allowedRoles}",
            'description' => 'nullable|string|max:2000',
            'order' => 'nullable|integer|min:0|max:9999',
            'is_active' => 'nullable|boolean',
        ], [
            'title.required' => 'Judul video tutorial wajib diisi.',
            'youtube_url.required' => 'Link URL video YouTube wajib diisi.',
            'target_roles.required' => 'Pilih minimal satu kategori peran target untuk video ini.',
            'target_roles.min' => 'Pilih minimal satu kategori peran target untuk video ini.',
            'target_roles.*.in' => 'Kategori peran yang dipilih tidak valid.',
        ]);

        $youtubeId = Tutorial::extractYoutubeId($validated['youtube_url']);
        if (! $youtubeId) {
            return back()->withErrors([
                'youtube_url' => 'Format link YouTube tidak valid. Harap gunakan format seperti https://www.youtube.com/watch?v=... atau https://youtu.be/...',
            ])->withInput();
        }

        $tutorial->update([
            'title' => $validated['title'],
            'youtube_url' => $validated['youtube_url'],
            'youtube_id' => $youtubeId,
            'target_roles' => array_values(array_unique($validated['target_roles'])),
            'description' => $validated['description'] ?? null,
            'order' => (int) ($validated['order'] ?? 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Data video tutorial berhasil diperbarui.');
    }

    /**
     * Remove the specified tutorial from storage.
     */
    public function destroy(Tutorial $tutorial): RedirectResponse
    {
        $tutorial->delete();

        return back()->with('success', 'Video tutorial berhasil dihapus.');
    }

    /**
     * Toggle the active status of the specified tutorial.
     */
    public function toggleActive(Tutorial $tutorial): RedirectResponse
    {
        $tutorial->update([
            'is_active' => ! $tutorial->is_active,
        ]);

        $statusText = $tutorial->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Video tutorial berhasil {$statusText}.");
    }
}
