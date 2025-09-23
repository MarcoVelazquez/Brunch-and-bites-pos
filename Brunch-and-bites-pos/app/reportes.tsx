import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import ProtectedLayout from './components/ProtectedLayout';

interface Reporte {
  producto: string;
  cantidad: number;
  dinero: string;
}

export default function ReportesScreen() {
  const [tipoReporte, setTipoReporte] = useState("Dia");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const reportes: Reporte[] = [
    { producto: "Traqueas", cantidad: 10, dinero: "500$" },
    { producto: "Orejas", cantidad: 10, dinero: "300$" },
  ];

  return (
    <ProtectedLayout title="Reportes" requiredPermission="VER_REPORTES">
      {/* Filtros */}
      <View style={styles.filtersRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.filterLabel}>Tipo de reporte</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipoReporte}
              onValueChange={setTipoReporte}
              style={styles.picker}
              dropdownIconColor="#333"
            >
              <Picker.Item label="Dia" value="Dia" />
              <Picker.Item label="Mes" value="Mes" />
              <Picker.Item label="Año" value="Año" />
            </Picker>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.filterLabel}>Fecha</Text>
          <View style={styles.dateInputsRow}>
            <TextInput
              style={styles.dateInput}
              placeholder="Inicio"
              value={fechaInicio}
              onChangeText={setFechaInicio}
            />
            <TextInput
              style={styles.dateInput}
              placeholder="Fin"
              value={fechaFin}
              onChangeText={setFechaFin}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn}>
          <Text style={styles.exportBtnText}>Exportar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabla de reportes */}
      <View style={styles.productsTable}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold", fontSize: 20 }]}>Producto</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 20 }]}>Cantidad</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: "bold", fontSize: 20 }]}>Dinero</Text>
        </View>
        <ScrollView>
          {reportes.map((reporte, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{reporte.producto}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{reporte.cantidad}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{reporte.dinero}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ProtectedLayout>
  );
}

const styles = StyleSheet.create({
  filtersRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 20,
  },
  filterLabel: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  picker: {
    height: 36,
    width: "100%",
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    height: 36,
    width: 80,
    backgroundColor: "#f9f9f9",
    marginRight: 8,
  },
  exportBtn: {
    backgroundColor: "#38b24d",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: "flex-end",
    marginLeft: 20,
  },
  exportBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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
});