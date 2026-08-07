import { describe, expect, it } from "bun:test";
import ConfigSchema from "./schema";

describe("ConfigSchema", () => {
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

	it("accepts valid configuration", () => {
		const result = ConfigSchema.safeParse(validConfig);
		expect(result.success).toBe(true);
	});

	it("accepts valid configuration without min_delta", () => {
		const configWithoutMinDelta = {
			...validConfig,
			metric: {
				...validConfig.metric,
				min_delta: undefined,
			},
		};

		const result = ConfigSchema.safeParse(configWithoutMinDelta);
		expect(result.success).toBe(true);
	});

	it("rejects invalid metric direction", () => {
		const invalidConfig = {
			...validConfig,
			metric: {
				...validConfig.metric,
				direction: "invalid_direction",
			},
		};

		const result = ConfigSchema.safeParse(invalidConfig);
		expect(result.success).toBe(false);
	});

	it("rejects invalid iterations", () => {
		const invalidConfig = {
			...validConfig,
			iterations: -5,
		};

		const result = ConfigSchema.safeParse(invalidConfig);
		expect(result.success).toBe(false);
	});
});
