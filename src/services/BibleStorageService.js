// BibleStorageService.js
// Manages built-in Bibles, custom imported Bibles (stored in IndexedDB),
// metadata overrides, XML/JSON Bible parsing, and 1-click catalog downloads.

const DB_NAME = "band_bibles_db";
const DB_VERSION = 1;
const STORE_NAME = "custom_bibles";
const META_STORAGE_KEY = "band_bibles_meta_v1";

export const BUILTIN_BIBLES = [
  {
    id: "pt_naa",
    shortLabel: "NAA",
    fullName: "Nova Almeida Atualizada (PT)",
    lang: "pt",
    isBuiltin: true,
    enabled: true,
    file: "/bibles/pt_naa.json",
    copyright:
      "Nova Almeida Atualizada (NAA)\nCopyright © 2017 por Sociedade Bíblica do Brasil.\nTodos os direitos reservados.",
  },
  {
    id: "de_sch2000",
    shortLabel: "SCH2000",
    fullName: "Schlachter 2000 (DE)",
    lang: "de",
    isBuiltin: true,
    enabled: true,
    file: "/bibles/de_sch2000.json",
    copyright:
      "Schlachter 2000 (SCH2000)\nCopyright © 2000 Genfer Bibelgesellschaft.\nWiedergegeben mit freundlicher Genehmigung. Alle Rechte vorbehalten.",
  },
  {
    id: "es_nvi",
    shortLabel: "NVI-ES",
    fullName: "Nueva Versión Internacional (ES)",
    lang: "es",
    isBuiltin: true,
    enabled: true,
    file: "/bibles/es_nvi.json",
    copyright:
      "Spanish NVI Bible - Nueva Versión Internacional\nCopyright © 1999, 2015 by Biblica, Inc.® All rights reserved worldwide.",
  },
  {
    id: "pt_acf",
    shortLabel: "ACF",
    fullName: "Almeida Corrigida Fiel (PT)",
    lang: "pt",
    isBuiltin: true,
    enabled: true,
    file: "/bibles/pt_acf.json",
    copyright:
      "Copyright © 1994, 1995, 2007, 2011 por Sociedade Bíblica Trinitariana do Brasil.\nA Almeida Corrigida Fiel | acf e seu logotipo são marcas registradas.\nUsado com permissão.",
  },
];

export const ONLINE_BIBLE_CATALOG = [
  {
    id: "pt_nvi",
    shortLabel: "NVI",
    fullName: "Nova Versão Internacional (PT)",
    lang: "pt",
    url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_nvi.json",
    copyright: "Nova Versão Internacional (NVI) - Português.",
  },
  {
    id: "pt_ara",
    shortLabel: "ARA",
    fullName: "Almeida Revista e Atualizada (PT)",
    lang: "pt",
    url: "https://raw.githubusercontent.com/damarals/biblias/main/inst/json/ARA.json",
    copyright: "Almeida Revista e Atualizada (ARA) - Sociedade Bíblica do Brasil.",
  },
  {
    id: "pt_nvt",
    shortLabel: "NVT",
    fullName: "Nova Versão Transformadora (PT)",
    lang: "pt",
    url: "https://raw.githubusercontent.com/damarals/biblias/main/inst/json/NVT.json",
    copyright: "Nova Versão Transformadora (NVT) - Mundo Cristão.",
  },
  {
    id: "pt_ntlh",
    shortLabel: "NTLH",
    fullName: "Nova Tradução na Linguagem de Hoje (PT)",
    lang: "pt",
    url: "https://raw.githubusercontent.com/damarals/biblias/main/inst/json/NTLH.json",
    copyright: "Nova Tradução na Linguagem de Hoje (NTLH) - Sociedade Bíblica do Brasil.",
  },
  {
    id: "pt_aa",
    shortLabel: "AA",
    fullName: "Almeida Revisada Imprensa Bíblica (PT)",
    lang: "pt",
    url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_aa.json",
    copyright: "Almeida Revisada Imprensa Bíblica (AA).",
  },
  {
    id: "de_schlachter",
    shortLabel: "SCH1951",
    fullName: "Schlachter 1951 (DE)",
    lang: "de",
    url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/de_schlachter.json",
    copyright: "Schlachter 1951 (DE) - Genfer Bibelgesellschaft.",
  },
  {
    id: "en_kjv",
    shortLabel: "KJV",
    fullName: "King James Version (EN)",
    lang: "en",
    url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json",
    copyright: "Authorized King James Version (KJV) - Public Domain.",
  },
  {
    id: "en_bbe",
    shortLabel: "BBE",
    fullName: "Bible in Basic English (EN)",
    lang: "en",
    url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_bbe.json",
    copyright: "Bible in Basic English (BBE) - Public Domain.",
  },
  {
    id: "es_rvr",
    shortLabel: "RVR",
    fullName: "Reina Valera (ES)",
    lang: "es",
    url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/es_rvr.json",
    copyright: "Reina Valera (RVR) - Español.",
  },
];

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this browser."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllCustomBiblesFromDB() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Could not read custom bibles from IndexedDB:", err);
    return [];
  }
}

export async function saveCustomBibleToDB(bibleRecord) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(bibleRecord);
    req.onsuccess = () => resolve(bibleRecord);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCustomBibleFromDB(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export function getSavedMetadataOverrides() {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMetadataOverrides(overrides) {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.warn("Failed to save metadata overrides:", err);
  }
}

// Normalize a JSON payload into the canonical 66-book array: [{ abbrev, chapters: [[v1, v2, ...]] }]
export function normalizeBibleDataArray(rawJson) {
  const data = typeof rawJson === "string" ? JSON.parse(rawJson.replace(/^\uFEFF/, "")) : rawJson;

  // Format 1: Standard 66-book array [{ abbrev, chapters: [[...]] }]
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].chapters)) {
    return data.map((b, idx) => ({
      abbrev: b.abbrev || `B${idx + 1}`,
      chapters: b.chapters.map((ch) =>
        Array.isArray(ch) ? ch.map((v) => String(v || "").trim()) : []
      ),
    }));
  }

  // Format 2: { books: [{ abbrev/name, chapters: [...] }] }
  if (data && Array.isArray(data.books)) {
    return data.books.map((b, idx) => ({
      abbrev: b.abbrev || b.short_name || `B${idx + 1}`,
      chapters: (b.chapters || []).map((ch) => {
        if (Array.isArray(ch)) return ch.map((v) => (typeof v === "string" ? v : v.text || ""));
        if (ch && Array.isArray(ch.verses)) {
          return ch.verses.map((v) => (typeof v === "string" ? v : v.text || ""));
        }
        return [];
      }),
    }));
  }

  // Format 3: Flat verses array { verses: [{ book, chapter, verse, text }] }
  const flatVerses = Array.isArray(data) ? data : data?.verses;
  if (Array.isArray(flatVerses) && flatVerses.length > 0 && flatVerses[0].text !== undefined) {
    const booksMap = new Map();
    for (const row of flatVerses) {
      const bKey = row.book_number || row.book || 1;
      const cKey = Number(row.chapter) || 1;
      if (!booksMap.has(bKey)) booksMap.set(bKey, new Map());
      const chMap = booksMap.get(bKey);
      if (!chMap.has(cKey)) chMap.set(cKey, []);
      chMap.get(cKey).push(String(row.text || "").trim());
    }
    const result = [];
    for (const [bKey, chMap] of booksMap.entries()) {
      const chapters = [...chMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map((entry) => entry[1]);
      result.push({ abbrev: String(bKey), chapters });
    }
    if (result.length > 0) return result;
  }

  throw new Error(
    "Unsupported JSON Bible structure. Expected 66-book array with chapters or flat verses list."
  );
}

// Parse XML Bibles (Zefania XML <XMLBIBLE>, OpenSong <bible>, <testament><book>, or OSIS <osis>)
export function parseXmlBible(xmlText) {
  const cleanXml = xmlText.replace(/^\uFEFF/, "").trim();
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanXml, "text/xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Invalid XML file format.");
  }

  let bookNodes = Array.from(doc.querySelectorAll("BIBLEBOOK, b, div[type='book'], book"));
  if (bookNodes.length === 0) {
    throw new Error(
      "No Bible book elements (<BIBLEBOOK>, <b>, or <book>) found in XML file."
    );
  }

  const books = bookNodes.map((bNode, bIdx) => {
    const abbrev =
      bNode.getAttribute("bsname") ||
      bNode.getAttribute("bname") ||
      bNode.getAttribute("n") ||
      bNode.getAttribute("osisID") ||
      `B${bIdx + 1}`;
    const chNodes = Array.from(bNode.querySelectorAll(":scope > CHAPTER, :scope > c, :scope > chapter"));
    const chapters = chNodes.map((cNode) => {
      const vNodes = Array.from(cNode.querySelectorAll("VERS, v, verse"));
      return vNodes.map((vNode) => (vNode.textContent || "").replace(/\s+/g, " ").trim());
    });
    return { abbrev, chapters };
  });

  return {
    books,
    detectedTitle:
      doc.documentElement.getAttribute("biblename") ||
      doc.documentElement.getAttribute("translation") ||
      doc.documentElement.getAttribute("version") ||
      "",
    detectedCopyright: doc.documentElement.getAttribute("info") || "",
  };
}

// Parse any uploaded file (.json, .xml, or match known .bib/.bib2 from catalog)
export async function parseImportedBibleFile(file) {
  const fileName = file.name || "";
  const lower = fileName.toLowerCase();

  // If user uploads a Holyrics .bib or .bib2 file, check if we can resolve its slug from the catalog
  if (lower.endsWith(".bib") || lower.endsWith(".bib2")) {
    const baseSlug = lower.replace(/\.bib2?$/, "").replace(/[^a-z0-9_]/g, "");
    const matchedCatalog = ONLINE_BIBLE_CATALOG.find(
      (item) =>
        item.id.toLowerCase() === baseSlug ||
        baseSlug.includes(item.shortLabel.toLowerCase()) ||
        baseSlug.includes(item.id.toLowerCase())
    );
    if (matchedCatalog) {
      const res = await fetch(matchedCatalog.url);
      if (!res.ok) throw new Error(`Could not fetch ${matchedCatalog.fullName}`);
      const rawText = await res.text();
      const books = normalizeBibleDataArray(rawText);
      return {
        books,
        suggestedShortLabel: matchedCatalog.shortLabel,
        suggestedFullName: matchedCatalog.fullName,
        suggestedLang: matchedCatalog.lang,
        suggestedCopyright: matchedCatalog.copyright,
      };
    }
    throw new Error(
      `The file "${fileName}" uses Holyrics' proprietary encrypted container (.bib/.bib2). Please import an XML (.xml) or JSON (.json) Bible file, or install the translation directly from the "Online Catalog" tab.`
    );
  }

  const text = await file.text();

  if (lower.endsWith(".xml") || text.trim().startsWith("<")) {
    const { books, detectedTitle, detectedCopyright } = parseXmlBible(text);
    const baseName = fileName.replace(/\.[^.]+$/, "");
    const isEs = lower.includes("spanish") || lower.startsWith("es");
    const isDe = lower.includes("german") || lower.startsWith("de");
    const isEn = lower.includes("english") || lower.startsWith("en");
    return {
      books,
      suggestedShortLabel: baseName.slice(0, 8).toUpperCase(),
      suggestedFullName: detectedTitle || baseName,
      suggestedLang: isEs ? "es" : isDe ? "de" : isEn ? "en" : "pt",
      suggestedCopyright: detectedCopyright || `Imported from ${fileName}`,
    };
  }

  // Otherwise parse as JSON
  const books = normalizeBibleDataArray(text);
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return {
    books,
    suggestedShortLabel: baseName.slice(0, 8).toUpperCase(),
    suggestedFullName: baseName,
    suggestedLang: baseName.startsWith("es")
      ? "es"
      : baseName.startsWith("de")
      ? "de"
      : baseName.startsWith("en")
      ? "en"
      : "pt",
    suggestedCopyright: `Imported from ${fileName}`,
  };
}
