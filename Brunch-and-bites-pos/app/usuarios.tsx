import React from "react";
import { View, Image, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./contexts/AuthContext";
import ProtectedLayout from "./components/ProtectedLayout";
import AppText from "./components/Text";
import Button from "./components/Button";
import Card from "./components/Card";
import { TableHeader, TableRow } from "./components/Table";

export default function Usuarios() {
    const router = useRouter();
    const { checkPermission } = useAuth();

    const users = [
        { nombre: 'Admin', permisos: 'Todos' },
        { nombre: 'Cajero 1', permisos: 'Cobrar' }
    ];

    return (
        <ProtectedLayout title="Usuarios" requiredPermission="GESTIONAR_USUARIOS">
            <Card style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                    <TableHeader
                        columns={[
                            { label: 'Nombre', flex: 2 },
                            { label: 'Permisos', flex: 2 },
                            { label: '', flex: 1 }
                        ]}
                    />
                    <View style={styles.headerActions}>
                        {checkPermission('CREAR_USUARIOS') && (
                            <Button
                                title="＋"
                                variant="primary"
                                style={styles.actionButton}
                                onPress={() => router.push("/usuarios/register" as any)}
                            />
                        )}
                        {checkPermission('DAR_PERMISOS') && (
                            <Button
                                title="⚙️"
                                variant="primary"
                                style={styles.actionButton}
                                onPress={() => router.push("/permisos" as any)}
                            />
                        )}
                    </View>
                </View>

                <ScrollView>
                    {users.map((user, index) => (
                        <TableRow
                            key={index}
                            cells={[
                                { content: user.nombre, flex: 2 },
                                { content: user.permisos, flex: 2 },
                                {
                                    content: (
                                        <Button
                                            title="✏️"
                                            variant="primary"
                                            style={styles.actionButton}
                                            onPress={() => {}}
                                        />
                                    ),
                                    flex: 1
                                }
                            ]}
                        />
                    ))}
                </ScrollView>
            </Card>
        </ProtectedLayout>
    );
}

const styles = StyleSheet.create({
    tableContainer: {
        flex: 1,
        margin: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        padding: 0,
    },
});