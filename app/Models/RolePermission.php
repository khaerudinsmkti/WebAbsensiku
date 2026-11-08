<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $role
 * @property string $module
 * @property string $permission
 * @property bool $is_granted
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class RolePermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'role',
        'module',
        'permission',
        'is_granted',
    ];

    protected $casts = [
        'is_granted' => 'boolean',
    ];
}
