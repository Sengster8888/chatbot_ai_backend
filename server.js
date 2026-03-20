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
    const model = "Qwen/Qwen2.5-Coder-7B-Instruct";
    
    // Detailed Expert UI/UX Prompt
    const userInput = messages[messages.length - 1].content;
    const prompt = `
Act as a senior front-end developer and UI/UX designer.

Create a modern, high-converting landing page for a premium AI tool called "Aura".

### User Request:
"${userInput}"

### Design Requirements:
- Use a clean, minimal, and visually impressive design suitable for a SaaS product
- Apply consistent spacing with at least 2rem vertical whitespace between all sections
- Use the "Inter" font family throughout the page
- Primary color theme: Indigo-600 accents with subtle gradients
- Add soft shadows and smooth hover transitions for interactive elements
- Ensure the layout is fully responsive (mobile, tablet, desktop)

### Layout Structure:
1. **Navigation Bar**:
   - Fixed at the top with glassmorphism effect (blur + transparency)
   - Include logo (Aura), links (Features, Pricing, About), and CTA button ("Start Free Trial")
2. **Hero Section**:
   - Large gradient heading introducing Aura
   - Short, compelling subheading
   - Primary CTA button: "Start Free Trial"
   - Optional secondary CTA: "Watch Demo"
   - Include subtle background gradient or abstract shapes
3. **Features Section**:
   - Three-column responsive grid layout
   - Each feature card includes: Icon, Title (Speed, Privacy, Global Search), and Short description
   - Apply soft shadows, rounded corners, and hover effects
4. **Optional Sections**:
   - Testimonials/Social proof, Pricing preview, Footer with links/copyright

### Technical Requirements:
- Use semantic HTML5 (header, main, section, footer)
- Use modern CSS (Flexbox/Grid)
- Mandatory Base CSS Reset:
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; line-height: 1.6; }
  .section { padding: 4rem 2rem; }
- Keep JavaScript minimal
- Clean, readable, and well-structured code

### Output:
- Return ONLY the complete HTML code (single file).
- Ensure code is production-ready and easy to customize.
`;

    const systemMessage = {
      role: 'system',
      content: prompt
    };

    const response = await hf.chatCompletion({
      model: model,
      messages: [systemMessage, ...messages],
      max_tokens: 2500,
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