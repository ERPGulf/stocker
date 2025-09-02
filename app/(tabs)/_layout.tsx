import { Tabs } from 'expo-router';
import React from 'react';
import { Alert, Image, Platform, SafeAreaView, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useWarehouse } from '@/lib/state/warehouse';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { selectedWarehouse, shelf } = useWarehouse();

  const canProceed = Boolean(selectedWarehouse && shelf);
  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      // Fallback for web where Alert may not render reliably
      alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };
  const guard = (e: any) => {
    if (!canProceed) {
      e.preventDefault();
      showAlert('Selection required', 'Please select both warehouse and shelf .');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Warehouse',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanning"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <Image source={require('@/assets/images/scanner-icons.png')} 
          style={{ tintColor: color, width: 24, height: 24 }}  /> ,
        }}
        listeners={{ tabPress: guard }}
      />
      <Tabs.Screen
        name="itemDetails"
        options={{
          href: null, // This hides the tab from the tab bar
          title: 'Item Details',
        }}
      />
      
      <Tabs.Screen
        name="items"
        options={{
          title: 'Items',
          tabBarIcon: ({ color }) => <Image source={require('@/assets/images/Items.png')} 
          style={{ tintColor: color, width: 24, height: 24 }}  />,
        }}
        listeners={{ tabPress: guard }}
      />
      
    </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginTop: 20, // 👈 applies margin/padding to ALL screens
  },
});