/* ═══════════════════════════════════════════════════════════════════════════
   FIREBASE + CLOUDINARY CONFIG
   Paste your credentials below. Never put Cloudinary API secret here —
   only cloud name and unsigned upload preset are needed.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Firebase (Firebase Console → Project settings → Your apps → Web app) ──
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyBqQiQilg4Owcu6b2eKCNYjfapchfgnySc',
  authDomain:        'checkpoint-web-4d40c.firebaseapp.com',
  projectId:         'checkpoint-web-4d40c',
  storageBucket:     'checkpoint-web-4d40c.firebasestorage.app',
  messagingSenderId: '288516381632',
  appId:             '1:288516381632:web:38fb4cd4625fa1d87c0625',
  measurementId:     'G-FW00QPQQKT',
};

// ── Cloudinary (Dashboard → Settings → Upload → Upload presets) ──
const CLOUDINARY_CLOUD_NAME    = 'dlrmp9vsd';
const CLOUDINARY_UPLOAD_PRESET = 'checkpointup';
