# Web Mock Auth

This feature owns the Web-only demo administrator session. It is independent from Mobile auth and
does not provide production authorization.

- `mockWebAuth.ts` defines the public demo credentials and deterministic login/logout behavior.
- `webSessionStorage.ts` stores only a version and demo user ID in the current browser tab.
- `WebAuthProvider.tsx` coordinates restore, login, and logout with a synchronous operation lock.
- `AuthGuards.tsx` applies public-only, protected, and root redirect decisions.

No password, token, complete user object, router state, or Query state is persisted.
