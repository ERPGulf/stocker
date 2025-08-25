import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TextInput, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createStockEntry, getItemByBarcode, ItemDetail } from '@/lib/api/items';
import { useWarehouse } from '@/lib/state/warehouse';

export default function ItemDetails() {
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();
  const { selectedWarehouse, shelf, token, authLoading, refreshToken } = useWarehouse();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState<string>('');

  const totalQty = useMemo(() => Number(item?.total_qty ?? 0), [item?.total_qty]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const b = typeof barcode === 'string' ? barcode : '';
        const warehouseId = selectedWarehouse?.warehouse_id ?? '';
        if (!b || !warehouseId) {
          setItem(null);
          setError(!warehouseId ? 'Please select a warehouse first' : 'No barcode provided');
          return;
        }
        const detail = await getItemByBarcode(b, warehouseId);
        setItem(detail);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load ');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [barcode, selectedWarehouse?.warehouse_id]);

  const formatDateTime = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
  };

  const onSubmit = async () => {
    try {
      if (!item) return;
      if (!token) {
        await refreshToken();
      }
      const q = Number(qty);
      if (!q || q <= 0 || !Number.isFinite(q)) {
        Alert.alert('Invalid quantity', 'Enter a positive number.');
        return;
      }
      if (q > totalQty) {
        Alert.alert('Quantity too high', `Quantity cannot exceed total qty (${totalQty}).`);
        return;
      }
      const warehouseId = selectedWarehouse?.warehouse_id ?? '';
      if (!warehouseId) {
        Alert.alert('Missing warehouse', 'Please select a warehouse first.');
        return;
      }
      const sh = shelf ?? '';
      if (!sh) {
        Alert.alert('Missing shelf', 'Please select a shelf first.');
        return;
      }
      const b = typeof barcode === 'string' ? barcode : '';
      if (!b) {
        Alert.alert('Missing barcode', 'No barcode provided.');
        return;
      }
      const payload = {
        item_id: String(item.item_id ?? ''),
        uom: String(item.uom ?? ''),
        qty: q,
        warehouse: warehouseId,
        barcode: b,
        shelf: sh,
        date_time: formatDateTime(new Date()),
      } as const;
      setLoading(true);
      setError(null);
      await createStockEntry(payload);
      Alert.alert('Success', 'Stock entry created.');
      setQty('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Item details</Text>
      {(loading || authLoading) && <Text style={styles.muted}>{authLoading ? 'Authenticating…' : 'Loading…'}</Text>}
      {error && <Text style={[styles.muted, { color: 'red' }]}>{error}</Text>}

      {item ? (
        <View style={styles.card}>
          <Row label="Total Qty" value={String(item.total_qty ?? 0)} />
          <Row label="Shelf Qty" value={String(item.shelf_qty ?? 0)} />
          <Row label="Item ID" value={String(item.item_id ?? '')} />
          <Row label="Item name" value={String(item.item_name ?? '')} />
          <Row label="UOM" value={String(item.uom ?? '')} />
          <View style={{ height: 12 }} />
          <Text style={styles.label}>Quantity to add</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={qty}
            onChangeText={(t) => setQty(t.replace(/[^0-9.]/g, ''))}
            placeholder={`Max ${totalQty}`}
          />
        </View>
      ) : (
        !loading && <Text style={styles.muted}>No item found.</Text>
      )}

      <View style={{ height: 16 }} />
      <Button title="Submit" onPress={onSubmit} disabled={loading} />
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
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
