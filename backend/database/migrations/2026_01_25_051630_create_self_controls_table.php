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
        Schema::create('self_controls', function (Blueprint $table) {
            $table->id();
            $table->timestamp('date');
            $table->unsignedSmallInteger('heart_rate');
            $table->unsignedSmallInteger('systolic_pressure');
            $table->unsignedSmallInteger('diastolic_pressure');
            $table->unsignedTinyInteger('feeling');
            $table->decimal('body_weight', 5, 1)->unsigned();
            $table->string('description', 1000)->nullable();
            
            $table->foreignId('athlete_id')
                ->references('user_id')->on('athletes')
                ->cascadeOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('self_controls');
    }
};
