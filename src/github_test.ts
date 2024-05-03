import {
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.189.0/testing/asserts.ts";
import {
  backportPrExists,
  fetchBranch,
  fetchLastComment,
  fetchPr,
  fetchPrFileNames,
  getPrReviewers,
} from "./github.ts";

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

Deno.test("fetchPrFileNames() returns the appropriate files", async () => {
  const prToFiles = {
    25432: new Set([
      "modules/setting/database.go",
      "options/locale/locale_en-US.ini",
      "routers/install/install.go",
      "services/forms/user_form.go",
      "templates/install.tmpl",
    ]),
    24825: new Set(["models/repo/topic.go"]),
  };

  await Promise.all(
    Object.entries(prToFiles).map(
      async ([prNumber, files]) => {
        const result = await fetchPrFileNames(Number(prNumber));
        assertEquals(result, files);
      },
    ),
  );
});

Deno.test("fetchPrFileNames() can handle big PRs", async () => {
  const aPrWith669Files = await fetchPrFileNames(24147);
  assertEquals(aPrWith669Files.size, 669);
});

Deno.test("fetchLastComment() returns the appropriate comment", async () => {
  const prToLastComment = {
    10: "Closing as fixed by #199 ",
    29: null,
    1000: "LGTM",
    10000:
      "It is a feature of SQL databases. The repo id is stored in the database and uses auto increment:\r\nhttps://www.w3schools.com/sql/sql_autoincrement.asp",
  };
  await Promise.all(
    Object.entries(prToLastComment).map(
      async ([issueNumber, comment]) => {
        const result = await fetchLastComment(Number(issueNumber));
        if (!comment) return assertFalse(result);
        assertEquals(result.body, comment);
      },
    ),
  );
});

Deno.test("backportPrExists() returns the appropriate result", async () => {
  const prAndVersionToBackportExists = {
    "30511_1.22": true,
    "30511_1.21": true,
    "30511_1.20": false,
  };
  await Promise.all(
    Object.entries(prAndVersionToBackportExists).map(async ([prAndVersion, backportExists]) => {
      const [prNumber, version] = prAndVersion.split("_");
      const result = await backportPrExists(
        { number: Number(prNumber) },
        version,
      );
      assertEquals(result, backportExists);
    }),
  );
});
