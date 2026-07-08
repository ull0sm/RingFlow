# Quickstart Guide: Local Setup

This guide will walk you through setting up RingFlow on your local machine for development and testing.

## Prerequisites

Before starting, ensure you have the following installed:
* **Node.js**: `v20.x` or higher (recommended)
* **npm**: `v10.x` or higher
* **Git**: For version control
* **Supabase account**: A free tier account at [supabase.com](https://supabase.com) (or Supabase CLI installed locally)
* **Cloudflare account** (Optional for local development, as you can use dummy keys)

---

## Step-by-Step Setup

### 1. Clone the Repository
Clone the project to your local machine:
```bash
git clone <repository-url>
cd RingFlow
```

### 2. Install Dependencies
Install all package dependencies using npm:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file at the root of the project. You can copy the template from `.env.example`:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure the following variables:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Cloudflare Turnstile CAPTCHA (Required for login flows)
# For local development, you can use these official Cloudflare testing keys:
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x00000000000000000000000000000000
```

---

## 4. Setup the Database (Supabase)

You can set up your database either on a hosted Supabase project (recommended) or locally using the Supabase CLI.

### Option A: Cloud Supabase Project (Recommended)
1. **Create a project**: Log in to [Supabase](https://supabase.com) and create a new project.
2. **Apply Schema**:
   * Navigate to the **SQL Editor** in the Supabase Dashboard.
   * Open the consolidated schema file [master.sql](file:///d:/Programming/RingFlowDevelopment/docs/RingFlow/supabase/master.sql).
   * Copy the entire contents of [master.sql](file:///d:/Programming/RingFlowDevelopment/docs/RingFlow/supabase/master.sql), paste it into the SQL Editor, and click **Run**.
   * *(Alternatively, if you prefer to apply changes step-by-step, you can run the SQL scripts found in `supabase/migrations/` sequentially: [20240620000000_initial_schema.sql](file:///d:/Programming/RingFlowDevelopment/docs/RingFlow/supabase/migrations/20240620000000_initial_schema.sql) through [20240621000005_add_event_actions.sql](file:///d:/Programming/RingFlowDevelopment/docs/RingFlow/supabase/migrations/20240621000005_add_event_actions.sql)).*
3. **Copy Keys**: Grab the `Project URL` and `anon public` key from **Settings > API** and paste them into your `.env.local`.

### Option B: Local Supabase Setup
1. **Initialize CLI**:
   ```bash
   npx supabase init
   ```
2. **Start Services**:
   ```bash
   npx supabase start
   ```
   *This will automatically apply all the migrations in the `supabase/migrations/` folder to your local PostgreSQL instance.*
3. **Copy Local Keys**: Copy the local API URL and anonymous keys printed in the console to `.env.local`.

---

## 5. Enable Google OAuth (Admin Sign-In)

Admins sign in using Google OAuth, which must be configured in your Supabase project:
1. Go to your **Supabase Dashboard > Authentication > Providers > Google**.
2. Enable the Google provider.
3. Input your **Google Client ID** and **Client Secret** (obtainable from the Google Cloud Console).
4. Copy the **Redirect URI** provided by Supabase and add it to your Google Cloud Console project under Authorized Redirect URIs.
5. For local development, make sure the redirect flow redirects back to your local server: `http://localhost:3000/auth/callback?next=/admin`.

---

## 6. Seed Admin Access

Because admin access is gated by an explicit allow-list, you must authorize your Google account email address before you can log in as an administrator:

1. Sign up/login to the application once through the Google OAuth flow to create a user record in Supabase Auth (or manually create a user).
2. Find the newly created user's **User ID (UUID)** from the **Supabase Dashboard > Authentication** tab.
3. Run the following SQL query in the **SQL Editor** to insert your account into the admins allow-list:

```sql
INSERT INTO public.admins (id, email)
VALUES ('YOUR_USER_UUID', 'your.google.email@example.com');
```

---

## 7. Running the Application

To run the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to verify the app is running.

### Key Paths to Test:
* **Admin Dashboard**: [http://localhost:3000/login/admin](http://localhost:3000/login/admin) (Requires Admin OAuth & Allow-list setup)
* **Moderator Entry**: [http://localhost:3000/moderator/login](http://localhost:3000/moderator/login) (Requires a Ring Access Code from the Admin Dashboard)
* **Public Event Dashboard**: [http://localhost:3000/public](http://localhost:3000/public) (No login required)

---

## Useful npm Scripts

* `npm run dev`: Starts the Next.js development server.
* `npm run build`: Compiles the application for production deployment.
* `npm run start`: Runs the built production server locally.
* `npm run lint`: Performs static analysis of code using ESLint to identify styling or quality issues.
