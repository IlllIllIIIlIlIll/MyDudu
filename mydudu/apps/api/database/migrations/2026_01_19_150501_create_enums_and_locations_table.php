<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Enums
        DB::statement("
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                    CREATE TYPE user_role AS ENUM ('ADMIN','OPERATOR','PUSKESMAS','DOCTOR','PARENT');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_status') THEN
                    CREATE TYPE device_status AS ENUM ('ONLINE','OFFLINE','ERROR');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
                    CREATE TYPE session_status AS ENUM ('IN_PROGRESS','COMPLETE','CLINICALLY_SUFFICIENT','INSUFFICIENT');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sensor_type') THEN
                    CREATE TYPE sensor_type AS ENUM ('WEIGHT','HEIGHT','TEMP','OXY','ARM_CIRC','HEAD_CIRC');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nutrition_category') THEN
                    CREATE TYPE nutrition_category AS ENUM ('NORMAL','STUNTED','WASTED','OBESE');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'validation_status') THEN
                    CREATE TYPE validation_status AS ENUM ('OK','WARN','FAIL');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notif_type') THEN
                    CREATE TYPE notif_type AS ENUM ('RESULT','REMINDER','SYSTEM');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notif_status') THEN
                    CREATE TYPE notif_status AS ENUM ('SENT','READ');
                END IF;
            END$$;
        ");

        // 2. Locations
        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 20)->unique()->nullable();
        });

        Schema::create('villages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('district_id')->constrained('districts')->cascadeOnDelete();
            $table->string('name', 100);
        });

        Schema::create('posyandus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('village_id')->constrained('villages')->cascadeOnDelete();
            $table->string('name', 100);
            $table->text('address')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posyandus');
        Schema::dropIfExists('villages');
        Schema::dropIfExists('districts');
        // We do not drop types strictly to avoid side effects, but cleaner would be:
        // DB::statement("DROP TYPE IF EXISTS user_role CASCADE"); etc.
    }
};
