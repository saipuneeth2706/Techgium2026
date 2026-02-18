import React, { useState, useEffect } from "react";
import { 
  Activity, 
  ShieldCheck, 
  XCircle, 
  RefreshCw, 
  BarChart3, 
  AlertTriangle, 
  Clock, 
  Terminal, 
  Eye, 
  PlayCircle,
  ChevronRight,
  Zap,
  LayoutDashboard
} from "lucide-react";
import { clsx } from "clsx";

const API_BASE = "http://localhost:8080";

export function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // State for Image Modal

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/reports`);
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000); 
    return () => clearInterval(interval);
  }, []);

  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white space-y-4">
        <Activity className="w-16 h-16 text-red-600 animate-spin" />
        <p className="text-xl font-bold tracking-widest uppercase">Initializing Intelligence...</p>
      </div>
    );
  }

  const latest = reports[0] || {};
  const current = selectedReport || latest;

  const StatCard = ({ icon: Icon, label, value, color, description }) => (
    <div className="bg-[#111] border border-gray-800/50 p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
      <div className={clsx("absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20", color.replace("text-", "bg-"))}></div>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-black uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-4xl font-black text-white tabular-nums">{value}</p>
          <p className="text-[10px] text-gray-600 mt-2 font-medium">{description}</p>
        </div>
        <div className={clsx("p-3 rounded-xl bg-opacity-10", color.replace("text-", "bg-"))}>
          <Icon className={clsx("w-6 h-6", color)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070707] text-gray-300 font-sans selection:bg-red-600 selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">VISION<span className="text-red-600">ONE</span></span>
            </div>
            <div className="hidden md:flex items-center gap-1 bg-[#161616] p-1 rounded-full border border-gray-800">
              <button className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg">Dashboard</button>
              <button className="px-4 py-1.5 rounded-full text-gray-500 text-xs font-bold hover:text-gray-300">Visuals</button>
              <button className="px-4 py-1.5 rounded-full text-gray-500 text-xs font-bold hover:text-gray-300">Chaos Logs</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">System Status</span>
              <span className="text-xs text-green-500 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Operational
              </span>
            </div>
            <button 
              onClick={fetchReports}
              className="p-2.5 bg-[#161616] hover:bg-[#222] text-gray-400 rounded-xl border border-gray-800 transition-all active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-10">
        {error && (
          <div className="bg-red-900/10 border border-red-900/30 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <AlertTriangle className="w-5 h-5" /> 
            <span className="text-sm font-bold">API CONNECTION ERROR: {error}</span>
          </div>
        )}

        {/* Hero Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={BarChart3} 
            label="Total Executions" 
            value={current.tests_run || 0} 
            color="text-blue-500"
            description="Total number of automated actions performed"
          />
          <StatCard 
            icon={ShieldCheck} 
            label="Success Rate" 
            value={`${Math.round(((current.passes || 0) / (current.tests_run || 1)) * 100)}%`} 
            color="text-green-500"
            description="Percentage of tests that passed successfully"
          />
          <StatCard 
            icon={XCircle} 
            label="Critical Failures" 
            value={current.failures || 0} 
            color="text-red-500"
            description="Detected regressions requiring intervention"
          />
          <StatCard 
            icon={Activity} 
            label="Self-Healed" 
            value={current.healed_count || 0} 
            color="text-purple-500"
            description="UI changes autonomously resolved by AI"
          />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* History Column */}
          <section className="xl:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" /> Session History
              </h2>
              <span className="text-[10px] text-gray-600 font-bold">{reports.length} Runs Found</span>
            </div>
            
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {reports.map((r) => (
                <button 
                  key={r.filename}
                  onClick={() => setSelectedReport(r)}
                  className={clsx(
                    "w-full text-left p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                    selectedReport?.filename === r.filename 
                      ? "bg-[#161616] border-red-600/50 shadow-[0_0_30px_rgba(220,38,38,0.05)]" 
                      : "bg-[#0d0d0d] border-gray-800/50 hover:border-gray-600 hover:bg-[#111]"
                  )}
                >
                  {selectedReport?.filename === r.filename && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
                  )}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-gray-500">
                        {new Date(r.timestamp).toLocaleDateString()}
                      </span>
                      <span className={clsx(
                        "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter",
                        r.failures > 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                      )}>
                        {r.failures > 0 ? "Regression" : "Stable"}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 block font-bold">Execution ID</span>
                        <span className="text-sm text-white font-black">{r.filename.split('_')[1].split('.')[0]}</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex flex-col items-center px-2 py-1 bg-black/40 rounded-lg">
                          <span className="text-[10px] text-gray-600 font-black">P</span>
                          <span className="text-xs text-green-500 font-black">{r.passes}</span>
                        </div>
                        <div className="flex flex-col items-center px-2 py-1 bg-black/40 rounded-lg">
                          <span className="text-[10px] text-gray-600 font-black">F</span>
                          <span className="text-xs text-red-500 font-black">{r.failures}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Main Intelligence View */}
          <section className="xl:col-span-9 space-y-8">
            {/* Current Selection Header */}
            <div className="bg-[#111] border border-gray-800/50 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded uppercase">Active Analysis</span>
                  <span className="text-xs text-gray-500 font-mono">{current.filename}</span>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">
                  Session Intelligence Report
                </h3>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Timestamp</p>
                  <p className="text-sm text-gray-300 font-bold">{new Date(current.timestamp).toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-gray-800"></div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Status</p>
                  <p className={clsx(
                    "text-sm font-black",
                    current.failures > 0 ? "text-red-500" : "text-green-500"
                  )}>{current.failures > 0 ? "ACTION REQUIRED" : "COMPLIANT"}</p>
                </div>
              </div>
            </div>

            {/* Event Log Table */}
            <div className="bg-[#0d0d0d] border border-gray-800/50 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-800/50 bg-[#111]/50 flex items-center justify-between">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-red-600" /> AI Log Stream
                </h4>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-gray-500">Auto-Refreshed Every 5s</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#111]">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Time</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Context</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Intelligence Detail</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {current.events?.map((e, idx) => (
                      <tr key={idx} className="hover:bg-[#161616] transition-colors group">
                        <td className="px-6 py-5">
                          <span className="text-xs font-mono text-gray-500 group-hover:text-gray-400">
                            {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              e.type.includes("Chaos") ? "bg-orange-500" : 
                              e.type.includes("Click") ? "bg-blue-500" : "bg-purple-500"
                            )}></span>
                            <span className="text-sm font-black text-gray-200 uppercase tracking-tight">{e.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 max-w-md">
                          <p className="text-xs text-gray-400 font-medium leading-relaxed">
                            {e.details || "No supplementary data available."}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <div className={clsx(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                            e.status === "Success" || e.status === "Pass" ? "bg-green-500/10 text-green-500" :
                            e.status === "Healed" ? "bg-purple-500/10 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]" :
                            "bg-red-500/10 text-red-500"
                          )}>
                            {e.status === "Healed" && <Activity className="w-3 h-3" />}
                            {e.status}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!current.events || current.events.length === 0) && (
                      <tr>
                        <td colSpan="4" className="p-20 text-center">
                          <div className="flex flex-col items-center gap-4 text-gray-600">
                            <Eye className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-black uppercase tracking-widest opacity-40">No event data streamed yet</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Evidence & Stream Intelligence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="bg-[#111] border border-gray-800/50 rounded-3xl p-6 space-y-6 flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" /> Evidence Gallery
                  </h4>
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    {current.events?.filter(e => e.details?.includes(".png")).length || 0} Screenshots
                  </span>
                </div>
                
                <div className="flex-grow">
                  {current.events?.some(e => e.details?.includes(".png")) ? (
                    <div className="grid grid-cols-2 gap-4 h-full max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {current.events
                        .filter(e => e.details?.includes(".png"))
                        .map((e, idx) => {
                          const filename = e.details.split("Screenshot: ")[1].split(" ")[0];
                          const fullUrl = `${API_BASE}/reports/${filename}`;
                          return (
                            <div 
                              key={idx} 
                              onClick={() => setSelectedImage({ url: fullUrl, event: e.type, time: e.timestamp })}
                              className="group relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-800 hover:border-red-600/50 transition-all cursor-zoom-in"
                            >
                              <img 
                                src={fullUrl}
                                className="w-full h-full object-contain transition-transform group-hover:scale-110"
                                alt={`Event ${idx}`}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                <span className="text-[9px] font-black text-white uppercase tracking-tighter">{e.type}</span>
                                <span className="text-[8px] text-gray-400 font-mono">{new Date(e.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center bg-black/40 rounded-2xl border border-gray-800/50 border-dashed">
                      <p className="text-xs text-gray-700 font-black uppercase tracking-widest">No visual logs available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Real Video Playback */}
              <div className="bg-[#111] border border-gray-800/50 rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-green-500" /> Session Replay (Autonomous Monitoring)
                  </h4>
                  {current.video_filename && (
                    <span className="text-[10px] text-green-500 font-black uppercase tracking-widest animate-pulse">Session Recorded</span>
                  )}
                </div>
                
                <div className="aspect-video bg-black rounded-2xl flex items-center justify-center border border-gray-800 overflow-hidden shadow-2xl relative">
                   {current.video_filename ? (
                    <video 
                      key={current.video_filename}
                      controls
                      autoPlay={false}
                      className="w-full h-full"
                    >
                      <source src={`${API_BASE}/reports/videos/${current.video_filename}`} type="video/webm" />
                      <source src={`${API_BASE}/reports/videos/${current.video_filename}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800">
                        <PlayCircle className="w-8 h-8 text-gray-700" />
                      </div>
                      <p className="text-xs text-gray-700 font-black uppercase tracking-widest">Video recording not found for this session</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-black/40 rounded-xl border border-gray-800/50">
                   <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                     <span className="text-red-600 font-black mr-2 uppercase">Intelligence Note:</span> 
                     Full session recording available for regression analysis and auditing.
                   </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center gap-6">
             <button 
               className="absolute top-0 right-0 p-4 text-white hover:text-red-600 transition-colors"
               onClick={() => setSelectedImage(null)}
             >
               <XCircle className="w-10 h-10" />
             </button>
             <div className="w-full h-full flex items-center justify-center">
               <img 
                 src={selectedImage.url} 
                 className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-gray-800"
                 alt="Enlarged Evidence"
                 onClick={(e) => e.stopPropagation()}
               />
             </div>
             <div className="bg-[#111] p-4 rounded-2xl border border-gray-800 w-full max-w-2xl flex justify-between items-center shadow-2xl">
                <div className="space-y-1">
                  <span className="text-[10px] text-red-600 font-black uppercase tracking-widest">Event Context</span>
                  <p className="text-lg font-black text-white">{selectedImage.event}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Timestamp</span>
                  <p className="text-sm text-gray-400 font-mono">{new Date(selectedImage.time).toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="max-w-[1600px] mx-auto p-10 border-t border-gray-800/50 mt-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <Zap className="w-4 h-4 text-white fill-white" />
            <span className="text-sm font-black text-white tracking-tighter uppercase">VisionOne Agent</span>
          </div>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">© 2026 AI-DRIVEN TESTING FRAMEWORK FOR OTT ECOSYSTEMS</p>
        </div>
      </footer>
    </div>
  );
}
