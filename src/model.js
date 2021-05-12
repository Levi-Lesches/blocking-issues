const github = require("./github.js");
const utils = require("./utils.js");

async function getCurrentIssue() {
	return await github.getIssue(await github.getCurrentIssueNumber());
}

async function initLabels() {
	console.log("Getting labels");
	const labels = await github.getLabels();
	var hasBlockedLabel = false;
	for (label of labels) {
		if (label.name === utils.blockedLabel.name) hasBlockedLabel = true;
	}
	if (!hasBlockedLabel) {
		console.log("Creating label");
		await github.createLabel(utils.blockedLabel);
	}
}

async function update(pr) {
	console.log(`Processing #${pr.number}`);
	console.log("OMG THIS IS IMPORTANT: ");
	console.log(github.getRef());
	const blockingIssueNumbers = utils.getBlockingIssues(pr.body);
	if (blockingIssueNumbers.length == 0) {
		console.log("No blocking issues -- removing comment and label");
		const oldComment = await github.getCommentID(pr.number);
		if (oldComment) {
			await github.deleteComment(oldComment);
		}
		await github.removeLabel(pr.number, "blocked");
		return;
	}

	console.log(`PR is blocked by ${blockingIssueNumbers}`);
	var openIssues = [];
	for (issueNumber of blockingIssueNumbers) {
		const issue = await github.getIssue(issueNumber);
		if (issue.state !== "open") continue;
		openIssues.push(issueNumber);
	}
	console.log(`PR needs these issues to be closed: ${openIssues}`);

	console.log("Writing comment");
	const commentText = utils.getCommentText(blockingIssueNumbers, openIssues);
	await github.writeComment(pr.number, commentText);
	console.log("Comment written");

	const isBlocked = openIssues.length > 0;
	console.log(`Applying label? ${isBlocked}`);
	if (isBlocked) await github.applyLabel(pr.number, "blocked");
	else await github.removeLabel(pr.number, "blocked");

	return openIssues.length == 0;
}

async function unblockPRs() {
	const blockedPRs = await github.getBlockedPRs();
	for (pr of blockedPRs) {
		console.log(`Updating ${pr}`)
		triggerAction(github.context.ref)
	}
}

module.exports = {
	initLabels,
	getCurrentIssue,
	update,
	unblockPRs,
}
