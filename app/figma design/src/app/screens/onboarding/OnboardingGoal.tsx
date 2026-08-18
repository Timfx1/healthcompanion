import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Footprints, Zap, Trophy, TrendingDown, Shield, HelpCircle, Activity } from 'lucide-react';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressBar from '../../components/ProgressBar';

export default function OnboardingGoal() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  const goals = [
    { id: 'walk', icon: Footprints, label: 'Walk without pain' },
    { id: 'swelling', icon: TrendingDown, label: 'Reduce swelling' },
    { id: 'mobility', icon: Activity, label: 'Improve mobility' },
    { id: 'running', icon: Zap, label: 'Return to running' },
    { id: 'sport', icon: Trophy, label: 'Return to sport' },
    { id: 'prevent', icon: Shield, label: 'Prevent future sprains' },
    { id: 'understand', icon: HelpCircle, label: 'Understand my recovery better' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      <div className="mb-6">
        <ProgressBar current={5} total={5} />
        <p className="text-sm text-gray-500 mt-2">Step 5 of 5</p>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl mb-2 text-gray-900">What is your main goal?</h1>
        <p className="text-gray-500">This helps us personalize your recovery plan</p>
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {goals.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={`w-full p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
              selected === id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`p-3 rounded-xl ${selected === id ? 'bg-blue-600' : 'bg-gray-100'}`}>
              <Icon className={`w-5 h-5 ${selected === id ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <span className={`text-left ${selected === id ? 'text-blue-900' : 'text-gray-900'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      <PrimaryButton
        onClick={() => navigate('/notifications')}
        disabled={!selected}
      >
        Continue
      </PrimaryButton>
    </div>
  );
}
