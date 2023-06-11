import * as cmd from "./cmd.ts";
import { addPrComment } from "./github.ts";

const validCommandRegex = /^@GiteaBot run `([a-zA-Z0-9]+)`$/;

export const run = async (
  issueComment: {
    author_association: string;
    issue_url: string;
    body: string;
    user: { login: string };
  },
) => {
  if (!issueComment.body.startsWith("@GiteaBot run")) {
    return;
  }

  const prNumber = parseInt(issueComment.issue_url.split("/").pop() as string);
  if (issueComment.author_association !== "MEMBER") {
    await addPrComment(
      prNumber,
      `I'm sorry, @${issueComment.user.login}, but only members of the Gitea organization can run arbitrary commands. :tea:`,
    );
    return;
  }

  // make sure the command is valid
  const match = issueComment.body.match(validCommandRegex);
  if (!match) {
    await addPrComment(
      prNumber,
      `I'm sorry, @${issueComment.user.login}, but that command is not valid. ` +
        "I'm accepting commands using comments that look like\n" +
        "```\n" +
        "@GiteaBot run `command`\n" +
        "```\n" +
        "For example:\n" +
        "```\n" +
        "@GiteaBot run `make fmt`\n" +
        "```\n" +
        ":tea:",
    );
    return;
  }

  // fetch the PR branch
  let output = await cmd.run("git", {
    cwd: "gitea",
    args: ["fetch", "upstream", `pull/${prNumber}/head`],
  });
  if (!output.success) {
    console.error(output.stderr);
    return;
  }

  // checkout the PR branch
  output = await cmd.run("git", {
    cwd: "gitea",
    args: ["checkout", `FETCH_HEAD`, "-b", `pr-${prNumber}`],
  });
  if (!output.success) {
    console.error(output.stderr);
    return;
  }

  // grab the command to run
  const command = match[1];

  // run the command
  output = await cmd.run("bash", { cwd: "gitea", args: ["-ce", command] });

  // if the command failed, add a comment to the PR
  if (!output.success) {
    await addPrComment(
      prNumber,
      `@${issueComment.user.login}, the command \`${command}\` failed:\n` +
        "```\n" +
        output.stderr +
        "\n" +
        "```\n" +
        ":tea:",
    );
    return;
  }

  // if the command succeeded, push the branch to the user's fork
  // TODO: how?
};
