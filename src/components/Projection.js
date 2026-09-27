import React, { useState, useEffect, useRef } from "react";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { fetchEvents } from "../services/EventService";
import { fetchSongs } from "../services/SongService";
import { getLyricsBlocks } from "../utils/projectionUtils";
import { useTranslation } from "react-i18next";
import "./Projection.css";

const Projection = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [groupLines, setGroupLines] = useState(0);
  const [projectionActive, setProjectionActive] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  
  const bcRef = useRef(null);
  const projectionWindowRef = useRef(null);

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

  const groupLinesOptions = [
    { label: 'Original Format (Respect Spaces)', value: 0 },
    { label: '1 Line', value: 1 },
    { label: '2 Lines', value: 2 },
    { label: '3 Lines', value: 3 },
    { label: '4 Lines', value: 4 }
  ];

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
    if (!projectionActive) return;
    setSelectedBlockId(block.id);
    if (bcRef.current) {
      bcRef.current.postMessage({ type: 'UPDATE_LYRICS', payload: block });
    }
  };

  const eventSongs = selectedEvent && selectedEvent.songs 
    ? selectedEvent.songs.map(id => songs.find(s => s.id === id)).filter(Boolean)
    : [];

  const lyricsBlocks = selectedSong ? getLyricsBlocks(selectedSong, groupLines) : [];

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
        <div className="group-lines-control">
          <label>Group Lines</label>
          <Dropdown 
            value={groupLines} 
            options={groupLinesOptions} 
            onChange={(e) => setGroupLines(e.value)} 
            className="w-full"
          />
        </div>

        <div className="lyrics-preview-container">
          {selectedSong && (
            <div className="lyrics-preview-header">
              <h3>{selectedSong.song}</h3>
              <small>{selectedSong.singer} &lt;PT/DE&gt;</small>
            </div>
          )}
          
          <div className="lyrics-blocks-list">
            {lyricsBlocks.map((block) => (
              <div 
                key={block.id} 
                className={`lyrics-block-item ${selectedBlockId === block.id ? 'active' : ''} ${!projectionActive ? 'disabled' : ''}`}
                onClick={() => handleBlockClick(block)}
              >
                <div className="block-tag">{block.id.toUpperCase()}</div>
                <div className="block-content">
                  {block.pt.map((line, i) => (
                    <div key={`pt-${i}`} className="preview-pt">{line}</div>
                  ))}
                  {block.de.map((line, i) => (
                    <div key={`de-${i}`} className="preview-de">{line}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projection;
