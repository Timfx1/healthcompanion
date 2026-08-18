/**
 * ONBOARDING STEP 1/5: INJURY TYPE
 *
 * PURPOSE:
 * - Collect user's injury classification
 * - First step of personalized onboarding flow
 * - Helps tailor recovery plan to injury severity/type
 *
 * COMPONENTS:
 * - ProgressBar: Shows "Step 1 of 5" with visual progress indicator
 * - Question: "What best describes your ankle issue?"
 * - 6 selectable injury type cards with icons
 * - Continue button (disabled until selection made)
 *
 * STATE:
 * - selected: string - ID of currently selected injury type
 * - options: array - 6 injury type options with id, icon, label
 *
 * NAVIGATION:
 * - Continue button → /onboarding/timeline (step 2/5)
 * - Button disabled until user selects an option
 *
 * DATA NEEDED:
 * - User selection stored locally (would save to backend in production)
 *
 * INJURY TYPE OPTIONS:
 * 1. Recent ankle sprain (most common)
 * 2. Severe ankle sprain / Grade 3 (complete ligament tear)
 * 3. Chronic ankle instability (recurring issues)
 * 4. Post-surgery recovery (surgical repair)
 * 5. Ankle pain after sports (activity-related)
 * 6. I'm not sure yet (needs assessment)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Activity, Zap, Shield, Footprints, HelpCircle } from 'lucide-react';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressBar from '../../components/ProgressBar';

export default function OnboardingInjuryType() {
  const navigate = useNavigate();

  // SELECTED STATE: Tracks which injury type user chose (ID from options array)
  const [selected, setSelected] = useState('');

  // INJURY TYPE OPTIONS: 6 categorized injury types
  const options = [
    { id: 'recent', icon: AlertCircle, label: 'Recent ankle sprain' },
    { id: 'severe', icon: Zap, label: 'Severe ankle sprain / Grade 3' },
    { id: 'chronic', icon: Activity, label: 'Chronic ankle instability' },
    { id: 'surgery', icon: Shield, label: 'Post-surgery recovery' },
    { id: 'sports', icon: Footprints, label: 'Ankle pain after sports' },
    { id: 'unsure', icon: HelpCircle, label: "I'm not sure yet" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      {/* PROGRESS INDICATOR: Shows step 1/5 with visual bar */}
      <div className="mb-6">
        <ProgressBar current={1} total={5} />
        <p className="text-sm text-gray-500 mt-2">Step 1 of 5</p>
      </div>

      {/* QUESTION SECTION */}
      <div className="mb-8">
        <h1 className="text-2xl mb-2 text-gray-900">What best describes your ankle issue?</h1>
        <p className="text-gray-500">Select the option that matches your situation</p>
      </div>

      {/* INJURY TYPE CARDS: 6 selectable options */}
      <div className="flex-1 space-y-3 mb-6">
        {options.map(({ id, icon: Icon, label }) => (
          // CARD BUTTON: Selects injury type, updates 'selected' state
          // - Blue border/background when selected
          // - Icon changes to white on blue when selected
          // - onClick sets selected state to this card's ID
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
              selected === id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* ICON CONTAINER: Background changes based on selection */}
            <div className={`p-3 rounded-xl ${selected === id ? 'bg-blue-600' : 'bg-gray-100'}`}>
              <Icon className={`w-5 h-5 ${selected === id ? 'text-white' : 'text-gray-600'}`} />
            </div>
            {/* LABEL TEXT */}
            <span className={`text-left ${selected === id ? 'text-blue-900' : 'text-gray-900'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* CONTINUE BUTTON: Disabled until selection made → /onboarding/timeline */}
      <PrimaryButton
        onClick={() => navigate('/onboarding/timeline')}
        disabled={!selected}
      >
        Continue
      </PrimaryButton>
    </div>
  );
}
