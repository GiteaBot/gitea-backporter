import { addComment, closePr, fetchOpenPrsWithLabel } from "./github.ts";

export const run = async () => {
  // get all issues with the label "pr/last-call"
  const issuesWithStatusPrLastCall = await fetchOpenPrsWithLabel(
    "pr/last-call",
  );
  return Promise.all(issuesWithStatusPrLastCall.items.map(handlePr));
};

// close PR if two weeks have passed since it was last updated
const handlePr = async (pr: {
  number: number;
  updated_at: string;
}) => {
  const twoWeeksAgo = (new Date(Date.now() - 1000 * 60 * 60 * 24 * 14))
    .getTime();
  if ((new Date(pr.updated_at)).getTime() < twoWeeksAgo) {
    console.log(`Closing PR #${pr.number} due to pr/last-call timeout`);
    await addComment(
      pr.number,
      "This pull request has not had any activity in the past two weeks and is in https://github.com/go-gitea/gitea/labels/pr%2Flast-call state. Therefore, [it is politely refused](https://github.com/go-gitea/gitea/blob/main/CONTRIBUTING.md#final-call). :tea:",
    );

    // close PR
    await closePr(pr.number);
  }
};
