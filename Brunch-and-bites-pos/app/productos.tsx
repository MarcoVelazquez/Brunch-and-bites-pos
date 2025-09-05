import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Modal, TextInput } from "react-native";

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [productoEdit, setProductoEdit] = useState({ nombre: "", precio: "" });
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", precio: "" });

  // Productos de ejemplo
  const [productos, setProductos] = useState([
    { nombre: "Traquea", precio: "50" },
    { nombre: "Pata de conejo", precio: "30" },
  ]);

  // Abrir modal de edición y cargar datos del producto
  const handleEdit = (producto: { nombre: string; precio: string }) => {
    setProductoEdit(producto);
    setEditModalVisible(true);
  };

  // Guardar cambios de edición (puedes agregar lógica real aquí)
  const handleGuardarEdit = () => {
    setEditModalVisible(false);
    // Aquí podrías actualizar el producto en tu lista
  };

  // Abrir modal de nuevo producto
  const handleNuevo = () => {
    setNuevoProducto({ nombre: "", precio: "" });
    setModalVisible(true);
  };

  // Guardar nuevo producto
  const handleGuardarNuevo = () => {
    setProductos([...productos, nuevoProducto]);
    setModalVisible(false);
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
          <Text style={styles.headerTitle}>Productos</Text>
        </View>
        {/* Tabla de productos */}
        <View style={styles.productsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold", fontSize: 22 }]}>Nombre</Text>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 22 }]}>Precio</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleNuevo}>
              <Text style={styles.addBtnText}>＋</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {productos.map((producto, idx) => (
              <View style={styles.tableRow} key={idx}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{producto.nombre}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{producto.precio}$</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(producto)}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Modal Editar Producto */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.editBox}>
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>Editar producto</Text>
            </View>
            <View style={styles.editContent}>
              <Text style={styles.editLabel}>Nombre</Text>
              <TextInput
                style={styles.editInput}
                value={productoEdit.nombre}
                onChangeText={text => setProductoEdit({ ...productoEdit, nombre: text })}
              />
              <Text style={styles.editLabel}>Precio</Text>
              <TextInput
                style={styles.editInput}
                value={productoEdit.precio}
                onChangeText={text => setProductoEdit({ ...productoEdit, precio: text })}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.guardarBtn} onPress={handleGuardarEdit}>
              <Text style={styles.guardarBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Nuevo Producto */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.editBox}>
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>Nuevo producto</Text>
            </View>
            <View style={styles.editContent}>
              <Text style={styles.editLabel}>Nombre</Text>
              <TextInput
                style={styles.editInput}
                value={nuevoProducto.nombre}
                onChangeText={text => setNuevoProducto({ ...nuevoProducto, nombre: text })}
              />
              <Text style={styles.editLabel}>Precio</Text>
              <TextInput
                style={styles.editInput}
                value={nuevoProducto.precio}
                onChangeText={text => setNuevoProducto({ ...nuevoProducto, precio: text })}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.guardarBtn} onPress={handleGuardarNuevo}>
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
  editBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#38b24d",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  editBtnText: {
    color: "#fff",
    fontSize: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  editBox: {
    width: 350,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
  },
  editHeader: {
    backgroundColor: "#a3d6b1",
    width: "100%",
    padding: 10,
    alignItems: "center",
  },
  editHeaderTitle: {
    fontSize: 32,
    fontWeight: "bold",
  },
  editContent: {
    margin: 20,
    width: "90%",
  },
  editLabel: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  editInput: {
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