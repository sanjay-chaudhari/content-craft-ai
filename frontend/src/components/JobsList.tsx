import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

interface JobsListProps {
  apiEndpoint: string;
  setJobId: (jobId: string | null) => void;
  setStatusCheck: (check: boolean) => void;
}

interface Job {
  job_id: string;
  status: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  task_type: string;
  created_at: number;
  prompt?: string;
}

const STATUS_BADGE: Record<string, string> = {
  COMPLETED:  'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  PROCESSING: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  SUBMITTED:  'bg-blue-400/10 text-blue-400 border-blue-400/30',
  FAILED:     'bg-red-400/10 text-red-400 border-red-400/30',
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Ready', PROCESSING: 'Generating', SUBMITTED: 'Queued', FAILED: 'Failed'
};

const TYPE_LABEL: Record<string, string> = {
  TEXT_VIDEO: 'Single Clip',
  MULTI_SHOT_AUTOMATED: 'Auto Multi-Shot',
  MULTI_SHOT_MANUAL: 'Manual Multi-Shot',
};

const JobsList: React.FC<JobsListProps> = ({ apiEndpoint, setJobId, setStatusCheck }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);

  const fetchJobs = async (token?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();
      if (!idToken) throw new Error('No auth token');
      const url = token ? `${apiEndpoint}/jobs?next_token=${encodeURIComponent(token)}` : `${apiEndpoint}/jobs`;
      const response = await axios.get(url, { headers: { Authorization: idToken } });
      setJobs(prev => token ? [...prev, ...response.data.jobs] : response.data.jobs);
      setNextToken(response.data.next_token || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load jobs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [apiEndpoint]);

  const handleSelect = (jobId: string) => {
    setJobId(jobId);
    setStatusCheck(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">Recent Jobs</h3>
        <button
          onClick={() => { setNextToken(null); fetchJobs(); }}
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
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">{error}</div>
      )}

      {isLoading && jobs.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">No jobs yet. Submit your first video above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <button
              key={job.job_id}
              onClick={() => handleSelect(job.job_id)}
              className="w-full text-left rounded-xl bg-slate-800/60 border border-slate-700 hover:border-slate-500 px-4 py-3 transition-all group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Type icon */}
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {job.prompt ? job.prompt.slice(0, 60) + (job.prompt.length > 60 ? '…' : '') : TYPE_LABEL[job.task_type] || job.task_type}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{TYPE_LABEL[job.task_type] || job.task_type} · {formatDate(job.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[job.status] || ''}`}>
                    {STATUS_LABEL[job.status] || job.status}
                  </span>
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {nextToken && (
        <button
          onClick={() => fetchJobs(nextToken)}
          disabled={isLoading}
          className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-colors disabled:opacity-40"
        >
          {isLoading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
};

export default JobsList;
