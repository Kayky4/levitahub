
// Utilitário para detecção e formatação de cifras

export interface MusicLine {
  id: string;
  type: 'chords' | 'lyrics' | 'empty' | 'header';
  content: string;
}

const CHORD_REGEX = /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?(?:2|4|5|6|7|9|11|13)?(?:[#b](?:5|9|11|13))?(?:\/[A-G](?:#|b)?)?$/;

// Lista de palavras comuns em português/inglês que podem ser confundidas com acordes (ex: "A", "E")
// Se a linha contiver palavras fora dessa lista e não parecer acorde, é letra.
const COMMON_WORDS = ["A", "E", "O", "DA", "DE", "DO", "EM", "UM", "ME", "SE", "NA", "NO", "EU"];

export const parseMusicContent = (content: string): MusicLine[] => {
  if (!content) return [];

  return content.split('\n').map((line, index) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      return { id: `line-${index}`, type: 'empty', content: '' };
    }

    // Heurística para detectar cabeçalhos de seção (ex: [Refrão], Intro:)
    if (/^\[.*\]$|^.*:$/.test(trimmed)) {
      return { id: `line-${index}`, type: 'header', content: trimmed };
    }

    // Heurística para detectar linha de acordes
    // Divide a linha em "palavras"
    const words = trimmed.split(/\s+/);
    let chordCount = 0;
    let nonChordCount = 0;

    words.forEach(word => {
      // Remove pontuação para análise
      const cleanWord = word.replace(/[^a-zA-Z0-9#\/]/g, '');
      
      if (CHORD_REGEX.test(cleanWord) && !COMMON_WORDS.includes(cleanWord)) {
        chordCount++;
      } else if (cleanWord.length > 0) {
        nonChordCount++;
      }
    });

    // Se mais de 50% das "palavras" forem acordes, consideramos linha de acordes
    // Ajuste fino: Se tiver poucas palavras e todas parecerem acordes
    const isChordLine = chordCount > nonChordCount || (chordCount > 0 && nonChordCount === 0);

    return {
      id: `line-${index}`,
      type: isChordLine ? 'chords' : 'lyrics',
      content: line // Mantemos a linha original com espaços para preservar formatação visual
    };
  });
};
