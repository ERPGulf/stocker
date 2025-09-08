import { createStockEntry, getItemByBarcode, ItemDetail } from '@/lib/api/items';
import { useWarehouse } from '@/lib/state/warehouse';
import { selectName } from '@/redux/Slices/UserSlice';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';

export default function ItemDetails() {
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();
  const { selectedWarehouse, shelf, token, authLoading, refreshToken } = useWarehouse();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const fullName = useSelector(selectName);


  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        Alert.alert(
          'Success', 
          'Stock entry created successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                setQty('');
                setShowSuccess(false);
                router.replace('/(tabs)/scanning');
              }
            }
          ],
          { cancelable: false }
        );
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccess, router]);

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
      if (!item) {
        Alert.alert('Error', 'No item selected');
        return;
      }
      
      // Validate token
      if (!token) {
        await refreshToken();
        if (!token) {
          Alert.alert('Authentication Error', 'Please login again');
          return;
        }
      }
      
      // Validate quantity
      const q = Number(qty);
      if (isNaN(q) || q <= 0) {
        Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than 0');
        return;
      }
      
      // Validate shelf
      const sh = shelf?.trim() || '';
      if (!sh) {
        Alert.alert('Shelf Required', 'Please enter a shelf number');
        return;
      }
      
      // Validate barcode
      const b = typeof barcode === 'string' ? barcode : '';
      if (!b) {
        Alert.alert('Missing barcode', 'No barcode provided.');
        return;
      }
      
      // Prepare payload
      const payload = {
        item_id: String(item.item_id ?? ''),
        uom: String(item.uom ?? ''),
        qty: q,
        warehouse: selectedWarehouse?.warehouse_id ?? '',
        barcode: b,
        shelf: sh,
        date_time: formatDateTime(new Date()),
        employee: fullName || '',
      };
      
      setLoading(true);
      setError(null);
      
      // Make API call
      const response = await createStockEntry(payload);
      
      if (response?.data?.status === 'success') {
        console.log("API call successful, showing alert...");
        
        // Use React Native's Alert component
        Alert.alert(
          'Success',
          'Stock entry created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setQty('');
                router.replace('/(tabs)/scanning');
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        throw new Error(response?.message || 'Failed to create stock entry');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Item Details</Text>
      {(loading || authLoading) && <Text style={styles.muted}>{authLoading ? 'Authenticating…' : 'Loading…'}</Text>}
      {error && <Text style={[styles.muted, { color: 'red' }]}>{error}</Text>}

      {item ? (
        <View style={styles.card}>
          <Row label="Total Qty" value={String(item.total_qty ?? 0)} />
          <Row label="Shelf Qty" value={String(item.shelf_qty ?? 0)} />
          <Row label="Item ID" value={String(item.item_id ?? '')} />
          <Row label="Item Name" value={String(item.item_name ?? '')} />
          <Row label="UOM" value={String(item.uom ?? '')} />
          <View style={{ height: 12 }} />
          <Text style={styles.label}>Quantity </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={qty}
            onChangeText={(t) => setQty(t.replace(/[^0-9.]/g, ''))}
            placeholder="Enter quantity"
            placeholderTextColor="#6b7280"
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
