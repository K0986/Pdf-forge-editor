import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X, Replace, ReplaceAll } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';

export const SearchReplaceBar: React.FC = () => {
  const {
    isSearchOpen,
    setSearchOpen,
    searchQuery,
    replaceText,
    searchMatches,
    activeMatchIndex,
    searchCaseSensitive,
    searchWholeWord,
    performSearch,
    nextSearchMatch,
    prevSearchMatch,
    replaceCurrentMatch,
    replaceAllMatches,
    setReplaceText,
  } = useEditorStore();

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed sm:absolute top-20 sm:top-24 right-2 sm:right-8 left-2 sm:left-auto z-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xl rounded-lg p-3 max-w-sm sm:w-84 text-xs select-none space-y-2 animate-in fade-in slide-in-from-top-4 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-700">
        <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-blue-500" /> Find & Replace
        </span>
        <button
          onClick={() => setSearchOpen(false)}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Find Input */}
      <div className="relative flex items-center">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => performSearch(e.target.value, searchCaseSensitive, searchWholeWord)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) prevSearchMatch();
              else nextSearchMatch();
            } else if (e.key === 'Escape') {
              setSearchOpen(false);
            }
          }}
          placeholder="Find in document..."
          className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 pr-20"
        />

        {/* Counter & Next/Prev */}
        <div className="absolute right-1.5 flex items-center gap-1 text-[11px] text-neutral-400">
          <span>
            {searchMatches.length > 0 ? `${activeMatchIndex + 1}/${searchMatches.length}` : '0/0'}
          </span>
          <button
            onClick={prevSearchMatch}
            disabled={searchMatches.length === 0}
            className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded disabled:opacity-30"
            title="Previous (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextSearchMatch}
            disabled={searchMatches.length === 0}
            className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded disabled:opacity-30"
            title="Next (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Replace Input */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Replace with..."
          className="flex-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={replaceCurrentMatch}
          disabled={searchMatches.length === 0}
          className="px-2 py-1.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded font-medium disabled:opacity-40"
          title="Replace Current"
        >
          Replace
        </button>
        <button
          onClick={replaceAllMatches}
          disabled={searchMatches.length === 0}
          className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-40"
          title="Replace All"
        >
          All
        </button>
      </div>

      {/* Options: Match Case, Whole Word */}
      <div className="flex items-center gap-4 text-[11px] text-neutral-600 dark:text-neutral-400 pt-1">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={searchCaseSensitive}
            onChange={(e) => performSearch(searchQuery, e.target.checked, searchWholeWord)}
            className="rounded text-blue-600"
          />
          <span>Match case</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={searchWholeWord}
            onChange={(e) => performSearch(searchQuery, searchCaseSensitive, e.target.checked)}
            className="rounded text-blue-600"
          />
          <span>Whole word</span>
        </label>
      </div>
    </div>
  );
};
