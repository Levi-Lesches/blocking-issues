const core = require('@actions/core');
const github = require('@actions/github');

const dependencies = require('./dependency.js');

try {
	// const octokit = github.getOctokit(github.token);

	console.log("Hello, World!");
	console.log(dependencies.getIssueNumber());
} catch (error) {
	core.setFailed(error.message);
}
