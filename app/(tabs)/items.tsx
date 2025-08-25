import { deleteStockEntry, listStockEntries, StockEntry, updateStockEntry } from '@/lib/api/items';
import { getAccessToken } from '@/lib/http/tokenStore';
import { useWarehouse } from '@/lib/state/warehouse';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Items() {
  const router = useRouter();
  const { selectedWarehouse, token, authLoading, refreshToken } = useWarehouse();
  const [items, setItems] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<{visible: boolean; title: string; message: string}>({visible: false, title: '', message: ''});

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
      const entries = await listStockEntries(warehouseId);
      setItems(entries);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedWarehouse?.warehouse_id]);

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

  const handleUpdate = async (item: StockEntry) => {
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

  return (
    <View style={styles.container}>
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.title}>Today's entries</Text>

      </View>
      {(loading || authLoading) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <ActivityIndicator />
          <Text style={{ marginLeft: 8 }}>{authLoading ? 'Authenticating…' : 'Loading…'}</Text>
        </View>
      )}
      {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      <FlatList
        contentContainerStyle={{ paddingVertical: 8 }}
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
                onPress={() => {
                  const bc = item.barcode?.trim();
                  if (!bc) {
                    Alert.alert('Missing barcode', 'This entry has no barcode to edit.');
                    return;
                  }
                  const params: Record<string, string> = {
                    barcode: bc,
                  };
                  if (item.entry_id) params.entry_id = String(item.entry_id);
                  if ((item as any)?.id && !params.entry_id) params.entry_id = String((item as any).id);
                  if (item.item_code) params.item_code = String(item.item_code);
                  if (item.uom) params.uom = String(item.uom);
                  if (typeof item.qty !== 'undefined') params.qty = String(item.qty);
                  if (item.shelf) params.shelf = String(item.shelf);
                  if (item.warehouse) params.warehouse = String(item.warehouse);
                  if (item.date) params.date = String(item.date);
                  router.push({ pathname: '/(tabs)/itemDetails', params });
                }}
              >
                <Text>✏️</Text>
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
                  // Optional: Add haptic feedback on long press
                  // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  console.log('Long press on delete');
                }}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
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
    elevation: 5,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
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
  deleteButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  deleteIcon: {
    fontSize: 20,
  },
});
