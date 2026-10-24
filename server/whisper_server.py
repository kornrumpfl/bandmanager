import os
import sys
import tempfile
import av
import faster_whisper.audio
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import ctranslate2
from faster_whisper import WhisperModel
import uvicorn

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
        "compute_type": COMPUTE_TYPE,
        "service": "local-whisper"
    }

@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    prompt: str = Form(""),
    language: str = Form("auto")
):
    suffix = os.path.splitext(file.filename or "")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        lang = None if language in ("", "auto") else language
        
        # Transcribe with vocabulary prompt for singing accuracy
        segments, info = model.transcribe(
            tmp_path,
            initial_prompt=prompt if prompt else None,
            language=lang,
            beam_size=1, # greedy for lowest latency
            best_of=1,
            condition_on_previous_text=False, # CRITICAL: stops Whisper from locking onto previous phrase
            repetition_penalty=1.2, # Penalize repeating words/phrases
            no_repeat_ngram_size=3, # Prevent repeating n-grams
            vad_filter=True, # filter non-vocal audio / noise
            vad_parameters=dict(min_silence_duration_ms=250, threshold=0.35),
            hallucination_silence_threshold=0.5 # suppress hallucinations in silence
        )

        transcript_parts = []
        for segment in segments:
            text = segment.text.strip()
            if text:
                transcript_parts.append(text)

        full_transcript = " ".join(transcript_parts).strip()
        return {
            "transcript": full_transcript,
            "language": info.language,
            "duration": round(info.duration, 2)
        }
    except Exception as e:
        print(f"Transcription error: {e}")
        return {"error": str(e), "transcript": ""}
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5001))
    print(f"\n==========================================")
    print(f"  BandManager Whisper AI Server")
    print(f"  Listening on all interfaces: http://0.0.0.0:{port}")
    print(f"  Local PC: http://127.0.0.1:{port}")
    print(f"  Network PCs: http://<this-computer-ip>:{port}")
    print(f"  Device: {DEVICE.upper()} ({COMPUTE_TYPE})")
    print(f"==========================================\n")
    uvicorn.run(app, host=host, port=port, log_level="warning")

