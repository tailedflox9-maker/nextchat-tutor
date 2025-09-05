// src/services/bookService.ts
import { BookProject, BookRoadmap, BookModule, RoadmapModule, BookSession } from '../types/book';
import { generateId } from '../utils/helpers';

class BookGenerationService {
  private apiKey: string = '';
  private selectedLanguage: 'en' | 'mr' = 'en';
  private onProgressUpdate?: (bookId: string, updates: Partial<BookProject>) => void;

  updateSettings(apiKey: string, language: 'en' | 'mr') {
    this.apiKey = apiKey;
    this.selectedLanguage = language;
  }

  setProgressCallback(callback: (bookId: string, updates: Partial<BookProject>) => void) {
    this.onProgressUpdate = callback;
  }

  private updateProgress(bookId: string, updates: Partial<BookProject>) {
    if (this.onProgressUpdate) {
      this.onProgressUpdate(bookId, { ...updates, updatedAt: new Date() });
    }
  }

  private async generateWithGemma(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(this.selectedLanguage === 'en' ? 'API key not configured' : 'API की कॉन्फिगर केली नाही');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error:", errorBody);
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("Invalid API Response:", data);
      throw new Error('Invalid response structure from API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  async generateRoadmap(session: BookSession, bookId: string): Promise<BookRoadmap> {
    this.updateProgress(bookId, { status: 'generating_roadmap', progress: 5 });
    
    const prompt = this.selectedLanguage === 'en' ? 
      `Create a comprehensive learning roadmap for: "${session.goal}"...` // Same prompt as before
      : `यासाठी एक सर्वसमावेशक शिकण्याचा रोडमॅप तयार करा: "${session.goal}"...`; // Same prompt as before

    const response = await this.generateWithGemma(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response for roadmap');
      
      const roadmap = JSON.parse(jsonMatch[0]);
      
      if (!roadmap.modules || !Array.isArray(roadmap.modules)) throw new Error('Invalid roadmap structure');
      
      roadmap.modules = roadmap.modules.map((module: any, index: number) => ({
        id: `module_${index + 1}`,
        title: module.title || `Module ${index + 1}`,
        objectives: Array.isArray(module.objectives) ? module.objectives : [],
        estimatedTime: module.estimatedTime || '1-2 hours',
        order: module.order || index + 1
      }));

      this.updateProgress(bookId, { status: 'roadmap_completed', progress: 10, roadmap });
      return roadmap;
    } catch (error) {
      this.updateProgress(bookId, { status: 'error', error: 'Failed to parse roadmap' });
      console.error('Error parsing roadmap:', error, 'API Response:', response);
      throw new Error(this.selectedLanguage === 'en' ? 'Failed to generate a valid roadmap' : 'एक वैध रोडमॅप तयार करण्यात अयशस्वी');
    }
  }

  async generateModuleContent(
    book: BookProject,
    roadmapModule: RoadmapModule, 
    session: BookSession
  ): Promise<BookModule> {
    const previousModules = book.modules.filter(m => m.status === 'completed');
    const previousContent = previousModules.length > 0 ? 
      `\n\nPREVIOUS MODULES CONTEXT:\n${previousModules.map(m => `${m.title}:\n${m.content.substring(0, 300)}...`).join('\n\n')}` : 
      '';

    const prompt = this.selectedLanguage === 'en' ?
      `Generate a comprehensive chapter for: "${roadmapModule.title}"...` // Same prompt as before
      : `यासाठी एक सर्वसमावेशक अध्याय तयार करा: "${roadmapModule.title}"...`; // Same prompt as before
    
    const moduleContent = await this.generateWithGemma(prompt);

    return {
      id: generateId(),
      roadmapModuleId: roadmapModule.id,
      title: roadmapModule.title,
      content: moduleContent,
      wordCount: moduleContent.split(' ').length,
      status: 'completed',
      generatedAt: new Date()
    };
  }

  async assembleFinalBook(book: BookProject, session: BookSession): Promise<string> {
    this.updateProgress(book.id, { status: 'assembling', progress: 90 });
    
    const introduction = await this.generateBookIntroduction(session, book.roadmap!);
    const summary = await this.generateBookSummary(session, book.modules);
    const glossary = await this.generateGlossary(book.modules);

    const finalBook = [
      `# ${book.title}\n`,
      `**Generated on:** ${new Date().toLocaleDateString()}\n`,
      `**Estimated Reading Time:** ${book.roadmap!.estimatedReadingTime}\n`,
      `**Difficulty Level:** ${book.roadmap!.difficultyLevel}\n\n`,
      `## Introduction\n${introduction}\n\n---\n\n`,
      ...book.modules.map(module => module.content),
      '\n\n---\n\n',
      `## Summary & Conclusion\n${summary}\n\n---\n\n`,
      `## Glossary\n${glossary}\n\n---\n\n`,
      `## ${this.selectedLanguage === 'en' ? 'Suggested Next Steps' : 'सुचवलेली पुढील पावले'}\n\n`,
      this.selectedLanguage === 'en' ? 
        '- Practice the concepts learned through hands-on projects\n- Join communities related to your learning goal\n- Explore advanced topics that interest you most' :
        '- व्यावहारिक प्रकल्पांद्वारे शिकलेल्या संकल्पनांचा सराव करा\n- आपल्या शिकण्याच्या ध्येयाशी संबंधित समुदायांमध्ये सामील व्हा\n- तुम्हाला सर्वात जास्त आवडणाऱ्या क्षेत्रांतील प्रगत विषयांचा शोध घ्या'
    ].join('\n');

    this.updateProgress(book.id, { status: 'completed', progress: 100, finalBook });
    return finalBook;
  }

  // Helper methods for assembly, same prompts as before
  private async generateBookIntroduction(session: BookSession, roadmap: BookRoadmap): Promise<string> { /* ... same as before ... */ return "..."; }
  private async generateBookSummary(session: BookSession, modules: BookModule[]): Promise<string> { /* ... same as before ... */ return "..."; }
  private async generateGlossary(modules: BookModule[]): Promise<string> { /* ... same as before ... */ return "..."; }

  downloadAsMarkdown(project: BookProject) {
    if (!project.finalBook) return;
    const blob = new Blob([project.finalBook], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_book.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const bookService = new BookGenerationService();
