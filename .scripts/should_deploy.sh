#!/bin/bash

# Determines which git files changes will trigger deployment on Vercel.
# Exit 0 = Skip deployment
# Exit 1 = Proceed with deployment

echo "Checking if deployment should proceed..."

# Always skip Dependabot branches. Previews get production secrets, and
# nobody has reviewed the dependency code these branches bring in.
if [[ "$VERCEL_GIT_COMMIT_REF" == dependabot/* ]]; then
  echo "Dependabot branch. Skipping deployment."
  exit 0
fi

# If there's no previous deployment SHA, always deploy.
if [[ -z "$VERCEL_GIT_PREVIOUS_SHA" ]]; then
  echo "No previous deployment found. Proceeding with deployment."
  exit 1
fi

echo "Comparing $VERCEL_GIT_PREVIOUS_SHA (previous) with $VERCEL_GIT_COMMIT_SHA (current)..."

# Check if any files other than documentation/config files were changed
if git diff "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" --quiet -- . \
  ':(exclude)*.md' \
  ':(exclude)*.drawio' \
  ':(exclude)*.dio' \
  ':(exclude)LICENSE' \
  ':(exclude).gitignore' \
  ':(exclude).gitattributes' \
  ':(exclude).prettierrc*' \
  ':(exclude).prettierignore' \
  ':(exclude).eslintrc*' \
  ':(exclude).eslintignore' \
  ':(exclude).editorconfig' \
  ':(exclude).artillery.yml' \
  ':(exclude)processed_units.json' \
  ':(exclude)setu_data_2019_2024.json' \
  ':(exclude).env.template' \
  ':(exclude).mcp.json' \
  ':(exclude).claude/**' \
  ':(exclude).vscode/**' \
  ':(exclude).idea/**' \
  ':(exclude)bruno/**' \
  ':(exclude)docs/**'; then
  echo "Only documentation/config files changed. Skipping deployment."
  exit 0
else
  echo "Code changes detected. Proceeding with deployment."
  exit 1
fi
