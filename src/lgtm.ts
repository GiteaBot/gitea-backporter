import {
  approve,
  fetchMaintainersExcludingMergers,
  getPrReviewers,
  requestChanges,
  requestReview,
} from "./github.ts";
import { bot } from "./user.ts";

let maintainers: Set<string>;

export const updateInMemoryMaintainers = async () => {
  maintainers = await fetchMaintainersExcludingMergers();
};

export const updatePrReviewStatus = async (pr: {
  labels: { name: string }[];
  head: { sha: string };
  title: string;
  number: number;
  requested_reviewers: { login: string }[];
}) => {
  if (!maintainers) {
    updateInMemoryMaintainers();
  }

  // given a PR and a list of maintainers, make sure that the PR:
  // - is approved by this bot if a maintainer approves it
  // - is blocked by this bot if a maintainer requests changes
  const { approvers, blockers } = await getPrReviewers(pr);

  const maintainersThatApproved = new Set<string>();
  approvers.forEach((approver) => {
    if (maintainers.has(approver)) maintainersThatApproved.add(approver);
  });

  const maintainersThatBlocked = new Set<string>();
  blockers.forEach((blocker) => {
    if (maintainers.has(blocker)) maintainersThatBlocked.add(blocker);
  });

  // if any maintainer has blocked the PR and this bot has not blocked it yet, block it
  if (maintainersThatBlocked.size > 0 && !blockers.has(bot.login)) {
    await requestChanges(pr.number);
    return;
  }

  // if any maintainer has approved the PR and this bot has not approved it yet, approve it
  if (maintainersThatApproved.size > 0 && !approvers.has(bot.login)) {
    await approve(pr.number);
    return;
  }

  // if no maintainer approved nor blocked the PR and this bot has a review on it, remove the review
  if (
    maintainersThatApproved.size === 0 && maintainersThatBlocked.size === 0 &&
    (approvers.has(bot.login) || blockers.has(bot.login))
  ) {
    await requestReview(pr.number, bot.login);
  }
};
