import { useNavigate } from 'react-router';
import { Activity, TrendingUp, BookOpen } from 'lucide-react';
import PrimaryButton from '../components/PrimaryButton';

export function EmptyPainTracking() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="bg-blue-50 p-6 rounded-full mb-6">
        <Activity className="w-12 h-12 text-blue-600" />
      </div>
      <h3 className="text-xl mb-2 text-gray-900">No pain logs yet</h3>
      <p className="text-gray-600 mb-8 max-w-sm">
        Start tracking today to see your recovery progress over time.
      </p>
      <PrimaryButton onClick={() => navigate('/pain-checkin')}>
        Log Pain
      </PrimaryButton>
    </div>
  );
}

export function EmptyProgress() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="bg-green-50 p-6 rounded-full mb-6">
        <TrendingUp className="w-12 h-12 text-green-600" />
      </div>
      <h3 className="text-xl mb-2 text-gray-900">No data yet</h3>
      <p className="text-gray-600 mb-8 max-w-sm">
        Complete your first check-in to start building your progress timeline.
      </p>
      <PrimaryButton onClick={() => navigate('/pain-checkin')}>
        Start Tracking
      </PrimaryButton>
    </div>
  );
}

export function EmptyExercises() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="bg-purple-50 p-6 rounded-full mb-6">
        <BookOpen className="w-12 h-12 text-purple-600" />
      </div>
      <h3 className="text-xl mb-2 text-gray-900">No exercises completed</h3>
      <p className="text-gray-600 mb-8 max-w-sm">
        Start your first exercise to begin your recovery journey.
      </p>
      <PrimaryButton onClick={() => navigate('/exercises')}>
        View Exercises
      </PrimaryButton>
    </div>
  );
}
