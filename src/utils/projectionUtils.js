export const getLyricsBlocks = (songData, groupLines) => {
  if (!songData) return [];
  const lyricsPT = songData.lyricsPT || "";
  const lyricsDE = songData.lyricsDE || "";
  
  const blocks = [];
  
  if (groupLines === 0) {
    const blocks1 = lyricsPT.split(/\n\s*\n/).filter(b => b.trim() !== "");
    const blocks2 = lyricsDE.split(/\n\s*\n/).filter(b => b.trim() !== "");
    
    for (let i = 0; i < Math.max(blocks1.length, blocks2.length); i++) {
      const ptLines = (blocks1[i] || "").split("\n").filter(l => l.trim() !== "");
      const deLines = (blocks2[i] || "").split("\n").filter(l => l.trim() !== "");
      if (ptLines.length > 0 || deLines.length > 0) {
        blocks.push({
          id: `v${i+1}`,
          pt: ptLines,
          de: deLines
        });
      }
    }
  } else {
    const lines1 = lyricsPT.split("\n").filter((line) => line.trim() !== "");
    const lines2 = lyricsDE.split("\n").filter((line) => line.trim() !== "");

    let count = 1;
    for (let i = 0; i < Math.max(lines1.length, lines2.length); i += groupLines) {
      const ptLines = lines1.slice(i, i + groupLines);
      const deLines = lines2.slice(i, i + groupLines);
      if (ptLines.length > 0 || deLines.length > 0) {
        blocks.push({
          id: `v${count}`,
          pt: ptLines,
          de: deLines
        });
        count++;
      }
    }
  }
  
  return blocks;
};
