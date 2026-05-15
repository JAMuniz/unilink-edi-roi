import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportPageToPDF(elementId: string = 'pdf-content', fileName: string = 'export.pdf') {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id "${elementId}" not found`);
      return;
    }

    // Hide the export button temporarily
    const exportButton = document.querySelector('.export-button') as HTMLElement;
    const originalDisplay = exportButton ? exportButton.style.display : null;
    if (exportButton) {
      exportButton.style.display = 'none';
    }

    try {
      // Create canvas from the HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Get dimensions
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      let heightLeft = imgHeight;
      let position = 0;

      // Add pages if content is longer than one page
      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297; // A4 height in mm
        position -= 297;
        if (heightLeft > 0) {
          pdf.addPage();
        }
      }

      // Download the PDF
      pdf.save(fileName);
    } finally {
      // Restore the export button visibility
      if (exportButton && originalDisplay !== null) {
        exportButton.style.display = originalDisplay;
      } else if (exportButton) {
        exportButton.style.display = '';
      }
    }
  } catch (error) {
    console.error('Error exporting to PDF:', error);
  }
}
