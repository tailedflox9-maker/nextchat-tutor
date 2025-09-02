import { GoogleGenerativeAI } from '@google/generative-ai';
import { APISettings } from '../types';

class AIService {
  private googleAI: GoogleGenerativeAI | null = null;
  private zhipuAI: any = null;
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
    onUpdate?: (content: string) => void
  ): AsyncGenerator<string, void, unknown> {
    if (!this.settings) {
      yield language === 'en'
        ? "Please configure your API keys in the settings first."
        : "कृपया प्रथम सेटिंग्जमध्ये आपली API की कॉन्फिगर करा.";
      return;
    }

    const systemPrompt = language === 'en'
      ? `You are a helpful AI tutor. Provide clear, educational responses that help users learn effectively.
Use markdown formatting with headings, lists, and code blocks to structure your answers.
If the user asks for examples, provide practical examples.
If the user asks for explanations, break down complex concepts into simple terms.
If the user asks for a quiz, create a quiz question or practice problem based on the topic.`
      : `तुम्ही एक उपयुक्त एआय शिक्षक आहात. वापरकर्त्यांना प्रभावीपणे शिकण्यास मदत करण्यासाठी स्पष्ट, शैक्षणिक प्रतिसाद द्या.
आपले उत्तर संरचित करण्यासाठी मार्कडाउन स्वरूपण, शीर्षके, यादी आणि कोड ब्लॉक वापरा.
जर वापरकर्त्याने उदाहरणे मागितली, तर व्यावहारिक उदाहरणे द्या.
जर वापरकर्त्याने स्पष्टीकरण मागितले, तर जटिल संकल्पना साध्या भाषेत समजावून सांगा.
जर वापरकर्त्याने क्विझ मागितली, तर विषयावर आधारित क्विझ प्रश्न किंवा सराव समस्या तयार करा.
सर्व प्रतिसाद मराठीत द्या.`;

    try {
      if (this.settings.selectedModel === 'google' && this.googleAI) {
        yield* this.generateGoogleResponse(messages, systemPrompt, onUpdate);
      } else if (this.settings.selectedModel === 'zhipu' && this.zhipuAI) {
        yield* this.generateZhipuResponse(messages, systemPrompt, onUpdate);
      } else if (this.settings.selectedModel.startsWith('mistral-')) {
        const model = this.settings.selectedModel.split('-')[1] as 'small' | 'codestral';
        yield* this.generateMistralResponse(messages, systemPrompt, model, onUpdate);
      } else {
        yield language === 'en'
          ? "Selected model is not available or API key is missing."
          : "निवडलेले मॉडेल उपलब्ध नाही किंवा API की गहाळ आहे.";
      }
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      yield language === 'en'
        ? `I apologize, but I encountered an error: ${errorMessage}. Please check your API key and try again.`
        : `मला माफ करा, परंतु मला त्रुटी आली: ${errorMessage}. कृपया तुमची API की तपासा आणि पुन्हा प्रयत्न करा.`;
    }
  }

  private async *generateGoogleResponse(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string,
    onUpdate?: (content: string) => void
  ): AsyncGenerator<string, void, unknown> {
    if (!this.googleAI) {
      yield this.language === 'en'
        ? "Google AI is not initialized. Please check your API key."
        : "गूगल एआय सुरू झाले नाही. कृपया आपली API की तपासा.";
      return;
    }
    try {
      const model = this.googleAI.getGenerativeModel({
        model: 'gemma-3-27b-it',
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));
      const chat = model.startChat({
        history: history,
      });
      const lastMessage = messages[messages.length - 1];
      const prompt = `${systemPrompt}\n\nUser: ${lastMessage.content}`;
      const result = await chat.sendMessageStream(prompt);
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
          ? "I apologize, but I couldn't generate a response. Please try again."
          : "मला माफ करा, पण मी प्रतिसाद तयार करू शकलो नाही. कृपया पुन्हा प्रयत्न करा.";
      }
    } catch (error) {
      console.error('Google AI API Error:', error);
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('api key') || errorMsg.includes('authentication')) {
          yield this.language === 'en'
            ? "Invalid API key. Please check your Google AI API key in settings."
            : "अवैध API की. कृपया सेटिंग्जमध्ये आपली Google AI API की तपासा.";
        } else if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
          yield this.language === 'en'
            ? "API quota exceeded. Please check your usage limits or try again later."
            : "API कोटा ओलांडला आहे. कृपया आपल्या वापराच्या मर्यादा तपासा किंवा नंतर पुन्हा प्रयत्न करा.";
        } else if (errorMsg.includes('safety') || errorMsg.includes('blocked')) {
          yield this.language === 'en'
            ? "The response was blocked by safety filters. Please try rephrasing your question."
            : "सुरक्षा फिल्टरद्वारे प्रतिसाद अवरोधित केला गेला. कृपया आपला प्रश्न पुन्हा शब्दबद्ध करण्याचा प्रयत्न करा.";
        } else {
          yield this.language === 'en'
            ? `Google AI Error: ${error.message}`
            : `गूगल एआय त्रुटी: ${error.message}`;
        }
      } else {
        yield this.language === 'en'
          ? "An unexpected error occurred with Google AI. Please try again."
          : "गूगल एआयसह अनपेक्षित त्रुटी आली. कृपया पुन्हा प्रयत्न करा.";
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
        ? "ZhipuAI is not properly configured."
        : "झिपूएआय योग्यरित्या कॉन्फिगर केलेले नाही.";
      return;
    }
    const messagesWithSystemPrompt = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];
    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.zhipuAI.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'GLM-4.5-Flash',
          messages: messagesWithSystemPrompt.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
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
          ? "Error: Unable to read response stream"
          : "त्रुटी: प्रतिसाद प्रवाह वाचण्यात अक्षम";
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
          ? "No response received from ZhipuAI. Please try again."
          : "झिपूएआय कडून कोणताही प्रतिसाद मिळाला नाही. कृपया पुन्हा प्रयत्न करा.";
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
        ? "Mistral AI is not properly configured."
        : "मिस्ट्रल एआय योग्यरित्या कॉन्फिगर केलेले नाही.";
      return;
    }
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.settings.mistralApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model === 'small' ? 'mistral-small-latest' : 'codestral-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
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
          ? "Error: Unable to read response stream"
          : "त्रुटी: प्रतिसाद प्रवाह वाचण्यात अक्षम";
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
          ? "No response received from Mistral. Please try again."
          : "मिस्ट्रलकडून कोणताही प्रतिसाद मिळाला नाही. कृपया पुन्हा प्रयत्न करा.";
      }
    } catch (error) {
      console.error('Mistral Error:', error);
      yield this.language === 'en'
        ? `Mistral Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `मिस्ट्रल त्रुटी: ${error instanceof Error ? error.message : 'अज्ञात त्रुटी'}`;
    }
  }

  async generateResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    let fullResponse = '';
    for await (const chunk of this.generateStreamingResponse(messages, this.language)) {
      fullResponse += chunk;
    }
    return fullResponse;
  }
}

export const aiService = new AIService();
