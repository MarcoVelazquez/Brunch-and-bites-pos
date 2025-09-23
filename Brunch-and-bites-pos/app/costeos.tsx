import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput } from "react-native";
import ProtectedLayout from './components/ProtectedLayout';

interface Insumo {
  insumo: string;
  precio: string;
  unidad: string;
  pUnidad: string;
  cUtilizada: string;
  costo: string;
}

interface Costeo {
  producto: string;
  costo: string;
  insumos: Insumo[];
  costoTotal: string;
}

export default function CosteosScreen() {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nuevoModalVisible, setNuevoModalVisible] = useState(false);
  const [detalleModalVisible, setDetalleModalVisible] = useState(false);
  const [costeoEdit, setCosteoEdit] = useState({ producto: "", costo: "" });
  const [nuevoCosteo, setNuevoCosteo] = useState<Costeo>({
    producto: "",
    costo: "",
    insumos: Array(4).fill({
      insumo: "",
      precio: "",
      unidad: "",
      pUnidad: "",
      cUtilizada: "",
      costo: ""
    }),
    costoTotal: ""
  });
  
  const [detalleCosteo, setDetalleCosteo] = useState<Costeo>({
    producto: "",
    costo: "",
    insumos: Array(4).fill({
      insumo: "",
      precio: "",
      unidad: "",
      pUnidad: "",
      cUtilizada: "",
      costo: ""
    }),
    costoTotal: ""
  });

  const [costeos, setCosteos] = useState<Costeo[]>([
    {
      producto: "Traquea",
      costo: "30",
      insumos: [
        { insumo: "Traquea", precio: "100$", unidad: "10 piezas", pUnidad: "10$", cUtilizada: "1", costo: "1 $" },
        { insumo: "Bolsas", precio: "100 $", unidad: "100", pUnidad: "1", cUtilizada: "1", costo: "1 $" },
        { insumo: "", precio: "", unidad: "", pUnidad: "", cUtilizada: "", costo: "" },
        { insumo: "", precio: "", unidad: "", pUnidad: "", cUtilizada: "", costo: "" },
      ],
      costoTotal: "11$"
    },
    {
      producto: "Pata de conejo",
      costo: "15",
      insumos: Array(4).fill({
        insumo: "",
        precio: "",
        unidad: "",
        pUnidad: "",
        cUtilizada: "",
        costo: ""
      }),
      costoTotal: ""
    },
  ]);

  // Abrir modal de edición
  const handleEdit = (costeo: { producto: string; costo: string }) => {
    setCosteoEdit(costeo);
    setEditModalVisible(true);
  };

  // Guardar cambios de edición
  const handleGuardarEdit = () => {
    setEditModalVisible(false);
    // Aquí podrías actualizar el costeo en tu lista
  };

  // Abrir modal de nuevo costeo
  const handleNuevo = () => {
    setNuevoCosteo({
      producto: "",
      costo: "",
      insumos: Array(4).fill({
        insumo: "",
        precio: "",
        unidad: "",
        pUnidad: "",
        cUtilizada: "",
        costo: ""
      }),
      costoTotal: ""
    });
    setNuevoModalVisible(true);
  };

  // Guardar nuevo costeo
  const handleGuardarNuevo = () => {
    setCosteos([...costeos, {
      ...nuevoCosteo,
      costo: "",
      costoTotal: "",
    }]);
    setNuevoModalVisible(false);
  };

  // Abrir modal de detalle costeo
  const handleDetalle = (costeo: Costeo) => {
    setDetalleCosteo(costeo);
    setDetalleModalVisible(true);
  };

  // Actualizar insumos en nuevo costeo
  const handleNuevoInsumoChange = (index: number, field: keyof Insumo, value: string) => {
    const updatedInsumos = nuevoCosteo.insumos.map((insumo, idx) =>
      idx === index ? { ...insumo, [field]: value } : insumo
    );
    setNuevoCosteo({ ...nuevoCosteo, insumos: updatedInsumos });
  };

  return (
    <ProtectedLayout title="Costeos" requiredPermission="GESTIONAR_COSTEOS">
      <View style={styles.productsTable}>
        {/* Header y botón de agregar */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold", fontSize: 22 }]}>Producto</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 22 }]}>Costo</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleNuevo}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de costeos */}
        <ScrollView>
          {costeos.map((costeo, idx) => (
            <TouchableOpacity key={idx} onPress={() => handleDetalle(costeo)}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{costeo.producto}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{costeo.costo}$</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(costeo)}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal Detalle Costeo */}
      <Modal visible={detalleModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.detalleBox}>
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>{detalleCosteo.producto}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDetalleModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detalleContent}>
              <View style={styles.detalleTableHeader}>
                <Text style={styles.detalleCellHeader}>Insumo</Text>
                <Text style={styles.detalleCellHeader}>Precio</Text>
                <Text style={styles.detalleCellHeader}>Unidad</Text>
                <Text style={styles.detalleCellHeader}>P/Unidad</Text>
                <Text style={styles.detalleCellHeader}>C/Utilizada</Text>
                <Text style={styles.detalleCellHeader}>Costo</Text>
              </View>
              {detalleCosteo.insumos.map((insumo, idx) => (
                <View style={styles.detalleTableRow} key={idx}>
                  <Text style={styles.detalleCell}>{insumo.insumo}</Text>
                  <Text style={styles.detalleCell}>{insumo.precio}</Text>
                  <Text style={styles.detalleCell}>{insumo.unidad}</Text>
                  <Text style={styles.detalleCell}>{insumo.pUnidad}</Text>
                  <Text style={styles.detalleCell}>{insumo.cUtilizada}</Text>
                  <Text style={styles.detalleCell}>{insumo.costo}</Text>
                </View>
              ))}
              <Text style={styles.detalleTotal}>Costo total: {detalleCosteo.costoTotal}</Text>
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
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>Nuevo costeo</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setNuevoModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detalleContent}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={styles.detalleCellHeader}>Nombre:</Text>
                <TextInput
                  style={[styles.detalleInput, { marginLeft: 10, width: 200 }]}
                  value={nuevoCosteo.producto}
                  onChangeText={text => setNuevoCosteo({ ...nuevoCosteo, producto: text })}
                />
              </View>
              <View style={styles.detalleTableHeader}>
                <Text style={styles.detalleCellHeader}>Insumo</Text>
                <Text style={styles.detalleCellHeader}>Precio</Text>
                <Text style={styles.detalleCellHeader}>Unidad</Text>
                <Text style={styles.detalleCellHeader}>P/Unidad</Text>
                <Text style={styles.detalleCellHeader}>C/Utilizada</Text>
                <Text style={styles.detalleCellHeader}>Costo</Text>
              </View>
              {nuevoCosteo.insumos.map((insumo, idx) => (
                <View style={styles.detalleTableRow} key={idx}>
                  <TextInput
                    style={styles.detalleInput}
                    value={insumo.insumo}
                    onChangeText={text => handleNuevoInsumoChange(idx, "insumo", text)}
                  />
                  <TextInput
                    style={styles.detalleInput}
                    value={insumo.precio}
                    onChangeText={text => handleNuevoInsumoChange(idx, "precio", text)}
                  />
                  <TextInput
                    style={styles.detalleInput}
                    value={insumo.unidad}
                    onChangeText={text => handleNuevoInsumoChange(idx, "unidad", text)}
                  />
                  <TextInput
                    style={styles.detalleInput}
                    value={insumo.pUnidad}
                    onChangeText={text => handleNuevoInsumoChange(idx, "pUnidad", text)}
                  />
                  <TextInput
                    style={styles.detalleInput}
                    value={insumo.cUtilizada}
                    onChangeText={text => handleNuevoInsumoChange(idx, "cUtilizada", text)}
                  />
                  <TextInput
                    style={styles.detalleInput}
                    value={insumo.costo}
                    onChangeText={text => handleNuevoInsumoChange(idx, "costo", text)}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.guardarBtn} onPress={handleGuardarNuevo}>
              <Text style={styles.guardarBtnText}>Guardar</Text>
            </TouchableOpacity>
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
                  value={costeoEdit.producto}
                  onChangeText={text => setCosteoEdit({ ...costeoEdit, producto: text })}
                />
              </View>
              <View style={styles.detalleTableHeader}>
                <Text style={styles.detalleCellHeader}>Insumo</Text>
                <Text style={styles.detalleCellHeader}>Precio</Text>
                <Text style={styles.detalleCellHeader}>Unidad</Text>
                <Text style={styles.detalleCellHeader}>P/Unidad</Text>
                <Text style={styles.detalleCellHeader}>C/Utilizada</Text>
                <Text style={styles.detalleCellHeader}>Costo</Text>
              </View>
              {[0,1,2,3].map(idx => (
                <View style={styles.detalleTableRow} key={idx}>
                  <TextInput style={styles.detalleInput} />
                  <TextInput style={styles.detalleInput} />
                  <TextInput style={styles.detalleInput} />
                  <TextInput style={styles.detalleInput} />
                  <TextInput style={styles.detalleInput} />
                  <TextInput style={styles.detalleInput} />
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.guardarBtn} onPress={() => setEditModalVisible(false)}>
              <Text style={styles.guardarBtnText}>Guardar</Text>
            </TouchableOpacity>
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
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    maxWidth: 950,
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
    width: "98%",
    marginTop: 10,
    marginBottom: 10,
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
    width: "100%",
    paddingVertical: 18,
    alignItems: "center",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: 10,
  },
  guardarBtnText: {
    color: "#000",
    fontSize: 28,
    fontWeight: "bold",
  },
});