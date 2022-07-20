import * as core from "@actions/core";
import * as github from "./github.js";
import * as utils from "./utils.js";

export async function getCurrentIssue() {
	return await github.getIssue(await github.getCurrentIssueNumber());
}

export async function initLabel() {
	core.info("Initializing labels...");

	// Get inputs.
	const labels = await github.getLabels();
	const preferredName = core.getInput("use-label");
	core.debug(`User prefers to use the "${preferredName}" label`);

	// Discover labels.
	let preferredLabel, defaultLabel;
	for (const existingLabel of labels) {
		if (existingLabel.name === preferredName) preferredLabel = existingLabel;
		if (existingLabel.name === utils.defaultLabel.name) defaultLabel = existingLabel;
	}

	// Choose label, creating it if necessary.
	let label = preferredLabel ?? defaultLabel;
	if (label === null) {
		core.info("No label found. Creating default label.");
		github.createLabel(utils.defaultLabel);
		label = utils.defaultLabel;
	}

	core.debug(`Using label: ${label.name}`);
	return label;
}

export async function update(issue) {
	core.info(`Processing #${issue.number}`);
	const label = await initLabel();
	const blockingIssueNumbers = utils.parseBlockingIssues(issue.body);

	if (blockingIssueNumbers.length == 0) {
		core.info("No blocking issues -- removing comment and label");
		await github.removeLabel(issue.number, label);

		// If comment is present, remove it
		const oldComment = await github.getCommentID(issue.number);
		if (oldComment) await github.deleteComment(oldComment);
		
		return;
	}

	core.info(`#${issue} is blocked by ${blockingIssueNumbers}`);
	let openIssues = [], brokenIssues = [];
	for (const issueNumber of blockingIssueNumbers) {
		const otherIssue = await github.getIssue(issueNumber);
		if (otherIssue === null) brokenIssues.push(issueNumber);
		else if (otherIssue.state === "open") openIssues.push(issueNumber);
	}
	core.debug(`These issues are still open: ${openIssues}`); 
	core.warning(`These issues could not be found: ${brokenIssues}`);

	core.info("Writing comment...");
	const commentText = utils.getCommentText(blockingIssueNumbers, openIssues, brokenIssues);
	await github.writeComment(issue.number, commentText);

	core.info("Updating label...");
	const isBlocked = openIssues.length > 0;
	if (isBlocked) await github.applyLabel(issue.number, utils.blockedLabel.name);
	else await github.removeLabel(issue.number, utils.blockedLabel.name);

	return isBlocked;
}

export async function unblockPRs(issueNumber) {
	core.info(`Unblocking issues blocked by #${issueNumber}...`);
	const blockedPRs = await github.getBlockedPRs();
	core.debug(`The following issues are blocked: ${blockedPRs}`);
	for (const pr of blockedPRs) {
		const blockingIssues = utils.parseBlockingIssues(pr.body);
		if (!blockingIssues.includes(issueNumber)) continue;
		core.info(`Updating ${pr.number}`);
		if (github.isPR(pr)) await github.rerunAction(pr.number);  // only works on prs
		else await update(pr);  // works on prs and issues
	}
}
