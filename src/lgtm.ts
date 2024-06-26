import {
  addLabels,
  getPrReviewers,
  removeLabel,
  setCommitStatus,
} from "./github.ts";

// given a pr number, set its lgtm status check and lgtm label
export const setPrStatusAndLabel = async (
  pr: {
    labels: { name: string }[];
    head: { sha: string };
    title: string;
    number: number;
    requested_reviewers: { login: string }[];
  },
) => {
  let reviewers;
  try {
    reviewers = await getPrReviewers(pr);
  } catch (error) {
    console.error(error);
    return;
  }

  const { state, message, desiredLabel } = getPrStatusAndLabel(reviewers);
  const currentLgtmLabels = pr.labels.filter((l) => l.name.startsWith("lgtm/"));

  // remove any undesired lgtm labels
  await Promise.all(
    currentLgtmLabels.filter((l) => l.name !== desiredLabel).map(
      async (label) => {
        const response = await removeLabel(pr.number, label.name);
        if (response.ok) {
          console.info(
            `Removed ${label.name} from "${pr.title}" (#${pr.number})`,
          );
        } else {
          console.error(
            `Failed to remove ${label.name} from "${pr.title}" (#${pr.number})`,
          );
          console.error(await response.text());
        }
      },
    ),
  );

  // add desired label if it's not there
  if (!currentLgtmLabels.some((label) => label.name === desiredLabel)) {
    await addLabels(pr.number, [desiredLabel]);
  }

  // set commit status
  const response = await setCommitStatus(pr.head.sha, state, message);
  if (response.ok) {
    console.info(
      `Set commit status in "${pr.title}" (#${pr.number})`,
    );
  } else {
    console.error(
      `Failed to set commit status in  "${pr.title}" (#${pr.number})`,
    );
    console.error(await response.text());
  }
};

// returns the status, message, and label for a given number of approvals
export const getPrStatusAndLabel = (
  reviewers: { approvers: Set<string>; blockers: Set<string> },
) => {
  let desiredLabel = "lgtm/need 2";
  let message = "Needs two more approvals";
  let state: "pending" | "success" | "failure" = "pending";

  if (reviewers.blockers.size > 0) {
    desiredLabel = "lgtm/blocked";
    message = "Blocked by " + Array.from(reviewers.blockers).join(", ");
    state = "failure";
    return { state, message, desiredLabel };
  }

  if (reviewers.approvers.size === 1) {
    desiredLabel = "lgtm/need 1";
    message = "Needs one more approval";
  }

  if (reviewers.approvers.size >= 2) {
    desiredLabel = "lgtm/done";
    message = `Approved by ${reviewers.approvers.size} people`;
    state = "success";
  }

  return { state, message, desiredLabel };
};
