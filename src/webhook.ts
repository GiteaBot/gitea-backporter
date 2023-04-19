import { serve } from "https://deno.land/std@0.184.0/http/server.ts";
import * as backport from "./backport.ts";
import * as labels from "./labels.ts";
import * as mergeQueue from "./mergeQueue.ts";

if (
  Deno.env.get("BACKPORTER_GITEA_FORK") === undefined ||
  Deno.env.get("BACKPORTER_GITHUB_TOKEN") === undefined
) {
  console.error(
    "BACKPORTER_GITEA_FORK and BACKPORTER_GITHUB_TOKEN must be set",
  );
}

serve((req: Request) => {
  if (req.url.endsWith("/trigger")) {
    backport.run();
    labels.run();
    mergeQueue.run();
    return Response.json({
      message:
        "Triggered backport, label maintenance, and merge queue PRs sync",
    });
  } else {
    return Response.json({ status: "OK" });
  }
});
