import os
import sys
import tempfile

# Pre-flight check for dependencies with clear, friendly instructions
try:
    import av
    import faster_whisper.audio
    from fastapi import FastAPI, UploadFile, File, Form
    from fastapi.middleware.cors import CORSMiddleware
    import ctranslate2
    from faster_whisper import WhisperModel
    import uvicorn
except ModuleNotFoundError as e:
    pkg = getattr(e, 'name', str(e))
    print("\n" + "=" * 65)
    print(f"  [ERROR] Missing required Python package: '{pkg}'")
    print("=" * 65)
    print("  To fix this on this computer, run:")
    print("\n      python -m pip install -r server/requirements.txt")
    print("\n  Or install the dependencies directly:")
    print("      python -m pip install \"av<18\" faster-whisper fastapi uvicorn python-multipart ctranslate2")
    print("=" * 65 + "\n")
    sys.exit(1)

# Fix breaking change in PyAV 18/19+ where 'metadata_errors' parameter was removed
_orig_av_open = av.open
def _compat_av_open(*args, **kwargs):
    kwargs.pop("metadata_errors", None)
    return _orig_av_open(*args, **kwargs)

av.open = _compat_av_open
faster_whisper.audio.av.open = _compat_av_open

app = FastAPI(title="BandManager Local Whisper Server")

# Allow CORS for any origin on local network
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prevent macOS OpenMP / Accelerate thread deadlocks
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Parse CLI arguments for model and device:
# e.g.: python server/whisper_server.py [tiny|base|small] [cuda|cpu]
cli_model = None
cli_device = None

for arg in sys.argv[1:]:
    lower = arg.lower()
    if lower in ("cuda", "cpu", "auto"):
        cli_device = lower
    elif not arg.startswith("-") and not arg.isdigit():
        cli_model = arg

target_device = cli_device or os.environ.get("WHISPER_DEVICE")

if target_device:
    DEVICE = "cpu" if target_device == "cpu" else "cuda"
    COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE", "float16" if DEVICE == "cuda" else "int8")
else:
    try:
        has_cuda = ctranslate2.get_cuda_device_count() > 0
    except Exception:
        has_cuda = False
    DEVICE = "cuda" if has_cuda else "cpu"
    COMPUTE_TYPE = "float16" if has_cuda else "int8"

MODEL_SIZE = cli_model or os.environ.get("WHISPER_MODEL", "tiny")
CPU_THREADS = int(os.environ.get("CPU_THREADS", "4"))

print(f"\n=======================================================")
print(f"  BandManager Whisper AI Server")
print(f"  Model:   {MODEL_SIZE}")
print(f"  Device:  {DEVICE.upper()} ({COMPUTE_TYPE})")
print(f"  Threads: {CPU_THREADS}")
print(f"=======================================================\n")

print(f"[1/2] Checking/downloading model weights for '{MODEL_SIZE}'...")
try:
    from faster_whisper import download_model
    model_path = download_model(MODEL_SIZE)
    print(f"      Model weights ready at: {model_path}")
except Exception as e:
    print(f"      Note: {e}")
    model_path = MODEL_SIZE

print(f"[2/2] Loading '{MODEL_SIZE}' into memory...")
try:
    if DEVICE == "cuda":
        model = WhisperModel(model_path, device="cuda", compute_type=COMPUTE_TYPE)
    else:
        model = WhisperModel(model_path, device="cpu", compute_type=COMPUTE_TYPE, cpu_threads=CPU_THREADS)
except Exception as err:
    if DEVICE == "cuda":
        print(f"      [!] CUDA GPU initialization failed: {err}")
        print(f"      [!] Falling back automatically to CPU (int8)...")
        DEVICE = "cpu"
        COMPUTE_TYPE = "int8"
        model = WhisperModel(model_path, device="cpu", compute_type="int8", cpu_threads=CPU_THREADS)
    else:
        raise err

print(f"===> Model '{MODEL_SIZE}' loaded and ready on {DEVICE.upper()} ({COMPUTE_TYPE})!\n")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_SIZE,
        "device": DEVICE,
        "compute_type": COMPUTE_TYPE
    }

@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    initial_prompt: str = Form(default=""),
    language: str = Form(default=None),
):
    """
    Receives an audio chunk (WebM/WAV) from useLocalWhisperFollower,
    runs local Whisper inference, and returns recognized phrases with timestamps.
    """
    try:
        suffix = os.path.splitext(file.filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Transcribe with singing optimizations:
            # - beam_size=1 or 2 for instant sub-second response
            # - condition_on_previous_text=False prevents hallucination feedback loops
            # - vad_filter=True removes background crowd/band noise
            segments, info = model.transcribe(
                tmp_path,
                language=language if language and language != "auto" else None,
                initial_prompt=initial_prompt if initial_prompt else None,
                beam_size=1,
                best_of=1,
                temperature=0.0,
                condition_on_previous_text=False,
                vad_filter=True,
                vad_parameters=dict(
                    min_silence_duration_ms=250,
                    speech_pad_ms=200
                ),
            )

            results = []
            full_text_parts = []
            for segment in segments:
                text = segment.text.strip()
                if text:
                    full_text_parts.append(text)
                    results.append({
                        "id": segment.id,
                        "start": segment.start,
                        "end": segment.end,
                        "text": text,
                        "confidence": getattr(segment, "avg_logprob", 0.0),
                    })

            full_text = " ".join(full_text_parts)
            return {
                "text": full_text,
                "language": info.language,
                "segments": results,
            }
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "text": "", "segments": []}

if __name__ == "__main__":
    # Host on 0.0.0.0 so other PCs / laptops on church network can connect
    PORT = int(os.environ.get("WHISPER_PORT", "5001"))
    print(f"===> Server listening on http://0.0.0.0:{PORT}")
    print(f"===> In BandManager settings, enter: http://<THIS-PC-IP>:{PORT}\n")
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")
