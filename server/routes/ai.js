const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const router = express.Router();
const Task = require('../models/Task'); // Ensure you have the correct path to your Task model

require('dotenv').config();

router.post('/test',async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "A valid prompt is required in the request body." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({ response: responseText });
  } catch (err) {
    console.error("AI Response Generation Error:", err);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message 
    });
  }
});

router.post('/summarise', auth, async (req, res) => {
  console.log("AI route hit!");
  console.log('Request body:', req.body);
  
  try {
    const genAI = new GoogleGenerativeAI( process.env.GEMINI_API_KEY ); // Correct instantiation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Build prompt from user's tasks
    console.log(req);
    const tasks = await Task.find({ user: req.user._id });
    const prompt = `Summarize this todo activity: ${tasks.map(t => t.name).join(', ')}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ summary: text }); // Only ONE response
  } catch (err) {
    console.error("AI Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate summary" });
    }
  }
});


module.exports = router;  // <-- THIS IS CRUCIAL!
