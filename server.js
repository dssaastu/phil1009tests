// Load environment variables locally if using dotenv
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Import necessary libraries
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- Supabase Configuration ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use SERVICE_KEY for backend writes

if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL ERROR: Supabase URL or Key not found...");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Express App Setup ---
const app = express();
const PORT = process.env.env || 3000;

// --- Middleware ---
// 1. Middleware to parse JSON request bodies
app.use(express.json());

// 2. Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---

// Endpoint to handle quiz submissions
app.post('/submit-quiz', async (req, res) => {
    console.log("Received submission data:", req.body);
    // *** MODIFIED: Destructure the new fields: quizChapter and course_chapter_formatted ***
    const { name, id_number, section, email, phone, score, totalQuestions, quizChapter, course_chapter_formatted } = req.body;

    // *** MODIFIED: Add validation for the new fields ***
    if (!name || !id_number || !section || !email || !phone || score === undefined || totalQuestions === undefined || quizChapter === undefined || !course_chapter_formatted) {
        console.error("Validation Error: Missing required fields in submission.", { name, id_number, section, email, phone, score, totalQuestions, quizChapter, course_chapter_formatted });
        return res.status(400).json({ success: false, error: "Missing required fields. Ensure name, id_number, section, email, phone, score, totalQuestions, quizChapter, and course_chapter_formatted are provided." });
    }

    // Optional: Basic type check for quizChapter (it should be a number for the int4 column)
    if (typeof quizChapter !== 'number' || !Number.isInteger(quizChapter)) {
         console.error("Validation Error: quizChapter is not a valid integer number.", { quizChapter });
         // Decide if you want to send an error or just log a warning; sending an error is safer
         // return res.status(400).json({ success: false, error: "quizChapter must be an integer number." });
    }

    // Optional: Basic type check for the formatted string
     if (typeof course_chapter_formatted !== 'string' || course_chapter_formatted.trim() === '') {
         console.error("Validation Error: course_chapter_formatted is not a valid string.", { course_chapter_formatted });
          // Decide if you want to send an error or just log a warning; sending an error is safer
         // return res.status(400).json({ success: false, error: "course_chapter_formatted must be a non-empty string." });
     }


    try {
        console.log(`Inserting quiz results for ${course_chapter_formatted} into database table 'submissions'`); // Log the formatted string
        const { data: insertData, error: insertError } = await supabase
            .from('submissions')
            .insert([ {
                    visitor_name: name,
                    visitor_id: id_number,
                    visitor_class: section,
                    visitor_phone: phone,
                    visitor_email: email,
                    score: score,
                    total_questions: totalQuestions,
                    // *** MODIFIED: Insert the quiz_chapter field ***
                    quiz_chapter: quizChapter,
                    // *** MODIFIED: Insert the new formatted field into the new column ***
                    course_chapter_formatted: course_chapter_formatted,
                } ])
            .select(); // .select() returns the inserted row(s)

        if (insertError) {
            console.error("Supabase insert error details:", insertError);
            throw new Error(`Supabase Database Error: ${insertError.message}`);
        }
        console.log("...Database insertion successful:", insertData);
        res.status(200).json({ success: true, message: "Submission saved successfully.", data: insertData });

    } catch (error) {
        console.error('Error during submission process:', error.message);
        res.status(500).json({ success: false, error: `Server error saving submission: ${error.message}` });
    }
}); // End of app.post '/submit-quiz' route

// --- Basic Error Handler Middleware (REMAINS THE SAME) ---
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack);
    res.status(500).json({ success: false, error: 'Something broke on the server!' });
});

// --- Start the Server (REMAINS THE SAME) ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`API endpoint ready at POST /submit-quiz`);
  console.log(`Supabase URL loaded: ${supabaseUrl ? 'Yes' : 'NO!'}`);
  console.log(`Supabase Key loaded: ${supabaseKey ? 'Yes' : 'NO!'}`);
});
