import { describe, expect, it, mock, spyOn } from "bun:test";
import loadConfig from "./load";
import type { Config } from "./schema";

const mockFastGlobAsync = mock();

mock.module("fast-glob", () => ({
	async: mockFastGlobAsync,
}));

describe("loadConfig", () => {
	const validConfig = {
		target_files: ["src/**/*.ts"],
		test_command: "test command",
		benchmark_command: "benchmark command",
		benchmark_output: "output file",
		metric: {
			name: "execution_time",
			direction: "minimize",
			min_delta: 0.1,
		},
		iterations: 10,
	};

	it("loads configuration from a valid file", async () => {
		mockFastGlobAsync.mockResolvedValue(["/fake/path/autooptimize.json"]);

		spyOn(Bun, "file").mockReturnValue({
			json: async () => ({
				...validConfig,
			}),
		} as ReturnType<typeof Bun.file>);

		const config = await loadConfig();

		expect(config).toEqual(validConfig as Config);
	});

	it("throws error if no configuration file found", async () => {
		mockFastGlobAsync.mockResolvedValue([]);

		await expect(loadConfig()).rejects.toThrow(
			"No configuration file found. Please ensure that an 'autooptimize.json' file exists in your project.",
		);
	});

	it("throws error if configuration file is invalid JSON", async () => {
		mockFastGlobAsync.mockResolvedValue(["/fake/path/autooptimize.json"]);

		spyOn(Bun, "file").mockReturnValue({
			json: async () => {
				throw new Error("Invalid JSON");
			},
		} as unknown as ReturnType<typeof Bun.file>);

		await expect(loadConfig()).rejects.toThrow(
			"Failed to parse configuration file at /fake/path/autooptimize.json. Please ensure it is valid JSON.",
		);
	});

	it("throws error if configuration file does not match schema", async () => {
		mockFastGlobAsync.mockResolvedValue(["/fake/path/autooptimize.json"]);

		spyOn(Bun, "file").mockReturnValue({
			json: async () => ({
				...validConfig,
				iterations: "not a number", // Invalid type
			}),
		} as unknown as ReturnType<typeof Bun.file>);

		await expect(loadConfig()).rejects.toThrow(
			`Configuration file at /fake/path/autooptimize.json is invalid:\n- iterations : Invalid input: expected number, received string`,
		);
	});
});
