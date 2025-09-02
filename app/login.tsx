import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera, CameraView } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Button, Dimensions, StyleSheet, Text, View } from "react-native";
import base64 from "react-native-base64";
import Svg, { Defs, Mask, Rect } from "react-native-svg";
import { useDispatch } from "react-redux";
import { setBaseUrl, setFullname, setUserDetails, setUsername } from '../redux/Slices/UserSlice';

export default function LoginScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  // Request camera permission
  useFocusEffect(
    useCallback(() => {
      const startCamera = async () => {
        setScanned(false);
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
      };
      startCamera();
    }, [])
  );

  // Decode and handle QR data
  const handleQRCodeData = async (data: string) => {
    try {
      const value = base64.decode(data);
      const companyMatch = value.match(/Company: (\w+)/);
      const employeeCodeMatch = value.match(/Employee_Code: ([\w-]+)/);
      const userIdMatch = value.match(/User_id: ([\w@.-]+)/);
      const fullNameMatch = value.match(/Full_Name: (.+)/);
      const apiMatch = value.match(/API: (https:\/\/.+)$/);


      if (companyMatch && employeeCodeMatch && userIdMatch && fullNameMatch && apiMatch) {
        const company = companyMatch[1];
        const employeeCode = employeeCodeMatch[1];
        const userId = userIdMatch[1];
        console.log("userId",userId);
        const fullName = fullNameMatch[1].trim();
        console.log("fullName",fullName);
        const api = apiMatch[1];

        // Store details
        await AsyncStorage.setItem("baseUrl", api);
        await AsyncStorage.setItem("userToken", "authenticated"); // Set the user token
        dispatch(setFullname(fullName));
        dispatch(setUsername(userId));
        dispatch(setBaseUrl(api));
        dispatch(
          setUserDetails({
            company,
            employeeCode,
            fullName,
            api,
          })
        );

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

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission…</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera. Please enable camera permissions in your device settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
                  y={Dimensions.get("window").height * 0.3}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
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
