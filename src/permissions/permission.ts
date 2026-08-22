import path from "node:path";
import type { Hooks } from "@opencode-ai/plugin";

type ToolExecuteBefore = NonNullable<Hooks["tool.execute.before"]>;
type Input = Parameters<ToolExecuteBefore>[0];
type Output = Parameters<ToolExecuteBefore>[1];

const FILE_TOOLS = new Set(["read", "write", "edit", "apply_patch"]);
const EXPLORATION_TOOLS = new Set(["glob", "grep", "list"]);

function makePermissionGate(
	worktree: string,
	targetFiles: string[],
	loopSessionIds: Set<string>,
) {
	const allowed = new Set(targetFiles.map((f) => path.resolve(worktree, f)));

	return async (input: Input, output: Output) => {
		if (!loopSessionIds.has(input.sessionID)) return; // Never gate the user's session

		if (input.tool === "task") {
			throw new Error(
				"Subagent delegation is disabled inside optimization loop sessions.",
			);
		}
		if (EXPLORATION_TOOLS.has(input.tool)) {
			throw new Error(
				`Session can only see the target files: ${targetFiles.join(", ")}`,
			);
		}
		if (FILE_TOOLS.has(input.tool)) {
			const resolved = path.resolve(worktree, output.args.filePath);
			if (!allowed.has(resolved)) {
				throw new Error(
					`Session may only touch the target files: ${targetFiles.join(", ")}`,
				);
			}
		}
	};
}

export default makePermissionGate;
