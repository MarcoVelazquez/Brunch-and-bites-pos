import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import ProtectedLayout from './components/ProtectedLayout';
import { openDB, getAllSales, getSaleItems, getAllProducts, getAllExpenses, initializeDatabase } from './lib/database.refactor';
import type { Sale, SaleItem, Product, Expense } from './lib/database.types';

interface ReporteSales {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface ReporteSummary {
  totalSales: number;
  totalExpenses: number;
  profit: number;
  topProduct: string;
  salesCount: number;
}

export default function ReportesScreen() {
  const [tipoReporte, setTipoReporte] = useState("ventas");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  
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
      // Inicializar base de datos de forma explícita
      await initializeDatabase();
      const db = await openDB();
      
      // Verificar que la base de datos se haya inicializado correctamente
      if (!db) {
        throw new Error('No se pudo inicializar la base de datos');
      }
      
      if (tipoReporte === "ventas") {
        await generateSalesReport(db);
      } else if (tipoReporte === "resumen") {
        await generateSummaryReport(db);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `No se pudo generar el reporte: ${errorMessage}`);
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesReport = async (db: any) => {
    const sales = await getAllSales();
    const products = await getAllProducts();
    
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
    
    setSalesReports(reportData);
  };

  const generateSummaryReport = async (db: any) => {
    const sales = await getAllSales();
    const expenses = await getAllExpenses();
    const products = await getAllProducts();
    
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
      const itemDate = item[dateField];
      if (fechaInicio && itemDate < fechaInicio) return false;
      if (fechaFin && itemDate > fechaFin) return false;
      return true;
    });
  };

  const renderSalesReport = () => (
    <View style={styles.productsTable}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold", fontSize: 20 }]}>Producto</Text>
        <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 20 }]}>Cantidad</Text>
        <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 20 }]}>Ingresos</Text>
      </View>
      <ScrollView>
        {salesReports.map((reporte, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{reporte.productName}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{reporte.totalQuantity}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>${reporte.totalRevenue.toFixed(2)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderSummaryReport = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen General</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Ventas:</Text>
          <Text style={[styles.summaryValue, { color: '#28a745' }]}>${summary.totalSales.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Gastos:</Text>
          <Text style={[styles.summaryValue, { color: '#dc3545' }]}>${summary.totalExpenses.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ganancia:</Text>
          <Text style={[styles.summaryValue, { color: summary.profit >= 0 ? '#28a745' : '#dc3545' }]}>
            ${summary.profit.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Número de Ventas:</Text>
          <Text style={styles.summaryValue}>{summary.salesCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Producto Top:</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>{summary.topProduct}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ProtectedLayout title="Reportes" requiredPermission="VER_REPORTES">
      {/* Filtros */}
      <View style={styles.filtersRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.filterLabel}>Tipo de reporte</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipoReporte}
              onValueChange={(value) => {
                setTipoReporte(value);
              }}
              style={styles.picker}
              dropdownIconColor="#333"
            >
              <Picker.Item label="Ventas" value="ventas" />
              <Picker.Item label="Resumen" value="resumen" />
            </Picker>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.filterLabel}>Fecha (YYYY-MM-DD)</Text>
          <View style={styles.dateInputsRow}>
            <TextInput
              style={styles.dateInput}
              placeholder="Inicio"
              value={fechaInicio}
              onChangeText={setFechaInicio}
            />
            <TextInput
              style={styles.dateInput}
              placeholder="Fin"
              value={fechaFin}
              onChangeText={setFechaFin}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={generateReport} disabled={loading}>
          <Text style={styles.exportBtnText}>{loading ? 'Cargando...' : 'Generar'}</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 20,
  },
  filterLabel: {
    fontWeight: "bold",
    fontSize: 18,
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
  dateInputsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    height: 36,
    width: 80,
    backgroundColor: "#f9f9f9",
    marginRight: 8,
  },
  exportBtn: {
    backgroundColor: "#38b24d",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: "flex-end",
    marginLeft: 20,
  },
  exportBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  productsTable: {
    flex: 1,
    margin: 10,
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
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 18,
  },
  // Estilos para resumen
  summaryContainer: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    flex: 1,
  },
});