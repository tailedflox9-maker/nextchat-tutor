import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { BookProject } from '../types/book';

class PDFGenerationService {
  private selectedLanguage: 'en' | 'mr' = 'en';
  private isGenerating = false;

  public setLanguage(language: 'en' | 'mr') {
    this.selectedLanguage = language;
  }
  
  private generateStyles(bookTitle: string): string {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora:wght@400;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Lora', serif;
          line-height: 1.6;
          color: #1a1a1a;
          font-size: 11pt;
          background-color: #fff;
        }
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 1in;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
          page-break-after: always;
        }
        
        h1, h2, h3, h4 { font-family: 'Inter', sans-serif; color: #1e293b; font-weight: 700; line-height: 1.3; }
        h1 { font-size: 26pt; text-align: center; margin-bottom: 1.5rem; }
        h2 { font-size: 20pt; margin-top: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid #cbd5e1; page-break-before: always; }
        h3 { font-size: 16pt; margin-top: 1.5rem; color: #334155; }
        p { margin-bottom: 1rem; text-align: justify; }
        
        ul, ol { margin-left: 1.5rem; margin-bottom: 1rem; }
        li { margin-bottom: 0.5rem; }

        code { font-family: 'Courier New', monospace; background-color: #f1f5f9; padding: 2px 5px; border-radius: 4px; font-size: 0.9em; color: #475569; }
        pre { background-color: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 6px; margin: 1.5rem 0; font-size: 0.9em; white-space: pre-wrap; word-wrap: break-word; }
        
        table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; page-break-inside: avoid; }
        th, td { border: 1px solid #cbd5e1; padding: 0.75rem; text-align: left; }
        th { background-color: #f1f5f9; font-family: 'Inter', sans-serif; font-weight: 600; }
        
        .cover-page { justify-content: center; align-items: center; text-align: center; background-color: #f8fafc; height: 297mm; }
        .cover-page h1 { font-size: 36pt; color: #000; border: none; }
        .cover-page .subtitle { font-size: 14pt; color: #475569; margin-top: 0.5rem; margin-bottom: 3rem; }
        .cover-page .meta { font-size: 10pt; color: #64748b; }
        
        .toc-page { height: 297mm; }
        .toc-page h2 { border: none; text-align: center; margin-bottom: 2rem; }
        .toc-page ul { list-style: none; padding: 0; width: 100%; }
        .toc-page li { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dotted #cbd5e1; }
        .toc-page a { text-decoration: none; color: #1e3a8a; }
      </style>
    `;
  }

  private async convertMarkdownToHtml(markdown: string): Promise<string> {
    const { marked } = await import('marked');
    return marked.parse(markdown);
  }

  public async generatePDF(book: BookProject): Promise<void> {
    if (this.isGenerating || !book.finalBook) return;
    this.isGenerating = true;

    try {
      const mainContentHtml = await this.convertMarkdownToHtml(book.finalBook);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = mainContentHtml;

      const tocItems: { text: string; id: string }[] = [];
      tempDiv.querySelectorAll('h2').forEach((h2, index) => {
        const id = `chapter-${index + 1}`;
        h2.id = id;
        tocItems.push({ text: h2.textContent || `Chapter ${index + 1}`, id });
      });
      const tocHtml = `<div class="page toc-page"><h2>${this.selectedLanguage === 'en' ? 'Table of Contents' : 'अनुक्रमणिका'}</h2><ul>${tocItems.map(item => `<li><a href="#${item.id}">${item.text}</a></li>`).join('')}</ul></div>`;
      
      const coverHtml = `<div class="page cover-page"><div><h1>${book.title}</h1><p class="subtitle">${book.goal}</p><p class="meta">${this.selectedLanguage === 'en' ? 'A Learning Guide by' : 'द्वारा एक शिक्षण मार्गदर्शक'}</p><p class="meta" style="font-size: 12pt; margin-top: 0.5rem;">AI Tutor - Codex Engine</p></div></div>`;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '210mm';
      iframe.style.height = '1px'; // Keep it small
      iframe.style.border = '0';
      iframe.style.left = '-9999px'; // Hide it far off-screen
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow!.document;
      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html><html><head>${this.generateStyles(book.title)}</head><body><div id="render-container" style="display: inline-block;">${coverHtml}${tocHtml}${tempDiv.innerHTML}</div></body></html>`);
      iframeDoc.close();

      await new Promise(resolve => {
        const checkReady = () => {
          if (iframeDoc.readyState === 'complete') {
             setTimeout(resolve, 2000); // Extra delay for fonts
          } else {
             setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });

      const renderContainer = iframeDoc.getElementById('render-container')!;
      const totalHeight = renderContainer.scrollHeight;
      const pageHeight = 1122; // A4 height in points at 72dpi
      const totalPages = Math.ceil(totalHeight / pageHeight);
      
      const doc = new jsPDF('p', 'pt', 'a4');

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) doc.addPage();
        
        const canvas = await html2canvas(renderContainer, {
          scale: 2,
          y: i * pageHeight,
          height: pageHeight,
          windowHeight: pageHeight,
          useCORS: true,
          allowTaint: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, 595.28, 841.89); // A4 size in points
        
        if (i > 1) { // Skip for cover and ToC
            doc.setFont('Inter', 'normal');
            doc.setFontSize(9);
            doc.setTextColor('#64748b');
            doc.text(book.title, 40, 40);
            doc.text(`Page ${i + 1}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 40, { align: 'right' });
        }
      }

      doc.save(`${book.title.replace(/ /g, '_')}_book.pdf`);
      document.body.removeChild(iframe);

    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("There was an error creating the PDF. Please try again.");
    } finally {
      this.isGenerating = false;
    }
  }
}

export const pdfService = new PDFGenerationService();
