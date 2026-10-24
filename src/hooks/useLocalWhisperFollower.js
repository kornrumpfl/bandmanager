import { useState, useEffect, useRef, useCallback } from "react";
import { matchTranscriptToBlocks } from "../utils/lyricsMatcher";

export const useLocalWhisperFollower = ({
  stream = null,
  blocks = [],
  currentBlockId = null,
  selectedSong = null,
  onBlockSelect,
  onWordsMatched,
  language = "pt", // "pt", "de", "en", "auto"
  serverUrl = "http://127.0.0.1:5001",
  minConfidence = 0.35,
}) => {
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastMatch, setLastMatch] = useState(null);
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const currentBlockIdRef = useRef(currentBlockId);
  const blocksRef = useRef(blocks);
  const lastSwitchTimeRef = useRef(0);

  useEffect(() => {
    currentBlockIdRef.current = currentBlockId;
  }, [currentBlockId]);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Check health of local Whisper server
  const checkServerHealth = useCallback(async () => {
    try {
      const res = await fetch(`${serverUrl}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        await res.json();
        setIsServerOnline(true);
        setErrorMessage("");
        return true;
      }
    } catch (err) {
      setIsServerOnline(false);
    }
    return false;
  }, [serverUrl]);

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 5000);
    return () => clearInterval(interval);
  }, [checkServerHealth]);

  // Extract song lyrics text to use as vocabulary prompt (keyword list + current block context)
  const getSongLyricsPrompt = useCallback(() => {
    if (!selectedSong) return "";

    // 1. Current block text for localized context
    let currentBlockText = "";
    if (currentBlockIdRef.current && blocksRef.current) {
      const cur = blocksRef.current.find((b) => b.id === currentBlockIdRef.current);
      if (cur) {
        currentBlockText = [...(cur.pt || []), ...(cur.de || [])].join(". ");
      }
    }

    // 2. Extract key vocabulary terms (comma-separated list prevents sentence-looping)
    const allLyrics = `${selectedSong.lyricsPT || ""} ${selectedSong.lyricsDE || ""}`;
    const words = Array.from(
      new Set(
        allLyrics
          .split(/[\s,.:;!?"'()\n\r]+/)
          .map((w) => w.trim())
          .filter((w) => w.length > 3)
      )
    ).slice(0, 35);

    const vocabList = words.join(", ");
    if (currentBlockText) {
      return `${vocabList}. ${currentBlockText}`.slice(0, 300);
    }
    return vocabList.slice(0, 300);
  }, [selectedSong]);

  // Process a text transcript and match to slide blocks
  const processTranscript = useCallback(
    (transcriptText) => {
      const trimmed = (transcriptText || "").trim();
      if (!trimmed) return;

      setLastTranscript(trimmed);

      const targetLang = language.startsWith("de") ? "de" : language.startsWith("pt") ? "pt" : "auto";
      const match = matchTranscriptToBlocks(trimmed, blocksRef.current, {
        currentBlockId: currentBlockIdRef.current,
        targetLanguage: targetLang,
        minConfidence,
      });

      if (match) {
        setLastMatch(match);
        const tokens = match.matchedTokens || [];
        setHighlightedWords(tokens);

        if (onWordsMatched) {
          onWordsMatched(tokens, match.block);
        }

        const now = Date.now();
        if (
          match.block.id !== currentBlockIdRef.current &&
          now - lastSwitchTimeRef.current > 1000
        ) {
          lastSwitchTimeRef.current = now;
          if (onBlockSelect) {
            onBlockSelect(match.block, tokens);
          }
        }
      }
    },
    [language, minConfidence, onBlockSelect, onWordsMatched]
  );

  // Send an audio blob to local Whisper server
  const sendAudioChunk = useCallback(
    async (blob) => {
      if (isProcessingRef.current || !blob || blob.size < 2000) return;
      isProcessingRef.current = true;
      setIsTranscribing(true);

      try {
        const formData = new FormData();
        formData.append("file", blob, "chunk.webm");
        formData.append("prompt", getSongLyricsPrompt());
        
        let whisperLang = "auto";
        if (language.startsWith("pt")) whisperLang = "pt";
        else if (language.startsWith("de")) whisperLang = "de";
        else if (language.startsWith("en")) whisperLang = "en";
        
        formData.append("language", whisperLang);

        const response = await fetch(`${serverUrl}/transcribe`, {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(6000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.transcript) {
            processTranscript(data.transcript);
          }
          setErrorMessage("");
        } else {
          setErrorMessage(`Local Whisper server returned status ${response.status}`);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Local Whisper transcription failed:", err);
          setErrorMessage(`Transcription failed: ${err.message}`);
        }
      } finally {
        isProcessingRef.current = false;
        setIsTranscribing(false);
      }
    },
    [getSongLyricsPrompt, language, processTranscript, serverUrl]
  );

  const startRecordingWithStream = useCallback(
    (activeStream) => {
      if (!activeStream) return;
      setErrorMessage("");

      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
      }

      const recordNextSlice = () => {
        if (!isListeningRef.current || !activeStream.active) return;

        let recorder;
        try {
          recorder = new MediaRecorder(activeStream, { mimeType });
        } catch (err) {
          console.error("Failed to create MediaRecorder:", err);
          setErrorMessage(`Could not start audio recorder: ${err.message}`);
          setIsListening(false);
          isListeningRef.current = false;
          return;
        }

        mediaRecorderRef.current = recorder;
        let sliceChunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            sliceChunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          if (sliceChunks.length > 0) {
            const combinedBlob = new Blob(sliceChunks, { type: mimeType });
            sendAudioChunk(combinedBlob);
          }
          // Cleanly trigger the next slice with a fresh recorder instance and valid headers
          if (isListeningRef.current && activeStream.active) {
            recordNextSlice();
          }
        };

        try {
          recorder.start();
          setTimeout(() => {
            if (isListeningRef.current && recorder.state === "recording") {
              recorder.stop();
            }
          }, 2000); // 2.0s rolling window
        } catch (e) {
          console.warn("MediaRecorder start error:", e);
        }
      };

      recordNextSlice();
    },
    [sendAudioChunk]
  );

  const startListening = useCallback(
    (directStream) => {
      const targetStream = directStream || stream;
      isListeningRef.current = true;
      setIsListening(true);
      setErrorMessage("");

      if (targetStream) {
        startRecordingWithStream(targetStream);
      } else {
        setErrorMessage("Waiting for audio capture device...");
      }
    },
    [startRecordingWithStream, stream]
  );

  useEffect(() => {
    if (isListeningRef.current && stream && (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive")) {
      startRecordingWithStream(stream);
    }
  }, [stream, startRecordingWithStream]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setIsTranscribing(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    setLastTranscript("");
    setLastMatch(null);
    setHighlightedWords([]);
  }, []);

  const toggleAutoFollow = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount or stream change
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isServerOnline,
    isListening,
    isTranscribing,
    lastTranscript,
    lastMatch,
    highlightedWords,
    errorMessage,
    checkServerHealth,
    processText: processTranscript,
    toggleAutoFollow,
    startListening,
    stopListening,
  };
};
