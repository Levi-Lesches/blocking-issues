const github = require('@actions/github');

function getIssueNumber() {
	const number = github.context.issue.number;
	console.log(number);
}

module.exports = {getIssueNumber}