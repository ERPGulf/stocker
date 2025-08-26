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

  // Reset to initial state when the tab is focused
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setIsCameraActive(false);
      setBarcode("");
    }, [])
  );

  const startScanning = async () => {
    setScanned(false);
    const { status } = await Camera.requestCameraPermissionsAsync();
    const granted = status === "granted";
    setHasPermission(granted);
    setIsCameraActive(granted);
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    // Navigate to Item Details with scanned barcode
    router.push({ pathname: "/(tabs)/itemDetails", params: { barcode: data } });
  };

  // Initial screen: show button before opening camera
  if (!isCameraActive) {
    return (
      <View style={styles.center}>
        <Text style={styles.enterTitle}>Enter item</Text>
        <TextInput
          value={barcode}
          onChangeText={setBarcode}
          placeholder="Enter barcode"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="default"
        />
        <View style={{ height: 12 }} />
        <Button
          title="Search"
          onPress={() => router.push({ pathname: "/(tabs)/itemDetails", params: { barcode } })}
          disabled={!barcode?.trim()}
        />
        <View style={{ height: 24 }} />
        <Button title="Scan Here" onPress={startScanning} />
      </View>
    );
  }

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
        <Text>No access to camera</Text>
        <View style={{ height: 12 }} />
        <Button title="Try Again" onPress={startScanning} />
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  enterTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
  },
  input: {
    width: '80%',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    fontSize: 16,
    color: '#000',
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
