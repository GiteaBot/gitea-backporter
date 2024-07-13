import { Endpoints } from "@octokit/types";

type IssueGetResponse =
  Endpoints["GET /repos/{owner}/{repo}/issues/{issue_number}"]["response"][
    "data"
  ];
type PullGetResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"][
    "data"
  ];

export type Issue = IssueGetResponse;
export type PullRequest = PullGetResponse;
