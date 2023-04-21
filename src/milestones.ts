import * as SemVer from "https://deno.land/std@0.184.0/semver/mod.ts";
import { fetchGiteaVersions } from "./giteaVersion.ts";
import * as github from "./github.ts";

// given a PR number, set the milestone of the PR according to its base branch
export const assign = async (prNumber: number) => {
  // fetch the PR and current gitea versions
  const [pr, giteaVersions] = await Promise.all([
    github.fetchPr(prNumber),
    fetchGiteaVersions(),
  ]);

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
    prNumber,
    giteaVersion!.milestoneNumber,
  );
  if (!response.ok) {
    console.error(
      `Failed to set milestone ${giteaVersion.majorMinorVersion} for PR #${prNumber}`,
    );
    console.error(await response.text());
    return;
  }
  console.log(
    `Set milestone ${giteaVersion.majorMinorVersion} for PR #${prNumber}`,
  );
};
