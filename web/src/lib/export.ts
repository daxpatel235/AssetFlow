import type { Column } from '@/components/ui/DataTable';
import type { Asset } from '@/lib/mock/assetflow';
import { generateSecureQRPayload } from '@/lib/qr';

function cellText<T>(col: Column<T>, row: T): string {
  if (col.exportValue) return String(col.exportValue(row));
  const v = (row as Record<string, unknown>)[col.key];
  if (v == null) return '';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

function exportable<T>(columns: Column<T>[]): Column<T>[] {
  return columns.filter((c) => c.export !== false);
}

export async function download(blob: Blob, filename: string) {
  const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
  const mime = blob.type || 'application/octet-stream';

  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: ext ? [{ description: `${ext.slice(1).toUpperCase()} file`, accept: { [mime]: [ext] } }] : undefined,
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (e: any) {
      if (e && e.name === 'AbortError') return false; // user canceled
    }
  }

  // Fallback
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportToCSV<T>(columns: Column<T>[], rows: T[], name = 'export') {
  const cols = exportable(columns);
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = cols.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => cols.map((c) => esc(cellText(c, r))).join(',')).join('\n');
  download(new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' }), `${name}-${stamp()}.csv`);
}

export async function exportToExcel<T>(columns: Column<T>[], rows: T[], name = 'export') {
  const ExcelJS = (await import('exceljs')).default;
  const cols = exportable(columns);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(name.slice(0, 31) || 'Sheet1');
  ws.columns = cols.map((c) => ({ header: c.label, key: c.key, width: 20 }));
  ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow(Object.fromEntries(cols.map((c) => [c.key, cellText(c, r)])));
  const buffer = await wb.xlsx.writeBuffer();
  download(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${name}-${stamp()}.xlsx`);
}

export async function exportToPDF<T>(columns: Column<T>[], rows: T[], name = 'export', title?: string) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const cols = exportable(columns);
  const doc = new jsPDF({ orientation: cols.length > 5 ? 'landscape' : 'portrait' });
  doc.setFontSize(14);
  doc.text(title || name, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [cols.map((c) => c.label)],
    body: rows.map((r) => cols.map((c) => cellText(c, r))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [124, 58, 237] },
  });
  download(doc.output('blob'), `${name}-${stamp()}.pdf`);
}

export async function downloadAssetDocumentPdf(asset: Asset, docName: string) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 42;
  let y = 60;

  doc.setFontSize(22).setTextColor(15, 23, 42);
  doc.text('AssetFlow', M, y);
  doc.setFontSize(14).setTextColor(100, 116, 139);
  doc.text(docName.replace('.pdf', '').toUpperCase(), W - M, y, { align: 'right' });
  
  y += 40;
  doc.setDrawColor(226, 232, 240).line(M, y, W - M, y);
  y += 30;

  doc.setFontSize(10).setTextColor(100, 116, 139);
  doc.text('ASSET TAG', M, y);
  doc.text('NAME', M + 150, y);
  doc.text('LOCATION', W - M, y, { align: 'right' });
  
  y += 15;
  doc.setFontSize(12).setTextColor(15, 23, 42);
  doc.text(asset.tag, M, y);
  doc.text(asset.name, M + 150, y);
  doc.text(asset.location || '—', W - M, y, { align: 'right' });
  
  y += 50;

  if (docName.toLowerCase().includes('invoice')) {
    doc.setFontSize(10).setTextColor(100, 116, 139);
    doc.text('ACQUISITION DATE', M, y);
    doc.text('ACQUISITION COST', W - M, y, { align: 'right' });
    y += 15;
    doc.setFontSize(12).setTextColor(15, 23, 42);
    doc.text(asset.acquisitionDate || '—', M, y);
    doc.text(`$${asset.acquisitionCost.toLocaleString()}`, W - M, y, { align: 'right' });
    
    y += 50;
    doc.setFontSize(10).setTextColor(100, 116, 139);
    doc.text('DESCRIPTION', M, y);
    doc.text('AMOUNT', W - M, y, { align: 'right' });
    y += 10;
    doc.setDrawColor(226, 232, 240).line(M, y, W - M, y);
    y += 20;
    doc.setFontSize(10).setTextColor(15, 23, 42);
    doc.text(`1x ${asset.name}`, M, y);
    doc.text(`$${asset.acquisitionCost.toLocaleString()}`, W - M, y, { align: 'right' });
  } else if (docName.toLowerCase().includes('warranty')) {
    doc.setFontSize(10).setTextColor(100, 116, 139);
    doc.text('WARRANTY EXPIRATION', M, y);
    doc.text('STATUS', W - M, y, { align: 'right' });
    y += 15;
    doc.setFontSize(12).setTextColor(15, 23, 42);
    doc.text(asset.warrantyEnds || 'Lifetime', M, y);
    doc.text(asset.warrantyEnds ? 'Active' : 'N/A', W - M, y, { align: 'right' });
    y += 40;
    doc.setFontSize(10).setTextColor(15, 23, 42);
    doc.text('This certificate guarantees that the asset is covered under the manufacturer warranty.', M, y);
  } else {
    doc.setFontSize(10).setTextColor(15, 23, 42);
    doc.text('This document contains the official user guidelines and safety instructions.', M, y);
    doc.text(`Model: ${asset.serial || 'Standard'}`, M, y + 20);
  }

  doc.setFontSize(8).setTextColor(148, 163, 184);
  doc.text('Generated by AssetFlow. Document is valid without signature.', W / 2, doc.internal.pageSize.getHeight() - 40, { align: 'center' });

  return download(doc.output('blob'), docName);
}

export function generateQRSvgBlob(seed: string): Blob {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const n = 11;
  const out: boolean[] = [];
  for (let i = 0; i < n * n; i++) { h = (h * 1103515245 + 12345) & 0x7fffffff; out.push((h & 1) === 1); }

  let rects = '';
  for (let i = 0; i < n * n; i++) {
    if (out[i]) {
      rects += `<rect x="${i % n}" y="${Math.floor(i / n)}" width="1" height="1" fill="#0f172a" />`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="512" height="512"><rect width="100%" height="100%" fill="#ffffff"/>${rects}</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

export async function exportQRLabelsPDF(assets: Asset[], name = 'qr-labels') {
  const { default: jsPDF } = await import('jspdf');
  const QRCode = (await import('qrcode')).default;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const cols = 3;
  const rows = 7;
  const marginX = 30;
  const marginY = 40;
  const spacingX = 15;
  const spacingY = 25;
  const labelWidth = (pageWidth - marginX * 2 - spacingX * (cols - 1)) / cols;
  const labelHeight = (pageHeight - marginY * 2 - spacingY * (rows - 1)) / rows;

  let x = marginX;
  let y = marginY;
  let col = 0;
  let row = 0;

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, labelWidth, labelHeight, 4, 4);

    const payload = generateSecureQRPayload(asset.tag);
    const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });

    const qrSize = labelHeight - 30;
    const qrX = x + (labelWidth - qrSize) / 2;
    const qrY = y + 5;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setFontSize(10).setTextColor(15, 23, 42);
    doc.text(asset.tag, x + labelWidth / 2, y + qrSize + 14, { align: 'center' });
    
    doc.setFontSize(8).setTextColor(100, 116, 139);
    let displayName = asset.name;
    if (displayName.length > 25) displayName = displayName.substring(0, 22) + '...';
    doc.text(displayName, x + labelWidth / 2, y + qrSize + 24, { align: 'center' });

    col++;
    if (col >= cols) {
      col = 0;
      row++;
      x = marginX;
      y += labelHeight + spacingY;
    } else {
      x += labelWidth + spacingX;
    }

    if (row >= rows && i < assets.length - 1) {
      doc.addPage();
      col = 0;
      row = 0;
      x = marginX;
      y = marginY;
    }
  }

  return download(doc.output('blob'), `${name}-${stamp()}.pdf`);
}

export const printPage = () => window.print();
