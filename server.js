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
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL ERROR: Supabase URL or Key not found...");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Express App Setup ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// 1. Middleware to parse JSON request bodies (Needed for /submit-quiz)
app.use(express.json());

// 2. *** ADD THIS: Serve static files from the 'public' directory ***
// This tells Express to look in the 'public' folder for requested files
// like /chap2.html, /chap3.html, etc.
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---

// *** REMOVE or COMMENT OUT the specific app.get('/') route ***
// We no longer need this because express.static handles serving files from 'public'
/*
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Or whatever single file it was serving
});
*/

// *** Endpoint to handle quiz submissions (REMAINS THE SAME) ***
app.post('/submit-quiz', async (req, res) => {
    console.log("Received submission data:", req.body);
    const { name, id_number, section, email, phone, score, totalQuestions } = req.body;

    if (!name || !id_number || !section || !email || !phone || score === undefined || totalQuestions === undefined) {
        console.error("Validation Error: Missing required fields in submission.");
        return res.status(400).json({ success: false, error: "Missing required fields." });
    }

    try {
        console.log("Inserting quiz results into database table 'submissions'...");
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
                } ])
            .select();

        if (insertError) {
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
  console.log(`Serving static files from: ${path.join(__dirname, 'public')}`); // Log static path
  console.log(`API endpoint ready at POST /submit-quiz`);
  console.log(`Supabase URL loaded: ${supabaseUrl ? 'Yes' : 'NO!'}`);
  console.log(`Supabase Key loaded: ${supabaseKey ? 'Yes' : 'NO!'}`);
});