import { APISettings, Conversation, StudySession, QuizQuestion } from '../types';
import { generateId } from '../utils/helpers';

const TUTOR_SYSTEM_PROMPT = `You are an expert AI Tutor named 'Tutor'. Your primary goal is to help users understand complex topics through clear, patient, and encouraging guidance. Follow these principles strictly:
1.  **Socratic Method:** Do not just provide direct answers. Instead, ask guiding questions to help the user arrive at the solution themselves. Probe their understanding and encourage them to think critically.
2.  **Simplify Concepts:** Break down complex subjects into smaller, digestible parts. Use simple language, analogies, and real-world examples to make concepts relatable.
3.  **Encouraging Tone:** Maintain a positive, patient, and supportive tone at all times. Praise the user for their curiosity and effort.
4.  **Clear Explanations:** When you must provide an explanation or a code example, ensure it is thoroughly commented and explained step-by-step.
5.  **Stay Focused:** Politely steer the conversation back to the educational topic if the user strays. Decline requests that are inappropriate or unrelated to learning.`;

// Helper function to handle streaming for OpenAI-compatible APIs (like Mistral and Zhipu)
async function* streamOpenAICompatResponse(url: string, apiKey: string, model: string, messages: { role: string; content: string }[]): AsyncGenerator<string> {
  // Add the system prompt to the beginning of the message list
  const messagesWithSystemPrompt = [
    { role: 'system', content: TUTOR_SYSTEM_PROMPT },
    ...messages,
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: messagesWithSystemPrompt,
      stream: true,
    }),
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
        if (data.trim() === '[DONE]') {
          return;
        }
        try {
          const json = JSON.parse(data);
          const chunk = json.choices?.[0]?.delta?.content;
          if (chunk) {
            yield chunk;
          }
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
  };

  public updateSettings(newSettings: APISettings) {
    this.settings = newSettings;
  }

  public async *generateStreamingResponse(messages: { role: string; content: string }[]): AsyncGenerator<string> {
    const userMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    switch (this.settings.selectedModel) {
      case 'google':
        if (!this.settings.googleApiKey) throw new Error('Google API key not set');
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:streamGenerateContent?key=${this.settings.googleApiKey}&alt=sse`;
        const googleMessages = userMessages.map(m => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.content }],
        }));

        const response = await fetch(googleUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Gemini API uses a specific 'system_instruction' field
          body: JSON.stringify({
            contents: googleMessages,
            system_instruction: {
              parts: [{ text: TUTOR_SYSTEM_PROMPT }]
            }
          }),
        });

        if (!response.ok || !response.body) {
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
              try {
                const json = JSON.parse(line.substring(6));
                const chunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (chunk) {
                  yield chunk;
                }
              } catch (e) {
                console.error('Error parsing stream chunk:', e);
              }
            }
          }
        }
        break;

      case 'zhipu':
        if (!this.settings.zhipuApiKey) throw new Error('ZhipuAI API key not set');
        yield* streamOpenAICompatResponse('https://open.bigmodel.cn/api/paas/v4/chat/completions', this.settings.zhipuApiKey, 'glm-4.5-flash', userMessages);
        break;

      case 'mistral-small':
        if (!this.settings.mistralApiKey) throw new Error('Mistral API key not set');
        yield* streamOpenAICompatResponse('https://api.mistral.ai/v1/chat/completions', this.settings.mistralApiKey, 'mistral-small-latest', userMessages);
        break;

      case 'mistral-codestral':
        if (!this.settings.mistralApiKey) throw new Error('Mistral API key not set for Codestral');
        yield* streamOpenAICompatResponse('https://api.mistral.ai/v1/chat/completions', this.settings.mistralApiKey, 'codestral-latest', userMessages);
        break;

      default:
        throw new Error('Invalid model selected or API key not set for the selected model.');
    }
  }

  public async generateQuiz(conversation: Conversation): Promise<StudySession> {
    if (!this.settings.googleApiKey) {
      throw new Error('Google API key must be configured to generate quizzes.');
    }

    const conversationText = conversation.messages
      .map(m => `${m.role === 'user' ? 'Q:' : 'A:'} ${m.content}`)
      .join('\n\n');

    const prompt = `Based on the following conversation, create a multiple-choice quiz with 5 questions to test understanding.
    
    Conversation:
    ---
    ${conversationText.slice(0, 6000)}
    ---
    
    Format the output as a single JSON object with a "questions" array. Each question object must have:
    - "question": The question text (string).
    - "options": An array of 4 possible answer strings.
    - "answer": The correct answer string, which must be one of the options.
    - "explanation": A brief explanation for the correct answer (string).
    
    Do not include any other text or markdown formatting outside of the JSON object.
    Example:
    {
      "questions": [
        {
          "question": "What is the capital of France?",
          "options": ["Berlin", "Madrid", "Paris", "Rome"],
          "answer": "Paris",
          "explanation": "Paris is the capital and most populous city of France."
        }
      ]
    }`;
    
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

    if (!textResponse) {
        throw new Error('Invalid response from API when generating quiz.');
    }
    
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
