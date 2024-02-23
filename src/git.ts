import * as cmd from "./cmd.ts";

export const getPrBranchName = (
  prNumber: number,
  giteaMajorMinorVersion: string,
) => `backport-${prNumber}-v${giteaMajorMinorVersion}`;

export const initializeGitRepo = async (user: string, email: string | null) => {
  await cmd.run("git", {
    args: [
      "clone",
      `https://${Deno.env.get("BACKPORTER_GITHUB_TOKEN")}@github.com/${
        Deno.env.get("BACKPORTER_GITEA_FORK")
      }.git`,
      "gitea",
    ],
  });
  await cmd.run("git", {
    cwd: "gitea",
    args: [
      "remote",
      "add",
      "upstream",
      "https://github.com/go-gitea/gitea.git",
    ],
  });

  // set the user name and email
  await cmd.run("git", {
    cwd: "gitea",
    args: ["config", "user.name", user],
  });
  // the email might be null if the token doesn't have the user scope,
  // see https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user
  if (!email) {
    email = "teabot@gitea.io";
  }
  await cmd.run("git", {
    cwd: "gitea",
    args: ["config", "user.email", email],
  });
};

export const cherryPickPr = async (
  commitHash: string,
  prNumber: number,
  giteaMajorMinorVersion: string,
): Promise<boolean> => {
  // fetch the upstream main branch
  await cmd.run("git", {
    cwd: "gitea",
    args: ["fetch", "upstream", "main"],
  });

  // fetch the upstream release branch
  await cmd.run("git", {
    cwd: "gitea",
    args: ["fetch", "upstream", `release/v${giteaMajorMinorVersion}`],
  });

  // create the backport branch from the upstream release branch
  await cmd.run("git", {
    cwd: "gitea",
    args: [
      "checkout",
      `upstream/release/v${giteaMajorMinorVersion}`,
      "-b",
      getPrBranchName(prNumber, giteaMajorMinorVersion),
    ],
  });

  // cherry-pick the PR
  const cherryPickStatus = await cmd.run("git", {
    cwd: "gitea",
    args: ["cherry-pick", commitHash],
  });

  if (!cherryPickStatus.success) {
    console.error(
      "Cherry-pick failed:",
      cherryPickStatus.stdout,
      "\n",
      cherryPickStatus.stderr,
    );
    await cmd.run("git", {
      cwd: "gitea",
      args: ["cherry-pick", "--abort"],
    });
    return false;
  }

  // push the branch to the fork
  await cmd.run("git", {
    cwd: "gitea",
    args: ["push", "origin", getPrBranchName(prNumber, giteaMajorMinorVersion)],
  });
  return true;
};
