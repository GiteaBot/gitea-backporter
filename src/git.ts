export const getPrBranchName = (
  prNumber: number,
  giteaMajorMinorVersion: string,
) => `backport-${prNumber}-v${giteaMajorMinorVersion}`;

export const initializeGitRepo = async (user: string, email: string | null) => {
  await Deno.run({
    cmd: [
      "git",
      "clone",
      `https://${Deno.env.get("BACKPORTER_GITHUB_TOKEN")}@github.com/${
        Deno.env.get("BACKPORTER_GITEA_FORK")
      }.git`,
    ],
  }).status();
  await Deno.run({
    cwd: "gitea",
    cmd: [
      "git",
      "remote",
      "add",
      "upstream",
      "https://github.com/go-gitea/gitea.git",
    ],
  }).status();

  // set the user name and email
  await Deno.run({
    cwd: "gitea",
    cmd: ["git", "config", "user.name", user],
  }).status();
  // the email might be null if the token doesn't have the user scope,
  // see https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user
  if (!email) {
    email = "teabot@gitea.io";
  }
  await Deno.run({
    cwd: "gitea",
    cmd: ["git", "config", "user.email", email],
  }).status();
};

export const cherryPickPr = async (
  commitHash: string,
  prNumber: number,
  giteaMajorMinorVersion: string,
): Promise<boolean> => {
  // fetch the upstream main branch
  await Deno.run({
    cwd: "gitea",
    cmd: ["git", "fetch", "upstream", "main"],
  }).status();

  // fetch the upstream release branch
  await Deno.run({
    cwd: "gitea",
    cmd: ["git", "fetch", "upstream", `release/v${giteaMajorMinorVersion}`],
  }).status();

  // create the backport branch from the upstream release branch
  await Deno.run({
    cwd: "gitea",
    cmd: [
      "git",
      "checkout",
      `upstream/release/v${giteaMajorMinorVersion}`,
      "-b",
      getPrBranchName(prNumber, giteaMajorMinorVersion),
    ],
  }).status();

  console.log(`Cherry-picking ${commitHash}`);

  // cherry-pick the PR
  const cherryPickStatus = await Deno.run({
    cwd: "gitea",
    cmd: ["git", "cherry-pick", commitHash],
  }).status();

  if (!cherryPickStatus.success) {
    console.log("Cherry-pick failed");
    await Deno.run({
      cwd: "gitea",
      cmd: ["git", "cherry-pick", "--abort"],
    }).status();
    return false;
  }

  // push the branch to the fork
  await Deno.run({
    cwd: "gitea",
    cmd: [
      "git",
      "push",
      "origin",
      getPrBranchName(prNumber, giteaMajorMinorVersion),
    ],
  }).status();
  return true;
};
