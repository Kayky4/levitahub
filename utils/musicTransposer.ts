
// Escala Cromática (Sustenidos como padrão para simplificação visual)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS: { [key: string]: string } = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

// Regex para identificar notas musicais (Raiz + Acidente)
const NOTE_REGEX = /([A-G](?:#|b|♯|♭)?)/g;

// Regex para validar se uma string é tecnicamente um acorde
const CHORD_VALIDATION_REGEX = /^[A-G](?:#|b|♯|♭)?(?:[0-9]|maj|min|m|M|dim|aug|sus|add|alt|[\(\)\/\\\|\+\-\^º°])*$/;

// Palavras que parecem acordes mas são letras comuns (Blacklist)
const IGNORE_LIST = [
  "A", "E", "O", "DA", "DE", "DO", "EM", "UM", "ME", "SE", "NA", "NO", "EU", 
  "PRA", "QUE", "TE", "TU", "AO", "OS", "AS", "OU", "JA", "LA", "SÓ", "NUM", 
  "DUM", "NOS", "NAS", "PELA", "PELO"
];

/**
 * Normaliza nota (converte bemol para sustenido para cálculo)
 */
const normalizeNote = (note: string): string => {
  return FLATS[note] || note;
};

/**
 * Transpõe uma única nota isolada
 */
const transposeSingleRoot = (noteWithAccidental: string, semitones: number): string => {
  const root = normalizeNote(noteWithAccidental);
  const currentIndex = NOTES.indexOf(root);
  if (currentIndex === -1) return noteWithAccidental; // Falback

  let newIndex = (currentIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  return NOTES[newIndex];
};

/**
 * Transpõe um token de acorde completo (ex: "Bm7(b5)/E")
 * Utiliza Regex para substituir apenas a Raiz e o Baixo, preservando o sufixo.
 */
const transposeChordToken = (token: string, semitones: number): string => {
  if (semitones === 0) return token;

  // Substitui notas encontradas, mas com contexto
  return token.replace(NOTE_REGEX, (match, note, offset) => {
    // Verifica o que vem antes da nota encontrada
    const prefix = token.substring(0, offset);
    
    // É nota tônica se estiver no início (ignorando parenteses de abertura)
    const isRoot = /^[\(\[\{]*$/.test(prefix);
    
    // É nota baixo se for precedida imediatamente por uma barra
    const isBass = /[\/]$/.test(prefix);

    if (isRoot || isBass) {
      return transposeSingleRoot(match, semitones);
    }
    
    // Caso contrário, é parte do sufixo (ex: o "A" em "maj7", ou "b" em "b5"), não mexe
    return match;
  });
};

export interface ParsedLine {
  id: string;
  type: 'chords' | 'lyrics' | 'header' | 'empty';
  content: string;
}

/**
 * Analisa o conteúdo e aplica transposição
 * Utiliza tokenização inteligente para preservar espaços.
 */
export const parseAndTranspose = (content: string, transposeAmount: number = 0): ParsedLine[] => {
  if (!content || typeof content !== 'string') return [];

  return content.split('\n').map((line, index) => {
    const id = `line-${index}`;
    const trimmed = line.trim();

    // 1. Linha Vazia
    if (!trimmed) return { id, type: 'empty', content: '' };

    // 2. Detecta Header (ex: [Refrão], Intro:)
    if (/^\[.*\]$|^.*:$/.test(trimmed)) {
      return { id, type: 'header', content: trimmed.replace(/[\[\]]/g, '') }; 
    }

    // 3. Análise de Densidade de Acordes
    // Separa por espaços para contagem
    const words = trimmed.split(/\s+/); 
    let chordCount = 0;
    let nonChordCount = 0;

    words.forEach(w => {
        // Limpa pontuação comum E parênteses/colchetes externos para validação
        const clean = w.replace(/^[(\[]+|[)\].,;!?"]+$/g, ''); 
        
        if (clean.length > 0) {
            // Verifica se é acorde E não está na lista de palavras ignoradas
            if (CHORD_VALIDATION_REGEX.test(clean) && !IGNORE_LIST.includes(clean.toUpperCase())) {
                chordCount++;
            } else {
                nonChordCount++;
            }
        }
    });

    // Lógica de decisão: Mais acordes que palavras ou apenas acordes
    const isChordLine = (chordCount > 0 && nonChordCount === 0) || (chordCount > nonChordCount);

    if (isChordLine) {
        // 4. Tokenização Preservando Espaços (Split com capture group)
        // Divide por qualquer sequência de espaços em branco
        const tokens = line.split(/(\s+)/);
        
        const transposedContent = tokens.map(token => {
            // Se for espaço, retorna intacto
            if (/^\s+$/.test(token)) return token;
            if (!token) return '';

            // Limpa para validação
            const cleanToken = token.replace(/^[(\[]+|[)\].,;!?"]+$/g, '');

            // Se for acorde válido, transpõe
            if (CHORD_VALIDATION_REGEX.test(cleanToken) && !IGNORE_LIST.includes(cleanToken.toUpperCase())) {
                return transposeChordToken(token, transposeAmount);
            }
            
            // Se não for acorde (ex: anotação no meio da cifra), retorna intacto
            return token;
        }).join('');

        return { id, type: 'chords', content: transposedContent };
    } 

    // 5. Linha de Letra
    return { id, type: 'lyrics', content: line };
  });
};
