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
	if (label == null) {
		core.info("No label found. Creating default label.");
		github.createLabel(utils.defaultLabel);
		label = utils.defaultLabel;
	}

	core.debug(`Using label: "${label.name}"`);
	return label;
}

export async function update(issue) {
	core.info(`Processing #${issue.number}`);
	const label = await initLabel();
	const blockingIssueNumbers = utils.parseBlockingIssues(issue.body);

	if (blockingIssueNumbers.length == 0) {
		core.info("No blocking issues -- removing comment and label");
		try {
			await github.removeLabel(issue.number, label);
			core.debug("Removed label");
			// If comment is present, remove it
			const oldComment = await github.getCommentID(issue.number);
			if (oldComment) await github.deleteComment(oldComment);
			core.debug("Removed comment");
		} catch (error) { /* No action needed if issue is not already blocked. */}
		return;
	}

	core.info(`#${issue.number} is blocked by ${blockingIssueNumbers}`);
	let openIssues = [], brokenIssues = [];
	for (const issueNumber of blockingIssueNumbers) {
		const otherIssue = await github.getIssue(issueNumber);
		if (otherIssue === null) brokenIssues.push(issueNumber);
		else if (otherIssue.state === "open") openIssues.push(issueNumber);
	}
	if (openIssues.length > 0) core.debug(`These issues are still open: ${openIssues}`);

	core.info("Writing comment...");
	const commentText = utils.getCommentText(blockingIssueNumbers, openIssues, brokenIssues);
	await github.writeComment(issue.number, commentText);

	core.info("Updating label...");
	const isBlocked = openIssues.length > 0;
	core.info(`Is blocked? ${isBlocked}`);
	if (isBlocked) {
		await github.applyLabel(issue.number, label.name);
	} else {
		try {
			await github.removeLabel(issue.number, label.name);
		} catch {
			// No action needed if issue is not already blocked.
		}
	}

	return isBlocked;
}

export async function unblockPRs(issueNumber) {
	core.info(`Unblocking issues blocked by #${issueNumber}...`);
	const label = await initLabel();
	const blockedPRs = await github.getIssuesWithLabel(label);
	for (const pr of blockedPRs) {
		core.debug(`Parsing #${pr.number} for blocking issues`);
		const blockingIssues = utils.parseBlockingIssues(pr.body);
		if (!blockingIssues.includes(issueNumber)) continue;
		core.info(`Updating ${pr.number}`);
		if (github.isPR(pr)) await github.rerunAction(pr.number);  // only works on prs
		else await update(pr);  // works on prs and issues
	}
}
