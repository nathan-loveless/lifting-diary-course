#!/usr/bin/env python3
"""Plot workouts per month for the past year from the Postgres DB in .env.

Usage: python workout_chart.py [--out PATH] [--user-id CLERK_USER_ID] [--env PATH]
Requires: matplotlib, psycopg[binary], python-dotenv
"""
import argparse
import os
import sys
from datetime import date
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import psycopg
from dotenv import load_dotenv

BAR = "#2a78d6"
SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK_2 = "#52514e"
GRID = "#f0efec"


def find_project_root() -> Path:
    for p in [Path.cwd(), *Path(__file__).resolve().parents]:
        if (p / ".env").exists():
            return p
    sys.exit("No .env file found")


def month_range(today: date) -> list[date]:
    """First day of each of the last 12 months, oldest first (includes current month)."""
    y, m = today.year, today.month
    months = []
    for _ in range(12):
        months.append(date(y, m, 1))
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return months[::-1]


def fetch_counts(url: str, start: date, user_id: str | None) -> dict[date, int]:
    sql = (
        "SELECT date_trunc('month', started_at)::date AS month, count(*) "
        "FROM workouts WHERE started_at >= %s"
    )
    params: list = [start]
    if user_id:
        sql += " AND user_id = %s"
        params.append(user_id)
    sql += " GROUP BY 1"
    with psycopg.connect(url) as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return {row[0]: row[1] for row in cur.fetchall()}


def plot(months: list[date], counts: list[int], out: Path) -> None:
    labels = [m.strftime("%b\n%Y") if m.month == 1 or i == 0 else m.strftime("%b")
              for i, m in enumerate(months)]
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=150, facecolor=SURFACE)
    ax.set_facecolor(SURFACE)
    bars = ax.bar(range(len(months)), counts, color=BAR, width=0.6)
    for b, c in zip(bars, counts):
        if c:
            ax.text(b.get_x() + b.get_width() / 2, c, str(c), ha="center",
                    va="bottom", fontsize=9, color=INK_2)
    ax.set_xticks(range(len(months)), labels, color=INK_2)
    ax.set_xlabel("Month", color=INK_2)
    ax.set_ylabel("Number of workouts", color=INK_2)
    ax.set_title("Workouts per month (past 12 months)", color=INK, loc="left",
                 fontsize=14, fontweight="bold")
    ax.yaxis.get_major_locator().set_params(integer=True)
    ax.tick_params(axis="y", colors=INK_2)
    ax.grid(axis="y", color=GRID, linewidth=1)
    ax.set_axisbelow(True)
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(GRID)
    fig.tight_layout()
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, facecolor=SURFACE)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="workouts-by-month.png")
    ap.add_argument("--user-id", help="Only count this user's workouts (default: all users)")
    ap.add_argument("--env", help="Path to .env (default: nearest .env)")
    args = ap.parse_args()

    env = Path(args.env) if args.env else find_project_root() / ".env"
    load_dotenv(env)
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit(f"DATABASE_URL not set in {env}")

    months = month_range(date.today())
    data = fetch_counts(url, months[0], args.user_id)
    counts = [data.get(m, 0) for m in months]
    out = Path(args.out).resolve()
    plot(months, counts, out)
    print(f"Total workouts: {sum(counts)}")
    for m, c in zip(months, counts):
        print(f"{m:%Y-%m}: {c}")
    print(f"Saved chart to {out}")


if __name__ == "__main__":
    main()
