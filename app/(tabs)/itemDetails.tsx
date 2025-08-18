import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getNormalizedItems, Item } from '@/lib/api';

export default function ItemDetails() {
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await getNormalizedItems(typeof barcode === 'string' ? barcode : undefined);
        const picked = Array.isArray(list) ? list[0] : null;
        setItem(picked ?? null);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load ');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [barcode]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Item details</Text>
      {loading && <Text style={styles.muted}>Loading…</Text>}
      {error && <Text style={[styles.muted, { color: 'red' }]}>{error}</Text>}

      {item ? (
        <View style={styles.card}>
          <Row label="Display Total Shelf Qty" value={String(item.qty ?? 0)} />
          <Row label="Item code" value={String(item.item_code ?? '')} />
          <Row label="Item name" value={String(item.item_name ?? '')} />
          <Row label="UOM" value={String(item.uom ?? '')} />
        </View>
      ) : (
        !loading && <Text style={styles.muted}>No item found.</Text>
      )}

      <View style={{ height: 16 }} />
      <Button title="Submit" onPress={() => { /* hook for submit action */ }} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f6f7fb',
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  muted: {
    color: '#6b7280',
  },
});
