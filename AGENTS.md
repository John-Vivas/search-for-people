# AGENTS.md

# Estamos Buscando — AI Development Guidelines

## 1. Project Identity

**Project:** Estamos Buscando

**Type:** Community emergency information platform

**Purpose:** Help communities locate missing people, register found people, identify unidentified persons (NN), and report lost/found pets during emergency situations.

The platform centralizes community-reported information and provides:

* Search
* Filters
* Person records
* Pet records
* Emergency zones
* Locations
* Hospitals and facilities
* Reports
* Verification status
* Event history
* Map visualization
* Administrative moderation
* Future offline support
* Future realtime synchronization

---

# 2. IMPORTANT DISCLAIMER

Estamos Buscando is an independent community initiative.

It is NOT officially affiliated with:

* Government of Colombia
* Municipal governments
* Departmental governments
* Police
* Fire departments
* Red Cross
* Civil Defense
* Hospitals
* Emergency response organizations
* Any other public or private institution

The application is a complementary information and coordination tool.

Information must be verified before being used for critical decisions.

The application must never present community-reported information as official emergency information.

---

# 3. Core Product Principle

The primary purpose of the application is:

> Help people know where a person may be and help reunite them with their families.

During emergencies, the application must prioritize:

1. Clarity
2. Reliability
3. Privacy
4. Accessibility
5. Simplicity
6. Performance
7. Traceability
8. Mobile usability

Avoid unnecessary complexity in the user interface.

---

# 4. Technology Stack

## Frontend

* React
* Vite
* TypeScript
* Tailwind CSS

## Routing

* React Router

## Forms

* React Hook Form
* Zod

## Server State

* TanStack Query

## Icons

* Lucide React

## Backend

* Supabase

## Database

* PostgreSQL through Supabase

## Authentication

* Supabase Auth

## Storage

* Supabase Storage

## Realtime

* Supabase Realtime

## Hosting

* Vercel

## Maps

The application must remain provider-agnostic.

Potential providers:

* Leaflet
* OpenStreetMap
* Mapbox
* Google Maps

The map provider must NOT be tightly coupled to the domain/data layer.

---

# 5. Development Philosophy

Always prefer:

* Simple solutions
* Explicit code
* Strong typing
* Modular architecture
* Small functions
* Reusable services
* Testable logic
* Clear responsibilities
* Security by design
* Progressive implementation

Avoid:

* Overengineering
* Premature abstractions
* Massive components
* Massive services
* Global mutable state
* Duplicate logic
* Hardcoded business data
* Direct database access from UI components
* Secrets in frontend code
* `any` without justification

---

# 6. Existing Architecture

The project follows a feature-based modular architecture.

```text
src/
│
├── app/
│   ├── router/
│   ├── providers/
│   └── config/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   └── common/
│
├── features/
│   │
│   ├── persons/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── types/
│   │
│   ├── reports/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── types/
│   │
│   ├── pets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── map/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   └── admin/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── layouts/
│
├── services/
│   └── api/
│
├── hooks/
│
├── lib/
│   ├── utils.ts
│   ├── constants.ts
│   └── supabase.ts
│
├── data/
│   └── mock/
│
├── types/
│
├── App.tsx
└── main.tsx
```

Do not replace this architecture without a strong technical reason.

---

# 7. Architecture Rule

The application must follow this data flow:

```text
UI
 ↓
Hook
 ↓
Service
 ↓
Supabase
 ↓
PostgreSQL
```

Example:

```text
PersonList
 ↓
usePersons()
 ↓
persons.service.ts
 ↓
supabase.from("persons")
```

Never use:

```text
React Component
 ↓
supabase.from(...)
```

Components must not directly access Supabase.

---

# 8. Separation of Responsibilities

## Components

Responsible for:

* Rendering UI
* User interactions
* Displaying loading states
* Displaying errors
* Receiving data through props/hooks

Components must NOT:

* Execute Supabase queries
* Contain database logic
* Contain complex business rules
* Manipulate database records directly

---

## Hooks

Responsible for:

* TanStack Query
* Query configuration
* Mutations
* Cache invalidation
* Loading/error states

Example:

```text
usePersons()
usePerson(id)
useCreatePerson()
useUpdatePerson()
```

---

## Services

Responsible for:

* Supabase queries
* Data transformations
* Database interaction
* Error handling
* Domain-specific data access

Example:

```text
persons.service.ts
pets.service.ts
reports.service.ts
facilities.service.ts
locations.service.ts
```

---

## Schemas

Responsible for:

* Form validation
* Input validation
* User-facing validation rules

Use:

```text
Zod
```

Frontend validation does NOT replace PostgreSQL constraints.

---

## Types

Responsible for:

* Domain models
* Service contracts
* Component contracts
* API/database types

Avoid duplicated definitions.

---

# 9. Supabase Architecture

Supabase provides:

```text
Supabase
├── PostgreSQL
├── Auth
├── Storage
└── Realtime
```

The frontend should use the Supabase client through:

```text
src/lib/supabase.ts
```

The client must use environment variables.

Required variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Newer Supabase projects may expose a publishable key instead of the legacy `anon` naming. Use the credential actually provided by the project, but keep the application's environment variable naming consistent unless there is a deliberate migration. Supabase states that publishable/anon keys are intended for frontend use when RLS is properly configured.

---

# 10. NEVER Expose Secrets

Never put these in frontend code:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET_KEY
Database passwords
Private API keys
JWT signing secrets
Private tokens
```

Never commit:

```text
.env
.env.local
.env.*.local
```

Only public client configuration belongs in Vite environment variables.

Supabase explicitly states that service-role and secret keys bypass RLS and must never be exposed in browser/client applications.

---

# 11. Database Schema

The current database contains:

```text
organizations
profiles
emergency_zones
locations
facilities
reporters
persons
pets
reports
person_events
report_media
organization_members
```

Supabase Auth provides:

```text
auth.users
```

The application profile is:

```text
profiles.id → auth.users.id
```

---

# 12. Main Domain Model

The main relationship is:

```text
auth.users
    ↓
profiles
    ↓
reporters
    ↓
reports
    ↓
persons / pets
```

Additional relationships:

```text
emergency_zones
    ↓
locations
    ↓
persons
    ↓
pets
    ↓
facilities
```

Person history:

```text
persons
    ↓
person_events
```

Media:

```text
persons / pets / reports
    ↓
report_media
    ↓
Supabase Storage
```

---

# 13. Important Domain Distinction

A **report** is NOT the same as a person.

A report represents:

> A submission made by someone providing information.

A person represents:

> The actual person being searched for or identified.

Example:

```text
Reporter
    ↓
Report
    ↓
Person
```

Do not merge these concepts.

---

# 14. Persons

The `persons` table represents:

* Missing people
* Found people
* Unidentified people
* Identified people
* Transferred people
* Reunited people

Possible states:

```text
MISSING
FOUND
UNIDENTIFIED
IDENTIFIED
TRANSFERRED
REUNITED
```

Do NOT create separate tables such as:

```text
missing_persons
found_persons
unidentified_persons
```

unless there is a future, explicitly approved architectural reason.

Use the `status` field.

---

# 15. NN / Unidentified Persons

Unidentified persons use:

```text
identifier_code
```

Examples:

```text
NN-0001
NN-0002
NN-0003
```

An unidentified person can later become identified without creating another record.

Example:

```text
identifier_code = NN-0001
status = UNIDENTIFIED
```

Later:

```text
identifier_code = NN-0001
status = IDENTIFIED
full_name = "Example Person"
```

Never delete the historical identity record simply because the person becomes identified.

---

# 16. Pets

Pets are a separate domain entity.

Possible states:

```text
LOST
FOUND
REUNITED
```

Do not force pets into the `persons` table.

---

# 17. Reports

Report types:

```text
MISSING_PERSON
FOUND_PERSON
UNIDENTIFIED_PERSON
LOST_PET
FOUND_PET
```

Report statuses:

```text
PENDING
UNDER_REVIEW
APPROVED
REJECTED
DUPLICATE
```

These are different from person/pet statuses.

Never mix:

```text
report.status
```

with:

```text
person.status
```

---

# 18. Reporter Privacy

Reporter information is private.

The `reporters` table may contain:

```text
full_name
identification_number
phone
email
relationship
organization_id
```

This information must NEVER be displayed in public search results.

Public records should expose only the information necessary to help locate or identify the reported person/pet.

Use:

```text
reporter_id
```

to reference the reporter.

Do not duplicate private reporter information inside:

```text
persons
pets
reports
```

---

# 19. Public vs Private Data

Always distinguish:

```text
PUBLIC DATA
```

from:

```text
PRIVATE DATA
```

Public examples:

```text
Person name
Approximate age
Status
Zone
Last known location
Description
Verification status
Updated timestamp
```

Private examples:

```text
Reporter identification
Reporter phone
Reporter email
Reporter relationship
Private organization information
```

When in doubt, DO NOT expose the data publicly.

---

# 20. Row Level Security

RLS is mandatory for exposed Supabase tables.

Any table in the exposed `public` schema must have an intentional RLS strategy.

Supabase recommends enabling RLS on exposed tables and defining policies for the appropriate roles.

Do not consider frontend authorization sufficient.

This is NOT sufficient:

```typescript
if (user.role === "ADMIN") {
  showAdminPanel();
}
```

That only controls UI visibility.

Real authorization must be enforced by:

```text
PostgreSQL
+
Supabase RLS
+
Auth
```

---

# 21. RLS Policy Principles

Policies must:

* Specify the intended role
* Follow least privilege
* Protect private information
* Restrict INSERT/UPDATE/DELETE
* Prevent unauthorized access
* Be tested

Prefer explicit policies:

```sql
to authenticated
```

instead of policies that unintentionally apply to every role.

Supabase recommends specifying policy roles and using `(select auth.uid())` where appropriate for authorization checks.

---

# 22. RLS Performance

Columns used in RLS policies should be indexed when appropriate.

Common examples:

```text
profile_id
user_id
organization_id
reporter_id
```

Supabase recommends indexing columns used by RLS policies and adding explicit filters to queries to help PostgreSQL produce better query plans.

---

# 23. Storage

Images must NOT be stored as Base64 in PostgreSQL.

Use:

```text
Supabase Storage
```

PostgreSQL stores metadata:

```text
storage_bucket
storage_path
media_type
mime_type
file_size_bytes
is_primary
```

The `report_media` table represents the database metadata.

Storage access must be controlled.

Do not assume that all person photographs should be public.

---

# 24. Images of People

This is a sensitive application domain.

Before exposing a photograph publicly:

* Check its visibility rules.
* Check whether the record is approved.
* Check whether the image belongs to the correct record.
* Do not expose private uploads accidentally.
* Do not use unrestricted public buckets for sensitive media without an explicit decision.

---

# 25. Search

Search should eventually support:

```text
Name
Status
Zone
Type
Date
Location
```

Search must preferably be performed server-side.

Avoid:

```text
Download 10,000 records
 ↓
Filter in JavaScript
```

Prefer:

```text
Database
 ↓
Filtered query
 ↓
Paginated results
```

---

# 26. Pagination

Public lists must be designed for pagination.

Avoid loading unlimited records.

Use:

* Pagination
* Range queries
* Server-side filtering
* Appropriate indexes
* TanStack Query caching

---

# 27. TanStack Query

Use TanStack Query for server state.

Queries:

```text
usePersons()
usePerson(id)
usePets()
usePet(id)
useReports()
useFacilities()
useEmergencyZones()
usePersonEvents(personId)
```

Mutations:

```text
useCreatePerson()
useUpdatePerson()
useCreateReport()
useApproveReport()
useRejectReport()
```

After mutations, invalidate affected queries.

Example:

```typescript
queryClient.invalidateQueries({
  queryKey: ["persons"],
});
```

Avoid unnecessary manual refetches.

---

# 28. Query Keys

Use predictable query keys.

Examples:

```text
["persons"]
["persons", personId]
["persons", { status, zoneId }]
["pets"]
["pets", petId]
["reports"]
["reports", reportId]
["facilities"]
["emergency-zones"]
["person-events", personId]
```

Do not create inconsistent query-key formats across features.

---

# 29. Database Queries

Avoid unnecessary:

```typescript
.select("*")
```

Prefer selecting only the fields required by the UI.

For example:

```text
id
full_name
approximate_age
sex
status
zone_id
last_seen_at
is_verified
```

This reduces unnecessary data transfer and helps avoid accidentally exposing private fields.

---

# 30. TypeScript

Use strict TypeScript.

Prefer:

```typescript
type
interface
unknown
generics
discriminated unions
```

Avoid:

```typescript
any
```

If `any` is absolutely necessary, document why.

Do not silently suppress TypeScript errors.

Avoid:

```typescript
// @ts-ignore
```

unless there is a documented technical reason.

---

# 31. Naming

Use clear English names for:

* Files
* Variables
* Functions
* Types
* Services
* Hooks
* Database fields

Examples:

```text
PersonCard.tsx
persons.service.ts
usePersons.ts
person-events.service.ts
EmergencyZone
```

Database names use:

```text
snake_case
```

Frontend TypeScript names use:

```text
camelCase
PascalCase
```

---

# 32. Components

Components should remain small.

Avoid components containing:

* Database queries
* Large validation systems
* Business logic
* Multiple unrelated responsibilities

If a component becomes difficult to understand, extract:

```text
component
hook
service
utility
schema
```

---

# 33. Forms

Use:

```text
React Hook Form
+
Zod
```

Form flow:

```text
User Input
 ↓
React Hook Form
 ↓
Zod validation
 ↓
Hook mutation
 ↓
Service
 ↓
Supabase
```

Never trust frontend validation as the only security mechanism.

---

# 34. Error Handling

Never silently ignore errors.

Bad:

```typescript
try {
  ...
} catch {
}
```

Good:

```typescript
try {
  ...
} catch (error) {
  logger.error(error);
  throw new AppError("Unable to load persons");
}
```

User-facing messages should be understandable.

Do not expose:

* SQL errors
* Internal database details
* Stack traces
* Secrets
* Tokens

---

# 35. Loading States

Every asynchronous UI should consider:

```text
Loading
Success
Empty
Error
```

Example:

```text
Loading...
```

```text
No missing people found.
```

```text
Unable to load information. Please try again.
```

Do not leave users with a blank screen.

---

# 36. Empty States

Every list should have a meaningful empty state.

Examples:

```text
No missing people registered in this zone.
```

```text
No pets found matching your search.
```

```text
No reports are currently pending.
```

---

# 37. Accessibility

The application must support:

* Semantic HTML
* Labels
* Keyboard navigation
* Visible focus
* Accessible buttons
* Alt text
* Good contrast
* Screen-reader-friendly structure
* Adequate touch targets

Do not communicate important information through color alone.

For example, do not rely exclusively on:

```text
RED = MISSING
GREEN = FOUND
```

Use:

```text
Badge + text + optional color
```

---

# 38. Responsive Design

Use mobile-first design.

Priority:

```text
Mobile
 ↓
Tablet
 ↓
Desktop
```

Emergency users may access the application through phones.

Prioritize:

* Large buttons
* Simple navigation
* Clear information
* Fast loading
* Minimal typing
* High readability

---

# 39. Emergency UX

The interface must work well under stressful conditions.

Avoid:

* Complex menus
* Excessive animations
* Long forms
* Unnecessary confirmation steps
* Ambiguous terminology

Prefer:

```text
Buscar persona
Reportar desaparecido
Reportar encontrado
Buscar mascota
Ver mapa
```

Primary actions should be obvious.

---

# 40. Zones

Initial zones:

```text
Cali
Pereira
Quibdó
Manizales
Buenaventura
Armenia
```

These are database records.

Do NOT hardcode them repeatedly in components.

The database is the source of truth.

Future zones may include:

* Other cities
* Municipalities
* Emergency areas
* Custom geographic regions

---

# 41. Maps

The map layer must remain independent.

Architecture:

```text
Map UI
 ↓
Map Hook
 ↓
Map Service
 ↓
Domain Data
 ↓
Supabase
```

The domain layer should not depend directly on:

```text
Leaflet
Mapbox
Google Maps
```

The provider can be changed later.

---

# 42. Map Markers

Conceptually:

```text
Missing Person
→ red marker

Found Person
→ green marker

Unidentified Person
→ yellow marker

Facility
→ blue marker

Pet
→ pet marker
```

However, important states must also be represented using text/icons, not color alone.

---

# 43. Person Events

Person history must be preserved.

Example:

```text
10:32
Person reported

10:47
Person found

11:15
Transferred to hospital

11:42
Identity confirmed

12:10
Reunited with family
```

Use:

```text
person_events
```

Do not overwrite history when a status changes.

Events should normally be append-only from normal application workflows.

---

# 44. Verification

Records may contain:

```text
is_verified
```

Do not imply that an unverified community report is official.

UI should clearly distinguish:

```text
Verified
```

from:

```text
Pending verification
```

The exact visual treatment should remain accessible and not rely only on color.

---

# 45. Mock Data

Development mocks must NEVER contain real personal data.

Use:

* Fictional names
* Placeholder images
* Synthetic phone numbers
* Fake identifiers
* Fictional locations where appropriate

Never commit:

* Real missing-person information
* Real identification numbers
* Real phone numbers
* Real private photographs
* Real medical/private records

---

# 46. Mock → Supabase Migration

Do not delete all mocks immediately.

Migration strategy:

```text
Mock data
    ↓
Service abstraction
    ↓
Supabase implementation
    ↓
Feature migration
    ↓
Remove obsolete mocks
```

Each feature should be migrated independently.

Recommended order:

```text
1. Zones
2. Locations
3. Facilities
4. Persons
5. Pets
6. Reports
7. Person Events
8. Media
9. Auth
10. Admin
11. Realtime
```

---

# 47. Authentication

Use Supabase Auth.

Initial capabilities:

```text
signUp
signIn
signOut
getSession
getUser
```

Create:

```text
useAuth()
```

or an equivalent authentication provider.

Do not duplicate authentication state unnecessarily.

---

# 48. Profiles

Supabase provides:

```text
auth.users
```

Application profile:

```text
profiles
```

Relationship:

```text
profiles.id → auth.users.id
```

Do not create a second independent users table unless there is a strong architectural reason.

---

# 49. Roles

Current application roles:

```text
USER
VOLUNTEER
MODERATOR
ADMIN
```

Frontend role checks are for UX.

Database RLS is responsible for real authorization.

Never trust:

```typescript
localStorage.role
```

for authorization.

---

# 50. Organizations

Organizations may represent:

```text
NGO
VOLUNTEER_GROUP
COMMUNITY
PRIVATE
GOVERNMENT
OTHER
```

The existence of an organization record does NOT imply official government affiliation.

Do not display language suggesting institutional endorsement unless such integration actually exists.

---

# 51. Admin

Admin functionality may include:

* Review reports
* Approve reports
* Reject reports
* Mark duplicates
* Verify information
* Update person status
* Manage facilities
* Review events

Admin access must be enforced server-side through RLS/policies.

---

# 52. Database Migrations

Database changes must eventually be versioned.

Preferred structure:

```text
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_seed_zones.sql
    ├── 003_rls_policies.sql
    ├── 004_storage.sql
    └── 005_indexes.sql
```

Do not make destructive production changes casually.

Before modifying:

* Understand existing relationships.
* Check foreign keys.
* Check existing data.
* Create a migration.
* Test it.

Supabase recommends a workflow where database changes are developed locally with the Supabase CLI and deployed consistently through version control as the project matures.

---

# 53. Destructive Database Changes

Never automatically execute:

```text
DROP TABLE
DROP COLUMN
TRUNCATE
DELETE *
```

without explicit approval.

If a schema change is destructive:

1. Explain the impact.
2. Propose migration.
3. Confirm compatibility.
4. Preserve data whenever possible.

---

# 54. Database Constraints

Do not rely exclusively on frontend validation.

Use PostgreSQL for:

* NOT NULL
* CHECK
* UNIQUE
* FOREIGN KEY
* Referential integrity
* Valid states

Frontend validation and database constraints should complement each other.

---

# 55. Indexes

Create indexes based on actual query patterns.

Common fields:

```text
persons.status
persons.zone_id
persons.created_at
persons.updated_at

pets.status
pets.zone_id

reports.status
reports.report_type
reports.created_at

person_events.person_id
person_events.event_at
```

Also index fields used by RLS policies where appropriate.

Supabase's production guidance recommends reviewing indexes and query performance before production.

---

# 56. Realtime

Realtime is a future feature.

Do not implement it everywhere prematurely.

Potential future use cases:

```text
New report
Status change
Person found
Location update
Administrative review
```

Implement Realtime only when the underlying data model and RLS policies are stable.

---

# 57. Offline / PWA

Future architecture may include:

```text
PWA
IndexedDB
Offline queue
Synchronization
Conflict resolution
```

Do not implement offline synchronization prematurely.

When implemented, define conflict rules before writing synchronization code.

---

# 58. Security Principles

Always follow:

```text
Least privilege
Defense in depth
Secure defaults
Explicit authorization
Minimal data exposure
```

Security must exist at:

```text
Frontend
    +
Supabase Auth
    +
PostgreSQL
    +
RLS
    +
Storage policies
```

Supabase's security guidance emphasizes using RLS, appropriate grants, and secure configuration for the Data API.

---

# 59. Performance

Avoid:

```text
N+1 queries
Unlimited selects
Large client-side filtering
Unnecessary refetches
Huge React components
Huge images
```

Prefer:

```text
Pagination
Indexes
Server-side filtering
Caching
Lazy loading
Optimized images
Selective queries
```

---

# 60. Image Performance

Emergency users may have slow connections.

Images should eventually support:

* Compression
* Appropriate dimensions
* Lazy loading
* Thumbnails
* Responsive images

Do not load original high-resolution images into every list.

---

# 61. Environment Management

Use:

```text
.env.local
```

for local development.

Use:

```text
.env.example
```

for documentation.

Never commit real credentials.

Vercel environment variables should be configured separately.

---

# 62. Git Rules

Use feature branches.

Example:

```bash
git checkout -b feature/supabase-persons
```

Commit convention:

```text
feat: add persons service
fix: correct person search
refactor: simplify report service
docs: update supabase setup
test: add person service tests
chore: update dependencies
```

Avoid:

```text
update
changes
stuff
final
final2
test
```

---

# 63. Pull Requests

Before opening a PR:

```bash
npm run build
```

If available:

```bash
npm run lint
npm test
```

Review:

* Security
* Types
* Error handling
* UI
* Responsive behavior
* Accessibility
* Database compatibility

---

# 64. Testing

Important areas to test:

### Unit

* Validation
* Utility functions
* Data transformations
* Search filters

### Integration

* Services
* Hooks
* Forms
* Supabase queries

### Database

* Constraints
* RLS
* Permissions
* Relationships

Supabase supports database testing approaches such as pgTAP for testing database structure, constraints, functions and RLS policies.

---

# 65. Build Validation

After significant changes run:

```bash
npm run build
```

If available:

```bash
npm run lint
npm test
```

Never hide errors by changing configuration just to make the build pass.

---

# 66. Dependency Management

Before installing a dependency:

1. Check whether the project already has an equivalent.
2. Check whether the functionality can be implemented without it.
3. Prefer established packages.
4. Avoid unnecessary dependencies.
5. Check compatibility with the existing stack.

Do not install large libraries for trivial functionality.

---

# 67. React Rules

Prefer functional components.

Use hooks appropriately.

Avoid:

* Unnecessary `useEffect`
* Derived state stored unnecessarily
* Prop drilling when a local hook solves the problem
* Global state for server data
* Duplicate fetching

Server state belongs primarily in TanStack Query.

UI state can remain local when appropriate.

---

# 68. useEffect

Do not use `useEffect` as a general-purpose data fetching mechanism when TanStack Query can manage the request.

Prefer:

```text
TanStack Query
```

for server state.

Use `useEffect` for actual side effects such as:

* Browser APIs
* Event listeners
* External integrations
* Synchronization with non-React systems

---

# 69. Accessibility

Every interactive element must be keyboard accessible.

Avoid:

```text
<div onClick={...}>
```

when a semantic:

```text
<button>
```

is appropriate.

Forms require labels.

Images require meaningful alt text.

---

# 70. Error Boundaries

The application should eventually have error boundaries for major UI sections.

Do not allow a single unexpected component error to destroy the entire application experience.

---

# 71. Logging

Do not log sensitive data.

Never log:

```text
Identification numbers
Phone numbers
Private emails
Authentication tokens
Passwords
Service role keys
Private storage URLs
```

Logs should contain enough information for debugging without exposing personal data.

---

# 72. Data Privacy

The project handles potentially sensitive information.

Always apply data minimization.

Ask:

> Does this piece of data need to be collected?

If not, do not collect it.

Ask:

> Does this piece of data need to be public?

If not, keep it private.

---

# 73. Business Rules

Do not invent business rules silently.

If a requirement is ambiguous:

1. Inspect existing implementation.
2. Check project documentation.
3. Identify the ambiguity.
4. Make the smallest reasonable assumption.
5. Document the assumption.

Do not redesign business logic without approval.

---

# 74. Changes to Existing Code

Before modifying a file:

1. Read the existing implementation.
2. Understand dependencies.
3. Search for usages.
4. Check types.
5. Make the smallest necessary change.

Do not rewrite files simply because another implementation looks cleaner.

---

# 75. Avoid Duplicate Logic

Before creating:

```text
new utility
new hook
new service
new type
```

search the project first.

If equivalent functionality exists, reuse or refactor it.

---

# 76. No Fake Integrations

Never create fake:

```text
Supabase responses
Auth sessions
Storage URLs
Database IDs
Realtime events
```

and present them as real.

If Supabase is unavailable:

* Clearly indicate the mock.
* Keep it isolated.
* Do not mix mock and production logic invisibly.

---

# 77. Development Phases

The current integration roadmap is:

## Phase 1 — Foundation

* Supabase client
* Environment variables
* Types
* Services structure

## Phase 2 — Reference Data

* Emergency zones
* Locations
* Facilities

## Phase 3 — Persons

* Person service
* Person hooks
* Search
* Filters
* Detail page

## Phase 4 — Pets

* Pet service
* Pet hooks
* Search
* Filters

## Phase 5 — Reports

* Report creation
* Report review
* Report status

## Phase 6 — Events

* Person history
* Transfers
* Location updates

## Phase 7 — Storage

* Images
* Uploads
* Access policies
* Signed URLs where required

## Phase 8 — Authentication

* Sign up
* Sign in
* Sign out
* Profiles

## Phase 9 — Security

* RLS
* Roles
* Policies
* Storage policies

## Phase 10 — Admin

* Moderation
* Verification
* Report management

## Phase 11 — Map

* Markers
* Filters
* Facilities
* Clustering

## Phase 12 — Realtime

* New reports
* Status changes
* Updates

## Phase 13 — Offline

* PWA
* IndexedDB
* Synchronization
* Conflict resolution

---

# 78. Current Priority

The immediate priority is:

```text
React
 ↓
Supabase
 ↓
PostgreSQL
```

Do NOT prioritize:

* AI
* Duplicate detection
* Notifications
* Offline synchronization
* Realtime
* Advanced analytics

until the basic data architecture is stable.

---

# 79. Current Integration Order

The recommended implementation order is:

```text
1. Supabase client
2. Types
3. Emergency zones
4. Locations
5. Facilities
6. Persons
7. Pets
8. Reports
9. Person events
10. Storage
11. Auth
12. RLS
13. Admin
14. Map
15. Realtime
16. Offline
```

Security policies must be implemented before exposing sensitive functionality publicly.

---

# 80. Definition of Done

A feature is NOT considered complete merely because it renders.

A feature is complete when:

* UI works
* Types are correct
* Validation exists
* Service exists
* Hook exists where appropriate
* Loading state exists
* Error state exists
* Empty state exists
* Responsive behavior works
* Accessibility is considered
* Database constraints are respected
* RLS implications are considered
* No secrets are exposed
* Build passes
* Tests pass when available
* Documentation is updated when necessary

---

# 81. Cursor / AI Agent Rules

When an AI coding agent modifies this repository:

### ALWAYS

1. Inspect the existing code first.
2. Search before creating files.
3. Reuse existing abstractions.
4. Follow this architecture.
5. Preserve existing functionality.
6. Use TypeScript.
7. Handle errors.
8. Protect private information.
9. Run validation after changes.
10. Explain important architectural changes.

### NEVER

1. Rewrite the entire project unnecessarily.
2. Delete working features.
3. Add a second architecture.
4. Put Supabase calls inside UI components.
5. Expose service-role keys.
6. Hardcode production credentials.
7. Add real personal data.
8. Bypass RLS.
9. Use `any` without justification.
10. Perform destructive database operations without approval.

---

# 82. Before Implementing a Feature

The AI agent should first determine:

```text
What feature is being changed?

Which domain owns it?

Which table is involved?

Which service should handle it?

Which hook should expose it?

Which component consumes it?

What validation is required?

What privacy implications exist?

What RLS implications exist?

What tests are required?
```

Then implement.

---

# 83. Required Architecture Pattern

For database-backed features:

```text
Component
    ↓
Hook
    ↓
Service
    ↓
Supabase Client
    ↓
PostgreSQL
```

For forms:

```text
Form
    ↓
React Hook Form
    ↓
Zod
    ↓
Mutation Hook
    ↓
Service
    ↓
Supabase
```

For authentication:

```text
UI
    ↓
Auth Hook / Provider
    ↓
Supabase Auth
```

For files:

```text
UI
    ↓
Media Hook
    ↓
Media Service
    ├── Supabase Storage
    └── report_media
```

---

# 84. Final Principle

This project is not just another CRUD application.

It may be used during emergency situations involving vulnerable people.

Therefore:

```text
Correctness > Speed
Privacy > Convenience
Clarity > Complexity
Reliability > Features
Security > Shortcuts
Traceability > Destructive Updates
```

Every technical decision should consider the consequences of incorrect or leaked information.

The objective is to build a system that is:

```text
Reliable
Secure
Accessible
Scalable
Maintainable
Mobile-first
Privacy-conscious
Community-oriented
```

while keeping the architecture simple enough for the project to evolve safely.

# END OF AGENTS.md
