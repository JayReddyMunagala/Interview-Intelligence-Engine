import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportData {
  title: string;
  date: string;
  userName?: string;
  targetRole?: string;
  analysisType: string;
  overallScore: number;
  duration: string;
  metrics: any;
  feedback: any;
  transcript: string;
}

class ExportService {
  async exportToPDF(data: ExportData, chartElement?: HTMLElement): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const usableWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add text with automatic line wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6, fontSize: number = 10) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Header with Branding
    pdf.setFillColor(59, 130, 246); // Blue background
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255); // White text
    pdf.text('Interview Intelligence', margin, 20);
    
    pdf.setFontSize(14);
    pdf.text('AI-Powered Interview Analysis Report', margin, 32);
    
    yPosition = 50;

    // Personal Information Section
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    if (data.userName) {
      pdf.text(`Candidate: ${data.userName}`, margin, yPosition);
      yPosition += 10;
    }
    
    if (data.targetRole) {
      pdf.text(`Target Role: ${data.targetRole}`, margin, yPosition);
      yPosition += 10;
    }
    
    yPosition += 5;

    // Analysis Meta Information
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${data.date}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Analysis Type: ${data.analysisType}`, margin, yPosition);
    yPosition += 15;

    // Overall Score Section with Enhanced Styling
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Overall Performance', margin, yPosition);
    yPosition += 10;

    // Enhanced Score box with performance indicators
    const scoreColor = data.overallScore >= 80 ? [34, 197, 94] : 
                     data.overallScore >= 60 ? [245, 158, 11] : [239, 68, 68];
    const scoreLabel = data.overallScore >= 80 ? 'Excellent' : 
                      data.overallScore >= 60 ? 'Good' : 'Needs Improvement';
                      
    pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.rect(margin, yPosition, 50, 20, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text(`${data.overallScore}/100`, margin + 8, yPosition + 10);
    pdf.setFontSize(10);
    pdf.text(scoreLabel, margin + 8, yPosition + 17);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.text(`Duration: ${data.duration}`, margin + 60, yPosition + 8);
    pdf.text(`Analysis Date: ${data.date}`, margin + 60, yPosition + 16);
    yPosition += 30;

    // Metrics Section
    pdf.setFontSize(14);
    pdf.text('Performance Metrics', margin, yPosition);
    yPosition += 10;

    const metrics = [
      [`Speaking Rate: ${data.metrics.wordsPerMinute} words/min`, `Confidence: ${data.metrics.confidenceScore}%`],
      [`Clarity: ${data.metrics.clarityScore}%`, `Professionalism: ${data.metrics.professionalismScore}%`],
      [`Relevance: ${data.metrics.relevanceScore}%`, `Filler Words: ${data.metrics.fillerWords}`]
    ];

    pdf.setFontSize(10);
    metrics.forEach(([left, right]) => {
      pdf.text(left, margin, yPosition);
      pdf.text(right, margin + usableWidth/2, yPosition);
      yPosition += 6;
    });
    yPosition += 10;

    // Add chart if provided
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, { 
          scale: 1,
          useCORS: true,
          allowTaint: true 
        });
        const chartImgData = canvas.toDataURL('image/png');
        pdf.addImage(chartImgData, 'PNG', margin, yPosition, usableWidth * 0.6, 60);
        yPosition += 70;
      } catch (error) {
        console.warn('Could not add chart to PDF:', error);
      }
    }

    // Check if we need a new page
    if (yPosition > 250) {
      pdf.addPage();
      
      // Add header to new page
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 20, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Interview Intelligence - Analysis Report (continued)', margin, 14);
      
      yPosition = margin;
    }

    // Feedback Sections
    const feedbackSections = [
      { title: 'Strengths', items: data.feedback.strengths, color: [34, 197, 94] },
      { title: 'Areas for Improvement', items: data.feedback.improvements, color: [245, 158, 11] },
      { title: 'Suggestions', items: data.feedback.suggestions, color: [59, 130, 246] }
    ];

    feedbackSections.forEach(section => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(section.color[0], section.color[1], section.color[2]);
      pdf.text(section.title, margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      section.items.forEach((item: string, index: number) => {
        const bulletText = `• ${item}`;
        yPosition = addWrappedText(bulletText, margin + 5, yPosition, usableWidth - 10, 5);
        yPosition += 2;
      });
      yPosition += 5;
    });

    // Transcript Section
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Interview Transcript', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    yPosition = addWrappedText(data.transcript, margin, yPosition, usableWidth, 4);

    // Footer with branding
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Generated by Interview Intelligence - AI-Powered Interview Analysis Platform', margin, pageHeight - 10);
    pdf.text(`© ${new Date().getFullYear()} Interview Intelligence. Confidential interview analysis report.`, margin, pageHeight - 5);

    // Generate filename with user info
    const userPart = data.userName ? `-${data.userName.replace(/\s+/g, '-')}` : '';
    const rolePart = data.targetRole ? `-${data.targetRole.replace(/\s+/g, '-')}` : '';
    const fileName = `Interview-Analysis${userPart}${rolePart}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    console.log('📄 PDF report exported successfully');
  }

  exportToJSON(data: ExportData): void {
    // Add additional metadata for JSON export
    const enhancedData = {
      ...data,
      exportMetadata: {
        platform: 'Interview Intelligence',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        format: 'JSON'
      }
    };
    
    const jsonBlob = new Blob([JSON.stringify(enhancedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    
    const userPart = data.userName ? `-${data.userName.replace(/\s+/g, '-')}` : '';
    const rolePart = data.targetRole ? `-${data.targetRole.replace(/\s+/g, '-')}` : '';
    a.download = `Interview-Data${userPart}${rolePart}-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📊 JSON data exported successfully');
  }
}

export const exportService = new ExportService();