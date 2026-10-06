This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local surgery simulation

The surgery-only demo mode avoids Admin and Patient service calls. It uses deterministic
employee, patient-name, and common-code fixtures in the frontend. The backend still stores
surgery data in a local Oracle schema and uses local Redis; a fresh schema is seeded with
two operating rooms and one sample surgery order. Planned-item management is available from
the selected surgery in the worklist.

1. Start a local Oracle database with a `SURGERY` schema and a local Redis server.
2. In `C:\his\surgery-service`, set the Oracle password and start the backend:

   ```powershell
   $env:SURGERY_DB_PASSWORD = "<local schema password>"
   .\gradlew.bat bootRun --args="--spring.profiles.active=local-simulation"
   ```

   Set `SURGERY_DB_URL` or `SURGERY_DB_USERNAME` too if the local Oracle connection differs
   from the profile defaults. The schema user must be able to create/update tables.
3. In this repository, start the frontend with the demo flag and local surgery API:

   ```powershell
   $env:NEXT_PUBLIC_SURGERY_DEMO_MODE = "true"
   $env:SURGERY_API_ORIGIN = "http://localhost:8084"
   npm run dev
   ```

4. Open `http://localhost:3000/surgery`. Do not enable this demo mode in a shared or
   production environment: it bypasses the Admin login shell and uses mock directory data.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
