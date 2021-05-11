const core = require('@actions/core');
const model = require('./model.js');

async function main() {
	try {
		// const octokit = github.getOctokit(github.token);

		console.log("Hello, World!");
		console.log(await model.getCurrentIssue());
	} catch (error) {
		core.setFailed(error.message);
	}
}

main()