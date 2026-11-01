// BLOOM Authentication Context & Provider
// Manages Firebase Auth state, Firestore user profile synchronization,
// Onboarding completion state, and user-friendly authentication helpers.

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import {
  createUserProfile,
  getUserProfile,
  completeOnboarding as firestoreCompleteOnboarding,
  subscribeToUserProfile,
} from '../services/firestoreService';
import { UserProfile, OnboardingResponses } from '../types';

// Complete web-browser auth sessions if any
WebBrowser.maybeCompleteAuthSession();

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  authError: string | null;
  clearError: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeUserOnboarding: (responses: OnboardingResponses) => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function mapAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check or sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or tap Forgot Password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your details.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please check Firebase Console.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access temporarily restricted. Try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In window was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Only one Google Sign-In request can be active at a time.';
    case 'auth/popup-blocked':
      return 'Google Sign-In popup was blocked by your browser. Please allow popups.';
    default:
      return 'An unexpected authentication error occurred. Please try again.';
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = () => setAuthError(null);

  // Synchronize Firebase Auth state
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    // Safety timeout to ensure app never hangs on cold start
    const safetyTimeout = setTimeout(() => {
      setIsLoading((loading) => {
        if (loading) {
          console.warn('[AuthContext] Auth loading safety timeout reached (4s). Setting isLoading to false.');
          return false;
        }
        return false;
      });
    }, 4000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Load locally cached profile immediately so onboarding is never stuck
        AsyncStorage.getItem(`@bloom_profile_${currentUser.uid}`)
          .then((cached) => {
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                setUserProfile((prev) => prev || parsed);
              } catch (_) {}
            }
          })
          .catch(() => {});

        // Subscribe to live user profile changes in Firestore
        try {
          unsubscribeProfile = subscribeToUserProfile(currentUser.uid, (profile) => {
            if (profile) {
              setUserProfile(profile);
              AsyncStorage.setItem(`@bloom_profile_${currentUser.uid}`, JSON.stringify(profile)).catch(() => {});
            } else {
              // Only create cloud profile if not already cached locally
              AsyncStorage.getItem(`@bloom_profile_${currentUser.uid}`).then((c) => {
                if (!c) {
                  createUserProfile(currentUser.uid, {
                    fullName: currentUser.displayName || 'Bloom Member',
                    email: currentUser.email || '',
                    photoURL: currentUser.photoURL || null,
                    onboardingCompleted: false,
                  }).catch(() => {});
                }
              }).catch(() => {});
            }
            setIsLoading(false);
          });
        } catch (err) {
          console.warn('[AuthContext] Failed to subscribe to user profile:', err);
          setIsLoading(false);
        }
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  // 1. Sign In With Email
  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      const friendlyMsg = mapAuthErrorMessage(error?.code || '');
      setAuthError(friendlyMsg);
      setIsLoading(false);
      throw new Error(friendlyMsg);
    }
  };

  // 2. Sign Up With Email
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<void> => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = fullName.trim() || 'Bloom Member';

      // Update Firebase Auth profile
      await updateProfile(cred.user, { displayName: cleanName });

      // Create Initial Firestore User Document with onboardingCompleted = false
      await createUserProfile(cred.user.uid, {
        fullName: cleanName,
        email: cred.user.email || email.trim(),
        onboardingCompleted: false,
        userType: 'student',
        currentMood: 'Calm',
        wellnessGoals: ['Mindful balance'],
      });

      const initialProfile: UserProfile = {
        uid: cred.user.uid,
        fullName: cleanName,
        email: cred.user.email || email.trim(),
        photoURL: cred.user.photoURL || null,
        username: email.trim().split('@')[0] || `user_${cred.user.uid.slice(0, 5)}`,
        onboardingCompleted: false,
        userType: 'student',
        currentMood: 'Calm',
        wellnessGoals: ['Mindful balance'],
        notificationPreferences: {
          dailyReminders: true,
          streakAlerts: true,
          communityUpdates: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUserProfile(initialProfile);
      try {
        await AsyncStorage.setItem(`@bloom_profile_${cred.user.uid}`, JSON.stringify(initialProfile));
      } catch (_) {}
      setIsLoading(false);
    } catch (error: any) {
      const friendlyMsg = mapAuthErrorMessage(error?.code || '');
      setAuthError(friendlyMsg);
      setIsLoading(false);
      throw new Error(friendlyMsg);
    }
  };

  // 3. Sign Out User
  const signOutUser = async (): Promise<void> => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
      console.error('[AuthContext] SignOut error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Send Password Reset
  const sendPasswordReset = async (email: string): Promise<void> => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      const friendlyMsg = mapAuthErrorMessage(error?.code || '');
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  // 5. Refresh User Profile
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    try {
      const fresh = await getUserProfile(user.uid);
      if (fresh) {
        setUserProfile(fresh);
      }
    } catch (e) {
      console.warn('[AuthContext] refreshProfile error:', e);
    }
  };

  // 6. Complete Onboarding
  const completeUserOnboarding = async (responses: OnboardingResponses): Promise<void> => {
    if (!user) {
      throw new Error('User is not authenticated.');
    }
    setAuthError(null);

    const completedProfile: UserProfile = {
      uid: user.uid,
      fullName: responses.fullName.trim() || user.displayName || 'Bloom Member',
      email: user.email || '',
      photoURL: user.photoURL || null,
      username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 5)}`,
      userType: responses.userType,
      currentMood: responses.currentMood,
      whyUsingBloom: responses.reasons,
      wellnessGoals: responses.wellnessGoals,
      helpImprove: responses.improvements,
      notificationPreferences: userProfile?.notificationPreferences || {
        dailyReminders: true,
        streakAlerts: true,
        communityUpdates: true,
      },
      createdAt: userProfile?.createdAt || new Date(),
      updatedAt: new Date(),
      onboardingCompleted: true,
    };

    // 1. Immediately update state so router unblocks to /(tabs)
    setUserProfile(completedProfile);

    // 2. Persist to local storage for instant offline/reconnect resiliency
    try {
      await AsyncStorage.setItem(`@bloom_profile_${user.uid}`, JSON.stringify(completedProfile));
    } catch (_) {}

    // 3. Sync to Firestore in background
    try {
      await firestoreCompleteOnboarding(user.uid, responses);
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        console.warn('[AuthContext] Firestore onboarding sync:', error?.message || error);
      }
    }
  };

  // 7. Google Sign-In Implementation
  // Supports Web Popup and Mobile WebBrowser OAuth Sessions
  const signInWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      if (Platform.OS === 'web') {
        const cred = await signInWithPopup(auth, provider);
        const googleUser = cred.user;

        // Ensure user profile in Firestore
        try {
          const existingProfile = await getUserProfile(googleUser.uid);
          if (!existingProfile) {
            await createUserProfile(googleUser.uid, {
              fullName: googleUser.displayName || 'Bloom Member',
              email: googleUser.email || '',
              photoURL: googleUser.photoURL || null,
              onboardingCompleted: false,
              userType: 'student',
              currentMood: 'Calm',
              wellnessGoals: ['Mindful balance'],
            });
          }
        } catch (dbErr: any) {
          if (dbErr?.code !== 'permission-denied') { console.warn('[AuthContext] Initial profile sync:', dbErr?.message || dbErr); }
        }
        return { success: true };
      } else {
        // Native / Expo mobile environment
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'bloom',
          path: 'auth/callback',
        });

        // Google Web Client ID from google-services.json
        const clientId = '772698292142-5n4stbotk0u4nvdmrqp0edkbif6mjcdd.apps.googleusercontent.com';
        const nonce = Math.random().toString(36).substring(2, 15);
        const authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(clientId)}` +
          `&response_type=id_token` +
          `&scope=openid%20profile%20email` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&nonce=${encodeURIComponent(nonce)}`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

        if (result.type === 'success' && result.url) {
          const urlParams = new URLSearchParams(
            result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1]
          );
          const idToken = urlParams.get('id_token');

          if (idToken) {
            const credential = GoogleAuthProvider.credential(idToken);
            const cred = await signInWithCredential(auth, credential);
            const googleUser = cred.user;

            try {
              const existingProfile = await getUserProfile(googleUser.uid);
              if (!existingProfile) {
                await createUserProfile(googleUser.uid, {
                  fullName: googleUser.displayName || 'Bloom Member',
                  email: googleUser.email || '',
                  photoURL: googleUser.photoURL || null,
                  onboardingCompleted: false,
                  userType: 'student',
                  currentMood: 'Calm',
                  wellnessGoals: ['Mindful balance'],
                });
              }
            } catch (dbErr: any) {
              console.warn('[AuthContext] Initial profile sync pending Firestore permissions:', dbErr?.message || dbErr);
            }
            return { success: true };
          }
        }

        return { success: false, message: 'Google Sign-In was cancelled or incomplete.' };
      }
    } catch (error: any) {
      console.warn('[AuthContext] Google Sign-In error:', error);
      const friendlyMsg =
        mapAuthErrorMessage(error?.code || '') || error?.message || 'Google Sign-In failed.';
      setAuthError(friendlyMsg);
      return { success: false, message: friendlyMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const onboardingCompleted = userProfile?.onboardingCompleted ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        isAuthenticated,
        onboardingCompleted,
        authError,
        clearError,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        sendPasswordReset,
        refreshProfile,
        completeUserOnboarding,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
