Commit all staged and unstaged changes using Conventional Commits format.

## Rules

1. **No mention of Claude** — never include "Claude", "Co-Authored-By: Claude", or any AI attribution in the commit message.
2. **Conventional Commits** — message format: `<type>(<scope>): <subject>` where scope is optional.
3. **Types:** `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`, `perf`, `ci`, `build`.
4. **Subject line:** imperative mood, lowercase after the colon, no trailing period, max 72 chars.
5. **Body (optional):** bullet list explaining *why* or listing grouped changes — only when needed for clarity.

## Steps

1. Run `git status` and `git diff HEAD` (or `git diff` if nothing staged yet) to understand what changed.
2. Stage all unstaged tracked files: `git add -u`. If there are relevant untracked files in the diff context, stage them too.
3. Draft the commit message following the rules above.
4. Commit using a heredoc so multiline messages are safe:

```
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject>

- bullet describing grouped change
- another bullet
EOF
)"
```

5. Report the short commit hash and subject line.

## Examples

```
fix(schema): add GRANTs for anon role to prevent permission denied
```

```
docs: add design handoff and rewrite README

- add Design_Docs.md with hi-fi UI spec for all screens
- rewrite README with full technical architecture and data flow
```

```
feat(painel): add date range filter and export buttons
```
