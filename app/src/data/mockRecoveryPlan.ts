export const recoveryPhase = {
  label: "Phase 1: Protect & Reduce Swelling",
  day: "Day 5 since injury",
  progress: 0.34,
  message: "Start with today's small steps."
};

// The four recovery stages, in order. These mirror the staging described in the
// "How long does ankle recovery take?" article below, so the plan and the Learn
// content never tell the user two different stories.
//
// Which phase a user is actually in is derived from their own check-ins by
// `buildProgression` in `src/utils/recoveryInsights.ts` — the entry criteria for
// each phase live there, next to the rest of the maths. This array is only the
// labels and ordering.
export const PHASES = [
  {
    id: "protect",
    label: "Phase 1: Protect & Reduce Swelling",
    focus: "Settle pain and swelling, and protect the joint while it calms down."
  },
  {
    id: "motion",
    label: "Phase 2: Restore Motion",
    focus: "Bring back gentle, pain-free movement before adding load."
  },
  {
    id: "strength",
    label: "Phase 3: Strength & Balance",
    focus: "Rebuild strength and single-leg control around the ankle."
  },
  {
    id: "return",
    label: "Phase 4: Return to Activity",
    focus: "Add speed, direction changes and confidence before returning to sport."
  }
] as const;

// Maps an onboarding "when did the injury happen?" option to a representative
// number of days since the injury (midpoint of the range).
const INJURY_TIMING_DAYS: Record<string, number> = {
  "Today / last 48 hours": 1,
  "3-7 days ago": 5,
  "1-3 weeks ago": 14,
  "1-3 months ago": 45,
  "More than 3 months ago": 100
};

export function estimateInjuryDaysAgo(timing?: string): number | null {
  if (!timing) return null;
  return INJURY_TIMING_DAYS[timing] ?? null;
}

// Builds the "Day N since injury" label from what the user selected during
// onboarding. If an injury date was stored, the count grows over time.
export function injuryDayLabel(timing?: string, injuryDate?: string): string {
  if (timing === "Recovering after surgery") return "Recovering after surgery";

  let days: number | null = null;
  if (injuryDate) {
    const parsed = new Date(injuryDate).getTime();
    if (!Number.isNaN(parsed)) {
      days = Math.max(1, Math.floor((Date.now() - parsed) / 86_400_000) + 1);
    }
  }
  if (days == null) days = estimateInjuryDaysAgo(timing);
  if (days == null) return "Getting started";

  if (days < 21) return `Day ${days} since injury`;
  if (days < 60) return `Week ${Math.round(days / 7)} since injury`;
  return `Month ${Math.round(days / 30)} since injury`;
}

export const todaysCards = [
  {
    title: "Today's exercises",
    subtitle: "3 exercises · 12 min",
    icon: "fitness"
  },
  {
    title: "Pain check-in",
    subtitle: "Log how your ankle feels today",
    icon: "pulse"
  },
  {
    title: "Swelling tracker",
    subtitle: "Track changes over time",
    icon: "analytics"
  },
  {
    title: "Learn",
    subtitle: "When should swelling improve?",
    icon: "book"
  },
  {
    title: "Safety",
    subtitle: "When to see a doctor",
    icon: "medkit"
  }
] as const;

export type ExerciseTier = "free" | "premium";

export const exercises = [
  {
    id: "ankle-circles",
    name: "Ankle circles",
    tier: "free" as ExerciseTier,
    purpose: "Restore gentle range of motion without loading the joint.",
    prescription: "2 sets · 10 circles each direction",
    difficulty: "Easy",
    durationSeconds: 240,
    video: {
      url: "https://us.physitrack.com/home-exercise-video/ankle-circles-seated",
      sourceName: "Physitrack",
      thumbnailDescription:
        "Person seated on chair, one leg extended, tracing a slow circle with the foot.",
      safetyCaveat:
        "Perform only pain-free range of motion. Stop if you feel sharp pain."
    },
    steps: [
      "Sit with your injured ankle supported.",
      "Move slowly in a comfortable circle.",
      "Reverse direction after each set.",
      "Keep the movement smooth and pain-light."
    ]
  },
  {
    id: "towel-stretch",
    name: "Towel stretch",
    tier: "free" as ExerciseTier,
    purpose: "Improve calf and ankle mobility while seated.",
    prescription: "3 rounds · 20 seconds",
    difficulty: "Easy",
    durationSeconds: 300,
    video: {
      url: "https://www.doctorodonovan.com/videos/sprained-ankle-rehab-program-exercises-doctor-and-physiotherapist-led",
      sourceName: "Dr. James O'Donovan + Physiotherapist Ella Boy",
      thumbnailDescription:
        "Person seated on floor with a towel around the ball of the foot, gently pulling toes toward the body.",
      safetyCaveat:
        "Pull gently until a mild stretch is felt. Stop with sharp pain, cramping, or numbness."
    },
    steps: [
      "Loop a towel around the ball of your foot.",
      "Keep your knee mostly straight.",
      "Pull gently until you feel a light stretch.",
      "Breathe and release slowly."
    ]
  },
  {
    id: "band-eversion",
    name: "Band eversion",
    tier: "free" as ExerciseTier,
    purpose: "Build outside ankle strength for stability.",
    prescription: "2 sets · 12 reps",
    difficulty: "Moderate",
    durationSeconds: 300,
    video: {
      url: "https://us.physitrack.com/home-exercise-video/resisted-ankle-eversion-in-sitting",
      sourceName: "Physitrack",
      thumbnailDescription:
        "Person seated with a resistance band around the forefoot, turning the foot outward against the band.",
      safetyCaveat:
        "Start with the lightest band. Stop if pain increases. Avoid after surgery without clearance."
    },
    steps: [
      "Anchor a light band beside your foot.",
      "Move your foot outward against the band.",
      "Return with control.",
      "Keep the knee still."
    ]
  },
  {
    id: "single-leg-balance",
    name: "Single-leg balance",
    tier: "free" as ExerciseTier,
    purpose: "Rebuild control before higher impact activity.",
    prescription: "3 rounds · 20 seconds",
    difficulty: "Moderate",
    durationSeconds: 240,
    video: {
      url: "https://purephysiotherapy.co.uk/exercise-plans/early-lateral-ankle-sprain-exercise-programme/#Single_leg_balance_-_knee_straight",
      sourceName: "Pure Physiotherapy",
      thumbnailDescription:
        "Person standing on one leg near a wall, using nearby support for safety.",
      safetyCaveat:
        "Perform near a wall or stable object. Stop if the ankle gives way or sharp pain occurs."
    },
    steps: [
      "Stand near a wall or counter.",
      "Shift weight onto the recovering side.",
      "Keep hips level and posture tall.",
      "Tap the wall for support when needed."
    ]
  }
];

// Extended library — later-stage strength, control, and return-to-activity
// progressions unlocked with Premium. Kept separate from the free `exercises`
// daily set so free-plan adherence and today's plan are never diluted by locked
// content. Sources reuse the same vetted physio programmes as the free set.
export const premiumExercises = [
  {
    id: "heel-raises",
    name: "Heel raises",
    tier: "premium" as ExerciseTier,
    purpose: "Rebuild calf and ankle push-off strength for walking and stairs.",
    prescription: "3 sets · 12 reps",
    difficulty: "Moderate",
    durationSeconds: 300,
    video: {
      url: "https://purephysiotherapy.co.uk/exercise-plans/early-lateral-ankle-sprain-exercise-programme/",
      sourceName: "Pure Physiotherapy",
      thumbnailDescription:
        "Person standing tall near a counter, rising onto the balls of both feet and lowering slowly.",
      safetyCaveat:
        "Use a counter for balance. Progress to single-leg only when pain-free. Avoid after surgery without clearance."
    },
    steps: [
      "Stand tall with light support from a counter.",
      "Rise slowly onto the balls of both feet.",
      "Pause briefly at the top.",
      "Lower under control and repeat."
    ]
  },
  {
    id: "resisted-inversion",
    name: "Resisted inversion",
    tier: "premium" as ExerciseTier,
    purpose: "Strengthen the inside of the ankle to balance outside stability work.",
    prescription: "2 sets · 12 reps",
    difficulty: "Moderate",
    durationSeconds: 240,
    video: {
      url: "https://www.doctorodonovan.com/videos/sprained-ankle-rehab-program-exercises-doctor-and-physiotherapist-led",
      sourceName: "Dr. James O'Donovan + Physiotherapist Ella Boy",
      thumbnailDescription:
        "Person seated with a resistance band around the forefoot, turning the foot inward against the band.",
      safetyCaveat:
        "Start with the lightest band. Keep the knee still. Stop if pain increases."
    },
    steps: [
      "Anchor a light band on the inside of your foot.",
      "Turn your foot inward against the band.",
      "Return slowly with control.",
      "Keep the movement at the ankle, not the hip."
    ]
  },
  {
    id: "lateral-hops",
    name: "Controlled lateral hops",
    tier: "premium" as ExerciseTier,
    purpose: "Restore side-to-side control and confidence before return to sport.",
    prescription: "3 rounds · 8 hops each side",
    difficulty: "Advanced",
    durationSeconds: 240,
    video: {
      url: "https://purephysiotherapy.co.uk/exercise-plans/early-lateral-ankle-sprain-exercise-programme/",
      sourceName: "Pure Physiotherapy",
      thumbnailDescription:
        "Person hopping gently side to side over a line, landing softly on one leg with control.",
      safetyCaveat:
        "Only progress to hopping when single-leg balance is confident and pain-free. Land softly and stop if the ankle gives way."
    },
    steps: [
      "Mark a line on the floor.",
      "Hop gently sideways over the line.",
      "Land softly and stick the landing for a moment.",
      "Keep hops small and controlled before adding height."
    ]
  }
];

// All exercises regardless of tier — used for detail lookups by id.
export const allExercises = [...exercises, ...premiumExercises];

export const learnCategories = [
  "First 48 hours",
  "Grade 1, 2, and 3 sprains",
  "Swelling and bruising",
  "Braces and supports",
  "Walking and crutches",
  "Exercises",
  "Return to sport",
  "When to see a doctor"
];

export type Article = {
  id: string;
  title: string;
  category: string;
  readingTime: string;
  summary: string;
  body: string[];
  source: string;
  url: string;
};

export const articles: Article[] = [
  {
    id: "grade-3-sprain",
    title: "What does a Grade 3 ankle sprain mean?",
    category: "Grade 1, 2, and 3 sprains",
    readingTime: "3 min read",
    summary: "How ankle sprains are graded and what a Grade 3 means for your recovery.",
    body: [
      "Ankle sprains are graded by how much the ligament is damaged. Grade 1 is a mild overstretch with tiny tears, Grade 2 is a partial tear with more swelling and looseness, and Grade 3 is a complete tear of the ligament.",
      "A Grade 3 sprain usually causes significant swelling, bruising, and difficulty putting weight on the foot. The joint can feel unstable because the ligament is no longer holding it firmly.",
      "Recovery from a Grade 3 sprain takes longer and starts by protecting the joint and reducing swelling, then gradually rebuilding range of motion, strength, and balance. If your ankle feels very unstable or you cannot bear weight at all, have it assessed by a clinician."
    ],
    source: "OrthoInfo (AAOS)",
    url: "https://orthoinfo.aaos.org/en/diseases--conditions/sprained-ankle/"
  },
  {
    id: "first-48-hours",
    title: "The first 48 hours: protect, rest, ice, compress, elevate",
    category: "First 48 hours",
    readingTime: "3 min read",
    summary: "What to do (and avoid) in the first two days after an ankle injury.",
    body: [
      "In the first 48 hours the goal is to limit swelling and protect the joint. The simple framework is R.I.C.E. — Rest, Ice, Compression, Elevation.",
      "Rest from painful activity, apply ice wrapped in a cloth for about 15-20 minutes a few times a day, use a light compression wrap, and keep the ankle raised above heart level when you can.",
      "Try to avoid heat, alcohol, and vigorous massage in the first couple of days, as these can increase swelling. Gentle, pain-free movement is usually encouraged early rather than complete immobilization."
    ],
    source: "NHS",
    url: "https://www.nhs.uk/conditions/sprains-and-strains/"
  },
  {
    id: "ice-or-heat",
    title: "Should I use ice or heat?",
    category: "Swelling and bruising",
    readingTime: "2 min read",
    summary: "When ice helps and when heat is more useful during recovery.",
    body: [
      "Ice is most helpful in the early, swollen stage of an injury. It can calm pain and limit swelling. Use it wrapped in a cloth for 15-20 minutes at a time, never directly on skin.",
      "Heat is generally more useful later, once swelling has settled, to relax stiff muscles and improve comfort before gentle movement.",
      "A good rule of thumb: ice for a fresh, swollen, painful ankle; heat for later stiffness. If you are unsure or have circulation or sensation problems, check with a clinician first."
    ],
    source: "NHS",
    url: "https://www.nhs.uk/conditions/sprains-and-strains/"
  },
  {
    id: "how-long-swelling",
    title: "How long does swelling last?",
    category: "Swelling and bruising",
    readingTime: "2 min read",
    summary: "A realistic timeline for swelling and bruising after a sprain.",
    body: [
      "Most of the sharp swelling settles over the first one to two weeks, but mild puffiness — especially by the end of the day or after activity — can linger for several weeks, and longer after a more severe sprain.",
      "Bruising often appears a day or two after the injury and may track down toward the toes as it fades. This is normal as the body clears it.",
      "Swelling that suddenly worsens, spreads, or comes with increasing pain, redness, or warmth should be checked, as it can signal something beyond a simple sprain."
    ],
    source: "Cleveland Clinic",
    url: "https://my.clevelandclinic.org/health/diseases/22048-sprained-ankle"
  },
  {
    id: "when-can-i-walk",
    title: "When can I walk again?",
    category: "Walking and crutches",
    readingTime: "3 min read",
    summary: "How to judge when it's safe to start weight-bearing and walking.",
    body: [
      "Many people can start putting gentle weight through the ankle within a few days, as long as it stays within a tolerable level of pain. Early, protected movement often helps recovery more than long periods of rest.",
      "Start with short distances on flat ground, and use crutches or a support if walking is very painful or the ankle feels like it might give way. Aim to reduce your reliance on support as comfort improves.",
      "If you cannot take more than a few steps, or the ankle buckles under you, hold off on walking unaided and get it assessed."
    ],
    source: "Cleveland Clinic",
    url: "https://my.clevelandclinic.org/health/treatments/15543-how-to-use-crutches"
  },
  {
    id: "brace-or-support",
    title: "Do I need a brace or support?",
    category: "Braces and supports",
    readingTime: "2 min read",
    summary: "What braces and supports do and when they help.",
    body: [
      "A brace or support can add stability and confidence in the early and middle stages of recovery, especially for moderate to severe sprains. It helps protect the healing ligament while you rebuild strength.",
      "Supports are usually a temporary aid, not a permanent fix. As your strength and balance improve, you generally rely on them less.",
      "The right type depends on your injury and activity. If you are unsure, a pharmacist or clinician can point you to a suitable option."
    ],
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/diseases-conditions/sprained-ankle/diagnosis-treatment/drc-20353231"
  },
  {
    id: "progress-exercises",
    title: "How to progress your ankle exercises safely",
    category: "Exercises",
    readingTime: "3 min read",
    summary: "Simple rules for moving from gentle movement to strength and balance work.",
    body: [
      "Recovery usually moves through stages: first gentle pain-free range of motion, then strengthening, then balance and control, and finally return to sport-specific movement.",
      "Progress when the current level feels comfortable and does not flare your symptoms the next day. A useful guide is to keep pain at or below about 5 out of 10 during exercise, and settling quickly afterward.",
      "Consistency matters more than intensity. Small, regular sessions beat occasional hard ones. If an exercise causes sharp pain, swelling, or instability, ease back a stage."
    ],
    source: "ChoosePT (APTA)",
    url: "https://www.choosept.com/guide/physical-therapy-guide-ankle-sprain"
  },
  {
    id: "return-to-sport",
    title: "When can I return to sport?",
    category: "Return to sport",
    readingTime: "3 min read",
    summary: "Signs you're ready to return, and how to reduce re-injury risk.",
    body: [
      "Returning to sport is about capability, not just time. Good signs of readiness include full, pain-free movement, strength close to your other side, confident single-leg balance, and being able to hop, cut, and change direction without pain or hesitation.",
      "Rushing back is the most common cause of re-spraining. Build up gradually through running, then agility, then full training before competition.",
      "Many people use a brace or tape for the first stretch of their return as added protection. If your ankle still feels unstable during sport-like movement, it usually needs more strength and balance work first."
    ],
    source: "OrthoInfo (AAOS)",
    url: "https://orthoinfo.aaos.org/en/diseases--conditions/sprained-ankle/"
  },
  {
    id: "when-to-see-doctor",
    title: "Warning signs: when to see a doctor",
    category: "When to see a doctor",
    readingTime: "2 min read",
    summary: "Symptoms that mean your ankle should be checked by a clinician.",
    body: [
      "Most ankle sprains recover well at home, but some signs warrant a professional check. See a clinician if you cannot put any weight on the foot or take a few steps, or if there is bony tenderness directly over the ankle bones.",
      "Also seek care for severe or rapidly worsening swelling, numbness, the foot looking misshapen, or an ankle that repeatedly gives way.",
      "Seek urgent help if you have signs of poor circulation (a cold, pale, or blue foot) or symptoms that concern you. When in doubt, it is always reasonable to get it looked at."
    ],
    source: "Mayo Clinic",
    url: "https://www.mayoclinic.org/diseases-conditions/sprained-ankle/symptoms-causes/syc-20353225"
  },
  {
    id: "high-ankle-sprain",
    title: "Are high ankle sprains different?",
    category: "Grade 1, 2, and 3 sprains",
    readingTime: "3 min read",
    summary: "How a high ankle sprain differs from a normal one, and why it can take longer.",
    body: [
      "A 'high' ankle sprain injures the ligaments that join the two lower leg bones (the syndesmosis) just above the ankle, rather than the ligaments on the outside of the ankle. It often happens with a twisting or outward-rotating force.",
      "The pain is usually felt higher up, above the ankle, and can be worse when you push off, climb stairs, or rotate the foot. Swelling may be less obvious than with a normal sprain even though the injury is significant.",
      "High ankle sprains tend to take longer to recover — often six to eight weeks or more — and sometimes need a boot or a period of reduced weight-bearing. If pain sits above the ankle and is slow to settle, it is worth getting assessed."
    ],
    source: "Cleveland Clinic",
    url: "https://my.clevelandclinic.org/health/diseases/22249-high-ankle-sprains"
  }
];
