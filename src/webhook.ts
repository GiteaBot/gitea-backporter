import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { run } from "./backport.ts";

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
    run();
    return Response.json({ message: "Triggered backport" });
  } else {
    return Response.json({ status: "OK" });
  }
});
