# ChatGPT Prompt: Find Exercise Videos For AnklePath

You are helping me source safe, high-quality exercise videos and thumbnails for a mobile ankle injury recovery app called AnklePath.

AnklePath helps users recover from ankle sprains, Grade 3 ankle injuries, chronic ankle instability, sports ankle pain, and post-surgery ankle recovery. The app is educational and does not replace professional medical advice.

Please find appropriate publicly available videos or trustworthy web pages with embedded videos for the following exercises:

1. Ankle circles
2. Towel calf stretch / towel ankle stretch
3. Resistance band eversion / banded ankle eversion
4. Single-leg balance for ankle stability

For each exercise, return 3 candidate videos or pages. Prioritize sources from:

- Licensed physiotherapists / physical therapists
- Sports medicine clinics
- Hospitals or university health systems
- Reputable rehab platforms
- Professional organizations
- YouTube channels clearly run by qualified clinicians

Avoid:

- Random influencer fitness videos with no clinical credentials
- Videos that recommend pushing through sharp pain
- Videos focused on unrelated full-body workouts
- Videos that look unsafe for early ankle sprain recovery
- Sources with unclear permissions, misleading claims, or extreme rehab advice

For each candidate, provide:

- Exercise name
- Video/page title
- Direct URL
- Source/creator name
- Why the source seems trustworthy
- Suggested recovery stage: early mobility, strength, balance/stability, return to sport, or post-surgery with clinician clearance
- Recommended in-app thumbnail idea, described in plain language
- 1-sentence app description for the exercise card
- Any safety caveat to show in the app

Also rate each candidate from 1 to 5 for:

- Clinical trustworthiness
- Clarity of demonstration
- Fit for AnklePath users
- Thumbnail usefulness

Return the result as a table first, then give a short recommendation for the best single video to use for each exercise.

Important safety notes:

- The videos should be suitable for general education only.
- If an exercise is inappropriate for severe pain, deformity, numbness, inability to bear weight, or post-surgery without clearance, say that clearly.
- Prefer videos that mention modifications, slow control, pain limits, or stopping when symptoms worsen.

After the table, give me a JSON array I can later paste into my app data file. Use this structure:

```json
[
  {
    "exerciseId": "ankle-circles",
    "exerciseName": "Ankle circles",
    "recommendedVideoUrl": "",
    "thumbnailUrlOrDescription": "",
    "sourceName": "",
    "sourceType": "",
    "trustNotes": "",
    "safetyCaveat": "",
    "appCardDescription": ""
  }
]
```
