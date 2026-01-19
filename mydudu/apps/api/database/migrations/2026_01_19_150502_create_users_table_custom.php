<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Ensure users table if created by default migration is dropped or we use createIfExists
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions'); // Laravel default sessions table

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('full_name', 100);
            $table->string('email', 100)->unique();
            $table->string('password_hash', 255);
            // We use a raw column definition to use the native enum type
            // Note: In testing/SQLite this might fail. We assume Postgres.
            $table->foreignId('posyandu_id')->nullable()->constrained('posyandus')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('last_login')->nullable();
        });

        // Add the enum column using raw SQL
        DB::statement("ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'PARENT'");

        // Add index on role
        DB::statement("CREATE INDEX idx_users_role ON users(role)");
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
