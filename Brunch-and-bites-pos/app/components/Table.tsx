import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

interface TableHeaderProps {
    columns: Array<{
        label: string;
        flex?: number;
    }>;
}

export function TableHeader({ columns }: TableHeaderProps) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    
    return (
        <View style={styles.tableHeader}>
            {columns.map((col, index) => (
                <Text 
                    key={index} 
                    style={[
                        styles.headerCell,
                        { flex: col.flex || 1 },
                        isMobile && styles.headerCellMobile
                    ]}
                    numberOfLines={2}
                >
                    {col.label}
                </Text>
            ))}
        </View>
    );
}

interface TableRowProps {
    cells: Array<{
        content: string | number | React.ReactNode;
        flex?: number;
    }>;
}

export function TableRow({ cells }: TableRowProps) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    
    return (
        <View style={styles.tableRow}>
            {cells.map((cell, index) => (
                <View 
                    key={index} 
                    style={[
                        styles.cell,
                        { flex: cell.flex || 1 }
                    ]}
                >
                    {typeof cell.content === 'string' || typeof cell.content === 'number' ? (
                        <Text 
                            style={[styles.cellText, isMobile && styles.cellTextMobile]}
                            numberOfLines={2}
                        >
                            {cell.content}
                        </Text>
                    ) : (
                        cell.content
                    )}
                </View>
            ))}
        </View>
    );
}

interface TableProps {
    headers: Array<{
        label: string;
        flex?: number;
    }>;
    rows: Array<Array<{
        content: string | number | React.ReactNode;
        flex?: number;
    }>>;
}

function Table({ headers, rows }: TableProps) {
    return (
        <View>
            <TableHeader columns={headers} />
            {rows.map((row, index) => (
                <TableRow key={index} cells={row} />
            ))}
        </View>
    );
}

export default Table;

const styles = StyleSheet.create({
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 10,
        backgroundColor: '#f8f8f8',
    },
    headerCell: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingHorizontal: 10,
    },
    headerCellMobile: {
        fontSize: 12,
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
        paddingVertical: 10,
    },
    cell: {
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    cellText: {
        fontSize: 16,
    },
    cellTextMobile: {
        fontSize: 12,
    },
});