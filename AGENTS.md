## AGENTS.md — FluidCast

This document gives coding agents everything needed to build, test, and work safely in this repo without cluttering the human-focused README. Keep it concise, precise, and executable.

If you’re an automated agent, read this file first. If you’re a human contributor, see `README.md`.

---

## Project overview

- Platform: iOS 17+ (SwiftUI + SwiftData)
- Targets:
  - iOS app: `FluidCast`
  - watchOS companion app: `FluidCast Watch App` (embedded via “Embed Watch Content” phase)
- Services: Firebase (Auth, Firestore, Analytics, Crashlytics), AVFoundation, BackgroundTasks, Core Spotlight, Network reachability
- Realtime sync: Firestore snapshot listeners (no polling)
- Data layer: SwiftData models `Podcast`, `Episode` (see `FluidCast/Models/DataModels.swift`)

Key entry points:
- `FluidCast/FluidCastApp.swift` — app/bootstrap, Firebase configure, BGTask scheduling, Spotlight handling, OPML deep links
- `FluidCast/Services/FirebaseService.swift` — auth, sync, realtime listeners, email verification gating
- `FluidCast/Services/PodcastManager.swift` — subscriptions and episode fetching
- `FluidCast/Services/DownloadManager.swift` — downloads and file storage
- `FluidCast/Services/SpotlightIndexingService.swift` — Spotlight reindex

Related docs for deeper context:
- `FIREBASE_REALTIME_LISTENERS.md` — architecture and expectations for listeners
- `EMAIL_VERIFICATION_IMPLEMENTATION.md` — auth/verification gates and UI
- `OPML_FEATURE.md` — import/export and URL handling
- `WATCH_APP_FIX.md` and `APPLE_WATCH_SETUP.md` — watchOS target guidance
- documentation could be outdated, take wuth a grain of salt
- for future documentation add document control

---

## Prerequisites

- macOS with Xcode 16+ (project shows LastUpgradeCheck 2600) and iOS 17+ SDK
- Swift 5.9+
- A valid `GoogleService-Info.plist` in the project (a file is present at repo root and added to the project). For CI, use a non-production or stub config.

Notes for agents:
- `FirebaseApp.configure()` is invoked at launch in `AppDelegate` within `FluidCastApp.swift`.
- Background task identifier: `com.fluidcast.background-refresh` (see `Info.plist`).
- The app can function locally/offline; Firebase sync is optional but used for cross-device features.

---

## Build commands (zsh)

The project uses a standard Xcode project (`FluidCast.xcodeproj`). Schemes with the same names as targets usually exist. If uncertain, list them first.

List schemes:

```zsh
xcodebuild -project FluidCast.xcodeproj -list
```

Build iOS app for simulator (adjust device name as available):

```zsh
xcodebuild \
  -project FluidCast.xcodeproj \
  -scheme "FluidCast" \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  build | xcpretty
```

Build watchOS app (built automatically when building `FluidCast` due to “Embed Watch Content”). If you need to build the watch target directly:

```zsh
xcodebuild \
  -project FluidCast.xcodeproj \
  -scheme "FluidCast Watch App" \
  -configuration Debug \
  -destination 'generic/platform=watchOS' \
  build | xcpretty
```

Open in Xcode (interactive):

```zsh
open FluidCast.xcodeproj
```

---

## Test commands

Test targets present:
- Unit tests (Swift Testing): `FluidCastTests`
- UI tests (XCTest): `FluidCastUITests`

Run all tests via the app scheme (preferred):

```zsh
xcodebuild \
  -project FluidCast.xcodeproj \
  -scheme "FluidCast" \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  test | xcpretty
```

Run only unit tests:

```zsh
xcodebuild \
  -project FluidCast.xcodeproj \
  -scheme "FluidCast" \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -only-testing:FluidCastTests \
  test | xcpretty
```

Run only UI tests:

```zsh
xcodebuild \
  -project FluidCast.xcodeproj \
  -scheme "FluidCast" \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -only-testing:FluidCastUITests \
  test | xcpretty
```

Notes:
- Unit tests use Swift’s `Testing` framework. UI tests use XCTest.
- If Firebase configuration causes network prompts/errors in CI, consider running on a simulator without network or injecting a stubbed `GoogleService-Info.plist` and guarding Firebase usage behind runtime checks if extending tests.

---

## Runtime behaviors and invariants (important for agents)

- Firebase listeners and sync are gated by email verification. Do not start realtime listeners for unverified users. Respect `FirebaseService.isEmailVerified` and gating in service methods. See `EMAIL_VERIFICATION_IMPLEMENTATION.md`.
- Background refresh is scheduled at launch and on lifecycle changes. Don’t block main thread in any service used by `BackgroundRefreshManager`.
- Navigation is event-driven via `NotificationCenter` and `NavigationManager`. Prefer posting notifications defined in `NotificationNames.swift` rather than calling views directly.
- Spotlight deep links use identifier formats `podcast:<id>` and `episode:<id>`. Preserve these formats.
- OPML import is triggered via `.onOpenURL` and `opmlFileReceived` notification. Maintain this path if you modify import/export.
- Watch Connectivity is initialized in `ContentViewWrapper.onAppear`. Avoid breaking that lifecycle.

---

## Code style and conventions

- Language: Swift 5.9+/SwiftUI 5
- Indentation: 4 spaces (match existing files); keep trailing commas where helpful; prefer explicit access control.
- Concurrency: Use `async/await`. Avoid blocking calls on main thread. Use `@MainActor` appropriately for UI-bound mutations.
- Data: Use SwiftData predicates (`#Predicate`) for queries. Always handle empty results gracefully.
- Services: Keep side effects isolated to the service layer (`FluidCast/Services/*`). Views should call services or post notifications.
- Logging: Prefer concise, emoji-prefixed logs already used across the codebase (e.g., 🔄, ✅, ❌) for consistency.

If you introduce formatters/linters, prefer Apple’s `swift-format` or `SwiftLint`, added via separate PR with config files.

---

## Security and privacy

- Minimal analytics policy is enforced. Do not add behavioral event logging. See comments in `FluidCastApp.swift` and `AnalyticsManager`.
- Do not commit real secrets. If replacing `GoogleService-Info.plist`, use non-production values in public branches.
- Ensure all Firebase writes respect user auth state and verification. Never start listeners when `isEmailVerified == false`.

---

## Common tasks for agents

- Add a new service:
  - Place in `FluidCast/Services/`
  - Inject via environment or initialize in `ContentViewWrapper` if needed
  - Keep I/O and network off the main thread

- Add a new view:
  - Place in `FluidCast/Views/`
  - Avoid holding strong references to heavy services; use `@EnvironmentObject` or inject lightweight adapters
  - Update iPad variants under `iPad*` views if relevant

- Modify sync:
  - Update `FirebaseService` methods and ensure listeners are resilient (auto-restart). Keep `isListenersActive` logic consistent.
  - Update docs in `FIREBASE_REALTIME_LISTENERS.md` if behavior changes.

- Add notifications:
  - Define new names in `FluidCast/NotificationNames.swift`
  - Prefer posting notifications over direct navigation from services

---

## Troubleshooting and gotchas

- Watch app Info.plist conflicts: do NOT create a manual Info.plist for the watch target. See `WATCH_APP_FIX.md` and `APPLE_WATCH_SETUP.md`.
- Firebase listeners not starting: user must be authenticated AND email verified; model context must be set. See logs and `EMAIL_VERIFICATION_IMPLEMENTATION.md`.
- OPML open-in behavior: ensure UTType `org.opml.opml` is declared in `Info.plist` (already present). See `OPML_FEATURE.md`.
- BackgroundTasks: identifier `com.fluidcast.background-refresh` must remain in `Info.plist` and in scheduler code.

---

## CI recommendations (optional)

Example outline for CI runners:

1) Select Xcode and boot a simulator
- Xcode 16+
- iOS 17+ runtime

2) Build and test
```zsh
xcodebuild -project FluidCast.xcodeproj -scheme "FluidCast" -destination 'platform=iOS Simulator,name=iPhone 16' build test | xcpretty
```

3) Artifacts
- Store derived data logs and test reports

4) Secrets
- Provide a CI-safe `GoogleService-Info.plist` via secure variables or skip Firebase-dependent paths if your tests are hermetic.

---

## Quick links

- App entry: `FluidCast/FluidCastApp.swift`
- Info plist: `FluidCast/Info.plist`
- Notifications: `FluidCast/NotificationNames.swift`
- Docs: `FIREBASE_REALTIME_LISTENERS.md`, `EMAIL_VERIFICATION_IMPLEMENTATION.md`, `OPML_FEATURE.md`, `WATCH_APP_FIX.md`, `APPLE_WATCH_SETUP.md`

---

## additional notes
- an android version is being made on a separate repo with flutter, the flutter version will target: android, windows, linux, etc.

Last updated: 2025-10-20
