/**
 * APP.TSX - Root Application Component
 *
 * ANKLEPATH MOBILE APP STRUCTURE
 *
 * This is the root component for the AnklePath ankle injury recovery app.
 * The app uses React Router for navigation between screens.
 *
 * APP ARCHITECTURE:
 * ├── Pre-Auth Flow (/, /welcome, /signup)
 * ├── Onboarding Flow (5 steps: injury-type → timeline → symptoms → pain-walking → goal)
 * ├── Post-Onboarding (/notifications, /plan-loading, /free-plan-unlocked)
 * ├── Main App
 * │   ├── Home Dashboard (/home) - Recovery status, daily action cards
 * │   ├── Exercise Plan (/exercises) - Daily workout list
 * │   ├── Exercise Detail (/exercise/:id) - Individual exercise instructions
 * │   ├── Pain Check-in (/pain-checkin) - Log pain/symptoms
 * │   ├── Progress Tracking (/progress) - Charts and metrics
 * │   ├── Recovery Timeline (/timeline) - 6-phase roadmap
 * │   ├── Learn Hub (/learn) - Educational articles
 * │   ├── Article Detail (/article/:id) - Full article content
 * │   ├── Red Flags (/red-flags) - Safety warnings
 * │   ├── Doctor Report (/doctor-report) - Exportable summary
 * │   ├── Local Help (/local-help) - Find providers
 * │   └── Profile (/profile) - User settings
 * └── Premium Preview (/premium-preview) - Soft paywall (coming soon)
 *
 * NAVIGATION STRUCTURE:
 * - Bottom Nav (Home, Plan, Track, Learn, Profile) on main screens
 * - Back buttons on detail screens
 * - Direct navigation via buttons/cards
 *
 * STATE MANAGEMENT:
 * - Component-level useState for UI state
 * - useNavigate for routing
 * - useLocation for active tab detection
 * - No global state management (would add Redux/Context for production)
 *
 * DATA FLOW:
 * - Currently uses hardcoded data for prototyping
 * - Production would use:
 *   - REST API or GraphQL for backend communication
 *   - User authentication (JWT tokens)
 *   - Persistent storage (localStorage + backend sync)
 *   - Real-time updates for check-ins and progress
 *
 * KEY FEATURES:
 * 1. Personalized onboarding based on injury type/severity
 * 2. Phase-based recovery program (6 phases)
 * 3. Daily exercise plans with video instructions
 * 4. Pain and symptom tracking with trend analysis
 * 5. Educational content library
 * 6. Safety guidance and red flags
 * 7. Doctor reports and local provider search
 * 8. Free-first monetization (premium coming soon)
 *
 * ROUTING:
 * All routes defined in ./routes.tsx
 * RouterProvider handles navigation and URL management
 */

import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return <RouterProvider router={router} />;
}