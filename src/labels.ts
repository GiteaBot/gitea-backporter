import { fetchMergedWithLabel, removeLabel } from "./github.ts";

export const run = async () => {
  const labelsToRemoveAfterMerge = [
    "reviewed/wait-merge",
    "reviewed/prioritize-merge",
  ];
  await removeLabelsFromMergedPr(labelsToRemoveAfterMerge);
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
