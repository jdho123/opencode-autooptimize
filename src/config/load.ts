import { async as fastGlob } from "fast-glob";
import type { Config } from "./schema.ts";
import ConfigSchema from "./schema.ts";

export class ConfigNotFoundError extends Error {
	constructor() {
		super(
			"No configuration file found. Please ensure that an 'autooptimize.json' file exists in your project.",
		);
	}
}

export class ConfigParseError extends Error {
	constructor(configFilePath: string) {
		super(
			`Failed to parse configuration file at ${configFilePath}. Please ensure it is valid JSON.`,
		);
	}
}

export class ConfigValidationError extends Error {
	constructor(configFilePath: string, errorMessages: string) {
		super(
			`Configuration file at ${configFilePath} is invalid:\n${errorMessages}`,
		);
	}
}

async function loadConfig(): Promise<Config> {
	const configPattern = "**/autooptimize.json";

	// Always select the first configuration file found
	const [configFilePath] = await fastGlob(configPattern, {
		absolute: true,
		onlyFiles: true,
		ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
	});
	if (!configFilePath) {
		throw new ConfigNotFoundError();
	}
	const configFile = Bun.file(configFilePath);

	let configJSON: unknown;
	try {
		configJSON = await configFile.json();
	} catch (_error) {
		throw new ConfigParseError(configFilePath);
	}

	const parsedConfig = ConfigSchema.safeParse(configJSON);
	if (!parsedConfig.success) {
		const errorMessages = parsedConfig.error.issues
			.map((issue) => `- ${issue.path.join(".")} : ${issue.message}`)
			.join("\n");

		throw new ConfigValidationError(configFilePath, errorMessages);
	}

	return parsedConfig.data;
}

export default loadConfig;
