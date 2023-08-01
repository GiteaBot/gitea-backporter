import { addComment, needsUpdate, removeLabel, updatePr } from "./github.ts";
import { debounce } from "https://deno.land/std@0.189.0/async/mod.ts";

const execute = async (
  label: string,
  pr: { number: number; user: { login: string } },
) => {
  switch (label) {
    case "giteabot/update-branch":
      await updateBranch(pr);
  }
};

const updateBranch = async (
  pr: { number: number; user: { login: string } },
) => {
  await removeLabel(pr.number, "giteabot/update-branch");
  if (await needsUpdate(pr.number)) {
    const response = await updatePr(pr.number);
    if (response.ok) {
      console.info(`Synced PR #${pr.number} as requested by a maintainer`);
      return;
    }

    const body = await response.json();
    if (body.message !== "merge conflict between base and head") {
      console.error(
        `Failed to sync PR #${pr.number} as requested by maintainer`,
      );
      console.error(JSON.stringify(body));
      await addComment(
        pr.number,
        `Failed to update branch :tea:`,
      );
      return;
    }

    console.info(
      `Merge conflict detected in PR #${pr.number}`,
    );
    // if there is a merge conflict, we'll add a comment to fix the conflicts
    await addComment(
      pr.number,
      `@${pr.user.login} please fix the merge conflicts. :tea:`,
    );
  }
};

// make sure we don't trigger too often
export const run = debounce(execute, 8000);
