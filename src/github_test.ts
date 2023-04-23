import { assertEquals } from "https://deno.land/std@0.184.0/testing/asserts.ts";
import { fetchBranch, getPrApprovalNumber, getPrApprovers } from "./github.ts";

Deno.test("getPrApprovers() returns the appropriate approvers", async () => {
  const prToApprovers = {
    23993: ["delvh", "jolheiser"],
    24051: ["delvh", "silverwind"],
    24047: ["yardenshoham", "lunny"],
  };
  await Promise.all(
    Object.entries(prToApprovers).map(async ([pr, approvers]) => {
      assertEquals(await getPrApprovers(Number(pr)), approvers);
    }),
  );
});

Deno.test("getPrApprovalNumber() returns the appropriate approval number", async () => {
  const prToNumber = {
    24270: 2,
    24254: 2,
    24259: 2,
    24055: 0,
  };
  await Promise.all(
    Object.entries(prToNumber).map(async ([pr, number]) => {
      assertEquals(await getPrApprovalNumber(Number(pr)), number);
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
