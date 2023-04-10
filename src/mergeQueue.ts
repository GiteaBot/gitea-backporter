import { fetchPendingMerge, updatePr } from "./github.ts";
export const run = async () => {
  // fetch all PRs that are pending merge
  const pendingMerge = await fetchPendingMerge();

  // these are sorted by descending PR number, take the first 3 and update them
  const prs = pendingMerge.items.slice(0, 3);
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
