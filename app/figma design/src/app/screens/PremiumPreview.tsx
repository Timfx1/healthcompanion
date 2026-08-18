/**
 * PREMIUM PREVIEW SCREEN (Soft Paywall)
 *
 * PURPOSE:
 * - Show premium features without blocking free users
 * - Collect waitlist sign-ups for future launch
 * - Early traction stage monetization (not live yet)
 *
 * COMPONENTS:
 * - Back button
 * - Sparkles icon (premium indicator)
 * - Headline: "Unlock more recovery tools"
 * - 5 premium feature cards with icons + descriptions
 * - "Coming soon" pricing card
 * - Primary CTA: "Join Premium Waitlist" → /home
 * - Secondary CTA: "Continue with Free Plan" → /home
 *
 * STATE:
 * - premiumFeatures: array - 5 premium features (not yet available)
 *
 * NAVIGATION:
 * - Back button → previous screen
 * - "Join Premium Waitlist" → /home (would collect email in production)
 * - "Continue with Free Plan" → /home
 *
 * DATA NEEDED (in production):
 * - Waitlist email collection
 * - Track interest in premium features
 * - A/B test pricing points
 *
 * PREMIUM FEATURES (Coming Soon):
 * 1. Advanced progress reports - More detailed analytics
 * 2. Smarter program adjustments - AI-powered personalization
 * 3. Return-to-sport testing - Functional movement assessments
 * 4. More exercise programs - Sport-specific plans
 * 5. Clinician-ready summaries - Professional reports
 *
 * MONETIZATION STRATEGY:
 * - "Coming soon" messaging (early stage, building user base first)
 * - Soft sell: Optional, non-blocking
 * - Waitlist approach builds anticipation and validates demand
 * - No pricing shown yet (testing feature interest first)
 *
 * DESIGN NOTES:
 * - Purple color scheme = premium tier
 * - Sparkles icon = premium indicator
 * - Non-pushy copy, emphasizes "optional"
 */

import { useNavigate } from 'react-router';
import { Sparkles, BarChart3, Zap, Trophy, FileText, Target } from 'lucide-react';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

export default function PremiumPreview() {
  const navigate = useNavigate();

  // PREMIUM FEATURES: 5 planned features (not yet available)
  const premiumFeatures = [
    { icon: BarChart3, label: 'Advanced progress reports', desc: 'Detailed analytics and insights' },
    { icon: Zap, label: 'Smarter program adjustments', desc: 'AI-powered plan optimization' },
    { icon: Trophy, label: 'Return-to-sport testing', desc: 'Know when you\'re ready' },
    { icon: Target, label: 'More exercise programs', desc: 'Sport-specific rehab plans' },
    { icon: FileText, label: 'Clinician-ready summaries', desc: 'Share with your PT or doctor' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex flex-col px-6 py-12">
      {/* BACK BUTTON: Navigate to previous screen */}
      <button
        onClick={() => navigate(-1)}
        className="self-start text-gray-600 mb-6"
      >
        ← Back
      </button>

      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <div className="text-center mb-8">
          {/* PREMIUM ICON: Sparkles = premium indicator */}
          <div className="inline-flex bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-3xl mb-4">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl mb-3 text-gray-900">
            Unlock more recovery tools
          </h1>
          <p className="text-gray-600 max-w-sm mx-auto">
            Premium features designed to accelerate your recovery
          </p>
        </div>

        {/* PREMIUM FEATURES LIST: 5 planned features */}
        <div className="space-y-4 mb-8">
          {premiumFeatures.map(({ icon: Icon, label, desc }) => (
            // FEATURE CARD: Icon + label + description
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex gap-4">
                {/* Purple icon container = premium branding */}
                <div className="bg-purple-100 rounded-xl p-3 flex-shrink-0">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-gray-900 mb-1">{label}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COMING SOON CARD: Premium not yet available */}
        <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-6 border border-purple-200 text-center mb-8">
          <p className="text-lg text-purple-900 mb-2">Premium access</p>
          <p className="text-3xl text-purple-600 mb-2">Coming soon</p>
          <p className="text-sm text-purple-700">
            Be the first to get early access when we launch
          </p>
        </div>
      </div>

      {/* CALL-TO-ACTION BUTTONS */}
      <div className="space-y-3 max-w-sm mx-auto w-full">
        {/* PRIMARY CTA: Join waitlist (collects interest) → /home */}
        <PrimaryButton onClick={() => navigate('/home')}>
          Join Premium Waitlist
        </PrimaryButton>

        {/* SECONDARY CTA: Continue with free (no pressure) → /home */}
        <SecondaryButton onClick={() => navigate('/home')}>
          Continue with Free Plan
        </SecondaryButton>
      </div>
    </div>
  );
}
