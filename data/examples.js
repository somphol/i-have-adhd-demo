/* Generated from data/examples.json by scripts/build.mjs. Do not edit by hand. */
window.EXAMPLES = {
  "meta": {
    "title": "Same prompt. Two answers.",
    "subtitle": "Nine everyday coding requests, answered once by a generic assistant and once under the 10 rules of the i-have-adhd output skill.",
    "upstream": "https://github.com/ayghri/i-have-adhd",
    "note": "The answers are hand-written illustrations of the style difference, not recorded model transcripts. See README.md, section \"How these were produced\".",
    "built": "2026-11-08"
  },
  "examples": [
    {
      "id": "failing-test",
      "title": "A failing test report",
      "kind": "debug",
      "prompt": [
        "`npm test` fails with `TypeError: Cannot read properties of undefined (reading 'id')` at `getWorkspace (src/workspace.ts:18)`. Can you fix it?"
      ],
      "before": [
        "Great question! Thanks for sharing the full error, that always helps. Let me walk through what's happening here.",
        "The error means something is `undefined` when `getWorkspace` tries to read `.id`. There are a few possible causes: the config might not be loaded yet, the workspace map might be empty, or the argument might simply be missing at the call site.",
        "In setups like this the config is often loaded asynchronously at startup, so depending on when `getWorkspace` is called you can hit a race. One approach would be to make sure the config has finished loading before the function runs. Another would be to add a guard clause and return early.",
        "You could also consider passing the config into `getWorkspace` as a parameter instead of reading a module-level variable. That tends to make testing easier. Either way, after the change you'd want to run the test suite to confirm nothing else breaks.",
        "Hope this helps! Let me know if you want me to look at the actual file."
      ],
      "after": [
        "Read the workspace map after the config loads, not at module import. In `src/workspace.ts:18`, guard the lookup.",
        "1. Open `src/workspace.ts`\n2. Replace `getWorkspace` with the version below\n3. Run `npx vitest run src/workspace.test.ts`",
        "```ts\nexport function getWorkspace(id: string): Workspace | undefined {\n  return config.workspace?.find((w) => w.id === id);\n}\n```",
        "Next: paste the first failing line if the test still throws. ~2 min."
      ],
      "why": [
        "The first line names the cause and the exact line to edit, so the reader starts moving before reading the explanation.",
        "The fix is shown as code, not described in prose.",
        "It ends with one concrete next step and a real time estimate instead of an offer to help."
      ],
      "rules": [
        1,
        2,
        3,
        6,
        10
      ]
    },
    {
      "id": "add-pagination",
      "title": "A feature request",
      "kind": "build",
      "prompt": [
        "Add pagination to `GET /api/posts`. We have about 40k posts."
      ],
      "before": [
        "Pagination is a great thing to add early. There are two main approaches: offset-based pagination with `LIMIT` and `OFFSET`, and cursor-based pagination using a timestamp or ID.",
        "Offset pagination is simpler to implement and works well with a page-number UI. The downside is that it gets slower as the offset grows, and rows can shift between pages if new posts are inserted while someone is browsing.",
        "Cursor pagination avoids both problems but requires the client to pass an opaque cursor and the table to have a stable sort key. You would typically use `(created_at, id)` together so ties are deterministic.",
        "You'll also want to decide on a page size, add an index to support the sort, and update the API response shape. After that, you can test with curl or Postman. Let me know which approach you prefer and I can sketch out the code."
      ],
      "after": [
        "Use cursor pagination on `(created_at, id)`, 50 per page. Offset pagination gets slow and skips rows at 40k.",
        "1. In `src/routes/posts.ts`, parse `?cursor=<created_at>,<id>&limit=50`\n2. Change the query to `where (created_at, id) < ($1, $2) order by created_at desc, id desc limit $3`\n3. Return `{ items, nextCursor }` and omit `nextCursor` on the last page\n4. Add `create index posts_created_id_idx on posts (created_at desc, id desc)`\n5. Follow `nextCursor` twice with `curl 'localhost:3000/api/posts?limit=2'`",
        "Next: run step 4 on a copy of the database first. The index takes about 30 sec on 40k rows."
      ],
      "why": [
        "It picks one approach and gives the reason in the same sentence, so there is no decision left hanging.",
        "Five numbered steps, each one edit or one command.",
        "The ordering hazard (index before traffic) is called out at the end, where it will be needed."
      ],
      "rules": [
        1,
        2,
        3,
        4,
        6,
        9
      ]
    },
    {
      "id": "review-diff",
      "title": "A pre-merge review",
      "kind": "review",
      "prompt": [
        "Review this change to `src/upload.ts` before I merge.",
        "```diff\n+ const key = `${Date.now()}-${file.name}`;\n+ await s3.putObject({ Bucket, Key: key, Body: file.data });\n```"
      ],
      "before": [
        "This looks pretty good overall! A few thoughts before you merge.",
        "First, the key generation works, though `Date.now()` plus the filename could collide if two uploads happen in the same millisecond with the same name. Not a big deal, but worth thinking about.",
        "Second, `file.name` comes from the client. It might contain slashes or `..`, which could be a problem depending on how S3 normalizes keys. You may want to sanitize it.",
        "Third, there's no `ContentType` set, so objects will default to `application/octet-stream`. That affects browser rendering and downloads.",
        "Also, you might want to add a size check, set a cache header, and consider lifecycle rules for old uploads. None of these are blockers necessarily. Let me know if you want me to write the patches, or if you'd rather handle it yourself!"
      ],
      "after": [
        "Don't merge yet: `file.name` is user-controlled, so the key can contain `../` and overwrite another object.",
        "1. `src/upload.ts:24` — build the key from `crypto.randomUUID()` and keep the original name in metadata\n2. `src/upload.ts:26` — set `ContentType` from the detected type, not from the client header\n3. Re-run `npm test -- upload`",
        "Everything else in the diff is fine.",
        "Next: paste the updated hunk if you want a second pass. ~3 min."
      ],
      "why": [
        "Severity comes first: the word \"merge\" and the actual risk are in line one.",
        "The three real findings are numbered with file and line; the non-issues are dismissed in one sentence.",
        "The reader knows exactly when the review is done instead of receiving an open-ended offer."
      ],
      "rules": [
        1,
        2,
        3,
        4,
        6,
        9,
        10
      ]
    },
    {
      "id": "ambiguous-perf",
      "title": "A vague request",
      "kind": "debug",
      "prompt": [
        "The app is slow. Can you make it faster?"
      ],
      "before": [
        "Performance is a broad topic, so let's think about where the time might be going.",
        "On the frontend you could be looking at bundle size, render blocking, unnecessary re-renders, or image payloads. On the backend, slow queries, missing indexes, N+1 patterns, and cold starts are common. There's also network latency, caching strategy, and the database itself.",
        "A good first step is usually to measure. You could add a profiler, look at the browser's performance tab, or check your server logs for slow requests. Once you have numbers, the bottleneck is usually obvious.",
        "I'd suggest starting with a Lighthouse run and an `EXPLAIN ANALYZE` on your slowest query. Happy to dig into whichever area you think is most likely. What does the app do, and what feels slow?"
      ],
      "after": [
        "One question first: which is slow, the dashboard on load, or saving a post? The fix is different for each.",
        "- Dashboard: I'll profile the 3 queries in `src/api/dashboard.ts` (~20 min)\n- Save: I'll check the image path in `src/upload.ts` (~15 min)",
        "Next: reply with `dashboard` or `save`. ~5 sec, and I'll take that path."
      ],
      "why": [
        "The skill's ambiguity exception: ask one short question instead of guessing.",
        "The question offers two named options with a cost for each, so answering takes seconds rather than a paragraph.",
        "The tangent about Lighthouse and profiling never happens."
      ],
      "rules": [
        1,
        3,
        4,
        5,
        6
      ]
    },
    {
      "id": "deploy-check",
      "title": "A status question",
      "kind": "ops",
      "prompt": [
        "Did the deploy go out?"
      ],
      "before": [
        "I don't have direct access to your deploy system, so I can't say for certain from here. Based on what you've described, there are a few ways to check.",
        "You could look at the CI logs for the latest workflow run, or check the health endpoint, or ask in the team channel. If you use GitHub Actions, the run list will show whether the deploy job succeeded. If you use a platform like Vercel or Fly, the dashboard will show the active release.",
        "It's also possible the deploy went out but the app is serving a cached version, so you may want to check the version header rather than just the page. Let me know which platform you're on and I can give you the exact command."
      ],
      "after": [
        "Check the version the API reports: `curl -s https://app.example.com/health | jq .version`. Expect `1.4.2`.",
        "If it returns `1.4.1`, the job stopped at `migrate`. See it with `gh run list --workflow deploy --limit 1` (~1 min).",
        "Next: paste the version string it prints."
      ],
      "why": [
        "One command answers the question, and the expected value is stated so the answer is self-checking.",
        "The failure branch is handled in one line rather than a paragraph of possibilities.",
        "No caveat about not having access to the deploy system, because the reader can check it directly."
      ],
      "rules": [
        1,
        3,
        6,
        8,
        10
      ]
    },
    {
      "id": "db-choice",
      "title": "A technology decision",
      "kind": "build",
      "prompt": [
        "SQLite or Postgres for a side project with maybe 200 users?"
      ],
      "before": [
        "Both are excellent choices, and it really depends on your requirements.",
        "SQLite is a single file, requires no server, and is extremely fast for reads. It's a great fit for small apps, prototypes, and anything that runs on one machine. The main limitations are concurrent writes and the lack of a network protocol, though WAL mode helps a lot.",
        "Postgres is a full server with rich types, extensions, row-level security, and strong concurrency. It's the safer default if you expect to grow, need multiple app servers, or want managed hosting with backups.",
        "For 200 users you could genuinely go either way. If you want the simplest possible setup, SQLite. If you'd rather not migrate later, Postgres. There's no wrong answer here. What's the app, and do you expect it to stay small?"
      ],
      "after": [
        "SQLite. 200 users, one server, no ops budget: Postgres buys you nothing yet.",
        "- WAL mode handles this write volume comfortably\n- Backups are `cp app.db backup.db`\n- Moving to Postgres later is a dump and restore, roughly an afternoon",
        "Switch when you need more than one app server, or writes from more than one region.",
        "Next: run `sqlite3 app.db 'pragma journal_mode=wal;'` and move on. ~1 min."
      ],
      "why": [
        "It gives a recommendation, not a survey, and puts the reason next to it.",
        "Three reasons, capped well under the five-item limit.",
        "It names the condition that would change the answer, which is what a good engineer wants to know."
      ],
      "rules": [
        1,
        3,
        6,
        9
      ]
    },
    {
      "id": "explain-error",
      "title": "An explanation request",
      "kind": "explain",
      "prompt": [
        "What does `EADDRINUSE` mean? It keeps killing my dev server."
      ],
      "before": [
        "Great question! This is a very common error and it's usually easy to resolve.",
        "`EADDRINUSE` means that the port your process is trying to bind to is already in use by another process. Every TCP connection has a port, and only one process can listen on a given port at a time. When Node tries to start and finds the port taken, it throws this error and exits.",
        "There are several reasons this happens. The most common is that a previous dev server didn't shut down, perhaps because the terminal was closed without Ctrl-C. Another possibility is that another app on your machine happens to use the same port. On some systems, a lingering `TIME_WAIT` socket can also hold the port briefly.",
        "To fix it, you can find the process with `lsof -i :3000` and kill it, or change your port by setting the `PORT` environment variable. Restarting your machine also works, though that's rarely necessary. Hope this helps!"
      ],
      "after": [
        "Port 3000 is already taken, usually by an earlier `npm run dev` that never exited.",
        "Find it: `lsof -nP -iTCP:3000 -sTCP:LISTEN`. Kill it with `kill <pid>`, or start on another port with `PORT=3001 npm run dev`.",
        "Why it happens: the OS allows one listener per port, and Node exits instead of picking a neighbour. A dev server started in the background often outlives the terminal that launched it.",
        "Next: run the `lsof` line. Paste the PID if you want me to confirm it's the right process."
      ],
      "why": [
        "The skill says explain fully when asked to explain, so this one is allowed to be longer than the others, but the answer still arrives in the first line.",
        "The command comes before the theory; the theory is one paragraph, not four.",
        "It ends with a step that takes five seconds, not a closer."
      ],
      "rules": [
        1,
        3,
        10
      ]
    },
    {
      "id": "progress-update",
      "title": "A progress check",
      "kind": "ops",
      "prompt": [
        "Where are we on the CSV import?"
      ],
      "before": [
        "Lots of progress since the last update! I've been working through the import pipeline and it's coming together well.",
        "The parser is done, and I also added row validation which wasn't strictly in the original plan but seemed useful. There were a few edge cases with quoted commas that took longer than expected. The database writing is mostly there but I want to check the batching.",
        "Still to do: the dedupe pass and wiring up the route. After that, testing. It should be close, though I don't want to over-promise. Let me know if you want a more detailed breakdown."
      ],
      "after": [
        "Step 3 of 5 done. Parser, row validation, and batched writes are in; `import.test.ts` passes 12/12.",
        "1. Parse — done\n2. Validate rows — done\n3. Write to DB in batches of 500 — done\n4. Deduplicate by email — ~10 min left\n5. Wire the `/import` route — ~15 min",
        "Next: nothing needed from you. I'll report after step 5, about 25 min."
      ],
      "why": [
        "\"Step 3 of 5\" restates state in one phrase, which is the rule that matters most for working memory.",
        "The plan is the status; done and remaining are visually separate.",
        "It removes the need for a follow-up question by giving the next report time."
      ],
      "rules": [
        1,
        2,
        5,
        6,
        7
      ]
    },
    {
      "id": "destructive-cleanup",
      "title": "A destructive request",
      "kind": "ops",
      "prompt": [
        "Clean up the repo. Delete the old migrations that have already been applied."
      ],
      "before": [
        "Sure, I can help with cleanup. Deleting applied migrations is a reasonable way to reduce clutter.",
        "The migration files are in `db/migrations/`. I'd start by listing them and comparing against the migrations table in the database to see which ones have been applied. Then you can remove the corresponding files.",
        "Keep in mind that some teams prefer to keep all migrations for audit purposes, while others squash them periodically. Either approach works as long as the team agrees. I can go ahead and delete them if you confirm, or I can write a script that checks the migrations table first."
      ],
      "after": [
        "Not deleting yet: those files are what `migrate up` compares against. Removing applied migrations breaks the next deploy on any environment that hasn't run them.",
        "1. `git log --oneline -- db/migrations | head` — confirm they're committed (10 sec)\n2. Tell me which environments have applied them\n3. I'll squash them into a baseline migration instead",
        "Next: answer step 2. Or say `force delete` if you want the files removed anyway."
      ],
      "why": [
        "The skill's destructive-action exception: confirm before doing damage, and say why in the same breath.",
        "The safer alternative is proposed rather than just refused.",
        "The escape hatch is explicit, so the reader stays in control with a two-word reply."
      ],
      "rules": [
        1,
        2,
        4,
        6,
        8
      ]
    }
  ]
};
