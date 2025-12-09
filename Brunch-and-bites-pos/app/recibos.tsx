import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, Image, useWindowDimensions, Platform } from "react-native";
import ProtectedLayout from './components/ProtectedLayout';
import { openDB, getAllSales, getSaleItems, deleteSale } from './lib/database.refactor';
import type { Sale, SaleItem } from './lib/database.types';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

interface SaleWithItems extends Sale {
  items: SaleItem[];
}

export default function RecibosScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isSmallMobile = width < 400;
  
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reciboSeleccionado, setReciboSeleccionado] = useState<SaleWithItems | null>(null);
  const [ventas, setVentas] = useState<Sale[]>([]);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [confirmDeleteChecked, setConfirmDeleteChecked] = useState(false);

  // Cargar ventas desde la base de datos
  const loadSales = async () => {
    try {
      console.log('🔍 Cargando ventas...');
      const db = await openDB();
      const salesList = await getAllSales(db);
      console.log('📊 Ventas desde DB:', salesList.length, 'ventas encontradas');

      if (Array.isArray(salesList) && salesList.length > 0) {
        setVentas(salesList);
        console.log('✅ Ventas reales cargadas correctamente');
      } else {
        console.log('🔄 No hay datos reales, usando datos de prueba offline...');

        // Datos de prueba para modo offline
        const testSales: Sale[] = [
          {
            id: 1,
            sale_date: new Date().toISOString().split('T')[0],
            sale_time: new Date().toLocaleTimeString(),
            total_amount: 25.5,
            payment_received: 30.0,
            change_given: 4.5,
            business_name: 'Brunch & Bites',
            user_id: 1,
          },
          {
            id: 2,
            sale_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            sale_time: new Date(Date.now() - 86400000).toLocaleTimeString(),
            total_amount: 45.75,
            payment_received: 50.0,
            change_given: 4.25,
            business_name: 'Brunch & Bites',
            user_id: 1,
          },
          {
            id: 3,
            sale_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            sale_time: new Date(Date.now() - 172800000).toLocaleTimeString(),
            total_amount: 12.0,
            payment_received: 15.0,
            change_given: 3.0,
            business_name: 'Brunch & Bites',
            user_id: 1,
          },
        ];

        setVentas(testSales);
        console.log('✅ Datos de prueba cargados:', testSales.length, 'recibos');
      }
    } catch (error) {
      console.error('❌ Error loading sales:', error);

      // Fallback con datos de prueba
      const fallbackSales: Sale[] = [
        {
          id: 999,
          sale_date: new Date().toISOString().split('T')[0],
          sale_time: new Date().toLocaleTimeString(),
          total_amount: 15.99,
          payment_received: 20.0,
          change_given: 4.01,
          business_name: 'Brunch & Bites',
          user_id: 1,
        },
      ];

      setVentas(fallbackSales);
      console.log('🆘 Usando datos de fallback:', fallbackSales.length, 'recibos');
    }
  };

  useEffect(() => {
      console.log('🚀 RecibosScreen mounted, loading sales...');
    loadSales();
  }, []);

  const handleVerRecibo = async (sale: Sale) => {
    try {
      console.log('📋 Current ventas state:', ventas.length, 'items');
      console.log('🔍 Ver recibo de venta:', sale.id);
      const db = await openDB();
      const items = await getSaleItems(db, sale.id);
      console.log('📦 Items del recibo:', items);

      // Si no hay items reales, crear items de prueba
      const finalItems: SaleItem[] = items.length > 0 ? items : [
        {
          id: 1,
          sale_id: sale.id,
          product_id: 1,
          product_name: 'Producto de Prueba',
          quantity: 1,
          price_at_sale: sale.total_amount,
        },
      ];

      const saleWithItems: SaleWithItems = {
        ...sale,
        items: finalItems,
      };
      console.log('✅ Recibo completo:', saleWithItems);
      setReciboSeleccionado(saleWithItems);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los detalles de la venta');
      console.error('Error loading sale items:', error);
    }
  };

  const handleDelete = (sale: Sale) => {
    setSaleToDelete(sale);
    setConfirmDeleteChecked(false);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;
    
    try {
      const db = await openDB();
      await deleteSale(db, saleToDelete.id);
  setDeleteModalVisible(false);
      setSaleToDelete(null);
  setConfirmDeleteChecked(false);
      await loadSales();
      Alert.alert('Éxito', 'Venta eliminada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la venta');
      console.error('Error deleting sale:', error);
    }
  };

  const exportToPDF = async () => {
    if (!reciboSeleccionado) return;

    try {
      // Cargar el logo como base64
      const logoUri = FileSystem.documentDirectory + '../assets/images/icon.png';
      let logoBase64 = '';
      try {
        logoBase64 = await FileSystem.readAsStringAsync(logoUri, { encoding: FileSystem.EncodingType.Base64 });
      } catch (e) {
        console.log('No se pudo cargar el logo:', e);
      }

      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 40px;
                max-width: 600px;
                margin: 0 auto;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px;
                border-bottom: 2px solid #38b24d;
                padding-bottom: 20px;
              }
              .logo { 
                width: 120px;
                height: 120px;
                border-radius: 60px;
                margin: 0 auto 20px;
                display: block;
              }
              .header h1 { 
                color: #38b24d; 
                margin: 10px 0;
                font-size: 32px;
              }
              .header h2 { 
                color: #666; 
                margin: 5px 0;
                font-size: 18px;
                font-weight: normal;
              }
              .info { 
                margin: 20px 0;
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
              }
              .info-row { 
                display: flex; 
                justify-content: space-between;
                margin: 8px 0;
                font-size: 14px;
              }
              .info-label { 
                font-weight: bold;
                color: #555;
              }
              .products { 
                margin: 20px 0;
              }
              .products h3 { 
                color: #333;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
                margin-bottom: 15px;
              }
              .product-item { 
                display: flex;
                justify-content: space-between;
                padding: 10px;
                border-bottom: 1px solid #f0f0f0;
              }
              .product-name { 
                flex: 1;
                color: #333;
              }
              .product-qty { 
                width: 60px;
                text-align: center;
                color: #666;
              }
              .product-price { 
                width: 100px;
                text-align: right;
                font-weight: bold;
                color: #333;
              }
              .totals { 
                margin-top: 30px;
                border-top: 2px solid #38b24d;
                padding-top: 20px;
              }
              .total-row { 
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                font-size: 16px;
              }
              .total-row.grand { 
                font-size: 20px;
                font-weight: bold;
                color: #38b24d;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
              }
              .footer { 
                margin-top: 40px;
                text-align: center;
                color: #999;
                font-size: 12px;
                border-top: 1px solid #eee;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo" alt="Logo" />` : ''}
              <h1>Brunch & Bites</h1>
              <h2>Recibo de Venta</h2>
            </div>
            
            <div class="info">
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span>${reciboSeleccionado.sale_date}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Hora:</span>
                <span>${reciboSeleccionado.sale_time}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Empresa:</span>
                <span>${reciboSeleccionado.business_name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Recibo #:</span>
                <span>${reciboSeleccionado.id}</span>
              </div>
            </div>

            <div class="products">
              <h3>Productos</h3>
              ${reciboSeleccionado.items.map(item => `
                <div class="product-item">
                  <span class="product-name">${item.product_name}</span>
                  <span class="product-qty">x${item.quantity}</span>
                  <span class="product-price">$${(item.price_at_sale * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${reciboSeleccionado.total_amount.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Pago recibido:</span>
                <span>$${reciboSeleccionado.payment_received.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Cambio:</span>
                <span>$${reciboSeleccionado.change_given.toFixed(2)}</span>
              </div>
              <div class="total-row grand">
                <span>Total:</span>
                <span>$${reciboSeleccionado.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>¡Gracias por su compra!</p>
              <p>Brunch & Bites POS - Sistema de punto de venta</p>
            </div>
          </body>
        </html>
      `;

      // Generar PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Guardar PDF automáticamente
      if (Platform.OS === 'web') {
        const newWindow = window.open(uri, '_blank');
        if (!newWindow) {
          Alert.alert('PDF generado', `El PDF se guardó en: ${uri}`);
        }
      } else {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `Recibo_${reciboSeleccionado.id}_${timestamp}.pdf`;
        
        // Crear directorio si no existe
        const recibosDir = `${FileSystem.documentDirectory}recibos/`;
        const dirInfo = await FileSystem.getInfoAsync(recibosDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(recibosDir, { intermediates: true });
        }
        
        // Copiar el PDF al directorio de recibos
        const newPath = `${recibosDir}${fileName}`;
        await FileSystem.copyAsync({ from: uri, to: newPath });
        
        // En Android, opcionalmente guardar en carpeta pública
        if (Platform.OS === 'android') {
          try {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
              const base64 = await FileSystem.readAsStringAsync(newPath, {
                encoding: FileSystem.EncodingType.Base64,
              });
              await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                'application/pdf'
              )
                .then(async (uri) => {
                  await FileSystem.writeAsStringAsync(uri, base64, {
                    encoding: FileSystem.EncodingType.Base64,
                  });
                })
                .catch((e) => console.log('Error saving to public folder:', e));
            }
          } catch (error) {
            console.log('User cancelled or error:', error);
          }
        }
        
        Alert.alert(
          'Recibo guardado',
          `El recibo se guardó en:\n${newPath}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF del recibo');
    }
  };

  return (
    <ProtectedLayout title="Recibos" requiredPermission="VER_VENTAS">
      <View style={styles.productsTable}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold", fontSize: isMobile ? 14 : 22 }]}>Fecha y hora</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: isMobile ? 14 : 22 }]}>Total</Text>
          {!isMobile && <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 22 }]}>Empresa</Text>}
        </View>
        <ScrollView>
          {ventas.map((venta, idx) => (
            <View style={[styles.tableRow, isMobile && { paddingVertical: 8 }]} key={idx}>
              <TouchableOpacity 
                style={styles.rowContent}
                onPress={() => handleVerRecibo(venta)}
              >
                <Text style={[styles.tableCell, { flex: 2, fontSize: isMobile ? 14 : 18 }]} numberOfLines={isMobile ? 2 : 1}>
                  {venta.sale_date} {venta.sale_time}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: isMobile ? 14 : 18 }]}>
                  ${venta.total_amount.toFixed(2)}
                </Text>
                {!isMobile && (
                  <Text style={[styles.tableCell, { flex: 1, fontSize: 18 }]}>
                    {venta.business_name || 'N/A'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteBtn, isMobile && { width: 28, height: 28 }]} onPress={() => handleDelete(venta)}>
                <Text style={[styles.deleteBtnText, isMobile && { fontSize: 14 }]}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          {ventas.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay recibos para mostrar</Text>
              <Text style={styles.emptyText}>Las ventas realizadas aparecerán aquí</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal Datos del Recibo */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.reciboBox}>
            <View style={styles.reciboHeader}>
              <Image
                source={require('../assets/images/logo.jpeg')}
                style={styles.reciboLogo}
              />
              <Text style={styles.reciboHeaderTitle}>Brunch & Bites</Text>
              <Text style={styles.reciboSubtitle}>Recibo de Venta</Text>
            </View>
            <View style={styles.reciboContent}>
              <Text style={styles.reciboLabel}>Fecha: {reciboSeleccionado?.sale_date}</Text>
              <Text style={styles.reciboLabel}>Hora: {reciboSeleccionado?.sale_time}</Text>
              <Text style={styles.reciboLabel}>Empresa: {reciboSeleccionado?.business_name || 'N/A'}</Text>
              <Text style={styles.reciboLabel}>Productos:</Text>
              <View style={styles.reciboProductosBox}>
                <ScrollView style={{ maxHeight: 150 }}>
                  {reciboSeleccionado?.items?.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.reciboProductosText}>
                        {item.product_name} x{item.quantity} - ${item.price_at_sale.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.reciboRow}>
                <Text style={styles.reciboLabel}>Subtotal:</Text>
                <Text style={styles.reciboTotal}>${reciboSeleccionado?.total_amount.toFixed(2)}</Text>
              </View>
              <View style={styles.reciboRow}>
                <Text style={styles.reciboLabel}>Pago recibido:</Text>
                <Text style={styles.reciboTotal}>${reciboSeleccionado?.payment_received.toFixed(2)}</Text>
              </View>
              <View style={styles.reciboRow}>
                <Text style={styles.reciboLabel}>Cambio:</Text>
                <Text style={styles.reciboTotal}>${reciboSeleccionado?.change_given.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#0066cc' }]} onPress={exportToPDF}>
                <Text style={styles.modalButtonText}>📄 Exportar PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#38b24d' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.reciboBox}>
            <View style={styles.reciboHeader}>
              <Text style={styles.reciboHeaderTitle}>Confirmar eliminación</Text>
            </View>
            <View style={styles.reciboContent}>
              <Text style={styles.confirmText}>
                ¿Está seguro de que desea eliminar la venta del {saleToDelete?.sale_date} por ${saleToDelete?.total_amount.toFixed(2)}?
              </Text>
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: confirmDeleteChecked ? '#28a745' : '#ffc107' }]}
                onPress={() => setConfirmDeleteChecked(true)}
                disabled={confirmDeleteChecked}
              >
                <Text style={styles.modalButtonText}>{confirmDeleteChecked ? 'Confirmado' : 'Confirmar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => { setDeleteModalVisible(false); setConfirmDeleteChecked(false); }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: confirmDeleteChecked ? '#dc3545' : '#ccc' }]}
                onPress={confirmDelete}
                disabled={!confirmDeleteChecked}
              >
                <Text style={styles.modalButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ProtectedLayout>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 6,
    backgroundColor: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 18,
    paddingHorizontal: 4,
  },
  rowContent: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#dc3545",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  reciboBox: {
    width: 350,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
  },
  reciboHeader: {
    backgroundColor: "#a3d6b1",
    width: "100%",
    padding: 10,
    alignItems: "center",
  },
  reciboLogo: {
    width: 60,
    height: 60,
    alignSelf: "center",
    marginBottom: 10,
  },
  reciboHeaderTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
  reciboSubtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 15,
  },
  reciboContent: {
    margin: 20,
    width: "90%",
  },
  reciboLabel: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  reciboProductosBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
    padding: 8,
    marginBottom: 18,
    minHeight: 60,
    justifyContent: "flex-start",
  },
  reciboProductosText: {
    fontSize: 18,
  },
  reciboRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  reciboTotal: {
    fontSize: 20,
    fontWeight: "bold",
  },
  imprimirBtn: {
    backgroundColor: "#38b24d",
    width: "100%",
    paddingVertical: 18,
    alignItems: "center",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  imprimirBtnText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
  },
  itemRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  confirmText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});