// =============== EventEditor.js (Fixed & Enhanced) ===============

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "primereact/card";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { fetchSongs } from "../services/SongService";
import { addEvent, fetchEventById, updateEvent } from "../services/EventService";
import { ProgressSpinner } from "primereact/progressspinner";
import "./EventEditor.css";


const EventEditor = () => {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(null);
  const [songs, setSongs] = useState([]);
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  console.log("Editing event with ID:", id);

  useEffect(() => {
    const loadData = async () => {
      const loadedSongs = await fetchSongs();
      setSongs(loadedSongs);

      if (id) {
        const event = await fetchEventById(id);
        if (event) {
          setEventName(event.name);
          setEventDate(new Date(event.date.seconds * 1000));
          setSelectedSongIds(event.songs || []);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleSubmit = async () => {
    const data = {
      name: eventName,
      date: eventDate,
      songs: selectedSongIds,
    };

    if (id) {
      await updateEvent(id, data);
    } else {
      await addEvent(data);
    }
    navigate("/");
  };

  const handleSongToggle = (songId) => {
    const exists = selectedSongIds.includes(songId);
    const newSelection = exists
      ? selectedSongIds.filter((id) => id !== songId)
      : [...selectedSongIds, songId];
    setSelectedSongIds(newSelection);
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
      <Card title={id ? "Edit Event" : "Create Event"} className="event-editor-card">
        <div className="form-group">
          <label>Event Name</label>
          <InputText value={eventName} onChange={(e) => setEventName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Event Date</label>
          <Calendar value={eventDate} onChange={(e) => setEventDate(e.value)} showIcon />
        </div>
        <div className="form-group">
          <label>Select Songs</label>
          <div className="song-checkboxes">
            {songs.map((song) => (
              <div key={song.id} className="checkbox-item">
                <Checkbox
                  inputId={song.id}
                  value={song.id}
                  onChange={() => handleSongToggle(song.id)}
                  checked={selectedSongIds.includes(song.id)}
                />
                <label htmlFor={song.id}>{song.song}</label>
              </div>
            ))}
          </div>
        </div>
        <Button label="Save Event" icon="pi pi-save" className="p-button-success save-btn" onClick={handleSubmit} />
      </Card>
    </div>
  );
};

export default EventEditor;
