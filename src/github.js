import * as core from "@actions/core";
import * as github from "@actions/github";
import * as utils from "./utils.js";

const token = core.getInput("token");
const octokit = github.getOctokit(token);

export function getCurrentIssueNumber() {
	return github.context.issue.number;
}

export function isPR(issue) { return "pull_request" in issue; }

export async function getLabels() {
	var json = await octokit.rest.issues.listLabelsForRepo({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
	});
	return json.data;
}

export async function createLabel(label) {
	await octokit.rest.issues.createLabel({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		name: label.name,
		description: label.description,
		color: label.color,
	});
}

export async function getIssuesWithLabel(label) {
	const json = await octokit.rest.issues.listForRepo({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		state: "open",
		labels: label.name,
	});
	return json.data;
}

export async function getIssue(number) {
	try {
		var json = await octokit.rest.issues.get({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: number,
		});
		return json.data;
	} catch (error) {  // RequestError
		if (error.status === 404 || error.status === 410) {
			core.setFailed(`Issue not found: #${number}`);
			return null;  // the invalid reference will be in the comment
		} else {
			throw Error(`Got an HTTP ${error.status} error while retrieving issue #${number}`);
		}
	}
}

export async function getComments(issueNumber) {
	var json = await octokit.rest.issues.listComments({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issueNumber,
	});
	return json.data;
}

export async function rewriteComment(id, text) {
	await octokit.rest.issues.updateComment({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		comment_id: id,
		body: text,
	});
}

export async function deleteComment(id) {
	await octokit.rest.issues.deleteComment({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		comment_id: id,
	});
}

export async function getCommentID(issueNumber) {
	const comments = await getComments(issueNumber);
	for (const comment of comments) {
		if (comment.body.endsWith(utils.signature)) {
			return comment.id;
		}
	}
}

export async function writeComment(issueNumber, text) {
	const id = await getCommentID(issueNumber);
	if (id) {
		core.info(`Found old comment (id ${id}). Updating...`);
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

export async function applyLabel(issueNumber, label) {
	await octokit.rest.issues.addLabels({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issueNumber,
		labels: [label]
	});
}

export async function removeLabel(issueNumber, label) {
	return await octokit.rest.issues.removeLabel({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issueNumber,
		name: label
	});
}

export async function _getPR(number) {
	const json = await octokit.rest.pulls.get({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		pull_number: number,
	});
	return json.data;
}

export async function _getActionRuns() {
	const json = await octokit.rest.actions.listWorkflowRunsForRepo({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
	});
	return json.data.workflow_runs;
}

export async function _rerunWorkflow(id) {
	await octokit.rest.actions.reRunWorkflow({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		run_id: id,
	});
}

export async function rerunAction(issueNumber) {
	core.debug(`    Getting PR #${issueNumber}`);
	const pr = await _getPR(issueNumber);

	const branch = pr.head.ref;
	core.info(`      Re-running most recent action on ${branch}`);
	const actionRuns = await _getActionRuns();

	for (const action of actionRuns) {
		const actionTarget = action.pull_requests [0];
		if (
			action.name == "Blocking Issues" 
			&& actionTarget 
			&& actionTarget.number === issueNumber
		) {
			core.debug(`      Rerunning action run id: ${action.id}`);
			await _rerunWorkflow(action.id);
		}
	}
}
