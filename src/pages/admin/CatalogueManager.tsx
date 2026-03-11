import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Download, 
  Share2, 
  Loader2, 
  Plus, 
  Image as ImageIcon,
  FileText,
  Mail,
  CheckSquare,
  X,
  Upload,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCategories } from '@/hooks/use-products';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

interface CatalogueSettings {
  name: string;
  description: string;
  includeDescription: boolean;
  includePrices: boolean;
  includeStock: boolean;
  includeSKU: boolean;
  includeQRCodes: boolean;
  categoryFilter: string;
  layout: 'grid' | 'list';
  productsPerPage: number;
  logoUrl: string | null;
  websiteUrl: string;
}

const defaultSettings: CatalogueSettings = {
  name: 'DFSA Dragon Fruit Catalogue',
  description: 'Premium Dragon Fruit Cultivars for African Farmers - Since 2008',
  includeDescription: true,
  includePrices: true,
  includeStock: false,
  includeSKU: true,
  includeQRCodes: true,
  categoryFilter: 'all',
  layout: 'grid',
  productsPerPage: 12,
  logoUrl: null,
  websiteUrl: 'https://africanvibe.co.za',
};

export default function CatalogueManager() {
  const [settings, setSettings] = useState<CatalogueSettings>(defaultSettings);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('African Vibe Product Catalogue');
  const [emailMessage, setEmailMessage] = useState('Please find attached our latest product catalogue.');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useCategories();

  const { data: products, isLoading } = useQuery({
    queryKey: ['catalogue-products', settings.categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('name');

      if (settings.categoryFilter !== 'all') {
        query = query.eq('category_id', settings.categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (products) {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const getSelectedProducts = () => {
    if (!products) return [];
    if (selectedProducts.length === 0) return products;
    return products.filter(p => selectedProducts.includes(p.id));
  };

  // Helper function to load image as base64
  const loadImageAsBase64 = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxSize = 150; // Max dimension for PDF
          let width = img.width;
          let height = img.height;
          
          // Scale down if needed
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(null);
          }
        } catch (e) {
          console.warn('Failed to convert image:', e);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.warn('Failed to load image:', url);
        resolve(null);
      };
      
      // Add cache buster and handle CORS
      const separator = url.includes('?') ? '&' : '?';
      img.src = `${url}${separator}t=${Date.now()}`;
    });
  };

  // Generate QR code as base64
  const generateQRCode = async (url: string): Promise<string | null> => {
    try {
      return await QRCode.toDataURL(url, {
        width: 80,
        margin: 1,
        color: {
          dark: '#333333',
          light: '#ffffff',
        },
      });
    } catch (e) {
      console.warn('Failed to generate QR code:', e);
      return null;
    }
  };

  const generatePDF = async (): Promise<Blob> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const catalogueProducts = getSelectedProducts();
    const margin = 15;
    const headerHeight = 30;
    const footerHeight = 15;
    const contentTop = headerHeight + 10;
    const contentBottom = pageHeight - footerHeight;

    // Colors - Dragon Fruit Theme
    const primaryColor: [number, number, number] = [220, 56, 108]; // Dragon pink
    const accentColor: [number, number, number] = [69, 162, 71]; // Dragon green
    const textColor: [number, number, number] = [51, 51, 51];

    toast.info('Preparing catalogue...');

    // Pre-load logo if set
    let logoBase64: string | null = null;
    if (settings.logoUrl) {
      logoBase64 = await loadImageAsBase64(settings.logoUrl);
    }

    // Pre-load all product images and QR codes
    const imageCache: Record<string, string | null> = {};
    const qrCache: Record<string, string | null> = {};
    
    if (settings.layout === 'grid') {
      const imagePromises = catalogueProducts.map(async (product) => {
        if (product.primary_image_url) {
          const base64 = await loadImageAsBase64(product.primary_image_url);
          imageCache[product.id] = base64;
        }
      });
      await Promise.all(imagePromises);
    }

    // Generate QR codes for all products
    if (settings.includeQRCodes) {
      const qrPromises = catalogueProducts.map(async (product) => {
        const productUrl = `${settings.websiteUrl}/product/${product.slug}`;
        const qr = await generateQRCode(productUrl);
        qrCache[product.id] = qr;
      });
      await Promise.all(qrPromises);
    }

    // Helper to draw page header
    const drawHeader = (title: string, pageNum?: number) => {
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, headerHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, 18);
      if (pageNum !== undefined) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${pageNum}`, pageWidth - 20, 18, { align: 'right' });
      }
    };

    // Helper to draw page footer
    const drawFooter = () => {
      doc.setFontSize(8);
      doc.setTextColor(...accentColor);
      doc.text('DFSA - Dragon Fruit South Africa | www.africanvibe.co.za', pageWidth / 2, pageHeight - 8, { align: 'center' });
    };

    // Cover Page
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Green accent bar
    doc.setFillColor(...accentColor);
    doc.rect(0, pageHeight / 2 - 30, pageWidth, 60, 'F');

    // Logo on cover page (if available)
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 25, 40, 50, 50);
      } catch (e) {
        console.warn('Failed to add logo to PDF:', e);
      }
    }

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    const titleY = logoBase64 ? pageHeight / 2 - 10 : pageHeight / 2 - 10;
    doc.text('DFSA', pageWidth / 2, titleY, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Dragon Fruit South Africa', pageWidth / 2, titleY + 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.name, pageWidth / 2, titleY + 28, { align: 'center' });

    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(settings.description, pageWidth - 40);
    doc.text(descLines, pageWidth / 2, titleY + 40, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA')}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.text(`${catalogueProducts.length} Products`, pageWidth / 2, pageHeight - 22, { align: 'center' });

    // Table of Contents / Product List Page
    doc.addPage();

    // Build table data
    const headers = ['Product'];
    if (settings.includeSKU) headers.push('SKU');
    if (settings.includeDescription) headers.push('Description');
    if (settings.includePrices) headers.push('Price');
    if (settings.includeStock) headers.push('Stock');

    const tableData = catalogueProducts.map(product => {
      const row: string[] = [product.name];
      if (settings.includeSKU) row.push(product.sku);
      if (settings.includeDescription) row.push(product.short_description?.substring(0, 80) || '-');
      if (settings.includePrices) {
        const priceText = product.compare_at_price_zar 
          ? `${formatCurrency(product.price_zar)} (was ${formatCurrency(product.compare_at_price_zar)})`
          : formatCurrency(product.price_zar);
        row.push(priceText);
      }
      if (settings.includeStock) row.push(product.stock_quantity.toString());
      return row;
    });

    let currentPage = 2;

    autoTable(doc, {
      startY: contentTop,
      head: [headers],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: textColor,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [252, 250, 248],
      },
      columnStyles: settings.includeDescription ? {
        0: { cellWidth: 35 },
        2: { cellWidth: 55 },
      } : {},
      margin: { left: margin, right: margin, top: contentTop, bottom: footerHeight + 5 },
      didDrawPage: (data) => {
        drawHeader('Product Catalogue', currentPage);
        drawFooter();
        currentPage++;
      },
    });

    // Detailed product pages with images and QR codes (grid layout)
    if (settings.layout === 'grid') {
      const productsPerPage = 6; // Increased from 4 due to smaller boxes
      const boxWidth = (pageWidth - margin * 3) / 2;
      const boxHeight = 75; // Reduced from 115 to save space
      const imageSize = 35; // Slightly smaller image
      const qrSize = 18; // Smaller QR code
      
      for (let i = 0; i < catalogueProducts.length; i += productsPerPage) {
        doc.addPage();
        drawHeader('Product Details', currentPage);
        
        const productsOnPage = catalogueProducts.slice(i, i + productsPerPage);

        productsOnPage.forEach((product, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const xPos = margin + col * (boxWidth + margin);
          const yPos = contentTop + row * (boxHeight + 8);

          // Ensure we don't overflow the page
          if (yPos + boxHeight > contentBottom) return;

          // Product box with rounded corners
          doc.setDrawColor(...accentColor);
          doc.setLineWidth(0.5);
          doc.roundedRect(xPos, yPos, boxWidth, boxHeight, 3, 3, 'S');

          // Product image
          const imgData = imageCache[product.id];
          if (imgData) {
            try {
              doc.addImage(imgData, 'JPEG', xPos + 4, yPos + 4, imageSize, imageSize);
            } catch (e) {
              // Draw placeholder if image fails
              doc.setFillColor(240, 240, 240);
              doc.rect(xPos + 4, yPos + 4, imageSize, imageSize, 'F');
              doc.setFontSize(6);
              doc.setTextColor(150, 150, 150);
              doc.text('No Image', xPos + 4 + imageSize / 2, yPos + 4 + imageSize / 2, { align: 'center' });
            }
          } else {
            // Placeholder box
            doc.setFillColor(245, 245, 245);
            doc.rect(xPos + 4, yPos + 4, imageSize, imageSize, 'F');
            doc.setFontSize(6);
            doc.setTextColor(150, 150, 150);
            doc.text('No Image', xPos + 4 + imageSize / 2, yPos + 4 + imageSize / 2, { align: 'center' });
          }

          const textX = xPos + imageSize + 8;
          const textWidth = boxWidth - imageSize - (settings.includeQRCodes ? qrSize + 16 : 12);

          // QR Code and SKU (top right of box - side by side)
          if (settings.includeQRCodes) {
            const qrX = xPos + boxWidth - qrSize - 4;
            const qrData = qrCache[product.id];
            if (qrData) {
              try {
                doc.addImage(qrData, 'PNG', qrX, yPos + 4, qrSize, qrSize);
                // SKU next to QR code (left of QR)
                if (settings.includeSKU) {
                  doc.setFontSize(5);
                  doc.setTextColor(100, 100, 100);
                  doc.text(`SKU: ${product.sku}`, qrX + qrSize / 2, yPos + qrSize + 7, { align: 'center' });
                }
                doc.setFontSize(5);
                doc.setTextColor(120, 120, 120);
                doc.text('Scan to view', qrX + qrSize / 2, yPos + qrSize + 11, { align: 'center' });
              } catch (e) {
                console.warn('Failed to add QR code:', e);
              }
            }
          } else if (settings.includeSKU) {
            // SKU without QR code
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.text(`SKU: ${product.sku}`, xPos + boxWidth - 4, yPos + 10, { align: 'right' });
          }

          // Product name (with word wrap)
          doc.setTextColor(...primaryColor);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          const nameLines = doc.splitTextToSize(product.name, textWidth);
          doc.text(nameLines.slice(0, 2), textX, yPos + 10);

          let textY = yPos + 10 + (Math.min(nameLines.length, 2) * 4);

          // Description (compact, below name)
          if (settings.includeDescription && product.short_description) {
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            const desc = product.short_description.substring(0, 70);
            const descLines = doc.splitTextToSize(desc, textWidth);
            doc.text(descLines.slice(0, 2), textX, textY + 2);
          }

          // Price (bottom left of box)
          if (settings.includePrices) {
            doc.setTextColor(...primaryColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(product.price_zar), xPos + 4, yPos + boxHeight - 6);

            if (product.compare_at_price_zar) {
              doc.setTextColor(150, 150, 150);
              doc.setFontSize(7);
              doc.setFont('helvetica', 'normal');
              doc.text(`Was: ${formatCurrency(product.compare_at_price_zar)}`, xPos + 38, yPos + boxHeight - 6);
            }
          }

          // Stock indicator (bottom right)
          if (settings.includeStock) {
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.text(`Stock: ${product.stock_quantity}`, xPos + boxWidth - 4, yPos + boxHeight - 6, { align: 'right' });
          }
        });

        drawFooter();
        currentPage++;
      }
    }

    // Contact page
    doc.addPage();
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(...accentColor);
    doc.rect(0, pageHeight / 2 - 50, pageWidth, 100, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Contact Us', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('orders@proagrisa.co.za', pageWidth / 2, pageHeight / 2, { align: 'center' });
    doc.text('+27 83 447 4639', pageWidth / 2, pageHeight / 2 + 12, { align: 'center' });
    doc.text('South Africa', pageWidth / 2, pageHeight / 2 + 24, { align: 'center' });

    doc.setFontSize(10);
    doc.text('www.africanvibe.co.za', pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });

    return doc.output('blob');
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePDF();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${settings.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Catalogue downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate catalogue');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo) {
      toast.error('Please enter an email address');
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generatePDF();
      const base64 = await blobToBase64(blob);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            to: emailTo,
            subject: emailSubject,
            html: `<p>${emailMessage}</p><p>Best regards,<br>African Vibe Team</p>`,
            attachments: [
              {
                filename: `${settings.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
                content: base64.split(',')[1],
                encoding: 'base64',
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast.success('Catalogue sent successfully!');
      setShowEmailDialog(false);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send catalogue');
    } finally {
      setIsGenerating(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Catalogue Manager
          </h1>
          <p className="text-muted-foreground">
            Create and share product catalogues as PDF
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGenerating || !products?.length}
            className="btn-sunset"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
          <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!products?.length}>
                <Mail className="h-4 w-4 mr-2" />
                Send via Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Catalogue via Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="customer@example.com"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSendEmail}
                  disabled={isGenerating}
                  className="w-full btn-sunset"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Send Catalogue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Catalogue Settings</CardTitle>
            <CardDescription>Customize your catalogue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Catalogue Name</Label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Category Filter</Label>
              <Select
                value={settings.categoryFilter}
                onValueChange={(v) => setSettings({ ...settings, categoryFilter: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={settings.layout}
                onValueChange={(v: 'grid' | 'list') => setSettings({ ...settings, layout: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="grid">Grid View (with details)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Include in Catalogue</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.includeDescription}
                    onCheckedChange={(c) => setSettings({ ...settings, includeDescription: !!c })}
                  />
                  <span className="text-sm">Product Descriptions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.includePrices}
                    onCheckedChange={(c) => setSettings({ ...settings, includePrices: !!c })}
                  />
                  <span className="text-sm">Prices</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.includeSKU}
                    onCheckedChange={(c) => setSettings({ ...settings, includeSKU: !!c })}
                  />
                  <span className="text-sm">SKU Numbers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.includeStock}
                    onCheckedChange={(c) => setSettings({ ...settings, includeStock: !!c })}
                  />
                  <span className="text-sm">Stock Levels</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.includeQRCodes}
                    onCheckedChange={(c) => setSettings({ ...settings, includeQRCodes: !!c })}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <QrCode className="h-3 w-3" />
                    QR Codes
                  </span>
                </label>
              </div>
            </div>

            {/* Website URL for QR codes */}
            <div className="space-y-2">
              <Label>Website URL (for QR codes)</Label>
              <Input
                value={settings.websiteUrl}
                onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
                placeholder="https://yourdomain.com"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Cover Logo</Label>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setSettings({ ...settings, logoUrl: e.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {settings.logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings({ ...settings, logoUrl: null })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {settings.logoUrl && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={settings.logoUrl}
                    alt="Logo preview"
                    className="h-16 w-auto object-contain rounded border"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Products</CardTitle>
                <CardDescription>
                  {selectedProducts.length > 0 
                    ? `${selectedProducts.length} products selected`
                    : `${products?.length || 0} products (all included by default)`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllProducts}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Select All
                </Button>
                {selectedProducts.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {products?.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedProducts.includes(product.id) || selectedProducts.length === 0
                          ? 'border-primary bg-primary/5'
                          : 'border-border opacity-50'
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <div className="flex items-start gap-3">
                        {product.primary_image_url ? (
                          <img
                            src={product.primary_image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency(product.price_zar)}
                          </p>
                        </div>
                        <Checkbox
                          checked={selectedProducts.includes(product.id) || selectedProducts.length === 0}
                          className="mt-1"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
