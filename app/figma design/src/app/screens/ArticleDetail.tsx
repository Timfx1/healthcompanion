import { ArrowLeft, Clock, Shield, AlertCircle, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

export default function ArticleDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/learn')}>
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-lg text-gray-900">Article</h1>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            5 min read
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <Shield className="w-4 h-4" />
            Medically reviewed
          </div>
        </div>

        <h1 className="text-3xl mb-6 text-gray-900">Grade 3 Ankle Sprain: What to Expect Week by Week</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            A Grade 3 ankle sprain is the most severe type of ankle sprain, involving a complete tear of one or more ankle ligaments. This injury typically requires a longer recovery time and careful rehabilitation to prevent chronic instability.
          </p>

          <h2 className="text-xl mb-3 text-gray-900 mt-8">What happens in a Grade 3 sprain?</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            In a Grade 3 sprain, the ligaments are completely torn or ruptured. You may have heard or felt a "pop" at the time of injury. The ankle will be very swollen, bruised, and unstable. You will likely be unable to put weight on it immediately after the injury.
          </p>

          <h2 className="text-xl mb-3 text-gray-900 mt-8">Recovery timeline</h2>
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-gray-900 mb-2">Week 1-2: Protection phase</h3>
              <p className="text-sm text-gray-700">Focus on reducing swelling and protecting the ankle. You may need a boot or brace. Rest, ice, compression, and elevation are critical.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-gray-900 mb-2">Week 3-4: Early mobility</h3>
              <p className="text-sm text-gray-700">Begin gentle range of motion exercises. You may start partial weight bearing with support.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-gray-900 mb-2">Week 5-8: Strength building</h3>
              <p className="text-sm text-gray-700">Progress to resistance exercises and improve walking without a limp.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-gray-900 mb-2">Week 9-12+: Return to activity</h3>
              <p className="text-sm text-gray-700">Work on balance, agility, and sport-specific movements. Full recovery may take 3-6 months.</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-900 mb-2">When to see a doctor</h3>
              <p className="text-sm text-red-800">
                Seek medical attention if you cannot walk at all, if pain is severe and not improving, or if you notice numbness or severe deformity.
              </p>
            </div>
          </div>

          <h2 className="text-xl mb-3 text-gray-900 mt-8">Related exercises</h2>
          <button
            onClick={() => navigate('/exercises')}
            className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 hover:bg-blue-100 transition-all text-left flex items-center justify-between mb-4"
          >
            <span className="text-blue-900">View your personalized exercise plan</span>
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </button>

          <h2 className="text-xl mb-3 text-gray-900 mt-8">Track your progress</h2>
          <button
            onClick={() => navigate('/pain-checkin')}
            className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 hover:bg-blue-100 transition-all text-left flex items-center justify-between"
          >
            <span className="text-blue-900">Log your pain and symptoms</span>
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
