// Song.js

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { sanitizeText, generateOpenLP as generateOpenLPUtil, generateHolyrics as generateHolyricsUtil } from "../utils/exportUtils";
import "./SongDetails.css";

const Song = () => {
  const { t } = useTranslation();
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
    { label: t("event.single_line"), value: 1 },
    { label: t("event.two_lines"), value: 2 },
    { label: t("event.three_lines"), value: 3 },
    { label: t("event.four_lines"), value: 4 },
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

  const handleTranslate = async (e) => {
    e.preventDefault();
    if (!songData.lyricsPT) {
      alert("Please enter Portuguese lyrics first.");
      return;
    }
    setLoading(true);
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=de&dt=t&q=${encodeURIComponent(songData.lyricsPT)}`;
      const res = await fetch(url);
      const data = await res.json();
      const translated = data[0].map(item => item[0]).join('');
      setSongData((prev) => ({ ...prev, lyricsDE: translated }));
    } catch (err) {
      console.error("Translation error:", err);
      alert("Failed to translate lyrics.");
    }
    setLoading(false);
  };

  const handleYoutubeBlur = async (e) => {
    const url = e.target.value;
    if (!url) return;
    
    // Only auto-fill if fields are empty
    if (songData.singer && songData.song) return;

    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data && data.title) {
        let title = data.title;
        let author = data.author_name;
        
        if (author && author.endsWith(" - Topic")) {
          author = author.replace(" - Topic", "");
        }

        // Attempt to parse "Author - Title" format
        if (title.includes(" - ")) {
          const parts = title.split(" - ");
          author = parts[0].trim();
          title = parts.slice(1).join(" - ").split("(")[0].split("[")[0].trim();
        } else {
          title = title.split("(")[0].split("[")[0].trim();
        }

        setSongData((prev) => ({
          ...prev,
          singer: prev.singer || author || "",
          song: prev.song || title || ""
        }));
      }
    } catch (err) {
      console.error("Error fetching YouTube details:", err);
    }
  };

  const combineLyrics = () => {
    setCombinedLyrics(generateOpenLPUtil(songData, groupLines));
  };

  const generateHolyrics = () => {
    setHolyricsContent(generateHolyricsUtil(songData, groupLines));
  };

  const saveAsXml = () => {
    const blob = new Blob([combinedLyrics], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeText(songData.song)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAsHolyrics = () => {
    const blob = new Blob([holyricsContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeText(songData.song)}_holyrics.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="song-details-container">
      <Card title={id ? t("song.edit_title") : t("song.add_title")}>
        {[
          { label: t("song.singer"), name: "singer" },
          { label: t("song.song_title"), name: "song" },
          { label: t("song.lyrics") + " (Portuguese)", name: "lyricsPT", textarea: true },
          { label: t("song.lyrics") + " (German)", name: "lyricsDE", textarea: true, isTranslation: true },
          { label: "YouTube Link", name: "youtubeLink", isYoutube: true },
          { label: "YouTube (Family)", name: "youtubeLinkFamily" },
          { label: "Additional Notes", name: "additionalNotes", textarea: true },
          { label: "Cifra Link", name: "cifraLink" },
        ].map((field) => (
          <div className="form-group" key={field.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>{field.label}</label>
              {field.isTranslation && (
                <Button 
                  label="Auto-Translate from PT" 
                  icon="pi pi-language" 
                  className="p-button-sm p-button-info p-button-outlined" 
                  onClick={handleTranslate} 
                  style={{ padding: '0.2rem 0.5rem' }}
                />
              )}
            </div>
            {field.textarea ? (
              <InputTextarea name={field.name} value={songData[field.name]} onChange={handleChange} rows={4} />
            ) : (
              <InputText 
                name={field.name} 
                value={songData[field.name]} 
                onChange={handleChange} 
                onBlur={field.isYoutube ? handleYoutubeBlur : undefined} 
              />
            )}
          </div>
        ))}

        <div className="form-group">
          <label>{t("event.group_lines")}</label>
          <Dropdown value={groupLines} options={lineOptions} onChange={(e) => setGroupLines(e.value)} />
        </div>

        <div className="button-row">
          <Button label={t("song.save")} icon="pi pi-save" onClick={handleSave} loading={loading} />
          <Button label="Generate OpenLP" icon="pi pi-cog" onClick={combineLyrics} />
          <Button label="Generate Holyrics" icon="pi pi-file" className="p-button-info" onClick={generateHolyrics} />
          <Button label={t("song.cancel")} icon="pi pi-times" className="p-button-secondary" onClick={handleClose} />
          {id && <Button label={t("dashboard.delete")} icon="pi pi-trash" className="p-button-danger" onClick={handleDelete} />}
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