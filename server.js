import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// OpenAI / Hugging Face Router Setup
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set headers for streaming (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const requestedModel = "Qwen/Qwen3.5-9B";
    const systemPrompt = `
You are a senior AI coding assistant.
Target User:
The AI Code Chatbot is designed to cater to the following groups:
Software Developers: Professionals looking for a quick AI assistant to assist with code refactoring or debugging.
Computer Science Students: Learners seeking clear explanations for programming concepts and coding patterns.
Tech Hobbyists: Enthusiasts building personal projects who want to experiment with AI integration in their applications.

Instruction:
Please provide complete, production-quality, and fully functional code solutions. 
Do not use placeholders. 
Ensure the output is well-formatted and easy to read.
If generating a web UI, return a single HTML file with integrated CSS and JS.
`;

    const systemMessage = {
      role: 'system',
      content: systemPrompt
    };

    const stream = await client.chat.completions.create({
      model: requestedModel,
      messages: [systemMessage, ...messages],
      stream: true,
      max_tokens: 16384,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        // Express will chunk this automatically if we use write()
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Full Error from OpenAI/HF Router:', error);
    
    const errorMessage = error.message || 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: 'Failed to get response from AI', details: errorMessage })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});