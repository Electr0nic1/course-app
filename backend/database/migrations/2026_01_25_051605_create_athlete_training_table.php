<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('athlete_training', function (Blueprint $table) {
            $table->id();
            $table->enum('status', ['assigned', 'completed', 'skipped'])->default('assigned');

            $table->foreignId('athlete_id')
                ->references('user_id')->on('athletes')
                ->cascadeOnDelete();

            $table->foreignId('training_id')->constrained('trainings')->cascadeOnDelete();

            $table->unique(['athlete_id', 'training_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('athlete_training');
    }
};
