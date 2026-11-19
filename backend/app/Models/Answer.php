<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Answer extends Model
{
    protected $fillable = ['question_id', 'value'];

    protected function casts(): array
    {
        return ['value' => 'json'];
    }

    public function response(): BelongsTo
    {
        return $this->belongsTo(Response::class);
    }
}
