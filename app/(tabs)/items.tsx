import { deleteStockEntry, listStockEntries, StockEntry, updateStockEntry } from '@/lib/api/items';
import { getAccessToken } from '@/lib/http/tokenStore';
import { useWarehouse } from '@/lib/state/warehouse';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Items() {
  const router = useRouter();
  const { selectedWarehouse, token, authLoading, refreshToken } = useWarehouse();
  const [items, setItems] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<{visible: boolean; title: string; message: string}>({visible: false, title: '', message: ''});
  const [showTodayOnly, setShowTodayOnly] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<StockEntry | null>(null);
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
    date: new Date().toISOString().split('T')[0],
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const warehouseId = selectedWarehouse?.warehouse_id;
      if (!warehouseId) {
        setItems([]);
        setError('Please select a warehouse first');
        return;
      }
      // Data fetch; Authorization is attached by Axios interceptor
      const entries = await listStockEntries(showTodayOnly);
      setItems(entries);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedWarehouse?.warehouse_id, showTodayOnly]);

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

  const handleUpdateItem = async (item: StockEntry) => {
    if (!item.entry_id) {
      const errorMsg = 'Cannot update: No entry ID provided';
      console.error(errorMsg);
      Alert.alert('Error', errorMsg);
      return;
    }

    const updateAfterConfirm = async () => {
      try {
        console.log('Updating entry:', item);
        const result = await updateStockEntry({
          entry_id: item.entry_id || '',
          warehouse: item.warehouse || '',
          barcode: item.barcode || '',
          shelf: item.shelf || '',
          date: item.date || new Date().toISOString(),
          item_code: item.item_code || '',
          uom: item.uom || 'Nos',
          qty: item.qty || 0
        });
        
        console.log('Update result:', result);
        
        if (result?.status === 'success') {
          // Refresh the list after successful update
          load();
          showAlert('Success', 'Entry updated successfully');
        } else {
          showAlert('Error', result?.message || 'Failed to update entry');
        }
      } catch (error) {
        console.error('Error in updateAfterConfirm:', error);
        showAlert('Error', 'Failed to update entry. Please try again.');
      }
    };
    
    // Show confirmation dialog
    Alert.alert(
      'Update Entry',
      'Are you sure you want to update this entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {}
        },
        {
          text: 'Update',
          style: 'default',
          onPress: updateAfterConfirm
        }
      ]
    );
  };

  const handleDelete = async (entry_id: string) => {
    
    if (!entry_id) {
      const errorMsg = 'Cannot delete: No entry ID provided';
      console.error(errorMsg);
      Alert.alert('Error', errorMsg);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      // Ensure we have a valid token
      let currentToken = token;
      if (!currentToken) {
        console.log('No token found, attempting to refresh...');
        await refreshToken();
        currentToken = getAccessToken(); // Get the updated token after refresh
        if (!currentToken) {
          throw new Error('Authentication required. Please log in again.');
        }
      }
      
      console.log('Deleting entry with ID:', entry_id);
      const result = await deleteStockEntry(entry_id);
      console.log('Delete API response:', result);
      
      // Check if deletion was successful
      if (result?.status === 'success') {
        console.log('Delete successful, refreshing items...');
        await load();
        // Don't show success alert here as it might be disruptive
        return;
      }
      
      // Handle API response that indicates failure
      const errorMsg = result?.message || 'Failed to delete entry';
      console.error('Delete failed:', errorMsg);
      throw new Error(errorMsg);
      
    } catch (error: any) {
      console.error('Error in handleDelete:', {
        message: error.message,
        response: error.response?.data,
        status: error.status,
      });
      
      // Don't show alert here - let the error be handled by the UI state
      throw error;
    } finally {
      setLoading(false);
    }
  };

  

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

  const hideAlert = () => {
    setCustomAlert(prev => ({...prev, visible: false}));
  };

  const handleEdit = (item: StockEntry) => (e: any) => {
    e?.stopPropagation?.();
    setEditingItem(item);
    setEditForm({
      item_code: item.item_code || '',
      barcode: item.barcode || '',
      qty: String(item.qty || ''),
      uom: item.uom || 'Nos',
      shelf: item.shelf || '',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
  };

  const handleSaveUpdate = async () => {
    if (!editingItem?.entry_id) return;

    try {
      setLoading(true);
      const response = await updateStockEntry({
        entry_id: editingItem.entry_id,
        item_code: editForm.item_code,
        barcode: editForm.barcode,
        qty: Number(editForm.qty) || 0,
        uom: editForm.uom,
        shelf: editForm.shelf,
        date: editForm.date,
        warehouse: editingItem.warehouse || '',
      });

      // Close the modal immediately in all cases
      setEditingItem(null);
      
      // Handle success case
      if (response?.data?.status === 'success') {
        await load(); // Refresh the data
        showAlert('Success', 'Item updated successfully');
      } 
      // Handle error case with message from API
      else if (response?.data?.message) {
        showAlert('Error', response.data.message);
      }
      // Handle any other error case
      else {
        showAlert('Error', 'Failed to update item');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      setEditingItem(null); // Close the modal on error
      // Handle different error response formats
      const errorMessage = error?.response?.data?.error || 
                         error?.message || 
                         'Failed to update item. Please try again.';
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
      
      {/* Custom Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideAlert}
      >
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
                  onPress={() => {
                    button.onPress();
                    hideAlert();
                  }}
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

      {/* Edit Item Modal */}
      <Modal
        visible={!!editingItem}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Code</Text>
              <TextInput
                style={styles.input}
                value={editForm.item_code}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, item_code: text }))}
                placeholder="Item Code"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Barcode</Text>
              <TextInput
                style={styles.input}
                value={editForm.barcode}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, barcode: text }))}
                placeholder="Barcode"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={editForm.qty}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, qty: text }))}
                placeholder="Quantity"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>UOM</Text>
              <TextInput
                style={styles.input}
                value={editForm.uom}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, uom: text }))}
                placeholder="Unit of Measure"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Shelf</Text>
              <TextInput
                style={styles.input}
                value={editForm.shelf}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, shelf: text }))}
                placeholder="Shelf/Rack"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={editForm.date}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingItem(null)}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

      </View>
      {(loading || authLoading) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <ActivityIndicator />
          <Text style={{ marginLeft: 8 }}>{authLoading ? 'Authenticating…' : 'Loading…'}</Text>
        </View>
      )}
      {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      <FlatList
        contentContainerStyle={{
          paddingVertical: 8,
          paddingBottom: 80 // Add extra padding at the bottom to prevent content from being hidden behind tab bar
        }}
        data={items}
        keyExtractor={(item, idx) => `${item.entry_id ?? item.barcode ?? idx}-${idx}`}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={styles.avatar}>📦</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemName}>{item.item_code ?? '-'}</Text>
                <Text style={styles.itemSub}>
                  {(item.qty ?? 0)} {item.uom ?? ''} • Shelf: {item.shelf ?? '-'}
                </Text>
                <Text style={styles.itemSub}>
                  Barcode: {item.barcode ?? '-'}
                </Text>
                <Text style={styles.itemSub}>
                  Date: {item.date ?? '-'}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={handleEdit(item)}
                style={styles.actionButton}
              >
                <Image 
                  source={require('@/assets/images/edit-icon.png')} 
                  style={styles.icon}
                />
              </TouchableOpacity>
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
        ListEmptyComponent={!loading ? (
          <Text style={styles.muted}>No items found.</Text>
        ) : null}
      />
  </View>
);
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 10,
  },
  alertButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    color: '#000',
    fontWeight: '500',
  },
  toggleButtonActiveText: {
    color: '#fff',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  alertButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  destructiveButtonText: {
    color: 'white',
  },
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
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  deleteIcon: {
    fontSize: 20,
  },
  icon: {
    resizeMode: 'contain',
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    borderColor: 'grey',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});
