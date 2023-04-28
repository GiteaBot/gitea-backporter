export const getPrBranchName = (
  prNumber: number,
  giteaMajorMinorVersion: string,
) => `backport-${prNumber}-v${giteaMajorMinorVersion}`;

export const initializeGitRepo = async (user: string, email: string | null) => {
  const clone = new Deno.Command("git", {
    args: [
      "clone",
      `https://${Deno.env.get("BACKPORTER_GITHUB_TOKEN")}@github.com/${
        Deno.env.get("BACKPORTER_GITEA_FORK")
      }.git`,
      "gitea",
    ],
  });
  await clone.output();
  const upstream = new Deno.Command("git", {
    cwd: "gitea",
    args: [
      "remote",
      "add",
      "upstream",
      "https://github.com/go-gitea/gitea.git",
    ],
  });
  await upstream.output();

  // set the user name and email
  const configName = new Deno.Command("git", {
    cwd: "gitea",
    args: ["config", "user.name", user],
  });
  await configName.output();
  // the email might be null if the token doesn't have the user scope,
  // see https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user
  if (!email) {
    email = "teabot@gitea.io";
  }
  const configEmail = new Deno.Command("git", {
    cwd: "gitea",
    args: ["config", "user.email", email],
  });
  await configEmail.output();
};

export const cherryPickPr = async (
  commitHash: string,
  prNumber: number,
  giteaMajorMinorVersion: string,
): Promise<boolean> => {
  // fetch the upstream main branch
  const fetchMain = new Deno.Command("git", {
    cwd: "gitea",
    args: ["fetch", "upstream", "main"],
  });
  await fetchMain.output();

  // fetch the upstream release branch
  const fetchRelease = new Deno.Command("git", {
    cwd: "gitea",
    args: ["fetch", "upstream", `release/v${giteaMajorMinorVersion}`],
  });
  await fetchRelease.output();

  // create the backport branch from the upstream release branch
  const checkout = new Deno.Command("git", {
    cwd: "gitea",
    args: [
      "checkout",
      `upstream/release/v${giteaMajorMinorVersion}`,
      "-b",
      getPrBranchName(prNumber, giteaMajorMinorVersion),
    ],
  });
  await checkout.output();

  // cherry-pick the PR
  const cherryPick = new Deno.Command("git", {
    cwd: "gitea",
    args: ["cherry-pick", commitHash],
  });
  const cherryPickStatus = await cherryPick.output();

  if (!cherryPickStatus.success) {
    const abort = new Deno.Command("git", {
      cwd: "gitea",
      args: ["cherry-pick", "--abort"],
    });
    await abort.output();
    return false;
  }

  // push the branch to the fork
  const push = new Deno.Command("git", {
    cwd: "gitea",
    args: ["push", "origin", getPrBranchName(prNumber, giteaMajorMinorVersion)],
  });
  await push.output();
  return true;
};
