import firebaseApp from './firebaseConfig';
import { getFirestore, collection, addDoc, getDoc, setDoc, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// Register a new user with Firebase Auth and store profile in Firestore
export async function registerUser(email, password, role = 'user') {
  // Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  // Store user profile in Firestore (do NOT store password)
  await setDoc(doc(db, 'users', user.uid), {
    email,
    role,
    createdAt: new Date().toISOString(),
  });
  return user.uid;
}

// Login: Use Firebase Auth
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  // Optionally fetch user profile from Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  return userDoc.exists() ? { id: user.uid, ...userDoc.data() } : null;
} 