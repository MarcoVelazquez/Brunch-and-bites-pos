import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, Modal, Dimensions } from "react-native";
import ProtectedLayout from './components/ProtectedLayout';
import { useAuth } from './contexts/AuthContext';
import { getAllProducts, addSale, addSaleItems, openDB } from './lib/database.refactor';
import type { Product } from './lib/database.types';

interface CartItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
}

export default function CajaScreen() {
    const { db, user } = useAuth();
    const [cantidad, setCantidad] = useState('');
    const [cambio, setCambio] = useState(0);
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState('');
    
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

    // Cargar productos de la base de datos
    useEffect(() => {
        const loadProducts = async () => {
            if (!db) {
                console.log('Database not initialized yet');
                return;
            }
            try {
                setLoading(true);
                const allProducts = await getAllProducts(db);
                setProducts(allProducts);
            } catch (error) {
                console.error('Error loading products:', error);
                Alert.alert('Error', 'No se pudieron cargar los productos. Intenta recargar la aplicación.');
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
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
                    </View>
                </View>
            </View>

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
});