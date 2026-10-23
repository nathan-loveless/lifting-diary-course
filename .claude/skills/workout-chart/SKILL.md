---
name: workout-chart
description: Query the lifting diary database for all workouts in the past year and export a bar chart image (months on the x axis, number of workouts on the y axis). Use when the user asks for a workout chart, workout history/frequency by month, or a yearly workout summary image.
---

# Workout chart

Reads `DATABASE_URL` from the project's `.env`, counts rows in the `workouts` table
(by `started_at`) for the last 12 months (including the current month, empty months
shown as 0), and saves a PNG bar chart.

## Run

```bash
pip install matplotlib "psycopg[binary]" python-dotenv   # first time only
python .claude/skills/workout-chart/scripts/workout_chart.py --out workouts-by-month.png
```

Options:
- `--out PATH` — image path (default `workouts-by-month.png` in the current directory)
- `--user-id ID` — restrict to one Clerk user id (default: workouts of all users)
- `--env PATH` — use a specific `.env` file

## Notes

- The script prints the per-month counts and the absolute path of the saved image; report both to the user.
- This is a standalone analysis script, not app code, so it queries Postgres directly and
  the Drizzle-only rule in `docs/data-fetching.md` does not apply. Never print or log the connection string.
- Single series, so one color and no legend; the title names the metric.
