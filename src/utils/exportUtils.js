export const sanitizeText = (text) => {
  if (!text) return "Unknown";
  // Replace all non-alphanumeric characters with underscore, and collapse multiple underscores
  return text.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
};

export const generateOpenLP = (songData, groupLines) => {
  const lyricsPT = songData.lyricsPT || "";
  const lyricsDE = songData.lyricsDE || "";
  const xml = [];

  xml.push(`<?xml version='1.0' encoding='UTF-8'?>`);
  xml.push(`<song xmlns="http://openlyrics.info/namespace/2009/song" version="0.8">`);
  xml.push(`  <properties>`);
  xml.push(`    <titles><title>${sanitizeText(songData.song)} &lt;PT/DE&gt;</title></titles>`);
  xml.push(`    <authors><author>${sanitizeText(songData.singer)}</author></authors>`);
  xml.push(`  </properties>`);
  xml.push(`  <format><tags application="OpenLP"><tag name="tr1"><open>&lt;span style='-webkit-text-fill-color:yellow;'&gt;</open><close>&lt;/span&gt;</close></tag></tags></format>`);
  xml.push(`  <lyrics>`);

  let count = 1;

  if (groupLines === 0) {
    const blocks1 = lyricsPT.split(/\n\s*\n/).filter(b => b.trim() !== "");
    const blocks2 = lyricsDE.split(/\n\s*\n/).filter(b => b.trim() !== "");
    
    for (let i = 0; i < Math.max(blocks1.length, blocks2.length); i++) {
      const pt = (blocks1[i] || "").replace(/\n/g, "<br/>");
      const de = (blocks2[i] || "").replace(/\n/g, "<br/>");
      if (pt || de) {
        xml.push(
          `    <verse name="v${count}"><lines>${pt}${pt && de ? '<br/>' : ''}<tag name="tr1">${de}</tag></lines></verse>`
        );
        count++;
      }
    }
  } else {
    const lines1 = lyricsPT.split("\n").filter((line) => line.trim() !== "");
    const lines2 = lyricsDE.split("\n").filter((line) => line.trim() !== "");

    for (let i = 0; i < Math.max(lines1.length, lines2.length); i += groupLines) {
      const pt = lines1.slice(i, i + groupLines).join("<br/>");
      const de = lines2.slice(i, i + groupLines).join("<br/>");
      if (pt || de) {
        xml.push(
          `    <verse name="v${count}"><lines>${pt}${pt && de ? '<br/>' : ''}<tag name="tr1">${de}</tag></lines></verse>`
        );
        count++;
      }
    }
  }

  xml.push(`  </lyrics>`);
  xml.push(`</song>`);
  return xml.join("\n");
};

export const generateHolyrics = (songData, groupLines) => {
  const lyricsPT = songData.lyricsPT || "";
  const lyricsDE = songData.lyricsDE || "";
  
  let text = [];
  text.push(`${sanitizeText(songData.song)}`);
  text.push(`${sanitizeText(songData.singer)}`);
  text.push("");

  if (groupLines === 0) {
    const blocks1 = lyricsPT.split(/\n\s*\n/).filter(b => b.trim() !== "");
    const blocks2 = lyricsDE.split(/\n\s*\n/).filter(b => b.trim() !== "");
    
    for (let i = 0; i < Math.max(blocks1.length, blocks2.length); i++) {
      const ptGroup = (blocks1[i] || "").split("\n").filter(l => l.trim() !== "");
      const deGroup = (blocks2[i] || "").split("\n").filter(l => l.trim() !== "");
      
      ptGroup.forEach(line => text.push(line));
      deGroup.forEach(line => text.push(line));
      
      text.push(""); 
    }
  } else {
    const lines1 = lyricsPT.split("\n").filter((line) => line.trim() !== "");
    const lines2 = lyricsDE.split("\n").filter((line) => line.trim() !== "");

    for (let i = 0; i < Math.max(lines1.length, lines2.length); i += groupLines) {
      const ptGroup = lines1.slice(i, i + groupLines);
      const deGroup = lines2.slice(i, i + groupLines);
      
      ptGroup.forEach(line => text.push(line));
      deGroup.forEach(line => text.push(line));
      
      text.push(""); 
    }
  }
  
  return text.join("\n");
};
