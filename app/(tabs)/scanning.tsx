import { Camera, CameraView } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Button, Dimensions, StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import Svg, { Defs, Mask, Rect } from "react-native-svg";

export default function Scanning() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const router = useRouter();

  const handleManualSubmit = () => {
    if (barcode.trim()) {
      const barcodeValue = barcode.trim();
      setBarcode('');
      setShowManualInput(false);
      router.push({ pathname: "/(tabs)/itemDetails", params: { barcode: barcodeValue } });
    }
  };

  // 🔹 FIX: properly handle camera lifecycle with useFocusEffect
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const startCamera = async () => {
        try {
          const { status } = await Camera.requestCameraPermissionsAsync();
          if (status === "granted" && isMounted) {
            setHasPermission(true);
            setIsCameraActive(true);
            setScanned(false); // reset scanner when screen is focused
          } else {
            setHasPermission(false);
          }
        } catch (error) {
          console.error("Error requesting camera permission:", error);
        }
      };

      startCamera();

      return () => {
        // cleanup when leaving screen
        isMounted = false;
        setIsCameraActive(false);
      };
    }, [])
  );

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanned) {
      setScanned(true);
      setIsCameraActive(false); // stop camera before navigating
      router.push({ pathname: "/(tabs)/itemDetails", params: { barcode: data } });
    }
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {!showManualInput ? (
          <>
            {isCameraActive && (
              <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['pdf417', 'ean13', 'ean8', 'upc_e', 'upc_a', 'code39', 'code128'],
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
            )}
            <View style={styles.manualButtonContainer}>
              <Button 
                title="Enter Barcode Manually" 
                onPress={() => setShowManualInput(true)} 
                color="#007AFF"
              />
            </View>
          </>
        ) : (
          <View style={styles.manualInputContainer}>
            <Text style={styles.manualTitle}>Enter Barcode</Text>
            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Enter barcode number"
              placeholderTextColor="#999"
              autoFocus
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.buttonRow}>
              <View style={styles.buttonWrapper}>
                <Button 
                  title="Cancel" 
                  onPress={() => setShowManualInput(false)} 
                  color="#FF3B30"
                />
              </View>
              <View style={styles.buttonWrapper}>
                <Button 
                  title="Submit" 
                  onPress={handleManualSubmit}
                  disabled={!barcode.trim()}
                />
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'black' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanText: { position: 'absolute', top: Dimensions.get('window').height * 0.25, width: '100%', textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '600' },
  scanAgainContainer: { position: 'absolute', bottom: 100, width: '100%', alignItems: 'center' },
  manualButtonContainer: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  manualInputContainer: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center' },
  manualTitle: { fontSize: 20, fontWeight: '600', marginBottom: 20, textAlign: 'center', color: '#000' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 20, backgroundColor: '#fff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  buttonWrapper: { flex: 1, marginHorizontal: 5 },
});
