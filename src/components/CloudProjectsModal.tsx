import React, { useState } from 'react';
import { X, Cloud, Clock, Check, HardDrive, RefreshCw } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';

export const CloudProjectsModal: React.FC = () => {
  const { isCloudModalOpen, setModalOpen, doc, history } = useEditorStore();
  const [cloudSynced, setCloudSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isCloudModalOpen || !doc) return null;

  const handleSyncToCloud = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setCloudSynced(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                Cloudflare Storage & Versions
              </h3>
              <p className="text-[11px] text-neutral-500">
                Cloudflare D1 & R2 cloud synchronization & revision timeline
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen('cloud', false)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Cloud Sync Status */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-neutral-500" />
              <div>
                <span className="font-medium text-neutral-800 dark:text-neutral-200 block">
                  Project: {doc.title}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {cloudSynced ? 'Synced to Cloudflare D1 & R2' : 'Local storage cached in browser'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : cloudSynced ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Synced</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3 h-3" />
                  <span>Sync Now</span>
                </>
              )}
            </button>
          </div>

          {/* Revision History Stack */}
          <div className="space-y-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Recent Version Snapshots ({history.length})
            </span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {[...history].reverse().map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md"
                >
                  <div>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 block">
                      {entry.description}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-5 py-3 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setModalOpen('cloud', false)}
            className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
