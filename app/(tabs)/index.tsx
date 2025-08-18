import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Warehouse() {
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<string | null>(null);
  const [shelf, setShelf] = useState<string | null>(null);

  // Placeholder selectors – can be replaced with proper pickers later
  const Select = ({ label, value, onPress }: { label: string; value?: string | null; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.select}>
      <Text style={styles.selectText}>{value ?? label}</Text>
      <Text style={styles.chevron}>▾</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Warehouse</Text>
        <Select
          label="Select warehouse"
          value={warehouse}
          onPress={() => setWarehouse('Main Warehouse')}
        />
        <Select
          label="Select shelf"
          value={shelf}
          onPress={() => setShelf('Shelf A')}
        />

        <TouchableOpacity
          style={[styles.button, !(warehouse && shelf) && { opacity: 0.6 }]}
          disabled={!(warehouse && shelf)}
          onPress={() => router.push('/(tabs)/items')}
        >
          <Text style={styles.buttonText}>List today's entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f7fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  select: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: '#111827',
  },
  chevron: {
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
