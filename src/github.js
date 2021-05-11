const core = require('@actions/core');
const github = require('@actions/github');
const utils = require("./utils.js");

const token = core.getInput("token");
console.log(token);
const octokit = github.getOctokit(token);

function getCurrentIssueNumber() {
	return github.context.issue.number;
}

async function getLabels() {
	var json = await octokit.rest.issues.listLabelsForRepo({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
	});
	return json.data;
}

async function createLabel(label) {
	await octokit.rest.issues.createLabel({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		name: label.name,
		description: label.description,
		color: label.color,
	})
}

async function getIssue(number) {
	console.log("Details:");
	console.log(github.context.repo.owner);
	console.log(github.context.repo.repo);
	var json = await octokit.rest.issues.get({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: number,
	}).catch(error => {
		console.log(`Failed to get issue #${number}`);
		core.setFailed(error);
	});
	return json.data;
}

async function getComments(issueNumber) {
	var json = await octokit.rest.issues.createComment({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issueNumber,
	});
	return json.data;
}

async function rewriteComment(id, text) {
	await octokit.rest.issues.updateComment({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		comment_id: id,
		body: text,
	});
}

async function writeComment(issueNumber, text) {
	console.log(`Getting comments for PR ${issueNumber}`);
	comments = await getComments(issueNumber);
	console.log(comments);
	for (comment of comments) {
		if (comment.body.endsWith(utils.signature)) {
			console.log(`Found old comment (id ${comment.id}). Updating...`);
			return await rewriteComment(comment.id, text);
		}
	}

	await octokit.rest.issues.createComment({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issueNumber,
		body: text,
	});
}

async function applyLabel(issueNumber, label) {
	await octokit.rest.issues.addLabels({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issueNumber,
		labels: [label]
  });
}

async function removeLabel(issueNumber, label) {
	await octokit.rest.issues.addLabels({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issueNumber,
		name: label
  });
}

module.exports = {
	getLabels,
	createLabel,
	getCurrentIssueNumber,
	getIssue,
	writeComment,
	applyLabel,
	removeLabel,
}
