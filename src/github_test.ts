import { assertEquals } from "https://deno.land/std@0.184.0/testing/asserts.ts";
import { fetchMain, getPrApprovalNumber, getPrApprovers } from "./github.ts";

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

Deno.test("fetchMain() returns the appropriate main branch", async () => {
  const mainBranch = await fetchMain();
  assertEquals(mainBranch.name, "main");
  assertEquals(mainBranch.protected, true);
  assertEquals(
    mainBranch._links.html,
    "https://github.com/go-gitea/gitea/tree/main",
  );
});
