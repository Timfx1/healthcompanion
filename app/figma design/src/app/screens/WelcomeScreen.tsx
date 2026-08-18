/**
 * WELCOME SCREEN
 *
 * PURPOSE:
 * - Marketing/onboarding landing page after splash screen
 * - Explains app value proposition with headline + features list
 * - Entry point for new users or returning users
 *
 * COMPONENTS:
 * - App logo (Activity icon)
 * - Headline + subtext describing app purpose
 * - 3 feature bullets with icons
 * - Primary CTA: "Start Recovery Plan" → navigates to /signup
 * - Secondary CTA: "I already have an account" → navigates to /home
 *
 * STATE:
 * - features array: static list of 3 key app features
 *
 * NAVIGATION:
 * - "Start Recovery Plan" button → /signup (begin onboarding flow)
 * - "I already have an account" button → /home (skip to main app)
 *
 * DATA NEEDED:
 * - None (static marketing content)
 */

import { useNavigate } from 'react-router';
import { Activity, CheckCircle, TrendingUp, BookOpen } from 'lucide-react';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  // FEATURES LIST: 3 key value propositions shown as bullets
  const features = [
    { icon: CheckCircle, text: 'Track pain and symptoms' },
    { icon: TrendingUp, text: 'Follow daily rehab exercises' },
    { icon: BookOpen, text: 'Understand your recovery stage' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* APP LOGO */}
        <div className="bg-blue-600 p-6 rounded-3xl mb-8">
          <Activity className="w-12 h-12 text-white" strokeWidth={2} />
        </div>

        {/* MAIN HEADLINE */}
        <h1 className="text-3xl mb-4 text-gray-900 max-w-sm">
          Your guided ankle recovery companion
        </h1>

        {/* VALUE PROPOSITION SUBTEXT */}
        <p className="text-gray-600 mb-12 max-w-md leading-relaxed">
          Recover with clear daily steps, track pain and swelling, and understand what to do at every stage.
        </p>

        {/* FEATURE BULLETS: 3 key benefits with icons */}
        <div className="space-y-3 mb-12 w-full max-w-sm">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-left">
              <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-gray-700">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CALL-TO-ACTION BUTTONS */}
      <div className="space-y-3 max-w-sm mx-auto w-full">
        {/* PRIMARY CTA: Start onboarding flow → /signup */}
        <PrimaryButton onClick={() => navigate('/signup')}>
          Start Recovery Plan
        </PrimaryButton>

        {/* SECONDARY CTA: Skip to main app for returning users → /home */}
        <SecondaryButton onClick={() => navigate('/home')}>
          I already have an account
        </SecondaryButton>
      </div>
    </div>
  );
}
