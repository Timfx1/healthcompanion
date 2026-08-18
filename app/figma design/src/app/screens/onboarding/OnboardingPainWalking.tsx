import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle } from 'lucide-react';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressBar from '../../components/ProgressBar';

export default function OnboardingPainWalking() {
  const navigate = useNavigate();
  const [painLevel, setPainLevel] = useState(5);
  const [walkingAbility, setWalkingAbility] = useState('');

  const walkingOptions = [
    { id: 'normal', label: 'Yes, normally' },
    { id: 'limping', label: 'Yes, but limping' },
    { id: 'support', label: 'Only with support' },
    { id: 'cannot', label: 'No, I cannot walk on it' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      <div className="mb-6">
        <ProgressBar current={4} total={5} />
        <p className="text-sm text-gray-500 mt-2">Step 4 of 5</p>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl mb-6 text-gray-900">Pain and walking ability</h1>

        <div className="mb-8">
          <label className="block text-gray-700 mb-3">How painful is it today?</label>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">No pain</span>
            <span className="text-2xl text-blue-600">{painLevel}</span>
            <span className="text-sm text-gray-500">Worst pain</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <span key={num}>{num}</span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-3">Can you walk on the injured ankle?</label>
          <div className="space-y-2">
            {walkingOptions.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setWalkingAbility(id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  walkingAbility === id
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-900">
              Severe pain, deformity, numbness, or inability to bear weight may require medical attention.
            </p>
          </div>
        </div>
      </div>

      <PrimaryButton
        onClick={() => navigate('/onboarding/goal')}
        disabled={!walkingAbility}
      >
        Continue
      </PrimaryButton>
    </div>
  );
}
