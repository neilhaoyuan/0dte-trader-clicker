# 0DTE $DGEN Trader

A fun educational clicker game where you can purchase 0DTE call and put options on a fictional extreme volatility stock. 

<img width="959" height="483" alt="image" src="https://github.com/user-attachments/assets/097c5909-fb80-4769-b6a3-9c15910b823f" />

<br>
<hr>

Features

- Mood-based advisor system that displays different expressions and dialogue depending on the players performance
- Leveling and XP system that correlates to player's stock market "wins"
- Realistic pricing and simulated stock movement calculated using Black Scholes and Geometric Brownian Motion
- Real time intrinsic value, time value, and PnL calculations on player's active positions
- Persistent global leaderboard powered by Supabase
- Some fun and dynamic background music!  

<hr>

## Leaderboard Backend Setup

1. Create a free Supabase project.
2. Open the Supabase SQL Editor and run `database/leaderboard-schema.sql`.
3. In Supabase, copy your Project URL and publishable key from Project Settings > API Keys.
4. Replace `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `src/leaderboard.js`.
5. Add your server-only key as an Edge Function secret:

```bash
supabase secrets set APP_SUPABASE_SERVICE_KEY=sb_secret_your_secret_key_here
```

6. Deploy the Edge Functions:

```bash
supabase login
supabase link --project-ref iqcqymtmspynbndqkgmf
supabase functions deploy
```

7. Publish the site to GitHub Pages.

The browser uses the public publishable key to call Supabase Edge Functions. Score inserts happen inside `submit-score`, where Supabase server-side secrets are available. The leaderboard table allows public reads, but direct public inserts are blocked by Row Level Security.

If `src/leaderboard.js` still has placeholder Supabase values, the game uses a browser-local test leaderboard stored in `localStorage`. That lets you test the submit/ranking UI before deploying the real backend.

<hr>

Not financial advice. Have fun playing!
