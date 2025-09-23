import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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
    return (
        <Card style={styles.container}>
            <AppText variant="h2">Usuarios</AppText>
            <ScrollView style={styles.scroll}>
                {users.map(user => (
                    <Button
                        key={user.id}
                        title={`${user.username}${user.is_admin ? ' (Admin)' : ''}`}
                        variant={selectedUserId === user.id ? "primary" : "secondary"}
                        style={styles.userItem}
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
    scroll: {
        flex: 1,
        marginTop: 15,
    },
    userItem: {
        marginBottom: 10,
    },
});