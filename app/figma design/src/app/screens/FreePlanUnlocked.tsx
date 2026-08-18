/**
 * FREE PLAN UNLOCKED SCREEN
 *
 * PURPOSE:
 * - Celebrate completion of onboarding
 * - Show value of free plan to user
 * - Soft introduction to premium features (optional upgrade)
 * - Gateway to main app experience
 *
 * COMPONENTS:
 * - Success icon (green checkmark)
 * - Headline: "Your free recovery plan is ready"
 * - Benefits card: List of 5 included free features
 * - Primary CTA: "Start My Plan" → /home
 * - Secondary CTA: "See Premium Features" → /premium-preview
 * - Trust message: "Premium is optional. You can start free."
 *
 * STATE:
 * - freeBenefits: array - 5 features included in free plan
 *
 * NAVIGATION:
 * - "Start My Plan" button → /home (begin using app)
 * - "See Premium Features" button → /premium-preview (optional upgrade)
 *
 * DATA NEEDED:
 * - None (static content)
 *
 * FREE PLAN FEATURES:
 * 1. Daily guided exercises - Phase-appropriate workout plans
 * 2. Pain and swelling tracking - Log symptoms and progress
 * 3. Recovery timeline - 6-phase roadmap
 * 4. Safety guidance - Red flags and when to seek help
 * 5. Education articles - Learn about ankle recovery
 *
 * MONETIZATION STRATEGY:
 * - Early traction stage: Free-first approach
 * - Premium is "coming soon" with waitlist
 * - No hard paywall blocking core functionality
 * - Focus on user acquisition over immediate revenue
 *
 * DESIGN NOTES:
 * - Green color scheme = success/achievement
 * - Animated scale-in on success icon
 * - Trust-building copy emphasizing free access
 */

import { useNavigate } from 'react-router';
import { CheckCircle, Activity, TrendingUp, Calendar, Shield, BookOpen } from 'lucide-react';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

export default function FreePlanUnlocked() {
  const navigate = useNavigate();

  // FREE BENEFITS: 5 features included in free plan
  const freeBenefits = [
    { icon: Activity, label: 'Daily guided exercises' },
    { icon: TrendingUp, label: 'Pain and swelling tracking' },
    { icon: Calendar, label: 'Recovery timeline' },
    { icon: Shield, label: 'Safety guidance' },
    { icon: BookOpen, label: 'Education articles' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* SUCCESS ICON: Animated checkmark celebrating completion */}
        <div className="bg-green-500 p-6 rounded-full mb-6 animate-scale-in">
          <CheckCircle className="w-16 h-16 text-white" />
        </div>

        {/* SUCCESS HEADLINE */}
        <h1 className="text-3xl mb-3 text-gray-900">
          Your free recovery plan is ready
        </h1>

        {/* VALUE PROPOSITION */}
        <p className="text-gray-600 mb-10 max-w-sm">
          Everything you need to start your ankle recovery journey
        </p>

        {/* FREE BENEFITS CARD: Lists 5 included features */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 w-full max-w-sm mb-8">
          <h2 className="text-lg mb-4 text-gray-900 text-left">Included in your free plan</h2>
          <div className="space-y-4">
            {freeBenefits.map(({ icon: Icon, label }) => (
              // BENEFIT ITEM: Icon + label for each free feature
              <div key={label} className="flex items-center gap-3 text-left">
                <div className="bg-green-100 rounded-lg p-2">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TRUST MESSAGE: Reassure users free plan is sufficient */}
        <p className="text-sm text-gray-500 mb-2">
          Premium is optional. You can start free.
        </p>
      </div>

      {/* CALL-TO-ACTION BUTTONS */}
      <div className="space-y-3 max-w-sm mx-auto w-full">
        {/* PRIMARY CTA: Enter main app → /home */}
        <PrimaryButton onClick={() => navigate('/home')}>
          Start My Plan
        </PrimaryButton>

        {/* SECONDARY CTA: Optional premium preview → /premium-preview */}
        <SecondaryButton onClick={() => navigate('/premium-preview')}>
          See Premium Features
        </SecondaryButton>
      </div>
    </div>
  );
}
