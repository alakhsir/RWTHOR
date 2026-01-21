require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Helper to ensure URL and KEY are present
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error("Missing ENV vars");
    process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
    console.log("STARTING TEST INSERT...");

    // 1. Get a chapter ID to use
    const { data: chapters, error: chErr } = await supabase.from('chapters').select('id').limit(1);
    if (chErr || !chapters.length) {
        console.error("Cannot test insert: No chapters found or error", chErr);
        return;
    }
    const chapterId = chapters[0].id;
    console.log("Using Chapter ID:", chapterId);

    // 2. Try INSERT with quiz_data
    const testPayload = {
        title: "DEBUG TEST QUIZ " + Date.now(),
        type: "QUIZ",
        chapter_id: chapterId,
        questions_count: 1,
        marks: 10,
        quiz_data: [
            { id: "1", text: "Test Q", options: ["A", "B"], correctOptionIndex: 0 }
        ]
    };

    const { data, error } = await supabase.from('content').insert([testPayload]).select().single();

    if (error) {
        console.error("INSERT FAILED:", error.message);
        if (error.message.includes("quiz_data")) {
            console.log("CONFIRMED: Issue is with quiz_data column.");
        }
    } else {
        console.log("INSERT SUCCESS:", data);
        if (data.quiz_data && Array.isArray(data.quiz_data) && data.quiz_data.length > 0) {
            console.log("VERIFICATION PASSED: quiz_data was saved and returned.");

            // Cleanup
            await supabase.from('content').delete().eq('id', data.id);
            console.log("Cleanup done.");
        } else {
            console.log("VERIFICATION FAILED: Insert success, but quiz_data is empty/null in return:", data.quiz_data);
        }
    }
}

testInsert();
