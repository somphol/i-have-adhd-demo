# Notes for the publishing session

This repo is publish-ready. Nothing needs to be built: `index.html` works as-is, and
`data/examples.js` is committed because it is generated for `file://`.

## Publish

```sh
cd ~/Projects/i-have-adhd-demo
gh repo create i-have-adhd-demo --public --source=. --remote=origin --push

# Pages must be told to use Actions, not a branch.
gh api --method POST "repos/{owner}/i-have-adhd-demo/pages" -f build_type=workflow
gh api "repos/{owner}/i-have-adhd-demo/pages" --jq .html_url
```

If the `POST` returns `409`, Pages already exists; use `PUT` instead of `POST`.

Then confirm the workflow finished and the URL serves the page:

```sh
gh run list --workflow pages --limit 1
curl -s -o /dev/null -w '%{http_code}\n' https://<owner>.github.io/i-have-adhd-demo/
```

## Before pushing: commit identity

The initial commit was authored with the local `git config` email. Check it:

```sh
git log -1 --format='%an <%ae>'
```

If it contains a personal address, rewrite it first — a public repo publishes every commit's
author email permanently, and rewriting after the push does not remove it from forks or caches.

```sh
# preferred: the GitHub account's noreply address (Settings → Emails → Keep my email private)
git commit --amend --reset-author --no-edit \
  --author="Name <ID+username@users.noreply.github.com>"
```

Do not enable "Keep my email addresses private" retroactively and assume it fixes history; it does not.

## After publishing

- Add the live URL to `README.md` (top, after the first paragraph) and to this file.
- Update `AGENTS.md` → **Continuity** with the remote and Pages URL, in the same push, as the
  root working agreement requires.
- Set the repo description and topics: `adhd`, `opencode`, `output-style`, `developer-tools`,
  `demo`, `github-pages`.
- Optional: pin the repo, or add the upstream project link as the website field.

## Checks that must pass

```sh
npm run verify          # data + rendering rules
gh run list --limit 3   # both workflows green
```

The Pages workflow stages `index.html`, `assets/`, `data/`, and `docs/` into `_site/`; it never
uploads `.git` or the repository root. Do not change it to `path: .`.
