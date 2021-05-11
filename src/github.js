const github = require('@actions/github');

const octokit = github.getOctokit(github.token)
const repo_name = github.context.repo

function getCurrentIssueNumber() {
	return github.context.issue.number;
}

async function getIssue(number) {
	return await octokit.rest.issues.get({
		owner: github.context.repo.owner,
		repo: github.context.repo.name,
		issue_number: number,
	});
}

async function writeComment(issueNumber, text) {
	await octokit.rest.issues.createComment({
		owner: github.context.repo.owner,
		repo: github.context.repo.name,
		issue_number: number,
		body: text,
	})
}

async function applyLabel(issueNumber, label) {
	await octokit.rest.issues.addLabels({
		owner: github.context.repo.owner,
		repo: github.context.repo.name,
		issue_number: issueNumber,
		labels: label
  });
}

async function removeLabel(issueNumber, label) {
	await octokit.rest.issues.addLabels({
		owner: github.context.repo.owner,
		repo: github.context.repo.name,
		issue_number: issueNumber,
		name: label
  });
}

module.exports = {
	getCurrentIssueNumber,
	getIssue,
	writeComment,
	applyLabel,
	removeLabel,
}
