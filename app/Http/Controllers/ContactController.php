<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\SchoolSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Store a new contact message from public users.
     */
    public function publicStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'nullable|email|max:120',
            'phone' => 'nullable|string|max:30',
            'subject' => 'nullable|string|max:150',
            'message' => 'required|string|max:2000',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'message.required' => 'Pesan atau pertanyaan wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
        ]);

        if (empty($validated['email']) && empty($validated['phone'])) {
            return back()->withErrors([
                'phone' => 'Harap sertakan minimal salah satu kontak (Nomor WhatsApp/Telepon atau Email) agar kami dapat membalas pesan Anda.',
            ])->withInput();
        }

        ContactMessage::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'subject' => $validated['subject'] ?? 'Pertanyaan / Pesan Pengunjung',
            'message' => $validated['message'],
            'is_read' => false,
        ]);

        return back()
            ->with('success', 'Terima kasih! Pesan Anda telah berhasil dikirim. Tim sekolah akan segera menghubungi Anda.')
            ->with('contact_success', 'Terima kasih! Pesan Anda telah berhasil dikirim. Tim sekolah akan segera menghubungi Anda.');
    }

    /**
     * Show the contact management page (Settings & Messages inbox).
     */
    public function index(Request $request): Response
    {
        $setting = SchoolSetting::getSetting();

        $search = $request->input('search');
        $status = $request->input('status'); // 'all', 'unread', 'read'

        $query = ContactMessage::query()->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($status === 'unread') {
            $query->unread();
        } elseif ($status === 'read') {
            $query->where('is_read', true);
        }

        $messages = $query->paginate(10)->withQueryString();

        $unreadCount = ContactMessage::unread()->count();
        $totalCount = ContactMessage::count();

        return Inertia::render('contact/manage', [
            'settings' => [
                'name' => $setting->name,
                'phone' => $setting->phone,
                'whatsapp' => $setting->whatsapp,
                'email' => $setting->email,
                'address' => $setting->address,
                'city' => $setting->city,
                'postal_code' => $setting->postal_code,
                'instagram' => $setting->instagram,
                'facebook' => $setting->facebook,
                'youtube' => $setting->youtube,
                'tiktok' => $setting->tiktok,
                'operating_hours' => $setting->operating_hours,
                'maps_embed_url' => $setting->maps_embed_url,
                'contact_description' => $setting->contact_description,
                'contact_active' => (bool) ($setting->contact_active ?? true),
            ],
            'messages' => $messages,
            'unreadCount' => $unreadCount,
            'totalCount' => $totalCount,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
            ],
        ]);
    }

    /**
     * Update school contact settings.
     */
    public function updateSettings(Request $request): RedirectResponse
    {
        $setting = SchoolSetting::getSetting();

        $validated = $request->validate([
            'phone' => 'nullable|string|max:50',
            'whatsapp' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:120',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'instagram' => 'nullable|string|max:150',
            'facebook' => 'nullable|string|max:150',
            'youtube' => 'nullable|string|max:150',
            'tiktok' => 'nullable|string|max:150',
            'operating_hours' => 'nullable|string|max:150',
            'maps_embed_url' => 'nullable|string',
            'contact_description' => 'nullable|string|max:1500',
            'contact_active' => 'boolean',
        ]);

        $setting->update([
            'phone' => $validated['phone'] ?? null,
            'whatsapp' => $validated['whatsapp'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'instagram' => $validated['instagram'] ?? null,
            'facebook' => $validated['facebook'] ?? null,
            'youtube' => $validated['youtube'] ?? null,
            'tiktok' => $validated['tiktok'] ?? null,
            'operating_hours' => $validated['operating_hours'] ?? null,
            'maps_embed_url' => $validated['maps_embed_url'] ?? null,
            'contact_description' => $validated['contact_description'] ?? null,
            'contact_active' => $request->boolean('contact_active', true),
        ]);

        return back()->with('success', 'Informasi Kontak Kami berhasil diperbarui.');
    }

    /**
     * Mark a contact message as read or toggle unread.
     */
    public function markAsRead(ContactMessage $message): RedirectResponse
    {
        $newStatus = ! $message->is_read;
        $message->update([
            'is_read' => $newStatus,
            'read_at' => $newStatus ? now() : null,
        ]);

        $statusText = $newStatus ? 'ditandai sudah dibaca' : 'ditandai belum dibaca';
        return back()->with('success', "Pesan berhasil {$statusText}.");
    }

    /**
     * Delete a contact message.
     */
    public function destroyMessage(ContactMessage $message): RedirectResponse
    {
        $message->delete();

        return back()->with('success', 'Pesan kontak berhasil dihapus.');
    }
}

