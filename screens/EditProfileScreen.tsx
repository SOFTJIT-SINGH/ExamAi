import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Phone, Check, Camera } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../App';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { session, updateUserProfile, uploadAvatar, userProfile } = useAuthStore();
  
  const [firstName, setFirstName] = useState(userProfile?.first_name || session?.user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(userProfile?.last_name || session?.user?.user_metadata?.last_name || '');
  const [phone, setPhone] = useState(userProfile?.phone || session?.user?.user_metadata?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(userProfile?.avatar_url || session?.user?.user_metadata?.avatar_url || null);
  const [isNewAvatar, setIsNewAvatar] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setIsNewAvatar(true);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required Field', 'First Name is required.');
      return;
    }

    setLoading(true);
    try {
      let finalAvatarUrl = avatarUri;

      if (isNewAvatar && avatarUri) {
        console.log('Uploading new avatar...');
        finalAvatarUrl = await uploadAvatar(avatarUri);
      }

      console.log('Updating profile data...', { firstName, lastName, phone, finalAvatarUrl });
      await updateUserProfile(firstName.trim(), lastName.trim(), phone.trim(), finalAvatarUrl || undefined);
      
      Alert.alert('Success', 'Your profile has been updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      Alert.alert('Update Failed', error.message || 'An unexpected error occurred while updating your profile. Check if your database schema includes "avatar_url" and "phone" columns.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="-ml-2 p-2">
            <ChevronLeft size={24} color="#334155" />
          </TouchableOpacity>
          <Text className="ml-2 text-xl font-bold text-slate-800">Edit Profile</Text>
        </View>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={loading}
          className={`${loading ? 'opacity-50' : ''}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Check size={24} color="#3b82f6" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Profile Image Section */}
        <View className="mb-8 items-center">
          <TouchableOpacity onPress={pickImage} className="relative">
            <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-blue-50 shadow-sm overflow-hidden">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} className="h-full w-full" />
              ) : (
                <User size={56} color="#3b82f6" />
              )}
            </View>
            <View className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2.5 shadow-md border-2 border-white">
              <Camera size={18} color="white" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text className="mt-4 text-sm font-bold text-blue-600">Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View className="space-y-6">
          <View>
            <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">First Name</Text>
            <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <User size={20} color="#94a3b8" />
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor="#cbd5e1"
                className="ml-3 flex-1 text-base font-semibold text-slate-800"
              />
            </View>
          </View>

          <View>
            <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">Last Name</Text>
            <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <User size={20} color="#94a3b8" />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor="#cbd5e1"
                className="ml-3 flex-1 text-base font-semibold text-slate-800"
              />
            </View>
          </View>

          <View>
            <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">Phone Number</Text>
            <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <Phone size={20} color="#94a3b8" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#cbd5e1"
                keyboardType="phone-pad"
                className="ml-3 flex-1 text-base font-semibold text-slate-800"
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</Text>
            <View className="flex-row items-center rounded-2xl border border-slate-100 bg-slate-100 px-4 py-4">
              <Text className="ml-1 text-base font-medium text-slate-400">{session?.user?.email}</Text>
            </View>
            <Text className="mt-2 ml-1 text-[10px] text-slate-400 italic">Email cannot be changed from the mobile app.</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
          className="mt-12 rounded-2xl bg-blue-600 py-4 shadow-lg shadow-blue-500/30"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center text-lg font-bold text-white">Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 py-2"
        >
          <Text className="text-center font-bold text-slate-400">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
