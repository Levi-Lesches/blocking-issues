const regex = /blocked by:? ([#\d, ]+)/ig;

export const signature = "This comment was automatically written by the [Blocking Issues](https://github.com/Levi-Lesches/blocking-issues) bot, and this PR will be monitored for further progress.";
export const defaultLabel = {
	name: "blocked",
	color: "000000",
	description: "Waiting for another PR/issue to be merged/closed.",
};

export function parseBlockingIssues(body) {
	const issues = [];
	if (body === null) return issues;
	for (const match of body.matchAll(regex)) {
		for (const issue of match [1].split(", ")) {
			const issueNumber = parseInt(issue.substring(1));
			issues.push(issueNumber);
		}
	}
	return issues;
}

export function getCommentText(blockingIssues, openIssues, brokenIssues) {
	let status = "Ready to merge :heavy_check_mark:";
	if (brokenIssues.length > 0) status = "Error :warning:";
	else if (openIssues.length > 0) status = "Blocked :x:";
	var result = "";
	result += `# Status: ${status}\n`;
	result += "### Issues blocking this PR: \n";
	for (const issue of blockingIssues) {
		let symbol = ":heavy_check_mark:";
		if (openIssues.includes(issue)) symbol = ":x:";
		else if (brokenIssues.includes(issue)) symbol = ":warning: Issue/PR not found";
		result += `- #${issue} ${symbol}\n`;
	}
	result += "----\n";
	result += signature;
	return result;
}
