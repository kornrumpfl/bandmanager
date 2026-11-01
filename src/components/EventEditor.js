// =============== EventEditor.js (Fixed & Enhanced) ===============

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card } from "primereact/card";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { fetchSongs } from "../services/SongService";
import { updateEvent, addEvent, fetchEventById } from "../services/EventService";
import { ProgressSpinner } from "primereact/progressspinner";
import { OrderList } from "primereact/orderlist";
import "./EventEditor.css";

const EventEditor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(null);
  const [mixer, setMixer] = useState("");
  const [lyricsRole, setLyricsRole] = useState("");
  const [songs, setSongs] = useState([]);
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clonedFromEventName, setClonedFromEventName] = useState(null);

  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const cloneFromId = searchParams.get("cloneFrom");
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const loadedSongs = await fetchSongs();
      setSongs(loadedSongs);

      if (id) {
        const event = await fetchEventById(id);
        if (event) {
          setEventName(event.name || "");
          setEventDate(event.date?.seconds ? new Date(event.date.seconds * 1000) : new Date());
          setSelectedSongIds(event.songs || []);
          setMixer(event.mixer || "");
          setLyricsRole(event.lyricsRole || "");
        }
      } else if (cloneFromId) {
        const event = await fetchEventById(cloneFromId);
        if (event) {
          setClonedFromEventName(event.name || "Historical Event");
          setEventName(event.name || "");
          // Default to today for the new event date
          setEventDate(new Date());
          setSelectedSongIds(event.songs || []);
          setMixer(event.mixer || "");
          setLyricsRole(event.lyricsRole || "");
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id, cloneFromId]);

  const handleSubmit = async () => {
    if (!eventName.trim()) {
      alert("Please enter an event name.");
      return;
    }
    if (!eventDate) {
      alert("Please select an event date.");
      return;
    }

    const data = {
      name: eventName,
      date: eventDate,
      songs: selectedSongIds,
      mixer,
      lyricsRole,
    };

    if (id) {
      await updateEvent(id, data);
    } else {
      await addEvent(data);
    }
    navigate("/");
  };

  const handleSaveAsNew = async () => {
    if (!eventName.trim()) {
      alert("Please enter an event name.");
      return;
    }
    if (!eventDate) {
      alert("Please select an event date.");
      return;
    }

    const data = {
      name: eventName,
      date: eventDate,
      songs: selectedSongIds,
      mixer,
      lyricsRole,
    };

    await addEvent(data);
    navigate("/");
  };

  const handleSongToggle = (songId) => {
    const exists = selectedSongIds.includes(songId);
    const newSelection = exists
      ? selectedSongIds.filter((item) => item !== songId)
      : [...selectedSongIds, songId];
    setSelectedSongIds(newSelection);
  };

  const selectedSongsObjects = selectedSongIds
    .map((songId) => songs.find((s) => s.id === songId))
    .filter(Boolean);

  const itemTemplate = (item) => {
    return (
      <div className="flex align-items-center justify-content-between gap-2" style={{ width: '100%' }}>
        <span>
          {item.song} <small>({item.singer})</small>
        </span>
        <Button 
          type="button"
          icon="pi pi-times" 
          className="p-button-rounded p-button-danger p-button-text p-button-sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleSongToggle(item.id);
          }}
          title="Remove song"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="event-editor-container">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="event-editor-container">
      <Card 
        title={
          cloneFromId 
            ? "Reuse Event on New Date" 
            : id 
              ? "Edit Event Date & Songs" 
              : "Create Event"
        } 
        className="event-editor-card"
      >
        {clonedFromEventName && (
          <div style={{
            background: "rgba(59, 130, 246, 0.15)",
            border: "1px solid #3b82f6",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "16px",
            color: "#60a5fa",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <i className="pi pi-copy" style={{ fontSize: "1rem" }} />
            <span>Reusing songs from past event: <strong>{clonedFromEventName}</strong>. Pick a new date below and save!</span>
          </div>
        )}

        <div className="form-group">
          <label>Event Name</label>
          <InputText value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full" />
        </div>

        <div className="form-group">
          <label>Event Date</label>
          <Calendar 
            value={eventDate} 
            onChange={(e) => setEventDate(e.value)} 
            showIcon 
            className="w-full"
            placeholder="Select new date"
          />
        </div>

        <div className="form-group">
          <label>Mixer</label>
          <InputText value={mixer} onChange={(e) => setMixer(e.target.value)} className="w-full" />
        </div>

        <div className="form-group">
          <label>Lyrics</label>
          <InputText value={lyricsRole} onChange={(e) => setLyricsRole(e.target.value)} className="w-full" />
        </div>

        <div className="form-group">
          <label>Select Songs ({selectedSongIds.length} selected)</label>
          <InputText
            placeholder="Search by song or singer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="song-checkboxes scroll-list">
            {songs
              .filter((song) => {
                const term = searchTerm.toLowerCase();
                return (
                  song.song.toLowerCase().includes(term) ||
                  song.singer.toLowerCase().includes(term)
                );
              })
              .map((song) => (
                <div key={song.id} className="checkbox-item">
                  <Checkbox
                    inputId={song.id}
                    value={song.id}
                    onChange={() => handleSongToggle(song.id)}
                    checked={selectedSongIds.includes(song.id)}
                  />
                  <label htmlFor={song.id}>{song.song} <small>({song.singer})</small></label>
                </div>
              ))}
          </div>
        </div>

        {selectedSongIds.length > 0 && (
          <div className="form-group mt-4">
            <label>Selected Songs Order (Drag to Reorder)</label>
            <OrderList
              value={selectedSongsObjects}
              onChange={(e) => setSelectedSongIds(e.value.map((s) => s.id))}
              itemTemplate={itemTemplate}
              dragdrop
            />
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "24px" }}>
          <Button 
            label={id ? "Update Event Date / Details" : "Save Event"} 
            icon="pi pi-check" 
            className="p-button-success" 
            onClick={handleSubmit} 
            style={{ flex: 1, minWidth: "180px" }}
          />
          {id && (
            <Button
              type="button"
              label="Save as New Event (Copy on this Date)"
              icon="pi pi-copy"
              className="p-button-outlined p-button-info"
              onClick={handleSaveAsNew}
              title="Creates a new event for this date without overwriting the previous event"
              style={{ flex: 1, minWidth: "220px" }}
            />
          )}
          <Button
            type="button"
            label="Cancel"
            icon="pi pi-times"
            className="p-button-secondary p-button-text"
            onClick={() => navigate(-1)}
          />
        </div>
      </Card>
    </div>
  );
};

export default EventEditor;
