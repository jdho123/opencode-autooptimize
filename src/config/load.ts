import { async as fastGlob } from "fast-glob";
import type { z } from "zod";
import ConfigSchema from "./schema.ts";

type Config = z.infer<typeof ConfigSchema>;

async function loadConfig(): Promise<Config> {
	const configPattern = "**/autooptimize.json";

	// Always select the first configuration file found
	const [configFilePath] = await fastGlob(configPattern, {
		absolute: true,
		onlyFiles: true,
		ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
	});
	if (!configFilePath) {
		throw new Error(
			"No configuration file found. Please ensure that an 'autooptimize.json' file exists in your project.",
		);
	}
	const configFile = Bun.file(configFilePath);

	let configJSON: unknown;
	try {
		configJSON = await configFile.json();
	} catch (_error) {
		throw new Error(
			`Failed to parse configuration file at ${configFilePath}. Please ensure it is valid JSON.`,
		);
	}

	const parsedConfig = ConfigSchema.safeParse(configJSON);
	if (!parsedConfig.success) {
		const errorMessages = parsedConfig.error.issues
			.map((issue) => `- ${issue.path.join(".")} : ${issue.message}`)
			.join("\n");

		throw new Error(
			`Configuration file at ${configFilePath} is invalid:\n${errorMessages}`,
		);
	}

	return parsedConfig.data;
}

export default loadConfig;
