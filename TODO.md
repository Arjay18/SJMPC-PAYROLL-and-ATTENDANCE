# TODO - Neon Postgres migration

- [ ] Update `server/package.json` to include `pg` dependency
- [ ] Replace `server/src/lib/db.js` SQLite implementation with `pg` + Neon `DATABASE_URL`
- [ ] Create required Postgres tables (`users`, `employees`, and minimum for app startup/auth)
- [ ] Update seed logic for default admin (idempotent)
- [ ] Ensure auth routes work with Postgres queries
- [ ] Remove/avoid leaking default credentials in `client/src/pages/LoginPage.jsx` (optional but recommended)
- [ ] Test locally: start server and login as seeded admin

