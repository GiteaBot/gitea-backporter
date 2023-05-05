import { assertEquals } from "https://deno.land/std@0.186.0/testing/asserts.ts";
import { fetchBranch, fetchPr, getPrReviewers } from "./github.ts";

Deno.test("getPrReviewers() returns the appropriate approvers", async () => {
  const prToApproversAndBlockers = {
    8346: { // note lafriks and guillep2k are requested reviewers so they don't count as approvers nor blockers
      approvers: new Set([
        "silverwind",
        "6543",
        "lunny",
        "techknowlogick",
        "zeripath",
        "sapk",
        "BaxAndrei",
      ]),
      blockers: new Set(["SuperSandro2000"]),
    },
    23993: {
      approvers: new Set(["delvh", "jolheiser"]),
      blockers: new Set<string>(),
    },
    24051: {
      approvers: new Set(["delvh", "silverwind"]),
      blockers: new Set<string>(),
    },
    24047: {
      approvers: new Set(["yardenshoham", "lunny"]),
      blockers: new Set<string>(),
    },
    24055: { approvers: new Set<string>(), blockers: new Set<string>() },
    24147: { // delvh approved and then self-requested review
      approvers: new Set<string>(),
      blockers: new Set<string>(),
    },
    24254: {
      approvers: new Set(["jolheiser", "yardenshoham"]),
      blockers: new Set<string>(),
    },
    24259: {
      approvers: new Set(["jolheiser", "delvh"]),
      blockers: new Set<string>(),
    },
    24270: {
      approvers: new Set(["lunny", "delvh", "silverwind"]),
      blockers: new Set<string>(),
    },
  };
  await Promise.all(
    Object.entries(prToApproversAndBlockers).map(
      async ([prNumber, approversAndBlockers]) => {
        const pr = await fetchPr(Number(prNumber));
        const result = await getPrReviewers(pr);
        assertEquals(result.approvers, approversAndBlockers.approvers);
        assertEquals(result.blockers, approversAndBlockers.blockers);
      },
    ),
  );
});

Deno.test('fetchBranch("main") returns the appropriate main branch', async () => {
  const mainBranch = await fetchBranch("main");
  assertEquals(mainBranch.name, "main");
  assertEquals(mainBranch.protected, true);
  assertEquals(
    mainBranch._links.html,
    "https://github.com/go-gitea/gitea/tree/main",
  );
});

Deno.test("fetchBranch() handles full ref name well", async () => {
  const [mainBranch, releaseV119Branch] = await Promise.all([
    fetchBranch("refs/heads/main"),
    fetchBranch("refs/heads/release/v1.19"),
  ]);
  assertEquals(mainBranch.name, "main");
  assertEquals(mainBranch.protected, true);
  assertEquals(
    mainBranch._links.html,
    "https://github.com/go-gitea/gitea/tree/main",
  );
  assertEquals(releaseV119Branch.name, "release/v1.19");
  assertEquals(releaseV119Branch.protected, true);
  assertEquals(
    releaseV119Branch._links.html,
    "https://github.com/go-gitea/gitea/tree/release/v1.19",
  );
});
