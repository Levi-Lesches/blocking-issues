const core = require('@actions/core');
const model = require('./model.js');

async function main() {
	try {
		console.log("Getting issue");
		var issue = await model.getCurrentIssue();
		issue = issue.data;
		console.log(issue);

		if (issue.state === 'open') {
			console.log("Analyzing current issue/PR");
			const isReady = await model.update(issue);

			console.log(`Is ready? ${isReady}`);
			if (!isReady) core.setFailed("PR is blocked")
		} else {
			console.log("Issue is closed. Checking for blocked PRs");
			// get blocked PRs
			// reprocess each one (call update on it)
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

main()