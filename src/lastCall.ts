import {
  addComment,
  addLabels,
  closePr,
  fetchOpenPrsWithLabel,
} from "./github.ts";

export const run = async () => {
  // get all issues with the label "pr/last-call"
  const issuesWithStatusPrLastCall = await fetchOpenPrsWithLabel(
    "pr/last-call",
  );
  return Promise.all(issuesWithStatusPrLastCall.items.map(handlePr));
};

// close PR if two weeks have passed since it was last updated. Remind TOC if one week has passed
const handlePr = async (pr: {
  number: number;
  updated_at: string;
  labels: { name: string }[];
}) => {
  const lastPrUpdateTime = new Date(pr.updated_at).getTime();
  const oneWeekAgo = (new Date(Date.now() - 1000 * 60 * 60 * 24 * 7))
    .getTime();

  if (
    lastPrUpdateTime < oneWeekAgo &&
    pr.labels.some((l) => l.name === "lgtm/need 1") &&
    !pr.labels.some((l) => l.name === "giteabot/toc-reminded")
  ) {
    console.log(`Reminding PR #${pr.number} due to pr/last-call timeout`);
    await addComment(
      pr.number,
      "This pull request has a last call and has not had any activity in the past week. @go-gitea/technical-oversight-committee please review this pull request and either merge it or request a review from a maintainer. :tea:",
    );
    await addLabels(pr.number, ["giteabot/toc-reminded"]);
    return;
  }

  const twoWeeksAgo = (new Date(Date.now() - 1000 * 60 * 60 * 24 * 14))
    .getTime();

  if (lastPrUpdateTime < twoWeeksAgo) {
    console.log(`Closing PR #${pr.number} due to pr/last-call timeout`);
    await addComment(
      pr.number,
      "This pull request has a last call and has not had any activity in the past two weeks. Consider it to be a [polite refusal](https://github.com/go-gitea/gitea/blob/main/CONTRIBUTING.md#final-call). :tea:",
    );

    // close PR
    await closePr(pr.number);
  }
};
