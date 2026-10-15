// The content panel edits files directly in local mode, which only makes sense on a developer machine.
// On deployments it is available only in GitHub mode (commits through the Keystatic GitHub App).
export const keystaticEnabled = process.env.NODE_ENV !== "production" || !!process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO;
