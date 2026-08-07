import { z } from "zod";

const MetricSchema = z.object({
	name: z.string(),
	direction: z.enum(["maximize", "minimize"]),
	min_delta: z.number().optional(),
});

const ConfigSchema = z.object({
	target_files: z.array(z.string()),
	test_command: z.string(),
	benchmark_command: z.string(),
	benchmark_output: z.string(),
	metric: MetricSchema,
	iterations: z.number().int().positive(),
});

export type Config = z.infer<typeof ConfigSchema>;

export default ConfigSchema;
