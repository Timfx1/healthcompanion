# UI Design Skill — AnklePath

You are helping design and build the frontend for AnklePath, a mobile app focused only on ankle injury recovery.

## Product concept

AnklePath helps users recover from ankle injuries by giving them a clear recovery path, daily guidance, symptom tracking, education, and safety information.

The app focuses on:
- ankle sprains
- Grade 1, Grade 2, and Grade 3 ankle injuries
- chronic ankle instability
- post-surgery ankle recovery
- sports-related ankle pain
- return to walking, running, and sport

The app should feel like a focused recovery companion, not a generic exercise app.

## Design inspiration

Use the screenshots and patterns from successful apps as inspiration, but do not copy them directly.

### Migraine Buddy inspiration

Migraine Buddy uses:
- dark navy background
- friendly illustrations
- simple onboarding
- symptom tracking
- personalized setup
- reports for doctor sharing
- early premium prompt

Useful ideas to adapt:
- friendly medical tone
- condition-specific tracking
- personalized setup questions
- doctor/reporting concept
- simple large buttons
- progress indicators

### Prehab inspiration

Prehab uses:
- bold black background
- red accent color
- strong fitness/rehab identity
- goal-based onboarding
- body scan/program setup
- frequency and workout time questions
- premium trial paywall

Useful ideas to adapt:
- structured program onboarding
- goal-based personalization
- large rounded option cards
- workout frequency/time setup
- premium but simple UI
- confidence-building copy

## Important product decision

Do NOT create a hard paywall after onboarding.

The app is in early traction stage, so users should access the free version immediately.

Use:
- free onboarding
- free recovery plan
- optional premium teaser
- optional “premium coming soon” screen
- “Continue with Free Plan” always visible

Do NOT block:
- onboarding
- home dashboard
- basic recovery plan
- basic exercises
- pain tracking
- swelling tracking
- learn articles
- safety guidance

Premium features can be shown as coming later:
- advanced progress reports
- return-to-sport testing
- adaptive rehab progression
- clinician-ready reports
- larger exercise library
- expert review

## Visual style

Create a clean mobile health-tech UI.

Preferred style:
- dark navy or soft charcoal background
- accent color: purple, blue, or teal
- supportive medical tone
- rounded cards
- large tap targets
- clear typography
- progress bars
- friendly icons
- simple illustrations or placeholders
- trustworthy but not boring

Avoid:
- copying exact layouts from competitor screenshots
- using competitor logos, colors, or text exactly
- overwhelming users with too many options
- making the app feel like a hospital system
- aggressive paywall language

## UX principles

The user should always understand:
1. What stage of recovery they are in
2. What they should do today
3. Whether their symptoms may be serious
4. How their recovery is progressing
5. What free features they can use now

The app should answer:
- What happened to my ankle?
- What should I do today?
- Is this normal?
- When should I see a doctor?
- When can I walk/run/play sport again?

## Core navigation

Use bottom navigation:

1. Home
2. Plan
3. Track
4. Learn
5. Profile

## Core screens

Build these screens first:

### Onboarding

1. Welcome
2. Sign up / Continue as Guest
3. Injury Type
4. Injury Timing
5. Symptoms
6. Pain and Walking Ability
7. Recovery Goal
8. Notification Prompt
9. Plan Loading
10. Free Plan Unlocked
11. Optional Premium Teaser
12. Home Dashboard

### Main app

1. Home Dashboard
2. Daily Plan
3. Exercise Detail
4. Pain Check-in
5. Swelling Tracker
6. Progress Tracking
7. Recovery Timeline
8. Learn Hub
9. Article Detail
10. Red Flags / Safety
11. Profile

## Tone of voice

Use clear, calm, supportive language.

Good examples:
- “Your recovery plan is ready.”
- “Start with today’s small steps.”
- “Track pain and swelling to understand your progress.”
- “Severe pain or inability to bear weight may need medical attention.”

Avoid:
- “We will cure your ankle.”
- “This replaces medical advice.”
- “You must subscribe to continue.”
- “Guaranteed recovery.”

## Medical safety

Always include a disclaimer where appropriate:

“This app provides educational guidance and does not replace professional medical advice.”

Red-flag symptoms should be visible:
- severe pain
- visible deformity
- inability to bear weight
- numbness or tingling
- worsening swelling
- signs of infection after surgery
- calf pain or shortness of breath

## Frontend coding rules

Use:
- React Native
- Expo
- TypeScript
- React Navigation
- reusable components
- centralized theme file
- clean folder structure

Do not add backend until asked.

Do not add Firebase until asked.

Do not add RevenueCat until asked.

Do not add Appfigures inside the app.

Build frontend first with mock data.