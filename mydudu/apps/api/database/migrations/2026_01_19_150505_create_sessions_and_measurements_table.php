<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_uuid', 64)->unique();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->foreignId('operator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            // session_status enum
            $table->string('boot_session_id', 64)->nullable();
        });

        DB::statement("ALTER TABLE sessions ADD COLUMN status session_status DEFAULT 'IN_PROGRESS'");
        DB::statement("CREATE INDEX idx_sessions_child_id ON sessions(child_id)");
        DB::statement("CREATE INDEX idx_sessions_status ON sessions(status)");

        Schema::create('measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sessions')->cascadeOnDelete();
            // sensor_type enum
            $table->decimal('value', 8, 3);
            $table->string('unit', 10)->nullable();
            $table->timestamp('corrected_time')->nullable();
            $table->bigInteger('uptime_ms')->nullable();
            $table->string('boot_session_id', 64)->nullable();
            $table->boolean('is_estimated')->default(false);
        });

        DB::statement("ALTER TABLE measurements ADD COLUMN sensor_type sensor_type NOT NULL");
        DB::statement("ALTER TABLE measurements ADD CONSTRAINT check_value_positive CHECK (value >= 0)");
        DB::statement("CREATE INDEX idx_measurements_session_sensor ON measurements(session_id, sensor_type)");

        Schema::create('nutrition_status', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sessions')->cascadeOnDelete();
            $table->decimal('bb_u', 5, 2)->nullable();
            $table->decimal('tb_u', 5, 2)->nullable();
            $table->decimal('bb_tb', 5, 2)->nullable();
            // nutrition_category enum
        });

        DB::statement("ALTER TABLE nutrition_status ADD COLUMN category nutrition_category");
    }

    public function down(): void
    {
        Schema::dropIfExists('nutrition_status');
        Schema::dropIfExists('measurements');
        Schema::dropIfExists('sessions');
    }
};
