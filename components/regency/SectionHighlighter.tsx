import React, { useEffect, useRef } from 'react';
import { SongSection } from '../../services/types';

interface Props {
  sections: SongSection[];
  activeIndex: number | null;
}

const SectionHighlighter: React.FC<Props> = ({ sections, activeIndex }) => {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (activeIndex !== null && sectionRefs.current[activeIndex]) {
      sectionRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div className="space-y-6 pb-32">
      {sections.map((section, idx) => {
        const isActive = idx === activeIndex;
        return (
          <div
            key={section.id}
            ref={(el) => { sectionRefs.current[idx] = el; }}
            className={`
              transition-all duration-300 rounded-lg p-6 border-l-8
              ${isActive 
                ? 'bg-blue-50 border-blue-600 shadow-lg scale-105' 
                : 'bg-white border-gray-200 opacity-60'
              }
            `}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className={`text-xl font-bold uppercase tracking-wide ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
                {section.name}
              </h3>
              {isActive && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded animate-pulse">
                  AO VIVO
                </span>
              )}
            </div>
            
            <pre className={`whitespace-pre-wrap font-mono text-lg md:text-2xl leading-relaxed ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              {section.content}
            </pre>

            {section.cues && isActive && (
               <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded font-medium">
                 ℹ Nota: {section.cues}
               </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SectionHighlighter;
