// src/services/bookService.ts
import { BookProject, BookRoadmap, BookModule, RoadmapModule, BookSession, BookGenerationProgress } from '../types/book';
import { generateId } from '../utils/helpers';

class BookGenerationService {
  private apiKey: string = '';
  private selectedLanguage: 'en' | 'mr' = 'en';
  private onProgressUpdate?: (progress: BookGenerationProgress) => void;

  updateSettings(apiKey: string, language: 'en' | 'mr') {
    this.apiKey = apiKey;
    this.selectedLanguage = language;
  }

  setProgressCallback(callback: (progress: BookGenerationProgress) => void) {
    this.onProgressUpdate = callback;
  }

  private updateProgress(stage: string, message: string, currentModule?: number, totalModules?: number) {
    if (this.onProgressUpdate) {
      this.onProgressUpdate({
        stage,
        currentModule,
        totalModules,
        message,
        timestamp: new Date()
      });
    }
  }

  private async generateWithGemma(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(this.selectedLanguage === 'en' ? 'API key not configured' : 'API की कॉन्फिगर केली नाही');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  async generateRoadmap(session: BookSession): Promise<BookRoadmap> {
    this.updateProgress('roadmap', this.selectedLanguage === 'en' ? 'Generating learning roadmap...' : 'शिकण्याचा रोडमॅप तयार करत आहे...');
    
    const prompt = this.selectedLanguage === 'en' ? 
      `Create a comprehensive learning roadmap for: "${session.goal}"
      
      Requirements:
      - Generate 8-12 modules in logical learning sequence
      - Each module should have a clear title and 3-5 specific learning objectives
      - Estimate reading/study time for each module
      - Determine overall difficulty level (beginner/intermediate/advanced)
      - Target audience: ${session.targetAudience || 'general learners'}
      - Complexity: ${session.complexityLevel || 'intermediate'}
      
      Format as JSON:
      {
        "modules": [
          {
            "id": "module_1",
            "title": "Module Title",
            "objectives": ["Objective 1", "Objective 2", "Objective 3"],
            "estimatedTime": "2-3 hours",
            "order": 1
          }
        ],
        "totalModules": 10,
        "estimatedReadingTime": "20-25 hours",
        "difficultyLevel": "intermediate"
      }` :
      `यासाठी एक सर्वसमावेशक शिकण्याचा रोडमॅप तयार करा: "${session.goal}"
      
      आवश्यकता:
      - तार्किक शिकण्याच्या क्रमाने 8-12 मॉड्यूल तयार करा
      - प्रत्येक मॉड्यूलमध्ये स्पष्ट शीर्षक आणि 3-5 विशिष्ट शिकण्याचे उद्दिष्टे असावेत
      - प्रत्येक मॉड्यूलसाठी वाचन/अभ्यास वेळेचा अंदाज लावा
      - एकूण कठिणाई पातळी निर्धारित करा (beginner/intermediate/advanced)
      
      JSON स्वरूपात: (English keys वापरा, मराठी content)
      {
        "modules": [
          {
            "id": "module_1",
            "title": "मॉड्यूल शीर्षक",
            "objectives": ["उद्दिष्ट 1", "उद्दिष्ट 2", "उद्दिष्ट 3"],
            "estimatedTime": "2-3 तास",
            "order": 1
          }
        ],
        "totalModules": 10,
        "estimatedReadingTime": "20-25 तास",
        "difficultyLevel": "intermediate"
      }`;

    const response = await this.generateWithGemma(prompt);
    
    try {
      // Extract JSON from response (sometimes AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const roadmap = JSON.parse(jsonMatch[0]);
      
      // Validate and ensure proper structure
      if (!roadmap.modules || !Array.isArray(roadmap.modules)) {
        throw new Error('Invalid roadmap structure');
      }
      
      // Ensure all modules have required fields
      roadmap.modules = roadmap.modules.map((module: any, index: number) => ({
        id: module.id || `module_${index + 1}`,
        title: module.title || `Module ${index + 1}`,
        objectives: Array.isArray(module.objectives) ? module.objectives : [],
        estimatedTime: module.estimatedTime || '1-2 hours',
        order: module.order || index + 1
      }));
      
      return roadmap;
    } catch (error) {
      console.error('Error parsing roadmap:', error);
      throw new Error(this.selectedLanguage === 'en' ? 'Failed to generate roadmap' : 'रोडमॅप तयार करण्यात अयशस्वी');
    }
  }

  async generateModule(
    roadmapModule: RoadmapModule, 
    previousModules: BookModule[], 
    session: BookSession
  ): Promise<string> {
    this.updateProgress(
      'module', 
      this.selectedLanguage === 'en' ? 
        `Generating Module ${roadmapModule.order}: ${roadmapModule.title}` :
        `मॉड्यूल ${roadmapModule.order} तयार करत आहे: ${roadmapModule.title}`,
      roadmapModule.order,
      undefined
    );

    const previousContent = previousModules.length > 0 ? 
      `\n\nPREVIOUS MODULES CONTEXT:\n${previousModules.map(m => `${m.title}:\n${m.content.substring(0, 500)}...`).join('\n\n')}` : 
      '';

    const prompt = this.selectedLanguage === 'en' ?
      `Generate a comprehensive chapter for: "${roadmapModule.title}"

      LEARNING GOAL: ${session.goal}
      MODULE OBJECTIVES: ${roadmapModule.objectives.join(', ')}
      TARGET AUDIENCE: ${session.targetAudience || 'general learners'}
      COMPLEXITY LEVEL: ${session.complexityLevel || 'intermediate'}
      ${previousContent}

      Requirements:
      - Write a complete, detailed chapter (2000-4000 words)
      - Build upon previous modules naturally
      - Include practical examples and code snippets where relevant
      - Use clear, engaging language
      - Add section headers with ## markdown syntax
      - Include bullet points and numbered lists for better readability
      ${session.preferences?.includeExamples ? '- Include practical examples and demonstrations' : ''}
      ${session.preferences?.includePracticalExercises ? '- Add hands-on exercises at the end' : ''}
      
      Structure:
      ## ${roadmapModule.title}
      
      ### Introduction
      (Brief overview connecting to previous modules)
      
      ### Core Concepts
      (Main learning content with examples)
      
      ### Practical Application
      (Real-world examples and use cases)
      
      ${session.preferences?.includePracticalExercises ? '### Practice Exercises\n(Hands-on activities)' : ''}
      
      ### Key Takeaways
      (Summary of main points)
      
      Write in clear, educational language suitable for ${session.complexityLevel || 'intermediate'} level learners.` :
      
      `यासाठी एक सर्वसमावेशक अध्याय तयार करा: "${roadmapModule.title}"

      शिकण्याचे लक्ष्य: ${session.goal}
      मॉड्यूल उद्दिष्टे: ${roadmapModule.objectives.join(', ')}
      ${previousContent}

      आवश्यकता:
      - संपूर्ण, तपशीलवार अध्याय लिहा (2000-4000 शब्द)
      - मागील मॉड्यूल्सवर नैसर्गिकपणे आधारित करा
      - व्यावहारिक उदाहरणे आणि कोड स्निपेट्स समाविष्ट करा
      - स्पष्ट, आकर्षक भाषा वापरा
      - ## मार्कडाउन सिंटॅक्ससह विभाग शीर्षके जोडा
      ${session.preferences?.includeExamples ? '- व्यावहारिक उदाहरणे आणि प्रात्यक्षिके समाविष्ट करा' : ''}
      ${session.preferences?.includePracticalExercises ? '- शेवटी व्यावहारिक सराव जोडा' : ''}
      
      रचना:
      ## ${roadmapModule.title}
      
      ### परिचय
      (मागील मॉड्यूल्सशी जोडणारे संक्षिप्त विहंगावलोकन)
      
      ### मुख्य संकल्पना
      (उदाहरणांसह मुख्य शिकण्याची सामग्री)
      
      ### व्यावहारिक वापर
      (वास्तविक-जगातील उदाहरणे आणि वापर)
      
      ${session.preferences?.includePracticalExercises ? '### सराव व्यायाम\n(व्यावहारिक क्रियाकलाप)' : ''}
      
      ### मुख्य मुद्दे
      (मुख्य मुद्द्यांचा सारांश)`;

    return await this.generateWithGemma(prompt);
  }

  async generateBookIntroduction(session: BookSession, roadmap: BookRoadmap): Promise<string> {
    const prompt = this.selectedLanguage === 'en' ?
      `Generate a comprehensive introduction for a book about: "${session.goal}"

      ROADMAP OVERVIEW:
      ${roadmap.modules.map(m => `- ${m.title}: ${m.objectives.join(', ')}`).join('\n')}
      
      Total Modules: ${roadmap.totalModules}
      Estimated Reading Time: ${roadmap.estimatedReadingTime}
      Difficulty Level: ${roadmap.difficultyLevel}

      Write a compelling introduction that:
      - Welcomes the reader and explains the book's purpose
      - Outlines what they'll learn and achieve
      - Explains the book's structure and how to use it
      - Motivates them to begin their learning journey
      - Sets appropriate expectations for the difficulty level

      Format with markdown headers (##, ###) and make it engaging and informative.` :
      
      `यासाठी एक सर्वसमावेशक प्रस्तावना तयार करा: "${session.goal}"

      रोडमॅप विहंगावलोकन:
      ${roadmap.modules.map(m => `- ${m.title}: ${m.objectives.join(', ')}`).join('\n')}
      
      एकूण मॉड्यूल्स: ${roadmap.totalModules}
      अंदाजे वाचन वेळ: ${roadmap.estimatedReadingTime}
      कठिणाई पातळी: ${roadmap.difficultyLevel}

      आकर्षक प्रस्तावना लिहा जी:
      - वाचकाचे स्वागत करते आणि पुस्तकाचा उद्देश स्पष्ट करते
      - ते काय शिकतील आणि साध्य करतील याची रूपरेषा देते
      - पुस्तकाची रचना आणि वापर कसा करावा हे स्पष्ट करते
      - त्यांना शिकण्याचा प्रवास सुरू करण्यास प्रेरणा देते

      मार्कडाउन हेडर्स (##, ###) वापरून फॉर्मॅट करा.`;

    return await this.generateWithGemma(prompt);
  }

  async generateBookSummary(session: BookSession, modules: BookModule[]): Promise<string> {
    const prompt = this.selectedLanguage === 'en' ?
      `Generate a comprehensive summary and conclusion for a book about: "${session.goal}"

      MODULES COVERED:
      ${modules.map(m => `- ${m.title}`).join('\n')}

      Write a conclusion that:
      - Summarizes the key learning outcomes achieved
      - Reinforces the most important concepts covered
      - Provides guidance on next steps and further learning
      - Congratulates the reader on their progress
      - Offers resources for continued growth

      Make it inspiring and actionable.` :
      
      `यासाठी एक सर्वसमावेशक सारांश आणि निष्कर्ष तयार करा: "${session.goal}"

      समाविष्ट मॉड्यूल्स:
      ${modules.map(m => `- ${m.title}`).join('\n')}

      निष्कर्ष लिहा जो:
      - साध्य झालेल्या मुख्य शिकण्याच्या परिणामांचा सारांश देतो
      - समाविष्ट केलेल्या सर्वात महत्वाच्या संकल्पनांना बळकटी देतो
      - पुढील पावले आणि पुढील शिकण्यावर मार्गदर्शन करतो
      - वाचकाच्या प्रगतीबद्दल अभिनंदन करतो

      प्रेरणादायी आणि कार्यक्षम बनवा.`;

    return await this.generateWithGemma(prompt);
  }

  async generateGlossary(modules: BookModule[]): Promise<string> {
    const allContent = modules.map(m => m.content).join('\n\n');
    
    const prompt = this.selectedLanguage === 'en' ?
      `Extract key terms and create a glossary from the following content:

      ${allContent.substring(0, 8000)}...

      Create a glossary with:
      - 15-25 most important terms and concepts
      - Clear, concise definitions
      - Alphabetical order
      - Markdown formatting

      Format:
      ## Glossary

      **Term**: Definition here.

      **Another Term**: Another definition here.` :
      
      `खालील सामग्रीतून मुख्य संज्ञा काढा आणि शब्दकोश तयार करा:

      ${allContent.substring(0, 8000)}...

      शब्दकोश तयार करा ज्यामध्ये:
      - 15-25 सर्वात महत्वाच्या संज्ञा आणि संकल्पना
      - स्पष्ट, संक्षिप्त व्याख्या
      - वर्णक्रमानुसार क्रम
      - मार्कडाउन फॉर्मॅटिंग

      फॉर्मॅट:
      ## शब्दकोश

      **संज्ञा**: येथे व्याख्या.

      **दुसरी संज्ञा**: येथे दुसरी व्याख्या.`;

    return await this.generateWithGemma(prompt);
  }

  async generateCompleteBook(session: BookSession): Promise<BookProject> {
    const project: BookProject = {
      id: generateId(),
      title: session.goal,
      goal: session.goal,
      language: session.language,
      status: 'generating_roadmap',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      modules: []
    };

    try {
      // Step 1: Generate Roadmap
      this.updateProgress('init', this.selectedLanguage === 'en' ? 'Starting book generation...' : 'पुस्तक निर्मिती सुरू करत आहे...');
      project.progress = 10;
      
      const roadmap = await this.generateRoadmap(session);
      project.roadmap = roadmap;
      project.status = 'generating_modules';
      project.progress = 20;

      // Step 2: Generate Introduction
      const introduction = await this.generateBookIntroduction(session, roadmap);
      project.progress = 25;

      // Step 3: Generate Modules
      const completedModules: BookModule[] = [];
      const totalModules = roadmap.modules.length;
      
      for (let i = 0; i < roadmap.modules.length; i++) {
        const roadmapModule = roadmap.modules[i];
        
        const moduleContent = await this.generateModule(roadmapModule, completedModules, session);
        
        const bookModule: BookModule = {
          id: generateId(),
          roadmapModuleId: roadmapModule.id,
          title: roadmapModule.title,
          content: moduleContent,
          wordCount: moduleContent.split(' ').length,
          status: 'completed',
          generatedAt: new Date()
        };
        
        completedModules.push(bookModule);
        project.modules.push(bookModule);
        
        // Update progress (modules take 60% of total progress)
        project.progress = 25 + ((i + 1) / totalModules) * 60;
      }

      // Step 4: Generate Summary and Glossary
      this.updateProgress('assembly', this.selectedLanguage === 'en' ? 'Assembling final book...' : 'अंतिम पुस्तक एकत्रित करत आहे...');
      project.status = 'assembling';
      project.progress = 85;

      const summary = await this.generateBookSummary(session, completedModules);
      const glossary = await this.generateGlossary(completedModules);

      // Step 5: Assemble Final Book
      const finalBook = [
        `# ${project.title}\n`,
        `**Generated on:** ${new Date().toLocaleDateString()}\n`,
        `**Estimated Reading Time:** ${roadmap.estimatedReadingTime}\n`,
        `**Difficulty Level:** ${roadmap.difficultyLevel}\n\n`,
        introduction,
        '\n\n---\n\n',
        ...completedModules.map(module => module.content),
        '\n\n---\n\n',
        summary,
        '\n\n---\n\n',
        glossary,
        '\n\n---\n\n',
        `## ${this.selectedLanguage === 'en' ? 'Suggested Next Steps' : 'सुचवलेली पुढील पावले'}\n\n`,
        this.selectedLanguage === 'en' ? 
          '- Practice the concepts learned through hands-on projects\n- Join communities related to your learning goal\n- Explore advanced topics in areas that interest you most\n- Share your knowledge with others to reinforce your learning' :
          '- व्यावहारिक प्रकल्पांद्वारे शिकलेल्या संकल्पनांचा सराव करा\n- आपल्या शिकण्याच्या ध्येयाशी संबंधित समुदायांमध्ये सामील व्हा\n- तुम्हाला सर्वात जास्त आवडणाऱ्या क्षेत्रांतील प्रगत विषयांचा शोध घ्या\n- तुमच्या शिकण्यास बळकटी देण्यासाठी इतरांसह तुमचे ज्ञान सामायिक करा'
      ].join('\n');

      project.finalBook = finalBook;
      project.status = 'completed';
      project.progress = 100;
      project.updatedAt = new Date();

      this.updateProgress('done', this.selectedLanguage === 'en' ? 'Book generated successfully!' : 'पुस्तक यशस्वीपणे तयार झाले!');
      
      return project;

    } catch (error) {
      project.status = 'error';
      project.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

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
