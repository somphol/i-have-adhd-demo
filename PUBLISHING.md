# Notes for the publishing session

**Status: published 2026-11-08** — <https://github.com/somphol/i-have-adhd-demo>, live at
<https://somphol.github.io/i-have-adhd-demo/>. Pages source is GitHub Actions. The steps below are kept for a
re-publish, a fork, or a rename.

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

If the push happened before Pages was enabled, that first deploy run fails at `configure-pages` with
`Get Pages site failed`. Enable Pages, then re-run the failed jobs — no code change is needed:

```sh
gh run rerun --failed --workflow pages
```

Then confirm the workflow finished and the URL serves the page:

```sh
gh run list --workflow pages --limit 1
curl -s -o /dev/null -w '%{http_code}\n' https://<owner>.github.io/i-have-adhd-demo/
```

## Commit identity (decided)

The author reviewed this on 2026-11-08 and chose to publish under the local git identity already on the commits.
**Do not rewrite history, amend the author, or change the email.** A public repo will show that address permanently;
that is an accepted, deliberate choice.

If you need to confirm what will be published:

```sh
git log --format='%h %an <%ae> %s'
```

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
