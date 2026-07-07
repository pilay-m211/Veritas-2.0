---
name: Firebase auth setup
description: How Firebase auth and Firestore are wired into Veritas; gotchas with Security Rules and fallback profile.
---

Firebase web SDK config is hardcoded in `artifacts/veritas/src/lib/firebase.ts` — this is correct for web SDK keys (they are public and protected by Security Rules, not by secrecy).

Auth context (`artifacts/veritas/src/contexts/auth-context.tsx`) provides `currentUser`, `userProfile`, `loading`, `login`, `register`, `logout`.

**Firestore write in register():** wrapped in try/catch because Firebase Security Rules on the `veritas-b02e0` project may not allow writes from unauthenticated or unverified clients. If the write fails, the profile is set in local state only — the user can still use the app.

**Why:** Avoids hard crash on registration when Firestore rules are restrictive.

**How to apply:** If user reports "registration fails silently", check Firebase Console → Firestore Security Rules and ensure `users/{uid}` allows write when `request.auth.uid == uid`.
