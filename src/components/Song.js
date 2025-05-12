import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { db } from "../services/firebaseConfig";
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
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
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  // Load song if editing
  useEffect(() => {
    if (id) {
      const fetchSong = async () => {
        const ref = doc(db, "songs", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setSongData(snap.data());
        }
      };
      fetchSong();
    }
  }, [id]);

  const handleChange = (e) => {
    setSongData({ ...songData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (id) {
        const ref = doc(db, "songs", id);
        await updateDoc(ref, songData);
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
    const confirm = window.confirm("Are you sure you want to delete this song?");
    if (confirm) {
      await deleteDoc(doc(db, "songs", id));
      navigate("/");
    }
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
              <InputTextarea
                name={field.name}
                value={songData[field.name]}
                onChange={handleChange}
                rows={4}
              />
            ) : (
              <InputText name={field.name} value={songData[field.name]} onChange={handleChange} />
            )}
          </div>
        ))}

        <div className="button-row">
          <Button label="Save" icon="pi pi-save" onClick={handleSave} loading={loading} />
          {id && <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={handleDelete} />}
        </div>
      </Card>
    </div>
  );
};

export default Song;
