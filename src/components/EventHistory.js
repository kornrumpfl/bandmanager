import React, { useEffect, useState } from "react";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { fetchEvents } from "../services/EventService";
import { fetchSongs } from "../services/SongService";
import "./EventHistory.css";

const EventHistory = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [allSongs, setAllSongs] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [events, songs] = await Promise.all([fetchEvents(), fetchSongs()]);
      setAllSongs(songs);

      const today = new Date().setHours(0, 0, 0, 0);
      const past = events
        .filter((e) => new Date(e.date.seconds * 1000).setHours(0, 0, 0, 0) < today)
        .sort((a, b) => new Date(b.date.seconds * 1000) - new Date(a.date.seconds * 1000));

      setPastEvents(past);
    };

    loadData();
  }, []);

  const getSongTitle = (id) => {
    const song = allSongs.find((s) => s.id === id);
    return song ? song.song : "(unknown song)";
  };

  const formatDate = (ts) =>
    new Date(ts.seconds * 1000).toLocaleDateString();

  const getHighlightedDates = () => {
    return pastEvents.map((e) => new Date(e.date.seconds * 1000));
  };

  const filteredByDate = selectedDate
    ? pastEvents.filter(
        (e) =>
          new Date(e.date.seconds * 1000).toDateString() ===
          selectedDate.toDateString()
      )
    : [];

  return (
    <div className="history-container">
      <h2>Past Events</h2>

      <Calendar
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.value)}
        inline
        dateTemplate={({ day, month, year }) => {
          const date = new Date(year, month, day);
          const isHighlighted = getHighlightedDates().some(
            (d) => d.toDateString() === date.toDateString()
          );
          return (
            <div className={`custom-date ${isHighlighted ? "highlighted" : ""}`}>
              {date.getDate()}
            </div>
          );
        }}
      />

      {selectedDate && (
        <Card
          title={`Events on ${selectedDate.toLocaleDateString()}`}
          className="history-card"
        >
          {filteredByDate.length > 0 ? (
            filteredByDate.map((event) => (
              <div key={event.id} className="event-block">
                <p><strong>{event.name}</strong> — {formatDate(event.date)}</p>
                <ul>
                  {(event.songs || []).map((songId) => (
                    <li key={songId}>🎵 {getSongTitle(songId)}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p>No events on this date.</p>
          )}
        </Card>
      )}
    </div>
  );
};

export default EventHistory;
