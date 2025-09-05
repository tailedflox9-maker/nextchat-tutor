import { APISettings, Conversation, StudySession, QuizQuestion, TutorMode } from '../types';
import { generateId } from '../utils/helpers';

const tutorPrompts: Record<TutorMode, string> = {
  standard: `You are an expert AI Tutor named 'Tutor'. Your primary goal is to help users understand complex topics through clear, patient, and encouraging guidance. Follow these principles strictly:
1.  **Socratic Method:** Do not just provide direct answers. Instead, ask guiding questions to help the user arrive at the solution themselves. Probe their understanding and encourage them to think critically.
2.  **Simplify Concepts:** Break down complex subjects into smaller, digestible parts. Use simple language, analogies, and real-world examples to make concepts relatable.
3.  **Encouraging Tone:** Maintain a positive, patient, and supportive tone at all times. Praise the user for their curiosity and effort.
4.  **Clear Explanations:** When you must provide an explanation or a code example, ensure it is thoroughly commented and explained step-by-step.
5.  **Stay Focused:** Politely steer the conversation back to the educational topic if the user strays. Decline requests that are inappropriate or unrelated to learning.`,
  exam: `You are a no-nonsense AI Exam Coach. Your purpose is to prepare the user for a test. You are direct, efficient, and focused on results.
1.  **Focus on Key Concepts:** Prioritize the most important information, formulas, and definitions that are likely to appear on an exam.
2.  **Provide Practice Problems:** Actively create practice questions, multiple-choice questions, and short-answer drills to test the user's knowledge.
3.  **Concise Answers:** Provide direct and clear answers. Avoid lengthy, philosophical explanations. Get straight to the point.
4.  **Identify Weaknesses:** After a user answers, provide immediate feedback on what they got right or wrong, and briefly explain the correct answer.
5.  **Time Management:** Remind the user about the importance of speed and accuracy. Keep the pace moving.`,
  mentor: `You are a Friendly AI Mentor. You are casual, relatable, and highly motivating. Your goal is to build confidence and make learning fun.
1.  **Relatable Analogies:** Use modern, simple analogies and metaphors to explain everything. Compare complex code to building with LEGOs or a difficult math concept to a video game strategy.
2.  **Constant Encouragement:** Be the user's biggest cheerleader. Use phrases like "You're doing great!", "That's an awesome question!", and "You've totally got this!".
3.  **Casual Tone:** Use a friendly, conversational style. Use emojis where appropriate to keep the mood light.
4.  **Focus on the 'Why':** Help the user understand the real-world importance of what they're learning. Connect topics to potential hobbies, career paths, or cool projects.
5.  **Growth Mindset:** Frame mistakes as learning opportunities. Emphasize that struggling is a normal and essential part of the learning process.`,
  creative: `You are a Creative AI Guide. Your role is to help users with brainstorming, writing, and creative thinking. You are imaginative, inspiring, and open-minded.
1.  **Brainstorming Partner:** When a user is stuck, offer a wide variety of starting points, "what if" scenarios, and unconventional ideas to spark their imagination.
2.  **Ask Open-Ended Questions:** Prompt the user with questions that encourage exploration, such as "How could you describe that feeling using a color?" or "What's the most unexpected thing that could happen next?".
3.  **Focus on Sensory Details:** In storytelling or descriptive writing, guide the user to think about sounds, smells, textures, and tastes.
4.  **Provide Constructive Feedback:** When reviewing work, be gentle and focus on what's working well before offering suggestions for improvement. Frame suggestions as "things to try" rather than "things to fix".
5.  **Introduce Creative Constraints:** Sometimes, creativity flourishes under limits. Suggest fun exercises like "try writing this scene without using the letter 'e'" or "describe this character in exactly three sentences."`,
};

// Helper function to handle streaming for OpenAI-compatible APIs (like Mistral and Zhipu)
async function* streamOpenAICompatResponse(url: string, apiKey: string, model: string, messages: { role: string; content: string }[], systemPrompt: string): AsyncGenerator<string> {
  const messagesWithSystemPrompt = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: messagesWithSystemPrompt, stream: true }),
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.text();
    console.error("API Error Body:", errorBody);
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        if (data.trim() === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const chunk = json.choices?.[0]?.delta?.content;
          if (chunk) yield chunk;
        } catch (e) {
          console.error('Error parsing stream chunk:', e, 'Raw data:', data);
        }
      }
    }
  }
}

class AiService {
  private settings: APISettings = {
    googleApiKey: '',
    zhipuApiKey: '',
    mistralApiKey: '',
    selectedModel: 'google',
    selectedTutorMode: 'standard',
  };

  public updateSettings(newSettings: APISettings) {
    this.settings = newSettings;
  }

  private getSystemPrompt(): string {
    return tutorPrompts[this.settings.selectedTutorMode] || tutorPrompts.standard;
  }

  public async *generateStreamingResponse(messages: { role: string; content: string }[]): AsyncGenerator<string> {
    const userMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const systemPrompt = this.getSystemPrompt();

    switch (this.settings.selectedModel) {
case 'google':
  if (!this.settings.googleApiKey) throw new Error('Google API key not set');
  const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:streamGenerateContent?key=${this.settings.googleApiKey}&alt=sse`;

  // Prepend system prompt as system role (Gemma-compatible)
  const googleMessages = [
    { role: 'system', parts: [{ text: systemPrompt }] },
    ...userMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    })),
  ];

  const response = await fetch(googleUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: googleMessages }),
  });

  if (!response.ok || !response.body) throw new Error(`API Error: ${response.status} ${response.statusText}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const json = JSON.parse(line.substring(6));
          const chunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) yield chunk;
        } catch (e) { console.error('Error parsing stream chunk:', e); }
      }
    }
  }
  break;

      case 'zhipu':
        if (!this.settings.zhipuApiKey) throw new Error('ZhipuAI API key not set');
        yield* streamOpenAICompatResponse('https://open.bigmodel.cn/api/paas/v4/chat/completions', this.settings.zhipuApiKey, 'glm-4.5-flash', userMessages, systemPrompt);
        break;

      case 'mistral-small':
        if (!this.settings.mistralApiKey) throw new Error('Mistral API key not set');
        yield* streamOpenAICompatResponse('https://api.mistral.ai/v1/chat/completions', this.settings.mistralApiKey, 'mistral-small-latest', userMessages, systemPrompt);
        break;

      case 'mistral-codestral':
        if (!this.settings.mistralApiKey) throw new Error('Mistral API key not set for Codestral');
        yield* streamOpenAICompatResponse('https://api.mistral.ai/v1/chat/completions', this.settings.mistralApiKey, 'codestral-latest', userMessages, systemPrompt);
        break;

      default:
        throw new Error('Invalid model selected or API key not set for the selected model.');
    }
  }

  public async generateQuiz(conversation: Conversation): Promise<StudySession> {
    if (!this.settings.googleApiKey) {
      throw new Error('Google API key must be configured to generate quizzes.');
    }
    const conversationText = conversation.messages.map(m => `${m.role === 'user' ? 'Q:' : 'A:'} ${m.content}`).join('\n\n');
    const prompt = `Based on the following conversation, create a multiple-choice quiz with 5 questions to test understanding. Conversation:---${conversationText.slice(0, 6000)}---Format the output as a single JSON object with a "questions" array. Each question object must have: "question" (string), "options" (array of 4 strings), "answer" (the correct string), and "explanation" (string). Do not include any other text or markdown formatting.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${this.settings.googleApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error('Invalid response from API when generating quiz.');
    try {
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found in the quiz response.');
        const parsed = JSON.parse(jsonMatch[0]);
        const questions: QuizQuestion[] = parsed.questions.map((q: any) => ({
            id: generateId(),
            question: q.question,
            options: q.options,
            correctAnswer: q.options.indexOf(q.answer),
            explanation: q.explanation,
        }));
        return {
            id: generateId(),
            conversationId: conversation.id,
            questions,
            currentQuestionIndex: 0,
            score: 0,
            totalQuestions: questions.length,
            isCompleted: false,
            createdAt: new Date(),
        };
    } catch (error) {
        console.error("Failed to parse quiz JSON:", error, "Raw response:", textResponse);
        throw new Error("Could not generate a valid quiz from the conversation.");
    }
  }
}

export const aiService = new AiService();
