import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { LoginCredentials, RegisterPayload, User } from '../models';

const profileRef = (uid: string) => doc(db, 'users', uid);
const withoutUndefined = <T extends Record<string, unknown>>(value: T): Partial<T> =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;

function toProfile(uid: string, data: Partial<User>, fallback?: FirebaseUser): User {
  return {
    ...data,
    id: uid,
    email: fallback?.email || data.email || '',
    firstName: data.firstName || fallback?.displayName?.split(' ')[0] || '',
    lastName: data.lastName || fallback?.displayName?.split(' ').slice(1).join(' ') || '',
    userType: data.userType || 'Student',
    isVerified: fallback?.emailVerified ?? data.isVerified ?? false,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email address already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/invalid-credential': 'Email or password is incorrect. Please try again.',
    'auth/user-not-found': 'No account found with this email address. Please register.',
    'auth/wrong-password': 'Email or password is incorrect. Please try again.',
    'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email and password sign-in is not enabled for this Firebase project.',
    'auth/api-key-not-valid': 'Firebase rejected this project API key. Copy the Web API key from Firebase Console → Project settings → General, then restart Expo.',
    'auth/invalid-api-key': 'Firebase rejected this project API key. Copy the Web API key from Firebase Console → Project settings → General, then restart Expo.',
  };
  if (code && messages[code]) return messages[code];
  return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
}

export const authService = {
  subscribe(
    listener: (firebaseUser: FirebaseUser | null) => void,
    onError?: (error: Error) => void,
  ) {
    return onAuthStateChanged(auth, listener, onError);
  },

  async getProfile(firebaseUser: FirebaseUser): Promise<User> {
    const ref = profileRef(firebaseUser.uid);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const profile = toProfile(firebaseUser.uid, snapshot.data() as Partial<User>, firebaseUser);
      // Keep the UID/email and verification state in sync with Firebase Auth.
      await setDoc(ref, { id: firebaseUser.uid, email: profile.email }, { merge: true });
      return profile;
    }

    const profile = toProfile(firebaseUser.uid, {}, firebaseUser);
    await setDoc(ref, profile, { merge: true });
    return profile;
  },

  async login(credentials: LoginCredentials): Promise<void> {
    await signInWithEmailAndPassword(auth, credentials.email.trim(), credentials.password);
  },

  async register(payload: RegisterPayload): Promise<User> {
    if (!payload.password) throw new Error('Password is required.');
    const credential = await createUserWithEmailAndPassword(auth, payload.email.trim(), payload.password);
    const displayName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();
    const profile: User = {
      id: credential.user.uid,
      email: credential.user.email || payload.email.trim(),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      userType: payload.userType,
      isRegionalLead: payload.isRegionalLead,
      university: payload.university,
      department: payload.department,
      designation: payload.designation,
      educationLevel: payload.educationLevel,
      skills: payload.skills,
      bio: payload.bio,
      address1: payload.address1,
      address2: payload.address2,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      postCode: payload.postCode,
      phone: payload.phone || payload.mobile,
      avatarUrl: `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(displayName)}&backgroundColor=00BD62`,
      isVerified: credential.user.emailVerified,
      helpedCount: 0,
      rating: 5,
      createdAt: new Date().toISOString(),
    };
    try {
      await updateAuthProfile(credential.user, { displayName });
      await setDoc(profileRef(credential.user.uid), withoutUndefined(profile as unknown as Record<string, unknown>), { merge: true });
    } catch (error) {
      await signOut(auth).catch(() => undefined);
      throw error;
    }
    return profile;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, message: `Password reset instructions have been sent to ${email.trim()}. Check your inbox!` };
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const current = auth.currentUser;
    if (!current || current.uid !== userId) throw new Error('You must be signed in to update this profile.');
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.email;
    delete safeUpdates.createdAt;
    await updateDoc(profileRef(userId), withoutUndefined(safeUpdates as Record<string, unknown>));
    const snapshot = await getDoc(profileRef(userId));
    if (!snapshot.exists()) throw new Error('User profile not found.');
    return toProfile(userId, snapshot.data() as Partial<User>, current);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },
};
