import * as core from "@actions/core";
import * as model from "./model.js";

async function main() {
	try {
		core.info("Getting current issue...");
		const issue = await model.getCurrentIssue();
		core.debug(issue);

		if (issue.state === "open") {
			const isBlocked = await model.update(issue);

			if (isBlocked === undefined) core.info("No blocking issues found."); 
			else if (isBlocked === true) core.setFailed("Issue/PR is blocked.");
			else if (isBlocked === false) core.info("Issue/PR is not blocked.");
		} else {
			core.info("Issue is closed. Unblocking other issues...");
			await model.unblockPRs(issue.number);
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

main();
