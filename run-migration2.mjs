import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Using the pooler connection string format as typical in newer Supabase instances
const connectionString = 'postgresql://postgres.ihjxbrjtcuyfiuulczlc:q!9*usO6ZQSc!ob^@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Supabase PostgreSQL database.');

        await client.query('DROP TABLE IF EXISTS public.orders CASCADE;');
        console.log('Dropped public.orders table.');

        const scriptPath = path.join(process.cwd(), 'supabase', 'migrations', '02_full_crypto_backend.sql');
        const sql = fs.readFileSync(scriptPath, 'utf8');

        console.log('Running migration script 02_full_crypto_backend.sql...');
        await client.query(sql);

        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await client.end();
        console.log('Disconnected from database.');
    }
}

runMigration();
