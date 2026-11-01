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
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Leaf } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset, authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSent, setSuccessSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleReset = async () => {
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your registered email address.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSuccessSent(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send reset link. Please check your email.');
    } finally {
      setIsSubmitting(false);
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
        {/* Top Back Navigation */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.darkText} />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={[styles.logoIconBg, Shadows.sm]}>
            <Leaf size={32} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.brandTitle}>BLOOM</Text>
        </View>

        {/* Card Surface */}
        <View style={[styles.card, Shadows.md]}>
          {successSent ? (
            <View style={styles.successState}>
              <View style={styles.successIconBg}>
                <CheckCircle2 size={40} color={Colors.success} />
              </View>
              <Text style={styles.cardHeading}>Check Your Inbox</Text>
              <Text style={styles.successDescription}>
                We've sent a secure password reset link to:
              </Text>
              <Text style={styles.targetEmail}>{email.trim()}</Text>
              <Text style={styles.successInstructions}>
                Click the link in the email to choose a new password, then return to sign in.
              </Text>

              <TouchableOpacity
                style={[styles.primaryButton, Shadows.sm, { width: '100%', marginTop: Spacing.xl }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Return to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.cardHeading}>Forgot Password?</Text>
              <Text style={styles.cardSubheading}>
                Enter your registered email address and we'll send you instructions to reset your password.
              </Text>

              {/* Error Banner */}
              {displayError ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={18} color={Colors.error} strokeWidth={2} />
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Registered Email</Text>
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

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.buttonDisabled, Shadows.sm]}
                onPress={handleReset}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
    paddingTop: Spacing.massive,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  backText: {
    ...Typography.bodySmall,
    color: Colors.darkText,
    fontWeight: '600',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 3,
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
    marginBottom: 6,
    textAlign: 'center',
  },
  cardSubheading: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: Spacing.xl,
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
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    ...Typography.button,
    fontSize: 16,
    fontWeight: '700',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  successIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successDescription: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    textAlign: 'center',
    marginTop: 4,
  },
  targetEmail: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginVertical: Spacing.xs,
    textAlign: 'center',
  },
  successInstructions: {
    ...Typography.caption,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
