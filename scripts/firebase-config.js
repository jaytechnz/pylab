// ─── Firebase Configuration ─────────────────────────────────────────────────
// Replace with your PyLab Firebase project config.
// Firebase Console → Project Settings → Your apps → SDK setup

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getAuth }        from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { getFirestore }   from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyC-EYqYh1xS9M9_9qvpz2sw76c8d4aqIuY",
  authDomain: "pylab-ffd0b.firebaseapp.com",
  projectId: "pylab-ffd0b",
  storageBucket: "pylab-ffd0b.firebasestorage.app",
  messagingSenderId: "998545579974",
  appId: "1:998545579974:web:ec5b992b253ef0438b9cc7"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };
