import { delay } from "https://deno.land/std@0.189.0/async/mod.ts";

let currentlyRunningACommand = false;

// run a command
export const run = async (command: string, options?: Deno.CommandOptions) => {
  // wait for the lock to be released
  while (currentlyRunningACommand) {
    // wait for 1 second
    await delay(1000);
  }
  currentlyRunningACommand = true;
  const cmd = new Deno.Command(command, options);
  currentlyRunningACommand = false;
  return cmd.output();
};
