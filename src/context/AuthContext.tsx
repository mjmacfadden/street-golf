import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
} from '../config/firebase';
import {
  signInWithPopup,
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
      console.log('🔐 Starting Google OAuth flow...');
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('✅ OAuth popup completed, user authenticated:', user.email);

      // Create or update user profile in Firestore (non-blocking)
      // This should NOT block the modal from closing or set loading to false
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
        // Don't fail the sign-in if Firestore profile creation fails
        // The auth state is already updated
      }
      
      // Don't set loading to false here - let onAuthStateChanged handle it
      console.log('⏳ Waiting for auth state update...');
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
