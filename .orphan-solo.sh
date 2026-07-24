#!/bin/sh
set -e
cd "/c/Users/dhyan/GoMUN Delegate Arena Project"

git fetch origin
git checkout main
git reset --hard origin/main

# Orphan branch = brand-new root commit, no prior authors in ancestry
git checkout --orphan solo-main
git add -A
# Don't stage local secrets if any slipped in
git reset HEAD -- .env.local 2>/dev/null || true
git clean -fd -- .env.local 2>/dev/null || true

export GIT_AUTHOR_NAME="DhyanviMehta"
export GIT_AUTHOR_EMAIL="dhyanvim@gmail.com"
export GIT_COMMITTER_NAME="DhyanviMehta"
export GIT_COMMITTER_EMAIL="dhyanvim@gmail.com"

TREE=$(git write-tree)
NEW=$(git commit-tree "$TREE" <<'EOF'
GoMUN Delegate Arena — initial public tree.

Classroom-private MUN practice: Firebase Auth/Firestore, email-code signup,
Discord-style usernames, classrooms, and GitHub Pages hosting.
EOF
)

git reset --hard "$NEW"
git branch -M main

echo "---- log ----"
git log --format='%h %an <%ae> %s'
echo "---- shortlog ----"
git shortlog -sne

git push --force origin main

echo "---- done ----"
