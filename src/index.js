const core = require('@actions/core');
const model = require('./model.js');

try {
	// const octokit = github.getOctokit(github.token);

	console.log("Hello, World!");
	console.log(model.getCurrentIssue());
} catch (error) {
	core.setFailed(error.message);
}
