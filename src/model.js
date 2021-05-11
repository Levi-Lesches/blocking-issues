const github = require("./github.js");

async function getCurrentIssue() {
	return await github.getIssue(await github.getCurrentIssueNumber);
}

module.exports = {
	getCurrentIssue,
}
