regex = /blocked by #(\d+)/i

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
	
}

module.exports = {getBlockingIssues}