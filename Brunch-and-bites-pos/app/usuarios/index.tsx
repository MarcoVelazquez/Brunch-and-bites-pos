import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, useWindowDimensions, TextInput, Modal } from 'react-native';
import ProtectedLayout from '../components/ProtectedLayout';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, getUserPermissions, deleteUser } from '../lib/database.refactor';
import type { User } from '../lib/database.types';

interface UserWithPermissions extends User {
  permissionList: string[];
}

export default function UsuariosScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const router = useRouter();
  const { checkPermission, db, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showPermsModal, setShowPermsModal] = useState(false);
  const [selectedUserPerms, setSelectedUserPerms] = useState<{username: string; perms: string[]}>({ username: '', perms: [] });

  const loadUsers = async () => {
    if (!db) return;
    try {
      setIsLoading(true);
      const usersList = await getAllUsers(db);
      const usersWithPermissions = await Promise.all(
        usersList.map(async (user) => ({
          ...user,
          permissionList: await getUserPermissions(db, user.id)
        }))
      );
      setUsers(usersWithPermissions);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [db]);

  // Reload users when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (db) {
        loadUsers();
      }
    }, [db])
  );

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!db) return;
    Alert.alert(
      'Confirmar',
      `¿Estás seguro de que quieres eliminar al usuario ${username}?`,
      [
        { text: 'Cancelar' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(db, userId);
              await loadUsers();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  return (
    <ProtectedLayout title="Usuarios" requiredPermission="GESTIONAR_USUARIOS">
      <View style={styles.usersTable}>
        {/* Header y botón de agregar */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: isMobile ? 3 : 2, fontWeight: "bold", fontSize: isMobile ? 14 : 22 }]}>Usuario</Text>
          <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold", fontSize: isMobile ? 14 : 22 }]}>Permisos</Text>
          <Text style={[styles.tableCell, { flex: isMobile ? 2 : 1, fontWeight: "bold", fontSize: isMobile ? 14 : 22 }]}>Acciones</Text>
          {checkPermission('CREAR_USUARIOS') && (
            <TouchableOpacity style={[styles.addBtn, isMobile && { width: 28, height: 28 }]} onPress={() => router.push('/usuarios/register')}>
              <Text style={[styles.addBtnText, isMobile && { fontSize: 20 }]}>＋</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Buscador */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre de usuario"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Lista de usuarios */}
        <ScrollView>
          {isLoading ? (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Cargando usuarios...</Text>
          ) : users
              .filter(u => u.username.toLowerCase().includes(query.trim().toLowerCase()))
              .map((user) => (
            <View style={[styles.tableRow, isMobile && { paddingVertical: 8 }]} key={user.id}>
              <View style={styles.rowContent}>
                <View style={[{ flex: isMobile ? 3 : 2, paddingHorizontal: 4 }] }>
                  <Text style={[styles.tableCell, { fontSize: isMobile ? 14 : 18 }]} numberOfLines={1}>{user.username}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                    {user.is_admin && <Text style={styles.badgeAdmin}>Admin</Text>}
                    {currentUser?.id === user.id && <Text style={styles.badgeYou}>Tú</Text>}
                  </View>
                </View>
                <Text style={[styles.tableCell, { flex: 2, fontSize: isMobile ? 14 : 18 }]} numberOfLines={1}>
                  {user.is_admin ? 'Admin' : user.permissionList.slice(0, 2).join(', ') + (user.permissionList.length > 2 ? '...' : '')}
                </Text>
                <View style={[styles.actionButtons, { flex: isMobile ? 2 : 1 }, isMobile && { gap: 4 }]}> 
                  {!user.is_admin && (
                    <TouchableOpacity
                      style={[styles.viewBtnSmall, isMobile && { width: 24, height: 24, borderRadius: 12 }]}
                      onPress={() => { setSelectedUserPerms({ username: user.username, perms: user.permissionList }); setShowPermsModal(true); }}
                    >
                      <Text style={[styles.editBtnText, isMobile && { fontSize: 10 }]}>👁️</Text>
                    </TouchableOpacity>
                  )}
                  {user.id !== currentUser?.id && (
                    <>
                      <TouchableOpacity style={[styles.editBtnSmall, isMobile && { width: 24, height: 24, borderRadius: 12 }]} onPress={() => router.push({ pathname: "/usuarios/[id]", params: { id: user.id.toString() } })}>
                        <Text style={[styles.editBtnText, isMobile && { fontSize: 10 }]}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.deleteBtnSmall, isMobile && { width: 24, height: 24, borderRadius: 12 }]} onPress={() => handleDeleteUser(user.id, user.username)}>
                        <Text style={[styles.deleteBtnText, isMobile && { fontSize: 10 }]}>🗑️</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Modal de permisos del usuario */}
        <Modal visible={showPermsModal} transparent animationType="fade" onRequestClose={() => setShowPermsModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Permisos de {selectedUserPerms.username}</Text>
              <ScrollView style={{ maxHeight: 240 }}>
                {selectedUserPerms.perms.length === 0 ? (
                  <Text>No tiene permisos específicos</Text>
                ) : (
                  selectedUserPerms.perms.map((p, i) => (
                    <Text key={i} style={{ paddingVertical: 6 }}>• {p}</Text>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity style={[styles.editBtnSmall, { alignSelf: 'flex-end', marginTop: 10, backgroundColor: '#38b24d' }]} onPress={() => setShowPermsModal(false)}>
                <Text style={styles.editBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ProtectedLayout>
  );
}

const styles = StyleSheet.create({
  usersTable: {
    flex: 1,
    margin: 0,
    padding: 16,
    paddingHorizontal: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
    gap: 0,
  },
  tableCell: {
    fontSize: 16,
    paddingHorizontal: 4,
    textAlignVertical: 'center',
  },
  addBtn: {
    backgroundColor: '#38b24d',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: -2,
  },
  searchRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  searchInput: {
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 12,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginLeft: 0,
  },
  editBtnSmall: {
    backgroundColor: '#007bff',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnSmall: {
    backgroundColor: '#6c757d',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  deleteBtnSmall: {
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  badgeAdmin: {
    backgroundColor: '#2d5016',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    borderRadius: 12,
    overflow: 'hidden'
  },
  badgeYou: {
    backgroundColor: '#1463b3',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    borderRadius: 12,
    overflow: 'hidden'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCard: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16
  },
});
