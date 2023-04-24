import * as drone from "./drone.ts";

// stops all builds currently running on the given pull request except the one
// with the current head
export const stopOldBuilds = async (
  pr: { number: number; head: { sha: string } },
): Promise<void> => {
  const builds: {
    status: string;
    ref: string;
    after: string;
    number: number;
  }[] = await drone.listBuilds();

  await Promise.all(
    builds.filter((build) =>
      build.status === "running" &&
      build.ref === `refs/pull/${pr.number}/head` &&
      build.after !== pr.head.sha
    ).map((build) => drone.stopBuild(build.number)),
  );
};
