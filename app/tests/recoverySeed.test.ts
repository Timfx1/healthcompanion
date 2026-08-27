import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { DEMO_RECOVERY_SEED, recoverySeedFromOnboarding } from "../src/data/recoverySeed.ts";

describe("first recovery state comes from onboarding", () => {
  it("uses the user's injury, timing and goal instead of the demo recovery", () => {
    const seed = recoverySeedFromOnboarding(
      {
        injuryType: "Recent ankle sprain",
        injuryTiming: "3-7 days ago",
        injuryDate: "2026-02-25T10:00:00.000Z",
        symptoms: ["Swelling", "Pain when walking"],
        pain: 6,
        walkingAbility: "Yes, but limping",
        goal: "Return to sport",
      },
      new Date("2026-03-01T10:00:00.000Z"),
    );

    assert.equal(seed.journey.condition, "Recent ankle sprain");
    assert.equal(seed.journey.bodyPart, "Ankle");
    assert.equal(seed.journey.label, "Ankle recovery");
    assert.equal(seed.journey.startDate, "2026-02-25T10:00:00.000Z");
    assert.equal(seed.journey.goal, "Return to sport");
    assert.equal(seed.timeline.length, 1);
    assert.equal(seed.timeline[0].title, "Recovery started");
    assert.match(seed.timeline[0].detail ?? "", /Starting pain: 6\/10/);
    assert.match(seed.timeline[0].detail ?? "", /Symptoms: Swelling, Pain when walking/);
    assert.deepEqual(seed.medications, []);
    assert.deepEqual(seed.appointments, []);
    assert.deepEqual(seed.photos, []);
    assert.deepEqual(seed.reflections, []);
  });

  it("keeps the demo recovery explicit for the harness only", () => {
    assert.equal(DEMO_RECOVERY_SEED.journey.condition, "Knee surgery (post-operative rehabilitation)");
    assert.equal(DEMO_RECOVERY_SEED.timeline.length, 42);
  });
});
