import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Modal, TextInput } from "react-native";

export default function Recibos() {
  const [modalVisible, setModalVisible] = useState(false);
  const [reciboSeleccionado, setReciboSeleccionado] = useState({
    fecha: "",
    hora: "",
    productos: "",
    total: "",
  });

  // Ejemplo de recibos
  const recibos = [
    {
      fecha: "22/08/2025",
      hora: "10:58 pm",
      productos: "Traquea 50$",
      total: "50$",
    },
    {
      fecha: "22/08/2025",
      hora: "11:30 pm",
      productos: "Pata de conejo 30$",
      total: "30$",
    },
  ];

  const handleVerRecibo = (recibo: typeof recibos[0]) => {
    setReciboSeleccionado(recibo);
    setModalVisible(true);
  };

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <Image
          source={require("../assets/images/icon.png")}
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
          <Text style={styles.headerTitle}>Recibos</Text>
        </View>
        {/* Tabla de recibos */}
        <View style={styles.productsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold", fontSize: 22 }]}>Fecha y hora</Text>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 22 }]}>Cantidad</Text>
          </View>
          <ScrollView>
            {recibos.map((recibo, idx) => (
              <TouchableOpacity key={idx} onPress={() => handleVerRecibo(recibo)}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{recibo.fecha} {recibo.hora}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{recibo.total}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Modal Datos del Recibo */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.reciboBox}>
            <View style={styles.reciboHeader}>
              <Text style={styles.reciboHeaderTitle}>Datos del recibo</Text>
            </View>
            <View style={styles.reciboContent}>
              <Text style={styles.reciboLabel}>Fecha: {reciboSeleccionado.fecha}</Text>
              <Text style={styles.reciboLabel}>Hora: {reciboSeleccionado.hora}</Text>
              <Text style={styles.reciboLabel}>Productos:</Text>
              <View style={styles.reciboProductosBox}>
                <Text style={styles.reciboProductosText}>{reciboSeleccionado.productos}</Text>
              </View>
              <View style={styles.reciboRow}>
                <Text style={styles.reciboLabel}>Total:</Text>
                <Text style={styles.reciboTotal}>{reciboSeleccionado.total}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.imprimirBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.imprimirBtnText}>Imprimir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#e6f0fa",
    borderRadius: 20,
    margin: 10,
    overflow: "hidden",
  },
  sidebar: {
    width: 220,
    backgroundColor: "#a3d6b1",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    resizeMode: "contain",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  menuButton: {
    width: 90,
    height: 60,
    backgroundColor: "#38b24d",
    margin: 5,
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
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#a3d6b1",
    padding: 10,
    alignItems: "center",
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
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
  reciboHeaderTitle: {
    fontSize: 32,
    fontWeight: "bold",
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
});