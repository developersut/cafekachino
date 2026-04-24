import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkId() {
    const { data, error } = await supabase.from('customers').select('id').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Existing ID Structure:", data[0]);
        console.log("Type of ID:", typeof data[0]?.id);
    }
}

checkId();
