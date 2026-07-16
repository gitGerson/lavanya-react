# Product Requirements Document: Lavanya Wedding Planner Revamp

## 1. Document Information

- Product: Lavanya Wedding Planner
- Target platform: Next.js web application
- Target framework: Next.js App Router with TypeScript
- Status: Proposed
- Primary market: Indonesian wedding customers
- Design direction: Preserve the existing Lavanya visual identity and improve usability, reliability, and maintainability

## 2. Product Summary

Lavanya Wedding Planner is a guided wedding-package configurator. Customers enter their wedding details, select a venue type, venue, catering provider, optional or mandatory vendors, and eligible discounts. The application then submits the configuration and redirects the customer to a recap page.

The current React/Vite prototype validates the core flow, but its API logic, navigation, state, validation, and presentation are concentrated in one component. The revamp will rebuild the experience with Next.js while retaining the existing amber-and-white wedding design, photographic cards, background artwork, and step-by-step interaction.

## 3. Problem Statement

The current product has several risks:

- Swipe navigation can bypass required-field validation.
- Failed API requests can leave loading states active indefinitely.
- Changing an earlier answer can leave incompatible venue, catering, vendor, or discount selections in the form.
- Mandatory vendors are not enforced.
- Submission can be triggered more than once.
- Dynamic vendor steps are calculated using fragile numeric offsets.
- The interface mixes Indonesian and English.
- The user cannot review a complete package and estimated price before submission.
- The single large component is difficult to test, maintain, and extend.
- API, CSRF, and redirect behavior are not clearly defined for separate frontend and Laravel backend deployments.

## 4. Goals

### 4.1 Product Goals

- Provide a clear, trustworthy wedding-planning flow on mobile and desktop.
- Preserve the recognizable Lavanya design while improving visual consistency.
- Prevent invalid or incompatible package combinations.
- Give customers a clear package and estimated-price summary before submission.
- Handle loading, empty, and error conditions without trapping the customer.
- Support dynamic vendor categories returned by the Laravel API.

### 4.2 Engineering Goals

- Migrate the frontend from React/Vite to Next.js App Router and TypeScript.
- Separate domain state, API access, step configuration, and presentation.
- Use Next.js server capabilities where they improve security or integration.
- Create reusable components for steps, selection cards, dialogs, navigation, and feedback states.
- Add automated coverage for navigation and business-critical validation.
- Establish a production-ready lint, build, environment, and deployment workflow.

## 5. Non-Goals

- Redesigning the Lavanya brand.
- Building a Laravel administration portal.
- Replacing the Laravel backend or its database.
- Adding online payment in the first release.
- Adding customer accounts, authentication, or saved drafts in the first release.
- Introducing a Repository pattern in the frontend when a typed API service is sufficient.

## 6. Target Users

### Primary User

A prospective bride, groom, or family member planning a wedding and comparing available package components.

### User Needs

- Complete the flow without technical knowledge.
- Understand what information is required.
- Compare available options visually.
- See pricing and package implications.
- Return to earlier steps safely.
- Understand why an option is unavailable or an action fails.
- Review the final configuration before creating the recap.

## 7. User Journey

1. The customer opens the Lavanya landing screen.
2. The customer starts planning.
3. The customer enters names, guest count, wedding date, WhatsApp number, and an optional referral code.
4. The customer selects a venue type.
5. The system retrieves compatible venues.
6. The customer selects a venue and can inspect its details and portfolio.
7. The system retrieves compatible catering providers.
8. The customer selects catering and can inspect its details and portfolio.
9. The system retrieves vendor categories and compatible vendors.
10. The customer completes one step per available vendor category.
11. The system enforces mandatory vendors and allows optional vendors to be skipped.
12. The system retrieves eligible discounts.
13. The customer selects eligible discounts.
14. The customer reviews the complete configuration and estimated price.
15. The customer confirms submission.
16. The system creates the wedding plan once and redirects to the recap page.

## 8. Functional Requirements

### FR-01: Landing Screen

- Display the existing Lavanya logo and wedding background.
- Provide one clear primary action: `Mulai Merencanakan`.
- Keep the amber primary-action styling.
- The logo must scale safely on small screens.

### FR-02: Customer Information

- Collect groom's full name.
- Collect bride's full name.
- Collect guest count as a positive integer.
- Collect a wedding date that is not in the past.
- Collect an Indonesian WhatsApp-compatible phone number.
- Accept an optional referral code.
- Show inline validation messages in Indonesian.
- Prevent forward navigation while required values are invalid.

### FR-03: Venue Type

- Retrieve venue types from the backend.
- Display each type as a photographic selection card.
- Provide a visible selected state using the existing amber accent plus a checkmark.
- Reset dependent selections when the venue type changes.

### FR-04: Venue Selection

- Retrieve venues using venue type, guest count, and referral code.
- Display name, image, and formatted starting price where available.
- Provide details in an accessible modal.
- Open portfolio links safely in a new tab.
- Provide loading skeletons, an empty state, an error state, and retry.
- Reset catering, vendors, and discounts when the venue changes.

### FR-05: Catering Selection

- Retrieve catering providers compatible with the selected venue.
- Display relevant catering prices using Indonesian rupiah formatting.
- Provide an accessible details modal and portfolio link.
- Provide loading, empty, error, and retry states.
- Reset vendors and discounts when catering changes.

### FR-06: Vendor Selection

- Retrieve vendor categories and vendor options after venue and catering selection.
- Generate vendor steps from stable category IDs rather than numeric offsets.
- Hide categories that have no compatible vendors.
- Clearly identify mandatory categories or vendors.
- Prevent mandatory selections from being skipped or removed.
- Allow optional categories to be skipped.
- Preserve selections when navigating backward unless a parent selection changes.

### FR-07: Discounts

- Retrieve discounts based on venue, catering, and selected vendor IDs.
- Display discount name, description, and value.
- Support percentage and fixed-amount discounts.
- Prevent incompatible discounts from being selected together when indicated by the API.
- Recalculate the displayed estimate when discount selections change.

### FR-08: Confirmation and Recap

- Add a confirmation step before submission.
- Display customer information, event date, guest count, venue, catering, vendors, discounts, and estimated total.
- Allow the customer to return to the relevant step to edit a selection.
- Clearly state when the price is an estimate.
- Submit only after explicit confirmation.

### FR-09: Submission

- Disable the submit button while a request is active.
- Prevent duplicate submissions.
- Validate the complete configuration before submission.
- Handle validation, authorization, rate-limit, network, and server errors.
- Redirect only to a validated recap path returned by the backend.
- Show a recovery action if submission fails.

### FR-10: Navigation

- Show the current stage and overall progress.
- Provide consistent Back and Next controls in a sticky card footer.
- Do not allow swipe gestures to bypass validation.
- If swipe navigation is retained, allow only valid transitions and disable dragging from interactive controls.
- Handle browser refresh without producing a broken step. Persisting drafts is optional for the first release; returning safely to the first valid step is required.

## 9. Design Requirements

### 9.1 Preserved Design Language

- Amber remains the primary accent for buttons and selected states.
- White elevated cards remain the main content surfaces.
- Existing wedding photography and background artwork remain in use.
- Transitions remain soft and horizontal where motion is appropriate.
- The experience remains elegant, warm, and simple rather than dashboard-like.

### 9.2 Design Improvements

- Use a reusable wizard shell with a maximum desktop width near 960px.
- Add a compact progress header.
- Add selected-state icons instead of relying on color alone.
- Use skeleton cards during loading.
- Use inline banners or toast notifications instead of browser alerts.
- Provide a persistent or collapsible estimated-price summary.
- Use Cinzel selectively for brand headings and a readable sans-serif font for forms.
- Standardize all customer-facing text in Bahasa Indonesia.
- Keep primary actions visually consistent across every step.

### 9.3 Responsive Behavior

- Mobile: one-column cards, full-width controls, safe image sizing, and sticky navigation.
- Tablet: two-column option grids where space permits.
- Desktop: up to three option columns with a wider wizard card.
- No horizontal page overflow at 320px viewport width.

## 10. Accessibility Requirements

- Meet WCAG 2.1 AA for core interactions.
- All fields must have persistent labels.
- Selection cards must be keyboard accessible and use button or radio semantics.
- Selected state must not rely on color alone.
- Dialogs must trap focus, have accessible titles, and close by keyboard.
- Validation and request errors must be announced appropriately.
- Focus must move to the step heading after navigation.
- Respect `prefers-reduced-motion`.
- Maintain visible focus indicators.

## 11. Next.js Technical Architecture

### 11.1 Framework

- Next.js App Router
- TypeScript with strict mode
- React Server Components by default
- Client Components only for interactive wizard state and browser-specific behavior
- Tailwind CSS for the existing design system
- Radix UI or the existing shadcn-style primitives for accessible dialogs and controls

### 11.2 Proposed Routes

```text
app/
├── layout.tsx
├── page.tsx
├── planning/
│   └── page.tsx
├── recap/
│   └── [recapLink]/page.tsx
└── api/
    └── wedding/
        └── route.ts        # optional backend-for-frontend proxy
```

- `/` contains the landing experience.
- `/planning` contains the interactive wizard.
- `/recap/[recapLink]` renders or proxies the Laravel recap result when the frontend owns the recap UI.
- A Next.js Route Handler may proxy Laravel requests when same-origin cookies, secret server configuration, response normalization, or CSRF handling requires it.

### 11.3 Proposed Feature Structure

```text
src/
├── app/
├── components/ui/
└── features/wedding-planner/
    ├── api/
    │   ├── wedding-api.ts
    │   └── schemas.ts
    ├── components/
    │   ├── wizard-shell.tsx
    │   ├── progress-header.tsx
    │   ├── navigation-footer.tsx
    │   ├── selection-card.tsx
    │   ├── price-summary.tsx
    │   └── request-state.tsx
    ├── steps/
    │   ├── customer-step.tsx
    │   ├── venue-type-step.tsx
    │   ├── venue-step.tsx
    │   ├── catering-step.tsx
    │   ├── vendor-step.tsx
    │   ├── discount-step.tsx
    │   └── confirmation-step.tsx
    ├── hooks/
    │   └── use-wedding-wizard.ts
    ├── reducer.ts
    ├── step-config.ts
    ├── types.ts
    └── validation.ts
```

### 11.4 State Management

- Use a reducer for wizard state and explicit transition actions.
- Keep server data separate from customer selections.
- Use stable step keys such as `customer`, `venue-type`, `venue`, `catering`, `vendor:{categoryId}`, `discounts`, and `confirmation`.
- Centralize dependent reset rules in the reducer.
- Avoid storing derived totals or step counts when they can be computed.
- A dedicated state library is not required initially.

### 11.5 API Integration

- Create a typed Service Layer around the Laravel API.
- Validate external API responses at the application boundary, preferably with a schema validator.
- Check `response.ok` before parsing success payloads.
- Normalize Laravel validation errors for the UI.
- Use `AbortController` to cancel obsolete requests.
- Keep secrets and server-only API origins in non-public environment variables.
- Expose only browser-safe configuration with the `NEXT_PUBLIC_` prefix.
- Choose one documented authentication model:
  - same-origin Laravel session/Sanctum with credentials and CSRF cookie; or
  - Next.js Route Handler acting as a backend-for-frontend.

### 11.6 Rendering Strategy

- Render static brand layout and metadata on the server.
- Keep the main planning wizard as a focused Client Component.
- Fetch stable initial data such as venue types on the server where practical.
- Fetch selection-dependent data after the relevant customer choice.
- Do not expose server secrets in Client Components.
- Use `next/image` for local and approved remote images.

## 12. Laravel API Contract Requirements

The existing Laravel backend remains the source of truth. The frontend expects typed endpoints for:

- `GET /venue-types`
- `GET /venues`
- `GET /caterings`
- `GET /vendor-categories`
- `GET /vendors`
- `GET /discounts`
- `POST /wedding`

The API should:

- Return consistent success and error envelopes.
- Return appropriate HTTP status codes.
- Validate all selections again on submission.
- Never trust frontend prices or discount calculations.
- Calculate authoritative totals on the backend.
- Enforce mandatory vendors and discount compatibility.
- Use Laravel Form Requests for scenario-specific validation.
- Reuse model validation rules only when those rules are shared across multiple flows.
- Use API Resources for stable response shapes.
- Use Policies or Gates if recap or wedding records require authorization.
- Use a database transaction when creating multiple related booking records.
- Consider an idempotency key to prevent duplicate wedding creation.

The API currently uses `portofolio_link`. Migrate toward `portfolio_link` through a backward-compatible API Resource mapping if existing clients depend on the old field.

## 13. Validation Rules

Frontend validation improves usability but does not replace Laravel validation.

Minimum client-side rules:

- Groom and bride names: required, trimmed, reasonable maximum length.
- Guest count: required positive integer within backend capacity limits.
- Wedding date: required and not in the past.
- Phone number: required and normalized before submission.
- Venue type: required.
- Venue: required and compatible with customer inputs.
- Catering: required and compatible with the venue.
- Mandatory vendors: required.
- Discounts: optional and mutually compatible.

## 14. Error and Empty States

Every data-driven step must support:

- Initial loading
- Successful result
- Empty result
- Recoverable request failure with retry
- Expired or invalid parent selection
- Submission validation failure
- Unexpected server failure

The application must never display an indefinite loading state after a request completes or fails.

## 15. Performance Requirements

- Optimize wedding images with `next/image`.
- Convert oversized PNG/JPEG assets to WebP or AVIF where visually acceptable.
- Lazy-load option images outside the initial viewport.
- Avoid fetching vendor categories repeatedly when parent selections have not changed.
- Cancel stale requests when a customer changes a parent selection quickly.
- Avoid bundling unused Vite starter assets or components.
- Target a good Core Web Vitals experience on mid-range mobile devices.

## 16. Security Requirements

- Keep private API URLs and credentials server-side.
- Do not trust submitted prices, discount values, mandatory flags, or compatibility fields.
- Sanitize or safely render backend descriptions.
- Validate external portfolio URLs before rendering links.
- Apply rate limiting to wedding creation in Laravel.
- Avoid exposing detailed backend exceptions to customers.
- Use secure cookie and CSRF settings when session authentication is used.
- Validate recap identifiers and access rules on the server.

## 17. Analytics

Track privacy-conscious product events:

- Planner started
- Step viewed
- Step completed
- Empty result encountered
- API retry selected
- Option selected or changed
- Confirmation viewed
- Submission attempted
- Submission succeeded
- Submission failed by error category

Do not send names, phone numbers, referral codes, or other personal data in analytics payloads.

## 18. Testing Requirements

### Unit Tests

- Wizard reducer transitions
- Dependent selection resets
- Dynamic step generation
- Mandatory vendor rules
- Price and discount formatting
- Validation helpers

### Component Tests

- Keyboard-accessible selection cards
- Customer validation messages
- Loading, empty, error, and retry states
- Navigation button enablement
- Submission button duplicate-click protection

### End-to-End Tests

- Complete happy path
- Backward navigation with preserved selections
- Parent selection change resets dependent state
- Mandatory vendor cannot be skipped
- API failure and retry
- Empty venue or catering results
- Discount selection and estimate update
- Duplicate submission prevention
- Successful redirect to recap
- Mobile viewport flow

## 19. Acceptance Criteria

The revamp is ready for release when:

- The complete planning journey runs in Next.js App Router.
- The existing amber, white-card, photographic design is recognizably preserved.
- All customer-facing copy is consistently Indonesian.
- Invalid forward navigation is impossible through buttons, keyboard, or gestures.
- Changing parent selections reliably clears incompatible child selections.
- Mandatory vendors are enforced in both Next.js and Laravel.
- Every API-driven screen has loading, empty, error, and retry behavior.
- A complete confirmation and estimated-price summary appears before submission.
- Duplicate submission is prevented.
- Backend totals remain authoritative.
- The application passes lint, type checking, production build, and critical automated tests.
- Core interactions meet the accessibility requirements.
- The layout works without horizontal overflow from 320px mobile through desktop sizes.

## 20. Delivery Plan

### Phase 1: Foundation

- Create the Next.js App Router project.
- Configure TypeScript, Tailwind CSS, linting, fonts, images, and environment variables.
- Port reusable UI primitives and the preserved visual theme.
- Define API schemas and the Service Layer.

### Phase 2: Core Wizard

- Implement the reducer and stable step configuration.
- Implement customer, venue type, venue, and catering steps.
- Add dependent reset behavior and request states.

### Phase 3: Package Completion

- Implement dynamic vendor steps.
- Enforce mandatory vendors.
- Implement discounts and estimated pricing.
- Add the confirmation step.

### Phase 4: Submission and Recap

- Finalize Laravel integration, CSRF/authentication strategy, and authoritative validation.
- Add duplicate-submission protection.
- Implement or integrate the recap route.

### Phase 5: Quality and Release

- Add automated tests.
- Complete responsive and accessibility QA.
- Optimize assets and performance.
- Validate analytics and production error monitoring.
- Run lint, type check, production build, and end-to-end smoke tests.

## 21. Migration Notes

- Build the Next.js version alongside the current Vite app until the primary flow reaches parity.
- Do not copy the existing monolithic component directly into a Next.js page.
- Reuse brand assets and UI primitives selectively.
- Do not copy generated `dist` assets into the Next.js source tree.
- Replace Vite environment variables with documented Next.js public or server-only variables.
- Confirm whether Laravel or Next.js owns the recap page before implementing redirects.
- Confirm the production origin and authentication model before finalizing the API transport.

## 22. Open Decisions

- Will Next.js and Laravel be served from the same origin?
- Will the recap page remain Laravel-rendered or move to Next.js?
- Does the backend already calculate a complete authoritative estimate?
- Can multiple discounts be combined, and what is their application order?
- Are vendor choices single-select or multi-select within each category?
- Does a mandatory category require exactly one vendor or at least one vendor?
- Should incomplete planning state survive refresh or browser closure?
- Should users be able to share an unfinished configuration?

