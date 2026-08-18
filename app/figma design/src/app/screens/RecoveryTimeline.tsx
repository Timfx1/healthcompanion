import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function RecoveryTimeline() {
  const navigate = useNavigate();

  const phases = [
    {
      phase: 1,
      name: 'Protection & swelling control',
      duration: '1-3 days',
      goals: ['Reduce pain and swelling', 'Protect the ankle', 'Begin gentle movement'],
      exercises: ['Ankle pumps', 'Toe curls', 'Ice therapy'],
      status: 'completed',
    },
    {
      phase: 2,
      name: 'Mobility',
      duration: '4-14 days',
      goals: ['Restore range of motion', 'Reduce stiffness', 'Light weight bearing'],
      exercises: ['Ankle circles', 'Towel stretch', 'Alphabet writing'],
      status: 'current',
    },
    {
      phase: 3,
      name: 'Strength',
      duration: '2-4 weeks',
      goals: ['Build ankle strength', 'Improve walking', 'Reduce limp'],
      exercises: ['Resistance band work', 'Heel raises', 'Toe walks'],
      status: 'upcoming',
    },
    {
      phase: 4,
      name: 'Balance & stability',
      duration: '3-6 weeks',
      goals: ['Improve balance', 'Prevent re-injury', 'Dynamic movement'],
      exercises: ['Single-leg balance', 'Wobble board', 'Mini lunges'],
      status: 'upcoming',
    },
    {
      phase: 5,
      name: 'Return to running',
      duration: '6-8 weeks',
      goals: ['Pain-free running', 'Build endurance', 'Sport-specific drills'],
      exercises: ['Jogging', 'Agility drills', 'Jump training'],
      status: 'upcoming',
    },
    {
      phase: 6,
      name: 'Return to sport',
      duration: '8-12 weeks',
      goals: ['Full sport participation', 'Prevent future injury', 'Peak performance'],
      exercises: ['Sport drills', 'Contact training', 'Competition prep'],
      status: 'upcoming',
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-6">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/home')}>
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl text-gray-900">Recovery Timeline</h1>
      </div>

      <div className="px-6 py-6">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {phases.map((phase, index) => {
            const isCurrent = phase.status === 'current';
            const isCompleted = phase.status === 'completed';
            const isUpcoming = phase.status === 'upcoming';

            return (
              <div key={phase.phase} className="relative pb-8 last:pb-0">
                <div className="flex gap-4">
                  <div className="relative z-10 flex-shrink-0">
                    {isCompleted && (
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {isCurrent && (
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                        <Circle className="w-6 h-6 text-white fill-white" />
                      </div>
                    )}
                    {isUpcoming && (
                      <div className="w-12 h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                        <Circle className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className={`flex-1 ${isUpcoming ? 'opacity-60' : ''}`}>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      {isCurrent && (
                        <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
                          You are here
                        </div>
                      )}
                      <h3 className="text-gray-900 mb-1">
                        Phase {phase.phase}: {phase.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">{phase.duration}</p>

                      <div className="mb-3">
                        <h4 className="text-sm text-gray-700 mb-2">Goals</h4>
                        <ul className="space-y-1">
                          {phase.goals.map((goal, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">•</span>
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm text-gray-700 mb-2">Key exercises</h4>
                        <div className="flex flex-wrap gap-2">
                          {phase.exercises.map((exercise, i) => (
                            <span key={i} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-lg">
                              {exercise}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
