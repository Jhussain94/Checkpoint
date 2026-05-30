/* ═══════════════════════════════════════════════════════════════════════════
   FIREBASE INTERACTIVE — Campus Camera + Notice Board
   Firestore realtime listeners, Cloudinary unsigned image uploads.
   ═══════════════════════════════════════════════════════════════════════════ */

const CAMPUS_CAMERA_COLLECTION = 'campusCameraUploads';
const NOTICE_BOARD_COLLECTION  = 'noticeBoardNotes';
const CAMPUS_PHOTO_MAX_BYTES   = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES        = ['image/jpeg', 'image/png', 'image/webp'];

let _campusUploads = [];
let _noticeNotes   = [];
let _firestore     = null;
let _firebaseReady = false;

/** True when Firebase config placeholders have been replaced. */
function isFirebaseConfigured() {
  return FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY'
      && FIREBASE_CONFIG.projectId !== 'YOUR_PROJECT_ID';
}

/** True when Cloudinary placeholders have been replaced. */
function isCloudinaryConfigured() {
  return CLOUDINARY_CLOUD_NAME !== 'YOUR_CLOUD_NAME'
      && CLOUDINARY_UPLOAD_PRESET !== 'YOUR_UPLOAD_PRESET';
}

function getCampusCameraUploads() {
  const resetAt = getCampusCameraGalleryResetTime();
  return _campusUploads.filter(u => {
    const d = parseFirestoreDate(u.createdAt);
    return d && d.getTime() >= resetAt;
  });
}

/** One-time gallery reset — hides pre-existing Firestore test images. */
function getCampusCameraGalleryResetTime() {
  const key = 'checkpoint_cc_gallery_v1';
  let stored = localStorage.getItem(key);
  if (!stored) {
    stored = String(Date.now());
    localStorage.setItem(key, stored);
    console.log('[Checkpoint] Campus Camera gallery reset — only new uploads will show');
  }
  return Number(stored);
}
function getNoticeBoardNotes()    { return _noticeNotes; }

/** Convert Firestore Timestamp or ISO string to Date. */
function parseFirestoreDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
}

/**
 * Boot Firebase and attach realtime listeners.
 * Call once on page load (before or alongside initDB).
 */
async function initFirebaseInteractive() {
  if (!isFirebaseConfigured()) {
    console.warn('[Checkpoint] Firebase not configured — paste credentials in js/firebase-config.js');
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    _firestore = firebase.firestore();
    _firebaseReady = true;
    console.log('[Checkpoint] Firebase initialized —', FIREBASE_CONFIG.projectId);

    _firestore.collection(CAMPUS_CAMERA_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(12)
      .onSnapshot(
        snapshot => {
          _campusUploads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('[Checkpoint] Campus Camera realtime update:', _campusUploads.length, 'uploads');
          if (typeof ccBuildGrid === 'function') ccBuildGrid();
        },
        err => console.error('[Checkpoint] Campus Camera listener error —', err.message)
      );

    _firestore.collection(NOTICE_BOARD_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(6)
      .onSnapshot(
        snapshot => {
          _noticeNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('[Checkpoint] Notice Board realtime update:', _noticeNotes.length, 'notes');
          if (typeof buildNoticeBoardPins === 'function') buildNoticeBoardPins();
        },
        err => console.error('[Checkpoint] Notice Board listener error —', err.message)
      );

    console.log('[Checkpoint] Firestore listeners attached');
  } catch (err) {
    _firebaseReady = false;
    console.error('[Checkpoint] Firebase init error —', err.message);
    throw err;
  }
}

/** Upload image file to Cloudinary (unsigned preset). Returns secure_url. */
async function uploadImageToCloudinary(file) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured — paste cloud name and upload preset in js/firebase-config.js');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  console.log('[Checkpoint] Campus Camera: upload started →', endpoint);

  const res = await fetch(endpoint, { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error?.message || `Cloudinary upload failed (${res.status})`;
    console.error('[Checkpoint] Campus Camera: upload error —', msg);
    throw new Error(msg);
  }

  if (!data.secure_url) {
    const msg = 'Cloudinary did not return a secure_url';
    console.error('[Checkpoint] Campus Camera: upload error —', msg);
    throw new Error(msg);
  }

  console.log('[Checkpoint] Campus Camera: upload success —', data.secure_url);
  return data.secure_url;
}

/** Save campus photo metadata to Firestore. */
async function saveCampusCameraUpload(imageUrl, caption) {
  if (!_firebaseReady || !_firestore) {
    throw new Error('Firebase not ready — check js/firebase-config.js');
  }

  try {
    await _firestore.collection(CAMPUS_CAMERA_COLLECTION).add({
      imageUrl,
      caption: caption || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    console.log('[Checkpoint] Campus Camera: Firestore save success →', CAMPUS_CAMERA_COLLECTION, imageUrl);
  } catch (err) {
    console.error('[Checkpoint] Campus Camera: Firestore save error —', err.message);
    throw err;
  }
}

/** Save anonymous notice board note to Firestore. */
async function saveNoticeBoardNote(text) {
  if (!_firebaseReady || !_firestore) {
    throw new Error('Firebase not ready — check js/firebase-config.js');
  }

  await _firestore.collection(NOTICE_BOARD_COLLECTION).add({
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  console.log('[Checkpoint] Notice Board: Firestore save success →', NOTICE_BOARD_COLLECTION, text.slice(0, 40));
}

/** Validate image file type and size before upload. */
function validateCampusImageFile(file) {
  if (!file) return 'No file selected.';

  const typeOk = ALLOWED_IMAGE_TYPES.includes(file.type)
    || /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!typeOk) {
    return 'Please choose a JPG, PNG, or WebP image.';
  }

  if (file.size > CAMPUS_PHOTO_MAX_BYTES) {
    return 'Image must be 5 MB or smaller.';
  }

  return null;
}
