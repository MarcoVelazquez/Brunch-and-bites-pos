import React from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import type { User } from '../lib/database.types';
import AppText from './Text';
import Button from './Button';
import Card from './Card';

interface UserListProps {
    users: User[];
    selectedUserId?: number;
    onSelectUser: (user: User) => void;
}

export default function UserList({ users, selectedUserId, onSelectUser }: UserListProps) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    
    return (
        <Card style={isMobile ? styles.containerMobile : styles.container}>
            <AppText variant="h2" style={isMobile ? { fontSize: 20 } : undefined}>Usuarios</AppText>
            <ScrollView style={styles.scroll}>
                {users.map(user => (
                    <Button
                        key={user.id}
                        title={`${user.username}${user.is_admin ? ' (Admin)' : ''}`}
                        variant={selectedUserId === user.id ? "primary" : "secondary"}
                        style={styles.userItem}
                        textStyle={isMobile ? { fontSize: 14 } : undefined}
                        onPress={() => onSelectUser(user)}
                    />
                ))}
            </ScrollView>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 250,
        padding: 15,
    },
    containerMobile: {
        width: '100%',
        maxHeight: 200,
        padding: 10,
    },
    scroll: {
        flex: 1,
        marginTop: 15,
    },
    userItem: {
        marginBottom: 10,
    },
});