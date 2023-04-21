import { fetchPendingMerge, needsUpdate, updatePr } from "./github.ts";
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
      } else {
        console.error(`Failed to sync PR #${pr} in merge queue`);
        console.error(await response.text());
      }
    }
  }
};
