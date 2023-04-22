import {
  addPrComment,
  fetchPendingMerge,
  needsUpdate,
  removeLabel,
  updatePr,
} from "./github.ts";
export const run = async () => {
  // fetch all PRs that are pending merge
  const pendingMerge = await fetchPendingMerge();

  // group PRs by milestone
  const milestoneToPr = new Map<string, number[]>();
  for (const pr of pendingMerge.items) {
    const milestone = pr.milestone?.title;
    const prs = milestoneToPr.get(milestone) ?? [];
    prs.push(pr.number);
    milestoneToPr.set(milestone, prs);
  }

  // for each milestone, try to update the lowest PR number (only if it needs an update), if it fails, try the next one
  for (const [_, prs] of milestoneToPr) {
    for (const pr of prs) {
      if (!await needsUpdate(pr)) break;
      const response = await updatePr(pr);
      if (response.ok) {
        console.info(`Synced PR #${pr} in merge queue`);
        break;
      }

      const body = await response.json();
      if (body.message !== "merge conflict between base and head") {
        console.error(`Failed to sync PR #${pr} in merge queue`);
        console.error(JSON.stringify(body));
      }

      console.info(`Merge conflict detected in PR #${pr} in merge queue`);
      // if there is a merge conflict, we'll add a comment to fix the conflicts and remove the reviewed/wait-merge label
      await Promise.all([
        addPrComment(pr, "Please fix the merge conflicts. :tea:"),
        removeLabel(pr, "reviewed/wait-merge"),
      ]);
    }
  }
};
