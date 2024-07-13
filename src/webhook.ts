import { serve } from "@std/http";
import { createEventHandler } from "@octokit/webhooks";
import { verify } from "@octokit/webhooks-methods";
import * as backport from "./backport.ts";
import * as labels from "./labels.ts";
import * as mergeQueue from "./mergeQueue.ts";
import * as milestones from "./milestones.ts";
import * as lgtm from "./lgtm.ts";
import * as comments from "./comments.ts";
import * as lock from "./lock.ts";
import * as prActions from "./prActions.ts";
import * as feedback from "./feedback.ts";
import * as lastCall from "./lastCall.ts";

const secret = Deno.env.get("BACKPORTER_GITHUB_SECRET");

if (
  !Deno.env.get("BACKPORTER_GITEA_FORK") ||
  !Deno.env.get("BACKPORTER_GITHUB_TOKEN") ||
  !secret
) {
  console.error(
    "BACKPORTER_GITEA_FORK, BACKPORTER_GITHUB_TOKEN and BACKPORTER_GITHUB_SECRET must be set",
  );
}

const webhook = createEventHandler({});

webhook.on("push", ({ payload }) => {
  // on push to main, backport (we have to be careful here as we cherry-pick and
  // only have one local git repo)
  if (payload.ref === "refs/heads/main") {
    backport.run();
  }

  // we should take this opportunity to run the label, merge queue, lock, feedback, and last call maintenance
  labels.run();
  mergeQueue.run();
  lock.run();
  feedback.run();
  lastCall.run();
});

// on pull request labeling events, run the label and merge queue maintenance
webhook.on(
  ["pull_request.labeled", "pull_request.unlabeled"],
  ({ payload }) => {
    // these events are very common, so we only run the label and merge queue if
    // the label is relevant
    if (labels.isRelevantLabel(payload.label.name)) {
      labels.run();
      mergeQueue.run();
      prActions.run(payload.label.name, payload.pull_request);
    }
  },
);

// on pull request open, run the label maintenance
webhook.on("pull_request.opened", () => {
  labels.run();
});

// on pull request open, comment if translations changed (only if the PR is targeting main)
webhook.on("pull_request.opened", ({ payload }) => {
  if (payload.pull_request.base.ref !== "main") {
    return;
  }
  comments.commentIfTranslationsChanged(payload.pull_request);
});

// on pull request creation, we'll automatically set the milestone
// according to the target branch (if it's a release branch)
webhook.on("pull_request.opened", ({ payload }) => {
  if (payload.pull_request.base.ref.startsWith("release/")) {
    milestones.assign(payload.pull_request);
  }
});

// on pull request merge, make sure the PR has a milestone
webhook.on("pull_request.closed", ({ payload }) => {
  if (payload.pull_request.merged && !payload.pull_request.milestone) {
    milestones.assign(payload.pull_request);
  }
});

// on pull request open, synchronization (push), and pull request review,
// we'll update the lgtm status check and label
webhook.on(
  [
    "pull_request.opened",
    "pull_request.synchronize",
    "pull_request.review_requested",
    "pull_request.review_request_removed",
    "pull_request_review",
  ],
  ({ payload }) => {
    // @ts-expect-error -- unknown
    lgtm.setPrStatusAndLabel(payload.pull_request);
  },
);

// when PRs close, make sure no unmerged closed PRs have milestones
webhook.on("pull_request.closed", () => {
  milestones.run();
});

serve(async (req: Request) => {
  // the request URL contain the entire URL, we want to trigger only if the
  // URL ends with /trigger. If it has anything else (including a query string)
  // we won't trigger. The GitHub webhook is set such that requests from it end
  // with /trigger.
  if (req.url.endsWith("/trigger") && req.method === "POST") {
    // verify signature
    const requestBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    if (!signature) {
      return Response.json({ message: "Missing signature" }, { status: 400 });
    }
    const verified = await verify(secret!, requestBody, signature);
    if (!verified) {
      return Response.json({ message: "Invalid signature" }, { status: 400 });
    }

    // parse webhook
    const id = req.headers.get("x-github-delivery");
    const name = req.headers.get("x-github-event");
    if (!id || !name) {
      return Response.json({ message: "Invalid GitHub webhook" }, {
        status: 400,
      });
    }
    // @ts-expect-error -- unknown
    webhook.receive({ id, name, payload: JSON.parse(requestBody) });

    return Response.json({ message: "Webhook received" });
  } else {
    return Response.json({ status: "OK" });
  }
});
