# Gitea Pull Request Backporter

This is a script that does various maintenance chores for
[go-gitea/gitea](https://github.com/go-gitea/gitea).

## Behavior

### Backport creation

First, the script will fetch Gitea's current development versions from GitHub's
API.

The script will look for pull requests that have the label
`backport/v{gitea_version}` but do not have the label `backport/done`. It will
clone your fork of gitea. It will then attempt to cherry-pick the pull request
merged commit into the release branch. If the cherry-pick is successful, it will
push the branch to the remote and create a pull request with the labels from the
original pull request.

### Label maintenance

The script will also look for merged pull requests that have the labels
`reviewed/wait-merge` or `reviewed/prioritize-merge` and remove them.

It will also search for pull requests that target release branches and remove
any `backport/*` labels from them.

### Merge queue synchronization

The script will also look for pull requests that have the label
`reviewed/wait-merge` and are still open. It will merge the upstream changes
into the pull request head branch. If a merge conflict occurs, it will remove
the pull request from the merge queue.

### Milestone maintenance

When a pull request is created, the script will assign it a milestone based on
its target branch (except pull requests targeting `main`). The script makes sure
that unmerged closed pull requests are not included in any milestone.

### LGTM

The script will maintain each pull request's LGTM count. It will add the
appropriate label (one of `lgtm/need 2`, `lgtm/need 1`, or `lgtm/done`) based on
the number of approvals the pull request has. It will also set the commit status
to `success` if the pull request has 2 or more approvals (`pending` if not).

## Usage

Set the following environment variables:

```
BACKPORTER_GITHUB_TOKEN= # A GitHub personal access token with permissions to add labels to the go-gitea/gitea repo
BACKPORTER_GITHUB_SECRET= # The secret that is used to sign the webhook payload (set in GitHub's webhook settings)
BACKPORTER_GITEA_FORK= # The fork of go-gitea/gitea to push the backport branch to (e.g. yardenshoham/gitea)
```

Then run:

```bash
deno run --allow-net --allow-env --allow-run src/webhook.ts
```

This will spin up a web server on port 8000. You can then set up a GitHub
webhook on `/trigger` to run this bot.

## Contributing

Contributions are welcome!

## License

[MIT](LICENSE)
