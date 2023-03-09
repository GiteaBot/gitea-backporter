# Gitea Pull Request Backporter

This is a script that looks for pull requests in
[go-gitea/gitea](https://github.com/go-gitea/gitea) that need to be backported
to a release branch and if the backport can be automated, it will do so.

## Behavior

First, the script will fetch Gitea's current development versions from GitHub's
API.

The script will look for pull requests that have the label
`backport/v{gitea_version}` but do not have the label `backport/done`. It will
clone your fork of gitea. It will then attempt to cherry-pick the pull request
merged commit into the release branch. If the cherry-pick is successful, it will
push the branch to the remote and create a pull request with the labels from the
original pull request.

## Usage

Set the following environment variables:

```
BACKPORTER_GITHUB_TOKEN= # A GitHub personal access token with permissions to add labels to the go-gitea/gitea repo
BACKPORTER_GITEA_FORK= # The fork of go-gitea/gitea to push the backport branch to (e.g. yardenshoham/gitea)
```

Then run:

```bash
deno run --allow-net --allow-env --allow-run src/mod.ts
```

## Contributing

Contributions are welcome!

## License

[MIT](LICENSE)
