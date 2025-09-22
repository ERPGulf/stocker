import { deleteStockEntry, listStockEntries, StockEntry, updateStockEntry } from '@/lib/api/items';
import { useWarehouse } from '@/lib/state/warehouse';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Items() {
  const router = useRouter();
  const { selectedWarehouse, token, authLoading, refreshToken } = useWarehouse();
  const [items, setItems] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<{visible: boolean; title: string; message: string}>({visible: false, title: '', message: ''});
  const [showTodayOnly, setShowTodayOnly] = useState<boolean>(true);
  const [editingItem, setEditingItem] = useState<StockEntry | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editForm, setEditForm] = useState<{
    item_code: string;
    barcode: string;
    qty: string;
    uom: string;
    shelf: string;
    date: string;
  }>({
    item_code: '',
    barcode: '',
    qty: '',
    uom: 'Nos',
    shelf: '',
    date: new Date().toISOString(),
  });

  const load = async (forceShowAll: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const entries = await listStockEntries(forceShowAll ? false : showTodayOnly);
      setItems(entries);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [showTodayOnly])
  );

  // Alert helpers
  type AlertButton = {
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  };
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
  const showAlert = (title: string, message: string, buttons: AlertButton[] = []) => {
    setCustomAlert({visible: true, title, message});
    setAlertButtons(buttons.length > 0 ? buttons : [
      { text: 'OK', onPress: () => {}, style: 'default' }
    ]);
  };
  const hideAlert = () => setCustomAlert(prev => ({...prev, visible: false}));

  // Show confirmation before deleting
  const confirmAndDelete = (entry_id?: string) => {
    console.log('confirmAndDelete called with ID:', entry_id);
    
    if (!entry_id) {
      console.error('confirmAndDelete called with no entry_id');
      showAlert('Error', 'No entry ID provided for deletion');
      return;
    }
    
    const deleteAfterConfirm = async () => {
      try {
        console.log('User confirmed delete for ID:', entry_id);
        const result = await deleteStockEntry(entry_id);
        console.log('Delete result:', result);
        
        if (result?.status === 'success') {
          // Refresh the list after successful deletion
          load();
          showAlert('Success', 'Entry deleted successfully');
        } else {
          showAlert('Error', result?.message || 'Failed to delete entry');
        }
      } catch (error) {
        console.error('Error in deleteAfterConfirm:', error);
        showAlert('Error', 'Failed to delete entry. Please try again.');
      }
    };
    
    // Show custom confirmation dialog
    showAlert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Delete cancelled'),
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteAfterConfirm
        }
      ]
    );
  };

  // Handle editing
  const handleEdit = (item: StockEntry) => (e: any) => {
    e?.stopPropagation?.();
    setEditingItem(item);

    // Use item's existing date if available, else now
    let parsedDate: Date;
    if (item.date) {
      parsedDate = new Date(item.date);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date(); // fallback if invalid
      }
    } else {
      parsedDate = new Date();
    }

    setEditForm({
      item_code: item.item_code || '',
      barcode: item.barcode || '',
      qty: String(item.qty || ''),
      uom: item.uom || 'Nos',
      shelf: item.shelf || '',
      date: new Date().toISOString(),
    });
  };

  const handleSaveUpdate = async () => {
    if (!editingItem?.entry_id) return;

    try {
      setLoading(true);
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

      const formattedDate = formatDateTime(new Date(editForm.date));
      console.log('Date being saved:', formattedDate);

      const response = await updateStockEntry({
        entry_id: editingItem.entry_id,
        item_code: editForm.item_code,
        barcode: editForm.barcode,
        qty: Number(editForm.qty) || 0,
        uom: editForm.uom,
        shelf: editForm.shelf,
        date: formattedDate,
        warehouse: editingItem.warehouse || '',
      });

      setEditingItem(null);

      if (response?.data?.status === 'success') {
        await load();
        showAlert('Success', 'Item updated successfully');
      } else if (response?.data?.message) {
        showAlert('Error', response.data.message);
      } else {
        showAlert('Error', 'Failed to update item');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      setEditingItem(null);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update item. Please try again.';
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Stock Entries</Text>
        <TouchableOpacity 
          style={[styles.toggleButton, showTodayOnly && styles.toggleButtonActive]}
          onPress={() => setShowTodayOnly(!showTodayOnly)}
        >
          <Text style={[styles.toggleButtonText, showTodayOnly && styles.toggleButtonActiveText]}>
            {showTodayOnly ? 'Show All' : 'Show Today'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Alert */}
      <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{customAlert.title}</Text>
            <Text style={styles.alertMessage}>{customAlert.message}</Text>
            <View style={styles.alertButtonsContainer}>
              {alertButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelButton
                  ]}
                  onPress={() => { button.onPress(); hideAlert(); }}
                >
                  <Text style={[
                    styles.alertButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editingItem} transparent animationType="slide" onRequestClose={() => setEditingItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.modalTitle}>Edit Item</Text>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Code</Text>
              <TextInput style={styles.input} value={editForm.item_code} onChangeText={(t) => setEditForm(p => ({...p, item_code: t}))} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Barcode</Text>
              <TextInput style={styles.input} value={editForm.barcode} onChangeText={(t) => setEditForm(p => ({...p, barcode: t}))} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput style={styles.input} value={editForm.qty} onChangeText={(t) => setEditForm(p => ({...p, qty: t}))} keyboardType="numeric" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>UOM</Text>
              <TextInput style={styles.input} value={editForm.uom} onChangeText={(t) => setEditForm(p => ({...p, uom: t}))} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Shelf</Text>
              <TextInput style={styles.input} value={editForm.shelf} onChangeText={(t) => setEditForm(p => ({...p, shelf: t}))} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Date & Time</Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                <Text>{new Date(editForm.date).toLocaleString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(editForm.date)}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setEditForm(prev => ({...prev, date: selectedDate.toISOString()}));
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditingItem(null)} disabled={loading}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveUpdate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, {color: '#fff'}]}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* List */}
      {(loading || authLoading) && (
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
          <ActivityIndicator />
          <Text style={{marginLeft: 8}}>{authLoading ? 'Authenticating…' : 'Loading…'}</Text>
        </View>
      )}
      {error && <Text style={{color: 'red', marginBottom: 8}}>{error}</Text>}
      <FlatList
        contentContainerStyle={{paddingVertical: 8, paddingBottom: 80}}
        data={items}
        keyExtractor={(item, idx) => `${item.entry_id ?? item.barcode ?? idx}-${idx}`}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <Text style={styles.avatar}>📦</Text>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.itemName}>{item.item_code ?? '-'}</Text>
                <Text style={styles.itemSub}>{(item.qty ?? 0)} {item.uom ?? ''} • Shelf: {item.shelf ?? '-'}</Text>
                <Text style={styles.itemSub}>Barcode: {item.barcode ?? '-'}</Text>
                <Text style={styles.itemSub}>Date: {item.date ?? '-'}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={handleEdit(item)} style={styles.actionButton}>
                <Image source={require('@/assets/images/edit-icon.png')} style={styles.icon} />
              </TouchableOpacity>
              <View style={{width: 12}} />
              <View style={{ width: 12 }} />
              <TouchableOpacity
                style={styles.deleteButton}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent any parent press events
                  console.log('Trash icon clicked. Item data:', JSON.stringify(item, null, 2));
                  const eid = item.entry_id || (item as any)?.id;
                  console.log('Extracted entry ID:', eid);
                  if (!eid) {
                    const errorMsg = `Missing entry ID in item: ${JSON.stringify(item)}`;
                    console.error(errorMsg);
                    Alert.alert('Missing entry ID', 'Cannot delete because the entry has no ID.');
                    return;
                  }
                  console.log('Calling confirmAndDelete with ID:', eid);
                  confirmAndDelete(String(eid));
                }}
                onLongPress={() => {
                  console.log('Long press on delete');
                }}
              >
                <Image 
                  source={require('@/assets/images/delete-icon.png')} 
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.muted}>No items found.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f6f7fb' },
  header: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 16, marginTop: 10 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  toggleButton: { backgroundColor: '#e0e0e0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  toggleButtonActive: { backgroundColor: '#007AFF' },
  toggleButtonText: { color: '#000', fontWeight: '500' },
  toggleButtonActiveText: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  avatar: { fontSize: 22 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemSub: { color: '#6b7280', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8, borderRadius: 4 },
  deleteButton: { padding: 8, borderRadius: 4 },
  icon: { resizeMode: 'contain' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  editModalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  formGroup: { marginBottom: 15 },
  label: { marginBottom: 5, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, marginBottom: 10, width: '100%' },
  dateInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 12, marginBottom: 10, width: '100%', backgroundColor: '#f8f8f8' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, marginLeft: 10, minWidth: 100, alignItems: 'center' },
  cancelButton: { borderColor: 'grey', borderWidth: 1 },
  saveButton: { backgroundColor: '#007AFF' },
  buttonText: { fontWeight: '600' },
  muted: { color: '#6b7280' },
  alertBox: { width: '80%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 15 },
  alertTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  alertMessage: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  alertButtonsContainer: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginTop: 10 },
  alertButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 5, marginLeft: 10, minWidth: 70, alignItems: 'center' },
  destructiveButton: { backgroundColor: '#FF3B30' },
  alertButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  destructiveButtonText: { color: 'white' },
});
