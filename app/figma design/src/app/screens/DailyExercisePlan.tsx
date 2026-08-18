/**
 * DAILY EXERCISE PLAN SCREEN
 *
 * PURPOSE:
 * - Display today's personalized exercise program
 * - Track exercise completion status
 * - Provide quick access to exercise details
 *
 * COMPONENTS:
 * - Header with progress bar (X of Y completed)
 * - Exercise cards with video placeholder, details, difficulty
 * - Mark complete checkbox for each exercise
 * - "How did this feel?" feedback button
 * - Bottom navigation
 *
 * STATE:
 * - completed: number[] - Array of exercise IDs marked as complete
 * - exercises: array - List of 4 daily exercises with metadata
 *
 * NAVIGATION:
 * - Exercise card click → /exercise/:id (exercise detail page)
 * - "How did this feel?" → (would open feedback modal in production)
 * - Bottom nav tabs → respective sections
 *
 * DATA NEEDED (in production):
 * - Personalized exercise list based on recovery phase
 * - Exercise completion status (persisted to backend)
 * - Video thumbnails/URLs for each exercise
 * - User's previous feedback on exercises
 *
 * EXERCISE METADATA:
 * - id: unique identifier
 * - name: exercise name
 * - sets: e.g., "3 sets × 10 reps"
 * - difficulty: Easy/Medium/Hard (affects color coding)
 * - duration: estimated time to complete
 *
 * INTERACTIONS:
 * - Click card → Navigate to exercise detail
 * - Click checkbox → Toggle completion status (local state)
 * - Click "How did this feel?" → (feedback mechanism, not implemented)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Play, Check } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import ProgressBar from '../components/ProgressBar';

export default function DailyExercisePlan() {
  const navigate = useNavigate();

  // COMPLETED STATE: Tracks which exercises are marked complete (array of IDs)
  const [completed, setCompleted] = useState<number[]>([]);

  // EXERCISES DATA: Today's 4 exercises (would come from API in production)
  const exercises = [
    { id: 1, name: 'Ankle circles', sets: '3 sets × 10 reps', difficulty: 'Easy', duration: '4 min' },
    { id: 2, name: 'Towel stretch', sets: '3 sets × 30 sec hold', difficulty: 'Easy', duration: '5 min' },
    { id: 3, name: 'Resistance band eversion', sets: '3 sets × 12 reps', difficulty: 'Medium', duration: '5 min' },
    { id: 4, name: 'Single-leg balance', sets: '3 sets × 20 sec', difficulty: 'Medium', duration: '4 min' },
  ];

  // TOGGLE COMPLETION: Add/remove exercise ID from completed array
  const toggleComplete = (id: number) => {
    setCompleted(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* HEADER: Title + Progress indicator */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl mb-4 text-gray-900">Today's Exercises</h1>
        {/* Progress bar shows completion ratio */}
        <ProgressBar current={completed.length} total={exercises.length} />
        <p className="text-sm text-gray-600 mt-2">{completed.length} of {exercises.length} completed</p>
      </div>

      {/* EXERCISE LIST */}
      <div className="px-6 py-6 space-y-4">
        {exercises.map((exercise) => {
          const isCompleted = completed.includes(exercise.id);
          const difficultyColor = exercise.difficulty === 'Easy' ? 'text-green-600' : 'text-amber-600';

          return (
            // EXERCISE CARD: Green border/background when completed
            <div
              key={exercise.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all ${
                isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              {/* EXERCISE PREVIEW: Click to view full details → /exercise/:id */}
              <button
                onClick={() => navigate(`/exercise/${exercise.id}`)}
                className="w-full p-5 text-left"
              >
                <div className="flex gap-4">
                  {/* VIDEO THUMBNAIL PLACEHOLDER: Would show actual video thumbnail */}
                  <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Play className="w-8 h-8 text-gray-600" />
                  </div>
                  {/* EXERCISE DETAILS */}
                  <div className="flex-1">
                    <h3 className="text-gray-900 mb-1">{exercise.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{exercise.sets}</p>
                    {/* METADATA: Difficulty (color-coded) + Duration */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className={difficultyColor}>{exercise.difficulty}</span>
                      <span className="text-gray-500">{exercise.duration}</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* ACTION BAR: Completion checkbox + Feedback button */}
              <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                {/* COMPLETION TOGGLE: Mark exercise as done */}
                <button
                  onClick={() => toggleComplete(exercise.id)}
                  className={`flex items-center gap-2 text-sm transition-all ${
                    isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {/* Checkbox: Filled green when complete, empty gray when not */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isCompleted ? 'bg-green-600 border-green-600' : 'border-gray-300'
                  }`}>
                    {isCompleted && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {isCompleted ? 'Completed' : 'Mark complete'}
                </button>

                {/* FEEDBACK BUTTON: Ask how exercise felt (not implemented) */}
                <button className="text-sm text-blue-600">How did this feel?</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTTOM NAVIGATION */}
      <BottomNav />
    </div>
  );
}
