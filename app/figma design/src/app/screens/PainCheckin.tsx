/**
 * PAIN CHECK-IN SCREEN
 *
 * PURPOSE:
 * - Log pain levels and symptoms for tracking progress
 * - Capture detailed pain location and characteristics
 * - Build historical data for progress charts and doctor reports
 *
 * COMPONENTS:
 * - Back button → /home
 * - Pain level slider (0-10 scale)
 * - Pain location multi-select (5 ankle regions)
 * - Symptoms multi-select (5 common symptoms)
 * - Notes textarea (optional)
 * - Success insight card (shown after save)
 * - Save button
 *
 * STATE:
 * - painLevel: number (0-10) - Current pain intensity
 * - locations: string[] - Selected pain locations
 * - symptoms: string[] - Selected current symptoms
 * - notes: string - Optional user notes
 * - showInsight: boolean - Show success message after save
 *
 * NAVIGATION:
 * - Back button → /home
 * - Save button → Shows insight for 2s, then navigates to /home
 *
 * DATA NEEDED (in production):
 * - Save check-in data to backend with timestamp
 * - Calculate trend (e.g., "Pain decreased 2 points this week")
 * - Add to user's progress history
 *
 * PAIN LOCATIONS (anatomical):
 * - Outside ankle (lateral malleolus)
 * - Inside ankle (medial malleolus)
 * - Front ankle (anterior)
 * - Achilles (posterior tendon)
 * - Heel (calcaneus)
 *
 * INTERACTIONS:
 * - Slider: Drag to set pain level 0-10
 * - Location buttons: Toggle selection (multi-select)
 * - Symptom buttons: Toggle selection (multi-select)
 * - Notes field: Free text input
 * - Save: Submit data, show insight, return to home
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, TrendingDown } from 'lucide-react';
import PrimaryButton from '../components/PrimaryButton';

export default function PainCheckin() {
  const navigate = useNavigate();

  // FORM STATE: Pain check-in data
  const [painLevel, setPainLevel] = useState(3); // 0-10 scale
  const [locations, setLocations] = useState<string[]>([]); // Multi-select pain locations
  const [symptoms, setSymptoms] = useState<string[]>([]); // Multi-select symptoms
  const [notes, setNotes] = useState(''); // Optional notes
  const [showInsight, setShowInsight] = useState(false); // Success message

  // PAIN LOCATIONS: 5 anatomical regions
  const painLocations = [
    'Outside ankle',
    'Inside ankle',
    'Front ankle',
    'Achilles',
    'Heel',
  ];

  // SYMPTOM OPTIONS: 5 common symptoms
  const symptomOptions = [
    'Swelling',
    'Stiffness',
    'Weakness',
    'Clicking',
    'Numbness',
  ];

  // TOGGLE LOCATION: Add/remove from selections
  const toggleLocation = (location: string) => {
    setLocations(prev =>
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    );
  };

  // TOGGLE SYMPTOM: Add/remove from selections
  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  // SAVE CHECK-IN: Show insight, then navigate to home
  const handleSave = () => {
    // In production: POST data to API with timestamp
    setShowInsight(true);
    setTimeout(() => {
      navigate('/home');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER: Back button + Title */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        {/* BACK BUTTON → /home */}
        <button onClick={() => navigate('/home')}>
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl text-gray-900">Pain Check-in</h1>
      </div>

      {/* FORM SECTIONS */}
      <div className="px-6 py-6 space-y-8 pb-24">
        {/* PAIN LEVEL SLIDER: 0-10 scale with visual feedback */}
        <div>
          <label className="block text-gray-900 mb-3">Pain level right now</label>
          {/* Current value displayed prominently in center */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">No pain</span>
            <span className="text-3xl text-blue-600">{painLevel}</span>
            <span className="text-sm text-gray-500">Worst pain</span>
          </div>
          {/* Range slider: 0-10, updates painLevel state on change */}
          <input
            type="range"
            min="0"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          {/* Number labels 0-10 below slider */}
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <span key={num}>{num}</span>
            ))}
          </div>
        </div>

        {/* PAIN LOCATION: Multi-select grid of 5 anatomical regions */}
        <div>
          <label className="block text-gray-900 mb-3">Pain location</label>
          <div className="grid grid-cols-2 gap-2">
            {painLocations.map((location) => (
              // LOCATION BUTTON: Toggle selection on click
              // Selected: blue border/background
              <button
                key={location}
                onClick={() => toggleLocation(location)}
                className={`p-3 rounded-xl border-2 transition-all text-sm ${
                  locations.includes(location)
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        {/* SYMPTOMS: Multi-select grid of 5 common symptoms */}
        <div>
          <label className="block text-gray-900 mb-3">Symptoms today</label>
          <div className="grid grid-cols-2 gap-2">
            {symptomOptions.map((symptom) => (
              // SYMPTOM BUTTON: Toggle selection on click
              // Selected: blue border/background
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`p-3 rounded-xl border-2 transition-all text-sm ${
                  symptoms.includes(symptom)
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* NOTES FIELD: Optional free-text notes */}
        <div>
          <label className="block text-gray-900 mb-3">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What changed today?"
            className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none h-24 focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* SUCCESS INSIGHT: Shows after save, displays trend analysis */}
        {showInsight && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 animate-fade-in">
            <TrendingDown className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-green-900 mb-1">Great progress!</h3>
              <p className="text-sm text-green-800">Pain has decreased 2 points this week.</p>
            </div>
          </div>
        )}

        {/* SAVE BUTTON: Submit check-in data */}
        <PrimaryButton onClick={handleSave}>
          Save Check-in
        </PrimaryButton>
      </div>
    </div>
  );
}
