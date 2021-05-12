# Blocking Issues
A GitHub action to label issues and PRs when they're blocked by another issue or PR.

**When triggered by an open PR**: Checks for blocking issues in the PR text (`Blocked by #X, #Y, #Z`)

**When triggered by a closed issue**: Checks for other PRs that were blocked by this issue and updates them

Add this file to `.github/workflows/blocking-issues.yml`:
```YAML
name: Blocking Issues

on: 
  issues:
    types: [deleted, closed]
  pull_request_target: 
    types: [opened, edited, closed, reopened]
    
jobs: 
  blocking_issues: 
    runs-on: ubuntu-latest
    name: Checks for blocking issues or PRs
    
    steps: 
      - uses: Levi-Lesches/blocking-issues@v1
```

This action will not re-block a PR if the issue is reopened, and will throw an error if the issue cannot be found. Simply edit the PR description to re-run the bot