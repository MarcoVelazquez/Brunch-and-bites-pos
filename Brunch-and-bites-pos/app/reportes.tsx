import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Platform, useWindowDimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";
import ProtectedLayout from './components/ProtectedLayout';
import { openDB, getAllSales, getSaleItems, getAllProducts, getAllExpenses } from './lib/database.refactor';
import type { Sale, SaleItem, Product } from './lib/database.types';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface ReporteSales {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface ReporteExpenses {
  description: string;
  amount: number;
  expense_date: string;
}

interface ReporteSummary {
  totalSales: number;
  totalExpenses: number;
  profit: number;
  topProduct: string;
  salesCount: number;
}

export default function ReportesScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isSmallMobile = width < 400;
  
  const [tipoReporte, setTipoReporte] = useState("ventas");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFinPicker, setShowFinPicker] = useState(false);
  
  const [salesReports, setSalesReports] = useState<ReporteSales[]>([]);
  const [summary, setSummary] = useState<ReporteSummary>({
    totalSales: 0,
    totalExpenses: 0,
    profit: 0,
    topProduct: '',
    salesCount: 0
  });
  const [loading, setLoading] = useState(false);

  // Cargar datos al inicializar
  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const db = await openDB();
      
      if (tipoReporte === "ventas") {
        await generateSalesReport(db);
      } else if (tipoReporte === "resumen") {
        await generateSummaryReport(db);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el reporte');
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const onChangeInicio = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowInicioPicker(false);
      return;
    }
    if (selectedDate) {
      setFechaInicio(formatDate(selectedDate));
    }
    if (Platform.OS !== 'ios') setShowInicioPicker(false);
  };

  const onChangeFin = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowFinPicker(false);
      return;
    }
    if (selectedDate) {
      setFechaFin(formatDate(selectedDate));
    }
    if (Platform.OS !== 'ios') setShowFinPicker(false);
  };

  // Generador simple de gráficas de barras en SVG para incrustar en el PDF sin dependencias
  const buildBarChartSvg = (
    labels: string[],
    values: number[],
    opts?: { width?: number; height?: number; color?: string; title?: string }
  ) => {
    const width = opts?.width ?? 800;
    const height = opts?.height ?? 400;
    const color = opts?.color ?? '#38b24d';
    const title = opts?.title ?? '';
    const margin = { top: 40, right: 24, bottom: 60, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const maxVal = Math.max(1, ...values);
    const barCount = Math.max(1, values.length);
    const gap = 8;
    const barW = Math.max(1, (innerW - gap * (barCount - 1)) / barCount);

    // Ejes y líneas guía (5 ticks)
    const ticks = 5;
    const gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
      const y = margin.top + (innerH * i) / ticks;
      const val = Math.round((maxVal * (ticks - i)) / ticks);
      return `
        <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#eee" />
        <text x="${margin.left - 8}" y="${y + 4}" text-anchor="end" font-size="12" fill="#666">${val}</text>
      `;
    }).join('');

    // Barras
    const bars = values.map((v, i) => {
      const h = (v / maxVal) * innerH;
      const x = margin.left + i * (barW + gap);
      const y = margin.top + (innerH - h);
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${Math.max(0, h)}" fill="${color}" rx="3" />
      `;
    }).join('');

    // Etiquetas X (rotadas 45° si son muchas)
    const xLabels = labels.map((lbl, i) => {
      const text = (lbl || '').toString();
      const trimmed = text.length > 14 ? text.slice(0, 12) + '…' : text;
      const x = margin.left + i * (barW + gap) + barW / 2;
      const y = height - margin.bottom + 28;
      return `
        <text x="${x}" y="${y}" font-size="12" fill="#444" text-anchor="middle" transform="rotate(0, ${x}, ${y})">${trimmed.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>
      `;
    }).join('');

    const titleEl = title
      ? `<text x="${width / 2}" y="${margin.top - 12}" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">${title}</text>`
      : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="#ffffff" />
        ${titleEl}
        <!-- Eje Y y líneas guía -->
        ${gridLines}
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#ccc" />
        <!-- Eje X -->
        <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#ccc" />
        <!-- Barras -->
        ${bars}
        <!-- Etiquetas X -->
        ${xLabels}
      </svg>
    `;
  };

  // Gráfica de barras agrupadas (multi-series) para comparar, p. ej., Ventas vs Gastos por día
  const buildGroupedBarChartSvg = (
    labels: string[],
    series: { name: string; values: number[]; color: string }[],
    opts?: { width?: number; height?: number; title?: string }
  ) => {
    const width = opts?.width ?? 860;
    const height = opts?.height ?? 420;
    const title = opts?.title ?? '';
    const margin = { top: 48, right: 24, bottom: 80, left: 64 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const groupCount = Math.max(1, labels.length);
    const seriesCount = Math.max(1, series.length);
    const valuesFlat = series.flatMap(s => s.values);
    const maxVal = Math.max(1, ...valuesFlat);
    const gapGroup = 12;
    const gapBar = 6;
    const groupW = Math.max(1, (innerW - gapGroup * (groupCount - 1)) / groupCount);
    const barW = Math.max(1, (groupW - gapBar * (seriesCount - 1)) / seriesCount);

    // Líneas guía y ticks
    const ticks = 5;
    const gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
      const y = margin.top + (innerH * i) / ticks;
      const val = Math.round((maxVal * (ticks - i)) / ticks);
      return `
        <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#eee" />
        <text x="${margin.left - 8}" y="${y + 4}" text-anchor="end" font-size="12" fill="#666">${val}</text>
      `;
    }).join('');

    const bars = labels.map((_, gi) => {
      const xGroup = margin.left + gi * (groupW + gapGroup);
      return series.map((s, si) => {
        const v = s.values[gi] ?? 0;
        const h = (v / maxVal) * innerH;
        const x = xGroup + si * (barW + gapBar);
        const y = margin.top + (innerH - h);
        return `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(0, h)}" fill="${s.color}" rx="3" />`;
      }).join('');
    }).join('');

    const xLabels = labels.map((lbl, gi) => {
      const text = (lbl || '').toString();
      const trimmed = text.length > 12 ? text.slice(5) : text; // si es YYYY-MM-DD, mostramos MM-DD
      const x = margin.left + gi * (groupW + gapGroup) + groupW / 2;
      const y = height - margin.bottom + 30;
      return `<text x="${x}" y="${y}" font-size="12" fill="#444" text-anchor="middle">${trimmed.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>`;
    }).join('');

    const legend = series.map((s, i) => {
      const lx = margin.left + i * 140;
      const ly = margin.top - 20;
      return `
        <rect x="${lx}" y="${ly - 10}" width="14" height="14" fill="${s.color}" />
        <text x="${lx + 20}" y="${ly + 2}" font-size="12" fill="#333">${s.name}</text>
      `;
    }).join('');

    const titleEl = title
      ? `<text x="${width / 2}" y="${margin.top - 28}" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">${title}</text>`
      : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="#ffffff" />
        ${titleEl}
        ${legend}
        ${gridLines}
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#ccc" />
        <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#ccc" />
        ${bars}
        ${xLabels}
      </svg>
    `;
  };

  const exportToPDF = async () => {
    try {
      let html = '';
      const fechaActual = new Date().toLocaleString('es-ES');
      const periodo = fechaInicio && fechaFin 
        ? `Del ${fechaInicio} al ${fechaFin}` 
        : fechaInicio 
          ? `Desde ${fechaInicio}` 
          : fechaFin 
            ? `Hasta ${fechaFin}` 
            : 'Todos los registros';

      // Preparar gráfica según el tipo de reporte
      let chartSvg = '';
      let chartSvgVentas = '';
      if (tipoReporte === 'ventas' && salesReports.length > 0) {
        // Top 10 por cantidad (ya vienen ordenados por cantidad desc en la UI)
        const topQty = salesReports.slice(0, 10);
        const labelsQty = topQty.map(r => r.productName);
        const valuesQty = topQty.map(r => r.totalQuantity);
        const qtySvg = buildBarChartSvg(labelsQty, valuesQty, { color: '#38b24d', title: 'Cantidades vendidas (Top 10)' });

        // Top 10 por ingresos (ordenar por revenue desc)
        const topRev = salesReports.slice().sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
        const labelsRev = topRev.map(r => r.productName);
        const valuesRev = topRev.map(r => r.totalRevenue);
        const revSvg = buildBarChartSvg(labelsRev, valuesRev, { color: '#0066cc', title: 'Ingresos por producto (Top 10)' });

        // Ventas por día (últimos 10 días del período)
        const db = await openDB();
        const allSales = await getAllSales(db);
        const filteredSales = filterByDate(allSales, 'sale_date');
        const dailyMap = new Map<string, number>();
        for (const s of filteredSales) {
          const day = String(s.sale_date ?? '').slice(0, 10);
          if (!day) continue;
          dailyMap.set(day, (dailyMap.get(day) || 0) + (s.total_amount || 0));
        }
        const dailyEntries = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        const last10 = dailyEntries.slice(-10);
        const labelsDaily = last10.map(([d]) => d);
        const valuesDaily = last10.map(([, v]) => v);
        const dailySvg = buildBarChartSvg(labelsDaily, valuesDaily, { color: '#7E57C2', title: 'Ventas por día (últimos 10)' });

        chartSvgVentas = `
          <div class="chart">${qtySvg}</div>
          <div class="chart">${revSvg}</div>
          <div class="chart">${dailySvg}</div>
        `;
      } else if (tipoReporte === 'resumen') {
        const labels = ['Ventas', 'Gastos', 'Ganancia'];
        const values = [summary.totalSales, summary.totalExpenses, summary.profit];
        const resumenSvg = buildBarChartSvg(labels, values, { color: '#0066cc', title: 'Resumen financiero' });

        // Construir serie diaria comparativa Ventas vs Gastos (últimos 10 días del período)
        const db = await openDB();
        const allSales = await getAllSales(db);
        const allExpenses = await getAllExpenses(db);
        const filteredSales = filterByDate(allSales, 'sale_date');
        const filteredExpenses = filterByDate(allExpenses, 'expense_date');

        const salesDaily = new Map<string, number>();
        for (const s of filteredSales) {
          const day = String(s.sale_date ?? '').slice(0, 10);
          if (!day) continue;
          salesDaily.set(day, (salesDaily.get(day) || 0) + (s.total_amount || 0));
        }
        const expensesDaily = new Map<string, number>();
        for (const e of filteredExpenses) {
          const day = String(e.expense_date ?? '').slice(0, 10);
          if (!day) continue;
          expensesDaily.set(day, (expensesDaily.get(day) || 0) + (e.amount || 0));
        }
        const dateSet = new Set<string>([...salesDaily.keys(), ...expensesDaily.keys()]);
        const allDays = Array.from(dateSet).sort((a, b) => a.localeCompare(b));
        const last10 = allDays.slice(-10);
        const dailyLabels = last10;
        const salesVals = dailyLabels.map(d => salesDaily.get(d) || 0);
        const expenseVals = dailyLabels.map(d => expensesDaily.get(d) || 0);
        const groupedSvg = buildGroupedBarChartSvg(
          dailyLabels,
          [
            { name: 'Ventas', values: salesVals, color: '#38b24d' },
            { name: 'Gastos', values: expenseVals, color: '#dc3545' },
          ],
          { title: 'Ventas vs Gastos por día (últimos 10)' }
        );

        chartSvg = `
          <div class=\"chart\">${resumenSvg}</div>
          <div class=\"chart\">${groupedSvg}</div>
        `;
      }

      // Generar HTML según el tipo de reporte
      if (tipoReporte === 'ventas') {
        html = `
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; text-align: center; }
                .info { text-align: center; margin-bottom: 20px; color: #666; }
                .chart { display: flex; justify-content: center; margin-top: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #38b24d; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .total { font-weight: bold; margin-top: 20px; text-align: right; }
              </style>
            </head>
            <body>
              <h1>Reporte de Ventas</h1>
              <div class="info">
                <p><strong>Período:</strong> ${periodo}</p>
                <p><strong>Generado:</strong> ${fechaActual}</p>
              </div>
              ${chartSvgVentas}
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  ${salesReports.map(r => `
                    <tr>
                      <td>${r.productName}</td>
                      <td>${r.totalQuantity}</td>
                      <td>$${r.totalRevenue.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="total">
                <p>Total Ingresos: $${salesReports.reduce((sum, r) => sum + r.totalRevenue, 0).toFixed(2)}</p>
              </div>
            </body>
          </html>
        `;
      } else if (tipoReporte === 'resumen') {
        html = `
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; text-align: center; }
                .info { text-align: center; margin-bottom: 20px; color: #666; }
                .chart { display: flex; justify-content: center; margin: 10px 0 20px 0; }
                .summary { max-width: 600px; margin: 0 auto; }
                .summary-item { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #ddd; }
                .summary-label { font-weight: bold; color: #555; }
                .summary-value { font-weight: bold; }
                .positive { color: #28a745; }
                .negative { color: #dc3545; }
              </style>
            </head>
            <body>
              <h1>Resumen General</h1>
              <div class="info">
                <p><strong>Período:</strong> ${periodo}</p>
                <p><strong>Generado:</strong> ${fechaActual}</p>
              </div>
              <div class="chart">${chartSvg}</div>
              <div class="summary">
                <div class="summary-item">
                  <span class="summary-label">Total Ventas:</span>
                  <span class="summary-value positive">$${summary.totalSales.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Gastos:</span>
                  <span class="summary-value negative">$${summary.totalExpenses.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Ganancia:</span>
                  <span class="summary-value ${summary.profit >= 0 ? 'positive' : 'negative'}">$${summary.profit.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Número de Ventas:</span>
                  <span class="summary-value">${summary.salesCount}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Producto Top:</span>
                  <span class="summary-value">${summary.topProduct}</span>
                </div>
              </div>
            </body>
          </html>
        `;
      }

      // Generar PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Compartir o abrir el PDF
      if (Platform.OS === 'web') {
        // En web, abrir en una nueva pestaña
        const newWindow = window.open(uri, '_blank');
        if (!newWindow) {
          Alert.alert('PDF generado', `El PDF se guardó en: ${uri}`);
        }
      } else {
        // En móvil, compartir el archivo
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Éxito', `PDF generado en: ${uri}`);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const generateSalesReport = async (db: any) => {
    const sales = await getAllSales(db);
    const products = await getAllProducts(db);
    
    // Filtrar por fechas si están especificadas
    const filteredSales = filterByDate(sales);
    
    // Agregar datos por producto
    const salesByProduct: { [key: string]: { quantity: number; revenue: number; name: string } } = {};
    
    for (const sale of filteredSales) {
      const saleItems = await getSaleItems(db, sale.id);
      
      for (const item of saleItems) {
        const product = products.find(p => p.id === item.product_id);
        const productName = product?.name || `Producto ${item.product_id}`;
        
        if (!salesByProduct[item.product_id]) {
          salesByProduct[item.product_id] = { quantity: 0, revenue: 0, name: productName };
        }
        
        salesByProduct[item.product_id].quantity += item.quantity;
        salesByProduct[item.product_id].revenue += item.price_at_sale * item.quantity;
      }
    }
    
    const reportData = Object.values(salesByProduct).map(item => ({
      productName: item.name,
      totalQuantity: item.quantity,
      totalRevenue: item.revenue
    }));
    
    // Ordenar de mayor a menor cantidad vendida
    reportData.sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    setSalesReports(reportData);
  };

  // Reporte de gastos eliminado de la sección de Reportes

  const generateSummaryReport = async (db: any) => {
    const sales = await getAllSales(db);
    const expenses = await getAllExpenses(db);
    const products = await getAllProducts(db);
    
    const filteredSales = filterByDate(sales);
    const filteredExpenses = filterByDate(expenses, 'expense_date');
    
    let totalSales = 0;
    const productSales: { [key: string]: { quantity: number; revenue: number; name: string } } = {};
    
    for (const sale of filteredSales) {
      const saleItems = await getSaleItems(db, sale.id);
      totalSales += sale.total_amount;
      
      for (const item of saleItems) {
        const product = products.find(p => p.id === item.product_id);
        const productName = product?.name || `Producto ${item.product_id}`;
        
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { quantity: 0, revenue: 0, name: productName };
        }
        
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].revenue += item.price_at_sale * item.quantity;
      }
    }
    
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const profit = totalSales - totalExpenses;
    
    // Encontrar el producto más vendido
    const topProductEntry = Object.values(productSales).reduce((max, current) => 
      current.revenue > max.revenue ? current : max, 
      { revenue: 0, name: 'N/A' }
    );
    
    setSummary({
      totalSales,
      totalExpenses,
      profit,
      topProduct: topProductEntry.name,
      salesCount: filteredSales.length
    });
  };

  const filterByDate = (items: any[], dateField = 'sale_date') => {
    if (!fechaInicio && !fechaFin) return items;
    
    return items.filter(item => {
      const raw = String(item[dateField] ?? '');
      const itemDate = raw.length >= 10 ? raw.slice(0, 10) : raw;
      if (fechaInicio && itemDate < fechaInicio) return false;
      if (fechaFin && itemDate > fechaFin) return false;
      return true;
    });
  };

  const renderSalesReport = () => (
    <View style={styles.productsTable}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: isMobile ? 3 : 2, fontWeight: "bold", fontSize: isMobile ? 12 : 20 }]}>Producto</Text>
        <Text style={[styles.tableCell, { flex: isMobile ? 2 : 1, fontWeight: "bold", fontSize: isMobile ? 12 : 20, textAlign: 'center' }]}>Cantidad</Text>
        <Text style={[styles.tableCell, { flex: isMobile ? 2 : 1, fontWeight: "bold", fontSize: isMobile ? 12 : 20, textAlign: 'right' }]}>Ingresos</Text>
      </View>
      <ScrollView>
        {salesReports.map((reporte, idx) => (
          <View key={idx} style={[styles.tableRow, isMobile && { paddingVertical: 6 }]}>
            <Text style={[styles.tableCell, { flex: isMobile ? 3 : 2, fontSize: isMobile ? 12 : 18 }]} numberOfLines={1}>{reporte.productName}</Text>
            <Text style={[styles.tableCell, { flex: isMobile ? 2 : 1, fontSize: isMobile ? 12 : 18, textAlign: 'center' }]}>{reporte.totalQuantity}</Text>
            <Text style={[styles.tableCell, { flex: isMobile ? 2 : 1, fontSize: isMobile ? 12 : 18, textAlign: 'right' }]}>${reporte.totalRevenue.toFixed(2)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Vista de reporte de gastos eliminada

  const renderSummaryReport = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={[styles.summaryTitle, isMobile && { fontSize: 18 }]}>Resumen General</Text>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isMobile && { fontSize: 14 }]}>Total Ventas:</Text>
          <Text style={[styles.summaryValue, isMobile && { fontSize: 14 }, { color: '#28a745' }]}>${summary.totalSales.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isMobile && { fontSize: 14 }]}>Total Gastos:</Text>
          <Text style={[styles.summaryValue, isMobile && { fontSize: 14 }, { color: '#dc3545' }]}>${summary.totalExpenses.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isMobile && { fontSize: 14 }]}>Ganancia:</Text>
          <Text style={[styles.summaryValue, isMobile && { fontSize: 14 }, { color: summary.profit >= 0 ? '#28a745' : '#dc3545' }]}>
            ${summary.profit.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isMobile && { fontSize: 14 }]}>Número de Ventas:</Text>
          <Text style={[styles.summaryValue, isMobile && { fontSize: 14 }]}>{summary.salesCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isMobile && { fontSize: 14 }]}>Producto Top:</Text>
          <Text style={[styles.summaryValue, isMobile && { fontSize: 14 }]} numberOfLines={1}>{summary.topProduct}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ProtectedLayout title="Reportes" requiredPermission="VER_REPORTES">
      {/* Filtros */}
      <View style={styles.filtersRow}>
        <View style={[styles.filterGroup, isMobile && { width: '100%' }]}>
          <Text style={styles.filterLabel}>Tipo de reporte</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipoReporte}
              onValueChange={(value) => {
                setTipoReporte(value);
              }}
              style={[styles.picker, styles.pickerText]}
              itemStyle={styles.pickerItem as any}
              mode="dropdown"
              dropdownIconColor="#333"
            >
              <Picker.Item label="Ventas" value="ventas" />
              <Picker.Item label="Resumen" value="resumen" />
            </Picker>
          </View>
          <Text style={styles.currentTypeText}>
            Mostrando: {tipoReporte === 'ventas' ? 'Ventas' : 'Resumen'}
          </Text>
        </View>
        <View style={[styles.filterGroup, isMobile && { width: '100%' }]}>
          <Text style={styles.filterLabel}>Fecha</Text>
          <View style={styles.dateInputsRow}>
            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.dateInput}
                placeholder="Inicio"
                value={fechaInicio}
                onChangeText={setFechaInicio}
              />
            ) : (
              <TouchableOpacity
                onPress={() => setShowInicioPicker(true)}
                style={[styles.dateInput, styles.dateInputButton]}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar fecha de inicio"
              >
                <Text style={styles.dateInputButtonText}>{fechaInicio || 'Inicio'}</Text>
              </TouchableOpacity>
            )}

            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.dateInput}
                placeholder="Fin"
                value={fechaFin}
                onChangeText={setFechaFin}
              />
            ) : (
              <TouchableOpacity
                onPress={() => setShowFinPicker(true)}
                style={[styles.dateInput, styles.dateInputButton]}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar fecha de fin"
              >
                <Text style={styles.dateInputButtonText}>{fechaFin || 'Fin'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Pickers nativos */}
          {showInicioPicker && (
            <DateTimePicker
              value={fechaInicio ? new Date(fechaInicio) : new Date()}
              mode="date"
              display="default"
              onChange={onChangeInicio}
            />
          )}
          {showFinPicker && (
            <DateTimePicker
              value={fechaFin ? new Date(fechaFin) : new Date()}
              mode="date"
              display="default"
              onChange={onChangeFin}
            />
          )}
        </View>
        <View style={[styles.buttonsRow, isMobile && { width: '100%', justifyContent: 'space-between' }]}>
          <TouchableOpacity style={[styles.exportBtn, isMobile && styles.exportBtnMobile]} onPress={generateReport} disabled={loading}>
            <Text style={styles.exportBtnText}>{loading ? '⏳' : '✓ Generar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.exportBtn, styles.pdfBtn, isMobile && styles.exportBtnMobile]} 
            onPress={exportToPDF}
            disabled={loading || (tipoReporte === 'ventas' && salesReports.length === 0)}
          >
            <Text style={styles.exportBtnText}>📄 PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido del reporte */}
      {tipoReporte === "ventas" && renderSalesReport()}
      {tipoReporte === "resumen" && renderSummaryReport()}
    </ProtectedLayout>
  );
}

const styles = StyleSheet.create({
  filtersRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 6,
    flexWrap: "wrap",
  },
  filterGroup: {
    flex: 1,
    minWidth: 140,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-end",
  },
  filterLabel: {
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  picker: {
    height: 36,
    width: "100%",
  },
  pickerText: {
    color: "#333",
  },
  pickerItem: {
    fontSize: 12,
    color: "#333",
  },
  currentTypeText: {
    marginTop: 4,
    fontSize: 11,
    color: '#666',
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: 6,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 4,
    height: 36,
    width: 65,
    backgroundColor: "#f9f9f9",
    fontSize: 12,
  },
  dateInputButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateInputButtonText: {
    color: '#333',
    fontSize: 12,
  },
  exportBtn: {
    backgroundColor: "#38b24d",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: "flex-end",
  },
  exportBtnMobile: {
    flex: 1,
    paddingHorizontal: 8,
  },
  pdfBtn: {
    backgroundColor: "#0066cc",
  },
  exportBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  productsTable: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#f8f8f8",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 16,
    paddingHorizontal: 4,
  },
  // Estilos para resumen
  summaryContainer: {
    flex: 1,
    padding: 12,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
    flex: 1,
  },
});