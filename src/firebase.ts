import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Connection Test as per instructions
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc just to check connectivity
    await getDocFromServer(doc(db, '_connection_test', 'init'));
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Firebase Connection Error: The client is offline. Please check your Firebase configuration and domain allowlisting.");
    }
  }
}
testConnection();
