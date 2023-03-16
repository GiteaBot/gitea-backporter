import { serve } from "https://deno.land/std@0.180.0/http/server.ts";
import { triggerBackportAction } from "./github.ts";

if (Deno.env.get("BACKPORTER_GITHUB_TOKEN") === undefined) {
  console.error("BACKPORTER_GITHUB_TOKEN is not set");
}

serve(async (req: Request) => {
  if (req.url.endsWith("/trigger")) {
    await triggerBackportAction();
    return Response.json({ message: "Triggered backport" });
  } else {
    return Response.json({ status: "OK" });
  }
});
