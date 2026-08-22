import { describe, expect, it } from "bun:test";
import path from "node:path";
import makePermissionGate from "./permission";

describe("makePermissionGate", () => {
	const worktree = "mock/project";
	const targetFiles = ["fileymcfileface"];
	const loopSessionIds = new Set(["1", "2", "3"]);

	const gate = makePermissionGate(worktree, targetFiles, loopSessionIds);

	const runGate = (
		tool: string,
		sessionID: string,
		args: Record<string, unknown> = {},
	) => {
		const input = { sessionID, tool, callID: "1" };
		const output = { args };
		return gate(input, output);
	};

	it("gate does not restrict user sessions", async () => {
		runGate("task", "4");
	});

	it("gate blocks task tool calls for loop sessions", async () => {
		expect(runGate("task", "1")).rejects.toThrow();
	});

	it("gate blocks tools in EXPLORATION_TOOLS for loop sessions", async () => {
		expect(runGate("grep", "1")).rejects.toThrow();
	});

	it("gate blocks tools in FILE_TOOLS for prohibited files in loop sessions", async () => {
		expect(
			runGate("read", "1", { filePath: "notfileymcfileface" }),
		).rejects.toThrow();
	});

	it("gate allows tools in FILE_TOOLS for allowed files in loop sessions (exact path)", async () => {
		const absolutePath = path.resolve(worktree, "fileymcfileface");

		runGate("read", "1", { filePath: absolutePath });
	});

	it("gate allows tools in FILE_TOOLS for allowed files in loop sessions (relative path)", async () => {
		runGate("read", "1", { filePath: "src/../fileymcfileface" });
	});

	it("gate allows unrestricted tools for loop sessions", async () => {
		runGate("webfetch", "1");
	});
});
