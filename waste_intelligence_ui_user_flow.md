# Waste Intelligence System — UI & User Flow

## Core Concept

A citizen-powered waste intelligence platform that turns scattered reports of garbage into a continuously updated map of waste accumulation.

The core product is not simply a "report garbage" app.

It follows:

> **Report → Map → Prioritize → Act → Verify**

Citizens provide observations of waste. The system combines those observations into persistent waste hotspots, prioritizes them, and gives municipal authorities an actionable cleanup workflow.

---

# 1. Citizen App

The citizen side should be extremely simple. Reporting should take roughly **20–30 seconds**.

## Home Screen

The home screen should immediately answer:

> **"What can I do right now?"**

Suggested layout:

```text
┌─────────────────────────────────┐
│  CleanSpot                 🔔 👤 │
│                                 │
│  Help keep your neighborhood    │
│  clean.                         │
│                                 │
│   ┌─────────────────────────┐   │
│   │ 📍 REPORT WASTE         │   │
│   │ Takes less than 30 sec  │   │
│   └─────────────────────────┘   │
│                                 │
│   Nearby                        │
│   ┌─────────────────────────┐   │
│   │ 🔴 Waste hotspot        │   │
│   │ 230m away               │   │
│   │ Reported repeatedly     │   │
│   └─────────────────────────┘   │
│                                 │
│   Your contribution             │
│   7 reports • 3 resolved       │
│                                 │
│  🏠 Home   🗺️ Map   📋 Reports  │
└─────────────────────────────────┘
```

### Bottom Navigation

Keep the navigation simple:

- 🏠 **Home**
- 🗺️ **Map**
- 📋 **My Reports**
- 👤 **Profile**

---

# 2. Report Waste

This should be the primary action.

The user taps:

> **REPORT WASTE**

## Step 1 — Location

```text
┌─────────────────────────────────┐
│ ← Report Waste                  │
│                                 │
│ Where is the waste?             │
│                                 │
│ 📍 Use my current location      │
│                                 │
│ OR                              │
│                                 │
│ 🔎 Enter location manually      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │            MAP              │ │
│ │             📍              │ │
│ └─────────────────────────────┘ │
│                                 │
│              [ Continue ]       │
└─────────────────────────────────┘
```

### Location options

Primary:

> **Use my current location**

Alternative:

> **Choose location on map / Enter location manually**

Manual selection is important because GPS may be inaccurate or the user may be reporting something they saw earlier.

---

# 3. Add a Photo

```text
┌─────────────────────────────────┐
│ ← Report Waste        2 / 4     │
│                                 │
│ Add a photo                     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │          📷                 │ │
│ │       Take a photo          │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ [ Choose from gallery ]         │
│                                 │
│ Photo helps verify the report. │
│                                 │
│              [ Continue ]       │
└─────────────────────────────────┘
```

The photo should be **optional**, but strongly encouraged.

The user should still be able to report a waste dump quickly without being forced to stop and photograph it.
  
---

# 4. Waste Type

Keep the categories simple and understandable.

```text
┌─────────────────────────────────┐
│ What type of waste?             │
│                                 │
│  🗑️ Mixed        🌱 Organic     │
│                                 │
│  ♻️ Plastic      🧱 Construction│
│                                 │
│  📦 Paper        ⚠️ Hazardous   │
│                                 │
│  ❓ Not sure                    │
│                                 │
│ How much?                       │
│                                 │
│ ○ Small                         │
│ ○ Medium                        │
│ ○ Large                         │
│                                 │
│              [ Continue ]       │
└─────────────────────────────────┘
```

### Important

Include:

> **Not sure**

Users should not need technical knowledge.

If a photo is provided, computer vision can optionally assist with classification.

---

# 5. Severity / Immediate Problem

This information can contribute to the hotspot priority score.

Ask:

### How much waste is there?

```text
○ Small
  A few bags / small pile

○ Medium
  Large pile / several bags

○ Large
  Blocking road / overflowing area
```

Then:

### Is it causing an immediate problem?

```text
☐ Blocking road/path
☐ Blocking drain
☐ Bad smell
☐ Attracting animals
☐ Burning/smoke
☐ None
```

This is more useful than simply knowing that garbage exists.

For example, garbage blocking a storm drain can be given higher operational priority during periods of heavy rainfall.

---

# 6. Optional Description

Do not make this mandatory.

```text
┌─────────────────────────────────┐
│ Anything else?                  │
│                                 │
│ "Garbage has been here for      │
│ around 3 days and is blocking   │
│ the drain."                     │
│                                 │
│ [ Add description ]             │
│                                 │
│          [ Submit Report ]      │
└─────────────────────────────────┘
```

Use quick tags whenever possible instead of requiring users to type.

Example:

```text
☑ Blocking drain
☐ Blocking road
☑ Bad smell
☐ Burning
```

---

# 7. Report Submitted

Do not simply show "Thanks!"

Give the user visibility into what happens next.

```text
              ✓

       Report submitted

       #WS-18427

   📍 Sector 12, Main Road

   Your report has been added
   to the local waste map.

   Status
   ● Reported
   ○ Verified
   ○ Cleanup assigned
   ○ Resolved

       [ View on Map ]

       [ Done ]
```

The user should be able to track the report later.

---

# 8. Citizen Map

The map is one of the main visual features.

The default view should show **hotspots**, not every individual report.

```text
┌─────────────────────────────────┐
│ 🗺️ Waste Map             🔍     │
│                                 │
│ [ Near Me ] [ All ] [ 7 Days ]  │
│                                 │
│       🟥                        │
│          🟧     🟨              │
│                                 │
│    🟨          🟥               │
│             📍                  │
│                                 │
│          🟧                     │
│                                 │
│ 🟥 Critical                     │
│ 🟧 Persistent                   │
│ 🟨 Occasional                   │
│                                 │
│                         ⊕       │
└─────────────────────────────────┘
```

## Hotspot Details

When a user taps a hotspot:

```text
┌─────────────────────────────────┐
│ 🔴 HIGH WASTE HOTSPOT           │
│                                 │
│ Main Road, Sector 12            │
│                                 │
│ 47 reports                      │
│ 23 unique contributors          │
│ Active for 6 days               │
│                                 │
│ Common waste                    │
│ Mixed • Plastic • Organic       │
│                                 │
│ Last reported: 2 hours ago      │
│                                 │
│ Status: ⚠️ Cleanup pending      │
│                                 │
│ [ Report Here ]                 │
└─────────────────────────────────┘
```

---

# 9. My Reports

This creates transparency and encourages continued participation.

```text
MY REPORTS

┌──────────────────────────────┐
│ 🔴 Main Road                 │
│ Reported 2 hours ago         │
│ ⚠️ Cleanup pending           │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 🟡 Market Road               │
│ Reported 5 days ago          │
│ ✓ Resolved                   │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 🟢 School Road               │
│ Reported 2 weeks ago         │
│ ✓ Resolved                   │
└──────────────────────────────┘
```

Tapping a report opens its status timeline.

---

# 10. "Still There" / "Clean Now"

This is an important feature.

After a report or cleanup, nearby users can verify the current state.

```text
Is the waste still here?

      📍 120m away

      [ YES, STILL HERE ]

      [ NO, CLEAN NOW ]
```

This gives the system ground-truth feedback.

Instead of treating every report as an independent incident:

```text
Report 1 ─┐
Report 2 ─┤
Report 3 ─┼──→ SAME HOTSPOT
Report 4 ─┤
Report 5 ─┘
```

The system can identify persistent hotspots.

It can also detect:

```text
Reported
   ↓
Cleaned
   ↓
Waste returns
   ↓
Cleaned
   ↓
Waste returns
```

This identifies **recurring problem locations**.

---

# 11. Government / Municipal Dashboard

The municipal interface should be fundamentally different from the citizen interface.

The government user should not have to inspect thousands of individual reports.

The dashboard should answer:

> **"Where should we act first?"**

Suggested dashboard:

```text
┌────────────────────────────────────────────────────┐
│ MUNICIPAL WASTE INTELLIGENCE                       │
│                                                    │
│ Today                                              │
│                                                    │
│  284         47          18          63            │
│ Reports     Hotspots   Critical    Unresolved     │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│              WASTE HOTSPOT MAP                    │
│                                                    │
│       🟥              🟧                          │
│                🟥                                  │
│     🟨                    🟧                       │
│                                                    │
├────────────────────────────────────────────────────┤
│ PRIORITY ACTIONS                                   │
│                                                    │
│ 🔴 Main Road       47 reports     6 days           │
│ 🔴 Market Area     31 reports     4 days           │
│ 🟠 Station Road    22 reports     3 days           │
└────────────────────────────────────────────────────┘
```

---

# 12. Priority Queue

Do not force municipal staff to interpret the entire heatmap.

Give them a prioritized action queue.

```text
PRIORITY

#1 🔴 Main Road
    Waste score: 94
    Reports: 47
    Persistence: 6 days
    Blocks drainage
    Population exposure: High

    [ Assign Cleanup ]

#2 🔴 Market Road
    Waste score: 87
    Reports: 31
    Persistence: 4 days

    [ Assign Cleanup ]

#3 🟠 Station Road
    Waste score: 72
    Reports: 22

    [ Assign Cleanup ]
```

The exact priority algorithm can evolve as more data becomes available.

---

# 13. Waste Saturation Score

Create a score representing the persistence/severity of a waste hotspot.

Example:

```text
WASTE SATURATION SCORE

        87 / 100
        🔴 Critical

Reports              40%
Persistence          25%
Severity              20%
Recent activity       15%
```

Possible factors:

- number of reports
- number of unique reporters
- report recency
- persistence over time
- reported waste size
- obstruction/severity
- rate at which new reports are appearing

The important principle is:

> The score should help explain **why** an area is a priority.

Example:

```text
87/100 because:

• 42 reports
• 28 unique users
• Waste present for 5+ days
• Drain obstruction reported
• Recent reports increasing
```

Avoid presenting an unexplained "AI score."

---

# 14. Analytics / Trends

The municipal dashboard can provide historical insights.

## Reports Over Time

```text
Reports
 ^
 |                ╭╮
 |          ╭╮   ╭╯╰╮
 |      ╭───╯╰───╯  ╰╮
 |  ╭───╯
 └──────────────────────> Days
```

## Waste by Category

```text
Mixed          ████████████
Plastic        ████████
Organic        █████
Construction   ███
Other          ██
```

## Recurring Hotspots

Example:

```text
14 locations repeatedly become waste hotspots.
```

This is more useful for long-term planning than raw report counts.

---

# 15. Cleanup Assignment

A municipal worker should be able to assign a cleanup task directly from the hotspot.

```text
HOTSPOT #184

📍 Main Road, Sector 12

Priority: 🔴 Critical

Reason:
• 47 reports
• 6 days persistent
• Drain obstruction
• Increasing reports

[ Assign Team ]

Team:
[ Sanitation Team 4 ▼ ]

Deadline:
[ Today ▼ ]

[ ASSIGN ]
```

The hotspot status then changes:

```text
✓ Reported
✓ Verified
✓ Cleanup assigned
● Cleanup pending
○ Citizen confirmation
○ Resolved
```

---

# 16. Cleanup Verification

After cleanup, the worker can upload a photo.

Then nearby citizens can verify:

> **Is the area clean now?**

This creates a closed loop:

```text
Report
  ↓
Hotspot detected
  ↓
Priority assigned
  ↓
Cleanup
  ↓
Cleanup photo
  ↓
Citizen verification
  ↓
Resolved
```

If users continue reporting the location:

```text
Resolved
   ↓
New reports
   ↓
Recurring hotspot
```

The system can flag it for investigation.

---

# 17. Recurring Hotspots

After enough historical data exists, create a dedicated view:

```text
RECURRING WASTE HOTSPOTS

LOCATION            CLEANUPS   RETURNS

Main Road              8          7
Market Road            6          5
Station Road           4          4
School Road            3          1
```

This helps answer a deeper question:

> **"Why does this location keep becoming dirty?"**

Potential causes could include:

- illegal dumping
- insufficient bins
- insufficient collection frequency
- inadequate bin capacity
- commercial waste
- poor placement of collection points

The system should surface the pattern; municipal authorities can investigate the cause.

---

# 18. Complete User Flow

## Citizen

```text
              HOME
                │
                ↓
          [REPORT WASTE]
                │
                ↓
       📍 Location detected
                │
        ┌───────┴────────┐
        │                │
    GPS location    Choose manually
        │                │
        └───────┬────────┘
                ↓
            📷 Photo
                ↓
          Waste category
                ↓
          Severity / issue
                ↓
             SUBMIT
                ↓
          ✓ Reported
                ↓
       Track status later
```

## Backend

```text
                    CITIZEN REPORTS
                          │
                          ↓
                 ┌─────────────────┐
                 │ Validation      │
                 │ Deduplication   │
                 │ Geospatial      │
                 │ Clustering      │
                 └────────┬────────┘
                          ↓
                  WASTE HOTSPOTS
                          │
                          ↓
                 SATURATION SCORE
                          │
                          ↓
                PRIORITY RANKING
                          │
                          ↓
                MUNICIPAL ACTION
                          │
                          ↓
                     CLEANUP
                          │
                          ↓
                 CITIZEN CONFIRMATION
                          │
                    ┌─────┴─────┐
                    ↓           ↓
                  CLEAN       STILL THERE
                    │           │
                    ↓           ↓
                  CLOSE     KEEP PRIORITY
```

---

# 19. Product Philosophy

The app should not be:

> "Google Maps, but with garbage pins."

The important product loop is:

> **Report → Map → Prioritize → Act → Verify**

The citizen app is primarily a **data collection mechanism**.

The actual product is the **waste intelligence and municipal action layer**.

The goal is to transform:

```text
Thousands of scattered observations
                ↓
        Structured data
                ↓
       Persistent hotspots
                ↓
       Actionable priorities
                ↓
        Cleanup operations
                ↓
        Verified outcomes
```

This is what makes the project more than a complaint/reporting application.
