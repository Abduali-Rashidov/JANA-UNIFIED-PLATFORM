# Deployment

GitHub Actions deploys the Vite build to GitHub Pages on every push to `main`.

If the first deployment does not start automatically, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. Then open the **Actions** tab and inspect the `Deploy Jana Unified Platform to GitHub Pages` workflow.

For the cloud database, create a Supabase project, execute `supabase/schema.sql`, then add repository Actions secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Until configured, the application intentionally runs in browser demo mode.
