import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Button, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Defs, Mask, Rect } from "react-native-svg";
import { useDispatch } from "react-redux";
import { setBaseUrl, setFullname, setUserDetails, setUsername, } from '../redux/Slices/UserSlice';
import * as ImagePicker from 'expo-image-picker';

export default function LoginScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  // Check for existing login data and request camera permission
  useFocusEffect(
    useCallback(() => {
      const checkExistingLogin = async () => {
        try {
          const storedData = await AsyncStorage.getItem('userLoginData');
          if (storedData) {
            const { api, fullName, userId } = JSON.parse(storedData);
            if (api && fullName && userId) {
              dispatch(setFullname(fullName));
              dispatch(setUsername(userId));
              dispatch(setBaseUrl(api));
              router.replace('/(tabs)/home');
              return;
            }
          }
          // Request camera permission if not already granted
          if (!permission?.granted) {
            await requestPermission();
          }
        } catch (error) {
          console.error('Error in checkExistingLogin:', error);
        }
      };

      checkExistingLogin();
      setScanned(false);
    }, [permission, requestPermission])
  );

  function decodeBase64Utf8(base64String: string): string {
  const binary = atob(base64String);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

  // Decode and handle QR data
  const handleQRCodeData = async (data: string) => {
    try {
      const value = decodeBase64Utf8(data);
      console.log("value",value)
      const companyMatch = value.match(/Company: (\w+)/);
      const employeeCodeMatch = value.match(/Employee_Code: ([\w-]+)/);
      const userIdMatch = value.match(/User_id: ([\w@.-]+)/);
      const fullNameMatch = value.match(/Full_Name: (.+)/);
      const apiMatch = value.match(/API:\s*(https:\/\/[^\s\u0001\u001e]+)/);
      const branchMatch = value.match(/Payroll_Cost_Center: (.+)/);
      const branch = branchMatch ? branchMatch[1] : ''; // Provide a default branch if not present

      if (companyMatch && employeeCodeMatch && userIdMatch && fullNameMatch && apiMatch) {
        const company = companyMatch[1];
        const employeeCode = employeeCodeMatch[1];
        const userId = userIdMatch[1];
        const fullName = fullNameMatch[1].trim();
        const api = apiMatch[1].trim();
      
        
        // Store all login data with both full API URL and base URL
        const loginData = {
          company,
          employeeCode,
          fullName,
          userId,
          api, // Store only the base URL
          timestamp: new Date().toISOString(),
          branch
        };
        
        await AsyncStorage.multiSet([
          ["api", api],
          ["userToken", "authenticated"],
          ["userLoginData", JSON.stringify(loginData)]
        ]);
        
        dispatch(setFullname(fullName));
        dispatch(setUsername(userId));
        dispatch(setBaseUrl(api));
        dispatch(setUserDetails(loginData));

        // Navigate to tabs index page
        router.replace('/(tabs)/home');
      } else {
        Alert.alert("Invalid QR Code", "Please scan a valid company QR Code.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process QR Code.");
    }
  };

  // On QR scanned
  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    handleQRCodeData(data);
  };

  // Manual logout function if needed
  const handleManualLogin = () => {
    AsyncStorage.removeItem('userLoginData');
    setScanned(false);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          No access to camera. Please enable camera permissions in your device settings.
        </Text>
        <Button 
          title="Grant Permission" 
          onPress={requestPermission}
        />
      </View>
    );
  }

  const handleImagePicked = async (result: { canceled?: boolean; assets: Array<{ uri: string }> | null } | null) => {
    if (!result || result.canceled || !result.assets || result.assets.length === 0) return;
    const firstAsset = result.assets[0];
    if (firstAsset?.uri) {
      try {
        const scannedResults = await Camera.scanFromURLAsync(
          result.assets[0].uri,
        );
        const { data } = scannedResults[0];
        await handleQRCodeData(data);
      } catch (error) {
        alert('No QR-CODE Found');
      }
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      await handleImagePicked(result);
    } catch (error) {
      // Handle errors from ImagePicker
      alert('Error picking image.');
    }
  };


  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={[StyleSheet.absoluteFill, styles.camera]}
        >
          {/* Overlay */}
          <View style={styles.overlay}>
            <Svg height="100%" width="100%">
              <Defs>
                <Mask id="mask" x="0" y="0" height="100%" width="100%">
                  <Rect height="100%" width="100%" fill="#fff" />
                  <Rect
                    x={Dimensions.get("window").width * 0.1}
                    y={Dimensions.get("window").height * 0.2}
                    width={Dimensions.get("window").width * 0.8}
                    height={Dimensions.get("window").width * 0.8}
                    fill="black"
                    rx={10}
                    ry={10}
                  />
                </Mask>
              </Defs>
              <Rect height="100%" width="100%" fill="rgba(0,0,0,0.5)" mask="url(#mask)" />
            </Svg>
          </View>

          <Text style={styles.scanText}>Scan your QR Code</Text>

          {scanned && (
            <View style={styles.scanAgainContainer}>
              <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
            </View>
          )}
        </CameraView>
        
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.pickImageButton}
            onPress={pickImage}
          >
            <Text style={styles.pickImageButtonText}>
              SELECT FROM PHOTOS
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  pickImageButton: {
    backgroundColor: '#0a7ea4',
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  pickImageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "black",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanText: {
    position: "absolute",
    top: Dimensions.get("window").height * 0.25,
    width: "100%",
    textAlign: "center",
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
  scanAgainContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
});
