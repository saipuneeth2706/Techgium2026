import { useState } from "react";
import { Settings, Bug, WifiOff, XCircle, Zap, Activity } from "lucide-react";
import { clsx } from "clsx";

export function ChaosControl({
  onToggleBuffering,
  onTriggerError,
  onTriggerAudioSync,
  onTriggerCrash,
  activeChaos,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors",
          isOpen && "rotate-45",
        )}
      >
        <Bug className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-[#222] border border-gray-700 rounded-lg p-4 w-64 shadow-2xl animate-in slide-in-from-bottom-2">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Chaos Mode
          </h3>

          <div className="space-y-2">
            <button
              onClick={onToggleBuffering}
              className={clsx(
                "w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors",
                activeChaos.buffering
                  ? "bg-red-900/50 text-red-200 border border-red-800"
                  : "bg-white/5 text-gray-300 hover:bg-white/10",
              )}
            >
              <Activity className="w-4 h-4" />
              {activeChaos.buffering ? "Stop Buffering" : "Trigger Buffering"}
            </button>

            <button
              onClick={onTriggerError}
              className={clsx(
                "w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors",
                activeChaos.error
                  ? "bg-red-900/50 text-red-200 border border-red-800"
                  : "bg-white/5 text-gray-300 hover:bg-white/10",
              )}
            >
              <XCircle className="w-4 h-4" />
              Trigger DRM Error
            </button>

            <button
              onClick={onTriggerAudioSync}
              className={clsx(
                "w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors",
                activeChaos.audioSync
                  ? "bg-yellow-900/50 text-yellow-200 border border-yellow-800"
                  : "bg-white/5 text-gray-300 hover:bg-white/10",
              )}
            >
              <WifiOff className="w-4 h-4" />
              Audio Sync Issue
            </button>

            <button
              onClick={onTriggerCrash}
              className={clsx(
                "w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors",
                activeChaos.uiCrash
                  ? "bg-orange-900/50 text-orange-200 border border-orange-800"
                  : "bg-white/5 text-gray-300 hover:bg-white/10",
              )}
            >
              <Zap className="w-4 h-4" />
              UI Crash (Hide Play)
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 transition-colors bg-white/5 text-gray-400 hover:bg-white/10 mt-4 border-t border-gray-700"
            >
              Reset Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
