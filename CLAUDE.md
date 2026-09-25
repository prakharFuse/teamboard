# Code Review Rules

## Mandatory artifacts (review-enforced)

- **Every PR MUST add an entry to `RELEASE_NOTES.md`**: add a single
  bullet under the `## Unreleased` heading describing the change. A PR
  that does not modify `RELEASE_NOTES.md` must be REJECTED on review —
  cite `RELEASE_NOTES.md` as the file to fix.

*(Planted by j06.2 to force a deterministic iteration-1 rejection. The
file is pre-created below so the edit-only fixer can append to it rather
than create it. Both removed in test cleanup.)*
