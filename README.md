# 🎸 Band Management & Live Church Lyrics Presentation

A modern React web application for church worship teams and bands to manage events, songs, and bilingual lyrics (Portuguese & German) with **real-time AI-powered live lyric tracking and auto-advancing projection**.

---

## 🌟 Key Features

### 🎤 Live Lyric Follow & Auto-Advancing Projection
- **Automatic Song Part Recognition**: Listens to the live vocal microphone or soundboard feed and tracks what verse, chorus, or bridge is being sung in real time.
- **Auto-Advance Lyrics Box**: Automatically switches projector slides forward as the band moves through the song without requiring manual clicks.
- **Karaoke-Style Word Glow**: Highlights the specific sung words in real time with glowing cyan (Portuguese) and bright white (German) text.
- **Dual Screen Architecture**: 
  - Operator view with live VU volume meter, slide preview, manual override clicks, and speech diagnostics.
  - Congregation `/projector` window synced via low-latency `BroadcastChannel` with zero UI distraction.
- **Smart Lyric Matcher (`lyricsMatcher.js`)**: Diacritic-insensitive (`amanhã` ↔ `amanha`, `über` ↔ `uber`), fuzzy Levenshtein distance, sliding recency window, and contextual anticipation bias (favors current or next block).
- **Manual Override Always Active**: The operator can click any slide block at any moment to immediately update projection.

---

### 🤖 100% Local Offline AI Tracking (Whisper)
- **Zero Cloud Costs / Zero Data Leakage**: Powered by `faster-whisper` running directly on your machine or on another PC on your church's local network (LAN).
- **Direct Soundcard Ingestion**: Slices audio directly from whichever USB audio interface or mixer you select in the app (bypasses Windows default recording device restrictions).
- **Dynamic Vocabulary Keyword Prompting**: Injects active song lyrics and distinctive terms as vocabulary hints to overcome singing distortion, music bleed, and prolonged vowels.
- **Anti-Looping & Hallucination Suppression**: Built with `condition_on_previous_text=False`, `repetition_penalty=1.2`, `no_repeat_ngram_size=3`, and Voice Activity Detection (`vad_filter=True`) to eliminate phrase-sticking.
- **Network / Mac Mini M4 Support**: Run the AI server on a sound booth Mac Mini M4 (or GPU desktop) while operating projection from a lightweight laptop over Wi-Fi or Ethernet (1–3ms LAN latency).

---

### 📅 Band Management & Event Planning
- **Event Scheduling**: Interactive calendar and timeline for upcoming church services, rehearsals, and performances.
- **Song Repository**: Store and organize songs with bilingual lyrics (Portuguese `lyricsPT` and German `lyricsDE`), singer keys, YouTube links, and chord sheet links (Cifras).
- **Authentication**: Secure Firebase Authentication supporting Email/Password and Google Sign-In.
- **Real-Time Database**: Powered by Cloud Firestore for instant synchronization across devices.

---

## 🗂️ Project Structure

```
bandmanager/
├── server/                               # Offline AI Whisper Backend
│   ├── whisper_server.py                 # FastAPI server (faster-whisper + PyAV patch)
│   ├── requirements.txt                  # Python dependencies
│   └── start_whisper.bat                 # Windows one-click start script
│
├── src/
│   ├── components/
│   │   ├── Projection.js                 # Operator control desk (sound card, VU meter, engine switcher)
│   │   ├── Projection.css                # Operator styling
│   │   ├── ProjectorWindow.js            # Clean congregation display screen (/projector)
│   │   ├── ProjectorWindow.css           # Fullscreen glow styling
│   │   ├── Dashboard.js                  # Event calendar and upcoming services
│   │   ├── Song.js                       # Song management and search
│   │   ├── SongDetails.js                # Song editor form (bilingual lyrics, singer, links)
│   │   ├── EventEditor.js                # Event creation & song assignment
│   │   ├── EventHistory.js               # Past event archives
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
│   │   └── SongService.js                # Firestore song CRUD
│   │
│   ├── App.js                            # App router and theme provider
│   └── index.js                          # React entry point
│
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or newer
- **Python**: v3.10 to v3.13 (for the local Whisper AI server)

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

#### Option A: Running on the Same Computer (Windows / Mac)
1. Install Python dependencies:
   ```bash
   pip install -r server/requirements.txt
   ```
2. Start the server:
   ```bash
   npm run whisper
   ```
   *(Or run `python server/whisper_server.py tiny`)*.

#### Option B: Running on Another Computer in your Church Network (e.g. Mac Mini M4 / Desktop with GPU)
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

1. **Select an Event & Song**: Choose the song from the list.
2. **Select Sound Device**: Choose your soundboard USB interface or microphone from the **Sound Capture Device** dropdown.
3. **Verify Audio Level**: Sing or speak into the microphone — the green VU meter will bounce with volume.
4. **Choose Tracking Engine**:
   - **`🤖 Local AI (Whisper Offline)`** *(Recommended)*: Uses local AI, directly routes from chosen soundcard, offline, immune to Windows default mic restrictions.
   - **`🌐 Browser Web Speech API`**: Chrome built-in speech engine (requires Windows default microphone alignment).
5. **Two Independent Tracking Systems (Separately Configurable)**:
   - **Auto-Advance Slide (1st Phrase)**: When enabled, detects when the band sings the first phrase of a slide (matching the first 2 words in top-to-bottom sequence, slide repeats, or jumps back) and advances the slide.
   - **Highlight Current Phrase**: When enabled, highlights the specific phrase/line being sung within the active slide on screen (glowing active line, subtly dimming pending lines). Can be used independently even if auto-advance is disabled!
6. **Click "Start Auto-Follow"**: The system actively listens and tracks the song.
7. **Launch Projector Screen**: Click **Start** under projection controls to open the `/projector` window and drag it to your church's external display screen.

---

## 🛠️ Model Sizes & Hardware Guidelines

You can specify the model directly when launching `whisper_server.py`:

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
> If your GPU computer runs Windows/Linux with an NVIDIA card, install the CUDA runtime libraries:
> ```bash
> pip install nvidia-cublas-cu12 nvidia-cudnn-cu12
> ```
> The server will automatically detect your GPU, run in `float16`, and auto-fallback to CPU if CUDA is ever unavailable.

---

## 🔧 Technologies Used

- **Frontend**: React 19, PrimeReact UI, PrimeFlex, PrimeIcons.
- **Audio & Media**: Web Audio API (`AudioContext`, `AnalyserNode`), `MediaRecorder` API, Screen Details API (`window.getScreenDetails`).
- **Inter-Window Sync**: `BroadcastChannel` API (`projection_sync`).
- **Backend / Database**: Google Firebase (Authentication & Cloud Firestore).
- **AI Speech Recognition**: `faster-whisper` (CTranslate2 INT8 engine), FastAPI, Uvicorn, PyAV.

---

## 📄 License
Private project developed for church worship presentation and band management. All rights reserved.
