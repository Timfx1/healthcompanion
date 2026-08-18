/**
 * SPLASH SCREEN
 *
 * PURPOSE:
 * - Initial app loading screen shown when user opens the app
 * - Displays app branding (logo + tagline)
 * - Auto-redirects to /welcome after 2 seconds
 *
 * COMPONENTS:
 * - Activity icon (Lucide React) as app logo
 * - App name: "AnklePath"
 * - Tagline: "Your guided ankle recovery companion"
 *
 * STATE:
 * - None (uses useEffect timer for auto-navigation)
 *
 * NAVIGATION:
 * - Automatically navigates to /welcome after 2000ms
 * - No user interaction required
 *
 * DATA NEEDED:
 * - None (static branding screen)
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Activity } from 'lucide-react';

export default function SplashScreen() {
  const navigate = useNavigate();

  // AUTO-REDIRECT: Navigate to welcome screen after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center text-white px-6">
      {/* APP LOGO: Activity icon in frosted glass container */}
      <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl mb-6">
        <Activity className="w-16 h-16" strokeWidth={2} />
      </div>

      {/* APP NAME */}
      <h1 className="text-4xl mb-3">AnklePath</h1>

      {/* APP TAGLINE */}
      <p className="text-blue-100 text-center">Your guided ankle recovery companion</p>
    </div>
  );
}
