import { bookAbbreviations } from "../data/bookAbbreviations";

const abbrevToName = Object.entries(bookAbbreviations).reduce((acc, [name, abbrev]) => {
  acc[abbrev] = name;
  return acc;
}, {});

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const STOP_WORDS = new Set([
  "a", "o", "as", "os", "de", "do", "da", "dos", "das", "e", "em", "um", "uma",
  "que", "para", "com", "por", "no", "na", "nos", "nas", "se", "seu", "sua",
]);

export function searchVerses(query, bibleData, { limit = 30 } = {}) {
  const queryWords = normalize(query)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  if (queryWords.length === 0) return [];

  const results = [];

  for (const book of bibleData) {
    const bookName = abbrevToName[book.abbrev];
    if (!bookName) continue;

    book.chapters.forEach((chapterVerses, chapterIdx) => {
      chapterVerses.forEach((text, verseIdx) => {
        const normalizedText = normalize(text);
        let score = 0;
        for (const word of queryWords) {
          if (normalizedText.includes(word)) score += 1;
        }
        if (score > 0) {
          results.push({
            book: bookName,
            chapter: chapterIdx + 1,
            verse: verseIdx + 1,
            text,
            score,
          });
        }
      });
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}