// Song.js

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { db } from "../services/firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import "./SongDetails.css";

const Song = () => {
  const [songData, setSongData] = useState({
    singer: "",
    song: "",
    lyricsPT: "",
    lyricsDE: "",
    youtubeLink: "",
    youtubeLinkFamily: "",
    additionalNotes: "",
    cifraLink: "",
  });
  const [initialSongData, setInitialSongData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [combinedLyrics, setCombinedLyrics] = useState("");
  const [holyricsContent, setHolyricsContent] = useState(""); 
  const [groupLines, setGroupLines] = useState(1);
  const { id } = useParams();
  const navigate = useNavigate();

  const lineOptions = [
    { label: "Single line", value: 1 },
    { label: "Two lines", value: 2 },
    { label: "Three lines", value: 3 },
    { label: "Four lines", value: 4 },
  ];

  useEffect(() => {
    if (id) {
      const fetchSong = async () => {
        const ref = doc(db, "songs", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setSongData(data);
          setInitialSongData(data);
        }
      };
      fetchSong();
    } else {
      setInitialSongData(songData);
    }
  }, [id]);

  const handleChange = (e) => {
    setSongData({ ...songData, [e.target.name]: e.target.value });
  };

  const hasChanges = () =>
    JSON.stringify(songData) !== JSON.stringify(initialSongData);

  const handleClose = () => {
    if (!hasChanges()) {
      navigate("/");
    } else {
      const confirmSave = window.confirm(
        "You have unsaved changes. Save before closing?"
      );
      if (confirmSave) {
        handleSave();
      } else {
        navigate("/");
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (id) {
        await updateDoc(doc(db, "songs", id), songData);
      } else {
        await addDoc(collection(db, "songs"), songData);
      }
      navigate("/");
    } catch (err) {
      alert("Error saving song.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this song?")) {
      await deleteDoc(doc(db, "songs", id));
      navigate("/");
    }
  };

  const combineLyrics = () => {
    const lines1 = songData.lyricsPT.split("\n").filter((line) => line.trim() !== "");
    const lines2 = songData.lyricsDE.split("\n").filter((line) => line.trim() !== "");
    const xml = [];

    xml.push(`<?xml version='1.0' encoding='UTF-8'?>`);
    xml.push(`<song xmlns="http://openlyrics.info/namespace/2009/song" version="0.8">`);
    xml.push(`  <properties>`);
    xml.push(`    <titles><title>${songData.song} &lt;PT/DE&gt;</title></titles>`);
    xml.push(`    <authors><author>${songData.singer}</author></authors>`);
    xml.push(`  </properties>`);
    xml.push(`  <format><tags application="OpenLP"><tag name="tr1"><open>&lt;span style='-webkit-text-fill-color:yellow;'&gt;</open><close>&lt;/span&gt;</close></tag></tags></format>`);
    xml.push(`  <lyrics>`);

    let count = 1;
    for (let i = 0; i < Math.max(lines1.length, lines2.length); i += groupLines) {
      const pt = lines1.slice(i, i + groupLines).join("<br/>");
      const de = lines2.slice(i, i + groupLines).join("<br/>");
      if (pt && de) {
        xml.push(
          `    <verse name="v${count}"><lines>${pt}<br/><tag name="tr1">${de}</tag></lines></verse>`
        );
        count++;
      }
    }

    xml.push(`  </lyrics>`);
    xml.push(`</song>`);
    setCombinedLyrics(xml.join("\n"));
  };

  // Modified function to remove "Verse" and numbers
  const generateHolyrics = () => {
    const lines1 = songData.lyricsPT.split("\n").filter((line) => line.trim() !== "");
    const lines2 = songData.lyricsDE.split("\n").filter((line) => line.trim() !== "");
    
    let text = [];
    text.push(`${songData.song}`);
    text.push(`${songData.singer}`);
    text.push(""); // Empty line after metadata

    for (let i = 0; i < Math.max(lines1.length, lines2.length); i += groupLines) {
      // Verse label removed here
      const ptGroup = lines1.slice(i, i + groupLines);
      const deGroup = lines2.slice(i, i + groupLines);
      
      ptGroup.forEach(line => text.push(line));
      deGroup.forEach(line => text.push(line));
      
      text.push(""); // Empty line to signal a new slide in Holyrics
    }
    setHolyricsContent(text.join("\n"));
  };

  const saveAsXml = () => {
    const blob = new Blob([combinedLyrics], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${songData.song || "lyrics"}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAsHolyrics = () => {
    const blob = new Blob([holyricsContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${songData.song || "lyrics"}_holyrics.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="song-details-container">
      <Card title={id ? "Edit Song" : "Add New Song"}>
        {[
          { label: "Singer", name: "singer" },
          { label: "Song Title", name: "song" },
          { label: "Lyrics (Portuguese)", name: "lyricsPT", textarea: true },
          { label: "Lyrics (German)", name: "lyricsDE", textarea: true },
          { label: "YouTube Link", name: "youtubeLink" },
          { label: "YouTube (Family)", name: "youtubeLinkFamily" },
          { label: "Additional Notes", name: "additionalNotes", textarea: true },
          { label: "Cifra Link", name: "cifraLink" },
        ].map((field) => (
          <div className="form-group" key={field.name}>
            <label>{field.label}</label>
            {field.textarea ? (
              <InputTextarea name={field.name} value={songData[field.name]} onChange={handleChange} rows={4} />
            ) : (
              <InputText name={field.name} value={songData[field.name]} onChange={handleChange} />
            )}
          </div>
        ))}

        <div className="form-group">
          <label>Group Lines</label>
          <Dropdown value={groupLines} options={lineOptions} onChange={(e) => setGroupLines(e.value)} />
        </div>

        <div className="button-row">
          <Button label="Save" icon="pi pi-save" onClick={handleSave} loading={loading} />
          <Button label="Generate OpenLP" icon="pi pi-cog" onClick={combineLyrics} />
          <Button label="Generate Holyrics" icon="pi pi-file" className="p-button-info" onClick={generateHolyrics} />
          <Button label="Close" icon="pi pi-times" className="p-button-secondary" onClick={handleClose} />
          {id && <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={handleDelete} />}
        </div>

        {combinedLyrics && (
          <div className="export-section">
            <div className="form-group">
              <label>Combined Lyrics (OpenLP XML)</label>
              <InputTextarea value={combinedLyrics} rows={8} readOnly />
            </div>
            <Button label="Download XML" icon="pi pi-download" className="p-button-secondary" onClick={saveAsXml} />
          </div>
        )}

        {holyricsContent && (
          <div className="export-section" style={{marginTop: '1rem'}}>
            <div className="form-group">
              <label>Holyrics Format (Plain Text)</label>
              <InputTextarea value={holyricsContent} rows={8} readOnly />
            </div>
            <Button label="Download TXT" icon="pi pi-download" className="p-button-info" onClick={saveAsHolyrics} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Song;