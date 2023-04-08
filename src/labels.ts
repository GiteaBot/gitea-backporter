import {
  fetchMergedWithReviewedWaitMerge,
  removeReviewedWaitMergeLabel,
} from "./github.ts";

export const run = async () => {
  const prsThatAreMergedAndHaveTheReviewedWaitMergeLabel =
    await fetchMergedWithReviewedWaitMerge();
  await Promise.all(
    prsThatAreMergedAndHaveTheReviewedWaitMergeLabel.items.map(remove),
  );
};

const remove = async (pr: { title: string; number: number }) => {
  const response = await removeReviewedWaitMergeLabel(pr.number);
  if (response.ok) {
    console.log(`Removed reviewed/wait-merge from ${pr.title} (#${pr.number})`);
  } else {
    console.error(
      `Failed to remove reviewed/wait-merge from ${pr.title} (#${pr.number})`,
    );
    console.error(await response.text());
  }
};
