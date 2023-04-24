import {
  addLabels,
  getPrApprovers,
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
  },
) => {
  let approvers;
  try {
    approvers = await getPrApprovers(pr.number);
  } catch (error) {
    console.error(error);
    return;
  }

  const { state, message, desiredLabel } = getPrStatusAndLabel(approvers.size);
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
export const getPrStatusAndLabel = (approvals: number) => {
  let desiredLabel = "lgtm/need 2";
  let message = "Needs two more approvals";
  let state: "pending" | "success" = "pending";

  if (approvals === 1) {
    desiredLabel = "lgtm/need 1";
    message = "Needs one more approval";
  }
  if (approvals >= 2) {
    desiredLabel = "lgtm/done";
    message = "Approved";
    state = "success";
  }

  return { state, message, desiredLabel };
};
