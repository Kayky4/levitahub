
// Escala Cromática (Sustenidos como padrão para simplificação visual)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS: { [key: string]: string } = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

// Regex aprimorado para identificar acordes complexos (ex: A#m7(11), G/B, Csus4(add9), Cmaj7)
// Suporta parênteses aninhados, números, extensões, barras e símbolos
const CHORD_REGEX = /^[A-G](?:#|b)?(?:m|M|maj|min|dim|aug|sus|add|[\d\(\)\/\+\-º°])*$/;

// Palavras que parecem acordes mas são letras comuns (Blacklist)
const IGNORE_LIST = ["A", "E", "O", "DA", "DE", "DO", "EM", "UM", "ME", "SE", "NA", "NO", "EU", "PRA", "QUE", "TE", "TU", "AO", "OS", "AS"];

/**
 * Normaliza nota (converte bemol para sustenido para cálculo)
 */
const normalizeNote = (note: string): string => {
  return FLATS[note] || note;
};

/**
 * Transpõe uma única nota/acorde
 */
const transposeNote = (chord: string, semitones: number): string => {
  // Separa o acorde do baixo (ex: C/G)
  const parts = chord.split('/');
  
  const transposedParts = parts.map(part => {
    // Encontra a raiz do acorde (Ex: "C#m7" -> Raiz "C#", Sufixo "m7")
    const match = part.match(/^([A-G](?:#|b)?)(.*)$/);
    if (!match) return part;

    const root = normalizeNote(match[1]);
    const suffix = match[2];

    const currentIndex = NOTES.indexOf(root);
    if (currentIndex === -1) return part; // Não encontrou nota válida

    // Matemática circular do array (módulo 12)
    let newIndex = (currentIndex + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    return NOTES[newIndex] + suffix;
  });

  return transposedParts.join('/');
};

export interface ParsedLine {
  id: string;
  type: 'chords' | 'lyrics' | 'header' | 'empty';
  content: string;
}

/**
 * Analisa o conteúdo e aplica transposição se necessário
 */
export const parseAndTranspose = (content: string, transposeAmount: number = 0): ParsedLine[] => {
  if (!content) return [];

  return content.split('\n').map((line, index) => {
    // IMPORTANTE: Não fazemos trim() no início da linha para preservar alinhamento visual exato
    const id = `line-${index}`;

    // Linha vazia
    if (!line.trim()) return { id, type: 'empty', content: '' };

    // Detecta Header (ex: [Refrão], Intro:)
    if (/^\[.*\]$|^.*:$/.test(line.trim())) {
      return { id, type: 'header', content: line.trim().replace(/[\[\]]/g, '') }; // Remove brackets for cleaner UI
    }

    // Separa por espaços para análise, mas mantemos o original para renderização
    const words = line.trim().split(/\s+/); 
    let chordCount = 0;
    let nonChordCount = 0;

    words.forEach(w => {
        // Limpa pontuação comum que pode estar colada na palavra
        const clean = w.replace(/[,.;!?"]+$/, ''); 
        
        if (clean.length > 0) {
            // Verifica se é acorde E não está na lista de palavras ignoradas
            if (CHORD_REGEX.test(clean) && !IGNORE_LIST.includes(clean.toUpperCase())) {
                chordCount++;
            } else {
                nonChordCount++;
            }
        }
    });

    // Lógica de decisão: É linha de acorde se a maioria das "palavras" forem acordes
    // Ajuste: Se tiver pelo menos 1 acorde e NENHUMA palavra não-acorde, é acorde.
    const isChordLine = (chordCount > 0 && nonChordCount === 0) || (chordCount > nonChordCount);

    if (isChordLine) {
        // Se for linha de acorde, precisamos reconstruir preservando os espaços EXATOS
        // Usamos split com regex de captura de espaços para manter os delimitadores
        const tokens = line.split(/(\s+)/);
        
        const transposedContent = tokens.map(token => {
            // Se for apenas espaço, retorna como está (preserva alinhamento)
            if (/^\s+$/.test(token)) return token;
            if (!token) return '';

            // Tenta transpor se parecer acorde
            const cleanToken = token.replace(/[,.;!?"]+$/, '');
            if (CHORD_REGEX.test(cleanToken) && !IGNORE_LIST.includes(cleanToken.toUpperCase())) {
                if (transposeAmount !== 0) {
                    return transposeNote(token, transposeAmount);
                }
                return token;
            }
            
            // Se não for acorde (ex: anotação no meio da linha), retorna original
            return token;
        }).join('');

        return { id, type: 'chords', content: transposedContent };
    } 

    // Se é letra, retorna a linha original INTACTA (com espaços iniciais)
    return { id, type: 'lyrics', content: line };
  });
};
