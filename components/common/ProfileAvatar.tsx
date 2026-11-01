import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

interface ProfileAvatarProps {
  name: string;
  size?: number;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ name, size = 44 }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, Shadows.sm]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
  },
});
