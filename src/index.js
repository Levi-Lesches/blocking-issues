const core = require('@actions/core');
const model = require('./model.js');

async function main() {
	try {
		console.log("Getting issue");
		const issue = await model.getCurrentIssue();
		console.log(issue);
		if (issue.state === 'open') {
			model.update(issue);
		} else {
			// get blocked PRs
			// reprocess each one (call update on it)
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

main()