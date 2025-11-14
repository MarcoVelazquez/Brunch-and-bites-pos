import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert } from "react-native";
import ProtectedLayout from './components/ProtectedLayout';
import { simpleGetAllProducts } from './lib/index';
import { simpleAddProduct, simpleUpdateProduct, simpleDeleteProduct } from './lib/database.refactor';
import type { Product } from './lib/database.types';

export default function ProductosScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productoEdit, setProductoEdit] = useState<Product>({ id: 0, name: "", price: 0, cost: 0 });
  const [nuevoProducto, setNuevoProducto] = useState({ name: "", price: "", cost: "" });
  const [productos, setProductos] = useState<Product[]>([]);
  const [productoToDelete, setProductoToDelete] = useState<Product | null>(null);

  const loadProducts = async () => {
    try {
      const productsList = await simpleGetAllProducts();
      setProductos(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos. Intenta recargar la aplicación.');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleEdit = (producto: Product) => {
    setProductoEdit(producto);
    setEditModalVisible(true);
  };

  const handleGuardarEdit = async () => {
    try {
      if (!productoEdit.name.trim() || productoEdit.price <= 0 || productoEdit.cost < 0) {
        Alert.alert('Error', 'Por favor complete todos los campos correctamente');
        return;
      }
      await simpleUpdateProduct(productoEdit.id, productoEdit.name, productoEdit.price, productoEdit.cost);
      setEditModalVisible(false);
      await loadProducts();
      Alert.alert('Éxito', 'Producto actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el producto');
      console.error('Error updating product:', error);
    }
  };

  const handleNuevo = () => {
    setNuevoProducto({ name: "", price: "", cost: "" });
    setModalVisible(true);
  };

  const handleGuardarNuevo = async () => {
    try {
      const price = parseFloat(nuevoProducto.price);
      const cost = parseFloat(nuevoProducto.cost);
      if (!nuevoProducto.name.trim() || isNaN(price) || price <= 0 || isNaN(cost) || cost < 0) {
        Alert.alert('Error', 'Por favor complete todos los campos correctamente');
        return;
      }
      await simpleAddProduct(nuevoProducto.name, parseFloat(nuevoProducto.price), parseFloat(nuevoProducto.cost));
      setModalVisible(false);
      setNuevoProducto({ name: "", price: "", cost: "" });
      await loadProducts();
      Alert.alert('Éxito', 'Producto agregado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el producto');
      console.error('Error adding product:', error);
    }
  };

  const handleDelete = (producto: Product) => {
    setProductoToDelete(producto);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!productoToDelete) return;
    try {
      await simpleDeleteProduct(productoToDelete.id);
      setDeleteModalVisible(false);
      setProductoToDelete(null);
      await loadProducts();
      Alert.alert('Éxito', 'Producto eliminado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el producto');
      console.error('Error deleting product:', error);
    }
  };

  return (
    <ProtectedLayout title="Productos" requiredPermission="GESTIONAR_PRODUCTOS">
      <View style={styles.productsTable}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold", fontSize: 22 }]}>Nombre</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 22 }]}>Precio</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 22 }]}>Costo</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleNuevo}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
        <ScrollView>
          {productos.map((producto, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{producto.name}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}></Text>
              <Text style={[styles.tableCell, { flex: 1 }]}></Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(producto)}>
                  <Text style={styles.editBtnText}></Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(producto)}>
                  <Text style={styles.deleteBtnText}></Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
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
                value={productoEdit.name}
                onChangeText={text => setProductoEdit({ ...productoEdit, name: text })}
              />
              <Text style={styles.editLabel}>Precio</Text>
              <TextInput
                style={styles.editInput}
                value={productoEdit.price.toString()}
                onChangeText={text => setProductoEdit({ ...productoEdit, price: parseFloat(text) || 0 })}
                keyboardType="numeric"
              />
              <Text style={styles.editLabel}>Costo</Text>
              <TextInput
                style={styles.editInput}
                value={productoEdit.cost.toString()}
                onChangeText={text => setProductoEdit({ ...productoEdit, cost: parseFloat(text) || 0 })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.guardarBtn, { backgroundColor: '#dc3545' }]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.guardarBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.guardarBtn} onPress={handleGuardarEdit}>
                <Text style={styles.guardarBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
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
                value={nuevoProducto.name}
                onChangeText={text => setNuevoProducto({ ...nuevoProducto, name: text })}
              />
              <Text style={styles.editLabel}>Precio</Text>
              <TextInput
                style={styles.editInput}
                value={nuevoProducto.price}
                onChangeText={text => setNuevoProducto({ ...nuevoProducto, price: text })}
                keyboardType="numeric"
              />
              <Text style={styles.editLabel}>Costo</Text>
              <TextInput
                style={styles.editInput}
                value={nuevoProducto.cost}
                onChangeText={text => setNuevoProducto({ ...nuevoProducto, cost: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.guardarBtn, { backgroundColor: '#dc3545' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.guardarBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.guardarBtn} onPress={handleGuardarNuevo}>
                <Text style={styles.guardarBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.editBox}>
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>Confirmar eliminación</Text>
            </View>
            <View style={styles.editContent}>
              <Text style={styles.confirmText}>
                ¿Está seguro de que desea eliminar el producto "{productoToDelete?.name}"?
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.guardarBtn, { backgroundColor: '#6c757d' }]} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.guardarBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.guardarBtn, { backgroundColor: '#dc3545' }]} onPress={confirmDelete}>
                <Text style={styles.guardarBtnText}>Eliminar</Text>
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
  actionButtons: {
    flexDirection: "row",
    gap: 8,
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
    backgroundColor: "#007bff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  editBtnText: {
    color: "#fff",
    fontSize: 16,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#dc3545",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 16,
  },
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
    fontSize: 28,
    fontWeight: "bold",
  },
  editContent: {
    margin: 20,
    width: "90%",
  },
  editLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#fff",
    width: "100%",
    marginBottom: 18,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
  },
  guardarBtn: {
    backgroundColor: "#38b24d",
    flex: 1,
    paddingVertical: 18,
    alignItems: "center",
  },
  guardarBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  confirmText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});
