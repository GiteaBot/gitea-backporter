import { fetchPendingMerge, updatePr } from "./github.ts";
export const run = async () => {
  // fetch all PRs that are pending merge
  const pendingMerge = await fetchPendingMerge();

  // take the first PR in each milestone
  const milestoneToPr = new Map();
  for (const pr of pendingMerge.items) {
    if (!milestoneToPr.has(pr.milestone.title)) {
      milestoneToPr.set(pr.milestone.title, pr);
    }
  }

  // update the PRs
  const prs = Array.from(milestoneToPr.values());
  return Promise.all(prs.map(async (pr: { number: number }) => {
    const response = await updatePr(pr.number);
    if (response.ok) {
      console.info(`Synced PR #${pr.number} in merge queue`);
    } else {
      console.error(`Failed to sync PR #${pr.number} in merge queue`);
      console.error(await response.text());
    }
  }));
};
