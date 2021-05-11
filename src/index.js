const core = require('@actions/core');
const model = require('./model.js');

async function main() {
	try {
		console.log("Initializing labels");
		await model.initLabels();

		console.log("Getting issue");
		const issue = await model.getCurrentIssue();
		console.log(issue);

		if (issue.state === 'open') {
			console.log("Analyzing current issue/PR");
			const isReady = await model.update(issue);

			if (isReady == false)  // undefined means no blocking issues
				core.setFailed("PR is blocked")
			else if (isReady == undefined) 
				console.log("No blocking issues found.")
			else if (isReady == true) 
				console.log("All blocking issues have been closed")
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

/* TODO: 
- rewrite comment instead of adding new one each time
- support closed issues
*/