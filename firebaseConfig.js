// Modular Syntax for Firebase 9+
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD3H8Z2iCCwJu0sXuVzMSxuQnXhGZ0AxrA",
  authDomain: "wellbeingjournalaverybit.firebaseapp.com",
  projectId: "wellbeingjournalaverybit",
  storageBucket: "wellbeingjournalaverybit.firebasestorage.app",
  messagingSenderId: "6609925902",
  appId: "1:6609925902:android:1d4bb81e236a7ec15b095f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the Firebase services you need
export const auth = getAuth(app);
export const firestore = getFirestore(app);

