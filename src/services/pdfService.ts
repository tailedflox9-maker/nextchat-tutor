// src/services/pdfService.ts
import { BookProject } from '../types';

class PDFGenerationService {
  private selectedLanguage: 'en' | 'mr' = 'en';

  setLanguage(language: 'en' | 'mr') {
    this.selectedLanguage = language;
  }

  private generatePDFStyles(): string {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Palanquin+Dark:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: ${this.selectedLanguage === 'mr' ? "'Palanquin Dark', sans-serif" : "'Inter', sans-serif"};
          line-height: 1.7;
          color: #1a1a1a;
          font-size: 14px;
          background: #ffffff;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 30px;
        }

        /* Typography Hierarchy */
        h1 {
          font-size: 36px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 3px solid #3b82f6;
          text-align: center;
        }

        h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 48px 0 24px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          page-break-after: avoid;
        }

        h3 {
          font-size: 20px;
          font-weight: 600;
          color: #334155;
          margin: 36px 0 16px 0;
          page-break-after: avoid;
        }

        h4 {
          font-size: 16px;
          font-weight: 600;
          color: #475569;
          margin: 24px 0 12px 0;
          page-break-after: avoid;
        }

        /* Paragraph and Text */
        p {
          margin-bottom: 16px;
          text-align: justify;
          orphans: 3;
          widows: 3;
        }

        /* Lists */
        ul, ol {
          margin: 16px 0 16px 24px;
        }

        li {
          margin-bottom: 8px;
          line-height: 1.6;
        }

        ul li {
          list-style-type: none;
          position: relative;
          padding-left: 20px;
        }

        ul li:before {
          content: '•';
          color: #3b82f6;
          font-size: 16px;
          position: absolute;
          left: 0;
          top: 0;
        }

        ol li {
          padding-left: 8px;
        }

        /* Code and Technical Content */
        code {
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          color: #e11d48;
          border: 1px solid #e2e8f0;
        }

        pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          overflow-x: auto;
          border-left: 4px solid #3b82f6;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.5;
          page-break-inside: avoid;
        }

        pre code {
          background: none;
          padding: 0;
          border: none;
          color: inherit;
          font-size: inherit;
        }

        /* Blockquotes */
        blockquote {
          margin: 24px 0;
          padding: 20px 24px;
          background: #f8fafc;
          border-left: 6px solid #3b82f6;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #475569;
          page-break-inside: avoid;
        }

        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-size: 13px;
          page-break-inside: avoid;
        }

        th, td {
          padding: 12px 16px;
          text-align: left;
          border: 1px solid #e2e8f0;
        }

        th {
          background: #f8fafc;
          font-weight: 600;
          color: #1e293b;
        }

        tr:nth-child(even) {
          background: #fafbfc;
        }

        /* Special Elements */
        .book-cover {
          text-align: center;
          padding: 60px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          margin-bottom: 40px;
          page-break-after: always;
        }

        .book-cover h1 {
          color: white;
          border: none;
          margin-bottom: 20px;
          font-size: 48px;
        }

        .book-subtitle {
          font-size: 18px;
          opacity: 0.9;
          font-weight: 300;
          margin-bottom: 40px;
        }

        .book-meta {
          font-size: 14px;
          opacity: 0.8;
        }

        .toc {
          background: #f8fafc;
          padding: 30px;
          border-radius: 8px;
          margin: 40px 0;
          page-break-after: always;
        }

        .toc h2 {
          margin-top: 0;
          color: #1e293b;
          border-bottom: 2px solid #3b82f6;
        }

        .toc ul {
          list-style: none;
          margin-left: 0;
        }

        .toc li {
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .toc li:last-child {
          border-bottom: none;
        }

        .toc a {
          text-decoration: none;
          color: #475569;
          font-weight: 500;
        }

        .chapter-divider {
          margin: 60px 0 40px 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
          border-radius: 2px;
          page-break-before: always;
        }

        .key-takeaways {
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          page-break-inside: avoid;
        }

        .key-takeaways h4 {
          color: #0ea5e9;
          margin-top: 0;
        }

        .exercise-box {
          background: #f0fdf4;
          border: 2px solid #22c55e;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          page-break-inside: avoid;
        }

        .exercise-box h4 {
          color: #16a34a;
          margin-top: 0;
        }

        .warning-box {
          background: #fefce8;
          border: 2px solid #eab308;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          page-break-inside: avoid;
        }

        .warning-box h4 {
          color: #ca8a04;
          margin-top: 0;
        }

        /* Footer for each page */
        .page-footer {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          color: #64748b;
        }

        /* Page breaks */
        .page-break {
          page-break-before: always;
        }

        .avoid-break {
          page-break-inside: avoid;
        }

        /* Print styles */
        @media print {
          body {
            font-size: 12px;
            padding: 20px;
          }
          
          h1 { font-size: 28px; }
          h2 { font-size: 20px; }
          h3 { font-size: 16px; }
          
          .book-cover h1 {
            font-size: 36px;
          }
        }

        /* Marathi-specific adjustments */
        ${this.selectedLanguage === 'mr' ? `
          body {
            font-weight: 600;
            line-height: 1.8;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-weight: 800;
            text-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
          }
          
          p {
            font-weight: 600;
          }
        ` : ''}
      </style>
    `;
  }

  private generateTableOfContents(book: BookProject): string {
    if (!book.roadmap) return '';
    
    const tocTitle = this.selectedLanguage === 'en' ? 'Table of Contents' : 'अनुक्रमणिका';
    
    const tocItems = book.roadmap.modules.map((module, index) => 
      `<li><a href="#module-${index + 1}">${index + 1}. ${module.title}</a></li>`
    ).join('\n');

    return `
      <div class="toc">
        <h2>${tocTitle}</h2>
        <ul>
          <li><a href="#introduction">${this.selectedLanguage === 'en' ? 'Introduction' : 'प्रस्तावना'}</a></li>
          ${tocItems}
          <li><a href="#conclusion">${this.selectedLanguage === 'en' ? 'Conclusion' : 'निष्कर्ष'}</a></li>
          <li><a href="#glossary">${this.selectedLanguage === 'en' ? 'Glossary' : 'शब्दकोश'}</a></li>
          <li><a href="#resources">${this.selectedLanguage === 'en' ? 'Additional Resources' : 'अतिरिक्त स्रोत'}</a></li>
        </ul>
      </div>
    `;
  }

  private enhanceMarkdownForPDF(content: string): string {
    return content
      // Convert headers with anchor IDs
      .replace(/^# (.+)$/gm, '<h1 id="$1">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 id="$1">$2</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      
      // Convert paragraphs
      .replace(/^(?!<[h|u|o|p|d|b]).+$/gm, '<p>$&</p>')
      
      // Convert bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      
      // Convert inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Convert code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      
      // Convert unordered lists
      .replace(/^- (.+)$/gm, '<ul><li>$1</li></ul>')
      .replace(/<\/ul>\n<ul>/g, '\n')
      
      // Convert ordered lists
      .replace(/^\d+\. (.+)$/gm, '<ol><li>$1</li></ol>')
      .replace(/<\/ol>\n<ol>/g, '\n')
      
      // Add special boxes for common patterns
      .replace(/Key Takeaways?:?\s*\n([\s\S]*?)(?=\n\n|\n#|$)/gi, 
        '<div class="key-takeaways"><h4>Key Takeaways</h4>$1</div>')
      .replace(/Practice Exercises?:?\s*\n([\s\S]*?)(?=\n\n|\n#|$)/gi, 
        '<div class="exercise-box"><h4>Practice Exercises</h4>$1</div>')
      .replace(/Important:?\s*\n([\s\S]*?)(?=\n\n|\n#|$)/gi, 
        '<div class="warning-box"><h4>Important</h4>$1</div>')
      
      // Clean up extra line breaks
      .replace(/\n{3,}/g, '\n\n')
      .replace(/<p>\s*<\/p>/g, '')
      
      // Add chapter dividers before main sections
      .replace(/<h2/g, '<div class="chapter-divider"></div>\n<h2');
  }

  async generatePDF(book: BookProject): Promise<void> {
    if (!book.finalBook) {
      throw new Error(this.selectedLanguage === 'en' ? 
        'Book content is not available for PDF generation' : 
        'PDF निर्मितीसाठी पुस्तकाची सामग्री उपलब्ध नाही');
    }

    // Create cover page content
    const coverContent = `
      <div class="book-cover">
        <h1>${book.title}</h1>
        <div class="book-subtitle">
          ${this.selectedLanguage === 'en' ? 'AI-Generated Learning Guide' : 'AI-निर्मित शिकण्याचे मार्गदर्शन'}
        </div>
        <div class="book-meta">
          <p><strong>${this.selectedLanguage === 'en' ? 'Generated on:' : 'तयार केले:'}</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>${this.selectedLanguage === 'en' ? 'Language:' : 'भाषा:'}</strong> ${book.language === 'en' ? 'English' : 'मराठी'}</p>
          ${book.roadmap ? `<p><strong>${this.selectedLanguage === 'en' ? 'Estimated Reading Time:' : 'अंदाजे वाचन वेळ:'}</strong> ${book.roadmap.estimatedReadingTime}</p>` : ''}
          ${book.roadmap ? `<p><strong>${this.selectedLanguage === 'en' ? 'Difficulty Level:' : 'कठिणाई पातळी:'}</strong> ${book.roadmap.difficultyLevel}</p>` : ''}
        </div>
      </div>
    `;

    // Generate table of contents
    const tocContent = this.generateTableOfContents(book);

    // Process the main book content
    const processedContent = this.enhanceMarkdownForPDF(book.finalBook);

    // Combine all content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${book.language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${book.title}</title>
        ${this.generatePDFStyles()}
      </head>
      <body>
        ${coverContent}
        ${tocContent}
        <div class="page-break"></div>
        ${processedContent}
      </body>
      </html>
    `;

    // Create and download the HTML version for print/PDF
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      });
    }
    
    // Also create a downloadable HTML file
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_book.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Alternative method using jsPDF for direct PDF generation
  async generateDirectPDF(book: BookProject): Promise<void> {
    // This would require importing jsPDF library
    // For now, we'll use the HTML/print method above
    // which provides better typography and layout control
    
    throw new Error(this.selectedLanguage === 'en' ? 
      'Direct PDF generation not implemented. Please use print-to-PDF instead.' :
      'थेट PDF निर्मिती अंमलबजावणी केली नाही. कृपया print-to-PDF वापरा.');
  }
}

export const pdfService = new PDFGenerationService();
