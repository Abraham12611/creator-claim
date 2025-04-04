#!/usr/bin/env bash
set -euo pipefail

# Configure git user
git config user.email "abraham.dahunsi@gmail.com"
git config user.name "Abraham12611"

echo "Git commit date distribution script"
echo "=================================="
echo "This script will distribute your uncommitted files across the specified date range"
echo "Each file will be committed with a random timestamp within its assigned day"
echo ""

# Prompt
read -p "Start date (YYYY-MM-DD): " start_date
read -p "End date   (YYYY-MM-DD): " end_date

# Validate
if ! date -d "$start_date" +%s >/dev/null 2>&1; then
  echo "Invalid start date: $start_date" >&2
  exit 1
fi
if ! date -d "$end_date" +%s >/dev/null 2>&1; then
  echo "Invalid end date: $end_date" >&2
  exit 1
fi

start_ts=$(date -d "$start_date" +%s)
end_ts=$(date -d "$end_date"   +%s)

if (( end_ts < start_ts )); then
  echo "End date must be on or after start date" >&2
  exit 1
fi

# Number of days (inclusive)
days=$(( (end_ts - start_ts) / 86400 + 1 ))

# Gather unstaged files (modified + untracked)
echo "Scanning for uncommitted files..."
mapfile -t files < <(
  git diff --name-only
  git ls-files --others --exclude-standard
)

total=${#files[@]}
if (( total < days )); then
  echo "Need at least one file per day, but only $total file(s) available." >&2
  exit 1
fi

echo "Found $total files to commit across $days days"
echo ""

# Clear any existing index
git reset

remaining=$total
days_left=$days

for (( i=0; i<days; i++ )); do
  # Compute current date
  day_ts=$(( start_ts + i*86400 ))
  cur_date=$(date -d "@$day_ts" +%Y-%m-%d)
  year=$(date -d "@$day_ts" +%Y)
  month=$(date -d "@$day_ts" +%m)
  day=$(date -d "@$day_ts" +%d)

  # Decide how many files today: between 1 and min(15, remaining - (days_left-1))
  max_today=$(( remaining - (days_left - 1) ))
  (( max_today > 15 )) && max_today=15
  count=$(( RANDOM % max_today + 1 ))

  # Generate & sort 'count' random seconds-in-day
  declare -a secs
  for (( j=0; j<count; j++ )); do
    secs[j]=$(( ( RANDOM * 32768 + RANDOM ) % 86400 ))
  done
  IFS=$'\n' sorted_secs=($(printf "%s\n" "${secs[@]}" | sort -n))
  unset IFS

  echo "[$cur_date] will commit $count file(s) at:"
  for s in "${sorted_secs[@]}"; do
    printf "  %02d:%02d:%02d\n" "$((s/3600))" "$(((s%3600)/60))" "$((s%60))"
  done

  # Do the commits
  for s in "${sorted_secs[@]}"; do
    h=$(( s/3600 )); m=$(((s%3600)/60)); sec=$((s%60))
    timestamp="$year-$month-$day"T$(printf "%02d:%02d:%02d" $h $m $sec)

    # pick & remove a random file
    idx=$(( RANDOM % ${#files[@]} ))
    file=${files[idx]}
    unset 'files[idx]'
    files=( "${files[@]}" )

    echo "Committing $file at $timestamp"
    git add -- "$file"
    GIT_AUTHOR_DATE="$timestamp" \
    GIT_COMMITTER_DATE="$timestamp" \
      git commit -m "Auto-commit $file"
  done

  remaining=$(( remaining - count ))
  days_left=$(( days_left - 1 ))
done

echo "✅  Done. Total commits: $total, spanning $days days."
echo "You can now push these commits when ready."
