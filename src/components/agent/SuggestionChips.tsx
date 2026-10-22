"use client";

import React from "react";

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const CHIPS = [
  "What has Lokesh built?",
  "Tell me about his experience",
  "Which stack does he use?",
  "Contact Lokesh",
];

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onSelect, disabled }) => {
  return (
    <div className="flex flex-wrap gap-2 pt-1 pb-2">
      {CHIPS.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip)}
          className="min-h-[44px] px-3.5 py-2 rounded-full border border-[#0d0d0d]/15 bg-[#f4f2ee] hover:bg-[#0d0d0d] hover:text-white text-xs font-medium text-[#0d0d0d] transition-all duration-200 active:scale-95 disabled:opacity-50 text-left flex items-center cursor-pointer"
        >
          <span>{chip}</span>
        </button>
      ))}
    </div>
  );
};
