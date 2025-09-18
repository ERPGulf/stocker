import { searchItems, getItemUOMs, getItemByUom } from "@/lib/api/items";
import debounce from "lodash.debounce";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
    Button,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from "react-native";

type Item = {
  name?: string;
};

interface ItemCodeButtonProps {
  onSelectItem?: (item: { item: Item; uom: string }) => void;
  warehouse?: string;
  navigateOnSelect?: boolean;
}

const ItemCodeButton = ({ onSelectItem, warehouse = '', navigateOnSelect = true }: ItemCodeButtonProps) => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [uoms, setUoms] = useState<string[]>([]);
  const [selectedUom, setSelectedUom] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loadingUoms, setLoadingUoms] = useState(false);

  const fetchItems = debounce(async (text: string) => {
    if (!text) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await searchItems(text, 5);
      if (!error) {
        setItems(data || []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, 250);

  const handleItemSelect = async (item: Item) => {
    setSelectedItem(item);
    setLoadingUoms(true);
    try {
      const uoms = await getItemUOMs(item.name || '');
      setUoms(uoms);
      if (uoms.length > 0) {
        setSelectedUom(uoms[0]);
      }
    } catch (error) {
      console.error('Error fetching UOMs:', error);
      setUoms([]);
    } finally {
      setLoadingUoms(false);
    }
  };

  const handleUomSelect = async (uom: string) => {
    if (!selectedItem) return;
    
    setSelectedUom(uom);
    
    try {
      // Get the full item details with the selected UOM
      const itemDetails = await getItemByUom(selectedItem.name || '', uom, warehouse);
      
      if (!itemDetails) {
        console.error('Could not fetch item details');
        return;
      }
      
      // Call the onSelectItem callback if provided
      if (onSelectItem) {
        onSelectItem({
          item: selectedItem,
          uom: uom
        });
      }
      
      // Navigate to item details if enabled
      if (navigateOnSelect && itemDetails.item_id) {
        router.push({
          pathname: '/(tabs)/itemDetails',
          params: {
            itemId: itemDetails.item_id,
            uom: uom,
            warehouse: warehouse
          }
        });
      }
      
      // Close the modal and reset state
      setModalVisible(false);
      setTimeout(() => {
        setSelectedItem(null);
        setUoms([]);
        setSearchTerm('');
        setItems([]);
      }, 300);
      
    } catch (error) {
      console.error('Error handling UOM selection:', error);
    }
  };

  return (
    <>
      <View style={styles.button}>
        <Button 
          title="Enter Item Code" 
          onPress={() => setModalVisible(true)}
          color="#007AFF"
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          // Reset state when modal is closed
          setTimeout(() => {
            setSelectedItem(null);
            setUoms([]);
            setSearchTerm('');
            setItems([]);
          }, 300);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedItem ? 'Select UOM' : 'Search Item Code'}
            </Text>

            {!selectedItem ? (
              <>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={searchTerm}
                    onChangeText={(text) => {
                      setSearchTerm(text);
                      fetchItems(text);
                    }}
                    placeholder="Type item code..."
                    autoFocus
                    style={styles.input}
                    placeholderTextColor="#999"
                    underlineColorAndroid="transparent"
                    selectionColor="#007AFF"
                    className="text-lg"
                  />
                </View>

                <View style={styles.suggestionsContainer}>
                  {loading ? (
                    <Text style={styles.searchingText}>Searching...</Text>
                  ) : items.length > 0 ? (
                    items.map((item) => (
                      <TouchableOpacity
                        key={item.name}
                        style={styles.suggestionItem}
                        onPress={() => handleItemSelect(item)}
                      >
                        <Text style={styles.itemText}>
                          {item.name} 
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : searchTerm ? (
                    <Text style={styles.searchingText}>No items found</Text>
                  ) : null}
                </View>
              </>
            ) : (
              <View style={styles.uomContainer}>
                <Text style={styles.selectedItem}>
                  {selectedItem.name} ({selectedItem.name})
                </Text>
                
                {loadingUoms ? (
                  <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
                ) : uoms.length > 0 ? (
                  <>
                    <Text style={styles.uomLabel}>Select Unit of Measure:</Text>
                    <View style={styles.uomList}>
                      {uoms.map((uom) => (
                        <TouchableOpacity
                          key={uom}
                          style={[
                            styles.uomItem,
                            selectedUom === uom && styles.uomItemSelected
                          ]}
                          onPress={() => handleUomSelect(uom)}
                        >
                          <Text style={styles.uomText}>{uom}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                ) : (
                  <Text style={styles.noUomText}>No UOMs available</Text>
                )}
                
                <View style={styles.uomButtons}>
                  <Button
                    title="Back"
                    onPress={() => {
                      setSelectedItem(null);
                      setUoms([]);
                    }}
                    color="#999"
                  />
                  {uoms.length > 0 && (
                    <Button
                      title="Select"
                      onPress={() => handleUomSelect(selectedUom)}
                      color="#007AFF"
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    flex: 1,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    outlineWidth: 0,
  },
  uomContainer: {
    padding: 16,
  },
  selectedItem: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1f2937',
  },
  uomLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  uomList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  uomItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  uomItemSelected: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  uomText: {
    fontSize: 16,
    color: '#1f2937',
  },
  uomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  noUomText: {
    textAlign: 'center',
    color: '#6b7280',
    marginVertical: 20,
  },
  loader: {
    marginVertical: 20,
  },
  button: {
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12
  },
  suggestionItem: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 16,
    padding: 16
  },
  inputContainer: {
    backgroundColor: '#f3f4f6',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  suggestionsContainer: {
    marginTop: 12,
    maxHeight: 224
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937'
  },
  searchingText: {
    color: '#6b7280',
    textAlign: 'center',
    padding: 12
  },
  itemText: {
    fontSize: 16,
    color: '#1f2937'
  }
});

export default ItemCodeButton;
