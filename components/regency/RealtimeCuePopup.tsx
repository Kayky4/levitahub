import React, { useEffect, useState } from 'react';
import { RegencyCue } from '../../services/types';

interface Props {
  cue: RegencyCue | null;
}

const RealtimeCuePopup: React.FC<Props> = ({ cue }) => {
  const [visible, setVisible] = useState(false);
  const [currentCue, setCurrentCue] = useState<RegencyCue | null>(null);

  useEffect(() => {
    if (cue && cue.id !== currentCue?.id) {
      setCurrentCue(cue);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000); // Show for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [cue, currentCue]);

  if (!visible || !currentCue) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in">
      <div className="bg-yellow-400 text-black font-black text-4xl px-8 py-4 rounded-xl shadow-2xl border-4 border-yellow-600 uppercase tracking-widest">
        {currentCue.message}
      </div>
    </div>
  );
};

export default RealtimeCuePopup;
