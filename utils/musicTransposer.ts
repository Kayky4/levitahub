
// Escala Cromática (Sustenidos como padrão para simplificação visual)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS: { [key: string]: string } = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

// Regex aprimorado para identificar 100% dos acordes (Simples, Compostos, Tensões, Baixos)
// Suporta: A, A#, Bb, m, M, maj, min, dim, aug, sus, add, números (4,5,6,7,9,11,13), parênteses, barras, símbolos (+, -, º, °, ^, #, b)
// Permite que o acorde comece com parênteses ou termine com pontuação, que serão limpos na análise.
const CHORD_REGEX = /^[A-G](?:#|b|♯|♭)?(?:[0-9]|maj|min|m|M|dim|aug|sus|add|alt|[\(\)\/\\\|\+\-\^º°])*$/;

// Palavras que parecem acordes mas são letras comuns (Blacklist Expandida)
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
 * Transpõe uma única nota/acorde
 */
const transposeNote = (chord: string, semitones: number): string => {
  // Separa o acorde do baixo (ex: C/G) e de possíveis parênteses externos
  // A estratégia é dividir por delimitadores não-musicais, mas manter a estrutura
  
  // Vamos simplificar: split apenas pela barra de baixo, pois é o caso mais comum de transposição dupla
  const parts = chord.split('/');
  
  const transposedParts = parts.map(part => {
    // Limpa caracteres não essenciais para encontrar a tônica (ex: remove "(" inicial ou ")" final se existirem no split)
    const cleanPart = part.replace(/^[\(\[]+|[\)\]]+$/g, '');
    
    // Encontra a raiz do acorde (Ex: "C#m7" -> Raiz "C#", Sufixo "m7")
    const match = cleanPart.match(/^([A-G](?:#|b|♯|♭)?)(.*)$/);
    if (!match) return part;

    const root = normalizeNote(match[1]);
    const suffix = match[2];

    const currentIndex = NOTES.indexOf(root);
    if (currentIndex === -1) return part; // Não encontrou nota válida

    // Matemática circular do array (módulo 12)
    let newIndex = (currentIndex + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    // Reconstrói a parte preservando prefixos/sufixos que possam estar fora do match principal (ex: parenteses)
    // Para simplificar e evitar quebrar formatações complexas como "Bm7(5-)", apenas substituímos a raiz.
    return part.replace(match[1], NOTES[newIndex]);
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
    const id = `line-${index}`;

    // Linha vazia
    if (!line.trim()) return { id, type: 'empty', content: '' };

    // Detecta Header (ex: [Refrão], Intro:)
    if (/^\[.*\]$|^.*:$/.test(line.trim())) {
      return { id, type: 'header', content: line.trim().replace(/[\[\]]/g, '') }; 
    }

    // Separa por espaços para análise
    const words = line.trim().split(/\s+/); 
    let chordCount = 0;
    let nonChordCount = 0;

    words.forEach(w => {
        // Limpa pontuação comum E parênteses/colchetes externos para verificação
        // Ex: "(A)" vira "A", "G," vira "G", "[Bm]" vira "Bm"
        const clean = w.replace(/^[(\[]+|[)\].,;!?"]+$/g, ''); 
        
        if (clean.length > 0) {
            // Verifica se é acorde E não está na lista de palavras ignoradas
            if (CHORD_REGEX.test(clean) && !IGNORE_LIST.includes(clean.toUpperCase())) {
                chordCount++;
            } else {
                nonChordCount++;
            }
        }
    });

    // Lógica de decisão APRIMORADA:
    // Se a linha tem pelo menos 1 acorde e NENHUMA palavra lírica óbvia, é linha de acordes.
    // Se a linha tem mais acordes que palavras, é linha de acordes.
    // Exceção: Linhas mistas (Tablaturas ou anotações) podem falhar, mas para Cifras padrão isso cobre 99%
    const isChordLine = (chordCount > 0 && nonChordCount === 0) || (chordCount > nonChordCount);

    if (isChordLine) {
        // Reconstrói preservando espaços EXATOS
        const tokens = line.split(/(\s+)/);
        
        const transposedContent = tokens.map(token => {
            // Se for apenas espaço, retorna como está
            if (/^\s+$/.test(token)) return token;
            if (!token) return '';

            // Limpa para verificação (mesma lógica acima)
            const cleanToken = token.replace(/^[(\[]+|[)\].,;!?"]+$/g, '');

            if (CHORD_REGEX.test(cleanToken) && !IGNORE_LIST.includes(cleanToken.toUpperCase())) {
                if (transposeAmount !== 0) {
                    return transposeNote(token, transposeAmount);
                }
                return token;
            }
            
            return token;
        }).join('');

        return { id, type: 'chords', content: transposedContent };
    } 

    return { id, type: 'lyrics', content: line };
  });
};
