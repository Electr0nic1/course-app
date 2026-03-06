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
        Schema::create('trainings', function (Blueprint $table) {
            $table->id();
            $table->dateTime('date');
            $table->unsignedSmallInteger('duration_minutes');
            $table->string('description', 512)->nullable();
            $table->enum('status', ['planned', 'done', 'canceled'])->default('planned');

            $table->foreignId('training_type_id')
                ->constrained('training_types')
                ->cascadeOnDelete();

            $table->foreignId('coach_id')
                ->references('user_id')->on('coaches')
                ->cascadeOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trainings');
    }
};
