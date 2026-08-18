import { ArrowLeft, AlertCircle, MapPin, FileText } from 'lucide-react';
import { useNavigate } from 'react-router';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

export default function RedFlags() {
  const navigate = useNavigate();

  const warningCards = [
    {
      title: 'Cannot bear weight',
      description: 'Unable to put any weight on the injured ankle or take 4 steps',
      severity: 'urgent',
    },
    {
      title: 'Severe swelling or deformity',
      description: 'Ankle looks misshapen or swelling is extreme and not improving',
      severity: 'urgent',
    },
    {
      title: 'Numbness or tingling',
      description: 'Loss of sensation in the foot or toes, or persistent pins and needles',
      severity: 'urgent',
    },
    {
      title: 'Pain getting worse',
      description: 'Pain is increasing instead of gradually improving over time',
      severity: 'warning',
    },
    {
      title: 'Signs of infection after surgery',
      description: 'Fever, excessive warmth, redness, or discharge from surgical site',
      severity: 'urgent',
    },
    {
      title: 'Calf pain or shortness of breath',
      description: 'Deep calf pain, swelling, or difficulty breathing (possible blood clot)',
      severity: 'urgent',
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/home')}>
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl text-gray-900">Red Flags</h1>
      </div>

      <div className="px-6 py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-red-900 mb-2">When to seek medical help</h2>
            <p className="text-sm text-red-800">
              These symptoms may indicate a serious problem that needs professional evaluation.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {warningCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-xl p-5 border-2 ${
                card.severity === 'urgent'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    card.severity === 'urgent' ? 'bg-red-600' : 'bg-amber-600'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3
                    className={`mb-1 ${
                      card.severity === 'urgent' ? 'text-red-900' : 'text-amber-900'
                    }`}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={`text-sm ${
                      card.severity === 'urgent' ? 'text-red-800' : 'text-amber-800'
                    }`}
                  >
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <PrimaryButton onClick={() => navigate('/local-help')}>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" />
              Find a clinician near me
            </div>
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/doctor-report')}>
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              Create doctor report
            </div>
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
