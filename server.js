require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Groq – paste your API key in .env as GROQ_API_KEY=gsk_...
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ── Chat endpoint ──────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request: messages array required.' });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1500,
      temperature: 0.7,
      stream: false,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('Groq error:', err.message);

    if (err.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Please add your Groq API key to the .env file.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
    }

    res.status(500).json({ error: err.message });
  }
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StudyBuddy AI server is running.' });
});

// ── Serve frontend ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 StudyBuddy AI running at http://localhost:${PORT}`);
  console.log(`📌 Add your Groq API key to .env file: GROQ_API_KEY=gsk_...`);
});
