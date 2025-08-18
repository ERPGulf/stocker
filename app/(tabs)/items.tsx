import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { getNormalizedItems, Item } from '@/lib/api';

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await getNormalizedItems();
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's entries</Text>
      {loading && <Text style={styles.muted}>Loading…</Text>}
      {error && <Text style={[styles.muted, { color: 'red' }]}>{error}</Text>}

      <FlatList
        contentContainerStyle={{ paddingVertical: 8 }}
        data={items}
        keyExtractor={(item, idx) => String(item.item_code ?? idx)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={styles.avatar}>📦</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemName}>{item.item_name ?? 'Item'}</Text>
                <Text style={styles.itemSub}>
                  {(item.qty ?? 0)} {item.uom ?? ''}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity><Text>✏️</Text></TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity><Text>🗑️</Text></TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading ? (
          <Text style={styles.muted}>No items found.</Text>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f7fb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  muted: {
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 22,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSub: {
    color: '#6b7280',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
