import React, { useEffect, useState } from "react";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { fetchEvents } from "../services/EventService";
import "./EventHistory.css";

const EventHistory = () => {
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      const allEvents = await fetchEvents();
      const now = new Date().setHours(0, 0, 0, 0);
      const past = allEvents.filter(
        (e) => new Date(e.date.seconds * 1000).setHours(0, 0, 0, 0) < now
      );
      const sorted = past.sort((a, b) => new Date(b.date.seconds * 1000) - new Date(a.date.seconds * 1000));
      setEvents(allEvents);
      setPastEvents(sorted);
    };
    loadEvents();
  }, []);

  const getHighlightedDates = () => {
    return pastEvents.map((e) => new Date(e.date.seconds * 1000));
  };

  const formatDate = (date) => new Date(date.seconds * 1000).toLocaleDateString();

  const filteredByDate = selectedDate
    ? pastEvents.filter(
        (e) => new Date(e.date.seconds * 1000).toDateString() === selectedDate.toDateString()
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

      {pastEvents.length > 0 && (
        <Card title="Most Recent Past Event" className="history-card">
          <p><strong>Name:</strong> {pastEvents[0].name}</p>
          <p><strong>Date:</strong> {formatDate(pastEvents[0].date)}</p>
        </Card>
      )}

      {selectedDate && (
        <Card title={`Events on ${selectedDate.toLocaleDateString()}`} className="history-card">
          {filteredByDate.length > 0 ? (
            <ul>
              {filteredByDate.map((e) => (
                <li key={e.id}>{e.name}</li>
              ))}
            </ul>
          ) : (
            <p>No events on this date.</p>
          )}
        </Card>
      )}
    </div>
  );
};

export default EventHistory;
