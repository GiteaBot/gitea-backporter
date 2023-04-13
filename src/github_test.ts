import { assertEquals } from "https://deno.land/std@0.183.0/testing/asserts.ts";
import { getPrApprovers } from "./github.ts";

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
