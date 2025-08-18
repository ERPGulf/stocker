import React, { useState } from "react";
import { Text, View, StyleSheet, Button, Dimensions, TextInput } from "react-native";
import { CameraView, Camera } from "expo-camera";
import Svg, { Rect, Defs, Mask } from "react-native-svg";
import { useRouter } from "expo-router";

export default function Scanning() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [barcode, setBarcode] = useState("");
  const router = useRouter();

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

  const { width, height } = Dimensions.get("window");
  const frameWidth = width * 0.7;
  const frameHeight = width * 0.5;
  const frameX = (width - frameWidth) / 2;
  const frameY = (height - frameHeight) / 2;
  const cornerRadius = 20;

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Dark overlay with rounded cutout */}
      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="mask">
            {/* Full white = visible, black = transparent hole */}
            <Rect width={width} height={height} fill="white" />
            <Rect
              x={frameX}
              y={frameY}
              rx={cornerRadius}
              ry={cornerRadius}
              width={frameWidth}
              height={frameHeight}
              fill="black"
            />
          </Mask>
        </Defs>
        {/* Dark overlay applied with mask */}
        <Rect
          width={width}
          height={height}
          fill="rgba(0,0,0,0.5)"
          mask="url(#mask)"
        />
      </Svg>

      {/* Caption under the scanning frame */}
      <Text
        style={{
          position: "absolute",
          top: frameY + frameHeight + 24,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#fff",
          fontSize: 16,
          fontWeight: "600",
        }}
      >
        Scan your barcode
      </Text>

      {scanned && (
        <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  enterTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});
