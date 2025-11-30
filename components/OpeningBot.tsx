'use client';

import React from 'react';

interface OpeningBotProps {
    openingName: string;
    eco?: string;
    description?: string;
}

export const OpeningBot: React.FC<OpeningBotProps> = ({ openingName, eco, description }) => {
    return (
        <div className="bg-gradient-to-r from-ai-highlight to-purple-600 text-white p-3 rounded-lg border-2 border-ai-highlight shadow-[0_0_20px_rgba(255,0,255,0.4)] animate-[float_3s_ease-in-out_infinite]">
            <div className="flex items-start gap-3">
                <div className="text-3xl animate-pulse">🤖</div>
                <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">
                        AI OPENING DETECTED
                    </div>
                    <div className="font-bold text-sm mb-1">
                        {openingName}
                    </div>
                    {description && (
                        <div className="text-[10px] italic opacity-90 mb-1 leading-tight">
                            "{description}"
                        </div>
                    )}
                    {eco && (
                        <div className="text-[9px] opacity-75 font-mono">
                            ECO: {eco}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
