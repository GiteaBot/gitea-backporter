import { cherryPickPr, initializeGitRepo } from "./git.ts";
import { GiteaVersion } from "./giteaVersion.ts";
import {
  addLabels,
  addPrComment,
  backportPrExists,
  createBackportPr,
  fetchCandidates,
  fetchPr,
  getMilestones,
} from "./github.ts";

const run = async () => {
  if (
    Deno.env.get("BACKPORTER_GITEA_FORK") === undefined ||
    Deno.env.get("BACKPORTER_GITHUB_TOKEN") === undefined
  ) {
    console.log(
      "BACKPORTER_GITEA_FORK and BACKPORTER_GITHUB_TOKEN must be set",
    );
    return;
  }
  await initializeGitRepo();
  const milestones = await getMilestones();
  for (const milestone of milestones) {
    console.log(`Processing milestone ${milestone.title}`);
    const giteaVersion = new GiteaVersion(milestone);
    const candidates = await fetchCandidates(giteaVersion.majorMinorVersion);
    for (const candidate of candidates.items) {
      console.log("Parsing #" + candidate.number);
      await parseCandidate(candidate, giteaVersion);
    }
  }
};

const parseCandidate = async (candidate, giteaVersion: GiteaVersion) => {
  if (await backportPrExists(candidate, giteaVersion.majorMinorVersion)) {
    console.log(`Backport PR already exists for #${candidate.number}`);
    return;
  }
  const originalPr = await fetchPr(candidate.number);
  console.log(`Cherry-picking #${originalPr.number}`);
  const success = await cherryPickPr(
    originalPr.merge_commit_sha,
    originalPr.number,
    giteaVersion.majorMinorVersion,
  );

  if (!success) {
    await addPrComment(
      originalPr.number,
      `I was unable to create a backport for ${giteaVersion.majorMinorVersion}. @${originalPr.user.login}, please send one manually. :tea:`,
    );
    await addLabels(
      originalPr.number,
      ["backport/manual"],
    );
    return;
  }

  console.log(`Creating backport PR for #${originalPr.number}`);
  await createBackportPr(originalPr, giteaVersion);
};

run();
