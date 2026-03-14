#!/usr/bin/env bash
# Report bundle sizes for all packages.
# Outputs a Markdown table to stdout.
set -euo pipefail
shopt -s nullglob

cd "$(git rev-parse --show-toplevel)"

echo "## Bundle Size"
echo ""
echo "| Package | File | Size | Gzip |"
echo "|---------|------|-----:|-----:|"

for pkg_dir in packages/*/; do
  dist_dir="${pkg_dir}dist"
  [ -d "$dist_dir" ] || continue
  [ -f "${pkg_dir}package.json" ] || continue

  pkg_name=$(jq -r '.name' "${pkg_dir}package.json")

  for file in "$dist_dir"/*.mjs "$dist_dir"/*.cjs; do
    filename=$(basename "$file")
    raw_size=$(wc -c < "$file" | tr -d ' ')
    gzip_size=$(gzip -c "$file" | wc -c | tr -d ' ')

    raw_display=$(awk "BEGIN { if ($raw_size >= 1024) printf \"%.1f KB\", $raw_size / 1024; else printf \"%d B\", $raw_size }")
    gzip_display=$(awk "BEGIN { if ($gzip_size >= 1024) printf \"%.1f KB\", $gzip_size / 1024; else printf \"%d B\", $gzip_size }")

    echo "| \`${pkg_name}\` | ${filename} | ${raw_display} | ${gzip_display} |"
  done
done
