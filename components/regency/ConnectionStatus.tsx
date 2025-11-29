
import React from 'react';

interface Props {
  status: 'connected' | 'disconnected' | 'connecting';
  lastPing?: string;
}

const ConnectionStatus: React.FC<Props> = ({ status }) => {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider hidden sm:inline">Online</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
         <span className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></span>
         <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider hidden sm:inline">Reconectando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
       <span className="h-2 w-2 bg-red-500 rounded-full"></span>
       <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">OFFLINE</span>
    </div>
  );
};

export default ConnectionStatus;
