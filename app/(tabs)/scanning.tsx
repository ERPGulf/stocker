import { Camera, CameraView } from "expo-camera";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { Button, Dimensions, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Defs, Mask, Rect } from "react-native-svg";

export default function Scanning() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [barcode, setBarcode] = useState("");
  const router = useRouter();

  // Request camera permission and start camera when component mounts
  useFocusEffect(
    useCallback(() => {
      const startCamera = async () => {
        setScanned(false);
        const { status } = await Camera.requestCameraPermissionsAsync();
        const granted = status === "granted";
        setHasPermission(granted);
        setIsCameraActive(granted);
      };
      
      startCamera();
      
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    // Navigate to Item Details with scanned barcode
    router.push({ pathname: "/(tabs)/itemDetails", params: { barcode: data } });
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
          barcodeTypes: ['qr', 'pdf417', 'ean13', 'ean8', 'upc_e', 'upc_a', 'code39', 'code128'],
        }}
        style={[StyleSheet.absoluteFill, styles.camera]}
      >
        <View style={styles.overlay}>
          <Svg height="100%" width="100%">
            <Defs>
              <Mask id="mask" x="0" y="0" height="100%" width="100%">
                <Rect height="100%" width="100%" fill="#fff" />
                <Rect
                  x={Dimensions.get('window').width * 0.1}
                  y={Dimensions.get('window').height * 0.3}
                  width={Dimensions.get('window').width * 0.8}
                  height={Dimensions.get('window').width * 0.4}
                  fill="black"
                  rx={10}
                  ry={10}
                />
              </Mask>
            </Defs>
            <Rect height="100%" width="100%" fill="rgba(0,0,0,0.5)" mask="url(#mask)" />
          </Svg>
        </View>
        <Text style={styles.scanText}>
          Scan your barcode
        </Text>

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
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    position: 'absolute',
    top: Dimensions.get('window').height * 0.25,
    width: '100%',
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'transparent',
  },
  scanAgainContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
});
