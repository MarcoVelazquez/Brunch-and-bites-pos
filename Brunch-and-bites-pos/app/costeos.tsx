import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert, useWindowDimensions } from "react-native";
import ProtectedLayout from './components/ProtectedLayout';
import { openDB, getAllCostings, getCostingItems, addCosting, addCostingItems, deleteCosting } from './lib/database.refactor';
import type { Costing, CostingItem } from './lib/database.types';

interface CostingWithItems extends Costing {
  items: CostingItem[];
}

export default function CosteosScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isSmallMobile = width < 400;
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nuevoModalVisible, setNuevoModalVisible] = useState(false);
  const [detalleModalVisible, setDetalleModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  const [costeoEdit, setCosteoEdit] = useState<CostingWithItems | null>(null);
  const [nuevoCosteo, setNuevoCosteo] = useState<{ name: string; items: Partial<CostingItem>[] }>({
    name: "",
    items: [
      { item_name: "", unit_of_measure: "", unit_price: 0, quantity_used: 0 }
    ]
  });
  
  const [detalleCosteo, setDetalleCosteo] = useState<CostingWithItems | null>(null);
  const [costeoToDelete, setCosteoToDelete] = useState<Costing | null>(null);
  const [costeos, setCosteos] = useState<CostingWithItems[]>([]);

  // Cargar costeos desde la base de datos
  const loadCostings = async () => {
    try {
      const db = await openDB();
      const costingsList = await getAllCostings(db);
      
      const costingsWithItems = await Promise.all(
        costingsList.map(async (costing) => {
          const items = await getCostingItems(db, costing.id);
          return { ...costing, items };
        })
      );
      
      setCosteos(costingsWithItems);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los costeos');
      console.error('Error loading costings:', error);
    }
  };

  useEffect(() => {
    loadCostings();
  }, []);

  // Abrir modal de edición
  const handleEdit = (costeo: CostingWithItems) => {
    setCosteoEdit({
      ...costeo,
      items: [...costeo.items, ...Array(Math.max(0, 4 - costeo.items.length)).fill({
        id: 0,
        costing_id: costeo.id,
        item_name: "",
        unit_of_measure: "",
        unit_price: 0,
        quantity_used: 0
      })]
    });
    setEditModalVisible(true);
  };

  // Guardar cambios de edición (eliminar y recrear)
  const handleGuardarEdit = async () => {
    if (!costeoEdit) return;
    
    try {
      const db = await openDB();
      
      // Calcular costo total
      const totalCost = costeoEdit.items
        .filter(item => item.item_name && item.item_name.trim() !== '')
        .reduce((sum, item) => sum + (item.unit_price * item.quantity_used), 0);
      
      // Eliminar costeo existente
      await deleteCosting(db, costeoEdit.id);
      
      // Crear nuevo costeo con el mismo nombre
      const newCostingId = await addCosting(db, costeoEdit.name, totalCost);
      
      // Agregar items
      const validItems = costeoEdit.items
        .filter(item => item.item_name && item.item_name.trim() !== '')
        .map(item => ({
          item_name: item.item_name,
          unit_of_measure: item.unit_of_measure,
          unit_price: item.unit_price,
          quantity_used: item.quantity_used
        }));
      
      if (validItems.length > 0) {
        await addCostingItems(db, newCostingId, validItems);
      }
      
      setEditModalVisible(false);
      await loadCostings();
      Alert.alert('Éxito', 'Costeo actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el costeo');
      console.error('Error updating costing:', error);
    }
  };

  // Abrir modal de nuevo costeo
  const handleNuevo = () => {
    setNuevoCosteo({
      name: "",
      items: [
        { item_name: "", unit_of_measure: "", unit_price: 0, quantity_used: 0 }
      ]
    });
    setNuevoModalVisible(true);
  };

  // Guardar nuevo costeo
  const handleGuardarNuevo = async () => {
    try {
      if (!nuevoCosteo.name.trim()) {
        Alert.alert('Error', 'Por favor ingrese un nombre para el costeo');
        return;
      }
      
      const db = await openDB();
      
      // Calcular costo total - convertir strings a números
      const totalCost = nuevoCosteo.items
        .filter(item => item.item_name && item.item_name.trim() !== '')
        .reduce((sum, item) => {
          const price = parseFloat(item.unit_price?.toString() || '0');
          const quantity = parseFloat(item.quantity_used?.toString() || '0');
          return sum + (price * quantity);
        }, 0);
      
      // Crear costeo
      const costingId = await addCosting(db, nuevoCosteo.name, totalCost);
      
      // Agregar items - convertir strings a números
      const validItems = nuevoCosteo.items
        .filter(item => item.item_name && item.item_name.trim() !== '')
        .map(item => ({
          item_name: item.item_name!,
          unit_of_measure: item.unit_of_measure || '',
          unit_price: parseFloat(item.unit_price?.toString() || '0'),
          quantity_used: parseFloat(item.quantity_used?.toString() || '0')
        }));
      
      if (validItems.length > 0) {
        await addCostingItems(db, costingId, validItems);
      }
      
      setNuevoModalVisible(false);
      await loadCostings();
      Alert.alert('Éxito', 'Costeo agregado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el costeo');
      console.error('Error adding costing:', error);
    }
  };

  // Abrir modal de detalle costeo
  const handleDetalle = (costeo: CostingWithItems) => {
    setDetalleCosteo(costeo);
    setDetalleModalVisible(true);
  };

  // Eliminar costeo
  const handleDelete = (costeo: Costing) => {
    setCosteoToDelete(costeo);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!costeoToDelete) return;
    
    try {
      const db = await openDB();
      await deleteCosting(db, costeoToDelete.id);
      setDeleteModalVisible(false);
      setCosteoToDelete(null);
      await loadCostings();
      Alert.alert('Éxito', 'Costeo eliminado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el costeo');
      console.error('Error deleting costing:', error);
    }
  };

  // Actualizar items en nuevo costeo
  const handleNuevoItemChange = (index: number, field: keyof CostingItem, value: string | number) => {
    const updatedItems = nuevoCosteo.items.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    setNuevoCosteo({ ...nuevoCosteo, items: updatedItems });
  };

  // Actualizar items en costeo de edición
  const handleEditItemChange = (index: number, field: keyof CostingItem, value: string | number) => {
    if (!costeoEdit) return;
    
    const updatedItems = costeoEdit.items.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    setCosteoEdit({ ...costeoEdit, items: updatedItems });
  };

  return (
    <ProtectedLayout title="Costeos" requiredPermission="GESTIONAR_COSTEOS">
      <View style={styles.productsTable}>
        {/* Header y botón de agregar */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold", fontSize: isMobile ? 14 : 22 }]}>Producto</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: isMobile ? 14 : 22 }]}>Costo</Text>
          <TouchableOpacity style={[styles.addBtn, isMobile && { width: 28, height: 28 }]} onPress={handleNuevo}>
            <Text style={[styles.addBtnText, isMobile && { fontSize: 20 }]}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de costeos */}
        <ScrollView>
          {costeos.map((costeo, idx) => (
            <View style={[styles.tableRow, isMobile && { paddingVertical: 8 }]} key={idx}>
              <TouchableOpacity 
                style={styles.rowContent}
                onPress={() => handleDetalle(costeo)}
              >
                <Text style={[styles.tableCell, { flex: 2, fontSize: isMobile ? 14 : 18 }]} numberOfLines={1}>{costeo.name}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: isMobile ? 14 : 18 }]}>${costeo.total_cost.toFixed(2)}</Text>
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.editBtnSmall, isMobile && { paddingHorizontal: 6, paddingVertical: 3 }]} onPress={() => handleEdit(costeo)}>
                  <Text style={[styles.editBtnText, isMobile && { fontSize: 12 }]}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteBtnSmall, isMobile && { paddingHorizontal: 6, paddingVertical: 3 }]} onPress={() => handleDelete(costeo)}>
                  <Text style={[styles.deleteBtnText, isMobile && { fontSize: 12 }]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Modal Detalle Costeo */}
      <Modal visible={detalleModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.detalleBox}>
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>{detalleCosteo?.name}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDetalleModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detalleContent}>
              <View style={styles.detalleTableHeader}>
                <Text style={styles.detalleCellHeader}>Insumo</Text>
                <Text style={styles.detalleCellHeader}>Unidad</Text>
                <Text style={styles.detalleCellHeader}>Precio Unit.</Text>
                <Text style={styles.detalleCellHeader}>Cantidad</Text>
                <Text style={styles.detalleCellHeader}>Subtotal</Text>
              </View>
              {detalleCosteo?.items.map((item, idx) => (
                <View style={styles.detalleTableRow} key={idx}>
                  <Text style={styles.detalleCell}>{item.item_name}</Text>
                  <Text style={styles.detalleCell}>{item.unit_of_measure}</Text>
                  <Text style={styles.detalleCell}>${item.unit_price.toFixed(2)}</Text>
                  <Text style={styles.detalleCell}>{item.quantity_used}</Text>
                  <Text style={styles.detalleCell}>${(item.unit_price * item.quantity_used).toFixed(2)}</Text>
                </View>
              ))}
              <Text style={styles.detalleTotal}>Costo total: ${detalleCosteo?.total_cost.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.guardarBtn} onPress={() => setDetalleModalVisible(false)}>
              <Text style={styles.guardarBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Nuevo Costeo */}
      <Modal visible={nuevoModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.detalleBox}>
            {/* Header */}
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>➕ Nuevo Costeo</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setNuevoModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Contenido scrollable */}
            <ScrollView 
              style={styles.detalleContent} 
              contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Nombre del costeo */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>📝 Nombre del costeo *</Text>
                <TextInput
                  style={styles.formInput}
                  value={nuevoCosteo.name}
                  onChangeText={text => setNuevoCosteo({ ...nuevoCosteo, name: text })}
                  placeholder="Ej: Pito de toro, Tacos al pastor, etc."
                  placeholderTextColor="#999"
                />
              </View>

              {/* Lista de insumos */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>🛒 Insumos y materiales</Text>
                <Text style={styles.formHint}>Agrega los ingredientes o materiales necesarios</Text>
              </View>

              {nuevoCosteo.items.map((item, idx) => (
                <View style={styles.insumoCard} key={idx}>
                  <View style={styles.insumoHeader}>
                    <Text style={styles.insumoNumber}>Insumo #{idx + 1}</Text>
                    {nuevoCosteo.items.length > 1 && (
                      <TouchableOpacity 
                        onPress={() => {
                          const newItems = nuevoCosteo.items.filter((_, i) => i !== idx);
                          setNuevoCosteo({ ...nuevoCosteo, items: newItems });
                        }}
                        style={styles.deleteInsumoBtn}
                      >
                        <Text style={styles.deleteInsumoBtnText}>🗑️ Eliminar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.insumoRow}>
                    <View style={styles.insumoField}>
                      <Text style={styles.fieldLabel}>Nombre del insumo *</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={item.item_name}
                        onChangeText={text => handleNuevoItemChange(idx, "item_name", text)}
                        placeholder="Ej: Carne de res, Aceite, etc."
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <View style={styles.insumoRow}>
                    <View style={[styles.insumoField, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Unidad de medida *</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={item.unit_of_measure}
                        onChangeText={text => handleNuevoItemChange(idx, "unit_of_measure", text)}
                        placeholder="kg, L, piezas, etc."
                        placeholderTextColor="#999"
                      />
                    </View>
                    <View style={[styles.insumoField, { flex: 1, marginLeft: 10 }]}>
                      <Text style={styles.fieldLabel}>Precio unitario *</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={item.unit_price?.toString() || ''}
                        onChangeText={text => handleNuevoItemChange(idx, "unit_price", text)}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor="#999"
                      />
                    </View>
                    <View style={[styles.insumoField, { flex: 1, marginLeft: 10 }]}>
                      <Text style={styles.fieldLabel}>Cantidad usada *</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={item.quantity_used?.toString() || ''}
                        onChangeText={text => handleNuevoItemChange(idx, "quantity_used", text)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  {/* Subtotal calculado */}
                  {(item.unit_price && item.quantity_used) ? (
                    <View style={styles.subtotalRow}>
                      <Text style={styles.subtotalLabel}>Subtotal:</Text>
                      <Text style={styles.subtotalValue}>${((parseFloat(item.unit_price?.toString() || '0')) * (parseFloat(item.quantity_used?.toString() || '0'))).toFixed(2)}</Text>
                    </View>
                  ) : null}
                </View>
              ))}

              {/* Botón agregar insumo */}
              <TouchableOpacity 
                style={styles.addInsumoBtn}
                onPress={() => {
                  setNuevoCosteo({
                    ...nuevoCosteo,
                    items: [...nuevoCosteo.items, { item_name: '', unit_of_measure: '', unit_price: 0, quantity_used: 0 }]
                  });
                }}
              >
                <Text style={styles.addInsumoBtnText}>➕ Agregar otro insumo</Text>
              </TouchableOpacity>

              {/* Total */}
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>💰 Costo total:</Text>
                <Text style={styles.totalValue}>
                  ${nuevoCosteo.items.reduce((sum, item) => sum + ((parseFloat(item.unit_price?.toString() || '0')) * (parseFloat(item.quantity_used?.toString() || '0'))), 0).toFixed(2)}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.guardarBtn, styles.cancelBtn]} onPress={() => setNuevoModalVisible(false)}>
                <Text style={[styles.guardarBtnText, isMobile && styles.guardarBtnTextMobile]}>❌ Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.guardarBtn, styles.saveBtn]} onPress={handleGuardarNuevo}>
                <Text style={[styles.guardarBtnText, isMobile && styles.guardarBtnTextMobile]}>✓ Guardar costeo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Costeo */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.detalleBox}>
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>Editar costeo</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detalleContent}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={styles.detalleCellHeader}>Nombre:</Text>
                <TextInput
                  style={[styles.detalleInput, { marginLeft: 10, width: 200 }]}
                  value={costeoEdit?.name || ''}
                  onChangeText={text => costeoEdit && setCosteoEdit({ ...costeoEdit, name: text })}
                />
              </View>
              <View style={styles.detalleTableHeader}>
                <Text style={styles.detalleCellHeader}>Insumo</Text>
                <Text style={styles.detalleCellHeader}>Unidad</Text>
                <Text style={styles.detalleCellHeader}>Precio Unit.</Text>
                <Text style={styles.detalleCellHeader}>Cantidad</Text>
              </View>
              {costeoEdit?.items.map((item, idx) => (
                <View style={styles.detalleTableRow} key={idx}>
                  <TextInput
                    style={styles.detalleInput}
                    value={item.item_name}
                    onChangeText={text => handleEditItemChange(idx, "item_name", text)}
                  />
                  <TextInput
                    style={styles.detalleInput}
                    value={item.unit_of_measure}
                    onChangeText={text => handleEditItemChange(idx, "unit_of_measure", text)}
                  />
                  <TextInput
                    style={styles.detalleInput}
                    value={item.unit_price.toString()}
                    onChangeText={text => handleEditItemChange(idx, "unit_price", parseFloat(text) || 0)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.detalleInput}
                    value={item.quantity_used.toString()}
                    onChangeText={text => handleEditItemChange(idx, "quantity_used", parseFloat(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>
              ))}
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

      {/* Modal Confirmar Eliminar */}
      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.detalleBox}>
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>Confirmar eliminación</Text>
            </View>
            <View style={styles.detalleContent}>
              <Text style={styles.confirmText}>
                ¿Está seguro de que desea eliminar el costeo "{costeoToDelete?.name}"?
              </Text>
              <Text style={styles.confirmSubText}>
                Esta acción también eliminará todos los insumos asociados.
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
  detalleBox: {
    width: "95%",
    height: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    maxWidth: 950,
    flexDirection: "column",
  },
  editHeader: {
    backgroundColor: "#a3d6b1",
    width: "100%",
    padding: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  editHeaderTitle: {
    fontSize: 32,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#38b24d",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  detalleContent: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 12,
  },
  detalleTableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detalleCellHeader: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  detalleTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detalleCell: {
    fontSize: 16,
    flex: 1,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingVertical: 4,
    marginHorizontal: 1,
  },
  detalleInput: {
    fontSize: 16,
    flex: 1,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingVertical: 4,
    marginHorizontal: 1,
  },
  detalleTotal: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginLeft: 4,
  },
  guardarBtn: {
    backgroundColor: "#38b24d",
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    // los radios se aplican por botón específico (cancel/save)
    marginTop: 0,
  },
  guardarBtnText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
  },
  guardarBtnTextMobile: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: 'center'
  },
  // Nuevos estilos
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
  editBtnSmall: {
    backgroundColor: "#007bff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteBtnSmall: {
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
    marginBottom: 10,
  },
  confirmSubText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  // Nuevos estilos para formulario mejorado
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  formSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#38b24d",
  },
  formHint: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  insumoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  insumoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  insumoNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#495057",
  },
  deleteInsumoBtn: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteInsumoBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  insumoRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  insumoField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#495057",
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#38b24d",
  },
  addInsumoBtn: {
    backgroundColor: "#e7f5ff",
    borderWidth: 2,
    borderColor: "#339af0",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginVertical: 10,
  },
  addInsumoBtnText: {
    color: "#339af0",
    fontSize: 16,
    fontWeight: "bold",
  },
  totalSection: {
    backgroundColor: "#38b24d",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  cancelBtn: {
    backgroundColor: "#dc3545",
    borderBottomLeftRadius: 12,
  },
  saveBtn: {
    backgroundColor: "#38b24d",
    borderBottomRightRadius: 12,
  },
});