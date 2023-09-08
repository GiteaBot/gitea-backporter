import { addComment, closeIssue, fetchOpenIssuesWithLabel } from "./github.ts";

export const run = async () => {
  // get all issues with the label "status/needs-feedback"
  const issuesWithStatusNeedsFeedback = await fetchOpenIssuesWithLabel(
    "status/needs-feedback",
  );
  return Promise.all(issuesWithStatusNeedsFeedback.items.map(handleIssue));
};

// close issue if a month has passed since it was last updated
const handleIssue = async (issue: {
  number: number;
  updated_at: string;
}) => {
  const oneMonthAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  if (new Date(issue.updated_at) < oneMonthAgo) {
    console.log(`Closing issue #${issue.number} due to feedback timeout`);
    await addComment(
      issue.number,
      `We close issues that need feedback from the author if there were no new comments for a month. :tea:`,
    );

    // close issue
    await closeIssue(issue.number);
  }
};
