# H&M Campus

> **If images are missing after cloning:** run `start.bat` (Windows) or `bash start.sh` (Mac/Linux) instead of opening `index.html` directly. See **Running the project locally** below.

A cozy interactive campus world with a study lobby, notice board, campus camera, canvas room, and more.

---

## Running the project locally

**Do not open `index.html` by double-clicking it.** Browsers block images, fonts, and audio when a page is loaded directly from your file system (`file://`). You need to run a local server instead — it takes about 10 seconds.

---

### Windows

1. Download and unzip the project
2. Open the project folder
3. Double-click **`start.bat`**
4. A terminal window opens — wait a moment
5. Open your browser and go to **http://localhost:8000**

---

### Mac / Linux

1. Download and unzip the project
2. Open Terminal and `cd` into the project folder
3. Run: `bash start.sh`
4. Open your browser and go to **http://localhost:8000**

---

### Manual (if the scripts don't work)

Open a terminal, navigate to the project folder, and run one of:

```bash
# Python 3 (most common)
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx serve . -p 8000
```

Then open **http://localhost:8000** in your browser.

---

## Requirements

- Python 3 **or** Node.js installed — either one is enough
- A modern browser (Chrome, Firefox, Edge, Safari)
- Internet connection for the live Supabase drops/notice board

---

## What's inside

| Zone | What it does |
|------|-------------|
| 📚 Library | Study timer with music |
| ✏️ Leave a Drop | Share links, TikToks, Spotify |
| 📋 Notice Board | Read and post anonymous notes |
| 📷 Campus Camera | Upload photos to polaroid frames |
| 🎨 Canvas Room | Freehand drawing board |
