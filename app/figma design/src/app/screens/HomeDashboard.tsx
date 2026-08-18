/**
 * HOME DASHBOARD (Main App Screen)
 *
 * PURPOSE:
 * - Primary landing page after user completes onboarding
 * - Shows current recovery status and daily action items
 * - Hub for accessing exercises, tracking, and education
 *
 * COMPONENTS:
 * - Header: Recovery phase badge + day counter + progress ring
 * - Today's exercises card → navigates to /exercises
 * - Pain check-in button → navigates to /pain-checkin
 * - Swelling tracker button → navigates to /progress
 * - Learn card → navigates to /article/:id
 * - Red flags safety card → navigates to /red-flags
 * - BottomNav: Persistent navigation (Home, Plan, Track, Learn, Profile)
 *
 * STATE:
 * - None (uses hardcoded recovery phase data for prototype)
 *
 * NAVIGATION:
 * - "Today's exercises" card → /exercises
 * - "Pain check-in" card → /pain-checkin
 * - "Swelling tracker" card → /progress
 * - "Learn" card → /article/swelling-normal
 * - "Red flags" card → /red-flags
 * - Bottom nav tabs navigate to respective sections
 *
 * DATA NEEDED (in production):
 * - User's current recovery phase (e.g., "Phase 1: Protect & Reduce Swelling")
 * - Days since injury (e.g., "Day 5 since injury")
 * - Progress percentage through current phase (e.g., 38%)
 * - Today's exercise count and estimated time
 * - Recent check-in status
 *
 * RECOVERY PHASES:
 * Phase 1: Protect & Reduce Swelling (1-3 days)
 * Phase 2: Early Mobility (4-14 days)
 * Phase 3: Strength (2-4 weeks)
 * Phase 4: Balance & Stability (3-6 weeks)
 * Phase 5: Return to Running (6-8 weeks)
 * Phase 6: Return to Sport (8-12 weeks)
 */

import { useNavigate } from 'react-router';
import { Activity, AlertCircle, TrendingUp, BookOpen, ChevronRight } from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function HomeDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER: Blue gradient with recovery status */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-2xl mb-4">Today's Recovery Plan</h1>

        {/* RECOVERY STATUS CARD: Phase badge, day counter, progress bar */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* PHASE BADGE: Shows current recovery phase (1-6) */}
              <div className="bg-white/30 px-3 py-1 rounded-full text-sm">
                Phase 1: Protect & Reduce Swelling
              </div>
            </div>
            {/* DAY COUNTER: Days since injury occurred */}
            <span className="text-sm">Day 5 since injury</span>
          </div>
          {/* PROGRESS BAR: Percentage through current phase */}
          <div className="relative">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '38%' }} />
            </div>
            <span className="text-xs mt-1 block">38% through current phase</span>
          </div>
        </div>
      </div>

      {/* MAIN ACTION CARDS */}
      <div className="px-6 -mt-4 space-y-4">
        {/* TODAY'S EXERCISES CARD: Navigate to exercise list → /exercises */}
        <button
          onClick={() => navigate('/exercises')}
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg text-gray-900">Today's exercises</h3>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          {/* Exercise summary: count and estimated time */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">4 exercises</span>
            <span className="text-blue-600">18 min</span>
          </div>
        </button>

        {/* TRACKING CARDS: 2-column grid for Pain & Swelling */}
        <div className="grid grid-cols-2 gap-4">
          {/* PAIN CHECK-IN CARD: Navigate to pain logging → /pain-checkin */}
          <button
            onClick={() => navigate('/pain-checkin')}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <Activity className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="text-sm text-gray-900">Pain check-in</h3>
          </button>

          {/* SWELLING TRACKER CARD: Navigate to progress charts → /progress */}
          <button
            onClick={() => navigate('/progress')}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <TrendingUp className="w-6 h-6 text-green-600 mb-3" />
            <h3 className="text-sm text-gray-900">Swelling tracker</h3>
          </button>
        </div>

        {/* LEARN CARD: Featured educational article → /article/:id */}
        <button
          onClick={() => navigate('/article/swelling-normal')}
          className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-5 hover:bg-blue-100 transition-all text-left"
        >
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-gray-900 mb-1">Learn</h3>
              <p className="text-sm text-gray-600">When should swelling improve?</p>
            </div>
          </div>
        </button>

        {/* RED FLAGS CARD: Safety warnings and when to seek medical care → /red-flags */}
        <button
          onClick={() => navigate('/red-flags')}
          className="w-full bg-red-50 border border-red-100 rounded-2xl p-5 hover:bg-red-100 transition-all text-left"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-gray-900 mb-1">Safety</h3>
              <p className="text-sm text-gray-600">When to see a doctor</p>
            </div>
          </div>
        </button>
      </div>

      {/* BOTTOM NAVIGATION: Persistent nav bar (Home, Plan, Track, Learn, Profile) */}
      <BottomNav />
    </div>
  );
}
