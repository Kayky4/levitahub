
import React, { useMemo } from 'react';
import { parseAndTranspose } from '../../utils/musicTransposer';

interface Props {
  content: string;
  transpose?: number;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
  mode?: 'viewer' | 'controller';
  // Allow overriding theme locally
  customTheme?: {
    textColor?: string;
    chordColor?: string;
    backgroundColor?: string;
  };
}

const ChordRenderer: React.FC<Props> = ({ content, transpose = 0, fontSize = 'lg', mode = 'viewer', customTheme }) => {
  const lines = useMemo(() => parseAndTranspose(content, transpose), [content, transpose]);

  const fontSizes: any = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
    '2xl': 'text-xl sm:text-2xl',
    'inherit': 'text-[1em]'
  };

  const sizeClass = fontSizes[fontSize] || 'text-[1em]';

  // -- THEME CONFIGURATION --
  
  // Controller (Clean/Adaptive Mode - for Editors and Dashboards)
  // DEFAULT RED for chords as requested
  const controllerStyles = {
    container: 'text-gray-900 dark:text-gray-200',
    chord: customTheme?.chordColor || 'text-red-600 font-black', // Default RED
    text: customTheme?.textColor || 'text-gray-900 dark:text-gray-200',
    header: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10'
  };

  // Viewer (Dark/Stage Mode - High Contrast)
  const viewerStyles = {
    container: 'text-gray-200',
    chord: 'text-yellow-400 font-bold', // Viewer keeps yellow for contrast on dark unless overridden
    text: 'text-white',
    header: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30'
  };

  const styles = mode === 'controller' ? controllerStyles : viewerStyles;

  return (
    <div className={`font-mono w-full overflow-x-auto ${sizeClass} ${styles.container}`} style={{ lineHeight: '1.5' }}>
      {lines.map((line) => {
        if (line.type === 'empty') {
          return <div key={line.id} className="h-[1.5em]" />;
        }

        // Section Headers (Intro, Refrão) - High Visibility
        if (line.type === 'header') {
          return (
            <div 
              key={line.id} 
              className={`
                ${styles.header} 
                inline-block px-3 py-1 my-4 rounded-lg
                font-black uppercase tracking-widest text-[0.85em] border
              `}
            >
              {line.content.trim()}
            </div>
          );
        }

        // Chords - Strictly preserved whitespace
        if (line.type === 'chords') {
          return (
            <div 
              key={line.id} 
              className={`${styles.chord} whitespace-pre mt-[0.2em] select-text tracking-tight`}
            >
              {line.content}
            </div>
          );
        }

        // Lyrics - Strictly preserved whitespace
        return (
          <div 
            key={line.id} 
            className={`${styles.text} whitespace-pre mb-[0.5em] font-medium opacity-90 select-text`}
          >
            {line.content}
          </div>
        );
      })}
    </div>
  );
};

export default ChordRenderer;
