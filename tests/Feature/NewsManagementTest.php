<?php

use App\Models\News;
use App\Models\NewsCategory;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

function createTestPublisher(): User
{
    return User::create([
        'name' => 'Publisher Tester',
        'email' => 'pubtester_' . uniqid() . '@sekolah.id',
        'username' => 'pubtester_' . uniqid(),
        'password' => Hash::make('password'),
        'role' => 'publisher',
        'email_verified_at' => now(),
    ]);
}

test('public dashboard loads news articles and categories', function () {
    $category = NewsCategory::firstOrCreate(
        ['slug' => 'test-cat'],
        ['name' => 'Kategori Uji', 'color' => 'blue']
    );

    News::create([
        'title' => 'Pengumuman Uji Publik',
        'slug' => 'pengumuman-uji-publik-' . uniqid(),
        'category_id' => $category->id,
        'content' => 'Isi pengumuman uji publik',
        'is_published' => true,
        'published_at' => now(),
    ]);

    $response = $this->get('/');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('welcome')
        ->has('news')
        ->has('newsCategories')
    );
});

test('publisher user is redirected from executive dashboard to news management', function () {
    $publisher = createTestPublisher();

    $response = $this->actingAs($publisher)->get('/dashboard');

    $response->assertRedirect(route('news.index'));
});

test('publisher user cannot access attendance routes', function () {
    $publisher = createTestPublisher();

    $response = $this->actingAs($publisher)->get('/attendances');

    $response->assertStatus(403);
});

test('publisher user can view and create news with image and pdf attachment', function () {
    Storage::fake('public');

    $publisher = createTestPublisher();
    $category = NewsCategory::firstOrCreate(
        ['slug' => 'cat-kegiatan'],
        ['name' => 'Kegiatan', 'color' => 'emerald']
    );

    $response = $this->actingAs($publisher)->get('/news-management');
    $response->assertStatus(200);

    $imageFile = UploadedFile::fake()->image('berita.jpg', 600, 400);
    $pdfFile = UploadedFile::fake()->create('edaran.pdf', 500, 'application/pdf');

    $title = 'Berita Kegiatan Baru dengan Lampiran PDF ' . uniqid();

    $storeResponse = $this->actingAs($publisher)->post('/news-management', [
        'title' => $title,
        'category_id' => $category->id,
        'excerpt' => 'Ringkasan kegiatan baru',
        'content' => '<p>Konten lengkap kegiatan baru</p>',
        'is_published' => true,
        'image' => $imageFile,
        'attachment' => $pdfFile,
    ]);

    $storeResponse->assertRedirect();

    $created = News::where('title', $title)->first();
    expect($created)->not->toBeNull();
    expect($created->image_path)->not->toBeNull();
    expect($created->attachment_path)->not->toBeNull();
    expect($created->attachment_name)->toBe('edaran.pdf');

    Storage::disk('public')->assertExists($created->image_path);
    Storage::disk('public')->assertExists($created->attachment_path);
});
