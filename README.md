# 🎸 Band Management & Live Church Lyrics & Bible Presentation

> **Version: 6.4.0**  
> A comprehensive React application for church worship teams, pastors, and media operators to manage events, songs, bilingual lyrics (Portuguese & German), and multi-version Scripture projection with **real-time AI-powered live lyric tracking and auto-advancing projection**.

---

## 🌟 What's New in v6.4.0

### 📖 Holyrics-Style Multi-Translation Scripture Projection (`/bible`)
- **66-Book Visual Grid**: Clean, color-coded grid organized by biblical genres (Law, History, Poetry, Major/Minor Prophets, Gospels, Epistles, Prophecy).
- **Simultaneous Multi-Translation Projection**: Project up to **3 Bible translations at the same time** (Slot 1, Slot 2, Slot 3) stacked cleanly on the congregation screen.
- **Custom Per-Translation Text Colors**: Clickable color pickers for each translation slot (`slot1Color`, `slot2Color`, `slot3Color`) with instant preview and `localStorage` persistence.
- **Preloaded Offline Bibles**:
  - Portuguese: *Nova Almeida Atualizada (NAA)* & *Almeida Corrigida Fiel (ACF)*
  - German: *Schlachter 2000 (SCH2000)*
  - Spanish: *Nueva Versión Internacional (NVI)*
- **Custom Bible JSON Importer**: Upload and store any custom Bible version in the browser's IndexedDB via `BibleStorageService`.
- **Slide Preview & Integrated Font Size Slider**: Positioned directly beneath the scripture preview window for effortless on-the-fly sizing adjustments.
- **High-Contrast Active Verse**: Clicked/projected verses light up in vibrant yellow (`#facc15` / `#fef08a`) for maximum operator visibility.

### 🎛️ Projection Tab Enhancements
- **Persistent Selection Across Tabs**: Seamlessly switch between the **Projection** and **Bible** tabs without losing your selected event or song.
- **On-the-Fly Song Search & Add (`+ Add Song`)**: Search the full song database and immediately attach songs to the active service setlist directly from the Projection desk with auto-saving to Cloud Firestore.
- **Fixed Lower Control Bar**: Sleek, sticky bottom control bar containing:
  - Start / Stop projection buttons.
  - **Blackout Screen Button (`Black Screen [B]`)**: Instantly blank the projector screen with a click or pressing the `B` keyboard shortcut without tearing down the projection session.
  - Slide navigation controls (`< Prev`, `Next >`, `Clear`).
  - Real-time Font Size slider and live projector status indicator.
- **Complete Dark Theme**: Modern dark styling (`#0a0e17` / `#111827` / `#1e293b`) across the entire workspace, with active slide text in high-visibility bright yellow.

### 📅 Event History & Reusable Setlists
- **Date Editing**: Change and update event dates directly from Event History (`/event/:id`).
- **Reuse Setlists in New Dates**: Clone an entire song list from a past service into a new date with a single click (`/event/new?cloneFrom=:id`).

### 🤖 Robust Offline AI Whisper Server
- **One-Click Auto-Healing Launcher**: `start_whisper.bat` automatically checks Python dependencies, detecting and auto-installing missing packages (`av` / PyAV, `faster-whisper`, `fastapi`, `uvicorn`) before launching.

---

## 🚀 Key Feature Overview

### 1. 🎤 Live Lyric Follow & Auto-Advancing Projection
- **Automatic Song Part Recognition**: Listens to the live vocal microphone or soundboard feed and tracks what verse, chorus, or bridge is being sung in real time.
- **Auto-Advance Lyrics Box**: Automatically switches projector slides forward as the band moves through the song without requiring manual clicks.
- **Karaoke-Style Word Glow**: Highlights the specific sung words in real time with glowing cyan (Portuguese) and bright white (German) text.
- **Dual Screen Architecture**: 
  - Operator view with live VU volume meter, slide preview, manual override clicks, and speech diagnostics.
  - Congregation `/projector` window synced via low-latency `BroadcastChannel` with zero UI distraction.
- **Smart Lyric Matcher (`lyricsMatcher.js`)**: Diacritic-insensitive (`amanhã` ↔ `amanha`, `über` ↔ `uber`), fuzzy Levenshtein distance, sliding recency window, and contextual anticipation bias (favors current or next block).
- **Manual Override Always Active**: The operator can click any slide block at any moment to immediately update projection.

### 2. 🤖 100% Local Offline AI Tracking (Whisper)
- **Zero Cloud Costs / Zero Data Leakage**: Powered by `faster-whisper` running directly on your machine or on another PC on your church's local network (LAN).
- **Direct Soundcard Ingestion**: Slices audio directly from whichever USB audio interface or mixer you select in the app (bypasses Windows default recording device restrictions).
- **Dynamic Vocabulary Keyword Prompting**: Injects active song lyrics and distinctive terms as vocabulary hints to overcome singing distortion, music bleed, and prolonged vowels.
- **Anti-Looping & Hallucination Suppression**: Built with `condition_on_previous_text=False`, `repetition_penalty=1.2`, `no_repeat_ngram_size=3`, and Voice Activity Detection (`vad_filter=True`) to eliminate phrase-sticking.
- **Network / Mac Mini M4 Support**: Run the AI server on a sound booth Mac Mini M4 (or GPU desktop) while operating projection from a lightweight laptop over Wi-Fi or Ethernet (1–3ms LAN latency).

### 3. 📅 Band Management & Event Planning
- **Event Scheduling**: Interactive calendar and timeline for upcoming church services, rehearsals, and performances.
- **Song Repository**: Store and organize songs with bilingual lyrics (Portuguese `lyricsPT` and German `lyricsDE`), singer keys, YouTube links, and chord sheet links (Cifras).
- **Authentication**: Secure Firebase Authentication supporting Email/Password and Google Sign-In.
- **Real-Time Database**: Powered by Cloud Firestore for instant synchronization across devices.

---

## 🗂️ Project Structure

```
bandmanager/
├── start_whisper.bat                     # Windows root launcher (auto-installs dependencies)
├── server/                               # Offline AI Whisper Backend
│   ├── whisper_server.py                 # FastAPI server (faster-whisper + PyAV patch)
│   ├── requirements.txt                  # Python dependencies
│   └── start_whisper.bat                 # Server directory start script
│
├── public/
│   ├── bibles/                           # Preloaded JSON Bible translations
│   │   ├── pt_naa.json                   # Portuguese Nova Almeida Atualizada
│   │   ├── pt_acf.json                   # Portuguese Almeida Corrigida Fiel
│   │   ├── de_sch2000.json               # German Schlachter 2000
│   │   └── es_nvi.json                   # Spanish Nueva Versión Internacional
│   └── index.html
│
├── src/
│   ├── components/
│   │   ├── Projection.js                 # Song projection operator desk (audio, controls, quick add)
│   │   ├── Projection.css                # Dark theme & fixed bottom bar styling
│   │   ├── BibleProjection.js            # Scripture projection desk (66 books, 3 translation slots)
│   │   ├── BibleProjection.css           # Bible grid, slot color pickers, and preview styling
│   │   ├── ProjectorWindow.js            # Clean congregation display screen (/projector)
│   │   ├── ProjectorWindow.css           # High-visibility full-screen & multi-slot styling
│   │   ├── Dashboard.js                  # Event calendar and upcoming services
│   │   ├── Song.js                       # Song management and search
│   │   ├── SongDetails.js                # Song editor form (bilingual lyrics, singer, links)
│   │   ├── EventEditor.js                # Event creation & song assignment
│   │   ├── EventHistory.js               # Past event archives & setlist reuse
│   │   ├── SideNavBar.js                 # App navigation
│   │   ├── Login.js                      # Authentication
│   │   └── PrivateRoute.js               # Route guards
│   │
│   ├── hooks/
│   │   ├── useAudioInput.js              # USB device selector & real-time AudioContext VU meter
│   │   ├── useLocalWhisperFollower.js    # 2.0s rolling audio slicer & Whisper HTTP communicator
│   │   └── useLiveLyricFollower.js       # Browser Web Speech API fallback
│   │
│   ├── utils/
│   │   ├── lyricsMatcher.js              # Fuzzy Levenshtein token matcher & highlight generator
│   │   └── projectionUtils.js            # Lyric block grouping & parser
│   │
│   ├── services/
│   │   ├── firebaseConfig.js             # Firebase initialization
│   │   ├── EventService.js               # Firestore event CRUD
│   │   ├── SongService.js                # Firestore song CRUD
│   │   └── BibleStorageService.js        # IndexedDB custom Bible storage service
│   │
│   ├── App.js                            # App router, theme provider & v6.4.0 footer
│   └── index.js                          # React entry point
│
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or newer
- **Python**: v3.10 to v3.13 (for local Whisper AI server)

---

### 2. Running the Web Application
```bash
# Install frontend dependencies
npm install

# Start the React development server
npm start
```
The app will open automatically at [http://localhost:3000](http://localhost:3000).

---

### 3. Running the Local Whisper AI Server

#### Option A: One-Click Launcher (Windows)
Double-click `start_whisper.bat` in the project root. It will check for Python, auto-install missing packages (`av`, `faster-whisper`, `fastapi`, `uvicorn`), and launch the server at `http://127.0.0.1:5001`.

#### Option B: Manual Launch
1. Install Python dependencies:
   ```bash
   pip install -r server/requirements.txt
   ```
2. Start the server:
   ```bash
   npm run whisper
   ```
   *(Or run `python server/whisper_server.py tiny`)*.

#### Option C: Running on Another Computer in your Church Network (e.g. Mac Mini M4 / Desktop with GPU)
1. Copy the `server/` folder to that computer.
2. Install dependencies:
   ```bash
   pip install -r server/requirements.txt
   ```
3. Start the server (listening on all LAN interfaces `0.0.0.0:5001`):
   ```bash
   python server/whisper_server.py base
   ```
   *(On Apple Silicon M4, `base` or `small` runs in ~60–100ms with near-zero hallucinations)*.
4. In your presentation laptop's **Projection** tab:
   - Click **Change IP / Network**.
   - Enter the IP of that computer: `http://192.168.1.50:5001`.
   - Click **Apply**. The green badge will switch to **`● Whisper Online`**.

---

## 🎛️ How Live Lyric Tracking Works

```
[ Soundboard / USB Interface ]
          │ (Selected in dropdown)
          ▼
[ Browser getUserMedia ] ──► [ AudioContext VU Meter (0–100%) ]
          │ (2.0s standalone WebM chunks)
          ▼
[ Whisper AI Server ] ◄── Dynamic song vocabulary hints
  http://127.0.0.1:5001 (or LAN IP)
          │ (Fast transcription in ~100ms)
          ▼
[ lyricsMatcher Fuzzy Engine ] ──► Word-level glowing spans
          │
          ├──► Operator Slide Preview (Auto-scrolled)
          │
          ▼ (BroadcastChannel: projection_sync)
[ Fullscreen /projector Window ] (Congregation screen)
```

1. **Select an Event & Song**: Choose the song from the list or use `+ Add Song` to search and add one on the fly.
2. **Select Sound Device**: Choose your soundboard USB interface or microphone from the **Sound Capture Device** dropdown.
3. **Verify Audio Level**: Sing or speak into the microphone — the green VU meter will bounce with volume.
4. **Choose Tracking Engine**:
   - **`🤖 Local AI (Whisper Offline)`** *(Recommended)*: Uses local AI, directly routes from chosen soundcard, offline, immune to Windows default mic restrictions.
   - **`🌐 Browser Web Speech API`**: Chrome built-in speech engine (requires Windows default microphone alignment).
5. **Configurable Tracking Toggles**:
   - **Auto-Advance Slide (1st Phrase)**: Automatically advances the slide when the first phrase of the next section is sung.
   - **Highlight Current Phrase**: Highlights the phrase currently being sung in glowing colors.
6. **Launch Projector Screen**: Click **Start** in the fixed lower bar to open `/projector` and position it on the congregation display. Use `Black Screen [B]` anytime to instantly black out the display.

---

## 📖 How Scripture Projection Works

1. Open the **Bible** tab from the top navigation.
2. Choose up to **3 Bible Translations** in Slots 1, 2, and 3.
3. Click the circular color pickers on each slot indicator to assign custom colors (e.g. Yellow for Portuguese, White for German).
4. Select a book from the **66-Book Grid**, pick the chapter, and choose the verse(s).
5. Adjust the font size with the slider directly under the slide pre-visualization window.
6. Click **Project Verse** (or click any verse directly) to display it immediately on the `/projector` screen.

---

## 🛠️ Model Sizes & Hardware Guidelines

| Model Size | Parameters | Disk / VRAM | Latency (CPU) | Latency (M4 / GPU) | Recommended For |
|:---|:---:|:---:|:---:|:---:|:---|
| **`tiny`** | 39M | ~75 MB | ~150–200ms | ~30ms | Older dual-core laptops (fastest start) |
| **`base`** | 74M | ~145 MB | ~250–350ms | ~60ms | **Sweet spot** for live singing accuracy |
| **`small`** | 244M | ~460 MB | ~600–900ms | ~110ms | Mac Mini M4 or desktops with NVIDIA GPU |

Command examples:
```bash
# Auto-detects hardware (CUDA on NVIDIA, Apple Accelerate on Mac, CPU on PC)
python server/whisper_server.py tiny       # Instant start, lowest resource usage
python server/whisper_server.py base       # Optimal balance of speed & singing accuracy
python server/whisper_server.py small      # High acoustic separation (ideal for M4 / GPU)

# Explicitly force GPU (NVIDIA CUDA) or CPU:
python server/whisper_server.py small cuda # Force NVIDIA CUDA (float16)
python server/whisper_server.py base cpu   # Force CPU (int8)
```

> **For NVIDIA GPU Acceleration (Windows/Linux):**
> ```bash
> pip install nvidia-cublas-cu12 nvidia-cudnn-cu12
> ```

---

## 🔧 Technologies Used

- **Frontend**: React 19, PrimeReact UI, PrimeFlex, PrimeIcons.
- **Audio & Media**: Web Audio API (`AudioContext`, `AnalyserNode`), `MediaRecorder` API, Screen Details API (`window.getScreenDetails`).
- **Inter-Window Sync**: `BroadcastChannel` API (`projection_sync`).
- **Backend / Database**: Google Firebase (Authentication & Cloud Firestore).
- **Offline Storage**: IndexedDB (custom Bible uploads via `BibleStorageService`).
- **AI Speech Recognition**: `faster-whisper` (CTranslate2 INT8 engine), FastAPI, Uvicorn, PyAV.

---

## 📄 License
Private project developed for church worship presentation and band management. All rights reserved.
