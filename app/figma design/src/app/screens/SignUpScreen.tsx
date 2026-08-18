/**
 * SIGN UP SCREEN
 *
 * PURPOSE:
 * - Allow users to create an account or continue as guest
 * - Provides multiple authentication options
 * - Gateway to onboarding flow
 *
 * COMPONENTS:
 * - Headline: "Let's get started"
 * - 4 sign-in buttons: Apple, Google, Email, Guest
 * - Trust message: "You can create an account later"
 *
 * STATE:
 * - None (all buttons navigate to same destination)
 *
 * NAVIGATION:
 * - All 4 buttons → /onboarding/injury-type (begin step 1/5)
 * - In production: each button would trigger different auth flow
 *   - Apple: Sign in with Apple
 *   - Google: OAuth Google sign-in
 *   - Email: Email/password form
 *   - Guest: Anonymous session
 *
 * DATA NEEDED:
 * - None (authentication logic not implemented in prototype)
 *
 * NOTES:
 * - Currently all buttons route to same place for prototyping
 * - Production would differentiate auth methods and store user credentials
 */

import { useNavigate } from 'react-router';
import { Apple, Mail } from 'lucide-react';

export default function SignUpScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col justify-center">
        {/* HEADLINE */}
        <h1 className="text-3xl mb-3 text-gray-900 text-center">Let's get started</h1>
        <p className="text-gray-600 text-center mb-12">
          Create an account to save your progress
        </p>

        {/* AUTHENTICATION OPTIONS */}
        <div className="space-y-3 max-w-sm mx-auto w-full">
          {/* APPLE SIGN-IN: Black button with Apple icon → /onboarding/injury-type */}
          <button
            onClick={() => navigate('/onboarding/injury-type')}
            className="w-full bg-black text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-98"
          >
            <Apple className="w-6 h-6" fill="white" />
            Continue with Apple
          </button>

          {/* GOOGLE SIGN-IN: White button with Google logo → /onboarding/injury-type */}
          <button
            onClick={() => navigate('/onboarding/injury-type')}
            className="w-full bg-white border-2 border-gray-300 text-gray-900 py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-98"
          >
            {/* Google logo SVG with brand colors */}
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* EMAIL SIGN-IN: White button with Mail icon → /onboarding/injury-type */}
          <button
            onClick={() => navigate('/onboarding/injury-type')}
            className="w-full bg-white border-2 border-gray-300 text-gray-900 py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-98"
          >
            <Mail className="w-6 h-6" />
            Continue with Email
          </button>

          {/* GUEST MODE: Text link for anonymous access → /onboarding/injury-type */}
          <button
            onClick={() => navigate('/onboarding/injury-type')}
            className="w-full text-gray-600 py-4 rounded-xl transition-all active:scale-98 underline"
          >
            Continue as Guest
          </button>
        </div>

        {/* TRUST MESSAGE: Reassures users they can create account later */}
        <p className="text-sm text-gray-500 text-center mt-8">
          You can create an account later.
        </p>
      </div>
    </div>
  );
}
