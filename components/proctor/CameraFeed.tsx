import { View, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect } from 'react';

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
      <View className="absolute right-4 top-4 h-40 w-32 items-center justify-center rounded-xl bg-black">
        <Text className="text-center text-xs text-white">Camera Permission Needed</Text>
      </View>
    );
  }

  return (
    <View className="absolute right-4 top-4 h-40 w-32 overflow-hidden rounded-xl border border-gray-600">
      <CameraView style={{ flex: 1 }} facing="front" />
    </View>
  );
}
