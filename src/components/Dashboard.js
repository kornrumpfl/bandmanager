import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { useNavigate } from "react-router-dom";
import { fetchEvents, deleteEvent, updateEvent } from "../services/EventService";
import { fetchSongs } from "../services/SongService";
import { generateOpenLP, generateHolyrics, sanitizeText } from "../utils/exportUtils";
import "./Dashboard.css";

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [songs, setSongs] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [selectedEventForExport, setSelectedEventForExport] = useState(null);
  const [exportFormat, setExportFormat] = useState("openlp");
  const [exportGroupLines, setExportGroupLines] = useState(1);

  const formatOptions = [
    { label: "OpenLP (XML)", value: "openlp" },
    { label: "Holyrics (TXT)", value: "holyrics" },
  ];

  const lineOptions = [
    { label: "Single line", value: 1 },
    { label: "Two lines", value: 2 },
    { label: "Three lines", value: 3 },
    { label: "Four lines", value: 4 },
  ];

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

  const handleExportAll = () => {
    if (!selectedEventForExport) return;

    const eventSongs = (selectedEventForExport.songs || [])
      .map((id) => songs.find((s) => s.id === id))
      .filter(Boolean);

    eventSongs.forEach((songData, index) => {
      setTimeout(() => {
        let content = "";
        let filename = "";
        let type = "";

        if (exportFormat === "openlp") {
          content = generateOpenLP(songData, exportGroupLines);
          filename = `${sanitizeText(songData.song)}.xml`;
          type = "text/xml";
        } else {
          content = generateHolyrics(songData, exportGroupLines);
          filename = `${sanitizeText(songData.song)}_holyrics.txt`;
          type = "text/plain";
        }

        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, index * 300); // 300ms delay between downloads to prevent browser blocking
    });

    setExportDialogVisible(false);
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
                {/* First Column: Songs */}
                <div style={{ flex: "2 1 200px" }}>
                  <strong>Songs:</strong>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    {getSongTitles(event.songs || []).map((title, index) => (
                      <li
                        key={index}
                        className="clickable-song"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", JSON.stringify({ eventId: event.id, fromIndex: index }));
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          e.preventDefault();
                          try {
                            const data = JSON.parse(e.dataTransfer.getData("text/plain"));
                            if (data.eventId !== event.id) return;
                            
                            const fromIndex = data.fromIndex;
                            const toIndex = index;
                            if (fromIndex === toIndex) return;

                            const newSongs = [...(event.songs || [])];
                            const [moved] = newSongs.splice(fromIndex, 1);
                            newSongs.splice(toIndex, 0, moved);

                            setEvents((prev) =>
                              prev.map((ev) => (ev.id === event.id ? { ...ev, songs: newSongs } : ev))
                            );

                            await updateEvent(event.id, { songs: newSongs });
                          } catch (error) {
                            console.error("Error reordering songs:", error);
                          }
                        }}
                        onClick={() => {
                          const song = songs.find((s) => s.song === title);
                          if (song) navigate(`/song/${song.id}`);
                        }}
                        style={{ cursor: "grab", marginBottom: "0.5rem" }}
                      >
                        <i className="pi pi-bars" style={{ marginRight: "8px", fontSize: "0.9em", color: "#ccc" }}></i>
                        {title}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Second Column: Mixer & Lyrics */}
                <div className="event-roles" style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.2rem" }}>Mixer</label>
                    <input
                      type="text"
                      className="search-input"
                      style={{ marginBottom: 0, padding: "0.4rem", width: "100%" }}
                      defaultValue={event.mixer || ""}
                      onBlur={async (e) => {
                        const val = e.target.value;
                        if (val !== event.mixer) {
                          setEvents((prev) => prev.map((ev) => (ev.id === event.id ? { ...ev, mixer: val } : ev)));
                          await updateEvent(event.id, { mixer: val });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.2rem" }}>Lyrics</label>
                    <input
                      type="text"
                      className="search-input"
                      style={{ marginBottom: 0, padding: "0.4rem", width: "100%" }}
                      defaultValue={event.lyricsRole || ""}
                      onBlur={async (e) => {
                        const val = e.target.value;
                        if (val !== event.lyricsRole) {
                          setEvents((prev) => prev.map((ev) => (ev.id === event.id ? { ...ev, lyricsRole: val } : ev)));
                          await updateEvent(event.id, { lyricsRole: val });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="card-actions">
                <Button
                  label="Edit"
                  icon="pi pi-pencil"
                  onClick={() => navigate(`/event/${event.id}`)}
                />
                <Button
                  label="Export All"
                  icon="pi pi-download"
                  className="p-button-info"
                  onClick={() => {
                    setSelectedEventForExport(event);
                    setExportDialogVisible(true);
                  }}
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
        <small>Band Manager v2.4</small>
      </div>

      <Dialog
        header={`Export Songs: ${selectedEventForExport?.name || ""}`}
        visible={exportDialogVisible}
        style={{ width: "90vw", maxWidth: "400px" }}
        onHide={() => setExportDialogVisible(false)}
      >
        <div className="form-group">
          <label>Format</label>
          <Dropdown
            value={exportFormat}
            options={formatOptions}
            onChange={(e) => setExportFormat(e.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Group Lines</label>
          <Dropdown
            value={exportGroupLines}
            options={lineOptions}
            onChange={(e) => setExportGroupLines(e.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setExportDialogVisible(false)} />
          <Button label="Download All" icon="pi pi-download" className="p-button-success" onClick={handleExportAll} />
        </div>
      </Dialog>
    </div>
  );
};

export default Dashboard;
