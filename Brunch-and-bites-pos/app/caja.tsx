import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Modal, TextInput } from "react-native";

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [cantidadRecibida, setCantidadRecibida] = useState("0");
  const total = 100;
  const cambio = Number(cantidadRecibida) - total;

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <Image
          source={{ uri: "https://i.imgur.com/your-logo.png" }}
          style={styles.logo}
        />
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Caja</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Productos</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Recibos</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Gastos</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Costeos</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Reportes</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Usuarios</Text></TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Caja</Text>
        </View>
        {/* Productos y Carrito */}
        <View style={styles.body}>
          {/* Productos */}
          <View style={styles.products}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold" }]}>Nombre</Text>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold" }]}>Precio</Text>
            </View>
            <ScrollView>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Traquea</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>50$</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Pata de conejo</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>30$</Text>
              </View>
            </ScrollView>
          </View>
          {/* Carrito */}
          <View style={styles.cart}>
            <Text style={styles.sectionTitle}>Carrito</Text>
            <View style={styles.cartRow}>
              <Text style={{ flex: 2 }}>Tráquea x2</Text>
              <TouchableOpacity style={styles.cartBtn}><Text>+</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cartBtn}><Text>-</Text></TouchableOpacity>
              <Text style={{ flex: 1, textAlign: "right" }}>100$</Text>
            </View>
            <View style={styles.cartFooter}>
              <Text style={{ flex: 1 }}>Total</Text>
              <Text style={{ flex: 1, textAlign: "right" }}>100$</Text>
            </View>
            <TouchableOpacity style={styles.payButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.payButtonText}>Pagar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal de Cobro */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.cobroBox}>
            <View style={styles.cobroHeader}>
              <Text style={styles.cobroHeaderTitle}>Cobro</Text>
            </View>
            <View style={styles.cobroContent}>
              <View style={styles.cobroRow}>
                <Text style={styles.cobroLabel}>Total:</Text>
                <Text style={styles.cobroValue}>{total}$</Text>
              </View>
              <View style={styles.cobroRow}>
                <Text style={styles.cobroLabel}>Cantidad recibida:</Text>
                <TextInput
                  style={styles.cobroInput}
                  value={cantidadRecibida}
                  onChangeText={setCantidadRecibida}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.cobroRow}>
                <Text style={styles.cobroLabel}>Cambio:</Text>
                <Text style={styles.cobroValue}>{cambio >= 0 ? cambio + "$" : "0$"}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cobrarBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cobrarBtnText}>Cobrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ...existing styles...
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "A5D6BA",
    borderRadius: 0,
    margin: 0,
    overflow: "hidden",
  },
  sidebar: {
    width: '23.4%',
    backgroundColor: "#a3d6b1",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  menuButton: {
    width: '33.3%',
    height: 80,
    backgroundColor: "#38b24d",
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  menuText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  main: {
    flex: 1,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#a3d6b1",
    padding: 10,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  products: {
    flex: 2,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  tableCell: {
    fontSize: 16,
  },
  cart: {
    flex: 1,
    padding: 10,
    borderLeftWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "space-between",
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cartBtn: {
    width: 30,
    height: 30,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    marginHorizontal: 2,
  },
  cartFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
  },
  payButton: {
    backgroundColor: "#38b24d",
    paddingVertical: 18,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  payButtonText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  cobroBox: {
    width: 350,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
  },
  cobroHeader: {
    backgroundColor: "#a3d6b1",
    width: "100%",
    padding: 10,
    alignItems: "center",
  },
  cobroHeaderTitle: {
    fontSize: 32,
    fontWeight: "bold",
  },
  cobroContent: {
    margin: 20,
    width: "90%",
  },
  cobroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    justifyContent: "space-between",
  },
  cobroLabel: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cobroValue: {
    fontSize: 20,
  },
  cobroInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 20,
    backgroundColor: "#fff",
    width: 100,
    textAlign: "center",
  },
  cobrarBtn: {
    backgroundColor: "#38b24d",
    width: "100%",
    paddingVertical: 18,
    alignItems: "center",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cobrarBtnText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
  },
});