# proj2 (Hungry Wolf) — local setup for CSC510 team

The original repo needs a real Firebase project to run. We run it locally
against the Firestore emulator in Docker instead. Steps after cloning:

```bash
cd proj2
cp server/env.example server/.env   # emulator config is the default
docker compose up -d                # Firestore emulator on :8080 (needs Docker)
npm run install-all                 # root + server + client deps
npm run dev                         # server :5001 + client :3000
```

Notes:

- Emulator data lives in the container's memory only — it is lost when the
  container restarts. Re-register accounts (or re-run a seed) after that.
- The DB starts empty: sign up a `restaurant` account and add menu items
  before the customer view shows anything.
- `client/.env` is optional (API URL defaults to `http://localhost:5001/api`).
  `REACT_APP_GOOGLE_MAPS_API_KEY` only affects signup address autocomplete.
- `npm test` expects 4 documented reds (UC3, UC7, UC11, UC14; #69–72). The
  inherited `tests/example.test.js` (it imported a never-committed
  `src/utils/businessLogic.js`) was reported in 1a and removed in #78.
- So your commits count for the rubric, set your git identity in this clone:
  `git config user.email <your-github-email-or-noreply-address>`
