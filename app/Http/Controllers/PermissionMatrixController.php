<?php

namespace App\Http\Controllers;

use App\Services\PermissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermissionMatrixController extends Controller
{
    /**
     * Display the permissions matrix management page.
     */
    public function index(): Response
    {
        return Inertia::render('admin/permissions/index', [
            'roles' => PermissionService::getRoles(),
            'modules' => PermissionService::getModules(),
            'categories' => PermissionService::getCategories(),
            'matrix' => PermissionService::getMatrix(),
            'defaults' => PermissionService::getDefaultMatrix(),
        ]);
    }

    /**
     * Update the permissions matrix.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'matrix' => 'required|array',
        ]);

        PermissionService::updateMatrix($validated['matrix']);

        return back()->with('success', 'Matriks pengaturan hak akses berhasil disimpan dan langsung diterapkan ke seluruh pengguna.');
    }

    /**
     * Reset the permissions matrix to default system configuration.
     */
    public function reset(): RedirectResponse
    {
        PermissionService::seedDefaults();

        return back()->with('success', 'Matriks hak akses berhasil dikembalikan ke konfigurasi standar bawaan sistem.');
    }
}
