import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HfInference } from '@huggingface/inference';

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

// Hugging Face Setup
const hf = new HfInference(process.env.HF_API_KEY);

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    // We expect the frontend to send an array of messages: [{ role: 'user', content: '...' }]
    // We'll use the chatCompletion API if the model supports it, or textGeneration
    
    // Using a reliable model (Llama-3.1-8B-Instruct is highly compatible with Chat Completion API)
    // const model = "meta-llama/Llama-3.1-8B-Instruct";
    const model = "meta-llama/Llama-3.1-8B-Instruct";

    const response = await hf.chatCompletion({
      model: model,
      messages: messages,
      max_tokens: 1500,
    });


    const botResponse = response.choices[0].message.content;
    res.json({ message: botResponse });
  } catch (error) {
    console.error('Full Error from Hugging Face:', error);
    
    // Attempt detailed error message
    const errorMessage = error.httpResponse?.body?.error||  error.message|| 'Unknown error';
    
    res.status(500).json({ 
      error: 'Failed to get response from AI',
      details: errorMessage
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});