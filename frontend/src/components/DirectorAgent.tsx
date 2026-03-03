import React, { useState } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

interface Shot {
  shot_number: number;
  prompt: string;
  duration: number;
  purpose: string;
}

interface ProductionPlan {
  title: string;
  reasoning: string;
  total_duration: number;
  style: string;
  shots: Shot[];
}

interface DirectorAgentProps {
  apiEndpoint: string;
  onPlanAccepted: (shots: { text: string }[]) => void;
}

const DirectorAgent: React.FC<DirectorAgentProps> = ({ apiEndpoint, onPlanAccepted }) => {
  const [goal, setGoal] = useState('');
  const [styleHint, setStyleHint] = useState('');
  const [plan, setPlan] = useState<ProductionPlan | null>(null);
  const [editableShots, setEditableShots] = useState<Shot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingStep, setThinkingStep] = useState('');

  const THINKING_STEPS = [
    '🎬 Analyzing your creative goal...',
    '🧠 Nova is reasoning about the narrative arc...',
    '🎥 Designing shot composition...',
    '✍️ Writing cinematic prompts...',
    '🎞️ Finalizing production plan...',
  ];

  const handleGenerate = async () => {
    if (!goal.trim() || goal.length < 10) {
      setError('Please describe your video goal (min 10 characters)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null);

    // Animate thinking steps
    let stepIndex = 0;
    setThinkingStep(THINKING_STEPS[0]);
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % THINKING_STEPS.length;
      setThinkingStep(THINKING_STEPS[stepIndex]);
    }, 1800);

    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();
      if (!idToken) throw new Error('No auth token');

      const response = await axios.post(
        `${apiEndpoint}/plan`,
        { goal, style_hint: styleHint },
        { headers: { Authorization: idToken, 'Content-Type': 'application/json' } }
      );

      const generatedPlan: ProductionPlan = response.data;
      setPlan(generatedPlan);
      setEditableShots([...generatedPlan.shots]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate plan. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setThinkingStep('');
      setIsLoading(false);
    }
  };

  const handleShotPromptEdit = (index: number, newPrompt: string) => {
    const updated = [...editableShots];
    updated[index] = { ...updated[index], prompt: newPrompt };
    setEditableShots(updated);
  };

  const handleAccept = () => {
    onPlanAccepted(editableShots.map(s => ({ text: s.prompt })));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-aws-orange mb-1">🎬 Nova Director Agent</h3>
        <p className="text-aws-gray-300 text-sm">
          Describe your video idea in plain language. Nova will reason about it and create a full production plan.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-aws-gray-300 mb-1">
            What's your video about?
          </label>
          <textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="e.g. A 60-second product promo for an artisan coffee brand with a warm, rustic feel. Show the journey from bean to cup."
            className="w-full p-3 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100 min-h-[100px] text-sm"
            disabled={isLoading}
          />
          <p className="text-xs text-aws-gray-400 mt-1">{goal.length}/1000 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-aws-gray-300 mb-1">
            Style hint <span className="text-aws-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={styleHint}
            onChange={e => setStyleHint(e.target.value)}
            placeholder="e.g. cinematic, documentary, fast-paced, dreamy, noir..."
            className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100 text-sm"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`w-full py-3 rounded font-medium transition-colors ${
            isLoading
              ? 'bg-aws-blue-light text-aws-gray-400 cursor-not-allowed'
              : 'bg-aws-orange hover:bg-aws-orange-light text-white'
          }`}
        >
          {isLoading ? '✨ Nova is thinking...' : '✨ Generate Production Plan'}
        </button>
      </div>

      {/* Thinking animation */}
      {isLoading && thinkingStep && (
        <div className="bg-aws-blue-dark border border-aws-orange border-opacity-30 rounded p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-4 w-4 border-2 border-aws-orange border-t-transparent rounded-full flex-shrink-0" />
            <p className="text-aws-orange text-sm font-medium">{thinkingStep}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-aws-red bg-opacity-20 border border-aws-red rounded text-aws-red text-sm">
          {error}
        </div>
      )}

      {/* Production Plan */}
      {plan && !isLoading && (
        <div className="space-y-4">
          {/* Plan summary */}
          <div className="bg-aws-blue-dark rounded p-4 border border-aws-orange border-opacity-20">
            <h4 className="text-aws-orange font-semibold text-base mb-1">{plan.title}</h4>
            <p className="text-aws-gray-300 text-sm mb-3">{plan.reasoning}</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="bg-aws-blue-light px-2 py-1 rounded text-aws-gray-300">
                🎞️ {plan.shots.length} shots
              </span>
              <span className="bg-aws-blue-light px-2 py-1 rounded text-aws-gray-300">
                ⏱️ {plan.total_duration}s total
              </span>
              <span className="bg-aws-blue-light px-2 py-1 rounded text-aws-gray-300">
                🎨 {plan.style}
              </span>
            </div>
          </div>

          {/* Editable shots */}
          <div>
            <p className="text-sm text-aws-gray-300 mb-3">
              Review and edit the shots below, then click <span className="text-aws-orange">Use This Plan</span> to generate your video.
            </p>
            <div className="space-y-3">
              {editableShots.map((shot, index) => (
                <div key={index} className="bg-aws-blue-dark rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-aws-orange text-sm font-medium">Shot {shot.shot_number}</span>
                    <span className="text-xs text-aws-gray-400 bg-aws-blue-light px-2 py-0.5 rounded">
                      {shot.duration}s · {shot.purpose}
                    </span>
                  </div>
                  <textarea
                    value={shot.prompt}
                    onChange={e => handleShotPromptEdit(index, e.target.value)}
                    className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100 text-sm min-h-[80px]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 py-3 bg-aws-orange hover:bg-aws-orange-light text-white rounded font-medium transition-colors"
            >
              🚀 Use This Plan
            </button>
            <button
              onClick={handleGenerate}
              className="px-4 py-3 bg-aws-blue-light hover:bg-aws-blue border border-aws-gray-600 text-aws-gray-100 rounded transition-colors text-sm"
            >
              🔄 Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorAgent;
