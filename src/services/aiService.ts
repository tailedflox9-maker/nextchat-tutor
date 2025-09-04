import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { APISettings, Conversation, StudySession } from '../types';

const defaultSystemPromptEN = `You are a helpful AI tutor. Provide clear, educational responses that help users learn effectively. Use markdown formatting with headings, lists, and code blocks to structure your answers. If the user asks for examples, provide practical examples. If the user asks for explanations, break down complex concepts into simple terms. If the user asks for a quiz, create a quiz question or practice problem based on the topic.`;

const defaultSystemPromptMR = `तुम्ही एक उपयुक्त एआय शिक्षक आहात. वापरकर्त्यांना प्रभावीपणे शिकण्यास मदत करण्यासाठी स्पष्ट, शैक्षणिक प्रतिसाद द्या. आपले उत्तर संरचित करण्यासाठी मार्कडाउन स्वरूपण, शीर्षके, यादी आणि कोड ब्लॉक वापरा. जर वापरकर्त्याने उदाहरणे मागितली, तर व्यावहारिक उदाहरणे द्या. जर वापरकर्त्याने स्पष्टीकरण मागितले, तर जटिल संकल्पना साध्या भाषेत समजावून सांगा. जर वापरकर्त्याने क्विझ मागितली, तर विषयावर आधारित क्विझ प्रश्न किंवा सराव समस्या तयार करा. सर्व प्रतिसाद मराठीत द्या.`;

class AIService {
  private googleAI: GoogleGenerativeAI | null = null;
  private zhipuAI: { apiKey: string } | null = null;
  private settings: APISettings | null = null;
  private language: 'en' | 'mr' = 'en';

  updateSettings(settings: APISettings, language: 'en' | 'mr') {
    this.settings = settings;
    this.language = language;
    this.initializeProviders();
  }

  private initializeProviders() {
    if (!this.settings) return;

    if (this.settings.googleApiKey) {
      try {
        this.googleAI = new GoogleGenerativeAI(this.settings.googleApiKey);
      } catch (error) {
        console.error('Failed to initialize Google AI:', error);
      }
    }

    if (this.settings.zhipuApiKey) {
      try {
        this.zhipuAI = { apiKey: this.settings.zhipuApiKey };
      } catch (error) {
        console.error('Failed to initialize ZhipuAI:', error);
      }
    }
  }

  async *generateStreamingResponse(
    messages: Array<{ role: string; content: string }>,
    language: 'en' | 'mr',
    conversationSystemPrompt?: string,
    onUpdate?: (content: string) => void
  ): AsyncGenerator<string, void, unknown> {
    if (!this.settings) {
      yield language === 'en'
        ? "Please configure your API keys in the settings first."
        : "कृपया प्रथम सेटिंग्जमध्ये आपली API की कॉन्फिगर करा.";
      return;
    }

    const systemPrompt =
      conversationSystemPrompt ||
      (language === 'en' ? defaultSystemPromptEN : defaultSystemPromptMR);

    try {
      if (this.settings.selectedModel === 'google' && this.googleAI) {
        yield* this.generateGoogleResponse(messages, systemPrompt, onUpdate);
      } else if (this.settings.selectedModel === 'zhipu' && this.zhipuAI) {
        yield* this.generateZhipuResponse(messages, systemPrompt, onUpdate);
      } else if (this.settings.selectedModel?.startsWith('mistral-')) {
        const model = this.settings.selectedModel.split('-')[1] as 'small' | 'codestral';
        yield* this.generateMistralResponse(messages, systemPrompt, model, onUpdate);
      } else {
        yield language === 'en'
          ? 'Selected model is not available or API key is missing.'
          : 'निवडलेले मॉडेल उपलब्ध नाही किंवा API की गहाळ आहे.';
      }
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      yield language === 'en'
        ? `I encountered an error: ${errorMessage}. Please check your API key and try again.`
        : `मला त्रुटी आली: ${errorMessage}. कृपया तुमची API की तपासा आणि पुन्हा प्रयत्न करा.`;
    }
  }

  private async *generateGoogleResponse(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string,
    onUpdate?: (content: string) => void
  ): AsyncGenerator<string, void, unknown> {
    if (!this.googleAI) {
      yield this.language === 'en'
        ? 'Google AI is not initialized. Please check your API key.'
        : 'गूगल एआय सुरू झाले नाही. कृपया आपली API की तपासा.';
      return;
    }

    try {
      const model = this.googleAI.getGenerativeModel({
        model: 'gemma-3-27b-it',
      });

      // Merge consecutive same-role messages
      const mergedMessages: Array<{ role: string; content: string }> = [];
      if (messages.length > 0) {
        let currentMessage = { ...messages[0] };
        for (let i = 1; i < messages.length; i++) {
          if (messages[i].role === currentMessage.role) {
            currentMessage.content += `\n\n${messages[i].content}`;
          } else {
            mergedMessages.push(currentMessage);
            currentMessage = { ...messages[i] };
          }
        }
        mergedMessages.push(currentMessage);
      }

      // Prepend system prompt as the first user message
      const contents: Content[] = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...mergedMessages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
      ];

      if (contents.length === 0) return;

      const result = await model.generateContentStream({ contents });
      let fullResponse = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullResponse += chunkText;
          if (onUpdate) onUpdate(fullResponse);
          yield chunkText;
        }
      }

      if (!fullResponse.trim()) {
        yield this.language === 'en'
          ? "I couldn't generate a response. Please try again."
          : 'मी प्रतिसाद तयार करू शकलो नाही. कृपया पुन्हा प्रयत्न करा.';
      }
    } catch (error) {
      console.error('Google AI API Error:', error);
      if (error instanceof Error) {
        yield this.language === 'en'
          ? `Google AI Error: ${error.message}`
          : `गूगल एआय त्रुटी: ${error.message}`;
      } else {
        yield this.language === 'en'
          ? 'Unexpected error with Google AI. Please try again.'
          : 'गूगल एआयसह अनपेक्षित त्रुटी आली. कृपया पुन्हा प्रयत्न करा.';
      }
    }
  }

  private async *generateZhipuResponse(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string,
    onUpdate?: (content: string) => void
  ): AsyncGenerator<string, void, unknown> {
    if (!this.zhipuAI?.apiKey) {
      yield this.language === 'en'
        ? 'ZhipuAI is not properly configured.'
        : 'झिपूएआय योग्यरित्या कॉन्फिगर केलेले नाही.';
      return;
    }

    const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.zhipuAI.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4.5-flash',
          messages: apiMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield this.language === 'en'
          ? `ZhipuAI API Error: ${response.status} ${response.statusText}. ${errorText}`
          : `झिपूएआय API त्रुटी: ${response.status} ${response.statusText}. ${errorText}`;
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield this.language === 'en'
          ? 'Error: Unable to read response stream'
          : 'त्रुटी: प्रतिसाद प्रवाह वाचण्यात अक्षम';
        return;
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') return;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  if (onUpdate) onUpdate(fullResponse);
                  yield content;
                }
              } catch (e) {
                console.warn('Failed to parse JSON:', data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!fullResponse.trim()) {
        yield this.language === 'en'
          ? 'No response received from ZhipuAI. Please try again.'
          : 'झिपूएआय कडून कोणताही प्रतिसाद मिळाला नाही. कृपया पुन्हा प्रयत्न करा.';
      }
    } catch (error) {
      console.error('ZhipuAI Error:', error);
      yield this.language === 'en'
        ? `ZhipuAI Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `झिपूएआय त्रुटी: ${error instanceof Error ? error.message : 'अज्ञात त्रुटी'}`;
    }
  }

  private async *generateMistralResponse(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string,
    model: 'small' | 'codestral',
    onUpdate?: (content: string) => void
  ): AsyncGenerator<string, void, unknown> {
    if (!this.settings?.mistralApiKey) {
      yield this.language === 'en'
        ? 'Mistral AI is not properly configured.'
        : 'मिस्ट्रल एआय योग्यरित्या कॉन्फिगर केलेले नाही.';
      return;
    }

    const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.settings.mistralApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model === 'small' ? 'mistral-small-latest' : 'codestral-latest',
          messages: apiMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield this.language === 'en'
          ? `Mistral API Error: ${response.status} ${response.statusText}. ${errorText}`
          : `मिस्ट्रल API त्रुटी: ${response.status} ${response.statusText}. ${errorText}`;
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield this.language === 'en'
          ? 'Error: Unable to read response stream'
          : 'त्रुटी: प्रतिसाद प्रवाह वाचण्यात अक्षम';
        return;
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') return;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  if (onUpdate) onUpdate(fullResponse);
                  yield content;
                }
              } catch (e) {
                console.warn('Failed to parse JSON:', data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!fullResponse.trim()) {
        yield this.language === 'en'
          ? 'No response received from Mistral. Please try again.'
          : 'मिस्ट्रलकडून कोणताही प्रतिसाद मिळाला नाही. कृपया पुन्हा प्रयत्न करा.';
      }
    } catch (error) {
      console.error('Mistral Error:', error);
      yield this.language === 'en'
        ? `Mistral Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `मिस्ट्रल त्रुटी: ${error instanceof Error ? error.message : 'अज्ञात त्रुटी'}`;
    }
  }

  async enhancePrompt(prompt: string): Promise<string> {
    const metaPrompt = `Enhance this AI persona prompt to make it more effective and engaging. Keep the core intent but add specificity. Make it concise and avoid markdown formatting. Return only the enhanced prompt without any explanations:"${prompt}"`;

    if (this.settings?.mistralApiKey) {
      try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.settings.mistralApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: metaPrompt }],
            temperature: 0.5,
          }),
        });

        if (!response.ok) throw new Error(`Mistral API error: ${response.statusText}`);
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('Mistral enhancement failed, falling back to Google:', error);
      }
    }

    if (this.googleAI) {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      const result = await model.generateContent(metaPrompt);
      return result.response.text();
    }

    throw new Error(
      'No API key available to enhance prompt. Please configure a Mistral or Google API key.'
    );
  }

  async generateQuiz(conversation: Conversation): Promise<StudySession> {
    if (!this.googleAI) {
      throw new Error(
        'Google AI service not initialized. A Google API key is required to generate quizzes.'
      );
    }

    const model = this.googleAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const conversationText = conversation.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    const prompt = `
      Based on the following conversation, create a multiple-choice quiz with 5 questions to test understanding of the key topics.
      The questions should be relevant to the main subjects discussed. For each question, provide 4 options and indicate the correct answer. Also, provide a brief explanation for why the answer is correct.
      Return the response as a valid JSON object only. Do not include any other text or markdown formatting.
      The JSON object should have a single key "questions", which is an array of objects.
      Each object in the array should have the following keys: "id", "question", "options", "answer", "explanation".
      The "id" should be a unique string.
      The "options" should be an array of 4 strings.
      The "answer" should be one of the strings from the "options" array.

      Example format:
      {
        "questions": [
          {
            "id": "q1",
            "question": "What is the capital of France?",
            "options": ["Berlin", "Madrid", "Paris", "Rome"],
            "answer": "Paris",
            "explanation": "Paris has been the capital of France since the 10th century."
          }
        ]
      }
      Here is the conversation content:
      ---
      ${conversationText}
      ---
    `;

    try {
      const result = await model.generateContent(prompt);
      const rawJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(rawJson);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('AI returned invalid quiz format.');
      }

      const studySession: StudySession = {
        id: `quiz-${conversation.id}`,
        conversationId: conversation.id,
        type: 'quiz',
        questions: parsed.questions,
        createdAt: new Date(),
      };

      return studySession;
    } catch (error) {
      console.error("Error generating or parsing quiz:", error);
      throw new Error("Failed to generate a valid quiz. The AI's response might have been malformed.");
    }
  }
}

export const aiService = new AIService();
