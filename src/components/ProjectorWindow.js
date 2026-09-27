import React, { useEffect, useState } from "react";
import "./ProjectorWindow.css";

const ProjectorWindow = () => {
  const [currentBlock, setCurrentBlock] = useState(null);

  useEffect(() => {
    // Listen for projection updates
    const bc = new BroadcastChannel('projection_sync');
    bc.onmessage = (event) => {
      if (event.data.type === 'UPDATE_LYRICS') {
        setCurrentBlock(event.data.payload);
      } else if (event.data.type === 'CLEAR_LYRICS') {
        setCurrentBlock(null);
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
        <div className="lyrics-block">
          {currentBlock.pt && currentBlock.pt.map((line, i) => (
            <div key={`pt-${i}`} className="lyric-line pt-line">{line}</div>
          ))}
          {currentBlock.de && currentBlock.de.map((line, i) => (
            <div key={`de-${i}`} className="lyric-line de-line">{line}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectorWindow;
