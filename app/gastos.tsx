import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert } from "react-native";
import ProtectedLayout from './components/ProtectedLayout';
import { openDB, getAllExpenses, addExpense, updateExpense, deleteExpense } from './lib/database.refactor';
import type { Expense } from './lib/database.types';

export default function GastosScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoModalVisible, setNuevoModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [gastoSeleccionado, setGastoSeleccionado] = useState<Expense | null>(null);
  const [gastoEdit, setGastoEdit] = useState<Expense>({ id: 0, expense_date: "", expense_time: "", description: "", amount: 0 });
  const [nuevoGasto, setNuevoGasto] = useState({ description: "", amount: "" });
  const [gastos, setGastos] = useState<Expense[]>([]);
  const [gastoToDelete, setGastoToDelete] = useState<Expense | null>(null);

  // Cargar gastos desde la base de datos
  const loadExpenses = async () => {
    try {
      const db = await openDB();
      const expensesList = await getAllExpenses(db);
      setGastos(expensesList);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los gastos');
      console.error('Error loading expenses:', error);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleVerGasto = (gasto: Expense) => {
    setGastoSeleccionado(gasto);
    setModalVisible(true);
  };

  const handleEdit = (gasto: Expense) => {
    setGastoEdit(gasto);
    setEditModalVisible(true);
  };

  const handleGuardarEdit = async () => {
    try {
      if (!gastoEdit.description.trim() || gastoEdit.amount <= 0) {
        Alert.alert('Error', 'Por favor complete todos los campos correctamente');
        return;
      }
      
      const db = await openDB();
      await updateExpense(db, gastoEdit.id, gastoEdit.description, gastoEdit.amount);
      setEditModalVisible(false);
      await loadExpenses();
      Alert.alert('Éxito', 'Gasto actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el gasto');
      console.error('Error updating expense:', error);
    }
  };

  const handleNuevoGasto = () => {
    setNuevoGasto({ description: "", amount: "" });
    setNuevoModalVisible(true);
  };

  const handleGuardarNuevoGasto = async () => {
    try {
      const amount = parseFloat(nuevoGasto.amount);
      
      if (!nuevoGasto.description.trim() || isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Por favor complete todos los campos correctamente');
        return;
      }
      
      const db = await openDB();
      await addExpense(db, nuevoGasto.description, amount);
      setNuevoModalVisible(false);
      setNuevoGasto({ description: "", amount: "" });
      await loadExpenses();
      Alert.alert('Éxito', 'Gasto agregado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el gasto');
      console.error('Error adding expense:', error);
    }
  };

  const handleDelete = (gasto: Expense) => {
    setGastoToDelete(gasto);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!gastoToDelete) return;
    
    try {
      const db = await openDB();
      await deleteExpense(db, gastoToDelete.id);
      setDeleteModalVisible(false);
      setGastoToDelete(null);
      await loadExpenses();
      Alert.alert('Éxito', 'Gasto eliminado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el gasto');
      console.error('Error deleting expense:', error);
    }
  };

  return (
    <ProtectedLayout title="Gastos" requiredPermission="GESTIONAR_GASTOS">
      <View style={styles.productsTable}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 1.2, fontWeight: "bold", fontSize: 22 }]}>Fecha</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 22 }]}>Cantidad</Text>
          <Text style={[styles.tableCell, { flex: 1.5, fontWeight: "bold", fontSize: 22 }]}>Descripción</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleNuevoGasto}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
        <ScrollView>
          {gastos.map((gasto, idx) => (
            <View style={styles.tableRow} key={idx}>
              <TouchableOpacity 
                style={styles.rowContent}
                onPress={() => handleVerGasto(gasto)}
              >
                <Text style={[styles.tableCell, { flex: 1.2 }]}>
                  {gasto.expense_date}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  ${gasto.amount.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                  {gasto.description}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(gasto)}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(gasto)}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Modal Datos del Gasto */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.gastoBox}>
            <View style={styles.gastoHeader}>
              <Text style={styles.gastoHeaderTitle}>Detalle del gasto</Text>
            </View>
            <View style={styles.gastoContent}>
              <Text style={styles.gastoLabel}>Fecha: {gastoSeleccionado?.expense_date}</Text>
              <Text style={styles.gastoLabel}>Hora: {gastoSeleccionado?.expense_time}</Text>
              <Text style={styles.gastoLabel}>Monto: ${gastoSeleccionado?.amount.toFixed(2)}</Text>
              <Text style={styles.gastoLabel}>Descripción:</Text>
              <View style={styles.gastoDescripcionBox}>
                <Text style={styles.gastoDescripcionText}>{gastoSeleccionado?.description}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cerrarBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cerrarBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Gasto */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.nuevoBox}>
            <View style={styles.gastoHeader}>
              <Text style={styles.gastoHeaderTitle}>Editar gasto</Text>
            </View>
            <View style={styles.nuevoContent}>
              <Text style={styles.nuevoLabel}>Descripción:</Text>
              <TextInput
                style={styles.nuevoDescripcionInput}
                value={gastoEdit.description}
                onChangeText={text => setGastoEdit({ ...gastoEdit, description: text })}
                multiline
              />
              <Text style={styles.nuevoLabel}>Monto:</Text>
              <TextInput
                style={styles.nuevoInput}
                value={gastoEdit.amount.toString()}
                onChangeText={text => setGastoEdit({ ...gastoEdit, amount: parseFloat(text) || 0 })}
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

      {/* Modal Nuevo Gasto */}
      <Modal visible={nuevoModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.nuevoBox}>
            <View style={styles.gastoHeader}>
              <Text style={styles.gastoHeaderTitle}>Nuevo gasto</Text>
            </View>
            <View style={styles.nuevoContent}>
              <Text style={styles.nuevoLabel}>Descripción:</Text>
              <TextInput
                style={styles.nuevoDescripcionInput}
                value={nuevoGasto.description}
                onChangeText={text => setNuevoGasto({ ...nuevoGasto, description: text })}
                multiline
                placeholder="Describe el gasto..."
              />
              <Text style={styles.nuevoLabel}>Monto:</Text>
              <TextInput
                style={styles.nuevoInput}
                value={nuevoGasto.amount}
                onChangeText={text => setNuevoGasto({ ...nuevoGasto, amount: text })}
                keyboardType="numeric"
                placeholder="0.00"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.guardarBtn, { backgroundColor: '#dc3545' }]} onPress={() => setNuevoModalVisible(false)}>
                <Text style={styles.guardarBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.guardarBtn} onPress={handleGuardarNuevoGasto}>
                <Text style={styles.guardarBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.gastoBox}>
            <View style={styles.gastoHeader}>
              <Text style={styles.gastoHeaderTitle}>Confirmar eliminación</Text>
            </View>
            <View style={styles.gastoContent}>
              <Text style={styles.confirmText}>
                ¿Está seguro de que desea eliminar el gasto "{gastoToDelete?.description}" por ${gastoToDelete?.amount.toFixed(2)}?
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.cerrarBtn, { backgroundColor: '#6c757d' }]} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cerrarBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cerrarBtn, { backgroundColor: '#dc3545' }]} onPress={confirmDelete}>
                <Text style={styles.cerrarBtnText}>Eliminar</Text>
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
  // Nuevos estilos para botones de acción
  rowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#007bff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editBtnText: {
    color: "#fff",
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 0,
  },
  confirmText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
});