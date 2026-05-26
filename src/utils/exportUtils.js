export const sanitizeText = (text) => {
  if (!text) return "Unknown";
  // Replace all non-alphanumeric characters with underscore, and collapse multiple underscores
  return text.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
};

export const generateOpenLP = (songData, groupLines) => {
  const lyricsPT = songData.lyricsPT || "";
  const lyricsDE = songData.lyricsDE || "";
  const lines1 = lyricsPT.split("\n").filter((line) => line.trim() !== "");
  const lines2 = lyricsDE.split("\n").filter((line) => line.trim() !== "");
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

  xml.push(`  </lyrics>`);
  xml.push(`</song>`);
  return xml.join("\n");
};

export const generateHolyrics = (songData, groupLines) => {
  const lyricsPT = songData.lyricsPT || "";
  const lyricsDE = songData.lyricsDE || "";
  const lines1 = lyricsPT.split("\n").filter((line) => line.trim() !== "");
  const lines2 = lyricsDE.split("\n").filter((line) => line.trim() !== "");
  
  let text = [];
  text.push(`${sanitizeText(songData.song)}`);
  text.push(`${sanitizeText(songData.singer)}`);
  text.push("");

  for (let i = 0; i < Math.max(lines1.length, lines2.length); i += groupLines) {
    const ptGroup = lines1.slice(i, i + groupLines);
    const deGroup = lines2.slice(i, i + groupLines);
    
    ptGroup.forEach(line => text.push(line));
    deGroup.forEach(line => text.push(line));
    
    text.push(""); 
  }
  return text.join("\n");
};
