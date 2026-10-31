import React, { useEffect, useState } from "react";
import "./ProjectorWindow.css";

const ProjectorWindow = () => {
  const [currentBlock, setCurrentBlock] = useState(null);
  const [fontSize, setFontSize] = useState("5vh");
  const [activePhraseIndex, setActivePhraseIndex] = useState(null);
  const [highlightPhrase, setHighlightPhrase] = useState(true);

  useEffect(() => {
    // Listen for projection updates
    const bc = new BroadcastChannel('projection_sync');
    bc.onmessage = (event) => {
      if (event.data.type === 'UPDATE_LYRICS') {
        setCurrentBlock(event.data.payload.block);
        if (event.data.payload.fontSize) setFontSize(event.data.payload.fontSize);
        if (event.data.payload.activePhraseIndex !== undefined) {
          setActivePhraseIndex(event.data.payload.activePhraseIndex);
        }
        if (event.data.payload.highlightPhrase !== undefined) {
          setHighlightPhrase(Boolean(event.data.payload.highlightPhrase));
        }
      } else if (event.data.type === 'UPDATE_PHRASE') {
        if (event.data.payload.activePhraseIndex !== undefined) {
          setActivePhraseIndex(event.data.payload.activePhraseIndex);
        }
        if (event.data.payload.highlightPhrase !== undefined) {
          setHighlightPhrase(Boolean(event.data.payload.highlightPhrase));
        }
      } else if (event.data.type === 'CLEAR_LYRICS') {
        setCurrentBlock(null);
        setActivePhraseIndex(null);
      } else if (event.data.type === 'UPDATE_CONFIG') {
        if (event.data.payload.fontSize) setFontSize(event.data.payload.fontSize);
        if (event.data.payload.highlightPhrase !== undefined) {
          setHighlightPhrase(Boolean(event.data.payload.highlightPhrase));
        }
        if (event.data.payload.activePhraseIndex !== undefined) {
          setActivePhraseIndex(event.data.payload.activePhraseIndex);
        }
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

  const hasThreeTranslations = Boolean(
    currentBlock &&
      currentBlock.pt?.length &&
      currentBlock.de?.length &&
      currentBlock.third?.length
  );

  return (
    <div className="projector-container">
      {currentBlock && (
        <div
          className={`lyrics-block ${hasThreeTranslations ? 'three-translations' : ''}`}
          style={{ fontSize: fontSize }}
        >
          {currentBlock.pt && currentBlock.pt.map((line, i) => {
            const isHighlighted = highlightPhrase && activePhraseIndex === i;
            const isDimmed = highlightPhrase && activePhraseIndex !== null && activePhraseIndex !== i;
            const isRef = currentBlock.isBible && line.startsWith('— ');
            return (
              <div 
                key={`pt-${i}`} 
                className={`lyric-line pt-line ${isRef ? 'bible-ref-line' : ''} ${isHighlighted ? 'phrase-active' : ''} ${isDimmed ? 'phrase-dimmed' : ''}`}
              >
                {line}
              </div>
            );
          })}
          {currentBlock.de && currentBlock.de.map((line, i) => {
            const isHighlighted = highlightPhrase && activePhraseIndex === i;
            const isDimmed = highlightPhrase && activePhraseIndex !== null && activePhraseIndex !== i;
            const isRef = currentBlock.isBible && line.startsWith('— ');
            return (
              <div 
                key={`de-${i}`} 
                className={`lyric-line de-line ${isRef ? 'bible-ref-line' : ''} ${isHighlighted ? 'phrase-active' : ''} ${isDimmed ? 'phrase-dimmed' : ''}`}
              >
                {line}
              </div>
            );
          })}
          {currentBlock.third && currentBlock.third.map((line, i) => {
            const isHighlighted = highlightPhrase && activePhraseIndex === i;
            const isDimmed = highlightPhrase && activePhraseIndex !== null && activePhraseIndex !== i;
            const isRef = currentBlock.isBible && line.startsWith('— ');
            return (
              <div 
                key={`third-${i}`} 
                className={`lyric-line third-line ${isRef ? 'bible-ref-line' : ''} ${isHighlighted ? 'phrase-active' : ''} ${isDimmed ? 'phrase-dimmed' : ''}`}
              >
                {line}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectorWindow;
