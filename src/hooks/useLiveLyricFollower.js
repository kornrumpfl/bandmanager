import { useState, useEffect, useRef, useCallback } from "react";
import { matchTranscriptToLyrics } from "../utils/lyricsMatcher";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const useLiveLyricFollower = ({
  blocks = [],
  currentBlockId = null,
  onBlockSelect,
  onPhraseSelect,
  onWordsMatched,
  language = "pt-BR",
  minConfidence = 0.35,
}) => {
  const [isSupported] = useState(Boolean(SpeechRecognition));
  const [isEnabled, setIsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [engineStatus, setEngineStatus] = useState("idle"); // "idle", "listening", "reconnecting", "error"
  const [lastError, setLastError] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastMatch, setLastMatch] = useState(null);
  const [activePhraseIndex, setActivePhraseIndex] = useState(null);
  const [activePhraseText, setActivePhraseText] = useState("");
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef(null);
  const isEnabledRef = useRef(false);
  const lastSwitchTimeRef = useRef(0);
  const currentBlockIdRef = useRef(currentBlockId);
  const blocksRef = useRef(blocks);

  useEffect(() => {
    currentBlockIdRef.current = currentBlockId;
  }, [currentBlockId]);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  // Map recognition language to block language filter
  const getTargetLang = useCallback((langCode) => {
    if (langCode.startsWith("pt")) return "pt";
    if (langCode.startsWith("de")) return "de";
    return "auto";
  }, []);

  const processText = useCallback(
    (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed) return;

      setLastTranscript(trimmed);

      const targetLang = getTargetLang(language);
      const match = matchTranscriptToLyrics(trimmed, blocksRef.current, {
        currentBlockId: currentBlockIdRef.current,
        targetLanguage: targetLang,
        minConfidence,
      });

      if (match) {
        setLastMatch(match);

        if (match.phraseIndex !== undefined && match.phraseIndex !== null) {
          setActivePhraseIndex(match.phraseIndex);
          setActivePhraseText(match.matchedPhrase || "");
          if (onPhraseSelect) {
            onPhraseSelect(match.phraseIndex, match.matchedPhrase);
          }
        }

        if (match.block) {
          const now = Date.now();
          if (
            match.block.id !== currentBlockIdRef.current ||
            now - lastSwitchTimeRef.current > 1500
          ) {
            lastSwitchTimeRef.current = now;
            if (onBlockSelect) {
              onBlockSelect(match.block, match.phraseIndex ?? 0);
            }
          }
        }
      }
    },
    [getTargetLang, language, minConfidence, onBlockSelect, onPhraseSelect]
  );

  const handleResult = useCallback(
    (event) => {
      let combinedTranscript = "";
      // Grab recent results to have full phrase context for singing
      const startIdx = Math.max(0, event.results.length - 3);
      for (let i = startIdx; i < event.results.length; i++) {
        combinedTranscript += event.results[i][0].transcript + " ";
      }
      processText(combinedTranscript);
    },
    [processText]
  );

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setErrorMessage("Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      setEngineStatus("error");
      return;
    }

    setErrorMessage("");
    setLastError("");

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setEngineStatus("listening");
        setErrorMessage("");
      };

      recognition.onresult = handleResult;

      recognition.onerror = (event) => {
        setLastError(event.error);
        // 'no-speech' is normal when band is playing instrumental or quiet
        if (event.error === "no-speech") return;
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone access blocked in Chrome. Please check Chrome site permissions.");
          setIsEnabled(false);
          setIsListening(false);
          setEngineStatus("error");
        } else if (event.error === "audio-capture") {
          setErrorMessage("Audio capture error: Selected sound device may be busy or not set as Windows default recording device.");
          setIsEnabled(false);
          setIsListening(false);
          setEngineStatus("error");
        } else if (event.error === "network") {
          setErrorMessage("Network error: Chrome speech recognition requires an internet connection to Google Speech servers.");
          setEngineStatus("error");
        } else {
          setErrorMessage(`Speech recognition notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart if user still has auto-follow active
        if (isEnabledRef.current) {
          setEngineStatus("restarting");
          setTimeout(() => {
            if (isEnabledRef.current) {
              try {
                recognition.start();
              } catch (e) {
                // Ignore restart collision
              }
            }
          }, 200);
        } else {
          setEngineStatus("idle");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsEnabled(true);
      setEngineStatus("listening");
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setErrorMessage(err.message || "Could not start audio listener.");
      setIsEnabled(false);
      setEngineStatus("error");
    }
  }, [language, handleResult]);

  const stopListening = useCallback(() => {
    setIsEnabled(false);
    isEnabledRef.current = false;
    setIsListening(false);
    setEngineStatus("idle");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setLastTranscript("");
    setLastMatch(null);
    setActivePhraseIndex(null);
    setActivePhraseText("");
    setHighlightedWords([]);
  }, []);

  const toggleAutoFollow = useCallback(() => {
    if (isEnabled) {
      stopListening();
    } else {
      startListening();
    }
  }, [isEnabled, startListening, stopListening]);

  // Restart recognition if language changes while active
  useEffect(() => {
    if (isEnabled) {
      startListening();
    }
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isEnabled,
    isListening,
    engineStatus,
    lastError,
    lastTranscript,
    lastMatch,
    activePhraseIndex,
    activePhraseText,
    highlightedWords,
    errorMessage,
    processText,
    toggleAutoFollow,
    startListening,
    stopListening,
  };
};
