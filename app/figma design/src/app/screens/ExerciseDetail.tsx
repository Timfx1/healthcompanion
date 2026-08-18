import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Play, Check, AlertCircle } from 'lucide-react';
import PrimaryButton from '../components/PrimaryButton';

export default function ExerciseDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCompleted, setIsCompleted] = useState(false);

  const exercise = {
    name: 'Ankle circles',
    purpose: 'Improves ankle mobility and reduces stiffness',
    sets: '3 sets × 10 reps',
    instructions: [
      'Sit in a chair with your injured ankle off the ground',
      'Slowly rotate your ankle in a circular motion clockwise',
      'Complete 10 circles, then switch to counter-clockwise',
      'Rest for 30 seconds between sets',
      'Repeat for 3 sets total',
    ],
    painRule: 'Stop if pain goes above 5/10',
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="relative">
        <button
          onClick={() => navigate('/exercises')}
          className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>

        <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <div className="bg-white rounded-full p-8 shadow-xl">
            <Play className="w-16 h-16 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <h1 className="text-2xl mb-2 text-gray-900">{exercise.name}</h1>
        <p className="text-gray-600 mb-4">{exercise.purpose}</p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-lg text-blue-900">{exercise.sets}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg mb-3 text-gray-900">Instructions</h2>
          <div className="space-y-3">
            {exercise.instructions.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                  {index + 1}
                </div>
                <p className="text-gray-700 pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-900 mb-1">Pain rule</h3>
            <p className="text-sm text-amber-800">{exercise.painRule}</p>
          </div>
        </div>

        <div className="space-y-3">
          <PrimaryButton>
            <div className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Start timer
            </div>
          </PrimaryButton>
          <button
            onClick={() => setIsCompleted(!isCompleted)}
            className={`w-full py-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
              isCompleted
                ? 'bg-green-50 border-green-600 text-green-700'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isCompleted ? 'bg-green-600 border-green-600' : 'border-gray-400'
            }`}>
              {isCompleted && <Check className="w-3 h-3 text-white" />}
            </div>
            {isCompleted ? 'Completed' : 'Mark complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
