This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase integration

### Run and test

1. **Install dependencies** (if you haven’t):
   ```bash
   npm install
   ```

2. **Configure Supabase**  
   Copy `.env.example` to `.env.local` and set your project values:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set `SUPABASE_URL` and `SUPABASE_ANON_KEY` from your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

3. **Start the app**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). The home page shows a “Supabase example” section: if env is missing or the `items` table doesn’t exist, you’ll see a short message; once the table exists and env is set, it will show how many rows were fetched.

4. **Optional – create the example table**  
   In the Supabase SQL editor, run:
   ```sql
   create table public.items (
     id uuid primary key default gen_random_uuid(),
     name text
   );
   insert into public.items (name) values ('First item'), ('Second item');
   ```
   Reload the app to see “Fetched 2 row(s) from table items.”

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
