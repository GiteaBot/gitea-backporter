import { cherryPickPr, initializeGitRepo } from "./git.ts";
import { fetchGiteaVersions, GiteaVersion } from "./giteaVersion.ts";
import {
  addLabels,
  addPrComment,
  backportPrExists,
  createBackportPr,
  fetchCandidates,
  fetchPr,
} from "./github.ts";
import { bot } from "./user.ts";

let initialized = false;

export const run = async () => {
  if (!initialized) {
    await initializeGitRepo(bot.login, bot.email);
    initialized = true;
  }
  for (const giteaVersion of await fetchGiteaVersions()) {
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
