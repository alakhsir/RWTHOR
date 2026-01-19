const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking Batches...");
    const { data: batches, error: bErr } = await supabase.from('batches').select('id, title');
    if (bErr) console.error("Batch Err:", bErr);
    else console.log("Batches found:", batches.length);

    if (batches.length > 0) {
        const batchId = batches[batches.length - 1].id; // Check last batch
        console.log(`Checking subjects for batch: ${batches[batches.length - 1].title} (${batchId})`);

        // Check raw link table
        const { data: links, error: lErr } = await supabase.from('batch_subjects').select('*').eq('batch_id', batchId);
        console.log("Raw Links in batch_subjects:", links);

        if (lErr) console.log("Link Error:", lErr);

        // Check Join Query (The one used in api.ts)
        const { data: joinData, error: jErr } = await supabase
            .from('batch_subjects')
            .select(`
                subject_id,
                master_subjects (
                    id,
                    name,
                    icon
                )
            `)
            .eq('batch_id', batchId);

        if (jErr) {
            console.error("Join Query Error:", jErr);
        } else {
            console.log("Join Query Result:", JSON.stringify(joinData, null, 2));
        }
    }
}

check();
