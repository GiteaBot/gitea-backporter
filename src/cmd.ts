// run a command
export const run = (command: string, options?: Deno.CommandOptions) => {
  const cmd = new Deno.Command(command, options);
  return cmd.output();
};
