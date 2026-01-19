<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('parent_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('phone_number', 20)->nullable();
            $table->text('address')->nullable();
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();
        });

        Schema::create('children', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('parent_profiles')->cascadeOnDelete();
            $table->string('full_name', 100);
            $table->date('birth_date');
            $table->char('gender', 1); // M/F check in raw sql or code
            $table->string('blood_type', 3)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("ALTER TABLE children ADD CONSTRAINT check_gender CHECK (gender IN ('M','F'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('children');
        Schema::dropIfExists('parent_profiles');
    }
};
