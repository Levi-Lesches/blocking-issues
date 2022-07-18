# Blocking Issues
A GitHub action to label issues and PRs when they're blocked by another issue or PR.

- **When triggered by an open PR**: Checks for blocking issues in the PR text (`Blocked by #X, #Y, #Z`)
- **When triggered by a closed issue**: Checks for other PRs that were blocked by this issue and updates them

Add this file to `.github/workflows/blocking-issues.yml`:
```YAML
name: Blocking Issues

on: 
  issues:
    types: [closed]
  pull_request_target: 
    types: [opened, edited]
    
jobs: 
  blocking_issues: 
    runs-on: ubuntu-latest
    name: Checks for blocking issues
    
    steps: 
      - uses: Levi-Lesches/blocking-issues@v1.1
        with: 
          # Optional: Configure the label applied to blocked issues
          # NOTE: Changing these values after the bot has been deployed may result in undefined 
          # behavior as the bot will be unable to find blocked issues. Be sure to change the settings
          # in the GitHub UI for the existing label first before changing here. 
          label-name: blocked
          label-color: 000000
          label-description: This PR is waiting for one or more issues to be closed.
```

This action will not re-block a PR if the issue is reopened, and will throw an error if the issue cannot be found. Simply edit the PR description to re-run the bot

----

Here's an example of a PR that needs an issue to be closed first:
![image](https://user-images.githubusercontent.com/20747538/118001749-038a1c00-b315-11eb-94ea-a5df4adefd12.png)
![image](https://user-images.githubusercontent.com/20747538/118001780-0a189380-b315-11eb-974f-6e6823a5a4ec.png)

After the issue is closed: 
![image](https://user-images.githubusercontent.com/20747538/118001980-30d6ca00-b315-11eb-8916-efc71f3abbdd.png)
![image](https://user-images.githubusercontent.com/20747538/118002048-40eea980-b315-11eb-8f8f-ad7fca355232.png)
