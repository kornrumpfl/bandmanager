import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BUILTIN_BIBLES,
  ONLINE_BIBLE_CATALOG,
  getAllCustomBiblesFromDB,
  saveCustomBibleToDB,
  deleteCustomBibleFromDB,
  getSavedMetadataOverrides,
  saveMetadataOverrides,
  parseImportedBibleFile,
  normalizeBibleDataArray,
} from "../services/BibleStorageService";
import "./BibleProjection.css";

export const BIBLE_BOOKS = [
  // Row 1: Pentateuch (5) + Historical Part 1 (6) = 11
  { index: 0, abbrev: "Gn", namePt: "Gênesis", nameDe: "1. Mose", nameEs: "Génesis", nameEn: "Genesis", category: "pentateuch" },
  { index: 1, abbrev: "Ex", namePt: "Êxodo", nameDe: "2. Mose", nameEs: "Éxodo", nameEn: "Exodus", category: "pentateuch" },
  { index: 2, abbrev: "Lv", namePt: "Levítico", nameDe: "3. Mose", nameEs: "Levítico", nameEn: "Leviticus", category: "pentateuch" },
  { index: 3, abbrev: "Nm", namePt: "Números", nameDe: "4. Mose", nameEs: "Números", nameEn: "Numbers", category: "pentateuch" },
  { index: 4, abbrev: "Dt", namePt: "Deuteronômio", nameDe: "5. Mose", nameEs: "Deuteronomio", nameEn: "Deuteronomy", category: "pentateuch" },
  { index: 5, abbrev: "Js", namePt: "Josué", nameDe: "Josua", nameEs: "Josué", nameEn: "Joshua", category: "historical" },
  { index: 6, abbrev: "Jz", namePt: "Juízes", nameDe: "Richter", nameEs: "Jueces", nameEn: "Judges", category: "historical" },
  { index: 7, abbrev: "Rt", namePt: "Rute", nameDe: "Rut", nameEs: "Rut", nameEn: "Ruth", category: "historical" },
  { index: 8, abbrev: "1Sm", namePt: "1 Samuel", nameDe: "1. Samuel", nameEs: "1 Samuel", nameEn: "1 Samuel", category: "historical" },
  { index: 9, abbrev: "2Sm", namePt: "2 Samuel", nameDe: "2. Samuel", nameEs: "2 Samuel", nameEn: "2 Samuel", category: "historical" },
  { index: 10, abbrev: "1Rs", namePt: "1 Reis", nameDe: "1. Könige", nameEs: "1 Reyes", nameEn: "1 Kings", category: "historical" },

  // Row 2: Historical Part 2 (6) + Poetic (5) = 11
  { index: 11, abbrev: "2Rs", namePt: "2 Reis", nameDe: "2. Könige", nameEs: "2 Reyes", nameEn: "2 Kings", category: "historical" },
  { index: 12, abbrev: "1Cr", namePt: "1 Crônicas", nameDe: "1. Chronik", nameEs: "1 Crónicas", nameEn: "1 Chronicles", category: "historical" },
  { index: 13, abbrev: "2Cr", namePt: "2 Crônicas", nameDe: "2. Chronik", nameEs: "2 Crónicas", nameEn: "2 Chronicles", category: "historical" },
  { index: 14, abbrev: "Ed", namePt: "Esdras", nameDe: "Esra", nameEs: "Esdras", nameEn: "Ezra", category: "historical" },
  { index: 15, abbrev: "Ne", namePt: "Neemias", nameDe: "Nehemia", nameEs: "Nehemías", nameEn: "Nehemiah", category: "historical" },
  { index: 16, abbrev: "Et", namePt: "Ester", nameDe: "Ester", nameEs: "Ester", nameEn: "Esther", category: "historical" },
  { index: 17, abbrev: "Jó", namePt: "Jó", nameDe: "Hiob", nameEs: "Job", nameEn: "Job", category: "poetic" },
  { index: 18, abbrev: "Sl", namePt: "Salmos", nameDe: "Psalmen", nameEs: "Salmos", nameEn: "Psalms", category: "poetic" },
  { index: 19, abbrev: "Pv", namePt: "Provérbios", nameDe: "Sprüche", nameEs: "Proverbios", nameEn: "Proverbs", category: "poetic" },
  { index: 20, abbrev: "Ec", namePt: "Eclesiastes", nameDe: "Prediger", nameEs: "Eclesiastés", nameEn: "Ecclesiastes", category: "poetic" },
  { index: 21, abbrev: "Ct", namePt: "Cantares", nameDe: "Hohelied", nameEs: "Cantares", nameEn: "Song of Solomon", category: "poetic" },

  // Row 3: Prophets Part 1 (11)
  { index: 22, abbrev: "Is", namePt: "Isaías", nameDe: "Jesaja", nameEs: "Isaías", nameEn: "Isaiah", category: "prophets" },
  { index: 23, abbrev: "Jr", namePt: "Jeremias", nameDe: "Jeremia", nameEs: "Jeremías", nameEn: "Jeremiah", category: "prophets" },
  { index: 24, abbrev: "Lm", namePt: "Lamentações", nameDe: "Klagelieder", nameEs: "Lamentaciones", nameEn: "Lamentations", category: "prophets" },
  { index: 25, abbrev: "Ez", namePt: "Ezequiel", nameDe: "Hesekiel", nameEs: "Ezequiel", nameEn: "Ezekiel", category: "prophets" },
  { index: 26, abbrev: "Dn", namePt: "Daniel", nameDe: "Daniel", nameEs: "Daniel", nameEn: "Daniel", category: "prophets" },
  { index: 27, abbrev: "Os", namePt: "Oseias", nameDe: "Hosea", nameEs: "Oseas", nameEn: "Hosea", category: "prophets" },
  { index: 28, abbrev: "Jl", namePt: "Joel", nameDe: "Joel", nameEs: "Joel", nameEn: "Joel", category: "prophets" },
  { index: 29, abbrev: "Am", namePt: "Amós", nameDe: "Amos", nameEs: "Amós", nameEn: "Amos", category: "prophets" },
  { index: 30, abbrev: "Ob", namePt: "Obadias", nameDe: "Obadja", nameEs: "Abdías", nameEn: "Obadiah", category: "prophets" },
  { index: 31, abbrev: "Jn", namePt: "Jonas", nameDe: "Jona", nameEs: "Jonás", nameEn: "Jonah", category: "prophets" },
  { index: 32, abbrev: "Mq", namePt: "Miqueias", nameDe: "Micha", nameEs: "Miqueas", nameEn: "Micah", category: "prophets" },

  // Row 4: Prophets Part 2 (6) + Gospels (4) + Acts (1) = 11
  { index: 33, abbrev: "Na", namePt: "Naum", nameDe: "Nahum", nameEs: "Nahúm", nameEn: "Nahum", category: "prophets" },
  { index: 34, abbrev: "Hc", namePt: "Habacuque", nameDe: "Habakuk", nameEs: "Habacuc", nameEn: "Habakkuk", category: "prophets" },
  { index: 35, abbrev: "Sf", namePt: "Sofonias", nameDe: "Zefanja", nameEs: "Sofonías", nameEn: "Zephaniah", category: "prophets" },
  { index: 36, abbrev: "Ag", namePt: "Ageu", nameDe: "Haggai", nameEs: "Hageo", nameEn: "Haggai", category: "prophets" },
  { index: 37, abbrev: "Zc", namePt: "Zacarias", nameDe: "Sacharja", nameEs: "Zacarías", nameEn: "Zechariah", category: "prophets" },
  { index: 38, abbrev: "Ml", namePt: "Malaquias", nameDe: "Maleachi", nameEs: "Malaquías", nameEn: "Malachi", category: "prophets" },
  { index: 39, abbrev: "Mt", namePt: "Mateus", nameDe: "Matthäus", nameEs: "Mateo", nameEn: "Matthew", category: "gospels" },
  { index: 40, abbrev: "Mc", namePt: "Marcos", nameDe: "Markus", nameEs: "Marcos", nameEn: "Mark", category: "gospels" },
  { index: 41, abbrev: "Lc", namePt: "Lucas", nameDe: "Lukas", nameEs: "Lucas", nameEn: "Luke", category: "gospels" },
  { index: 42, abbrev: "Jo", namePt: "João", nameDe: "Johannes", nameEs: "Juan", nameEn: "John", category: "gospels" },
  { index: 43, abbrev: "At", namePt: "Atos", nameDe: "Apostelgeschichte", nameEs: "Hechos", nameEn: "Acts", category: "acts" },

  // Row 5: Epistles Part 1 (11)
  { index: 44, abbrev: "Rm", namePt: "Romanos", nameDe: "Römer", nameEs: "Romanos", nameEn: "Romans", category: "epistles" },
  { index: 45, abbrev: "1Co", namePt: "1 Coríntios", nameDe: "1. Korinther", nameEs: "1 Corintios", nameEn: "1 Corinthians", category: "epistles" },
  { index: 46, abbrev: "2Co", namePt: "2 Coríntios", nameDe: "2. Korinther", nameEs: "2 Corintios", nameEn: "2 Corinthians", category: "epistles" },
  { index: 47, abbrev: "Gl", namePt: "Gálatas", nameDe: "Galater", nameEs: "Gálatas", nameEn: "Galatians", category: "epistles" },
  { index: 48, abbrev: "Ef", namePt: "Efésios", nameDe: "Epheser", nameEs: "Efesios", nameEn: "Ephesians", category: "epistles" },
  { index: 49, abbrev: "Fp", namePt: "Filipenses", nameDe: "Philipper", nameEs: "Filipenses", nameEn: "Philippians", category: "epistles" },
  { index: 50, abbrev: "Cl", namePt: "Colossenses", nameDe: "Kolosser", nameEs: "Colosenses", nameEn: "Colossians", category: "epistles" },
  { index: 51, abbrev: "1Ts", namePt: "1 Tessalonicenses", nameDe: "1. Thessalonicher", nameEs: "1 Tesalonicenses", nameEn: "1 Thessalonians", category: "epistles" },
  { index: 52, abbrev: "2Ts", namePt: "2 Tessalonicenses", nameDe: "2. Thessalonicher", nameEs: "2 Tesalonicenses", nameEn: "2 Thessalonians", category: "epistles" },
  { index: 53, abbrev: "1Tm", namePt: "1 Timóteo", nameDe: "1. Timotheus", nameEs: "1 Timoteo", nameEn: "1 Timothy", category: "epistles" },
  { index: 54, abbrev: "2Tm", namePt: "2 Timóteo", nameDe: "2. Timotheus", nameEs: "2 Timoteo", nameEn: "2 Timothy", category: "epistles" },

  // Row 6: Epistles Part 2 (10) + Revelation (1) = 11
  { index: 55, abbrev: "Tt", namePt: "Tito", nameDe: "Titus", nameEs: "Tito", nameEn: "Titus", category: "epistles" },
  { index: 56, abbrev: "Fm", namePt: "Filemom", nameDe: "Philemon", nameEs: "Filemón", nameEn: "Philemon", category: "epistles" },
  { index: 57, abbrev: "Hb", namePt: "Hebreus", nameDe: "Hebräer", nameEs: "Hebreos", nameEn: "Hebrews", category: "epistles" },
  { index: 58, abbrev: "Tg", namePt: "Tiago", nameDe: "Jakobus", nameEs: "Santiago", nameEn: "James", category: "epistles" },
  { index: 59, abbrev: "1Pe", namePt: "1 Pedro", nameDe: "1. Petrus", nameEs: "1 Pedro", nameEn: "1 Peter", category: "epistles" },
  { index: 60, abbrev: "2Pe", namePt: "2 Pedro", nameDe: "2. Petrus", nameEs: "2 Pedro", nameEn: "2 Peter", category: "epistles" },
  { index: 61, abbrev: "1Jo", namePt: "1 João", nameDe: "1. Johannes", nameEs: "1 Juan", nameEn: "1 John", category: "epistles" },
  { index: 62, abbrev: "2Jo", namePt: "2 João", nameDe: "2. Johannes", nameEs: "2 Juan", nameEn: "2 John", category: "epistles" },
  { index: 63, abbrev: "3Jo", namePt: "3 João", nameDe: "3. Johannes", nameEs: "3 Juan", nameEn: "3 John", category: "epistles" },
  { index: 64, abbrev: "Jd", namePt: "Judas", nameDe: "Judas", nameEs: "Judas", nameEn: "Jude", category: "epistles" },
  { index: 65, abbrev: "Ap", namePt: "Apocalipse", nameDe: "Offenbarung", nameEs: "Apocalipsis", nameEn: "Revelation", category: "revelation" },
];

const LANG_FLAGS = {
  pt: "🇧🇷 PT",
  de: "🇩🇪 DE",
  en: "🇺🇸 EN",
  es: "🇪🇸 ES",
};

function getLocalizedBookName(bookMeta, lang) {
  if (!bookMeta) return "";
  if (lang === "de") return bookMeta.nameDe;
  if (lang === "es") return bookMeta.nameEs || bookMeta.namePt;
  if (lang === "en") return bookMeta.nameEn || bookMeta.namePt;
  return bookMeta.namePt;
}

const BibleProjection = () => {
  const [biblesData, setBiblesData] = useState({});
  const [bibleList, setBibleList] = useState(BUILTIN_BIBLES);
  const [loading, setLoading] = useState(true);

  // 3 Simultaneous Translation Slots:
  // Slot 1 (1st on screen - White Bold)
  // Slot 2 (2nd on screen - Yellow)
  // Slot 3 (3rd on screen - Light Cyan)
  const [slot1Enabled, setSlot1Enabled] = useState(() => {
    const saved = localStorage.getItem("band_bible_slot1_enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [slot1Version, setSlot1Version] = useState(() => {
    return localStorage.getItem("band_bible_slot1") || "pt_naa";
  });

  const [slot2Enabled, setSlot2Enabled] = useState(() => {
    const saved = localStorage.getItem("band_bible_slot2_enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [slot2Version, setSlot2Version] = useState(() => {
    return localStorage.getItem("band_bible_slot2") || "de_sch2000";
  });

  const [slot3Enabled, setSlot3Enabled] = useState(() => {
    const saved = localStorage.getItem("band_bible_slot3_enabled");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [slot3Version, setSlot3Version] = useState(() => {
    return localStorage.getItem("band_bible_slot3") || "es_nvi";
  });

  const [selectedBookIdx, setSelectedBookIdx] = useState(0);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [selectedVerseIdx, setSelectedVerseIdx] = useState(0);

  const [projectionActive, setProjectionActive] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("band_bible_font_size");
    return saved !== null ? Number(saved) : 4.5;
  });
  const [isBlackout, setIsBlackout] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Bible Manager Modal State
  const [showBibleManager, setShowBibleManager] = useState(false);
  const [managerTab, setManagerTab] = useState("installed"); // 'installed' | 'upload' | 'catalog'
  const [editingBibleId, setEditingBibleId] = useState(null);
  const [editForm, setEditForm] = useState({
    shortLabel: "",
    fullName: "",
    lang: "pt",
    copyright: "",
  });

  // Upload new bible state
  const [uploadBooks, setUploadBooks] = useState(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadShortLabel, setUploadShortLabel] = useState("");
  const [uploadFullName, setUploadFullName] = useState("");
  const [uploadLang, setUploadLang] = useState("pt");
  const [uploadCopyright, setUploadCopyright] = useState("");
  const [uploadStatus, setUploadStatus] = useState({ type: "", message: "" });
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [downloadingCatalogId, setDownloadingCatalogId] = useState(null);

  // Favorites & History
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("band_bible_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("band_bible_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeModal, setActiveModal] = useState(null); // 'favorites' | 'history' | null

  const bcRef = useRef(null);
  const projectionWindowRef = useRef(null);
  const verseListRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load built-in + custom IndexedDB Bibles
  useEffect(() => {
    let isMounted = true;
    const loadAllBibles = async () => {
      try {
        const overrides = getSavedMetadataOverrides();
        const [naaRes, acfRes, schRes, esNviRes, customRecords] = await Promise.all([
          fetch("/bibles/pt_naa.json").then((r) => r.json()),
          fetch("/bibles/pt_acf.json").then((r) => r.json()),
          fetch("/bibles/de_sch2000.json").then((r) => r.json()),
          fetch("/bibles/es_nvi.json").then((r) => r.json()),
          getAllCustomBiblesFromDB(),
        ]);

        if (!isMounted) return;

        const dataMap = {
          pt_naa: naaRes,
          pt_acf: acfRes,
          de_sch2000: schRes,
          es_nvi: esNviRes,
        };

        const mergedList = BUILTIN_BIBLES.map((b) => ({
          ...b,
          ...(overrides[b.id] || {}),
        }));

        for (const custom of customRecords) {
          dataMap[custom.id] = custom.books;
          mergedList.push({
            id: custom.id,
            shortLabel: custom.shortLabel,
            fullName: custom.fullName,
            lang: custom.lang || "pt",
            copyright: custom.copyright || "",
            isBuiltin: false,
            enabled: custom.enabled !== false,
            ...(overrides[custom.id] || {}),
          });
        }

        setBiblesData(dataMap);
        setBibleList(mergedList);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load bible files:", err);
        if (isMounted) setLoading(false);
      }
    };
    loadAllBibles();

    bcRef.current = new BroadcastChannel("projection_sync");
    return () => {
      isMounted = false;
      if (bcRef.current) bcRef.current.close();
    };
  }, []);

  // Build metadata lookup map
  const versionMetaMap = React.useMemo(() => {
    const map = {};
    for (const b of bibleList) {
      map[b.id] = b;
    }
    return map;
  }, [bibleList]);

  const enabledBibles = React.useMemo(() => {
    const list = bibleList.filter((b) => b.enabled !== false);
    return list.length > 0 ? list : bibleList;
  }, [bibleList]);

  const currentBook = BIBLE_BOOKS[selectedBookIdx] || BIBLE_BOOKS[0];
  const primaryBible = biblesData[slot1Version] || biblesData.pt_naa;
  const secondaryBible = biblesData[slot2Version] || biblesData.de_sch2000;
  const tertiaryBible = biblesData[slot3Version] || biblesData.es_nvi;

  const chaptersCount =
    primaryBible && primaryBible[selectedBookIdx]
      ? primaryBible[selectedBookIdx].chapters.length
      : 50;

  const currentChapterVersesSlot1 =
    primaryBible &&
    primaryBible[selectedBookIdx] &&
    primaryBible[selectedBookIdx].chapters[selectedChapterIdx]
      ? primaryBible[selectedBookIdx].chapters[selectedChapterIdx]
      : [];

  const currentChapterVersesSlot2 =
    secondaryBible &&
    secondaryBible[selectedBookIdx] &&
    secondaryBible[selectedBookIdx].chapters[selectedChapterIdx]
      ? secondaryBible[selectedBookIdx].chapters[selectedChapterIdx]
      : [];

  const currentChapterVersesSlot3 =
    tertiaryBible &&
    tertiaryBible[selectedBookIdx] &&
    tertiaryBible[selectedBookIdx].chapters[selectedChapterIdx]
      ? tertiaryBible[selectedBookIdx].chapters[selectedChapterIdx]
      : [];

  const versesCount = currentChapterVersesSlot1.length;

  // Broadcast selected verse (up to 3 simultaneous translations!) to ProjectorWindow
  const broadcastVerse = useCallback(
    (bookIdx, chapterIdx, verseIdx) => {
      if (!bcRef.current || !primaryBible) return;
      const bookMeta = BIBLE_BOOKS[bookIdx] || BIBLE_BOOKS[0];
      const chNum = chapterIdx + 1;
      const vNum = verseIdx + 1;

      const v1Text =
        primaryBible?.[bookIdx]?.chapters?.[chapterIdx]?.[verseIdx] || "";
      const v2Text =
        secondaryBible?.[bookIdx]?.chapters?.[chapterIdx]?.[verseIdx] || "";
      const v3Text =
        tertiaryBible?.[bookIdx]?.chapters?.[chapterIdx]?.[verseIdx] || "";

      const meta1 = versionMetaMap[slot1Version];
      const meta2 = versionMetaMap[slot2Version];
      const meta3 = versionMetaMap[slot3Version];

      const ptLines = [];
      const deLines = [];
      const thirdLines = [];

      // 1st Translation (White Bold on top)
      if (slot1Enabled && v1Text) {
        const bookName1 = getLocalizedBookName(bookMeta, meta1?.lang);
        ptLines.push(`${vNum}. ${v1Text}`);
        ptLines.push(`— ${bookName1} ${chNum}:${vNum} (${meta1?.shortLabel || "V1"})`);
      }

      // 2nd Translation (Yellow in middle)
      if (slot2Enabled && v2Text) {
        const bookName2 = getLocalizedBookName(bookMeta, meta2?.lang);
        deLines.push(`${vNum}. ${v2Text}`);
        deLines.push(`— ${bookName2} ${chNum}:${vNum} (${meta2?.shortLabel || "V2"})`);
      }

      // 3rd Translation (Light Cyan at bottom)
      if (slot3Enabled && v3Text) {
        const bookName3 = getLocalizedBookName(bookMeta, meta3?.lang);
        thirdLines.push(`${vNum}. ${v3Text}`);
        thirdLines.push(`— ${bookName3} ${chNum}:${vNum} (${meta3?.shortLabel || "V3"})`);
      }

      const block = {
        id: `${bookMeta.abbrev}-${chNum}-${vNum}`,
        isBible: true,
        pt: ptLines,
        de: deLines,
        third: thirdLines,
      };

      bcRef.current.postMessage({
        type: "UPDATE_LYRICS",
        payload: {
          block,
          fontSize: `${fontSize}vh`,
          activePhraseIndex: null,
          highlightPhrase: false,
        },
      });
    },
    [
      primaryBible,
      secondaryBible,
      tertiaryBible,
      slot1Enabled,
      slot2Enabled,
      slot3Enabled,
      slot1Version,
      slot2Version,
      slot3Version,
      versionMetaMap,
      fontSize,
    ]
  );

  // Record in history when a verse is projected
  const addToHistory = useCallback((bookIdx, chapterIdx, verseIdx) => {
    const bookMeta = BIBLE_BOOKS[bookIdx] || BIBLE_BOOKS[0];
    const entry = {
      key: `${bookIdx}-${chapterIdx}-${verseIdx}`,
      bookIdx,
      chapterIdx,
      verseIdx,
      label: `${bookMeta.namePt} ${chapterIdx + 1}:${verseIdx + 1}`,
      timestamp: Date.now(),
    };
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.key !== entry.key);
      const next = [entry, ...filtered].slice(0, 50);
      localStorage.setItem("band_bible_history", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSelectBook = (bookIdx) => {
    setSelectedBookIdx(bookIdx);
    setSelectedChapterIdx(0);
    setSelectedVerseIdx(0);
    broadcastVerse(bookIdx, 0, 0);
    addToHistory(bookIdx, 0, 0);
  };

  const handleSelectChapter = (chapterIdx) => {
    setSelectedChapterIdx(chapterIdx);
    setSelectedVerseIdx(0);
    broadcastVerse(selectedBookIdx, chapterIdx, 0);
    addToHistory(selectedBookIdx, chapterIdx, 0);
  };


  const handleFontSizeChange = useCallback((newVal) => {
    const val = Number(Number(newVal).toFixed(1));
    setFontSize(val);
    localStorage.setItem("band_bible_font_size", val.toString());
  }, []);

  const handleToggleBlackout = useCallback(() => {
    setIsBlackout((prev) => {
      const next = !prev;
      if (bcRef.current) {
        bcRef.current.postMessage({
          type: "SET_BLACKOUT",
          payload: { blackout: next },
        });
      }
      return next;
    });
  }, []);

  const handleSelectVerse = useCallback(
    (verseIdx, shouldScrollList = false) => {
      setSelectedVerseIdx(verseIdx);
      if (isBlackout) {
        setIsBlackout(false);
        if (bcRef.current) {
          bcRef.current.postMessage({
            type: "SET_BLACKOUT",
            payload: { blackout: false },
          });
        }
      }
      broadcastVerse(selectedBookIdx, selectedChapterIdx, verseIdx);
      addToHistory(selectedBookIdx, selectedChapterIdx, verseIdx);
      if (shouldScrollList) {
        const el = document.getElementById(`bible-verse-row-${verseIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    },
    [selectedBookIdx, selectedChapterIdx, broadcastVerse, addToHistory, isBlackout]
  );

  // Re-broadcast whenever versions, checkboxes, or font size change
  useEffect(() => {
    if (!loading && primaryBible) {
      broadcastVerse(selectedBookIdx, selectedChapterIdx, selectedVerseIdx);
    }
  }, [
    slot1Enabled,
    slot2Enabled,
    slot3Enabled,
    slot1Version,
    slot2Version,
    slot3Version,
    fontSize,
    loading,
    primaryBible,
    selectedBookIdx,
    selectedChapterIdx,
    selectedVerseIdx,
    broadcastVerse,
  ]);

  // Keyboard navigation (Up/Down arrows to step through verses)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        showBibleManager ||
        e.target.tagName === "INPUT" ||
        e.target.tagName === "SELECT" ||
        e.target.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "b" || e.key === "B") {
        handleToggleBlackout();
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedVerseIdx + 1 < versesCount) {
          handleSelectVerse(selectedVerseIdx + 1, true);
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedVerseIdx > 0) {
          handleSelectVerse(selectedVerseIdx - 1, true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVerseIdx, versesCount, handleSelectVerse, showBibleManager, handleToggleBlackout]);

  const handleStartProjection = async () => {
    setProjectionActive(true);
    try {
      if ("getScreenDetails" in window) {
        const screenDetails = await window.getScreenDetails();
        const externalScreen =
          screenDetails.screens.find((s) => s !== screenDetails.currentScreen) ||
          screenDetails.currentScreen;
        projectionWindowRef.current = window.open(
          "/projector",
          "ProjectionWindow",
          `left=${externalScreen.availLeft},top=${externalScreen.availTop},width=${externalScreen.availWidth},height=${externalScreen.availHeight}`
        );
      } else {
        throw new Error("Window Management API not supported");
      }
    } catch {
      projectionWindowRef.current = window.open(
        "/projector",
        "ProjectionWindow",
        "width=960,height=540"
      );
    }
    setTimeout(() => {
      broadcastVerse(selectedBookIdx, selectedChapterIdx, selectedVerseIdx);
    }, 500);
  };

  const handleStopProjection = () => {
    setProjectionActive(false);
    if (projectionWindowRef.current) {
      projectionWindowRef.current.close();
      projectionWindowRef.current = null;
    }
    if (bcRef.current) {
      bcRef.current.postMessage({ type: "CLEAR_LYRICS" });
    }
  };

  const handleClearScreen = () => {
    if (bcRef.current) {
      bcRef.current.postMessage({ type: "CLEAR_LYRICS" });
    }
  };

  const toggleFavoriteCurrentVerse = () => {
    const key = `${selectedBookIdx}-${selectedChapterIdx}-${selectedVerseIdx}`;
    const exists = favorites.some((f) => f.key === key);
    let next;
    if (exists) {
      next = favorites.filter((f) => f.key !== key);
    } else {
      const vText = currentChapterVersesSlot1[selectedVerseIdx] || "";
      next = [
        {
          key,
          bookIdx: selectedBookIdx,
          chapterIdx: selectedChapterIdx,
          verseIdx: selectedVerseIdx,
          label: `${currentBook.namePt} ${selectedChapterIdx + 1}:${selectedVerseIdx + 1}`,
          preview: vText.slice(0, 90),
        },
        ...favorites,
      ];
    }
    setFavorites(next);
    localStorage.setItem("band_bible_favorites", JSON.stringify(next));
  };

  const isCurrentFavorite = favorites.some(
    (f) => f.key === `${selectedBookIdx}-${selectedChapterIdx}-${selectedVerseIdx}`
  );

  // Quick reference jump in search input
  const handleQuickSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const refMatch = q.match(/^([1-3]?\s*[a-zA-ZÀ-ÿ]+)\s*(\d+)?(?:[:\s.,]+(\d+))?$/);
    if (refMatch) {
      const bookQuery = refMatch[1].replace(/\s+/g, "").toLowerCase();
      const foundBook = BIBLE_BOOKS.find(
        (b) =>
          b.abbrev.toLowerCase() === bookQuery ||
          b.namePt.toLowerCase().replace(/\s+/g, "").startsWith(bookQuery) ||
          b.nameDe.toLowerCase().replace(/[\s.]+/g, "").startsWith(bookQuery) ||
          (b.nameEs && b.nameEs.toLowerCase().replace(/\s+/g, "").startsWith(bookQuery)) ||
          (b.nameEn && b.nameEn.toLowerCase().replace(/\s+/g, "").startsWith(bookQuery))
      );
      if (foundBook) {
        const maxCh = primaryBible?.[foundBook.index]?.chapters?.length || 1;
        const chIdx = refMatch[2]
          ? Math.max(0, Math.min(maxCh - 1, parseInt(refMatch[2], 10) - 1))
          : 0;
        const maxV =
          primaryBible?.[foundBook.index]?.chapters?.[chIdx]?.length || 1;
        const vIdx = refMatch[3]
          ? Math.max(0, Math.min(maxV - 1, parseInt(refMatch[3], 10) - 1))
          : 0;
        setSelectedBookIdx(foundBook.index);
        setSelectedChapterIdx(chIdx);
        setSelectedVerseIdx(vIdx);
        broadcastVerse(foundBook.index, chIdx, vIdx);
        addToHistory(foundBook.index, chIdx, vIdx);
        setTimeout(() => {
          const el = document.getElementById(`bible-verse-row-${vIdx}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
      }
    }
  };

  // ==================== BIBLE MANAGER HANDLERS ====================

  const handleToggleBibleEnabled = (bibleId) => {
    setBibleList((prev) => {
      const next = prev.map((b) =>
        b.id === bibleId ? { ...b, enabled: b.enabled === false ? true : false } : b
      );
      const overrides = getSavedMetadataOverrides();
      const target = next.find((b) => b.id === bibleId);
      if (target) {
        overrides[bibleId] = {
          ...(overrides[bibleId] || {}),
          enabled: target.enabled,
        };
        saveMetadataOverrides(overrides);
      }
      return next;
    });
  };

  const handleStartEditBible = (bible) => {
    setEditingBibleId(bible.id);
    setEditForm({
      shortLabel: bible.shortLabel || "",
      fullName: bible.fullName || "",
      lang: bible.lang || "pt",
      copyright: bible.copyright || "",
    });
  };

  const handleSaveEditBible = async (bibleId) => {
    const cleanShort = editForm.shortLabel.trim().toUpperCase() || "BIBLE";
    const cleanFull = editForm.fullName.trim() || cleanShort;
    const overrides = getSavedMetadataOverrides();
    overrides[bibleId] = {
      ...(overrides[bibleId] || {}),
      shortLabel: cleanShort,
      fullName: cleanFull,
      lang: editForm.lang,
      copyright: editForm.copyright,
    };
    saveMetadataOverrides(overrides);

    setBibleList((prev) =>
      prev.map((b) =>
        b.id === bibleId
          ? {
              ...b,
              shortLabel: cleanShort,
              fullName: cleanFull,
              lang: editForm.lang,
              copyright: editForm.copyright,
            }
          : b
      )
    );
    setEditingBibleId(null);
  };

  const handleDeleteCustomBible = async (bible) => {
    if (bible.isBuiltin) return;
    await deleteCustomBibleFromDB(bible.id);
    setBibleList((prev) => prev.filter((b) => b.id !== bible.id));
    setBiblesData((prev) => {
      const copy = { ...prev };
      delete copy[bible.id];
      return copy;
    });
    if (slot1Version === bible.id) setSlot1Version("pt_naa");
    if (slot2Version === bible.id) setSlot2Version("de_sch2000");
    if (slot3Version === bible.id) setSlot3Version("es_nvi");
  };

  const handleExportBibleJson = (bible) => {
    const data = biblesData[bible.id];
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bible.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingFile(true);
    setUploadStatus({ type: "", message: "" });
    setUploadFileName(file.name);

    try {
      const parsed = await parseImportedBibleFile(file);
      setUploadBooks(parsed.books);
      setUploadShortLabel(parsed.suggestedShortLabel);
      setUploadFullName(parsed.suggestedFullName);
      setUploadLang(parsed.suggestedLang);
      setUploadCopyright(parsed.suggestedCopyright);
      const totalCh = parsed.books.reduce((s, b) => s + (b.chapters?.length || 0), 0);
      setUploadStatus({
        type: "success",
        message: `Parsed ${parsed.books.length} books and ${totalCh} chapters from "${file.name}". Ready to save!`,
      });
    } catch (err) {
      setUploadBooks(null);
      setUploadStatus({
        type: "error",
        message: err.message || "Failed to parse Bible file.",
      });
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleSaveUploadedBible = async (e) => {
    e.preventDefault();
    if (!uploadBooks || uploadBooks.length === 0) return;

    const shortCode = uploadShortLabel.trim().toUpperCase() || "CUSTOM";
    const fullName = uploadFullName.trim() || shortCode;
    const id = `custom_${shortCode.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now()}`;

    const record = {
      id,
      shortLabel: shortCode,
      fullName,
      lang: uploadLang,
      copyright: uploadCopyright,
      enabled: true,
      books: uploadBooks,
    };

    try {
      await saveCustomBibleToDB(record);
      setBiblesData((prev) => ({ ...prev, [id]: uploadBooks }));
      setBibleList((prev) => [
        ...prev,
        {
          id,
          shortLabel: shortCode,
          fullName,
          lang: uploadLang,
          copyright: uploadCopyright,
          isBuiltin: false,
          enabled: true,
        },
      ]);
      setUploadBooks(null);
      setUploadFileName("");
      setUploadShortLabel("");
      setUploadFullName("");
      setUploadCopyright("");
      setUploadStatus({
        type: "success",
        message: `Bible "${fullName}" (${shortCode}) installed!`,
      });
      setTimeout(() => setManagerTab("installed"), 800);
    } catch (err) {
      setUploadStatus({
        type: "error",
        message: `Could not save Bible to storage: ${err.message}`,
      });
    }
  };

  const handleDownloadCatalogBible = async (catItem) => {
    setDownloadingCatalogId(catItem.id);
    try {
      const res = await fetch(catItem.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawText = await res.text();
      const books = normalizeBibleDataArray(rawText);

      const record = {
        id: catItem.id,
        shortLabel: catItem.shortLabel,
        fullName: catItem.fullName,
        lang: catItem.lang,
        copyright: catItem.copyright,
        enabled: true,
        books,
      };

      await saveCustomBibleToDB(record);
      setBiblesData((prev) => ({ ...prev, [catItem.id]: books }));
      setBibleList((prev) => {
        const filtered = prev.filter((b) => b.id !== catItem.id);
        return [
          ...filtered,
          {
            id: catItem.id,
            shortLabel: catItem.shortLabel,
            fullName: catItem.fullName,
            lang: catItem.lang,
            copyright: catItem.copyright,
            isBuiltin: false,
            enabled: true,
          },
        ];
      });
    } catch (err) {
      alert(`Failed to download ${catItem.fullName}: ${err.message}`);
    } finally {
      setDownloadingCatalogId(null);
    }
  };

  const currentSlot1Text = currentChapterVersesSlot1[selectedVerseIdx] || "";
  const currentSlot2Text = currentChapterVersesSlot2[selectedVerseIdx] || "";
  const currentSlot3Text = currentChapterVersesSlot3[selectedVerseIdx] || "";

  const activeSlotsCount =
    (slot1Enabled ? 1 : 0) + (slot2Enabled ? 1 : 0) + (slot3Enabled ? 1 : 0);

  return (
    <div className="holyrics-bible-wrapper">
      {/* Top Header Strip */}
      <div className="holyrics-top-bar">
        <div className="holyrics-top-left">
          <span className="holyrics-badge-icon">
            <i className="pi pi-book" />
          </span>
          <span className="holyrics-top-title">
            Bible Projection ({activeSlotsCount} {activeSlotsCount === 1 ? "Translation" : "Translations"} Active)
          </span>
        </div>
        <div className="holyrics-top-center">
          <button
            type="button"
            className={`holyrics-top-action-btn ${activeModal === "favorites" ? "active" : ""}`}
            onClick={() =>
              setActiveModal(activeModal === "favorites" ? null : "favorites")
            }
          >
            <i className="pi pi-heart-fill" /> Favorites ({favorites.length})
          </button>
          <button
            type="button"
            className={`holyrics-top-action-btn ${activeModal === "history" ? "active" : ""}`}
            onClick={() =>
              setActiveModal(activeModal === "history" ? null : "history")
            }
          >
            <i className="pi pi-history" /> History ({history.length})
          </button>
          <button
            type="button"
            className={`holyrics-top-action-btn manage-bibles-top-btn ${
              showBibleManager ? "active" : ""
            }`}
            onClick={() => setShowBibleManager(true)}
          >
            <i className="pi pi-sliders-h" /> Manage Bibles ({bibleList.length})
          </button>
        </div>
        <div className="holyrics-top-right">
          <button
            type="button"
            className={`holyrics-proj-btn ${projectionActive ? "live" : ""}`}
            onClick={projectionActive ? handleStopProjection : handleStartProjection}
          >
            <i className={`pi ${projectionActive ? "pi-stop-circle" : "pi-desktop"}`} />
            {projectionActive ? "Stop Projector" : "Open Projector Window"}
          </button>
        </div>
      </div>

      {/* Main Content Split: Left Sidebar + Right Grids */}
      <div className="holyrics-main-body">
        {/* LEFT COLUMN: Current Book/Chapter, 3 Version Slots, Verses List, Copyright, Preview */}
        <div className="holyrics-left-panel">
          {/* Book + Chapter Title Row */}
          <div className="holyrics-chapter-header">
            <button
              type="button"
              className="holyrics-icon-btn"
              title="Toggle Quick Reference Search (e.g. Jo 3:16)"
              onClick={() => setShowSearchInput((prev) => !prev)}
            >
              <i className="pi pi-search" />
            </button>
            <div className="holyrics-chapter-title">
              {currentBook.namePt} {selectedChapterIdx + 1}
            </div>
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                type="button"
                className={`holyrics-icon-btn ${isCurrentFavorite ? "fav-active" : ""}`}
                title="Bookmark / Favorite current verse"
                onClick={toggleFavoriteCurrentVerse}
              >
                <i className={`pi ${isCurrentFavorite ? "pi-heart-fill" : "pi-heart"}`} />
              </button>
              <button
                type="button"
                className="holyrics-icon-btn"
                title="Add / Manage Bibles"
                onClick={() => setShowBibleManager(true)}
              >
                <i className="pi pi-cog" />
              </button>
            </div>
          </div>

          {showSearchInput && (
            <form className="holyrics-quick-search" onSubmit={handleQuickSearchSubmit}>
              <input
                type="text"
                placeholder="Ex: Jo 3:16, Sl 23:1, Gn 1..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit">Go</button>
            </form>
          )}

          {/* 3 Simultaneous Translation Selector Slots + Quick Add Button */}
          <div className="holyrics-version-bar">
            <div
              className={`holyrics-version-slot ${slot1Enabled ? "slot-active-1" : ""}`}
              title="1st Translation on Projector (White Bold)"
            >
              <input
                type="checkbox"
                checked={slot1Enabled}
                onChange={(e) => {
                  setSlot1Enabled(e.target.checked);
                  localStorage.setItem(
                    "band_bible_slot1_enabled",
                    JSON.stringify(e.target.checked)
                  );
                }}
              />
              <span className="slot-color-dot dot-slot1" />
              <select
                value={slot1Version}
                onChange={(e) => {
                  setSlot1Version(e.target.value);
                  localStorage.setItem("band_bible_slot1", e.target.value);
                }}
                className="holyrics-version-select"
              >
                {enabledBibles.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`holyrics-version-slot ${slot2Enabled ? "slot-active-2" : ""}`}
              title="2nd Translation on Projector (Yellow)"
            >
              <input
                type="checkbox"
                checked={slot2Enabled}
                onChange={(e) => {
                  setSlot2Enabled(e.target.checked);
                  localStorage.setItem(
                    "band_bible_slot2_enabled",
                    JSON.stringify(e.target.checked)
                  );
                }}
              />
              <span className="slot-color-dot dot-slot2" />
              <select
                value={slot2Version}
                onChange={(e) => {
                  setSlot2Version(e.target.value);
                  localStorage.setItem("band_bible_slot2", e.target.value);
                }}
                className="holyrics-version-select"
              >
                {enabledBibles.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`holyrics-version-slot ${slot3Enabled ? "slot-active-3" : ""}`}
              title="3rd Translation on Projector (Light Cyan)"
            >
              <input
                type="checkbox"
                checked={slot3Enabled}
                onChange={(e) => {
                  setSlot3Enabled(e.target.checked);
                  localStorage.setItem(
                    "band_bible_slot3_enabled",
                    JSON.stringify(e.target.checked)
                  );
                }}
              />
              <span className="slot-color-dot dot-slot3" />
              <select
                value={slot3Version}
                onChange={(e) => {
                  setSlot3Version(e.target.value);
                  localStorage.setItem("band_bible_slot3", e.target.value);
                }}
                className="holyrics-version-select"
              >
                {enabledBibles.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="holyrics-add-bible-mini-btn"
              onClick={() => {
                setManagerTab("upload");
                setShowBibleManager(true);
              }}
              title="Add or Manage Bibles"
            >
              +
            </button>
          </div>

          {/* Scrollable Verse List */}
          <div className="holyrics-verse-list" ref={verseListRef}>
            {loading ? (
              <div className="holyrics-loading">Loading Bibles...</div>
            ) : (
              currentChapterVersesSlot1.map((verseText, vIdx) => {
                const isSelected = vIdx === selectedVerseIdx;
                const v2Text = currentChapterVersesSlot2[vIdx] || "";
                const v3Text = currentChapterVersesSlot3[vIdx] || "";
                return (
                  <div
                    key={vIdx}
                    id={`bible-verse-row-${vIdx}`}
                    className={`holyrics-verse-item ${isSelected ? "selected" : ""} ${
                      vIdx % 2 === 1 ? "alt" : ""
                    }`}
                    onClick={() => handleSelectVerse(vIdx, false)}
                  >
                    <div className="verse-row-primary">
                      <span className="verse-num">{vIdx + 1} - </span>
                      <span className="verse-text">{verseText}</span>
                    </div>
                    {isSelected && slot2Enabled && v2Text && (
                      <div className="verse-row-secondary">
                        <span className="verse-sub-tag">
                          [{versionMetaMap[slot2Version]?.shortLabel || "2"}]
                        </span>{" "}
                        {v2Text}
                      </div>
                    )}
                    {isSelected && slot3Enabled && v3Text && (
                      <div className="verse-row-tertiary">
                        <span className="verse-sub-tag">
                          [{versionMetaMap[slot3Version]?.shortLabel || "3"}]
                        </span>{" "}
                        {v3Text}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Copyright Box */}
          <div className="holyrics-copyright-box">
            {versionMetaMap[slot1Version]?.copyright || ""}
          </div>

          {/* Bottom-Left Controls & Live Screen Preview */}
          <div className="holyrics-bottom-controls">
            <div className="holyrics-mini-toolbar">
              <button
                type="button"
                className={`mini-ctrl-btn ${projectionActive ? "active" : ""}`}
                onClick={handleStartProjection}
                title="Start / Open Projector Window"
              >
                <i className="pi pi-play" />
              </button>
              <button
                type="button"
                className="mini-ctrl-btn"
                onClick={handleClearScreen}
                title="Clear Projector Text"
              >
                <i className="pi pi-stop" />
              </button>
              <button
                type="button"
                className={`mini-ctrl-btn ${isBlackout ? "active blackout" : ""}`}
                onClick={handleToggleBlackout}
                title="Black Screen without stopping projection (Shortcut: B)"
              >
                <i className={isBlackout ? "pi pi-eye" : "pi pi-eye-slash"} />
              </button>
              <button
                type="button"
                className="mini-ctrl-btn"
                onClick={() => setShowSearchInput((p) => !p)}
                title="Quick Search"
              >
                <i className="pi pi-search" />
              </button>
              <button
                type="button"
                className="mini-ctrl-btn"
                onClick={() => setShowBibleManager(true)}
                title="Manage Bibles"
              >
                <i className="pi pi-book" />
              </button>
            </div>
            <div className="holyrics-preview-and-font-wrap">
              <div className="holyrics-mini-preview" title="Live Projection Preview (Up to 3 Translations)">
              {slot1Enabled && currentSlot1Text && (
                <div className="mini-preview-pt">
                  {selectedVerseIdx + 1}. {currentSlot1Text}
                </div>
              )}
              {slot2Enabled && currentSlot2Text && (
                <div className="mini-preview-de">
                  {selectedVerseIdx + 1}. {currentSlot2Text}
                </div>
              )}
              {slot3Enabled && currentSlot3Text && (
                <div className="mini-preview-third">
                  {selectedVerseIdx + 1}. {currentSlot3Text}
                </div>
              )}
              <div className="mini-preview-ref">
                {currentBook.namePt} {selectedChapterIdx + 1}:{selectedVerseIdx + 1}
              </div>
            </div>

            <div className="holyrics-font-controls">
              <div className="bible-font-slider-wrap">
                <i className="pi pi-text-height" style={{ fontSize: "0.75rem", color: "#9ca3af" }} />
                <input
                  type="range"
                  min="2.5"
                  max="8.0"
                  step="0.2"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  className="bible-font-slider"
                  title={`Slide to adjust font size: ${fontSize}vh`}
                />
                <span className="bible-font-size-label">{fontSize}vh</span>
              </div>
              <div className="font-step-btns">
                <button
                  type="button"
                  className="font-step-btn"
                  onClick={() => handleFontSizeChange(Math.max(2.5, fontSize - 0.5))}
                  title="Smaller (-0.5)"
                >
                  -
                </button>
                <button
                  type="button"
                  className="font-step-btn"
                  onClick={() => handleFontSizeChange(Math.min(8.0, fontSize + 0.5))}
                  title="Larger (+0.5)"
                >
                  +
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Top 66 Books Grid (11x6) + Bottom Chapters (9 cols) & Verses (7 cols) */}
        <div className="holyrics-right-panel">
          {/* Favorites / History Overlay Drawer if open */}
          {activeModal && (
            <div className="holyrics-modal-bar">
              <div className="holyrics-modal-header">
                <span>
                  {activeModal === "favorites" ? "♥ Saved Favorites" : "🕒 Recent Verses History"}
                </span>
                <button type="button" onClick={() => setActiveModal(null)}>
                  ✕
                </button>
              </div>
              <div className="holyrics-modal-items">
                {(activeModal === "favorites" ? favorites : history).length === 0 ? (
                  <span className="holyrics-modal-empty">No items yet.</span>
                ) : (
                  (activeModal === "favorites" ? favorites : history).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="holyrics-modal-chip"
                      onClick={() => {
                        setSelectedBookIdx(item.bookIdx);
                        setSelectedChapterIdx(item.chapterIdx);
                        setSelectedVerseIdx(item.verseIdx);
                        broadcastVerse(item.bookIdx, item.chapterIdx, item.verseIdx);
                        setActiveModal(null);
                      }}
                    >
                      {item.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 11 x 6 BOOKS GRID (66 Books) */}
          <div className="holyrics-books-grid">
            {BIBLE_BOOKS.map((book) => {
              const isSelected = book.index === selectedBookIdx;
              return (
                <button
                  key={book.abbrev}
                  type="button"
                  className={`holyrics-book-tile cat-${book.category} ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => handleSelectBook(book.index)}
                  title={`${book.namePt} / ${book.nameDe} / ${book.nameEs}`}
                >
                  <span className="book-abbrev">{book.abbrev}</span>
                  <span className="book-fullname">{book.namePt}</span>
                </button>
              );
            })}
          </div>

          {/* BOTTOM GRIDS: Chapters (Left, 9 columns) & Verses (Right, 7 columns) */}
          <div className="holyrics-numbers-split">
            {/* Chapters Grid (9 per row) */}
            <div className="holyrics-chapters-grid-wrap">
              <div className="holyrics-chapters-grid">
                {Array.from({ length: chaptersCount }, (_, cIdx) => {
                  const isSelected = cIdx === selectedChapterIdx;
                  return (
                    <button
                      key={cIdx}
                      type="button"
                      className={`holyrics-chapter-tile ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectChapter(cIdx)}
                    >
                      {cIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Verses Grid (7 per row) */}
            <div className="holyrics-verses-grid-wrap">
              <div className="holyrics-verses-grid">
                {Array.from({ length: versesCount }, (_, vIdx) => {
                  const isSelected = vIdx === selectedVerseIdx;
                  return (
                    <button
                      key={vIdx}
                      type="button"
                      className={`holyrics-verse-tile ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectVerse(vIdx, true)}
                    >
                      {vIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MANAGE BIBLES MODAL ==================== */}
      {showBibleManager && (
        <div
          className="bible-manager-backdrop"
          onClick={() => setShowBibleManager(false)}
        >
          <div
            className="bible-manager-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bible-manager-header">
              <div className="bible-manager-title">
                <i className="pi pi-book" />
                <span>Manage Bibles & Simultaneous Translations (Up to 3)</span>
              </div>
              <button
                type="button"
                className="bible-manager-close"
                onClick={() => setShowBibleManager(false)}
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bible-manager-tabs">
              <button
                type="button"
                className={`bm-tab-btn ${managerTab === "installed" ? "active" : ""}`}
                onClick={() => setManagerTab("installed")}
              >
                <i className="pi pi-list" /> Installed Bibles ({bibleList.length})
              </button>
              <button
                type="button"
                className={`bm-tab-btn ${managerTab === "upload" ? "active" : ""}`}
                onClick={() => setManagerTab("upload")}
              >
                <i className="pi pi-upload" /> + Import Bible File (.xml / .json / .bib)
              </button>
              <button
                type="button"
                className={`bm-tab-btn ${managerTab === "catalog" ? "active" : ""}`}
                onClick={() => setManagerTab("catalog")}
              >
                <i className="pi pi-cloud-download" /> Online Bible Catalog
              </button>
            </div>

            <div className="bible-manager-body">
              {/* TAB 1: INSTALLED BIBLES */}
              {managerTab === "installed" && (
                <div className="bm-installed-list">
                  <div className="bm-slot-summary">
                    <span>
                      <span className="slot-color-dot dot-slot1" />{" "}
                      <strong>1st (White Bold):</strong>{" "}
                      {slot1Enabled
                        ? versionMetaMap[slot1Version]?.fullName || slot1Version
                        : "Off"}
                    </span>
                    <span>
                      <span className="slot-color-dot dot-slot2" />{" "}
                      <strong>2nd (Yellow):</strong>{" "}
                      {slot2Enabled
                        ? versionMetaMap[slot2Version]?.fullName || slot2Version
                        : "Off"}
                    </span>
                    <span>
                      <span className="slot-color-dot dot-slot3" />{" "}
                      <strong>3rd (Cyan):</strong>{" "}
                      {slot3Enabled
                        ? versionMetaMap[slot3Version]?.fullName || slot3Version
                        : "Off"}
                    </span>
                  </div>

                  {bibleList.map((bible) => {
                    const booksArr = biblesData[bible.id] || [];
                    const chTotal = booksArr.reduce(
                      (s, b) => s + (b.chapters?.length || 0),
                      0
                    );
                    const isSlot1 = slot1Version === bible.id && slot1Enabled;
                    const isSlot2 = slot2Version === bible.id && slot2Enabled;
                    const isSlot3 = slot3Version === bible.id && slot3Enabled;
                    const isEditing = editingBibleId === bible.id;

                    return (
                      <div
                        key={bible.id}
                        className={`bm-bible-card ${
                          bible.enabled === false ? "disabled-card" : ""
                        }`}
                      >
                        {isEditing ? (
                          <div className="bm-edit-form">
                            <div className="bm-edit-row">
                              <div>
                                <label>Short Code</label>
                                <input
                                  type="text"
                                  maxLength={10}
                                  value={editForm.shortLabel}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, shortLabel: e.target.value })
                                  }
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label>Full Name</label>
                                <input
                                  type="text"
                                  value={editForm.fullName}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, fullName: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <label>Language</label>
                                <select
                                  value={editForm.lang}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, lang: e.target.value })
                                  }
                                >
                                  <option value="pt">🇧🇷 Português</option>
                                  <option value="de">🇩🇪 Deutsch</option>
                                  <option value="en">🇺🇸 English</option>
                                  <option value="es">🇪🇸 Español</option>
                                </select>
                              </div>
                            </div>
                            <div className="bm-edit-row">
                              <div style={{ flex: 1 }}>
                                <label>Copyright / Info</label>
                                <textarea
                                  rows={2}
                                  value={editForm.copyright}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, copyright: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="bm-edit-actions">
                              <button
                                type="button"
                                className="bm-btn primary"
                                onClick={() => handleSaveEditBible(bible.id)}
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                className="bm-btn"
                                onClick={() => setEditingBibleId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="bm-card-main">
                              <div className="bm-card-badges">
                                <span className="bm-code-badge">{bible.shortLabel}</span>
                                <span className="bm-lang-badge">
                                  {LANG_FLAGS[bible.lang] || bible.lang?.toUpperCase()}
                                </span>
                                {bible.isBuiltin ? (
                                  <span className="bm-type-badge builtin">Built-in</span>
                                ) : (
                                  <span className="bm-type-badge custom">Custom</span>
                                )}
                                {isSlot1 && (
                                  <span className="bm-slot-pill slot1">1st (White)</span>
                                )}
                                {isSlot2 && (
                                  <span className="bm-slot-pill slot2">2nd (Yellow)</span>
                                )}
                                {isSlot3 && (
                                  <span className="bm-slot-pill slot3">3rd (Cyan)</span>
                                )}
                              </div>
                              <div className="bm-card-title">{bible.fullName}</div>
                              <div className="bm-card-meta">
                                {booksArr.length} books &bull; {chTotal} chapters
                              </div>
                            </div>

                            <div className="bm-card-actions">
                              <button
                                type="button"
                                className={`bm-btn ${isSlot1 ? "active-slot" : ""}`}
                                onClick={() => {
                                  setSlot1Version(bible.id);
                                  setSlot1Enabled(true);
                                  localStorage.setItem("band_bible_slot1", bible.id);
                                  localStorage.setItem(
                                    "band_bible_slot1_enabled",
                                    JSON.stringify(true)
                                  );
                                }}
                                title="Set as 1st projected translation (White Bold)"
                              >
                                Set 1st
                              </button>
                              <button
                                type="button"
                                className={`bm-btn ${isSlot2 ? "active-slot" : ""}`}
                                onClick={() => {
                                  setSlot2Version(bible.id);
                                  setSlot2Enabled(true);
                                  localStorage.setItem("band_bible_slot2", bible.id);
                                  localStorage.setItem(
                                    "band_bible_slot2_enabled",
                                    JSON.stringify(true)
                                  );
                                }}
                                title="Set as 2nd projected translation (Yellow)"
                              >
                                Set 2nd
                              </button>
                              <button
                                type="button"
                                className={`bm-btn ${isSlot3 ? "active-slot" : ""}`}
                                onClick={() => {
                                  setSlot3Version(bible.id);
                                  setSlot3Enabled(true);
                                  localStorage.setItem("band_bible_slot3", bible.id);
                                  localStorage.setItem(
                                    "band_bible_slot3_enabled",
                                    JSON.stringify(true)
                                  );
                                }}
                                title="Set as 3rd projected translation (Light Cyan)"
                              >
                                Set 3rd
                              </button>
                              <button
                                type="button"
                                className="bm-btn"
                                onClick={() => handleToggleBibleEnabled(bible.id)}
                                title="Show or hide in dropdowns"
                              >
                                {bible.enabled === false ? "Enable" : "Hide"}
                              </button>
                              <button
                                type="button"
                                className="bm-btn"
                                onClick={() => handleStartEditBible(bible)}
                                title="Edit Name, Code, or Language"
                              >
                                <i className="pi pi-pencil" /> Edit
                              </button>
                              <button
                                type="button"
                                className="bm-btn"
                                onClick={() => handleExportBibleJson(bible)}
                                title="Export Bible as JSON"
                              >
                                <i className="pi pi-download" />
                              </button>
                              {!bible.isBuiltin && (
                                <button
                                  type="button"
                                  className="bm-btn danger"
                                  onClick={() => handleDeleteCustomBible(bible)}
                                  title="Delete Custom Bible"
                                >
                                  <i className="pi pi-trash" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: IMPORT / UPLOAD BIBLE FILE */}
              {managerTab === "upload" && (
                <div className="bm-upload-section">
                  <div
                    className="bm-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.xml,.bib,.bib2"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <i className="pi pi-cloud-upload bm-dropzone-icon" />
                    <div className="bm-dropzone-title">
                      {isParsingFile
                        ? "Reading & parsing Bible file..."
                        : uploadFileName
                        ? `Selected: ${uploadFileName}`
                        : "Click to select a Bible file (.xml, .json, .bib, .bib2)"}
                    </div>
                    <div className="bm-dropzone-sub">
                      Supports Zefania XML, OpenSong XML, OSIS XML, 66-book JSON, and known Holyrics .bib/.bib2 translations
                    </div>
                  </div>

                  {uploadStatus.message && (
                    <div className={`bm-status-banner ${uploadStatus.type}`}>
                      {uploadStatus.message}
                    </div>
                  )}

                  {uploadBooks && (
                    <form className="bm-upload-form" onSubmit={handleSaveUploadedBible}>
                      <div className="bm-edit-row">
                        <div>
                          <label>Short Code (shown in selector)</label>
                          <input
                            type="text"
                            maxLength={10}
                            required
                            placeholder="e.g. NVI, LUT, KJV"
                            value={uploadShortLabel}
                            onChange={(e) => setUploadShortLabel(e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label>Full Bible Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Nova Versão Internacional"
                            value={uploadFullName}
                            onChange={(e) => setUploadFullName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label>Language</label>
                          <select
                            value={uploadLang}
                            onChange={(e) => setUploadLang(e.target.value)}
                          >
                            <option value="pt">🇧🇷 Português</option>
                            <option value="de">🇩🇪 Deutsch</option>
                            <option value="en">🇺🇸 English</option>
                            <option value="es">🇪🇸 Español</option>
                          </select>
                        </div>
                      </div>
                      <div className="bm-edit-row">
                        <div style={{ flex: 1 }}>
                          <label>Copyright / Notes</label>
                          <textarea
                            rows={2}
                            value={uploadCopyright}
                            onChange={(e) => setUploadCopyright(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="bm-btn primary large">
                        <i className="pi pi-check" /> Save & Install Bible
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: ONLINE BIBLE CATALOG */}
              {managerTab === "catalog" && (
                <div className="bm-catalog-list">
                  <p className="bm-catalog-intro">
                    Download and install additional Bibles directly with 1 click (stored offline in your browser):
                  </p>
                  {ONLINE_BIBLE_CATALOG.map((cat) => {
                    const isInstalled = Boolean(biblesData[cat.id]);
                    const isDownloading = downloadingCatalogId === cat.id;
                    return (
                      <div key={cat.id} className="bm-bible-card">
                        <div className="bm-card-main">
                          <div className="bm-card-badges">
                            <span className="bm-code-badge">{cat.shortLabel}</span>
                            <span className="bm-lang-badge">
                              {LANG_FLAGS[cat.lang] || cat.lang.toUpperCase()}
                            </span>
                            {isInstalled && (
                              <span className="bm-type-badge builtin">Installed ✓</span>
                            )}
                          </div>
                          <div className="bm-card-title">{cat.fullName}</div>
                          <div className="bm-card-meta">{cat.copyright}</div>
                        </div>
                        <div className="bm-card-actions">
                          <button
                            type="button"
                            className={`bm-btn ${isInstalled ? "" : "primary"}`}
                            disabled={isDownloading}
                            onClick={() => handleDownloadCatalogBible(cat)}
                          >
                            <i
                              className={`pi ${
                                isDownloading
                                  ? "pi-spin pi-spinner"
                                  : isInstalled
                                  ? "pi-refresh"
                                  : "pi-cloud-download"
                              }`}
                            />
                            {isDownloading
                              ? "Installing..."
                              : isInstalled
                              ? "Reinstall"
                              : "Download & Install"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleProjection;
