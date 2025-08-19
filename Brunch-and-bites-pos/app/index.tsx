import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from "react-native";

export default function App() {
  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <Image
          source={{ uri: "https://i.imgur.com/your-logo.png" }} // Cambia por tu logo local o remoto
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
            <TouchableOpacity style={styles.payButton}>
              <Text style={styles.payButtonText}>Pagar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});