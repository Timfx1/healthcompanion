import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';

export default function PlanLoadingScreen() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<number[]>([]);

  const steps = [
    'Injury stage',
    'Symptoms',
    'Mobility level',
    'Recovery goal',
    'Safety guidance',
  ];

  useEffect(() => {
    steps.forEach((_, index) => {
      setTimeout(() => {
        setCompleted(prev => [...prev, index]);
      }, (index + 1) * 500);
    });

    setTimeout(() => {
      navigate('/free-plan-unlocked');
    }, 3500);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl text-center mb-12 text-gray-900">
          Building your ankle recovery plan
        </h1>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                completed.includes(index) ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  completed.includes(index) ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                {completed.includes(index) && <Check className="w-5 h-5 text-white" />}
              </div>
              <span className={completed.includes(index) ? 'text-gray-900' : 'text-gray-500'}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
