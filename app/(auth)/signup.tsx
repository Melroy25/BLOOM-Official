import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, Eye, EyeOff, Leaf, AlertCircle, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUpWithEmail, isLoading, authError, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setLocalError(null);
    clearError();

    if (!fullName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify.');
      return;
    }

    try {
      await signUpWithEmail(email, password, fullName);
      // Navigation will automatically transition to Onboarding via AuthGuard
    } catch (err: any) {
      setLocalError(err.message || 'Failed to create account. Please try again.');
    }
  };

  const displayError = localError || authError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={[styles.logoIconBg, Shadows.sm]}>
            <Leaf size={32} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.brandTitle}>BLOOM</Text>
          <Text style={styles.brandSubtitle}>Begin Your Mindful Growth</Text>
        </View>

        {/* Card Surface */}
        <View style={[styles.card, Shadows.md]}>
          <Text style={styles.cardHeading}>Create Account</Text>
          <Text style={styles.cardSubheading}>
            Join thousands cultivating focus, wellness, and healthy habits.
          </Text>

          {/* Error Banner */}
          {displayError ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color={Colors.error} strokeWidth={2} />
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={Colors.mutedText} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Melroy Fernandez"
                placeholderTextColor={Colors.lightText}
                value={fullName}
                onChangeText={(t) => {
                  setFullName(t);
                  if (localError) setLocalError(null);
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={Colors.mutedText} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="you@example.com"
                placeholderTextColor={Colors.lightText}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (localError) setLocalError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={Colors.mutedText} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.lightText}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (localError) setLocalError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color={Colors.mutedText} />
                ) : (
                  <Eye size={18} color={Colors.mutedText} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={Colors.mutedText} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter your password"
                placeholderTextColor={Colors.lightText}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (localError) setLocalError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled, Shadows.sm]}
            onPress={handleSignUp}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <ArrowRight size={18} color={Colors.white} strokeWidth={2.2} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link to Sign In */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 3,
  },
  brandSubtitle: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeading: {
    ...Typography.h2,
    color: Colors.darkText,
    marginBottom: 4,
  },
  cardSubheading: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    marginBottom: Spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: '#9E2A2B',
    flex: 1,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.darkText,
    fontSize: 15,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...Typography.button,
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
  },
  loginLink: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
});
