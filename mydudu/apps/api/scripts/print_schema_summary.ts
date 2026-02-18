import * as fs from 'fs';
import * as path from 'path';

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

try {
    console.log(`Reading schema from: ${schemaPath}\n`);
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const lines = schema.split('\n');
    let currentModel = null;

    console.log('=== DATABASE SCHEMA SUMMARY ===\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Start of model
        if (trimmed.startsWith('model ')) {
            const parts = trimmed.split(' ');
            if (parts.length >= 2) {
                currentModel = parts[1];
                console.log(`TABLE: ${currentModel}`);
                console.log('----------------------------------------');
            }
        }
        // End of block
        else if (trimmed === '}') {
            if (currentModel) {
                console.log(''); // Empty line after table
                currentModel = null;
            }
        }
        // Field definition (basic heuristic: starts with word, has type, not a comment, not a block attribute)
        else if (currentModel && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('@@')) {
            // Basic split by whitespace to get name and type
            // e.g. "id Int @id" -> ["id", "Int", "@id"]
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2) {
                const name = parts[0];
                const type = parts[1];
                // Just print name and type for clarity
                console.log(`  ${name.padEnd(20)} | ${type}`);
            }
        }
    }
} catch (err) {
    console.error('Could not read or parse schema:', err);
}
