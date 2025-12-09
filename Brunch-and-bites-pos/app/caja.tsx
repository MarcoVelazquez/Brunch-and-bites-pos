import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, Modal, Dimensions, Platform } from "react-native";
import ProtectedLayout from './components/ProtectedLayout';
import { useAuth } from './contexts/AuthContext';
import { getAllProducts, addSale, addSaleItems, openDB, getTodayCashOpening, addCashOpening, getAllSales, getSaleItems, deleteTodayCashOpening } from './lib/database.refactor';
import type { Product, SaleItem } from './lib/database.types';
import * as Print from 'expo-print';
// import * as Sharing from 'expo-sharing'; // Sharing deshabilitado para corte de caja
// Use legacy API to avoid deprecation warnings on SDK 54
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';

interface CartItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
}

export default function CajaScreen() {
    const { db, user, logout } = useAuth();
    const router = useRouter();
    const [cantidad, setCantidad] = useState('');
    const [cambio, setCambio] = useState(0);
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState('');
    const [showOpeningModal, setShowOpeningModal] = useState(false);
    const [openingAmount, setOpeningAmount] = useState('');
    const [checkingOpening, setCheckingOpening] = useState(true);
    
    // Cash closing (corte de caja) state
    const [showClosingModal, setShowClosingModal] = useState(false);
    const [coins, setCoins] = useState({ '1': '', '2': '', '5': '', '10': '', '20': '' });
    const [bills, setBills] = useState({ '20': '', '50': '', '100': '', '200': '', '500': '', '1000': '' });
    const [todaySales, setTodaySales] = useState<any[]>([]);
    const [openingFund, setOpeningFund] = useState(0);
    
    // 📱 RESPONSIVIDAD - Estado para manejar dimensiones dinámicamente
    const [screenData, setScreenData] = useState(Dimensions.get('window'));
    const { width, height } = screenData;
    const isTablet = width >= 768;
    const isLandscape = width > height;
    const isSmallScreen = width < 400;

    // 📱 RESPONSIVIDAD - Listener para cambios de orientación
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setScreenData(window);
        });
        return () => subscription?.remove();
    }, []);

    // Verificar fondo de apertura del día y cargar productos
    useEffect(() => {
        const init = async () => {
            if (!db) {
                console.log('Database not initialized yet');
                return;
            }
            try {
                setLoading(true);
                // 1) Check opening fund for today
                setCheckingOpening(true);
                const opening = await getTodayCashOpening(db);
                if (!opening) {
                    setShowOpeningModal(true);
                }
                setCheckingOpening(false);
                // 2) Load products
                const allProducts = await getAllProducts(db);
                setProducts(allProducts);
            } catch (error) {
                console.error('Error loading products:', error);
                Alert.alert('Error', 'No se pudieron cargar los productos. Intenta recargar la aplicación.');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [db]);

    // Calcular total cuando cambian los items del carrito
    useEffect(() => {
        const newTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTotal(newTotal);
        setCantidad('');
        setCambio(0);
        setReceivedAmount('');
    }, [items]);

    const addToCart = (product: Product) => {
        const existingItem = items.find(item => item.id === product.id);
        if (existingItem) {
            setItems(items.map(item => 
                item.id === product.id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setItems([...items, {
                id: product.id,
                name: product.name,
                quantity: 1,
                price: product.price
            }]);
        }
    };

    const updateQuantity = (id: number, change: number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(0, item.quantity + change);
                return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
            }
            return item;
        }).filter(Boolean) as CartItem[]);
    };

    const handleOpenPayment = () => {
        if (items.length === 0) {
            Alert.alert('Error', 'El carrito está vacío');
            return;
        }
        setShowPaymentModal(true);
    };

    const handleCobrar = async () => {
        const pago = parseFloat(receivedAmount);
        if (isNaN(pago) || pago < total) {
            Alert.alert('Error', 'El monto recibido debe ser mayor o igual al total');
            return;
        }
        const calculatedChange = pago - total;
        setCambio(calculatedChange);

        try {
            // Asegurar conexión sana
            const conn = db ?? (await openDB());
            // Crear venta
            const businessName = 'Brunch & Bites';
            const userId = user?.id ?? 0;
            const saleId = await addSale(conn, total, pago, calculatedChange, businessName, userId);
            // Agregar items de la venta
            await addSaleItems(
                conn,
                saleId,
                items.map((it) => ({
                    product_id: it.id,
                    product_name: it.name,
                    quantity: it.quantity,
                    price_at_sale: it.price,
                }))
            );
            console.log('✅ Venta registrada con ID:', saleId);
        } catch (e) {
            console.error('❌ Error registrando la venta:', e);
            Alert.alert('Error', 'No se pudo registrar la venta. Intente de nuevo.');
            return;
        }

        Alert.alert(
            'Venta realizada', 
            `Total: $${total.toFixed(2)}\nRecibido: $${pago.toFixed(2)}\nCambio: $${calculatedChange.toFixed(2)}`,
            [
                {
                    text: 'Nueva venta',
                    onPress: () => {
                        setItems([]);
                        setCantidad('');
                        setCambio(0);
                        setReceivedAmount('');
                        setShowPaymentModal(false);
                    }
                }
            ]
        );
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setReceivedAmount('');
        setCambio(0);
    };

    const handleConfirmOpening = async () => {
        const amount = parseFloat(openingAmount || '');
        if (isNaN(amount) || amount < 0) {
            Alert.alert('Monto inválido', 'Ingresa un monto inicial válido (0 o mayor)');
            return;
        }
        try {
            const conn = db ?? (await openDB());
            await addCashOpening(conn, amount, user?.id ?? null);
            setShowOpeningModal(false);
        } catch (e) {
            console.error('❌ Error registrando fondo de apertura:', e);
            Alert.alert('Error', 'No se pudo registrar el fondo de apertura.');
        }
    };

    const handleOpenClosing = async () => {
        try {
            const conn = db ?? (await openDB());
            const today = new Date().toISOString().slice(0, 10);
            
            // Get today's opening fund
            const opening = await getTodayCashOpening(conn);
            setOpeningFund(opening?.amount ?? 0);
            
            // Get today's sales AFTER the opening time
            const allSales = await getAllSales(conn);
            const todaySalesFiltered = allSales.filter(s => {
                if (s.sale_date !== today) return false;
                if (!opening) return true; // If no opening, include all today's sales
                
                // Compare sale time with opening time
                const saleTime = s.sale_time;
                const openingTime = opening.open_time;
                return saleTime >= openingTime;
            });
            setTodaySales(todaySalesFiltered);
            
            // Reset denomination counts
            setCoins({ '1': '', '2': '', '5': '', '10': '', '20': '' });
            setBills({ '20': '', '50': '', '100': '', '200': '', '500': '', '1000': '' });
            
            setShowClosingModal(true);
        } catch (e) {
            console.error('Error loading closing data:', e);
            Alert.alert('Error', 'No se pudo cargar la información del corte');
        }
    };

    const calculateActualCash = () => {
        let total = 0;
        Object.entries(coins).forEach(([denom, qty]) => {
            total += parseFloat(denom) * (parseFloat(qty) || 0);
        });
        Object.entries(bills).forEach(([denom, qty]) => {
            total += parseFloat(denom) * (parseFloat(qty) || 0);
        });
        return total;
    };

    const generateClosingPDF = async () => {
        // Cargar el logo como base64
        const logoUri = FileSystem.documentDirectory + '../assets/images/icon.png';
        let logoBase64 = '';
        try {
            logoBase64 = await FileSystem.readAsStringAsync(logoUri, { encoding: FileSystem.EncodingType.Base64 });
        } catch (e) {
            console.log('No se pudo cargar el logo:', e);
        }

        const salesTotal = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
        const expectedCash = openingFund + salesTotal;
        const actualCash = calculateActualCash();
        const difference = actualCash - expectedCash;
        const now = new Date().toLocaleString('es-ES');
        
        // Load items for each sale
        const conn = db ?? (await openDB());
        const salesWithItems = await Promise.all(
            todaySales.map(async (sale) => {
                const items = await getSaleItems(conn, sale.id);
                return { ...sale, items };
            })
        );
        
        // Build sales detail table with products
        const salesRows = salesWithItems.map((sale, i) => {
            const itemsHtml = sale.items.map((item: SaleItem) => 
                `<div style="margin-left: 20px; font-size: 12px; color: #666;">
                    • ${item.product_name} x${item.quantity} ($${item.price_at_sale.toFixed(2)} c/u)
                </div>`
            ).join('');
            
            return `
            <tr>
                <td>${i + 1}</td>
                <td>${sale.sale_time}</td>
                <td>
                    <div style="font-weight: bold;">$${sale.total_amount.toFixed(2)}</div>
                    ${itemsHtml}
                </td>
            </tr>`;
        }).join('');
        
        // Build denominations table
        const coinRows = Object.entries(coins).map(([d, q]) => {
            const qty = parseFloat(q) || 0;
            const subtotal = parseFloat(d) * qty;
            return `<tr><td>$${d}</td><td>${qty}</td><td>$${subtotal.toFixed(2)}</td></tr>`;
        }).join('');
        const billRows = Object.entries(bills).map(([d, q]) => {
            const qty = parseFloat(q) || 0;
            const subtotal = parseFloat(d) * qty;
            return `<tr><td>$${d}</td><td>${qty}</td><td>$${subtotal.toFixed(2)}</td></tr>`;
        }).join('');
        
        const html = `
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .logo { width: 100px; height: 100px; border-radius: 50px; margin: 0 auto 20px; display: block; }
                    h1 { color: #333; text-align: center; margin-bottom: 10px; }
                    .info { text-align: center; margin-bottom: 20px; color: #666; }
                    h2 { color: #38b24d; margin-top: 30px; border-bottom: 2px solid #38b24d; padding-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th { background-color: #38b24d; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .summary { background-color: #f0f8f4; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d0e8dc; }
                    .summary-row strong { font-size: 18px; }
                    .difference { font-size: 20px; font-weight: bold; color: ${difference >= 0 ? '#2e7d32' : '#d32f2f'}; }
                </style>
            </head>
            <body>
                ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo" alt="Logo" />` : ''}
                <h1>Corte de Caja</h1>
                <div class="info">
                    <p><strong>Fecha:</strong> ${now}</p>
                    <p><strong>Usuario:</strong> ${user?.username ?? 'N/A'}</p>
                </div>
                
                <h2>Resumen Financiero</h2>
                <div class="summary">
                    <div class="summary-row"><span>Fondo inicial:</span><strong>$${openingFund.toFixed(2)}</strong></div>
                    <div class="summary-row"><span>Ventas del día:</span><strong>$${salesTotal.toFixed(2)}</strong></div>
                    <div class="summary-row"><span>Total esperado:</span><strong>$${expectedCash.toFixed(2)}</strong></div>
                    <div class="summary-row"><span>Total contado:</span><strong>$${actualCash.toFixed(2)}</strong></div>
                    <div class="summary-row"><span>Diferencia:</span><span class="difference">$${difference.toFixed(2)}</span></div>
                </div>
                
                <h2>Detalle de Ventas (${todaySales.length})</h2>
                <table>
                    <thead><tr><th>#</th><th>Hora</th><th>Total</th></tr></thead>
                    <tbody>${salesRows}</tbody>
                </table>
                
                <h2>Desglose de Efectivo</h2>
                <h3>Monedas</h3>
                <table>
                    <thead><tr><th>Denominación</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
                    <tbody>${coinRows}</tbody>
                </table>
                <h3>Billetes</h3>
                <table>
                    <thead><tr><th>Denominación</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
                    <tbody>${billRows}</tbody>
                </table>
            </body>
            </html>
        `;
        
        try {
            const { uri } = await Print.printToFileAsync({ html });

            // Nombre y guardado local en el sandbox de la app
            const ts = new Date();
            const fileName = `Corte_${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}-${String(ts.getMinutes()).padStart(2, '0')}.pdf`;
            const FS: any = FileSystem as any;
            const appDir = `${FS.documentDirectory}cortes/`;
            try {
                const dirInfo = await FS.getInfoAsync(appDir);
                if (!dirInfo.exists) {
                    await FS.makeDirectoryAsync(appDir, { intermediates: true });
                }
                const destUri = appDir + fileName;
                await FS.copyAsync({ from: uri, to: destUri });
            } catch (e) {
                console.warn('No se pudo guardar en documentDirectory:', e);
            }

            // Opcional: en Android, permitir elegir carpeta (p.ej. Descargas) usando SAF
            if (Platform.OS === 'android' && FS.StorageAccessFramework) {
                try {
                    const perms = await FS.StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (perms.granted) {
                        const base64 = await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64 });
                        const safUri = await FS.StorageAccessFramework.createFileAsync(
                            perms.directoryUri,
                            fileName,
                            'application/pdf'
                        );
                        await FS.writeAsStringAsync(safUri, base64, { encoding: FS.EncodingType.Base64 });
                    }
                } catch (e) {
                    console.warn('Guardado mediante SAF falló:', e);
                }
            }

            // Eliminar el fondo de apertura de hoy una vez generado y guardado
            await deleteTodayCashOpening(conn);

            // Compartir/abrir opcional
            if (Platform.OS === 'web') {
                window.open(uri, '_blank');
            }

            setShowClosingModal(false);

            // Cerrar sesión y redirigir al login
            Alert.alert(
                'Corte de caja guardado',
                'El PDF se guardó en el dispositivo. Se cerrará la sesión.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            await logout();
                            router.replace('/login');
                        }
                    }
                ],
                { cancelable: false }
            );
        } catch (e) {
            console.error('Error generating PDF:', e);
            Alert.alert('Error', 'No se pudo generar el PDF');
        }
    };

    // 📱 ESTILOS DINÁMICOS RESPONSIVOS
    const dynamicStyles = React.useMemo(() => StyleSheet.create({
        content: {
            flex: 1,
            flexDirection: (isTablet || isLandscape) ? "row" : "column",
            padding: isSmallScreen ? 10 : width < 600 ? 15 : 20,
            gap: isSmallScreen ? 10 : width < 600 ? 15 : 20,
        },
        cart: {
            width: (isTablet || isLandscape) ? Math.min(380, width * 0.4) : '100%',
            minWidth: width < 320 ? width - 40 : 280,
            maxWidth: 400,
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: isSmallScreen ? 10 : 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
            marginTop: (isTablet || isLandscape) ? 0 : 10,
        },
        modalContent: {
            backgroundColor: 'white',
            borderRadius: 10,
            padding: isSmallScreen ? 15 : 20,
            margin: isSmallScreen ? 10 : 20,
            width: isSmallScreen ? width - 40 : Math.min(450, width - 80),
            maxWidth: 500,
            maxHeight: height * 0.8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
        tableCell: {
            fontSize: isSmallScreen ? 14 : 16,
        },
        itemName: {
            flex: 2,
            fontSize: isSmallScreen ? 14 : 16,
        },
        cartBtn: {
            width: isSmallScreen ? 35 : 30,
            height: isSmallScreen ? 35 : 30,
            backgroundColor: '#38b24d',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: isSmallScreen ? 17.5 : 15,
        },
        payButton: {
            backgroundColor: '#38b24d',
            padding: isSmallScreen ? 18 : 15,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 10,
        },
    }), [width, height, isTablet, isLandscape, isSmallScreen]);

    return (
        <ProtectedLayout title="Caja" requiredPermission="COBRAR">
            <View style={dynamicStyles.content}>
                <View style={styles.products}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold" }]}>
                            Nombre
                        </Text>
                        <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold" }]}>
                            Precio
                        </Text>
                    </View>
                    <ScrollView style={styles.productsScroll}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Cargando productos...</Text>
                            </View>
                        ) : products.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No hay productos registrados</Text>
                            </View>
                        ) : (
                            products.map((product) => (
                                <TouchableOpacity 
                                    key={product.id} 
                                    style={styles.tableRow}
                                    onPress={() => addToCart(product)}
                                >
                                    <Text style={[dynamicStyles.tableCell, { flex: 2 }]}>{product.name}</Text>
                                    <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>${product.price.toFixed(2)}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>

                <View style={dynamicStyles.cart}>
                    <ScrollView style={styles.cartItems}>
                        {items.length === 0 ? (
                            <View style={styles.emptyCart}>
                                <Text style={styles.emptyCartText}>Carrito vacío</Text>
                            </View>
                        ) : (
                            items.map((item) => (
                                <View key={item.id} style={styles.cartRow}>
                                    <Text style={dynamicStyles.itemName}>{item.name}</Text>
                                    <View style={styles.itemControls}>
                                        <TouchableOpacity 
                                            style={dynamicStyles.cartBtn}
                                            onPress={() => updateQuantity(item.id, -1)}
                                        >
                                            <Text style={styles.cartBtnText}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.itemQuantity}>{item.quantity}</Text>
                                        <TouchableOpacity 
                                            style={dynamicStyles.cartBtn}
                                            onPress={() => updateQuantity(item.id, 1)}
                                        >
                                            <Text style={styles.cartBtnText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.itemTotal}>
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </Text>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    <View style={styles.paymentSection}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                dynamicStyles.payButton,
                                items.length === 0 && styles.payButtonDisabled
                            ]}
                            onPress={handleOpenPayment}
                            disabled={items.length === 0}
                        >
                            <Text style={styles.payButtonText}>Pagar</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.closingButton}
                            onPress={handleOpenClosing}
                        >
                            <Text style={styles.closingButtonText}>📊 Corte de Caja</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

                {/* Modal de fondo de apertura obligatorio al inicio del día */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={showOpeningModal}
                    onRequestClose={() => {}}
                >
                    <View style={styles.modalOverlay}>
                        <View style={dynamicStyles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Fondo inicial de caja</Text>
                            </View>
                            <View style={styles.modalBody}>
                                <Text style={[styles.modalLabel, { marginBottom: 8 }]}>Ingresa el monto con el que abres caja hoy</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    value={openingAmount}
                                    onChangeText={setOpeningAmount}
                                    autoFocus
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.cobrarButton}
                                onPress={handleConfirmOpening}
                            >
                                <Text style={styles.cobrarButtonText}>Guardar fondo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Modal de corte de caja */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showClosingModal}
                    onRequestClose={() => setShowClosingModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[dynamicStyles.modalContent, { maxHeight: height * 0.9, width: Math.min(600, width - 40) }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Corte de Caja</Text>
                            </View>
                            
                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
                                {/* Summary section */}
                                <View style={styles.closingSummary}>
                                    <Text style={styles.closingSectionTitle}>Resumen</Text>
                                    <View style={styles.summaryLine}>
                                        <Text>Fondo inicial:</Text>
                                        <Text style={styles.summaryValue}>${openingFund.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.summaryLine}>
                                        <Text>Ventas del día ({todaySales.length}):</Text>
                                        <Text style={styles.summaryValue}>${todaySales.reduce((s, v) => s + v.total_amount, 0).toFixed(2)}</Text>
                                    </View>
                                    <View style={[styles.summaryLine, { borderTopWidth: 2, borderTopColor: '#38b24d', paddingTop: 8, marginTop: 8 }]}>
                                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total esperado:</Text>
                                        <Text style={[styles.summaryValue, { fontWeight: 'bold', fontSize: 16 }]}>
                                            ${(openingFund + todaySales.reduce((s, v) => s + v.total_amount, 0)).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                                
                                {/* Denomination inputs */}
                                <View style={styles.denominationsSection}>
                                    <Text style={styles.closingSectionTitle}>Monedas</Text>
                                    <View style={styles.denomGrid}>
                                        {['1', '2', '5', '10', '20'].map(d => (
                                            <View key={d} style={styles.denomItem}>
                                                <Text style={styles.denomLabel}>${d}</Text>
                                                <TextInput
                                                    style={styles.denomInput}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    value={coins[d as keyof typeof coins]}
                                                    onChangeText={text => setCoins({ ...coins, [d]: text })}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                    
                                    <Text style={[styles.closingSectionTitle, { marginTop: 15 }]}>Billetes</Text>
                                    <View style={styles.denomGrid}>
                                        {['20', '50', '100', '200', '500', '1000'].map(d => (
                                            <View key={d} style={styles.denomItem}>
                                                <Text style={styles.denomLabel}>${d}</Text>
                                                <TextInput
                                                    style={styles.denomInput}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    value={bills[d as keyof typeof bills]}
                                                    onChangeText={text => setBills({ ...bills, [d]: text })}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                
                                {/* Actual vs Expected */}
                                <View style={styles.closingSummary}>
                                    <View style={styles.summaryLine}>
                                        <Text style={{ fontWeight: 'bold' }}>Total contado:</Text>
                                        <Text style={[styles.summaryValue, { fontWeight: 'bold' }]}>${calculateActualCash().toFixed(2)}</Text>
                                    </View>
                                    <View style={[styles.summaryLine, { backgroundColor: calculateActualCash() - (openingFund + todaySales.reduce((s, v) => s + v.total_amount, 0)) >= 0 ? '#e8f5e9' : '#ffebee', padding: 10, borderRadius: 6, marginTop: 8 }]}>
                                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Diferencia:</Text>
                                        <Text style={{ fontWeight: 'bold', fontSize: 18, color: calculateActualCash() - (openingFund + todaySales.reduce((s, v) => s + v.total_amount, 0)) >= 0 ? '#2e7d32' : '#d32f2f' }}>
                                            ${(calculateActualCash() - (openingFund + todaySales.reduce((s, v) => s + v.total_amount, 0))).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </ScrollView>
                            
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, paddingHorizontal: 15, paddingBottom: 15 }}>
                                <TouchableOpacity
                                    style={[styles.cobrarButton, { flex: 1, backgroundColor: '#999' }]}
                                    onPress={() => setShowClosingModal(false)}
                                >
                                    <Text style={styles.cobrarButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.cobrarButton, { flex: 1 }]}
                                    onPress={generateClosingPDF}
                                >
                                    <Text style={styles.cobrarButtonText}>Cerrar Corte</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* 📱 MODAL RESPONSIVO DE COBRO */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showPaymentModal}
                onRequestClose={closePaymentModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={dynamicStyles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cobro</Text>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Total:</Text>
                                <Text style={styles.modalValue}>${total.toFixed(2)}</Text>
                            </View>

                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Cantidad recibida:</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={receivedAmount}
                                    onChangeText={(text) => {
                                        setReceivedAmount(text);
                                        const pago = parseFloat(text);
                                        if (!isNaN(pago) && pago >= total) {
                                            setCambio(pago - total);
                                        } else {
                                            setCambio(0);
                                        }
                                    }}
                                    keyboardType="numeric"
                                    placeholder="500$"
                                    autoFocus
                                />
                            </View>

                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Cambio:</Text>
                                <Text style={styles.modalValue}>${cambio.toFixed(2)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.cobrarButton}
                            onPress={handleCobrar}
                        >
                            <Text style={styles.cobrarButtonText}>Cobrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ProtectedLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        flexDirection: "row",
        padding: 20,
        gap: 20,
    },
    products: {
        flex: 2,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    productsScroll: {
        flex: 1,
    },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#ddd",
        paddingBottom: 10,
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: "#f0f0f0",
    },
    tableCell: {
        fontSize: 16,
    },
    cart: {
        width: 380,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    cartItems: {
        flex: 1,
        marginBottom: 15,
    },
    cartRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    itemName: {
        flex: 2,
        fontSize: 16,
    },
    itemControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cartBtn: {
        width: 30,
        height: 30,
        backgroundColor: '#38b24d',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
    },
    cartBtnText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 20,
    },
    itemQuantity: {
        fontSize: 16,
        minWidth: 30,
        textAlign: 'center',
    },
    itemTotal: {
        fontSize: 16,
        minWidth: 80,
        textAlign: 'right',
    },
    paymentSection: {
        borderTopWidth: 1,
        borderColor: '#ddd',
        paddingTop: 15,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 18,
        minWidth: 100,
        textAlign: 'right',
    },
    amountInput: {
        width: 100,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 10,
        fontSize: 18,
        textAlign: 'right',
    },
    payButton: {
        backgroundColor: '#38b24d',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    payButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    payButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    // 📱 ESTILOS RESPONSIVOS ADICIONALES
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    emptyCart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyCartText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    // 📱 ESTILOS DEL MODAL RESPONSIVO
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalHeader: {
        backgroundColor: '#38b24d',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    modalBody: {
        marginBottom: 20,
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    modalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        minWidth: 100,
        textAlign: 'right',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        fontSize: 18,
        minWidth: 100,
        textAlign: 'right',
        backgroundColor: '#f9f9f9',
    },
    cobrarButton: {
        backgroundColor: '#38b24d',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cobrarButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closingButton: {
        backgroundColor: '#1976d2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    closingButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closingSummary: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    closingSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    summaryLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#38b24d',
    },
    denominationsSection: {
        marginBottom: 15,
    },
    denomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    denomItem: {
        width: '30%',
        minWidth: 90,
        flexGrow: 1,
    },
    denomLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        color: '#555',
    },
    denomInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 8,
        fontSize: 16,
        textAlign: 'center',
        backgroundColor: '#fff',
    },
});