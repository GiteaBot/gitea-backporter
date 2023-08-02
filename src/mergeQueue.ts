import {
  addComment,
  fetchPendingMerge,
  removeLabel,
} from "./github.ts";
import * as prActions from "./prActions.ts";
import { debounce } from "https://deno.land/std@0.189.0/async/mod.ts";

const updateBranch = async () => {
  // fetch all PRs that are pending merge
  const pendingMerge = await fetchPendingMerge();

  // update all PRs pending merge (only if they need an update)
  for (const pr of pendingMerge.items) {
    const err = await prActions.updateBranch(pr)

    if (err?.message == "merge conflicts in PR") {
      // if there is a merge conflict, we'll remove the reviewed/wait-merge label
      await removeLabel(pr.number, "reviewed/wait-merge")
    }
  }
};

// make sure we don't trigger too often
export const run = debounce(updateBranch, 8000);
