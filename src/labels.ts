import {
  addLabels,
  fetchBreakingWithoutLabel,
  fetchMergedWithLabel,
  fetchTargeting,
  removeLabel,
} from "./github.ts";
import { fetchGiteaVersions } from "./giteaVersion.ts";
import { debounce } from "https://deno.land/std@0.188.0/async/mod.ts";

// a relevant label is one that is used to control the merge queue,
// manage backports or any other label that causes the bot to act on
// detection, such as reviewed/* or backport/*
export const isRelevantLabel = (label: string): boolean => {
  return label.startsWith("reviewed/") || label.startsWith("backport/");
};

const maintain = async () => {
  const labelsToRemoveAfterMerge = [
    "reviewed/wait-merge",
    "reviewed/prioritize-merge",
  ];
  await Promise.all([
    removeLabelsFromMergedPr(labelsToRemoveAfterMerge),
    removeBackportLabelsFromPrsTargetingReleaseBranches(),
    addKindBreakingToBreakingPrs(),
  ]);
};

// add kind/breaking to all breaking PRs that don't have it
const addKindBreakingToBreakingPrs = async () => {
  const breakingPrs = await fetchBreakingWithoutLabel();
  return Promise.all(breakingPrs.items.map(async (pr: { number: number }) => {
    await addLabels(pr.number, ["kind/breaking"]);
  }));
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
  return Promise.all(prs.flatMap((pr: {
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
  }));
};

// make sure we don't trigger too often
export const run = debounce(maintain, 8000);
