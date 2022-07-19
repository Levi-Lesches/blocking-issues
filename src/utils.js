const core = require('@actions/core');

regex = /blocked by:? ([#\d, ]+)/ig

const signature = "This comment was automatically written by the [Blocking Issues](https://github.com/Levi-Lesches/blocking-issues) bot, and this PR will be monitored for further progress.";

const blockedLabel = {
	name: core.getInput("label-name"),
	color: String(core.getInput("label-color")),  // user may enter a hex code without quotes
	description: core.getInput("label-description"),
}

function getBlockingIssues(body) {
	issues = [];
	if (body === null) return issues;
	for (match of body.matchAll(regex)) {
		for (issue of match [1].split(", ")) {
			issueNumber = parseInt(issue.substring(1));
			issues.push(issueNumber);
		}
	}
	return issues;
}

function getCommentText(blockingIssues, openIssues, brokenIssues) {
	const status = "Ready to merge :heavy_check_mark:";
	if (brokenIssues.length > 0) summary = "Error :warning:";
	else if (openIssues.length > 0) summary = "Blocked :x:";
	var result = "";
	result += `# Status: ${status}\n`;
	result += "### Issues blocking this PR: \n";
	for (issue of blockingIssues) {
		let symbol = ":heavy_check_mark";
		if (openIssues.includes(issue)) symbol = ":x:";
		else if (brokenIssues.includes(issue)) symbol = ":warning: Issue/PR not found";
		var isOpen = openIssues.includes(issue);
		result += `- #${issue} ${symbol}\n`;
	}
	result += "----\n";
	result += signature;
	return result;
}

module.exports = {getBlockingIssues, getCommentText, signature, blockedLabel}
