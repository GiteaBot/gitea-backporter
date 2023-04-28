import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { fetchBranch, getPrReviewers } from "./github.ts";

Deno.test("getPrReviewers() returns the appropriate approvers", async () => {
  const prToApprovers = {
    23993: new Set(["delvh", "jolheiser"]),
    24051: new Set(["delvh", "silverwind"]),
    24047: new Set(["yardenshoham", "lunny"]),
    24055: new Set<string>(),
    24254: new Set(["jolheiser", "yardenshoham"]),
    24259: new Set(["jolheiser", "delvh"]),
    24270: new Set(["lunny", "delvh", "silverwind"]),
  };
  await Promise.all(
    Object.entries(prToApprovers).map(async ([pr, approvers]) => {
      assertEquals((await getPrReviewers(Number(pr))).approvers, approvers);
    }),
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
