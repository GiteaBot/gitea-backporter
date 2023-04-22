import {
  addLabels,
  getPrApprovalNumber,
  removeLabel,
  setCommitStatus,
} from "./github.ts";

// given a pr number, set its lgtm status check
export const setPrStatus = async (
  pr: {
    head: { sha: string };
    title: string;
    number: number;
  },
) => {
  let approvals;
  try {
    approvals = await getPrApprovalNumber(pr.number);
  } catch (error) {
    console.error(error);
    return;
  }

  let message = "Needs two more approvals";
  let state: "pending" | "success" = "pending";
  if (approvals === 1) message = "Needs one more approval";
  if (approvals >= 2) {
    message = "Approved";
    state = "success";
  }

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

// given a pr, set its lgtm label
export const setPrLabel = async (pr: {
  labels: { name: string }[];
  head: { sha: string };
  title: string;
  number: number;
}) => {
  let approvals;
  try {
    approvals = await getPrApprovalNumber(pr.number);
  } catch (error) {
    console.error(error);
    return;
  }

  let desiredLabel = "lgtm/need 2";
  if (approvals === 1) desiredLabel = "lgtm/need 1";
  if (approvals >= 2) desiredLabel = "lgtm/done";

  const currentLgtmLabels = pr.labels.filter((l) => l.name.startsWith("lgtm/"));
  // remove any undesired labels
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
};
