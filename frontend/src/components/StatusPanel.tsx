import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

interface StatusPanelProps {
  apiEndpoint: string;
  jobId: string | null;
  statusCheck: boolean;
  setStatusCheck: (check: boolean) => void;
}

interface JobStatus {
  status: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  video_url?: string;
  videoUrl?: string;
  error?: string;
  shots?: { url: string }[];
  task_type?: string;
  created_at?: number;
}

const STATUS_CONFIG = {
  SUBMITTED:  { label: 'Queued',     color: 'text-blue-400',  bg: 'bg-blue-400/10 border-blue-400/30',  dot: 'bg-blue-400'  },
  PROCESSING: { label: 'Generating', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', dot: 'bg-amber-400', pulse: true },
  COMPLETED:  { label: 'Ready',      color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', dot: 'bg-emerald-400' },
  FAILED:     { label: 'Failed',     color: 'text-red-400',   bg: 'bg-red-400/10 border-red-400/30',    dot: 'bg-red-400'   },
};

const StatusPanel: React.FC<StatusPanelProps> = ({ apiEndpoint, jobId, statusCheck, setStatusCheck }) => {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShot, setSelectedShot] = useState<number | null>(null);
  const POLLING_INTERVAL = 30000;

  const checkStatus = useCallback(async () => {
    if (!jobId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();
      if (!idToken) throw new Error('No auth token');
      const response = await axios.get(`${apiEndpoint}/job_status/${jobId}`, {
        headers: { Authorization: idToken }
      });
      setStatus(response.data);
      return response.data.status === 'COMPLETED' || response.data.status === 'FAILED';
    } catch {
      setError('Unable to fetch job status. Please refresh.');
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, jobId]);

  useEffect(() => {
    if (!jobId || !statusCheck) return;
    checkStatus();
    const interval = setInterval(async () => {
      const done = await checkStatus();
      if (done) { clearInterval(interval); setStatusCheck(false); }
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [jobId, statusCheck, checkStatus, setStatusCheck]);

  const videoUrl = status?.video_url || status?.videoUrl || null;
  const cfg = status ? STATUS_CONFIG[status.status] : null;

  if (!jobId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-16">
        <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">Submit a job to see results here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Generation Status</h2>
        <button
          onClick={() => checkStatus()}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-40"
        >
          <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Status badge */}
      {cfg && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${cfg.bg} ${cfg.color}`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${'pulse' in cfg ? 'animate-pulse' : ''}`} />
          {cfg.label}
          {isLoading && <span className="text-xs opacity-60 ml-1">· checking</span>}
        </div>
      )}

      {/* Processing state */}
      {status?.status === 'PROCESSING' && (
        <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-300 text-sm font-medium">Nova is generating your video</p>
          <p className="text-slate-500 text-xs mt-1">This typically takes 3–8 minutes. Auto-refreshing every 30s.</p>
        </div>
      )}

      {/* Submitted state */}
      {status?.status === 'SUBMITTED' && (
        <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-6 text-center">
          <p className="text-slate-300 text-sm">Job queued — processing will begin shortly.</p>
        </div>
      )}

      {/* Failed state */}
      {status?.status === 'FAILED' && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-red-400 text-sm font-medium">Generation failed</p>
          {status.error && <p className="text-red-400/70 text-xs mt-1">{status.error}</p>}
        </div>
      )}

      {/* Completed — video player */}
      {status?.status === 'COMPLETED' && videoUrl && (
        <div className="space-y-3">
          {/* Main / selected shot player */}
          <div className="rounded-xl overflow-hidden bg-black aspect-video">
            <video
              key={selectedShot !== null ? status.shots?.[selectedShot]?.url : videoUrl}
              src={selectedShot !== null ? status.shots?.[selectedShot]?.url : videoUrl}
              controls
              autoPlay
              className="w-full h-full"
            />
          </div>

          {selectedShot !== null && (
            <button onClick={() => setSelectedShot(null)} className="text-xs text-amber-400 hover:underline">
              ← Back to full video
            </button>
          )}

          {/* Download */}
          <a
            href={videoUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Video
          </a>

          {/* Shot grid */}
          {status.shots && status.shots.length > 1 && (
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Individual Shots</p>
              <div className="grid grid-cols-4 gap-2">
                {status.shots.map((shot, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedShot(i)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      selectedShot === i ? 'border-amber-400' : 'border-transparent hover:border-slate-500'
                    }`}
                  >
                    <video src={shot.url} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {i + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusPanel;
