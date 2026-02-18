import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ChaosControl } from "../components/chaos/ChaosControl";
import { clsx } from "clsx";
// import videojs from 'video.js'; // Not used in this simple HTML5 version, but keeping reference.

export function Player() {
  const navigate = useNavigate();
  const { id } = useParams();
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Chaos States
  const [chaosState, setChaosState] = useState({
    buffering: false,
    error: false,
    audioSync: false,
    uiCrash: false,
  });

  // Standard Video Logic
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress =
      (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Chaos Handlers
  const handleToggleBuffering = () => {
    setChaosState((prev) => {
      const newState = { ...prev, buffering: !prev.buffering };
      if (videoRef.current) {
        if (newState.buffering) {
          videoRef.current.pause();
        } else if (isPlaying) {
          videoRef.current.play();
        }
      }
      return newState;
    });
  };

  const handleTriggerError = () => {
    setChaosState((prev) => ({ ...prev, error: !prev.error }));
    if (videoRef.current) videoRef.current.pause();
  };

  const handleTriggerAudioSync = () => {
    setChaosState((prev) => {
      const newState = { ...prev, audioSync: !prev.audioSync };
      if (videoRef.current) {
        // Simple simulation: mute the video but keep "playing" visual
        videoRef.current.muted = newState.audioSync || isMuted;
      }
      return newState;
    });
  };

  const handleTriggerCrash = () => {
    setChaosState((prev) => ({ ...prev, uiCrash: !prev.uiCrash }));
  };

  // 3s Timer to hide controls
  useEffect(() => {
    let timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden group"
      onMouseMove={() => setShowControls(true)}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/browse")}
        className={clsx(
          "absolute top-4 left-4 z-40 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <ArrowLeft />
      </button>

      {/* Video Element */}
      {/* Using Big Buck Bunny as test source */}
      {!chaosState.error && (
        <video
          ref={videoRef}
          src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          loop
        />
      )}

      {/* Overlays */}

      {/* 1. Buffering Overlay */}
      {chaosState.buffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <Loader2 className="w-16 h-16 text-red-600 animate-spin" />
        </div>
      )}

      {/* 2. DRM Error Overlay */}
      {chaosState.error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black text-white p-8 text-center">
          <AlertTriangle className="w-20 h-20 text-red-600 mb-6" />
          <h2 className="text-3xl font-bold mb-2">Playback Error</h2>
          <p className="text-xl text-gray-400 mb-8">
            DRM_LICENSE_INVALID (Error 5001)
          </p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Reload Player
          </Button>
        </div>
      )}

      {/* 3. Controls Overlay */}
      {!chaosState.error && (
        <div
          className={clsx(
            "absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent px-4 pb-6 pt-20 transition-opacity duration-300",
            showControls || !isPlaying ? "opacity-100" : "opacity-0",
          )}
        >
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-600 rounded cursor-pointer mb-4 hover:h-2 transition-all group/progress">
            <div
              className="h-full bg-red-600 rounded relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 -top-1 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/progress:scale-100 transition-transform"></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Play Button - Hidden in UI Crash Mode */}
              {!chaosState.uiCrash && (
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-gray-300"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-white" />
                  ) : (
                    <Play className="w-8 h-8 fill-white" />
                  )}
                </button>
              )}

              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300"
              >
                <span className="text-sm">10s</span>
              </button>

              <div className="flex items-center space-x-2 group/volume">
                <button onClick={toggleMute} className="text-white">
                  {isMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
                <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                  <div className="w-20 h-1 bg-gray-600 ml-2 rounded">
                    <div className="w-2/3 h-full bg-red-600 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-white font-medium text-sm">
              Big Buck Bunny <span className="text-gray-400 mx-2">|</span> 2008
            </div>

            <div>
              <button className="text-white hover:text-gray-300">
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Sync Warning (Visual Indicator for validation) */}
      {chaosState.audioSync && (
        <div className="absolute top-4 right-20 text-yellow-500 bg-black/80 px-2 py-1 text-xs rounded border border-yellow-500">
          ⚠️ Audio Sync Lag: 1200ms
        </div>
      )}

      {/* Chaos Control Panel */}
      <ChaosControl
        onToggleBuffering={handleToggleBuffering}
        onTriggerError={handleTriggerError}
        onTriggerAudioSync={handleTriggerAudioSync}
        onTriggerCrash={handleTriggerCrash}
        activeChaos={chaosState}
      />
    </div>
  );
}
