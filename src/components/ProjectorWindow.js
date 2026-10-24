import React, { useEffect, useState } from "react";
import { renderHighlightedLine } from "../utils/lyricsMatcher";
import "./ProjectorWindow.css";

const ProjectorWindow = () => {
  const [currentBlock, setCurrentBlock] = useState(null);
  const [fontSize, setFontSize] = useState("5vh");
  const [highlightedWords, setHighlightedWords] = useState([]);

  useEffect(() => {
    // Listen for projection updates
    const bc = new BroadcastChannel('projection_sync');
    bc.onmessage = (event) => {
      if (event.data.type === 'UPDATE_LYRICS') {
        setCurrentBlock(event.data.payload.block);
        if (event.data.payload.fontSize) setFontSize(event.data.payload.fontSize);
        setHighlightedWords(event.data.payload.highlightedWords || []);
      } else if (event.data.type === 'UPDATE_HIGHLIGHT') {
        setHighlightedWords(event.data.payload.highlightedWords || []);
      } else if (event.data.type === 'CLEAR_LYRICS') {
        setCurrentBlock(null);
        setHighlightedWords([]);
      } else if (event.data.type === 'UPDATE_CONFIG') {
        if (event.data.payload.fontSize) setFontSize(event.data.payload.fontSize);
      }
    };
    
    // Attempt to request fullscreen when loaded
    const requestFullScreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Could not request fullscreen:", err);
      }
    };
    
    // Browsers often require user interaction for fullscreen, 
    // so we can also add a click handler on the body as fallback.
    document.body.addEventListener('click', requestFullScreen, { once: true });

    return () => {
      bc.close();
      document.body.removeEventListener('click', requestFullScreen);
    };
  }, []);

  return (
    <div className="projector-container">
      {currentBlock && (
        <div className="lyrics-block" style={{ fontSize: fontSize }}>
          {currentBlock.pt && currentBlock.pt.map((line, i) => (
            <div key={`pt-${i}`} className="lyric-line pt-line">
              {renderHighlightedLine(line, highlightedWords)}
            </div>
          ))}
          {currentBlock.de && currentBlock.de.map((line, i) => (
            <div key={`de-${i}`} className="lyric-line de-line">
              {renderHighlightedLine(line, highlightedWords)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectorWindow;
