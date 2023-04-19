import { fetchMergedWithLabel, fetchTargeting, removeLabel } from "./github.ts";
import { fetchGiteaVersions } from "./giteaVersion.ts";

export const run = async () => {
  const labelsToRemoveAfterMerge = [
    "reviewed/wait-merge",
    "reviewed/prioritize-merge",
  ];
  await Promise.all([
    removeLabelsFromMergedPr(labelsToRemoveAfterMerge),
    removeBackportLabelsFromPrsTargetingReleaseBranches(),
  ]);
};

const removeLabelFromMergedPr = async (
  pr: { title: string; number: number },
  label: string,
) => {
  const response = await removeLabel(pr.number, label);
  if (response.ok) {
    console.info(`Removed ${label} from "${pr.title}" (#${pr.number})`);
  } else {
    console.error(
      `Failed to remove ${label} from "${pr.title}" (#${pr.number})`,
    );
    console.error(await response.text());
  }
};

const removeLabelsFromMergedPr = (labels: string[]) => {
  return Promise.all(labels.map(async (label) => {
    const prsThatAreMergedAndHaveTheLabel = await fetchMergedWithLabel(label);
    return Promise.all(
      prsThatAreMergedAndHaveTheLabel.items.map(
        (pr: { title: string; number: number }) =>
          removeLabelFromMergedPr(pr, label),
      ),
    );
  }));
};

// for each gitea version, fetch all PRs that target that version and remove the
// backport/* labels from them
export const removeBackportLabelsFromPrsTargetingReleaseBranches = async () => {
  const giteaVersions = await fetchGiteaVersions();
  // versions
  return Promise.all(giteaVersions.map(async (version) => {
    const prs = await fetchTargeting(`release/v${version.majorMinorVersion}`);
    // PRs
    return removeBackportLabelsFromPrs(prs.items);
  }));
};

// given a list of PRs, removes the backport/* labels from them
export const removeBackportLabelsFromPrs = (prs) => {
  const promises = prs.flatMap((pr: {
    title;
    labels;
    number: number;
  }) => {
    const backportLabels = pr.labels.filter((label: { name: string }) =>
      label.name.startsWith("backport/")
    );

    return backportLabels.map(async (label: { name: string }) => {
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
    });
  });

  return Promise.all(promises);
};
