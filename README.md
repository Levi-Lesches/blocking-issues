# Blocking Issues
A GitHub action to label issues and PRs when they're blocked by another issue or PR.

- **When triggered by an open PR**: Checks for blocking issues in the PR text (`Blocked by #X, #Y, #Z`)
- **When triggered by a closed issue**: Checks for other PRs that were blocked by this issue and updates them

Add this file to `.github/workflows/blocking-issues.yml`:
```YAML
name: Blocking Issues

on: 
  issues:
    types: [opened, edited, deleted, transferred, closed, reopened]
  pull_request_target: 
    types: [opened, edited, closed, reopened]
    
jobs: 
  blocking_issues: 
    runs-on: ubuntu-latest
    name: Checks for blocking issues
    
    steps: 
      - uses: Levi-Lesches/blocking-issues@v1
        with: 
          # Optional: Configure the label applied to blocked issues
          # NOTE: Changing these values after the bot has been deployed may result in undefined 
          # behavior as the bot will be unable to find blocked issues. Be sure to change the settings
          # in the GitHub UI for the existing label first before changing here. 
          label-name: blocked
          label-color: 000000
          label-description: This PR is waiting for one or more issues to be closed.
```

This action will not re-block a PR if the issue is reopened, and will throw an error if the issue cannot be found. Simply edit the PR description to re-run the bot. For a demonstration, see the issues and pull requests under https://github.com/Levi-Lesches/blocking-issues-test.
