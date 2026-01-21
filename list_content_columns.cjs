require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error("Missing ENV vars");
    process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listColumns() {
    console.log("Fetching columns for 'content' table...");

    // Method 1: Select one row and look at keys (if rows exist)
    const { data: rows, error } = await supabase.from('content').select('*').limit(1);

    if (error) {
        console.error("Error fetching row:", error.message);
    } else if (rows.length > 0) {
        console.log("--- Existing Columns (from row data) ---");
        console.log(Object.keys(rows[0]));
        if (Object.keys(rows[0]).includes('quiz_data')) {
            console.log("✅ 'quiz_data' column FOUND in row keys.");
        } else {
            console.log("❌ 'quiz_data' column MISSING from row keys.");
        }
    } else {
        console.log("Table is empty, cannot verify columns via select *");
    }

    // Method 2: RPC call to examine schema (if permissions allow) - usually restricted on anon
    // So we rely on Method 1 mostly for anon keys. 
    // But we can try detailed error message from a bad insert.

    if (!rows || rows.length === 0) {
        console.log("Attempting strict insert verify...");
        const { error: insertError } = await supabase.from('content').insert([{ title: "Temp", type: "CHK", quiz_data: [] }]);
        if (insertError) {
            console.log("Insert Test Result:", insertError.message);
        }
    }
}

listColumns();
