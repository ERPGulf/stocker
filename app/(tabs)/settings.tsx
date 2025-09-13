import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import UserSlice, { selectName, selectUserDetails } from '@/redux/Slices/UserSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWarehouse } from '@/lib/state/warehouse';

const Settings = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const username = useSelector(selectName);
  const userDetails = useSelector(selectUserDetails);

  const { setSelectedWarehouse, setShelf } = useWarehouse();

  const handleLogout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['userToken', 'userLoginData', 'baseUrl']);
      
      // Reset Redux state
      dispatch({ type: 'user/logout' });
      
      // Clear warehouse and rack data
      setSelectedWarehouse(null);
      setShelf(null);
      
      // Navigate to the welcome screen
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleLogin = () => {
    // Clear existing data and navigate to login
    handleLogout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>User Information</Text>
        
        {username ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Username:</Text>
              <Text style={styles.value}>{username}</Text>
            </View>
            
            {userDetails?.api && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>API URL:</Text>
                <Text style={[styles.value, styles.url]} numberOfLines={1} ellipsizeMode="tail">
                  {userDetails.api}
                </Text>
              </View>
            )}
            
            {userDetails?.employeeCode && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Employee Code:</Text>
                <Text style={styles.value}>{userDetails.employeeCode}</Text>
              </View>
            )}
            
            {userDetails?.timestamp && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Timestamp:</Text>
                <Text style={styles.value}>{userDetails.timestamp}</Text>
              </View>
            )}
            {userDetails?.company && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Company:</Text>
                <Text style={styles.value}>{userDetails.company}</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.logoutButton]} 
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.loginContainer}>
            <Text style={styles.notLoggedIn}>You are not logged in</Text>
            <TouchableOpacity 
              style={[styles.button, styles.loginButton]} 
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Login with QR Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  url: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  button: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
  },
  loginButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    alignItems: 'center',
    padding: 20,
  },
  notLoggedIn: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
});

export default Settings;