import { useState } from 'react';
import { useNavigate } from 'react-router';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressBar from '../../components/ProgressBar';

export default function OnboardingTimeline() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  const options = [
    { id: 'today', label: 'Today / last 48 hours' },
    { id: '3-7days', label: '3–7 days ago' },
    { id: '1-3weeks', label: '1–3 weeks ago' },
    { id: '1-3months', label: '1–3 months ago' },
    { id: '3months+', label: 'More than 3 months ago' },
    { id: 'surgery', label: 'Recovering after surgery' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      <div className="mb-6">
        <ProgressBar current={2} total={5} />
        <p className="text-sm text-gray-500 mt-2">Step 2 of 5</p>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl mb-2 text-gray-900">When did the injury happen?</h1>
        <p className="text-gray-500">This helps us personalize your recovery plan</p>
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {options.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
              selected === id
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <PrimaryButton
        onClick={() => navigate('/onboarding/symptoms')}
        disabled={!selected}
      >
        Continue
      </PrimaryButton>
    </div>
  );
}
