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
      - uses: Levi-Lesches/blocking-issues@v2
        with: 
          # Optional: Choose an existing label to use instead of creating a new one.
          # If the label cannot be found, the default one will be created and used.
          # The default is: "blocked" (black).
          use-label: "blocked issue"
```

This action will not re-block a PR if the issue is reopened, and will throw an error if the issue cannot be found. Simply edit the PR description to re-run the bot. For a demonstration, see the issues and pull requests under https://github.com/Levi-Lesches/blocking-issues-test.
