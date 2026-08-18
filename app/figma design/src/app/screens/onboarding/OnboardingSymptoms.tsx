import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressBar from '../../components/ProgressBar';

export default function OnboardingSymptoms() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);

  const symptoms = [
    'Swelling',
    'Bruising',
    'Pain when walking',
    'Cannot bear weight',
    'Stiffness',
    'Weakness',
    'Instability',
    'Numbness or tingling',
  ];

  const toggleSymptom = (symptom: string) => {
    setSelected(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      <div className="mb-6">
        <ProgressBar current={3} total={5} />
        <p className="text-sm text-gray-500 mt-2">Step 3 of 5</p>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl mb-2 text-gray-900">What symptoms are you experiencing?</h1>
        <p className="text-gray-500 mb-4">Select all that apply</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">This app provides guidance, not a medical diagnosis.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 mb-6">
        {symptoms.map((symptom) => (
          <button
            key={symptom}
            onClick={() => toggleSymptom(symptom)}
            className={`p-4 rounded-xl border-2 transition-all relative ${
              selected.includes(symptom)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {selected.includes(symptom) && (
              <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <span className={`text-sm ${selected.includes(symptom) ? 'text-blue-900' : 'text-gray-900'}`}>
              {symptom}
            </span>
          </button>
        ))}
      </div>

      <PrimaryButton
        onClick={() => navigate('/onboarding/pain-walking')}
        disabled={selected.length === 0}
      >
        Continue
      </PrimaryButton>
    </div>
  );
}
