import { APISettings, Conversation, Message, StudySession, QuizQuestion } from '../types';
import { generateId } from '../utils/helpers';

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

  private async getApiKeyAndUrl(): Promise<{ apiKey: string, url: string, modelName: string }> {
    switch (this.settings.selectedModel) {
      case 'google':
      case 'mistral-codestral': // Assuming codestral also uses google's endpoint for simplicity here
        if (!this.settings.googleApiKey) throw new Error('Google API key not set');
        return {
          apiKey: this.settings.googleApiKey,
          url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${this.settings.googleApiKey}&alt=sse`,
          modelName: 'gemini-1.5-flash'
        };
      // In a real app, you would add cases for Zhipu and Mistral with their respective URLs and auth
      default:
        if (!this.settings.googleApiKey) throw new Error('Google API key not set');
        return {
          apiKey: this.settings.googleApiKey,
          url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${this.settings.googleApiKey}&alt=sse`,
          modelName: 'gemini-1.5-flash'
        };
    }
  }

  public async *generateStreamingResponse(messages: { role: string; content: string }[]): AsyncGenerator<string> {
    const { url } = await this.getApiKeyAndUrl();
    const formattedMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: formattedMessages }),
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
    ${conversationText.slice(0, 4000)}
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.settings.googleApiKey}`, {
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
