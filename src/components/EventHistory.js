import React, { useEffect, useState } from "react";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fetchEvents } from "../services/EventService";
import { fetchSongs } from "../services/SongService";
import "./EventHistory.css";

const EventHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' | 'all'

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

  const formatDate = (ts) => {
    if (!ts || !ts.seconds) return "";
    return new Date(ts.seconds * 1000).toLocaleDateString();
  };

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

  const filteredAllEvents = pastEvents.filter((ev) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    const nameMatch = (ev.name || "").toLowerCase().includes(term);
    const dateMatch = formatDate(ev.date).includes(term);
    const songMatch = (ev.songs || []).some((sId) =>
      getSongTitle(sId).toLowerCase().includes(term)
    );
    return nameMatch || dateMatch || songMatch;
  });

  return (
    <div className="history-container">
      <div className="history-header-row">
        <div>
          <h2>{t("history.title") || "Event History"}</h2>
          <p className="history-subtitle">
            Browse previous events, edit dates, or reuse song setlists for new service dates.
          </p>
        </div>
        <div className="history-view-toggles">
          <Button
            type="button"
            icon="pi pi-calendar"
            label="Calendar View"
            className={`p-button-sm ${viewMode === "calendar" ? "p-button-primary" : "p-button-outlined p-button-secondary"}`}
            onClick={() => setViewMode("calendar")}
          />
          <Button
            type="button"
            icon="pi pi-list"
            label={`All Events (${pastEvents.length})`}
            className={`p-button-sm ${viewMode === "all" ? "p-button-primary" : "p-button-outlined p-button-secondary"}`}
            onClick={() => setViewMode("all")}
          />
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="history-calendar-layout">
          <div className="calendar-column">
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
            <small style={{ color: "#94a3b8", display: "block", marginTop: "8px" }}>
              🔴 Red dates indicate days with past events. Click on a date to inspect and edit.
            </small>
          </div>

          <div className="history-details-column">
            {selectedDate ? (
              <Card
                title={`Events on ${selectedDate.toLocaleDateString()}`}
                className="history-card"
              >
                {filteredByDate.length > 0 ? (
                  filteredByDate.map((event) => (
                    <div key={event.id} className="event-history-card-item">
                      <div className="event-info-header">
                        <div>
                          <h3 className="event-item-title">{event.name}</h3>
                          <span className="event-item-date">
                            <i className="pi pi-calendar" style={{ marginRight: "4px" }} />
                            {formatDate(event.date)}
                          </span>
                        </div>
                        <div className="event-actions-row">
                          <Button
                            type="button"
                            icon="pi pi-pencil"
                            label="Edit Date / Event"
                            className="p-button-sm p-button-outlined p-button-warning"
                            onClick={() => navigate(`/event/${event.id}`)}
                            title="Edit this event and change its date"
                          />
                          <Button
                            type="button"
                            icon="pi pi-copy"
                            label="Reuse on New Date"
                            className="p-button-sm p-button-success"
                            onClick={() => navigate(`/event/new?cloneFrom=${event.id}`)}
                            title="Copy these songs to a new date"
                          />
                        </div>
                      </div>

                      <div className="event-songs-summary">
                        <strong>Songs ({event.songs ? event.songs.length : 0}):</strong>
                        <ul className="history-songs-list">
                          {(event.songs || []).map((songId) => (
                            <li key={songId}>🎵 {getSongTitle(songId)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    <i className="pi pi-info-circle" style={{ fontSize: "1.5rem", marginBottom: "8px" }} />
                    <p>No past events recorded on this date.</p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="history-card">
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  <i className="pi pi-calendar-plus" style={{ fontSize: "2rem", marginBottom: "12px", opacity: 0.6 }} />
                  <h4>Select a date on the calendar</h4>
                  <p>Or switch to &ldquo;All Events&rdquo; tab above to search and reuse any past service.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* All Events List View with Search */
        <div className="all-events-view">
          <div className="all-events-search-bar">
            <i className="pi pi-search" />
            <InputText
              placeholder="Search past events by name, date, or song title..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="all-events-grid">
            {filteredAllEvents.map((event) => (
              <div key={event.id} className="event-history-grid-card">
                <div className="grid-card-header">
                  <div>
                    <h3 className="grid-card-title">{event.name}</h3>
                    <span className="grid-card-date">
                      <i className="pi pi-calendar" /> {formatDate(event.date)}
                    </span>
                  </div>
                  <span className="grid-songs-count">
                    {event.songs ? event.songs.length : 0} songs
                  </span>
                </div>

                <div className="grid-card-body">
                  <ul className="grid-songs-list">
                    {(event.songs || []).slice(0, 5).map((songId) => (
                      <li key={songId}>🎵 {getSongTitle(songId)}</li>
                    ))}
                    {(event.songs || []).length > 5 && (
                      <li className="grid-more-songs">
                        + {(event.songs.length - 5)} more songs...
                      </li>
                    )}
                  </ul>
                </div>

                <div className="grid-card-footer">
                  <Button
                    type="button"
                    icon="pi pi-pencil"
                    label="Edit Date"
                    className="p-button-sm p-button-outlined p-button-warning"
                    onClick={() => navigate(`/event/${event.id}`)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="button"
                    icon="pi pi-copy"
                    label="Reuse on New Date"
                    className="p-button-sm p-button-success"
                    onClick={() => navigate(`/event/new?cloneFrom=${event.id}`)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            ))}

            {filteredAllEvents.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", gridColumn: "1 / -1" }}>
                <p>No past events found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventHistory;
