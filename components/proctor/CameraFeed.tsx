import { View, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect } from "react";

export default function CameraFeed() {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="absolute top-4 right-4 w-32 h-40 bg-black rounded-xl justify-center items-center">
        <Text className="text-white text-xs text-center">
          Camera Permission Needed
        </Text>
      </View>
    );
  }

  return (
    <View className="absolute top-4 right-4 w-32 h-40 rounded-xl overflow-hidden border border-gray-600">
      <CameraView style={{ flex: 1 }} facing="front" />
    </View>
  );
}