import { marked } from 'marked';
import { BookProject } from '../types/book';

class PDFGenerationService {
  private selectedLanguage: 'en' | 'mr' = 'en';

  public setLanguage(language: 'en' | 'mr') {
    this.selectedLanguage = language;
  }

  private generatePDFStyles(): string {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora:wght@400;700&display=swap');
        
        @page {
          size: A4;
          margin: 1in;
          
          @top-left {
            content: "${this.selectedLanguage === 'en' ? 'AI Tutor - Codex Engine' : 'एआय ट्यूटर - कोडेक्स इंजिन'}";
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            color: #64748b;
          }
          
          @top-right {
            content: "${this.selectedLanguage === 'en' ? 'Book Title' : 'पुस्तकाचे शीर्षक'}"; /* This will be replaced by JS */
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            color: #64748b;
          }

          @bottom-center {
            content: "Page " counter(page);
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            color: #64748b;
          }
        }

        body {
          font-family: 'Lora', serif;
          line-height: 1.6;
          color: #333;
          font-size: 11pt;
        }

        h1, h2, h3, h4 {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          font-weight: 700;
          line-height: 1.3;
        }

        h1 {
          font-size: 28pt;
          text-align: center;
          margin-bottom: 1.5rem;
          color: #000;
        }

        h2 {
          font-size: 20pt;
          margin-top: 2rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #cbd5e1;
          page-break-before: always; /* Each chapter starts on a new page */
          page-break-after: avoid;
        }

        h3 {
          font-size: 16pt;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #334155;
          page-break-after: avoid;
        }

        p {
          margin-bottom: 1rem;
          text-align: justify;
        }

        ul, ol { margin-left: 1.5rem; margin-bottom: 1rem; }
        li { margin-bottom: 0.5rem; }

        code {
          font-family: 'Courier New', monospace;
          background-color: #f1f5f9;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 0.9em;
          color: #475569;
        }

        pre {
          background-color: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 6px;
          margin: 1.5rem 0;
          font-size: 0.9em;
          line-height: 1.4;
          white-space: pre-wrap;
          word-wrap: break-word;
          page-break-inside: avoid;
        }
        pre code { background-color: transparent; color: inherit; padding: 0; }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          page-break-inside: avoid;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 0.75rem;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
        }

        /* --- Special Pages --- */
        .cover-page, .toc-page {
          page-break-after: always;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        
        .cover-page h1 { font-size: 36pt; border: none; }
        .cover-page .subtitle { font-size: 14pt; color: #475569; margin-top: 0.5rem; margin-bottom: 2rem; font-family: 'Inter', sans-serif; }
        .cover-page .meta { font-size: 10pt; color: #64748b; }
        
        .toc-page h2 { border: none; page-break-before: unset; text-align: center; }
        .toc-page ul { list-style: none; padding: 0; }
        .toc-page li {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px dotted #cbd5e1;
        }
        .toc-page a { text-decoration: none; color: #1e3a8a; }
        .toc-page .page-num { color: #64748b; }
        
        .no-header-footer {
          @top-left { content: ""; }
          @top-right { content: ""; }
          @bottom-center { content: ""; }
        }
      </style>
    `;
  }
  
  public async generatePDF(book: BookProject): Promise<void> {
    if (!book.finalBook) throw new Error("Book content is missing.");

    // 1. Parse Markdown to HTML
    const mainContentHtml = await marked.parse(book.finalBook);

    // 2. Create a temporary container to process HTML and generate ToC
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = mainContentHtml;

    const tocItems = Array.from(tempDiv.querySelectorAll('h2')).map((h2, index) => {
      const id = `chapter-${index + 1}`;
      h2.id = id;
      return `<li><a href="#${id}">${h2.textContent}</a></li>`;
    }).join('');

    const tocTitle = this.selectedLanguage === 'en' ? 'Table of Contents' : 'अनुक्रमणिका';
    const tocHtml = `
      <div class="toc-page">
        <h2>${tocTitle}</h2>
        <ul>${tocItems}</ul>
      </div>
    `;

    // 3. Create the Cover Page HTML
    const coverTitle = this.selectedLanguage === 'en' ? 'A Learning Guide by' : 'द्वारा एक शिक्षण मार्गदर्शक';
    const coverHtml = `
      <div class="cover-page">
        <h1>${book.title}</h1>
        <p class="subtitle">${book.goal}</p>
        <p class="meta">${coverTitle}</p>
        <p class="meta" style="font-size: 12pt; margin-top: 0.5rem;">AI Tutor - Codex Engine</p>
      </div>
    `;

    // 4. Combine all parts into a final HTML document
    const finalHtml = `
      <!DOCTYPE html>
      <html lang="${book.language}">
      <head>
        <meta charset="UTF-8">
        <title>${book.title}</title>
        ${this.generatePDFStyles().replace('content: "Book Title";', `content: "${book.title}";`)}
      </head>
      <body>
        <div class="no-header-footer">${coverHtml}</div>
        <div class="no-header-footer">${tocHtml}</div>
        ${tempDiv.innerHTML}
      </body>
      </html>
    `;

    // 5. Use the print-to-PDF method
    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        // A short delay ensures all fonts and styles are loaded
        setTimeout(() => {
          printWindow.print();
          // Optional: close the window after printing dialog is closed
          // setTimeout(() => printWindow.close(), 1000);
        }, 500);
      };
    } else {
      alert('Please allow pop-ups to print the PDF.');
    }
  }
}

export const pdfService = new PDFGenerationService();
