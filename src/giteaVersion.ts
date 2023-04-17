import { SemVer } from "https://deno.land/std@0.183.0/semver/mod.ts";
import { getMilestones } from "./github.ts";

export class GiteaVersion {
  majorMinorVersion: string;
  milestoneNumber: number;

  constructor(milestone: { title: string; number: number }) {
    const semver = new SemVer(milestone.title);
    this.majorMinorVersion = `${semver.major}.${semver.minor}`;
    this.milestoneNumber = milestone.number;
  }
}

// returns all gitea versions from the gitea repository milestones
export const fetchGiteaVersions = async (): Promise<GiteaVersion[]> => {
  const milestones = await getMilestones();
  return milestones.map((milestone) => new GiteaVersion(milestone));
};
