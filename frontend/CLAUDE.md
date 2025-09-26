# MonSTAR Frontend AI Engineering Guide (Monash University Students)
This project is a frontend Angular SPA that powers MonSTAR, the student-built platform for browsing, reviewing, and analysing Monash University units.

##  Core Principles
**IMPORTANT: You MUST follow these principles in all code changes and PR generations:**

### KISS (Keep It Simple, Stupid)
- Prefer straightforward solutions over complex ones
- Simpler code is easier to read, test, and maintain

### YAGNI (You Aren't Gonna Need It)
- Only implement functionality when the product already needs it
- Avoid speculative features or premature abstractions

### Open/Closed Principle
- Open for extension, closed for modification
- Extend features via new components/services instead of rewriting stable logic

---

## MCP servers available to you
- `chrome-devtools`: This will allow you to test your changes.

---

##  Development Setup
```bash
# Clone repository
git clone <repo-url>
cd monstar/frontend

# Install dependencies
npm install

# Start dev server
npm run start

# Run unit tests
npm run test

# Build production bundle
npm run build
```

To proxy API traffic to the local backend, the dev server already uses src/proxy.conf.json (http://localhost:8080).

---

##  Essential npm Commands
```bash
npm install                # Install dependencies
npm install <pkg>          # Add a dependency
npm install -D <pkg>       # Add a dev dependency
npm uninstall <pkg>        # Remove a package
npm update                 # Update dependencies
npm run <script>           # Run package.json script
```

---

### 🔧 Essential Angular CLI Commands
```bash
# Components
ng g c routes/unit-overview --standalone

# Services
ng g s shared/services/api

# Pipes
ng g p shared/pipes/truncate

# Directives
ng g d shared/directives/<name>

# Classes & Interfaces
ng g cl shared/models/MyClass
ng g i shared/models/MyInterface

# Guards
ng g g auth/auth-guard

# Enums
ng g e shared/models/MyEnum

# Resolvers
ng g r routes/<name>/<name>

# Environments
ng g environments
```

---

## Current Project Structure:
This project uses Angular 18 with standalone components.
```
frontend/
+-- angular.json
+-- package.json
+-- README.md
+-- tsconfig.json
+-- tsconfig.app.json
+-- tsconfig.spec.json
+-- public/
    +-- emotes/
    +-- robots.txt
    +-- sitemap-*.xml
    +-- llms.txt
+-- src/
    +-- index.html
    +-- main.ts
    +-- styles.scss
    +-- proxy.conf.json
    +-- types/
        +-- canvas-confetti.d.ts
    +-- app/
        +-- app.component.*
        +-- app.config.ts
        +-- app.routes.ts
        +-- _variables.scss
        +-- routes/
            +-- home/
            +-- unit-list/
            +-- unit-overview/
            +-- unit-map/
            +-- setu-overview/
            +-- about/
            +-- reset-password/
            +-- terms-and-conds/
            +-- verified/
        +-- shared/
            +-- components/
            +-- models/
            +-- pipes/
            +-- services/
```

---

You are an expert in TypeScript, Angular, and data-visualisation-heavy SPA development. You write maintainable, performant, and accessible code that fits MonSTAR's existing patterns.

## TypeScript Best Practices
- Keep strict typing; prefer interface/type aliases over any
- Let the compiler infer when it's obvious, but annotate public APIs
- Reuse shared models in shared/models for consistency with backend DTOs
- Avoid runtime instanceof Types.ObjectId checks in templates—derive plain IDs in components

---

##  Naming Conventions
- **Folders**: kebab-case → unit-overview/
- **Components**: feature-name.component.ts
- **Services**: feature.service.ts
- **Pipes**: truncate.pipe.ts
- **Models**: unit.model.ts
- **Enums**: unit-tag.enum.ts
- **Interfaces**: profile.interface.ts

---

##  Angular Best Practices (MonSTAR)
- Continue using standalone components (standalone: true) with focused imports
- Leverage Angular's native control flow (@if, @for) as already used
- Prefer service singletons with providedIn: 'root'
- Use RxJS BehaviorSubject for shared auth state (see AuthService)
- When introducing new observable data, expose Observable<T> and consume via async pipe in templates when possible
- Host listeners are acceptable where already established (e.g., keyboard shortcuts); document why
- Always clean up manual subscriptions (takeUntil or Subscription teardown) when not using the async pipe

---

## 🧩 Components
- Single responsibility: keep data fetching in containers (routes) and rendering in shared components
- Stick with ChangeDetectionStrategy.OnPush for new components to reduce change detection cost
- Use @Input/@Output for component APIs; follow existing event emitter patterns
- Provide docblock headings when adding new public methods, e.g.:
  ```ts
  /**
   * ! Handles review refresh
   * * Triggers a refetch after review mutations complete.
   */
  refreshReviews(): void {}
  ```
- Reuse shared UI (e.g., unit-card, review-card, write-review-unit) before creating new widgetry
- PrimeNG imports should stay local to components; avoid app-wide barrel imports

---

##  State Management
- Global auth/user context lives in AuthService.currentUser
- Route-level state typically lives in the route component (UnitOverviewComponent, SetuOverviewComponent)
- For simple component-local state, plain class properties remain the pattern; introduce Angular signals only if they improve clarity/perf
- Use dedicated methods (refreshReviews, filterUnits) instead of inline template logic

---

##  Templates
- Keep markup declarative: use @if, @for, @switch instead of *ngIf/*ngFor
- Avoid heavy logic in bindings; compute in TS and expose primitives/arrays
- Ensure interactive elements have accessible labels (tooltips + aria-labels for icon buttons)
- Prefer @for (...; track ...) to reduce DOM churn on large lists (e.g., reviews)

---

## ♿ Accessibility
- Maintain ARIA labels on icon-only buttons (navbar, notifications)
- PrimeNG dialogs already modalise focus—double-check copy when adding new ones
- Preserve keyboard shortcuts (CTRL+P / CTRL+S) but document them in UI help text where possible
- For charts/graphs (e.g., SETU), include textual summaries in addition to visuals

---

## Services
- Single responsibility (ApiService for REST, AuthService for sessions, FooterService for layout toggles)
- Provide helpful logging during development; be ready to gate behind environment flags for production
- When adding endpoints, mirror existing naming (getUnitsFilteredGET, toggleReactionPATCH)
- Inject HttpClient via constructor; reuse withCredentials: true for authenticated routes

---

## PrimeNG Usage Strategy
MonSTAR already standardises on PrimeNG Aura Noir + PrimeFlex for layout utilities.

### 🎯 Goals
- Import only the modules/components actually used per feature (standalone imports)
- Maintain ripple configuration via PrimeNGConfig in AppComponent
- Match existing dark theme defined in styles.scss / _variables.scss
- Use p-toast (single host at root) for notifications triggered from services/components

### 🎨 Styling & Theming
styles.scss layers Bootstrap → PrimeNG → PrimeFlex → custom variables. Keep additions in component styles; avoid ::ng-deep unless absolutely necessary.

### 📱 Dialogs & Overlays
- p-dialog powers profile, review composer, report review; ensure new dialogs follow the same structure (header, [modal]="true", [maximizable] where needed)
- Use OverlayPanel for lightweight dropdowns/menus (notifications, sort controls)

### ⚡ Performance
- Heavy views (unit list, review feed) already handle pagination/filters server-side—maintain server-driven pagination when adding capabilities
- For dense node graphs (unit map), keep using @swimlane/ngx-graph with zoomToFit helpers; avoid duplicating graph libraries

---

##  Observed Feature Highlights (for future reference)
- Home: rotating subheaders, emote preload, popular units carousel
- Unit List: debounced search, persistent filters in localStorage, keyboard shortcuts
- Unit Overview: review sorting, SETU card embed, footer suppression via FooterService
- Unit Map: prerequisite/parent visualisation using @swimlane/ngx-graph
- SETU Overview: carousel of survey snapshots with meta tag updates
- Profile: Google Identity sign-in, toast-driven feedback, write-review integration
- Notifications: overlay panel + badge reading state removal via ApiService

Keep these flows consistent when extending functionality.

---

## What Not To Do
- ❌ Don't bypass shared services—add API helpers there
- ❌ Don't introduce alternative UI kits or CSS frameworks
- ❌ Don't remove existing keyboard accessibility without replacement
- ❌ Don't store large objects directly in templates; prepare data in TS first
- ❌ Don't forget to update meta/SEO helpers when adding new public routes

---

## Git & PR Guidelines
- Stick with concise, conventional commit prefixes (feat:, fix:, chore:, docs:)
- Run `npm run build` (and relevant tests) before pushing significant changes
- Provide screenshots or short clips for UI-visible adjustments (home, unit overview, etc.)
- Document any new endpoints consumed by the frontend for backend parity

---

## 🔧 Tooling
- ESLint + Angular recommended config (already in place)
- EditorConfig governs indentation/formatting
- Use Prettier-compatible formatting in editors; run `npm run lint -- --fix` before large PRs when possible

---

## Documentation Assets
- public/llms.txt lists crawlable routes
- Multiple sitemaps (sitemap-index.xml, sitemap-units-*.xml, sitemap-setu-*.xml) keep search engines in sync—update if new static routes arrive
- Keep this guide (AGENTS.md) current when architecture decisions change (e.g., adopting signals broadly, swapping PrimeNG theme, etc.)

---

## Quick Visual Checks
When modifying UI-heavy screens:
1. Identify impacted routes/components (home, unit list, profile dialogs, etc.)
2. Navigate locally to each screen and verify data loads (popular units, reviews, maps)
3. Confirm PrimeNG overlays/dialogs open/close correctly and keyboard shortcuts still work
4. Capture desktop screenshots (=1440px width) of changed pages for review
5. Inspect console for runtime warnings (notably from PrimeNG or HttpClient)

---

### In Summary
This guide preserves MonSTAR's Angular 18 architecture: standalone components, PrimeNG-based UI, REST-driven data, and accessibility-friendly interactions. Optimise for clarity, reuse existing shared components/services, and keep student-facing experiences polished and consistent.