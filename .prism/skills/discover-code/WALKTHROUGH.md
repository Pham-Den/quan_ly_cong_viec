# How to use — step by step (what to type, what to use)

> For the end user. Describes the **target** UX after building per `PLAN.md`. Conventions:
> **[You type]** = you input into the AI tool · **[AI does]** = the agent does it itself · **[AI asks → you answer]** = the agent asks, you decide.
>
> "AI tool" here = Claude Code (or equivalent) with PRISM + the `discover-code` skill installed.

---

## Preparation (one time)

1. Have ready: the old code repo; put any old documentation in **`docs/legacy/`** (the default — or just tell the AI where it is). Fine without docs; the AI asks if it's unsure where they are.
2. **[You type]** in the repo terminal: `./setup.sh` → choose **guided**.
   → creates `.prism/`, `prism-config.md`, the `docs/` skeleton. (Living Truth is still empty.)

---

## Step 0 — Determine Type 1 or Type 2

**[You type]** to the AI:
> "Scan the shell of this codebase, build the Map and tell me the scale — should I go Type 1 (rebuild full) or Type 2 (incremental)?"

**[AI does]** runs `discover-code shell` → produces the **Map** (list of areas + paths, very cheap) → estimates the scale.
**[AI asks → you answer]** "The system is ~Xk LOC, Y areas. Proposing Type {1|2}. Agree?"

> Coarse rule: if the **entire** LT can be rebuilt in a few rounds → **Type 1**; too large → **Type 2**.

---

## Type 1 — Just-small-enough code (build full then run as greenfield)

1. **[You type]:** "discover-code full whole system — build the full product + architecture + design into the inbox."
   - **[AI does]** runs multiple rounds, writes the documentation into `docs/inbox/`, **with `path:line` citations**.
   - **[AI asks → you answer]** for the intent parts not in the code (KPI/persona/rationale): answer, or type **"skip"** if you don't remember (the AI records `TBD`, does not fabricate).
2. **[You type]:** "onboard the whole codebase into PRISM."
   - **[AI does]** opens one whole-repo reflect sprint (v1), synthesizes the inbox into proposals, validates, and seals into LT via the normal seal pipeline (safe at t=0 — no concurrency; not a direct write).
3. **Done.** From now on work **exactly like a new project**:
   - **[You type]:** "start product: add feature X" → PRISM runs guided normally (no longer touches code).

---

## Type 2 — Large code (incremental, done per requirement)

No need to onboard the whole system. For each requirement, do as follows:

### Case A — Add a NEW feature, independent of the old code
Example: "add sending SMS when an order completes" (SMS only *also* runs at that point, does not modify email).

1. **[You type]:** "start product: add sending SMS when an order completes."
2. **[AI does]** looks up the Map → sees this is **independent** work → reads the notification code *temporarily* to plug SMS into the right place; **does not onboard email**.
3. **[AI does]** writes `FR [to-build]` → you approve each phase: **[You type]** "approve product" → "approve arch" → … → "approve implement" (seal).

→ Exactly like normal PRISM. The old code (email) still stays as-is in the Map.

### Case B — MODIFY / REMOVE old code that has no documentation yet (2 sprints: reflect → act)
Example: "change email from SendGrid to SES" (or "drop email, SMS only").

1. **[You type]:** "start product: change email to SES."
2. **[AI asks → you answer]** the AI looks up the Map, sees you are *modifying* email (not yet governed), so it shows:
   > "Email sending already exists (`notifications/email.py:30`, SendGrid). This is modifying something that is running → need to **record the current state (reflect) first**. OK?"
   → **[You type]** "ok".
3. **Reflect sprint** (the AI opens a `kind: reflect` sprint itself):
   - **[AI does]** `discover-code full` on the email slice + **examines all related places** (who triggers it, who depends on it).
   - **[AI asks → you answer]** if it finds an unclear dependent:
     > "report reads the `email_log` table — onboard report too / or commit to keeping the log schema unchanged?"
     → **[You type]** "keep the schema unchanged".
   - **[You type]** approve: "approve product/arch/…" → "approve implement" (seal). **Email is now in Living Truth.**
4. **Act sprint** (a normal sprint):
   - **[You type]:** "new sprint" → "start change: switch EmailSender to SES, keep the email_log schema."
   - Go through plan/test/implement → **[You type]** "approve implement" (seal). Done.

### Next time you touch an already-onboarded area again
- **[You type]** the requirement normally → **[AI does]** sees the area is already in Living Truth → **uses the docs, does not re-read the code**.

---

## Summary "what to type when"

| Situation | You type |
|---|---|
| Setup | `./setup.sh` (guided) |
| See the scale | "discover-code shell + propose Type 1/2" |
| Type 1 | "discover-code full whole system" → one whole-repo reflect sprint (seal) → then `start product` like greenfield |
| Type 2 — add new independent | `start product: <new work>` → approve… |
| Type 2 — modify/remove old code | `start product: <what to change>` → "ok" reflect → approve (seal) → `new sprint` → `start change:` → approve (seal) |
| Don't remember the intent | "skip" |
| Already-onboarded area | type the requirement normally |

> You mostly just **state the requirement + answer questions + type approve**. Reading code, recording as-built, opening the reflect sprint is **handled by AI/PRISM itself**.
