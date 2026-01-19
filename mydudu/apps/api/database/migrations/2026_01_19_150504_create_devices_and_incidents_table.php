<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_uuid', 64)->unique();
            $table->string('name', 50);
            $table->foreignId('posyandu_id')->nullable()->constrained('posyandus')->nullOnDelete();
            $table->string('location', 100)->nullable();
            // device_status enum
            $table->smallInteger('battery_level')->nullable();
            $table->timestamp('last_sync')->nullable();
        });

        DB::statement("ALTER TABLE devices ADD COLUMN status device_status DEFAULT 'OFFLINE'");
        DB::statement("ALTER TABLE devices ADD CONSTRAINT check_battery CHECK (battery_level BETWEEN 0 AND 100)");

        Schema::create('device_logs', function (Blueprint $table) {
            $table->id(); // BigSerial
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->timestamp('log_time')->useCurrent();
            $table->smallInteger('battery')->nullable();
            $table->decimal('temperature', 5, 2)->nullable();
            $table->bigInteger('clock_drift_ms')->nullable();
            // validation_status enum
        });

        DB::statement("ALTER TABLE device_logs ADD COLUMN status validation_status DEFAULT 'OK'");
        DB::statement("ALTER TABLE device_logs ADD CONSTRAINT check_battery_log CHECK (battery BETWEEN 0 AND 100)");
        DB::statement("CREATE INDEX idx_device_logs_device_time ON device_logs(device_id, log_time DESC)");

        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->nullable()->constrained('devices')->cascadeOnDelete();
            $table->string('title', 100);
            $table->text('description')->nullable();
            $table->string('priority', 10);
            $table->string('status', 15)->default('OPEN');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('resolved_at')->nullable();
        });

        DB::statement("ALTER TABLE incidents ADD CONSTRAINT check_priority CHECK (priority IN ('LOW','MEDIUM','HIGH'))");
        DB::statement("ALTER TABLE incidents ADD CONSTRAINT check_status CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
        Schema::dropIfExists('device_logs');
        Schema::dropIfExists('devices');
    }
};
