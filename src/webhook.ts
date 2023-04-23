import { serve } from "https://deno.land/std@0.184.0/http/server.ts";
import { createEventHandler } from "https://esm.sh/@octokit/webhooks@11.0.0";
import { verify } from "https://esm.sh/@octokit/webhooks-methods@3.0.2";
import * as backport from "./backport.ts";
import * as labels from "./labels.ts";
import * as mergeQueue from "./mergeQueue.ts";
import * as milestones from "./milestones.ts";
import * as lgtm from "./lgtm.ts";

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

  // we should take this opportunity to run the label and merge queue maintenance
  labels.run();
  mergeQueue.run();
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
    }
  },
);

// on pull request creation, we'll automatically set the milestone
// according to the target branch
webhook.on("pull_request.opened", ({ payload }) => {
  milestones.assign(payload.pull_request.number);
});

// on pull request open, synchronization (push), and pull request review,
// we'll update the lgtm status check and label
webhook.on(
  ["pull_request.opened", "pull_request.synchronize", "pull_request_review"],
  ({ payload }) => {
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
    webhook.receive({ id, name, payload: JSON.parse(requestBody) });

    return Response.json({ message: "Webhook received" });
  } else {
    return Response.json({ status: "OK" });
  }
});
