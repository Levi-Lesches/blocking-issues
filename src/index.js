import * as core from "@actions/core";
import * as model from "./model.js";

async function main() {
	try {
		core.info("Getting current issue...");
		const issue = await model.getCurrentIssue();
		core.debug(issue);

		if (issue.state === "open") {
			const isReady = await model.update(issue);

			if (isReady === undefined) core.info("No blocking issues found."); 
			else if (isReady === false) core.setFailed("Issue/PR is blocked.");
			else if (isReady === true) core.info("Issue/PR is not blocked.");
		} else {
			core.info("Issue is closed. Unblocking other issues...");
			await model.unblockPRs(issue.number);
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

main();
