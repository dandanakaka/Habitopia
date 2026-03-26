import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyCXoU8hDVfMhJLf6Cf_WgLJ13sKHPkCaxY",
    authDomain: "habitopia-18ad2.firebaseapp.com",
    projectId: "habitopia-18ad2",
    storageBucket: "habitopia-18ad2.firebasestorage.app",
    messagingSenderId: "204479477545",
    appId: "1:204479477545:web:adf13bc383e32ca0dfe938",
    measurementId: "G-Y31BT7VLW1"
};

const app = initializeApp(firebaseConfig);

// Persistence: This ensures the user stays logged in after closing the app
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);

