import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Modal, TextInput } from "react-native";

export default function Gastos() {
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoModalVisible, setNuevoModalVisible] = useState(false);
  const [gastoSeleccionado, setGastoSeleccionado] = useState({
    titulo: "",
    fecha: "",
    costo: "",
    descripcion: "",
  });
  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: "22/08/2025",
    titulo: "",
    costo: "",
    descripcion: "",
  });

  // Ejemplo de gastos
  const [gastos, setGastos] = useState([
    {
      titulo: "Traqueas",
      fecha: "22/08/2025",
      costo: "500$",
      descripcion: "Costal de 10 kilos de traqueas",
    },
    {
      titulo: "Orejas",
      fecha: "30/08/2025",
      costo: "300$",
      descripcion: "Bolsa de orejas de cerdo",
    },
  ]);

  const handleVerGasto = (gasto: typeof gastos[0]) => {
    setGastoSeleccionado(gasto);
    setModalVisible(true);
  };

  const handleNuevoGasto = () => {
    setNuevoGasto({
      fecha: "22/08/2025",
      titulo: "",
      costo: "",
      descripcion: "",
    });
    setNuevoModalVisible(true);
  };

  const handleGuardarNuevoGasto = () => {
    setGastos([...gastos, nuevoGasto]);
    setNuevoModalVisible(false);
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
          <Text style={styles.headerTitle}>Gastos</Text>
        </View>
        {/* Tabla de gastos */}
        <View style={styles.productsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 1.2, fontWeight: "bold", fontSize: 22 }]}>Fecha</Text>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 22 }]}>Cantidad</Text>
            <Text style={[styles.tableCell, { flex: 1.5, fontWeight: "bold", fontSize: 22 }]}>Titulo</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleNuevoGasto}>
              <Text style={styles.addBtnText}>＋</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {gastos.map((gasto, idx) => (
              <TouchableOpacity key={idx} onPress={() => handleVerGasto(gasto)}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>{gasto.fecha}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{gasto.costo}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{gasto.titulo}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Modal Datos del Gasto */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.gastoBox}>
            <View style={styles.gastoHeader}>
              <Text style={styles.gastoHeaderTitle}>{gastoSeleccionado.titulo}</Text>
            </View>
            <View style={styles.gastoContent}>
              <Text style={styles.gastoLabel}>Fecha: {gastoSeleccionado.fecha}</Text>
              <Text style={styles.gastoLabel}>Costo: {gastoSeleccionado.costo}</Text>
              <Text style={styles.gastoLabel}>Descripción:</Text>
              <View style={styles.gastoDescripcionBox}>
                <Text style={styles.gastoDescripcionText}>{gastoSeleccionado.descripcion}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cerrarBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cerrarBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Nuevo Gasto */}
      <Modal visible={nuevoModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.nuevoBox}>
            <View style={styles.gastoHeader}>
              <Text style={styles.gastoHeaderTitle}>Nuevo gasto</Text>
            </View>
            <View style={styles.nuevoContent}>
              <Text style={styles.nuevoLabel}>Fecha: {nuevoGasto.fecha}</Text>
              <Text style={styles.nuevoLabel}>Titulo:</Text>
              <TextInput
                style={styles.nuevoInput}
                value={nuevoGasto.titulo}
                onChangeText={text => setNuevoGasto({ ...nuevoGasto, titulo: text })}
              />
              <Text style={styles.nuevoLabel}>Costo:</Text>
              <TextInput
                style={styles.nuevoInput}
                value={nuevoGasto.costo}
                onChangeText={text => setNuevoGasto({ ...nuevoGasto, costo: text })}
                keyboardType="numeric"
              />
              <Text style={styles.nuevoLabel}>Descripción:</Text>
              <TextInput
                style={styles.nuevoDescripcionInput}
                value={nuevoGasto.descripcion}
                onChangeText={text => setNuevoGasto({ ...nuevoGasto, descripcion: text })}
                multiline
              />
            </View>
            <TouchableOpacity style={styles.guardarBtn} onPress={handleGuardarNuevoGasto}>
              <Text style={styles.guardarBtnText}>Guardar</Text>
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
  addBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#38b24d",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: -2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  gastoBox: {
    width: 350,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
  },
  gastoHeader: {
    backgroundColor: "#a3d6b1",
    width: "100%",
    padding: 10,
    alignItems: "center",
  },
  gastoHeaderTitle: {
    fontSize: 32,
    fontWeight: "bold",
  },
  gastoContent: {
    margin: 20,
    width: "90%",
  },
  gastoLabel: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  gastoDescripcionBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
    padding: 8,
    marginBottom: 18,
    minHeight: 60,
    justifyContent: "flex-start",
  },
  gastoDescripcionText: {
    fontSize: 18,
  },
  cerrarBtn: {
    backgroundColor: "#38b24d",
    width: "100%",
    paddingVertical: 18,
    alignItems: "center",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cerrarBtnText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
  },
  // Nuevo gasto modal
  nuevoBox: {
    width: 350,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
  },
  nuevoContent: {
    margin: 20,
    width: "90%",
  },
  nuevoLabel: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  nuevoInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 20,
    backgroundColor: "#fff",
    width: "100%",
    marginBottom: 18,
  },
  nuevoDescripcionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    backgroundColor: "#fff",
    width: "100%",
    minHeight: 80,
    marginBottom: 18,
    textAlignVertical: "top",
  },
  guardarBtn: {
    backgroundColor: "#38b24d",
    width: "100%",
    paddingVertical: 18,
    alignItems: "center",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  guardarBtnText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
  },
});