import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Camera,
  Lock,
  Unlock,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { UserProfile } from '../../../types/collabs';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSaveProfile,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [handle, setHandle] = useState(currentUser.handle);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [isPublic, setIsPublic] = useState(currentUser.visibility !== 'private');

  const handlePickAvatarFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          'Photo Permission',
          'Permission to access photos is needed to choose your profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error choosing avatar from gallery:', err);
    }
  };

  const handleSave = () => {
    onSaveProfile({
      name: name.trim() || currentUser.name,
      handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      bio: bio.trim(),
      visibility: isPublic ? 'public' : 'private',
      avatar,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalCard, Shadows.lg]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Circle Profile</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={20} color={Colors.mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar Picker from Gallery */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarWrap}
                onPress={handlePickAvatarFromGallery}
                activeOpacity={0.8}
                accessibilityLabel="Choose photo from gallery"
              >
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {currentUser.initials}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <Camera size={18} color={Colors.white} />
                </View>
              </TouchableOpacity>

              <View style={styles.avatarTextWrap}>
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={handlePickAvatarFromGallery}
                  activeOpacity={0.8}
                >
                  <Text style={styles.changePhotoBtnText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <Text style={styles.photoTipText}>
                  Tap to upload profile pic from your phone
                </Text>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.inputField}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor={Colors.mutedText}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  style={styles.inputField}
                  value={handle}
                  onChangeText={setHandle}
                  placeholder="@username"
                  placeholderTextColor={Colors.mutedText}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Bio & Growth Goals</Text>
                <TextInput
                  style={[styles.inputField, styles.bioField]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Share a mindful note about yourself..."
                  placeholderTextColor={Colors.mutedText}
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              {/* Visibility Toggle */}
              <View style={styles.visibilityCard}>
                <View style={styles.visibilityLeft}>
                  {isPublic ? (
                    <Unlock size={20} color={Colors.primary} />
                  ) : (
                    <Lock size={20} color={Colors.mutedText} />
                  )}
                  <View>
                    <Text style={styles.visibilityTitle}>Circle Visibility</Text>
                    <Text style={styles.visibilityDesc}>
                      {isPublic
                        ? 'Public to campus peers'
                        : 'Private to accepted friends'}
                    </Text>
                  </View>
                </View>

                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: '#E0EBE3', true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#141E19',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF6EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Avatar
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: Spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#C0EACD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#456B54',
  },
  cameraOverlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 32,
    backgroundColor: 'rgba(20, 30, 25, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextWrap: {
    flex: 1,
  },
  changePhotoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    backgroundColor: '#EBF6EF',
    alignSelf: 'flex-start',
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#141E19',
  },
  photoTipText: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 4,
  },
  // Form
  formContainer: {
    gap: 14,
    marginTop: Spacing.md,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  inputField: {
    backgroundColor: '#EBF6EF',
    borderRadius: BorderRadius.round,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#141E19',
  },
  bioField: {
    borderRadius: BorderRadius.lg,
    height: 80,
    textAlignVertical: 'top',
  },
  visibilityCard: {
    backgroundColor: '#EBF6EF',
    padding: 14,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visibilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  visibilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141E19',
  },
  visibilityDesc: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 1,
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF6EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  saveButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
