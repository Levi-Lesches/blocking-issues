regex = /blocked by #(\d+)/i

const signature = "This comment was automatically written by the [Blocking Issues](https://github.com/Levi-Lesches/blocking-issues) bot, and this PR will be monitored for further progress.";

const blockedLabel = {
	name: "blocked",
	color: "000000",
	description: "This PR needs is waiting for one or more issues to be closed.",
}

function getBlockingIssues(body) {
	issues = [];
	for (match of body.matchAll(regex)) {
		if (match [1] != undefined) {
			issues.push(parseInt(match [1]))
		}
	}
	return issues;
}

function getCommentText(blockingIssues, openIssues) {
	const isBlocked = openIssues.length > 0
	var result = "";
	result += `# Status: ${isBlocked ? "Blocked :x:" : "Ready to merge :heavy_check_mark:"}\n`;
	result += "### Issues blocking this PR: \n";
	for (issue of blockingIssues) {
		var isOpen = openIssues.includes(issue);
		result += `- #${issue} ${isOpen ? ":x:" : ":heavy_check_mark:"}\n`;
	}
	result += "----\n";
	result += signature;
	return result;
}

module.exports = {getBlockingIssues, getCommentText, signature, blockedLabel}