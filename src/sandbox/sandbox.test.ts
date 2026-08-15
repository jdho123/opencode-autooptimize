import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import type { Config } from "../config/schema";
import {
	cleanupSandboxConfig,
	generateSandboxConfig,
	sandboxCommand,
} from "./sandbox";

describe("generateSandboxConfig", () => {
	afterEach(() => {
		spyOn(Bun, "write").mockRestore();
	});

	it("formats and writes config to file", async () => {
		const writeSpy = spyOn(Bun, "write").mockResolvedValue(100);

		const target_files = ["fileymcfileface.txt", "thefile.txt"];

		await generateSandboxConfig({ target_files } as Config);

		const expectedJSON = JSON.stringify(
			{
				filesystem: {
					denyRead: ["."],
					allowRead: target_files,
					allowWrite: target_files,
				},
				network: {
					allowedDomains: [],
					deniedDomains: [],
				},
			},
			null,
			2,
		);

		expect(writeSpy).toHaveBeenCalledWith(expect.anything(), expectedJSON);
	});

	it("throws error if write fails", async () => {
		spyOn(Bun, "write").mockRejectedValue(new Error("Errymcerror"));

		const mockConfig = { target_files: [] as string[] } as Config;

		expect(generateSandboxConfig(mockConfig)).rejects.toThrow();
	});
});

describe("cleanupSandboxConfig", () => {
	it("successfully deletes the config file", async () => {
		const deleteMock = mock(() => Promise.resolve());

		const bunFileSpy = spyOn(Bun, "file").mockReturnValue({
			delete: deleteMock,
		} as unknown as ReturnType<typeof Bun.file>);

		await expect(cleanupSandboxConfig()).resolves.toBeUndefined();

		expect(bunFileSpy).toHaveBeenCalled();
		expect(deleteMock).toHaveBeenCalled();
	});

	it("ignores ENOENT errors", async () => {
		const enoentError = Object.assign(new Error("File not found"), {
			code: "ENOENT",
		});

		const deleteMock = mock(() => Promise.reject(enoentError));
		spyOn(Bun, "file").mockReturnValue({
			delete: deleteMock,
		} as unknown as ReturnType<typeof Bun.file>);

		await expect(cleanupSandboxConfig()).resolves.toBeUndefined();
		expect(deleteMock).toHaveBeenCalled();
	});

	it("throws error for non-ENOENT system errors", async () => {
		const error = Object.assign(new Error("Errymcerror"), {
			code: "codemccode",
		});

		const deleteMock = mock(() => Promise.reject(error));
		spyOn(Bun, "file").mockReturnValue({
			delete: deleteMock,
		} as unknown as ReturnType<typeof Bun.file>);

		await expect(cleanupSandboxConfig()).rejects.toThrow();
		expect(deleteMock).toHaveBeenCalled();
	});
});

describe("sandboxCommand", () => {
	it("injects command at the end of the srt string", () => {
		const command = "npm run build";
		const result = sandboxCommand(command);

		expect(result).toStartWith("srt -s ");

		expect(result).toEndWith(` ${command}`);
	});

	it("handles empty string commands", () => {
		const result = sandboxCommand("");

		expect(result).toStartWith("srt -s ");
		expect(result).toEndWith(" ");
	});
});
