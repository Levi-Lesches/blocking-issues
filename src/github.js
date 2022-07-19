const core = require('@actions/core');
const github = require('@actions/github');
const utils = require("./utils.js");

const token = core.getInput("token");
const octokit = github.getOctokit(token);

function getCurrentIssueNumber() {
	return github.context.issue.number;
}

function isPR(issue) { return "pull_request" in issue; }

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
	try {
		var json = await octokit.rest.issues.get({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: number,
		});
		return json.data;
	} catch (error) {  // RequestError
		if (error.status === 404) {
			core.setFailed(`Issue not found: #${number}`);
			return null;  // the invalid reference will be in the comment
		} else {
			throw Error(`Got an HTTP ${error.status} error while retrieving issue #${number}`);
		}
	}
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

async function getLabelsForPR(issueNumber) {
	const json = await octokit.rest.issues.listLabelsOnIssue({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issueNumber,
	});
	return json.data;
}

async function removeLabel(issueNumber, label) {
	for (otherLabel of await getLabelsForPR(issueNumber)) {
		if (otherLabel.name == label) {
			return await octokit.rest.issues.removeLabel({
				owner: github.context.repo.owner,
				repo: github.context.repo.repo,
				issue_number: issueNumber,
				name: label
		  });
		}
	}
}

async function getBlockedPRs() {
	const json = await octokit.rest.issues.listForRepo({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		state: "open",
		labels: utils.blockedLabel.name,
	});
	return json.data;
}

async function _getPR(number) {
	const json = await octokit.rest.pulls.get({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		pull_number: number,
	});
	return json.data;
}

async function _getActionRuns() {
	const json = await octokit.rest.actions.listWorkflowRunsForRepo({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
	});
	return json.data.workflow_runs;
}

async function _rerunWorkflow(id) {
	await octokit.rest.actions.reRunWorkflow({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
	  run_id: id,
	});
}

async function rerunAction(issueNumber) {
	console.log(`    Getting PR #${issueNumber}`);
	const pr = await _getPR(issueNumber);

	const branch = pr.head.ref;
	console.log(`      Re-running most recent action on ${branch}`);
	const actionRuns = await _getActionRuns();

	for (action of actionRuns) {
		const actionTarget = action.pull_requests [0];
		if (
			action.name == "Blocking Issues" 
			&& actionTarget 
			&& actionTarget.number === issueNumber
		) {
			console.log(`      Rerunning action run id: ${action.id}`);
			await _rerunWorkflow(action.id);
		}
	}
}

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
	getLabelsForPR,

	// comments
	deleteComment,
	getCommentID,
	writeComment,

	rerunAction,
}
