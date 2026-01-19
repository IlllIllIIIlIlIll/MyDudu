<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('validation_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sessions')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->useCurrent();
            $table->text('remarks')->nullable();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sessions')->cascadeOnDelete();
            $table->text('file_url');
            $table->timestamp('generated_at')->useCurrent();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // type, status enums
            $table->text('message');
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("ALTER TABLE notifications ADD COLUMN type notif_type NOT NULL");
        DB::statement("ALTER TABLE notifications ADD COLUMN status notif_status DEFAULT 'SENT'");

        Schema::create('education_articles', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->text('content');
            $table->string('category', 50)->nullable();
            $table->text('image_url')->nullable();
            $table->timestamps(); // created_at, updated_at
        });

        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('posyandu_id')->nullable()->constrained('posyandus')->cascadeOnDelete();
            $table->string('title', 100);
            $table->text('description')->nullable();
            $table->date('event_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100);
            $table->jsonb('details')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC)");

        Schema::create('geotags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sessions')->cascadeOnDelete();
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geotags');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('education_articles');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('validation_records');
    }
};
