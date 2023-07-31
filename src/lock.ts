import { addComment, fetchClosedOldIssuesAndPRs, lockIssue } from "./github.ts";

const MILLISECONDS_IN_A_MONTH = 1000 * 60 * 60 * 24 * 30;

// adds a comment and locks old issues and PRs
export const run = async () => {
  const oneMonthAgo = new Date(Date.now() - MILLISECONDS_IN_A_MONTH);
  const threeMonthsAgo = new Date(Date.now() - MILLISECONDS_IN_A_MONTH * 3);
  const issues = await fetchClosedOldIssuesAndPRs(threeMonthsAgo);
  return Promise.all(
    issues.items.map(
      async (
        issue: {
          number: number;
          pull_request?: { url: string };
          updated_at: string;
        },
      ) => {
        const lockedSuccessfully = await lockIssue(issue.number, "resolved");

        // if the issue was updated in the last month, we add a comment
        if (lockedSuccessfully && new Date(issue.updated_at) > oneMonthAgo) {
          await addComment(
            issue.number,
            `We lock ${
              issue.pull_request ? "pull request" : "issue"
            }s 3 months after they were closed. If there's any need for further discussion, please open a new issue. :tea:`,
          );
        }
      },
    ),
  );
};
