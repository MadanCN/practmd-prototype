# Global Masters

Global Masters is the platform-wide administration hub in PractMD. It centralizes every piece of organization-level configuration — lookup lists (room types, genders, insurers…), behavior settings (no-show windows, reschedule policies…), and integration/agent configuration (telehealth, AI scheduling agent…) — behind a single, consistently structured section of the app.

Route root: `/global-masters`

## 1. Structure at a glance

```
app/app/global-masters/
  layout.tsx                 Shell: sidebar nav + content area
  page.tsx                   Overview grid (the "/global-masters" landing page)
  <section>/[.../]page.tsx   One page per leaf setting, e.g. organization/room-types/page.tsx

app/components/global-masters/
  GmNav.tsx                  Left sidebar navigation (search + collapsible sections)
  screens/*.tsx              The actual screen implementation for each leaf page

app/data/gm-nav.ts           Single source of truth for the nav tree (sections → groups → leaves)
```

Every route page under `app/app/global-masters/**/page.tsx` is a thin wrapper that renders one component from `app/components/global-masters/screens/`. This keeps routing trivial and puts all real UI logic in the `screens/` components.

Example (`app/app/global-masters/organization/room-types/page.tsx`):

```tsx
import RoomTypesScreen from "@/components/global-masters/screens/RoomTypes";

export default function RoomTypesPage() {
  return <RoomTypesScreen />;
}
```

## 2. Layout ([layout.tsx](../app/app/global-masters/layout.tsx))

`GlobalMastersLayout` wraps every page under `/global-masters` in the app chrome (`AppLayout`) plus a persistent left sidebar (`GmNav`). It cancels the parent content padding (`-m-6`) and re-applies its own, so the sidebar can run full-height flush against the app shell while the content pane scrolls independently.

## 3. Navigation data model ([data/gm-nav.ts](../app/data/gm-nav.ts))

The entire nav tree — what sections exist, what they contain, their order, icon, and description — is declared once in `GM_SECTIONS` and consumed by both the overview page and the sidebar. There is no other source of truth; adding a setting means adding an entry here.

Types:

- **`GmSection`** — a top-level numbered section (e.g. "Organization", "Scheduling"). Has `id`, `number`, `label`, `icon` (a `lucide-react` icon component), `description`, `href`, and `children`.
- **`GmGroup`** (`kind: "group"`) — an optional sub-heading inside a section that clusters related leaves (e.g. "Demographics" inside Patient Management). Purely a display grouping; it does not add a route.
- **`GmLeaf`** (`kind: "leaf"`) — an actual navigable setting page, with a `label` and `href`.

A section's `children` array can mix bare leaves and groups directly, e.g. Organization has two groups (`Resources`, `Locations`) followed by a standalone `Holidays` leaf.

```ts
export const GM_SECTIONS: GmSection[] = [
  {
    id: "organization",
    number: 1,
    label: "Organization",
    icon: Building2,
    description: "Rooms, equipment, locations, holidays, and org settings",
    href: `${base}/organization`,
    children: [
      group("resources", "Resources", [ leaf("Room Types", ...), leaf("Equipment Types", ...) ]),
      group("locations", "Locations", [ leaf("Country", ...), leaf("State", ...), leaf("City", ...) ]),
      leaf("Holidays", `${base}/organization/holidays`),
    ],
  },
  // ...
];
```

## 4. The nine sections

| # | Section | Contains |
|---|---------|----------|
| 1 | **Organization** | Room Types, Equipment Types; Locations (Country/State/City); Holidays |
| 2 | **Users & Access** | Roles (Administrative, Staff, Provider Permissions); Providers (Provider Types, Specializations) |
| 3 | **Clinical** | Services, Visit Types, Form Preferences, Document Types, Referral Source |
| 4 | **Scheduling** | Cancellation & Reschedule reasons; Appointment Settings group (No Show, Reschedule, Cancellation, Waitlist, Preferences); Provider Schedule Rules; Self Scheduling; Web Embeds; Appointment Agent |
| 5 | **Patient Communication** | SMS, Email, Voice, Phone Calls, Message Templates |
| 6 | **Patient Management** | Demographics (Gender, Pronoun, Marital Status, Relationship, Contact Methods); Patient Classification (Type, Stage); Registration; Recall Management (Types, Status, Preference) |
| 7 | **Billing & Coding** | Insurers, Procedure Codes |
| 8 | **Tasks** | Escalations |
| 9 | **PractMD Connect** | Telehealth Provisions, Telehealth Settings, Google Calendar, AI Agent |

The overview page numbers sections by this same `number` field and colors each card by its index into a fixed 9-color palette (`SECTION_COLORS` in `page.tsx`), cycling if more sections are added.

## 5. Overview page ([page.tsx](../app/app/global-masters/page.tsx))

`GlobalMastersOverview` renders `GM_SECTIONS` as a responsive card grid (1/2/3 columns). Per card it derives, rather than stores:

- **Leaf count** (`countLeaves`) — flattens groups and bare leaves to a single count, shown as "N settings".
- **First href** (`getFirstHref`) — the card links to the first leaf inside the section (drilling into the first group if the first child is a group), so clicking a card always lands on a real settings page rather than a dead section route.
- **Preview chips** — the first 4 children's labels (group or leaf), with a "+N more" chip if there are more.

## 6. Sidebar navigation ([GmNav.tsx](../app/components/global-masters/GmNav.tsx))

`GmNav` renders the same `GM_SECTIONS` tree as a collapsible, searchable sidebar:

- **Active-section detection** (`sectionContainsPath`) flattens every leaf under a section and checks if the current `pathname` starts with any of them; the matching section auto-expands and is highlighted.
- **Search** filters leaves (and prunes empty groups/sections) by label substring match; while a query is active, matching sections are force-expanded regardless of their manual open/closed state.
- **Leaf active state** matches on exact path or path-prefix, so nested routes under a leaf still highlight correctly.

## 7. Screen patterns

Every `screens/*.tsx` component follows one of two shapes. Knowing which one you're building/editing tells you what building blocks to reach for.

### A. Master-data list (CRUD table + drawer)

Used for lookup/reference data: Room Types, Genders, Insurers, Procedure Codes, Recall Types, etc. Reference implementation: [RoomTypes.tsx](../app/components/global-masters/screens/RoomTypes.tsx).

Shape:
1. In-memory `SEED` array of typed records + `useState` holding the working list (all data is local/mock — no API calls yet).
2. Toolbar with a search input filtering the list client-side, plus an "Add" button.
3. A table listing records with row-hover actions: edit (opens drawer), toggle active/inactive, delete (opens an inline confirm modal).
4. A right-side [`Drawer`](../app/components/ui/Drawer.tsx) (shared component, Esc-to-close, backdrop click, locks body scroll) hosting the add/edit form, with a `footer` slot for Cancel/Save actions.
5. Simple field-level `validate()` before save; errors surface inline under each field.
6. Active/inactive uses the shared [`Toggle`](../app/components/ui/Toggle.tsx) component and a `StatusBadge`-style pill in the table.

### B. Configuration / settings form

Used for behavior toggles and policy configuration: Appointment Settings, No-Show Setting, Telehealth Settings, Appointment Agent, AI Agent, etc. Reference implementations: [AppointmentSettings.tsx](../app/components/global-masters/screens/AppointmentSettings.tsx), [AppointmentAgent.tsx](../app/components/global-masters/screens/AppointmentAgent.tsx).

Shape:
1. A single `settings` object in `useState` (or several primitive `useState`s) representing current configuration — no list, no drawer.
2. Content grouped into labeled cards/panels (e.g. "Check-In Settings"), each row pairing a label+description on the left with a control (stepper, `Toggle`, select, textarea) on the right.
3. A page-level "Save" action that sets a transient `saved` flag (auto-clears via `setTimeout`), rather than per-row persistence.

When adding a new leaf page, match whichever pattern fits the data: a repeatable list of named records → pattern A; a fixed set of behavior knobs → pattern B.

## 8. Adding a new Global Master setting

1. Add a `leaf(...)` (or a new `group(...)`) entry to the relevant section's `children` in [`data/gm-nav.ts`](../app/data/gm-nav.ts) — this alone makes it appear in both the sidebar and, if it's within the first 4 children, the overview card preview.
2. Create the screen component in `app/components/global-masters/screens/YourScreen.tsx`, following pattern A or B above.
3. Create the route file at `app/app/global-masters/<section>/<...>/page.tsx` that imports and renders it (mirror the existing thin-wrapper style).
4. No changes are needed to `GmNav.tsx` or `page.tsx` — both are fully data-driven off `GM_SECTIONS`.

## 9. Known inconsistencies

A handful of screen components and route pages exist but are **not** wired into `GM_SECTIONS`, so they're unreachable from both the sidebar and the overview grid:

- `organization/business-hours`, `organization/timezone`
- `scheduling/scheduling-rules`, `scheduling/provider-rules`, `scheduling/appointment-masters`

These appear to be superseded by other entries (e.g. `Timezone` is now referenced from clinic management instead) or left over from restructuring. Treat them as dead routes rather than hidden features — confirm with the section owner before building on top of them, and consider removing them or wiring them in if they're still needed.
