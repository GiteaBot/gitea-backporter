import * as SemVer from "https://deno.land/std@0.187.0/semver/mod.ts";
import { fetchGiteaVersions } from "./giteaVersion.ts";
import * as github from "./github.ts";

// given a PR number, set the milestone of the PR according to its base branch
export const assign = async (pr: { number: number; base: { ref: string } }) => {
  // fetch the current gitea versions
  const giteaVersions = await fetchGiteaVersions();

  // find the gitea version that matches the PR's base branch
  let giteaVersion = giteaVersions.find((version) =>
    pr.base.ref === `release/v${version.majorMinorVersion}`
  );

  // if no gitea version is found, the PR is targeting the main branch. We
  // will use the gitea version with the highest major and minor version using
  // Deno's semver library (gt function)
  if (!giteaVersion) {
    giteaVersion = giteaVersions.reduce((highest, version) => {
      if (
        SemVer.gt(
          `${version.majorMinorVersion}.0`,
          `${highest.majorMinorVersion}.0`,
        )
      ) {
        return version;
      }
      return highest;
    }, giteaVersions[0]);
  }

  const response = await github.setMilestone(
    pr.number,
    giteaVersion!.milestoneNumber,
  );
  if (!response.ok) {
    console.error(
      `Failed to set milestone ${giteaVersion.majorMinorVersion} for PR #${pr.number}`,
    );
    console.error(await response.text());
    return;
  }
  console.log(
    `Set milestone ${giteaVersion.majorMinorVersion} for PR #${pr.number}`,
  );
};

export const run = async () => {
  await removeMilestonesFromUnmergedClosedPrs();
};

// removes milestones from all PRs that are closed and unmerged
const removeMilestonesFromUnmergedClosedPrs = async () => {
  // get the current open milestones
  const milestones = await github.getMilestones();

  // for each milestone, fetch the PRs that are closed and included in the milestone
  // and remove the milestone each PR
  return Promise.all(milestones.flatMap(async (m) => {
    const prs = await github.fetchUnmergedClosedWithMilestone(m.title);
    return prs.items.map(async (pr) => {
      const response = await github.removeMilestone(pr.number);
      if (!response.ok) {
        console.error(
          `Failed to remove milestone from closed PR #${pr.number}`,
        );
        console.error(await response.text());
        return;
      }
      console.log(`Removed milestone from closed PR #${pr.number}`);
    });
  }));
};
