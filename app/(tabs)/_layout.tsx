import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Alert } from 'react-native';

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
      showAlert('Selection required', 'Please select both warehouse and shelf first.');
    }
  };

  return (
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
        name="index"
        options={{
          title: 'Warehouse',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanning"
        options={{
          title: 'scanning',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
        listeners={{ tabPress: guard }}
      />
      <Tabs.Screen
        name="itemDetails"
        options={{
          title: 'ItemDetails',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
        listeners={{ tabPress: guard }}
      />
      
      <Tabs.Screen
        name="items"
        options={{
          title: 'Items',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
        listeners={{ tabPress: guard }}
      />
      
    </Tabs>
  );
}
