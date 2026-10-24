import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { fetchEvents } from "../services/EventService";
import { fetchSongs } from "../services/SongService";
import { getLyricsBlocks } from "../utils/projectionUtils";
import { useLiveLyricFollower } from "../hooks/useLiveLyricFollower";
import { useLocalWhisperFollower } from "../hooks/useLocalWhisperFollower";
import { useAudioInput } from "../hooks/useAudioInput";
import "./Projection.css";

const Projection = () => {
  const [events, setEvents] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [groupLines, setGroupLines] = useState(0);
  const [projectionActive, setProjectionActive] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [fontSize, setFontSize] = useState(5);
  const [listenLanguage, setListenLanguage] = useState("pt-BR");
  const [showDeviceTip, setShowDeviceTip] = useState(false);
  const [autoChangeSlide, setAutoChangeSlide] = useState(true);
  const [highlightPhrase, setHighlightPhrase] = useState(() => {
    const saved = localStorage.getItem("band_highlight_phrase");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [activePhraseIndex, setActivePhraseIndex] = useState(null);
  const [activePhraseText, setActivePhraseText] = useState("");
  const [testTextInput, setTestTextInput] = useState("");
  const [engineType, setEngineType] = useState(() => {
    return localStorage.getItem("band_lyric_engine") || "local-whisper";
  });
  const [whisperServerUrl, setWhisperServerUrl] = useState(() => {
    return localStorage.getItem("band_whisper_server_url") || "http://127.0.0.1:5001";
  });
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(() => {
    return localStorage.getItem("band_whisper_server_url") || "http://127.0.0.1:5001";
  });
  
  const bcRef = useRef(null);
  const projectionWindowRef = useRef(null);

  // Audio capture device hook with real-time VU meter
  const {
    devices: audioDevices,
    selectedDeviceId,
    selectedDevice,
    setSelectedDeviceId,
    audioLevel,
    isAudioActive,
    isMonitoring,
    mediaStream,
    deviceError,
    refreshDevices,
    startMonitoring,
    stopMonitoring,
  } = useAudioInput();

  useEffect(() => {
    const loadData = async () => {
      const [fetchedEvents, fetchedSongs] = await Promise.all([
        fetchEvents(),
        fetchSongs()
      ]);
      setEvents(fetchedEvents.sort((a, b) => b.date.seconds - a.date.seconds));
      setSongs(fetchedSongs);
    };
    loadData();
    
    bcRef.current = new BroadcastChannel('projection_sync');
    return () => {
      if (bcRef.current) bcRef.current.close();
    };
  }, []);

  const eventOptions = events.map(e => ({
    label: `${new Date(e.date.seconds * 1000).toLocaleDateString()} - ${e.name}`,
    value: e
  }));

  const fontSizeOptions = [
    { label: 'Very Small', value: 3 },
    { label: 'Small', value: 4 },
    { label: 'Medium', value: 5 },
    { label: 'Large', value: 6 },
    { label: 'Very Large', value: 7 },
    { label: 'Huge', value: 8 },
  ];

  const groupLinesOptions = [
    { label: 'Original Format (Respect Spaces)', value: 0 },
    { label: '1 Line', value: 1 },
    { label: '2 Lines', value: 2 },
    { label: '3 Lines', value: 3 },
    { label: '4 Lines', value: 4 }
  ];

  const lyricsBlocks = selectedSong ? getLyricsBlocks(selectedSong, groupLines) : [];

  const handlePhraseSelect = useCallback((phraseIdx, phraseText) => {
    setActivePhraseIndex(phraseIdx);
    setActivePhraseText(phraseText || "");
    if (bcRef.current && highlightPhrase) {
      bcRef.current.postMessage({
        type: 'UPDATE_PHRASE',
        payload: { activePhraseIndex: phraseIdx, highlightPhrase: true }
      });
    }
  }, [highlightPhrase]);

  const handleAutoFollowSelect = useCallback((block, initialPhraseIndex = 0) => {
    if (autoChangeSlide || !selectedBlockId) {
      setSelectedBlockId(block.id);
      setActivePhraseIndex(initialPhraseIndex);
      if (bcRef.current) {
        bcRef.current.postMessage({ 
          type: 'UPDATE_LYRICS', 
          payload: { 
            block, 
            fontSize: `${fontSize}vh`,
            activePhraseIndex: highlightPhrase ? initialPhraseIndex : null,
            highlightPhrase
          } 
        });
      }
      const el = document.getElementById(`block-${block.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (selectedBlockId === block.id) {
      setActivePhraseIndex(initialPhraseIndex);
      if (bcRef.current && highlightPhrase) {
        bcRef.current.postMessage({
          type: 'UPDATE_PHRASE',
          payload: { activePhraseIndex: initialPhraseIndex, highlightPhrase: true }
        });
      }
    }
  }, [autoChangeSlide, fontSize, highlightPhrase, selectedBlockId]);

  const handleWordsMatched = useCallback(() => {
    // Word-level selection disabled
  }, []);

  // Web Speech API Follower (Chrome built-in)
  const webSpeechFollower = useLiveLyricFollower({
    blocks: lyricsBlocks,
    currentBlockId: selectedBlockId,
    onBlockSelect: handleAutoFollowSelect,
    onPhraseSelect: handlePhraseSelect,
    onWordsMatched: handleWordsMatched,
    language: listenLanguage,
    minConfidence: 0.35,
  });

  // Local Offline Whisper Follower (Runs on CPU with int8 quantization)
  const localWhisperFollower = useLocalWhisperFollower({
    stream: mediaStream,
    blocks: lyricsBlocks,
    currentBlockId: selectedBlockId,
    selectedSong,
    onBlockSelect: handleAutoFollowSelect,
    onPhraseSelect: handlePhraseSelect,
    onWordsMatched: handleWordsMatched,
    language: listenLanguage.startsWith("de") ? "de" : listenLanguage.startsWith("pt") ? "pt" : "en",
    serverUrl: whisperServerUrl,
    minConfidence: 0.35,
  });

  const isLocalEngine = engineType === "local-whisper";
  const isAutoFollowEnabled = isLocalEngine ? localWhisperFollower.isListening : webSpeechFollower.isEnabled;
  const isListening = isLocalEngine ? localWhisperFollower.isListening : webSpeechFollower.isListening;
  const lastTranscript = isLocalEngine ? localWhisperFollower.lastTranscript : webSpeechFollower.lastTranscript;
  const lastMatch = isLocalEngine ? localWhisperFollower.lastMatch : webSpeechFollower.lastMatch;
  const processText = isLocalEngine ? localWhisperFollower.processText : webSpeechFollower.processText;
  const isSupported = isLocalEngine ? true : webSpeechFollower.isSupported;
  const activeError = isLocalEngine
    ? (localWhisperFollower.errorMessage || deviceError)
    : (webSpeechFollower.errorMessage || deviceError || (webSpeechFollower.lastError && webSpeechFollower.lastError !== "no-speech" ? `Speech engine: ${webSpeechFollower.lastError}` : ""));

  const handleToggleAutoFollow = async () => {
    if (isAutoFollowEnabled) {
      if (isLocalEngine) {
        localWhisperFollower.stopListening();
      } else {
        webSpeechFollower.stopListening();
      }
      stopMonitoring();
    } else {
      const stream = await startMonitoring(selectedDeviceId);
      if (isLocalEngine) {
        localWhisperFollower.startListening(stream);
      } else {
        webSpeechFollower.startListening();
      }
    }
  };

  const handleStart = async () => {
    setProjectionActive(true);
    try {
      if ('getScreenDetails' in window) {
        const screenDetails = await window.getScreenDetails();
        const externalScreen = screenDetails.screens.find(s => s !== screenDetails.currentScreen) || screenDetails.currentScreen;
        
        projectionWindowRef.current = window.open(
          '/projector',
          'ProjectionWindow',
          `left=${externalScreen.availLeft},top=${externalScreen.availTop},width=${externalScreen.availWidth},height=${externalScreen.availHeight}`
        );
      } else {
        throw new Error("Window Management API not supported");
      }
    } catch (err) {
      console.warn("Window Management API failed, falling back to simple window.open:", err);
      projectionWindowRef.current = window.open('/projector', 'ProjectionWindow', 'width=800,height=600');
    }
  };

  const handleStop = () => {
    setProjectionActive(false);
    if (localWhisperFollower.isListening) {
      localWhisperFollower.stopListening();
    }
    if (webSpeechFollower.isEnabled) {
      webSpeechFollower.stopListening();
    }
    stopMonitoring();
    if (projectionWindowRef.current) {
      projectionWindowRef.current.close();
      projectionWindowRef.current = null;
    }
    if (bcRef.current) {
      bcRef.current.postMessage({ type: 'CLEAR_LYRICS' });
    }
    setSelectedBlockId(null);
  };

  const handleBlockClick = (block) => {
    setSelectedBlockId(block.id);
    setActivePhraseIndex(0);
    if (bcRef.current) {
      bcRef.current.postMessage({ 
        type: 'UPDATE_LYRICS', 
        payload: { 
          block, 
          fontSize: `${fontSize}vh`,
          activePhraseIndex: highlightPhrase ? 0 : null,
          highlightPhrase
        } 
      });
    }
  };

  const handleToggleHighlightPhrase = () => {
    setHighlightPhrase((prev) => {
      const nextVal = !prev;
      localStorage.setItem("band_highlight_phrase", JSON.stringify(nextVal));
      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'UPDATE_CONFIG',
          payload: {
            fontSize: `${fontSize}vh`,
            highlightPhrase: nextVal,
            activePhraseIndex: nextVal ? activePhraseIndex : null
          }
        });
      }
      return nextVal;
    });
  };

  useEffect(() => {
    if (bcRef.current && projectionActive) {
      bcRef.current.postMessage({ type: 'UPDATE_CONFIG', payload: { fontSize: `${fontSize}vh` } });
    }
  }, [fontSize, projectionActive]);

  useEffect(() => {
    if (!selectedSong && isAutoFollowEnabled) {
      if (localWhisperFollower.isListening) localWhisperFollower.stopListening();
      if (webSpeechFollower.isEnabled) webSpeechFollower.stopListening();
      stopMonitoring();
    }
  }, [selectedSong, isAutoFollowEnabled, localWhisperFollower, webSpeechFollower, stopMonitoring]);

  const eventSongs = selectedEvent && selectedEvent.songs 
    ? selectedEvent.songs.map(id => songs.find(s => s.id === id)).filter(Boolean)
    : [];

  return (
    <div className="projection-container">
      <div className="projection-left">
        <h2 style={{ fontFamily: 'var(--font-brand)', marginBottom: '20px' }}>Projection tab</h2>
        
        <div className="form-group">
          <label>Event date</label>
          <Dropdown 
            value={selectedEvent} 
            options={eventOptions} 
            onChange={(e) => {
              setSelectedEvent(e.value);
              setSelectedSong(null);
              setSelectedBlockId(null);
            }} 
            placeholder="Select an Event" 
            className="w-full"
          />
        </div>

        <div className="event-songs-list">
          <label>Songs of the event that is related with the date chosen above.</label>
          <div className="songs-list-box">
            {eventSongs.map((song) => (
              <div 
                key={song.id} 
                className={`song-list-item ${selectedSong && selectedSong.id === song.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedSong(song);
                  setSelectedBlockId(null);
                }}
              >
                {song.song} <small>({song.singer})</small>
              </div>
            ))}
            {eventSongs.length === 0 && <p className="no-songs">No songs for this event.</p>}
          </div>
        </div>

        {/* Live Audio Auto-Follow Section */}
        <div className="autofollow-card">
          <div className="autofollow-header">
            <div className="autofollow-title">
              <i className="pi pi-microphone" style={{ color: isListening ? '#22c55e' : '#64748b' }} />
              <span>Live Lyric Follow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isLocalEngine && localWhisperFollower.isTranscribing && (
                <span className="ai-transcribing-badge">
                  <i className="pi pi-spin pi-spinner" style={{ fontSize: '0.7rem' }} /> AI
                </span>
              )}
              {isAutoFollowEnabled && (
                <span style={{ fontSize: '0.72rem', color: isListening ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                  {isListening ? (localWhisperFollower.isTranscribing ? "Transcribing..." : "Listening") : "Active"}
                </span>
              )}
              {isListening && <span className="listening-pulse" title="Speech engine active..." />}
            </div>
          </div>

          <div className="autofollow-body">
            {/* Tracking Engine Selector */}
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Tracking Engine</label>
                {isLocalEngine && (
                  <span className={`engine-badge ${localWhisperFollower.isServerOnline ? 'online' : 'offline'}`}>
                    {localWhisperFollower.isServerOnline ? '● Whisper Online' : '● Server Offline'}
                  </span>
                )}
              </div>
              <Dropdown
                value={engineType}
                options={[
                  { label: "🤖 Local AI (Whisper Offline) - Fast & Accurate", value: "local-whisper" },
                  { label: "🌐 Browser Web Speech API (Chrome Built-in)", value: "web-speech" }
                ]}
                onChange={(e) => {
                  if (isAutoFollowEnabled) {
                    handleToggleAutoFollow();
                  }
                  setEngineType(e.value);
                  localStorage.setItem("band_lyric_engine", e.value);
                }}
                className="w-full"
              />
            </div>

            {/* Network / Local Server Address indicator and config */}
            {isLocalEngine && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.74rem' }}>
                <span style={{ color: '#64748b' }}>
                  AI Server: <code style={{ color: '#0284c7', background: '#e0f2fe', padding: '1px 5px', borderRadius: '3px' }}>{whisperServerUrl}</code>
                </span>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.73rem', textDecoration: 'underline', padding: 0 }}
                  onClick={() => setShowServerConfig(prev => !prev)}
                >
                  {showServerConfig ? "Hide Config" : "Change IP / Network"}
                </button>
              </div>
            )}

            {isLocalEngine && showServerConfig && (
              <div className="server-config-card" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  AI Server Address (Network IP or Localhost):
                </label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    value={serverUrlInput}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    placeholder="http://192.168.1.100:5001"
                    className="test-voice-input"
                    style={{ fontSize: '0.78rem' }}
                  />
                  <Button
                    type="button"
                    icon="pi pi-check"
                    label="Apply"
                    className="p-button-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => {
                      let clean = serverUrlInput.trim().replace(/\/+$/, '');
                      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
                        clean = 'http://' + clean;
                      }
                      setWhisperServerUrl(clean);
                      localStorage.setItem("band_whisper_server_url", clean);
                      setShowServerConfig(false);
                      setTimeout(() => localWhisperFollower.checkServerHealth(), 100);
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="quick-ip-btn"
                    onClick={() => {
                      setServerUrlInput("http://127.0.0.1:5001");
                      setWhisperServerUrl("http://127.0.0.1:5001");
                      localStorage.setItem("band_whisper_server_url", "http://127.0.0.1:5001");
                      setTimeout(() => localWhisperFollower.checkServerHealth(), 100);
                    }}
                  >
                    Reset to Localhost (127.0.0.1)
                  </button>
                </div>
                <small style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', marginTop: '6px', lineHeight: 1.3 }}>
                  💡 <strong>Network PC:</strong> If running on another PC in your church network (e.g. soundboard or media desktop with GPU), enter its local IP address (like <code>http://192.168.1.50:5001</code>).
                </small>
              </div>
            )}

            {/* Offline Whisper alert or online banner */}
            {isLocalEngine && !localWhisperFollower.isServerOnline && (
              <div className="whisper-offline-alert" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="pi pi-exclamation-triangle" style={{ color: '#ef4444' }} />
                  <strong>Cannot reach Whisper server at {whisperServerUrl}</strong>
                </div>
                <p style={{ margin: '4px 0 2px 0', fontSize: '0.74rem' }}>
                  {whisperServerUrl.includes('127.0.0.1') || whisperServerUrl.includes('localhost') ? (
                    <>Start your local model in terminal: <code>npm run whisper</code></>
                  ) : (
                    <>Verify the AI server computer on your network is running on port 5001.</>
                  )}
                </p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <Button
                    type="button"
                    icon="pi pi-refresh"
                    label="Retry Connection"
                    className="p-button-outlined p-button-danger p-button-sm"
                    style={{ fontSize: '0.73rem', padding: '4px 8px' }}
                    onClick={() => localWhisperFollower.checkServerHealth()}
                  />
                  <Button
                    type="button"
                    icon="pi pi-cog"
                    label="Change IP Address"
                    className="p-button-outlined p-button-secondary p-button-sm"
                    style={{ fontSize: '0.73rem', padding: '4px 8px' }}
                    onClick={() => setShowServerConfig(true)}
                  />
                </div>
              </div>
            )}

            {isLocalEngine && localWhisperFollower.isServerOnline && (
              <div className="whisper-online-banner" style={{ marginBottom: '10px' }}>
                <i className="pi pi-check-circle" />
                <span>AI ready at {whisperServerUrl}: captures directly from selected sound card with zero cloud lag.</span>
              </div>
            )}

            {/* Sound Capture Device Search & Select */}
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.82rem' }}>Sound Capture Device</label>
                <button 
                  type="button" 
                  className="refresh-devices-btn" 
                  onClick={refreshDevices}
                  title="Refresh sound devices"
                >
                  <i className="pi pi-refresh" style={{ fontSize: '0.75rem' }} />
                </button>
              </div>
              <Dropdown
                value={selectedDeviceId}
                options={audioDevices}
                onChange={(e) => setSelectedDeviceId(e.value)}
                placeholder="Search sound device..."
                filter
                filterPlaceholder="Search device..."
                className="w-full"
                emptyMessage="No audio devices found."
              />
            </div>

            {/* Live VU Volume Meter */}
            <div className="audio-meter-container" style={{ marginBottom: '10px' }}>
              <div className="audio-meter-header">
                <span className="meter-label">Audio Level</span>
                <span className={`meter-status ${isAudioActive ? 'active' : ''}`}>
                  {isAudioActive ? '● Sound Detected' : (isMonitoring ? 'Listening (Silent)' : 'Meter Inactive')}
                </span>
              </div>
              <div className="audio-meter-track">
                <div 
                  className={`audio-meter-fill ${audioLevel > 80 ? 'peak' : audioLevel > 50 ? 'mid' : 'normal'}`} 
                  style={{ width: `${audioLevel}%` }} 
                />
              </div>
            </div>

            {/* Test & Tip actions */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <Button
                type="button"
                icon={isMonitoring && !isAutoFollowEnabled ? "pi pi-volume-off" : "pi pi-volume-up"}
                label={isMonitoring && !isAutoFollowEnabled ? "Stop Test" : "Test Sound"}
                className="p-button-outlined p-button-secondary p-button-sm"
                style={{ flex: 1, fontSize: '0.78rem', padding: '6px' }}
                onClick={() => {
                  if (isMonitoring && !isAutoFollowEnabled) {
                    stopMonitoring();
                  } else {
                    startMonitoring(selectedDeviceId);
                  }
                }}
              />
              <Button
                type="button"
                icon="pi pi-question-circle"
                label="Setup Tip"
                className="p-button-outlined p-button-secondary p-button-sm"
                style={{ fontSize: '0.78rem', padding: '6px' }}
                onClick={() => setShowDeviceTip(prev => !prev)}
                title="How to configure this device in Chrome"
              />
            </div>

            {showDeviceTip && (
              <div className="chrome-device-tip" style={{ marginBottom: '10px' }}>
                <div className="tip-header">
                  <i className="pi pi-info-circle" />
                  <span>Configuring {selectedDevice ? selectedDevice.label : 'Sound Card'}:</span>
                </div>
                <ol>
                  <li><strong>Local Whisper AI Engine (Recommended):</strong> Directly reads your selected device! No Windows default settings required.</li>
                  <li><strong>Browser Web Speech API:</strong> Chrome locks to Windows Default Recording Device (<kbd>Win + R</kbd> &rarr; <code>mmsys.cpl</code>).</li>
                  <li>Verify that <strong>Singing Language</strong> below matches what is being sung.</li>
                </ol>
              </div>
            )}

            {/* System 1: Auto-Advance Slide Feature */}
            <div className="autofollow-feature-row" style={{ marginBottom: '8px' }}>
              <div className="feature-info">
                <span className="feature-title">Auto-Advance Slide (1st Phrase)</span>
                <span className="feature-desc">Automatically switch slide when the 1st phrase of a slide is sung</span>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${autoChangeSlide ? 'active' : ''}`}
                onClick={() => setAutoChangeSlide(prev => !prev)}
                title="Toggle automatic slide advancing"
              >
                {autoChangeSlide ? "ON" : "OFF"}
              </button>
            </div>

            {/* System 2: Highlight Current Phrase Feature */}
            <div className="autofollow-feature-row" style={{ marginBottom: '10px' }}>
              <div className="feature-info">
                <span className="feature-title">Highlight Current Phrase</span>
                <span className="feature-desc">Glows the specific phrase/line being sung on the screen</span>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${highlightPhrase ? 'active' : ''}`}
                onClick={handleToggleHighlightPhrase}
                title="Toggle phrase-by-phrase live highlighting"
              >
                {highlightPhrase ? "ON" : "OFF"}
              </button>
            </div>

            {/* Singing Language Selection */}
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.82rem', marginBottom: '4px', display: 'block' }}>Singing Language</label>
              <Dropdown
                value={listenLanguage}
                options={[
                  { label: "Português (BR)", value: "pt-BR" },
                  { label: "Deutsch (DE)", value: "de-DE" },
                  { label: "English (US)", value: "en-US" }
                ]}
                onChange={(e) => setListenLanguage(e.value)}
                className="w-full"
                disabled={!isSupported}
              />
            </div>

            <Button
              type="button"
              label={isAutoFollowEnabled ? "Stop Auto-Follow" : "Start Auto-Follow"}
              icon={isAutoFollowEnabled ? "pi pi-pause" : "pi pi-play"}
              className={`p-button-sm ${isAutoFollowEnabled ? "p-button-danger" : "p-button-success"}`}
              onClick={handleToggleAutoFollow}
              disabled={!selectedSong || (!isLocalEngine && !isSupported) || (isLocalEngine && !localWhisperFollower.isServerOnline)}
              style={{ width: "100%" }}
            />

            {!isSupported && !isLocalEngine && (
              <small className="autofollow-warning">
                Web Speech API not supported in this browser. Please use Chrome or Edge.
              </small>
            )}

            {activeError && (
              <div className="autofollow-error">
                <i className="pi pi-exclamation-triangle" /> {activeError}
              </div>
            )}

            {!isLocalEngine && isAudioActive && isAutoFollowEnabled && !lastTranscript && (
              <div className="chrome-mismatch-warning" style={{ marginTop: '8px' }}>
                <i className="pi pi-exclamation-triangle" />
                <div>
                  <strong>Sound is detected, but Chrome speech is not receiving words:</strong>
                  <p style={{ marginTop: '4px', marginBottom: '6px' }}>
                    The VU meter confirms your microphone is sending audio. However, Chrome's speech recognizer uses your <strong>Windows Default Recording Device</strong>.
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.73rem' }}>
                    <strong>Quick Windows Fix (10 seconds):</strong>
                    <ol style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                      <li>Press <kbd>Win + R</kbd>, type <code>mmsys.cpl</code> and hit <strong>Enter</strong>.</li>
                      <li>In the <strong>Recording</strong> tab, right-click <strong>{selectedDevice ? selectedDevice.label : 'your audio interface'}</strong>.</li>
                      <li>Click <strong>"Set as Default Device"</strong> and <strong>"Set as Default Communication Device"</strong>.</li>
                      <li>Also verify the <strong>Singing Language</strong> dropdown above matches what you're singing (PT, DE, or EN).</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {(isAutoFollowEnabled || lastTranscript || lastMatch || activePhraseText) && (
              <div className="autofollow-status">
                <div className="transcript-box">
                  <span className="transcript-label">Live Heard:</span>
                  <span className="transcript-text">
                    {lastTranscript || (isListening ? "Listening for singing..." : "Waiting...")}
                  </span>
                </div>
                {(lastMatch || activePhraseText) && (
                  <div className="match-badge">
                    <i className="pi pi-check-circle" />
                    <span>
                      {selectedBlockId && <>Slide: <strong>{selectedBlockId.toUpperCase()}</strong></>}
                      {activePhraseText && (
                        <span className="matched-phrase-text"> &bull; Phrase: <em>&ldquo;{activePhraseText}&rdquo;</em></span>
                      )}
                      {!activePhraseText && lastMatch?.matchedPhrase && (
                        <span className="matched-phrase-text"> &bull; Phrase: <em>&ldquo;{lastMatch.matchedPhrase}&rdquo;</em></span>
                      )}
                      {lastMatch && (
                        <small style={{ opacity: 0.85, marginLeft: '6px' }}>({lastMatch.confidence}%)</small>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Test Voice / Text Simulation */}
            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                Test Words &amp; Slide Follow:
              </label>
              <div className="test-voice-bar">
                <input
                  type="text"
                  placeholder="Type sung words to test..."
                  value={testTextInput}
                  onChange={(e) => setTestTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && testTextInput.trim()) {
                      processText(testTextInput);
                    }
                  }}
                  className="test-voice-input"
                />
                <button
                  type="button"
                  className="test-voice-btn"
                  onClick={() => {
                    if (testTextInput.trim()) {
                      processText(testTextInput);
                    }
                  }}
                >
                  Test
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="projection-controls">
          <Button 
            type="button"
            label="Start" 
            className={`p-button-outlined ${projectionActive ? 'start-btn-active' : ''}`} 
            onClick={handleStart}
            disabled={projectionActive}
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <Button 
            type="button"
            label="Stop" 
            className={`p-button-outlined ${!projectionActive ? 'stop-btn-active' : ''}`} 
            onClick={handleStop}
            disabled={!projectionActive}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="projection-right">
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end', width: '100%' }}>
          <div className="group-lines-control" style={{ width: '150px' }}>
            <label>Font Size</label>
            <Dropdown 
              value={fontSize} 
              options={fontSizeOptions} 
              onChange={(e) => setFontSize(e.value)} 
              className="w-full"
            />
          </div>
          <div className="group-lines-control">
            <label>Group Lines</label>
            <Dropdown 
              value={groupLines} 
              options={groupLinesOptions} 
              onChange={(e) => setGroupLines(e.value)} 
              className="w-full"
            />
          </div>
        </div>

        <div className="lyrics-preview-container">
          {selectedSong && (
            <div className="lyrics-preview-header">
              <h3>{selectedSong.song}</h3>
              <small>{selectedSong.singer} &lt;PT/DE&gt;</small>
            </div>
          )}
          
          <div className="lyrics-blocks-list">
            {lyricsBlocks.map((block) => {
              const isCurrent = selectedBlockId === block.id;
              const isMatchedByAI = lastMatch && lastMatch.block.id === block.id;
              return (
                <div 
                  key={block.id} 
                  id={`block-${block.id}`}
                  className={`lyrics-block-item ${isCurrent ? 'active' : ''} ${isMatchedByAI ? 'ai-tracking' : ''}`}
                  onClick={() => handleBlockClick(block)}
                >
                  <div className="block-tag">
                    {block.id.toUpperCase()}
                    {isMatchedByAI && <span className="ai-tag-dot" title="Auto-Follow Matched" />}
                  </div>
                  <div className="block-content">
                    {block.pt.map((line, i) => {
                      const isLineActive = isCurrent && highlightPhrase && activePhraseIndex === i;
                      return (
                        <div key={`pt-${i}`} className={`preview-pt ${isLineActive ? 'phrase-active-preview' : ''}`}>
                          <span>{line}</span>
                          {isLineActive && <span className="phrase-singing-pill">SINGING</span>}
                        </div>
                      );
                    })}
                    {block.de.map((line, i) => {
                      const isLineActive = isCurrent && highlightPhrase && activePhraseIndex === i;
                      return (
                        <div key={`de-${i}`} className={`preview-de ${isLineActive ? 'phrase-active-preview' : ''}`}>
                          <span>{line}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projection;
