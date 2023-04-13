import { SemVer } from "https://deno.land/std@0.183.0/semver/mod.ts";

export class GiteaVersion {
  majorMinorVersion: string;
  milestoneNumber: number;

  constructor(milestone: { title: string; number: number }) {
    const semver = new SemVer(milestone.title);
    this.majorMinorVersion = `${semver.major}.${semver.minor}`;
    this.milestoneNumber = milestone.number;
  }
}
