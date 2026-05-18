import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
} from '../config/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to detect if app is in standalone/PWA mode
const isStandaloneMode = (): boolean => {
  // Check if running as installed PWA (iOS)
  if (window.navigator.standalone === true) {
    return true;
  }
  // Check if running as installed PWA (Android)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  // Check if running as fullscreen (some PWAs use this)
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }
  return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const inStandaloneMode = isStandaloneMode();
      console.log(`🔐 Starting Google OAuth flow... (PWA standalone: ${inStandaloneMode})`);
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      
      if (inStandaloneMode) {
        // Use redirect-based flow for PWA mode (no popups)
        console.log('📱 Using redirect flow for PWA mode');
        await signInWithRedirect(auth, provider);
        // The redirect will navigate away, so loading will stay true
        // The auth state will update when user returns
      } else {
        // Use popup flow for browser mode
        console.log('🌐 Using popup flow for browser mode');
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log('✅ OAuth popup completed, user authenticated:', user.email);

        // Create or update user profile in Firestore (non-blocking)
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: new Date().toISOString(),
            });
            console.log('✅ User profile created in Firestore');
          } else {
            console.log('✅ User profile already exists');
          }
        } catch (firestoreErr) {
          console.warn('⚠️ Non-critical error creating user profile in Firestore:', firestoreErr);
        }
        
        console.log('⏳ Waiting for auth state update...');
      }
    } catch (err: any) {
      // Only handle actual auth errors here
      console.error('❌ Google Sign-In Error:', err);
      
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
        console.log('User closed the OAuth popup');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Pop-up blocked by browser. Please check your browser settings.');
        console.error('Browser blocked the OAuth popup');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setError('Sign-in cancelled');
        console.log('Popup request was cancelled');
      } else {
        const message = err?.message || 'Failed to sign in with Google';
        setError(message);
        console.error('Unexpected OAuth error:', message);
      }
      
      // Only set loading to false for actual auth errors
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to log out';
      setError(errorMessage);
      console.error('Logout Error:', err);
    }
  };

  // Handle OAuth redirect result on app init
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('✅ Redirect OAuth completed, user authenticated:', result.user.email);
          
          // Create or update user profile in Firestore
          try {
            const userRef = doc(db, 'users', result.user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
              await setDoc(userRef, {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                createdAt: new Date().toISOString(),
              });
              console.log('✅ User profile created in Firestore (from redirect)');
            }
          } catch (firestoreErr) {
            console.warn('⚠️ Non-critical error creating user profile in Firestore:', firestoreErr);
          }
        }
      } catch (err) {
        console.warn('⚠️ Error checking redirect result:', err);
      }
    };

    handleRedirectResult();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          console.log('✅ Auth state changed - user logged in:', user.email);
          
          // Fetch user profile from Firestore
          try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              setUserProfile(userDoc.data() as UserProfile);
              console.log('✅ User profile loaded from Firestore');
            }
          } catch (err) {
            console.error('❌ Error fetching user profile:', err);
          }
        } else {
          console.log('✅ Auth state changed - user logged out');
          setCurrentUser(null);
          setUserProfile(null);
        }
      } finally {
        // Always set loading to false after auth state is checked, whether user exists or not
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
