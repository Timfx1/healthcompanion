/**
 * BOTTOM NAVIGATION COMPONENT
 *
 * PURPOSE:
 * - Persistent navigation bar fixed to bottom of screen
 * - Primary navigation for main app sections
 * - Shows active state based on current route
 *
 * COMPONENTS:
 * - 5 navigation tabs with icons + labels
 * - Active state styling (blue color, bold icon)
 *
 * STATE:
 * - location.pathname from useLocation() - determines active tab
 *
 * NAVIGATION TABS:
 * 1. Home → /home - Dashboard with recovery overview
 * 2. Plan → /exercises - Daily exercise list
 * 3. Track → /progress - Progress charts and metrics
 * 4. Learn → /learn - Educational articles
 * 5. Profile → /profile - User settings and info
 *
 * ACTIVE STATE LOGIC:
 * - Tab is active if location.pathname matches tab.path
 * - Special case: /exercises is active for both /exercises and /exercise/:id
 * - Active tabs: blue icon/text (#2563eb), strokeWidth 2.5
 * - Inactive tabs: gray icon/text (#9ca3af), strokeWidth 2
 *
 * USAGE:
 * - Imported and rendered on main app screens (Home, Exercises, Progress, Learn, Profile)
 * - Not shown on onboarding, auth, or detail screens
 */

import { Home, Calendar, LineChart, BookOpen, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation(); // Get current route path

  // NAVIGATION TABS: 5 main app sections
  const tabs = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Calendar, label: 'Plan', path: '/exercises' },
    { icon: LineChart, label: 'Track', path: '/progress' },
    { icon: BookOpen, label: 'Learn', path: '/learn' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {tabs.map(({ icon: Icon, label, path }) => {
          // ACTIVE STATE: Check if current path matches this tab
          // Special case: /exercises active for both /exercises and /exercise/:id routes
          const isActive = location.pathname === path ||
            (path === '/exercises' && location.pathname.startsWith('/exercise'));

          return (
            // TAB BUTTON: Navigates to respective section
            // - Active: blue icon/text
            // - Inactive: gray icon/text
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1"
            >
              {/* TAB ICON: Lucide icon with dynamic color/weight */}
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {/* TAB LABEL: Text label below icon */}
              <span className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
