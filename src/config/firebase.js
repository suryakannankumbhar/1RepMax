import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace this object with the config from your Firebase console
const firebaseConfig = {
    apiKey: 'AIzaSyCt8ts9QZgXYv2reG8cEYlO59RqMF4dzSs',
    authDomain: 'repmax-74201.firebaseapp.com',
    projectId: 'repmax-74201',
    storageBucket: 'repmax-74201.firebasestorage.app',
    messagingSenderId: '861525966324',
    appId: '1:861525966324:web:690fab5f7bcb864d1e4da1',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export these so we can use them anywhere in the app
export const db = getFirestore(app);
export const auth = getAuth(app);
