const core = require('@actions/core');
const github = require('@actions/github');
const utils = require("./utils.js");

const token = core.getInput("token");
const octokit = github.getOctokit(token);

function getCurrentIssueNumber() {
	return github.context.issue.number;
}

function getRef() {
	return github.context.ref;
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
	var json = await octokit.rest.issues.listComments({
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

async function deleteComment(id) {
	await octokit.rest.issues.deleteComment({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		comment_id: id,
	});
}

async function getCommentID(issueNumber) {
	comments = await getComments(issueNumber);
	for (comment of comments) {
		if (comment.body.endsWith(utils.signature)) {
			return comment.id;
		}
	}
}

async function writeComment(issueNumber, text) {
	const id = await getCommentID(issueNumber);
	if (id) {
		console.log(`Found old comment (id ${comment.id}). Updating...`);
		return await rewriteComment(id, text);
	} else {
		await octokit.rest.issues.createComment({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: issueNumber,
			body: text,
		});
	}
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
	await octokit.rest.issues.removeLabel({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issueNumber,
		name: label
  });
}

async function getBlockedPRs() {
	const json = await octokit.rest.issues.listForRepo({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		state: "open",
		labels: "blocked",
	});
	return json.data;
}

async function triggerAction(ref) {
	await octokit.rest.actions.createWorkflowDispatch({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
	  workflow_id: "Blocking Issues",
	  ref: ref,
});

module.exports = {
	// Issues
	getCurrentIssueNumber,
	getIssue,

	// labels
	getLabels,
	createLabel,
	applyLabel,
	removeLabel,
	getBlockedPRs,

	// comments
	deleteComment,
	getCommentID,
	writeComment,

	triggerAction,
	getRef,
}
