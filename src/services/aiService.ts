import { GoogleGenerativeAI } from '@google/generative-ai';
import { APISettings } from '../types';

interface MessageForAPI {
  role: 'user' | 'assistant';
  content: string;
}

class AIService {
  private googleAI: GoogleGenerativeAI | null = null;
  private settings: APISettings = {
    googleApiKey: '',
    zhipuApiKey: '',
    mistralApiKey: '',
    selectedModel: 'google',
  };
  private selectedLanguage: 'en' | 'mr' = 'en';

  updateSettings(settings: APISettings, language: 'en' | 'mr') {
    this.settings = settings;
    this.selectedLanguage = language;
    
    if (settings.googleApiKey) {
      this.googleAI = new GoogleGenerativeAI(settings.googleApiKey);
    }
  }

  async *generateStreamingResponse(
    messages: MessageForAPI[],
    language: 'en' | 'mr' = 'en',
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const model = this.settings.selectedModel;
    
    try {
      switch (model) {
        case 'google':
          yield* this.generateGoogleResponse(messages, language, systemPrompt);
          break;
        case 'zhipu':
          yield* this.generateZhipuResponse(messages, language, systemPrompt);
          break;
        case 'mistral-small':
        case 'mistral-codestral':
          yield* this.generateMistralResponse(messages, language, systemPrompt, model);
          break;
        default:
          throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error) {
      console.error(`Error with ${model}:`, error);
      throw error;
    }
  }

  private async *generateGoogleResponse(
    messages: MessageForAPI[],
    language: 'en' | 'mr',
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    if (!this.googleAI) {
      throw new Error('Google AI not initialized. Please check your API key.');
    }

    try {
      const model = this.googleAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt || this.getDefaultSystemPrompt(language)
      });

      // Convert messages to Google's format
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const lastMessage = messages[messages.length - 1];
      
      const chat = model.startChat({
        history: history,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });

      const result = await chat.sendMessageStream(lastMessage.content);
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      console.error('Google AI Error:', error);
      throw new Error(`Google AI Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async *generateZhipuResponse(
    messages: MessageForAPI[],
    language: 'en' | 'mr',
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    if (!this.settings.zhipuApiKey) {
      throw new Error('ZhipuAI API key not configured');
    }

    try {
      // Prepare messages with system prompt
      const systemMessage = {
        role: 'system' as const,
        content: systemPrompt || this.getDefaultSystemPrompt(language)
      };

      const requestMessages = [systemMessage, ...messages];

      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.zhipuApiKey}`
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: requestMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ZhipuAI API Error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

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
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('ZhipuAI Error:', error);
      throw new Error(`ZhipuAI Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async *generateMistralResponse(
    messages: MessageForAPI[],
    language: 'en' | 'mr',
    systemPrompt?: string,
    model: 'mistral-small' | 'mistral-codestral'
  ): AsyncGenerator<string, void, unknown> {
    if (!this.settings.mistralApiKey) {
      throw new Error('Mistral API key not configured');
    }

    try {
      // Prepare messages with system prompt
      const systemMessage = {
        role: 'system' as const,
        content: systemPrompt || this.getDefaultSystemPrompt(language)
      };

      const requestMessages = [systemMessage, ...messages];

      const modelName = model === 'mistral-codestral' ? 'codestral-latest' : 'mistral-small-latest';

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.mistralApiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: requestMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API Error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

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
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Mistral Error:', error);
      throw new Error(`Mistral Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getDefaultSystemPrompt(language: 'en' | 'mr'): string {
    if (language === 'mr') {
      return 'तुम्ही एक सहाय्यक आणि ज्ञानी शिक्षक आहात. तुम्ही स्पष्ट, तपशीलवार आणि उपयुक्त उत्तरे देता. तुम्ही नेहमी मराठी भाषेत उत्तर द्या.';
    }
    return 'You are a helpful and knowledgeable tutor. You provide clear, detailed, and useful answers to help users learn and understand various topics.';
  }

  async enhancePrompt(prompt: string): Promise<string> {
    if (!this.settings.googleApiKey && !this.settings.zhipuApiKey && !this.settings.mistralApiKey) {
      throw new Error('No API key configured');
    }

    const enhanceMessages: MessageForAPI[] = [
      {
        role: 'user',
        content: this.selectedLanguage === 'en' 
          ? `Please enhance and improve this system prompt to make it more detailed, specific, and effective for an AI assistant. The prompt should be clear, comprehensive, and actionable. Here's the original prompt: "${prompt}"`
          : `कृपया या सिस्टम प्रॉम्प्टला अधिक तपशीलवार, विशिष्ट आणि AI सहाय्यकासाठी अधिक प्रभावी बनवण्यासाठी सुधारा. प्रॉम्प्ट स्पष्ट, सर्वसमावेशक आणि कार्यक्षम असावा. मूळ प्रॉम्प्ट हा आहे: "${prompt}"`
      }
    ];

    let enhancedPrompt = '';
    
    try {
      for await (const chunk of this.generateStreamingResponse(enhanceMessages, this.selectedLanguage)) {
        enhancedPrompt += chunk;
      }
      return enhancedPrompt.trim();
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
