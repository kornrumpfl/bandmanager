import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { fetchEvents, deleteEvent } from "../services/EventService";
import { fetchSongs } from "../services/SongService";
import "./Dashboard.css";

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [songs, setSongs] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const eventData = await fetchEvents();
      const songData = await fetchSongs();

      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      const upcoming = eventData.filter((e) => {
        const eventDate = new Date(e.date.seconds * 1000);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= todayMidnight;
      });

      const sorted = upcoming.sort(
        (a, b) => new Date(a.date.seconds * 1000) - new Date(b.date.seconds * 1000)
      );

      setEvents(sorted);
      setSongs(songData);
    };

    loadData();
  }, []);

  const getSongTitles = (songIds) => {
    return songIds.map((id) => {
      const song = songs.find((s) => s.id === id);
      return song ? song.song : "(deleted song)";
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <Button
          label="Create Event"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate("/event/new")}
        />
      </div>

      <div className="dashboard-columns">
        {/* Events Column */}
        <div className="dashboard-column">
          <h3>Upcoming Events</h3>
          {events.map((event) => (
            <Card key={event.id} title={event.name} className="event-card">
              <p>Date: {new Date(event.date.seconds * 1000).toLocaleDateString()}</p>
              <strong>Songs:</strong>
              <ul>
                {getSongTitles(event.songs || []).map((title, index) => (
                  <li
                  key={index}
                  className="clickable-song"
                  onClick={() => {
                    const song = songs.find((s) => s.song === title);
                    if (song) navigate(`/song/${song.id}`);
                  }}
                >
                  {title}
                </li>
                ))}
              </ul>
              <div className="card-actions">
                <Button
                  label="Edit"
                  icon="pi pi-pencil"
                  onClick={() => navigate(`/event/${event.id}`)}
                />
                <Button
                  label="Delete"
                  icon="pi pi-trash"
                  className="p-button-danger"
                  onClick={() => handleDelete(event.id)}
                />
              </div>
            </Card>
          ))}
        </div>

{/* SONGS COLUMN */}
<div className="dashboard-column">
  <h3>All Songs</h3>

  {/* Search Input */}
  <div className="form-group">
    <input
      type="text"
      placeholder="Search by title or singer..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="search-input"
    />
  </div>

  {/* Scrollable Filtered List */}
  <div className="scroll-list">
    {songs
      .filter((song) => {
        const term = searchTerm.toLowerCase();
        return (
          song.song.toLowerCase().includes(term) ||
          song.singer.toLowerCase().includes(term)
        );
      })
      .map((song) => (
        <Card
          key={song.id}
          title={song.song}
          className="song-card"
          onDoubleClick={() => navigate(`/song/${song.id}`)}
        >
          <p><strong>Singer:</strong> {song.singer}</p>
        </Card>
      ))}
  </div>
</div>
</div>
      <div className="dashboard-footer">
        <small>Band Manager v2.2</small>
      </div>


    </div>
  );
};

export default Dashboard;
