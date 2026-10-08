# DumpMap --- Citizen-Powered Waste Intelligence Platform

## 1. Project Overview

**DumpMap** is a citizen-powered waste reporting and municipal
intelligence platform.

The core problem is simple:

> People regularly encounter garbage dumps, overflowing waste points,
> illegal dumping, and waste accumulating around roads, drains, markets,
> and public spaces. Individual observations are scattered and usually
> disappear after someone notices them.

DumpMap turns those observations into structured, geospatial data.

A citizen can quickly report a waste location using their phone:

1.  Open DumpMap.
2.  Tap **Report Waste**.
3.  The application obtains the user's location through GPS, or lets the
    user choose a location manually.
4.  The user can upload/take a photo.
5.  The user selects the waste type and severity.
6.  The report is submitted.
7.  The report appears on the system's map.
8.  Multiple reports from nearby locations are combined into persistent
    waste hotspots.
9.  A waste-saturation score ranks the hotspots.
10. A municipal dashboard shows authorities which areas should receive
    attention first.
11. After cleanup, the location can be marked resolved and citizens can
    confirm whether the waste is actually gone.

The central product loop is:

**Report → Map → Prioritize → Act → Verify**

The goal is not to create another garbage-reporting form. The goal is to
create a **waste intelligence layer** that helps municipalities
understand where waste repeatedly accumulates and where intervention
should be prioritized.

------------------------------------------------------------------------

# 2. Problem Statement

Municipal waste-management teams have limited personnel, vehicles, time,
and money.

A city may have thousands of locations where waste can accumulate, but
municipal teams need to answer practical questions such as:

-   Where are the worst waste hotspots?
-   Which locations are repeatedly becoming dirty?
-   Which locations have remained unresolved for the longest time?
-   Which areas are experiencing increasing reports?
-   Is a location blocking a road or storm drain?
-   Which waste types are most common in a particular area?
-   Did a cleanup actually resolve the problem?
-   Which locations repeatedly become dirty even after cleanup?

Traditional complaint systems often treat each complaint as an isolated
ticket.

DumpMap instead treats reports as **spatial and temporal observations**.

Example:

``` text
Citizen A ─┐
Citizen B ─┤
Citizen C ─┼──> Same physical waste location
Citizen D ─┤
Citizen E ─┘
                ↓
        Persistent hotspot
                ↓
       High priority for action
```

This makes the accumulated data much more valuable than individual
reports.

------------------------------------------------------------------------

# 3. Target Users

## 3.1 Citizens

Citizens use the mobile-first web application to:

-   Create an account
-   Log in
-   Report waste
-   Share their current location
-   Select a location manually
-   Upload a photo
-   Categorize waste
-   Describe severity
-   Track submitted reports
-   View nearby waste hotspots
-   Confirm whether waste is still present
-   Confirm whether a location has been cleaned

## 3.2 Municipal / Government Users

Municipal users use a separate dashboard to:

-   View waste hotspots
-   See high-priority locations
-   Filter by date, waste type, severity, and status
-   Inspect individual reports
-   Assign cleanup work
-   Track cleanup status
-   View recurring hotspots
-   Analyze trends
-   Identify areas requiring longer-term intervention

------------------------------------------------------------------------

# 4. Core Product Features

## 4.1 Citizen Authentication

Citizens authenticate through **Amazon Cognito**.

The application will support:

-   Email-based signup
-   Email verification
-   Email/password login
-   Password recovery
-   Authenticated sessions
-   User identity through a Cognito user ID

The application will use Cognito's modern **Managed Login** experience
initially.

The application does not store passwords itself.

### Authentication architecture

``` text
Citizen
   |
   v
DumpMap Web App
   |
   v
Amazon Cognito
   |
   +--> Sign up
   +--> Email verification
   +--> Login
   +--> Password recovery
   |
   v
Authenticated user ID
```

------------------------------------------------------------------------

# 5. Citizen User Flow

## 5.1 Home

The home screen should be simple and action-oriented.

Primary action:

> **Report Waste**

Secondary information:

-   Nearby hotspots
-   Recent reports
-   User's contribution statistics
-   Navigation to the map
-   Navigation to previous reports

Suggested bottom navigation:

``` text
Home | Map | My Reports | Profile
```

------------------------------------------------------------------------

## 5.2 Report Waste

The reporting flow should take approximately 20--30 seconds.

### Step 1 --- Location

The user chooses:

-   **Use my current location**
-   **Choose location on map**
-   **Enter/search location manually**

GPS should be the primary option.

The system stores:

-   Latitude
-   Longitude
-   Timestamp

The exact location is used to place the observation spatially.

------------------------------------------------------------------------

## 5.3 Step 2 --- Photo

The user can:

-   Take a photo
-   Select a photo from their device
-   Skip the photo if necessary

The photo is stored in **Amazon S3**.

The database stores the photo's reference/URL rather than storing the
binary image itself.

------------------------------------------------------------------------

## 5.4 Step 3 --- Waste Type

Suggested categories:

-   Mixed waste
-   Organic waste
-   Plastic
-   Paper
-   Construction/demolition waste
-   Hazardous waste
-   Other
-   Not sure

"Not sure" is important because citizens should not need technical
waste-management knowledge to report an incident.

------------------------------------------------------------------------

## 5.5 Step 4 --- Severity

Suggested levels:

### Small

A few bags or a small pile.

### Medium

A significant pile or multiple bags.

### Large

A major accumulation or large area affected.

Additional quick indicators:

-   Blocking road/path
-   Blocking drain
-   Bad smell
-   Attracting animals
-   Burning/smoke
-   None

These indicators can later contribute to the hotspot priority score.

------------------------------------------------------------------------

## 5.6 Step 5 --- Submit

After submission, the user receives:

-   Report ID
-   Location
-   Current status
-   Submission time

Example status:

``` text
Reported
   |
   v
Verified
   |
   v
Cleanup Assigned
   |
   v
Cleanup Completed
   |
   v
Citizen Confirmation
   |
   v
Resolved
```

------------------------------------------------------------------------

# 6. Waste Report Data Model

A waste report can contain:

``` text
reportId
userId
latitude
longitude
wasteType
severity
issueTags
description
photoUrl
status
createdAt
updatedAt
hotspotId
```

Example:

``` json
{
  "reportId": "WS-18427",
  "userId": "cognito-user-id",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "wasteType": "mixed",
  "severity": "large",
  "issueTags": [
    "blocking_drain",
    "bad_smell"
  ],
  "description": "Garbage has accumulated beside the drain.",
  "photoUrl": "s3://...",
  "status": "reported",
  "createdAt": "2026-10-08T12:00:00Z",
  "hotspotId": "HS-0184"
}
```

------------------------------------------------------------------------

# 7. The Most Important Feature: Waste Hotspots

DumpMap should not simply display thousands of individual pins.

Individual reports are observations.

The system should combine nearby observations into **hotspots**.

Example:

``` text
Report A  \
Report B   \
Report C ----> HOTSPOT #184
Report D   /
Report E  /
```

A hotspot represents a physical area where waste appears to be
accumulating.

------------------------------------------------------------------------

# 8. Spatial Clustering

A geospatial clustering algorithm can group reports that are
geographically close.

A possible initial implementation is:

**DBSCAN**

Why DBSCAN?

-   It works without specifying the number of clusters in advance.
-   It naturally handles spatially dense groups.
-   It can leave isolated reports as noise.
-   It is appropriate for latitude/longitude observations after suitable
    distance handling.

For a production implementation, coordinates should be handled using a
geographic distance calculation rather than treating latitude and
longitude as ordinary Euclidean features.

The clustering process can consider:

-   Geographic distance
-   Time window
-   Report density

This prevents reports from the same physical location over many months
from automatically becoming one permanent cluster.

------------------------------------------------------------------------

# 9. Waste Saturation Score

The system should rank hotspots rather than simply count reports.

A proposed score:

``` text
Waste Saturation Score
        =
Report Frequency
+ Persistence
+ Severity
+ Recent Activity
+ Infrastructure Impact
```

The exact weights should be configurable.

Possible components:

### Report frequency

How many reports have been submitted.

### Unique contributors

How many different citizens observed the location.

This prevents one person repeatedly submitting the same report from
artificially inflating the score.

### Persistence

How long the waste appears to remain present.

### Recent activity

Recent reports should contribute more strongly than very old reports.

### Severity

Large waste piles receive a higher score than small piles.

### Infrastructure impact

Blocking a road or drain should increase priority.

Example:

``` text
HOTSPOT #184

Waste Saturation Score: 87 / 100

Reports:              47
Unique reporters:     23
Persistence:          6 days
Severity:             High
Drain obstruction:    Yes
Recent activity:      Increasing

Priority: CRITICAL
```

The score should be explainable rather than presented as an unexplained
AI prediction.

------------------------------------------------------------------------

# 10. Heatmap

The citizen map can visualize waste density.

Suggested levels:

``` text
Green   = Low
Yellow  = Occasional
Orange  = Persistent
Red     = Critical
```

The map can show:

-   Current hotspots
-   Individual reports when appropriate
-   Hotspot severity
-   Report density
-   Recurring locations

Users should be able to filter by:

-   Last 24 hours
-   Last 7 days
-   Last 30 days
-   Waste type
-   Severity
-   Status

------------------------------------------------------------------------

# 11. Government Dashboard

The municipal dashboard is the most important operational interface.

The dashboard should answer:

> **What should the sanitation team deal with first?**

Instead of showing thousands of raw reports, it should provide a
priority queue.

Example:

``` text
PRIORITY ACTIONS

#1  Main Road
    Score: 94
    47 reports
    Persistent for 6 days
    Drain blocked
    Status: Cleanup pending

#2  Market Road
    Score: 87
    31 reports
    Persistent for 4 days
    Status: Cleanup pending

#3  Station Road
    Score: 72
    22 reports
    Persistent for 3 days
```

------------------------------------------------------------------------

# 12. Municipal Dashboard Features

## Overview

Display:

-   Total reports
-   Active hotspots
-   Critical hotspots
-   Unresolved reports
-   Reports today
-   Resolved reports
-   Average resolution time

## Map

Display:

-   Waste hotspots
-   Severity
-   Report density
-   Recurring hotspots
-   Cleanup status

## Priority Queue

Rank hotspots by saturation score.

## Report Details

Show:

-   Photos
-   Location
-   Waste type
-   Severity
-   Number of reports
-   Number of unique reporters
-   Timeline
-   Previous cleanup actions

## Cleanup Management

Allow municipal staff to:

-   Assign a cleanup team
-   Set a deadline
-   Change status
-   Add notes
-   Upload cleanup evidence

------------------------------------------------------------------------

# 13. Cleanup Verification

A major feature is the feedback loop after cleanup.

Instead of:

``` text
Report
   ↓
Cleanup
   ↓
Done
```

DumpMap should use:

``` text
Report
   ↓
Hotspot
   ↓
Cleanup
   ↓
Verification
   ↓
Resolved / Still Present
```

Citizens near the location can be asked:

> "Is the waste still here?"

Options:

-   **Yes, still here**
-   **No, cleaned**

This provides real-world feedback.

------------------------------------------------------------------------

# 14. Recurring Hotspots

One of the most valuable analytical features is identifying locations
that repeatedly become dirty.

Example:

``` text
LOCATION       CLEANUPS     RETURNS

Main Road          8           7
Market Road        6           5
Station Road       4           4
School Road        3           1
```

This can reveal that repeated cleaning is not solving the underlying
problem.

Possible causes may include:

-   Illegal dumping
-   Insufficient waste bins
-   Poor collection frequency
-   Commercial dumping
-   Poorly positioned bins
-   Lack of waste infrastructure

The system can therefore evolve from:

> "Where is the garbage?"

to:

> "Why does this place repeatedly become a garbage hotspot?"

------------------------------------------------------------------------

# 15. Technology Stack

## Frontend

Recommended:

-   React
-   Vite
-   TypeScript
-   Tailwind CSS
-   Responsive/mobile-first design

The application is a **mobile-first web application**, not a native
mobile application.

It should work primarily through mobile browsers while also adapting to
desktop screens.

### Why React + Vite?

-   Fast development
-   Component-based UI
-   Excellent SPA support
-   Easy integration with Cognito
-   Easy deployment
-   Good ecosystem

------------------------------------------------------------------------

# 16. Authentication

## Amazon Cognito

Responsibilities:

-   User registration
-   Login
-   Email verification
-   Password recovery
-   User identity
-   Authentication tokens
-   Session management

Configuration:

``` text
User Pool
    |
    +-- Email sign-in
    +-- Self-registration
    +-- Email verification
    +-- Managed Login
```

The application should not store user passwords.

------------------------------------------------------------------------

# 17. User Profiles

## Amazon DynamoDB

Cognito handles identity.

DynamoDB stores application-specific profile information.

Example:

``` text
Users

userId
name
email
role
createdAt
reportsCount
resolvedReports
```

The Cognito `sub`/user ID can be used as the application's user
identifier.

------------------------------------------------------------------------

# 18. Database

## Amazon DynamoDB

DynamoDB is the recommended initial database because the application's
primary records are naturally represented as key-value/document data.

Potential logical entities:

### Users

``` text
userId
name
email
role
createdAt
```

### WasteReports

``` text
reportId
userId
latitude
longitude
wasteType
severity
issueTags
photoUrl
status
createdAt
updatedAt
hotspotId
```

### Hotspots

``` text
hotspotId
centerLatitude
centerLongitude
reportCount
uniqueReporterCount
severityScore
persistenceScore
saturationScore
status
firstReportedAt
lastReportedAt
```

### CleanupActions

``` text
cleanupId
hotspotId
assignedTeam
assignedAt
deadline
completedAt
status
notes
evidencePhotoUrl
```

The exact DynamoDB key design should be finalized after the API and
query patterns are defined.

------------------------------------------------------------------------

# 19. Image Storage

## Amazon S3

Photos should be stored in Amazon S3.

Example:

``` text
S3
 |
 +-- reports/
      |
      +-- 2026/
           |
           +-- 10/
                |
                +-- report-18427.jpg
```

DynamoDB stores the reference to the image.

Do not store image binaries directly in DynamoDB.

------------------------------------------------------------------------

# 20. Backend

## AWS Lambda

Lambda functions will contain backend business logic.

Potential functions:

``` text
createReport()
getReports()
getNearbyHotspots()
calculateHotspot()
getUserReports()
confirmCleanup()
assignCleanup()
updateCleanupStatus()
```

Lambda is useful because the project does not require a continuously
running server.

------------------------------------------------------------------------

# 21. API Layer

## Amazon API Gateway

API Gateway exposes backend functionality to the frontend.

Example endpoints:

``` text
POST   /reports
GET    /reports
GET    /reports/{id}
GET    /hotspots
GET    /hotspots/{id}
GET    /users/me/reports

POST   /reports/{id}/confirm
POST   /hotspots/{id}/cleanup
PATCH  /hotspots/{id}/status
```

Authentication tokens from Cognito can be used to authorize protected
API operations.

------------------------------------------------------------------------

# 22. Maps and Location

A map service is required for:

-   Displaying reports
-   Selecting a location
-   Displaying hotspots
-   Reverse geocoding
-   Potentially searching addresses
-   Showing nearby locations

A suitable AWS-native option is **Amazon Location Service**.

The application can use a mapping component in the frontend while
keeping location-related backend functionality behind APIs.

------------------------------------------------------------------------

# 23. AWS Architecture

High-level architecture:

``` text
                    MOBILE BROWSER
                          |
                          v
                +-------------------+
                | React / Vite App  |
                +---------+---------+
                          |
             +------------+------------+
             |                         |
             v                         v
       Amazon Cognito           API Gateway
       Managed Login                  |
                                      v
                                  AWS Lambda
                                      |
                        +-------------+-------------+
                        |             |             |
                        v             v             v
                   DynamoDB          S3       Location/Geo
                        |             |          Services
                        |             |
                        +------+------+
                               |
                               v
                        Hotspot Engine
                               |
                               v
                       Municipal Dashboard
```

------------------------------------------------------------------------

# 24. Authentication Architecture

``` text
                 CITIZEN
                    |
                    v
             DumpMap Frontend
                    |
                    v
            Amazon Cognito
                    |
             Authentication
                    |
                    v
               User ID
                    |
                    v
             API Gateway
                    |
                    v
                Lambda
                    |
                    v
              DynamoDB
```

------------------------------------------------------------------------

# 25. Report Submission Architecture

``` text
Citizen
   |
   | GPS + waste details
   | photo
   v
React Application
   |
   +----------------------+
   |                      |
   v                      v
API Gateway              S3
   |                   Photo
   v
Lambda
   |
   v
DynamoDB
   |
   v
Waste Report
```

------------------------------------------------------------------------

# 26. Hotspot Processing

Initial MVP:

``` text
New Report
    |
    v
Find nearby reports
    |
    v
Spatial clustering
    |
    v
Create/update hotspot
    |
    v
Calculate saturation score
    |
    v
Update hotspot
```

For larger scale, hotspot processing can be moved to
asynchronous/event-driven processing.

Potential AWS services for future expansion:

-   Amazon EventBridge
-   Amazon SQS
-   AWS Step Functions
-   Amazon OpenSearch
-   Amazon SageMaker

These should not be added just for the sake of using more AWS services.

------------------------------------------------------------------------

# 27. AI / ML Strategy

AI is **not required for the core product**.

The core value comes from:

-   Citizen reporting
-   Geospatial clustering
-   Temporal analysis
-   Priority scoring
-   Verification
-   Municipal workflow

AI can be added where it solves a real problem.

Potential future ML capabilities:

## Image classification

Automatically identify:

-   Plastic
-   Organic waste
-   Construction waste
-   Mixed waste
-   Burning waste

## Severity estimation

Estimate the approximate size/severity of a waste pile from the uploaded
image.

## Hotspot prediction

Predict locations that are likely to become waste hotspots based on:

-   historical reports
-   time
-   location
-   events
-   weather
-   collection schedules

## Duplicate detection

Detect whether a new photo/report is likely referring to an existing
incident.

------------------------------------------------------------------------

# 28. Why AI Should Not Be the Core

The project should not become:

``` text
Photo
  ↓
AI classifier
  ↓
"This is garbage"
```

That solves a small technical problem but does not solve municipal waste
management.

The important problem is:

``` text
Observation
    ↓
Location
    ↓
Accumulation
    ↓
Priority
    ↓
Action
    ↓
Verification
```

AI should support this workflow rather than replace it.

------------------------------------------------------------------------

# 29. Security

Important security principles:

## Root AWS account

Used only for account-level administration.

## IAM Identity Center

Used for the development/admin team to access AWS.

The developer account currently uses:

``` text
IAM Identity Center
        |
        v
anuraag
        |
        v
AdministratorAccess
```

For a production system, permissions should eventually be reduced to
least privilege.

## Cognito

Used for application users.

Citizens should not be IAM users.

``` text
AWS developers
    -> IAM Identity Center

Application citizens
    -> Cognito
```

## API authorization

Protected API operations should validate Cognito authentication tokens.

Users should only be able to modify their own reports unless they have
an authorized municipal role.

------------------------------------------------------------------------

# 30. Data Privacy

The application should minimize personal information.

For normal citizen reporting, the system primarily needs:

-   Cognito user ID
-   Email
-   Optional display name
-   Report information
-   Location of reported waste

The application should avoid collecting unnecessary sensitive personal
information.

Location data should be handled carefully because reports can reveal
where a user was at a particular time.

------------------------------------------------------------------------

# 31. Abuse Prevention

A public citizen-reporting platform needs protection against:

-   Spam reports
-   Fake reports
-   Repeated submissions
-   Malicious photos
-   Location manipulation
-   Automated requests

Potential protections:

-   Cognito authentication
-   API throttling
-   Rate limiting
-   Report deduplication
-   Photo validation
-   Spatial clustering
-   Unique-reporter weighting
-   Moderation/verification workflow

A single user repeatedly reporting the same location should not
artificially create a critical hotspot.

------------------------------------------------------------------------

# 32. Cost-Conscious AWS Design

For a student/hackathon project, avoid unnecessary infrastructure.

Prefer:

``` text
Cognito
DynamoDB
S3
Lambda
API Gateway
Amazon Location Service
```

These services allow a largely serverless architecture.

Avoid deploying:

-   EC2 servers without a real requirement
-   NAT gateways unless required
-   Always-running containers
-   unnecessary multi-region infrastructure

The current development setup should remain in:

**Asia Pacific (Mumbai) --- `ap-south-1`**

A multi-region architecture is unnecessary for the MVP.

------------------------------------------------------------------------

# 33. AWS Open Source / AWS Hackathon Alignment

The project can qualify through AWS deployment.

The core deployed AWS services are:

-   Amazon Cognito
-   Amazon DynamoDB
-   Amazon S3
-   AWS Lambda
-   Amazon API Gateway
-   Amazon Location Service

Potential additional AWS services can be introduced only when they
provide real value.

The project should not use AWS services merely to increase the number of
services listed in the architecture.

------------------------------------------------------------------------

# 34. MVP

The first working version should contain only:

### Citizen

-   Signup/login
-   Report waste
-   GPS location
-   Manual location selection
-   Photo upload
-   Waste type
-   Severity
-   Submit report
-   View submitted reports
-   View waste map

### Backend

-   Cognito
-   API Gateway
-   Lambda
-   DynamoDB
-   S3

### Hotspot engine

-   Spatial clustering
-   Basic saturation score
-   Heatmap

### Municipal

-   Dashboard
-   Hotspot map
-   Priority list
-   Report details
-   Cleanup status

This is enough for a strong demo.

------------------------------------------------------------------------

# 35. Future Features

After the MVP:

-   Cleanup team assignment
-   Citizen cleanup confirmation
-   Recurring hotspot detection
-   Predictive waste hotspots
-   Image-based waste classification
-   Illegal dumping detection
-   Route optimization for collection teams
-   Waste collection schedule integration
-   Municipal ward-level analytics
-   Public API
-   Notification system
-   QR-based waste infrastructure reporting
-   Integration with smart bins

------------------------------------------------------------------------

# 36. Example End-to-End Scenario

A citizen walks down a road and notices a large pile of mixed waste
beside a blocked drain.

They open DumpMap.

``` text
Report Waste
      |
      v
GPS location detected
      |
      v
Take photo
      |
      v
Waste type: Mixed
      |
      v
Severity: Large
      |
      v
Issue: Blocking drain
      |
      v
Submit
```

The backend stores the report.

Five more citizens report the same area.

The system identifies the reports as belonging to the same physical
hotspot.

``` text
6 reports
5 unique citizens
4 hours of activity
Large waste
Drain obstruction
```

The hotspot receives:

``` text
Saturation Score: 91
Priority: Critical
```

The municipal dashboard shows:

``` text
CRITICAL HOTSPOT

Main Road
6 reports
5 contributors
Drain blocked
Active: 4 hours

[Assign Cleanup]
```

A sanitation team cleans the location.

The team uploads evidence.

Nearby citizens are asked:

> "Is the waste still here?"

Citizens answer:

> No, cleaned.

The hotspot changes to:

``` text
RESOLVED
```

If the same location becomes dirty again three days later, the system
detects:

``` text
RECURRING HOTSPOT
```

This tells the municipality that the location may require a structural
solution rather than another one-time cleanup.

------------------------------------------------------------------------

# 37. Product Philosophy

DumpMap should follow five principles:

### 1. Fast for citizens

Reporting should take seconds, not minutes.

### 2. Useful for municipalities

The system should prioritize actions rather than merely display
complaints.

### 3. Explainable

A hotspot should have understandable reasons for its priority score.

### 4. Feedback-driven

Cleanup should be verified rather than assumed.

### 5. Impact over AI

Technology should solve the waste-management problem. AI should only be
used where it adds measurable value.

------------------------------------------------------------------------

# 38. Core Value Proposition

### For citizens

> **See waste → report it → track what happens.**

### For municipalities

> **See where waste repeatedly accumulates → prioritize resources →
> verify cleanup.**

### For the city

> **Turn scattered citizen observations into actionable waste-management
> intelligence.**

------------------------------------------------------------------------

# 39. Final Architecture Summary

``` text
                         DUMPMAP
                            |
                 Mobile-first Web App
                            |
                   React + Vite + TS
                            |
             +--------------+--------------+
             |                             |
             v                             v
       Amazon Cognito                API Gateway
       Managed Login                      |
                                           v
                                       Lambda
                                           |
                    +----------------------+----------------+
                    |                      |                |
                    v                      v                v
                DynamoDB                  S3        Location Services
                    |                      |
                    |                      |
                    +----------+-----------+
                               |
                               v
                     Geospatial Processing
                               |
                               v
                       Hotspot Detection
                               |
                               v
                       Saturation Scoring
                               |
                               v
                     Municipal Dashboard
                               |
                               v
                    Cleanup + Verification
                               |
                               v
                     Updated hotspot state
```

------------------------------------------------------------------------

# 40. Recommended Development Order

## Phase 1 --- Foundation

-   React + Vite project
-   Mobile-first UI
-   AWS account
-   IAM Identity Center
-   Cognito User Pool

## Phase 2 --- Authentication

-   Signup
-   Email verification
-   Login
-   Logout
-   Protected routes

## Phase 3 --- Reporting

-   GPS
-   Manual location selection
-   Photo upload
-   Waste category
-   Severity
-   Report submission

## Phase 4 --- AWS Backend

-   API Gateway
-   Lambda
-   DynamoDB
-   S3

## Phase 5 --- Map

-   Map integration
-   Report markers
-   Hotspots
-   Filters

## Phase 6 --- Intelligence

-   Geospatial clustering
-   Hotspot generation
-   Saturation score
-   Recurring hotspot detection

## Phase 7 --- Municipal Dashboard

-   Overview
-   Map
-   Priority queue
-   Report details
-   Cleanup workflow

## Phase 8 --- Verification

-   Cleanup evidence
-   Citizen confirmation
-   Resolved/recurring status

## Phase 9 --- Optional AI

Only after the core system works:

-   Image classification
-   Duplicate detection
-   Predictive hotspot detection
-   Severity estimation

------------------------------------------------------------------------

# 41. One-Sentence Pitch

> **DumpMap turns citizen reports of garbage into a live
> waste-intelligence map that identifies persistent hotspots,
> prioritizes municipal cleanup, and verifies whether the problem was
> actually resolved.**
