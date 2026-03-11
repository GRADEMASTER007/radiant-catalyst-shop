import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuotationItem {
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface QuotationData {
  quotation_number: string;
  customer_name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  billing_address?: string;
  items: QuotationItem[];
  subtotal_zar: number;
  vat_zar: number;
  total_zar: number;
  vat_enabled: boolean;
  notes?: string;
  created_at: string;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

export function generateQuotationPDF(data: QuotationData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const primaryColor: [number, number, number] = [194, 88, 50];
  const goldColor: [number, number, number] = [212, 175, 55];
  const textColor: [number, number, number] = [51, 51, 51];
  const mutedColor: [number, number, number] = [128, 128, 128];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('African Vibe', 20, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Authentic African Craftsmanship', 20, 33);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth - 20, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${data.quotation_number}`, pageWidth - 20, 28, { align: 'right' });
  doc.text(formatDate(data.created_at), pageWidth - 20, 35, { align: 'right' });

  doc.setTextColor(...textColor);
  let yPos = 60;

  // Customer details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Quote To:', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (data.customer_name) { doc.text(data.customer_name, 20, yPos); yPos += 5; }
  if (data.company_name) { doc.text(data.company_name, 20, yPos); yPos += 5; }
  if (data.email) { doc.text(data.email, 20, yPos); yPos += 5; }
  if (data.phone) { doc.text(data.phone, 20, yPos); yPos += 5; }
  if (data.billing_address) {
    const lines = doc.splitTextToSize(data.billing_address, 80);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 5;
  }

  // Company details on the right
  let rightY = 60;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', pageWidth / 2 + 10, rightY);
  rightY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('African Vibe', pageWidth / 2 + 10, rightY); rightY += 5;
  doc.text('orders@proagrisa.co.za', pageWidth / 2 + 10, rightY); rightY += 5;
  doc.text('+27 83 447 4639', pageWidth / 2 + 10, rightY); rightY += 5;
  doc.text('South Africa', pageWidth / 2 + 10, rightY);

  yPos = Math.max(yPos, rightY) + 15;

  // Items table
  const tableData = data.items.map(item => [
    item.product_name,
    item.product_sku,
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.total_price),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Product', 'SKU', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: { fillColor: [245, 240, 235], textColor, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: { fillColor: [252, 250, 248] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pageWidth - 80;
  let totalsY = finalY;

  // Subtotal
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal:', totalsX, totalsY);
  doc.setTextColor(...textColor);
  doc.text(formatCurrency(data.subtotal_zar), pageWidth - 20, totalsY, { align: 'right' });

  // VAT
  if (data.vat_enabled && data.vat_zar > 0) {
    totalsY += 7;
    doc.setTextColor(...mutedColor);
    doc.text('VAT (15%):', totalsX, totalsY);
    doc.setTextColor(...textColor);
    doc.text(formatCurrency(data.vat_zar), pageWidth - 20, totalsY, { align: 'right' });
  }

  // Total line
  totalsY += 5;
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 10, totalsY, pageWidth - 20, totalsY);

  totalsY += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Total:', totalsX, totalsY);
  doc.text(formatCurrency(data.total_zar), pageWidth - 20, totalsY, { align: 'right' });

  // Notes
  if (data.notes) {
    totalsY += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('Notes:', 20, totalsY);
    totalsY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(noteLines, 20, totalsY);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('This quotation is valid for 30 days from the date of issue.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('orders@proagrisa.co.za | +27 83 447 4639 | South Africa', pageWidth / 2, footerY + 7, { align: 'center' });

  doc.save(`quotation-${data.quotation_number}.pdf`);
}
