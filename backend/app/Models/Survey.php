<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Survey extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'slug', 'description', 'status', 'schema'];

    protected function casts(): array
    {
        return ['schema' => 'array'];
    }

    public function responses(): HasMany
    {
        return $this->hasMany(Response::class);
    }
}
