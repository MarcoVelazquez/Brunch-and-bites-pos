import React, { useEffect, useMemo, useState } from 'react';
import { View, Text as RNText, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Alert, useWindowDimensions } from 'react-native';
import ProtectedLayout from './components/ProtectedLayout';
import { useAuth } from './contexts/AuthContext';
import { ensureInventoryTables, getAllInventoryItems, addInventoryItem, adjustInventory } from './lib/inventoryDb';

export default function InventarioScreen() {
  const { db } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  // Simplificado: solo nombre y cantidad inicial
  const [newInitial, setNewInitial] = useState('');

  // Ajuste avanzado eliminado; solo +/- rápidos y visualización de cantidad

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it: any) => (it.name || '').toLowerCase().includes(q));
  }, [items, query]);

  const load = async () => {
    try {
      setLoading(true);
      await ensureInventoryTables(db!);
      const list = await getAllInventoryItems(db!);
      setItems(list);
    } catch (e) {
      console.error('Load inventory failed', e);
      Alert.alert('Error', 'No se pudo cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    const name = newName.trim();
    const initial = parseFloat(newInitial || '0') || 0;
    if (!name) {
      Alert.alert('Falta nombre', 'Escribe el nombre del producto');
      return;
    }
    try {
      await addInventoryItem(db!, name, { initial_stock: initial });
      setShowAdd(false);
      setNewName(''); setNewInitial('');
      await load();
    } catch (e: any) {
      const msg = 'No se pudo crear';
      Alert.alert('Error', msg);
    }
  };

  const onQuickAdjust = async (id: number, delta: number) => {
    try {
      await adjustInventory(db!, id, delta, delta > 0 ? 'Entrada rápida' : 'Salida rápida');
      await load();
    } catch (e) {
      Alert.alert('Error', 'No se pudo ajustar el stock');
    }
  };

  // Sin modal de ajuste; no se requiere manejo adicional

  return (
    <ProtectedLayout title="Inventario" requiredPermission="GESTIONAR_INVENTARIO">
      <View style={styles.container}>
        {/* Barra superior */}
        <View style={styles.toolbar}>
          <TextInput
            style={[styles.searchInput, isMobile && { fontSize: 12 }]}
            placeholder="Buscar producto"
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <RNText style={styles.addBtnText}>＋ Nuevo</RNText>
          </TouchableOpacity>
        </View>

        {/* Tabla */}
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <RNText style={[styles.cellHeader, { flex: 1 }]}>Producto</RNText>
            {!isMobile && (
              <RNText style={[styles.cellHeader, { flex: 1, textAlign: 'center' }]}>Acciones</RNText>
            )}
          </View>
          <ScrollView>
            {filtered.map((it: any) => (
              isMobile ? (
                <View key={it.id} style={[styles.dataRow, styles.dataRowMobile]}>
                  <RNText style={[styles.cell, styles.productNameMobile]} numberOfLines={2}>{it.name}</RNText>
                  <View style={styles.actionsMobile}>
                    <TouchableOpacity style={[styles.circleBtn, styles.minus, styles.circleBtnSmall]} onPress={() => onQuickAdjust(it.id, -1)}>
                      <RNText style={styles.circleText}>−1</RNText>
                    </TouchableOpacity>
                    <View style={[styles.qtyBadge, styles.qtyBadgeSmall]}>
                      <RNText style={styles.qtyText}>{Number(it.stock).toFixed(2)}</RNText>
                    </View>
                    <TouchableOpacity style={[styles.circleBtn, styles.plus, styles.circleBtnSmall]} onPress={() => onQuickAdjust(it.id, +1)}>
                      <RNText style={styles.circleText}>+1</RNText>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View key={it.id} style={styles.dataRow}>
                  <RNText style={[styles.cell, { flex: 6 }]} numberOfLines={1}>{it.name}</RNText>
                  <View style={[styles.actions, { flex: 4 }]}>
                    <TouchableOpacity style={[styles.circleBtn, styles.minus]} onPress={() => onQuickAdjust(it.id, -1)}>
                      <RNText style={styles.circleText}>−1</RNText>
                    </TouchableOpacity>
                    <View style={styles.qtyBadge}>
                      <RNText style={styles.qtyText}>{Number(it.stock).toFixed(2)}</RNText>
                    </View>
                    <TouchableOpacity style={[styles.circleBtn, styles.plus]} onPress={() => onQuickAdjust(it.id, +1)}>
                      <RNText style={styles.circleText}>+1</RNText>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            ))}
          </ScrollView>
        </View>

        {/* Modal nuevo */}
        <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <RNText style={styles.modalTitle}>Nuevo producto</RNText>
              <TextInput style={styles.input} placeholder="Nombre" value={newName} onChangeText={setNewName} />
              <TextInput style={styles.input} keyboardType="numeric" placeholder="Stock inicial" value={newInitial} onChangeText={setNewInitial} />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancel]} onPress={() => setShowAdd(false)}>
                  <RNText style={styles.modalBtnText}>Cancelar</RNText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.save]} onPress={onCreate}>
                  <RNText style={styles.modalBtnText}>Guardar</RNText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Sin modal de ajuste; acciones rápidas + visualización de cantidad */}
      </View>
    </ProtectedLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  toolbar: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  searchInput: { flexGrow: 1, minWidth: 140, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: '#f9f9f9' },
  addBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },

  table: { flex: 1, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  headerRow: { flexDirection: 'row', backgroundColor: '#f8f8f8', borderBottomWidth: 1, borderColor: '#e6e6e6', paddingVertical: 8, paddingHorizontal: 6 },
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f3f3f3', paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center' },
  cellHeader: { fontWeight: 'bold', fontSize: 12, color: '#333' },
  cell: { fontSize: 12, color: '#333' },
  actions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end', alignItems: 'center' },
  circleBtn: { width: 44, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  circleText: { color: '#fff', fontWeight: 'bold' },
  minus: { backgroundColor: '#c62828' },
  plus: { backgroundColor: '#2e7d32' },
  adjustBtn: { backgroundColor: '#1976d2', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  adjustBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  qtyBadge: { backgroundColor: '#eef6ee', borderWidth: 1, borderColor: '#cfe3d0', height: 32, minWidth: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  qtyText: { color: '#2e7d32', fontWeight: 'bold' },
  // Mobile refinements
  dataRowMobile: { flexDirection: 'column', gap: 6, paddingVertical: 8 },
  productNameMobile: { fontSize: 13 },
  actionsMobile: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  circleBtnSmall: { width: 40, height: 32 },
  qtyBadgeSmall: { minWidth: 64 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: '#f9f9f9', marginBottom: 8 },
  rowGap: { flexDirection: 'row', gap: 8 },
  inputHalf: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  modalBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  cancel: { backgroundColor: '#e0e0e0' },
  save: { backgroundColor: '#2e7d32' },
  modalBtnText: { fontWeight: 'bold', color: '#fff' },
  movTitle: { display: 'none' as any },
  movItem: { display: 'none' as any },
});
