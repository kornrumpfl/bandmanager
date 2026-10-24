import { useState, useEffect, useRef, useCallback } from "react";

export const useAudioInput = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem("band_audio_input_device") || "";
  });
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [hasPermission, setHasPermission] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [deviceError, setDeviceError] = useState("");
  const [mediaStream, setMediaStream] = useState(null);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastLevelUpdateRef = useRef(0);

  // Enumerate all audio input devices
  const loadDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setDeviceError("Audio device management is not supported in this browser.");
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === "audioinput");

      const formatted = audioInputs.map((d, index) => ({
        label: d.label || `Microphone / Audio Device ${index + 1}`,
        value: d.deviceId,
        groupId: d.groupId,
      }));

      setDevices(formatted);

      // Verify selectedDeviceId
      if (formatted.length > 0) {
        setSelectedDeviceId((prev) => {
          const exists = formatted.some((d) => d.value === prev);
          if (prev && exists) return prev;
          const defaultDev = formatted.find((d) => d.value === "default") || formatted[0];
          const chosen = defaultDev ? defaultDev.value : formatted[0].value;
          localStorage.setItem("band_audio_input_device", chosen);
          return chosen;
        });
      }
    } catch (err) {
      console.warn("Failed to enumerate audio devices:", err);
    }
  }, []);

  // Request browser permission so device labels are visible
  const requestPermission = useCallback(async () => {
    setDeviceError("");
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      // Close initial test stream
      tempStream.getTracks().forEach((track) => track.stop());
      await loadDevices();
    } catch (err) {
      console.error("Microphone permission error:", err);
      setDeviceError("Microphone access was denied. Please allow microphone access in your browser settings.");
      setHasPermission(false);
    }
  }, [loadDevices]);

  // Start real-time audio level monitoring from selected device
  const startMonitoring = useCallback(
    async (deviceIdToUse) => {
      const targetDeviceId = deviceIdToUse !== undefined ? deviceIdToUse : selectedDeviceId;

      // Stop any existing stream
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // ignore
        }
        audioContextRef.current = null;
      }

      try {
        const constraints = {
          audio: targetDeviceId
            ? { deviceId: { exact: targetDeviceId }, echoCancellation: false, noiseSuppression: false }
            : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setMediaStream(stream);
        setHasPermission(true);

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.3;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale non-linearly for visual sensitivity
          const normalized = Math.min(100, Math.round((avg / 110) * 100));

          const now = performance.now();
          if (now - lastLevelUpdateRef.current > 40) {
            lastLevelUpdateRef.current = now;
            setAudioLevel(normalized);
          }

          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };

        animationFrameRef.current = requestAnimationFrame(updateMeter);
        setIsMonitoring(true);
        setDeviceError("");
        return stream;
      } catch (err) {
        console.error("Failed to start audio monitoring on device:", err);
        setDeviceError(`Could not capture audio from selected device: ${err.message}`);
        setIsMonitoring(false);
        return null;
      }
    },
    [selectedDeviceId]
  );

  const stopMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMediaStream(null);
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setIsMonitoring(false);
  }, []);

  const changeDevice = useCallback(
    (newDeviceId) => {
      setSelectedDeviceId(newDeviceId);
      localStorage.setItem("band_audio_input_device", newDeviceId);
      if (isMonitoring) {
        startMonitoring(newDeviceId);
      }
    },
    [isMonitoring, startMonitoring]
  );

  // Initialize and listen for USB device plug/unplug events
  useEffect(() => {
    loadDevices();
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", loadDevices);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
      };
    }
  }, [loadDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  const selectedDevice = devices.find((d) => d.value === selectedDeviceId);

  return {
    devices,
    selectedDeviceId,
    selectedDevice,
    setSelectedDeviceId: changeDevice,
    audioLevel,
    isAudioActive: audioLevel > 5,
    hasPermission,
    isMonitoring,
    mediaStream,
    deviceError,
    requestPermission,
    refreshDevices: loadDevices,
    startMonitoring,
    stopMonitoring,
  };
};
