import { getWarehouses, Warehouse } from '@/lib/api/warehouses';
import { useWarehouse } from '@/lib/state/warehouse';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WarehouseScreen() {
  const router = useRouter();
  const { selectedWarehouse, setSelectedWarehouse, shelf, setShelf, token, authLoading } = useWarehouse();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (authLoading || !token) return; // wait for token
      try {
        setLoading(true);
        setError(null);
        const list = await getWarehouses();
        setWarehouses(list);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load warehouses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, authLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Warehouse</Text>

        {(loading || authLoading) && (
          <View style={styles.loadingRow}><ActivityIndicator /><Text style={{ marginLeft: 8 }}>Loading…</Text></View>
        )}
        {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}

        {/* Dropdown trigger */}
        <TouchableOpacity
          onPress={() => setShowWarehousePicker(true)}
          style={styles.select}
        >
          <Text style={styles.selectText}>
            {selectedWarehouse?.warehouse_id ?? 'Select warehouse'}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </TouchableOpacity>

        {/* Dropdown modal */}
        <Modal
          visible={showWarehousePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWarehousePicker(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowWarehousePicker(false)}>
            <Pressable style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select warehouse</Text>
              <FlatList
                data={warehouses}
                keyExtractor={(w) => w.warehouse_id}
                renderItem={({ item }) => {
                  const active = selectedWarehouse?.warehouse_id === item.warehouse_id;
                  return (
                    <TouchableOpacity
                      onPress={() => { setSelectedWarehouse(item); setShowWarehousePicker(false); }}
                      style={[styles.optionRow, active && { backgroundColor: '#eff6ff' }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionPrimary}>{item.warehouse_id}</Text>
                        <Text style={styles.optionSecondary}>{item.warehouse_name}</Text>
                      </View>
                      {active && <Text style={{ color: '#2563eb' }}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={!loading ? (
                  <Text style={{ color: '#6b7280' }}>No warehouses.</Text>
                ) : null}
              />
            </Pressable>
          </Pressable>
        </Modal>

        {/* Placeholder shelf select until API is provided */}
        <TouchableOpacity
          onPress={() => {
            if (!selectedWarehouse) {
              showAlert('Select warehouse', 'Please select a warehouse first.');
              return;
            }
            setShelf('Shelf A');
          }}
          style={styles.select}
        >
          <Text style={styles.selectText}>{shelf ?? 'Select shelf'}</Text>
          <Text style={styles.chevron}>▾</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !((selectedWarehouse) && shelf) && { opacity: 0.6 }]}
          onPress={() => {
            if (!selectedWarehouse || !shelf) {
              showAlert('Selection required', 'Please select warehouse and shelf to continue.');
              return;
            }
            router.push('/(tabs)/items');
          }}
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '70%',
    padding: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionPrimary: {
    fontWeight: '700',
  },
  optionSecondary: {
    color: '#6b7280',
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
