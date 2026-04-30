# Fitin Connection Workout Log Webapp

Student workout record collection prototype for Fitin Connection.

Display URL:
`https://fitin-connection.com`

## Current MVP Scope

- Submit Workout Log / 운동 기록 제출
- My Records / 내 기록 조회
- Admin / 관리자
- Korean-first bilingual labels
- Mobile-first dark fitness UI
- localStorage MVP storage
- Supabase schema SQL for later database setup
- CSV and JSON export from Admin

## Files

- `index.html`: Static web app markup
- `styles.css`: Dark responsive UI
- `app.js`: Form logic, localStorage data, My Records, Admin, exports
- `supabase_schema.sql`: Supabase table schema, constraints, indexes, RLS starter policies, sample data

## How To Run Locally

Open `index.html` in a browser from this project folder.

No build step is required for the current static MVP.

## Test Data

The app seeds one sample user in localStorage:

- 이름 (Name): `황제웅`
- 학번 또는 휴대폰 뒷자리 (Identifier): `2026`
- 출생연도 (Birth Year): `2004`

Use these values on `내 기록 조회 (My Records)` to see the sample record.

## Admin

MVP admin password:

```text
fitin2026
```

Important:
The admin password is hardcoded only for MVP testing. In production, move admin authentication to environment variables, Supabase Auth, backend routes, or Supabase Edge Functions.

## Data Matching Rule

When a workout is submitted:

```text
name + student_id_or_phone_last4 + birth_year
```

If the same identity already exists, the new workout is saved under that existing user. If not, a new user is created.

## Supabase Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase_schema.sql`.
4. Create a private storage bucket for workout screenshots if needed.
5. Replace the placeholders in `app.js`:

```js
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
```

Current app still uses localStorage fallback. For real student data, route submissions and admin exports through protected backend or Edge Function logic.

## Session Roadmap Completed

- Session 1: Submit Workout Log
- Session 2: My Records
- Session 3: Admin dashboard and exports
- Session 4: Supabase schema
- Session 5: README and final QA

## Safety Notes

- Do not expose admin-wide SELECT/export through a public anon key.
- Do not store production admin passwords in frontend JavaScript.
- Do not use localStorage for real student records.
- Use secure image upload storage before collecting real screenshots.
