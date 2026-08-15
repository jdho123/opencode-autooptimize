import type { Config } from "../config/schema";

const sandboxConfigPath = ".srt-settings.json";

export async function generateSandboxConfig(
	plugin_config: Config,
): Promise<void> {
	const srtConfig = {
		filesystem: {
			denyRead: ["."],
			allowRead: plugin_config.target_files,
			allowWrite: plugin_config.target_files,
		},
		network: {
			allowedDomains: [],
			deniedDomains: [],
		},
	};

	try {
		await Bun.write(sandboxConfigPath, JSON.stringify(srtConfig, null, 2));
	} catch (error) {
		throw new Error(
			`Failed to write sandbox configuration file to ${sandboxConfigPath}: ${error}`,
		);
	}
}

export async function cleanupSandboxConfig(): Promise<void> {
	try {
		const file = Bun.file(sandboxConfigPath);
		await file.delete();
	} catch (error) {
		const sysError = error as Error & { code?: string };

		if (sysError.code !== "ENOENT") {
			throw new Error(
				`Failed to remove sandbox configuration file at ${sandboxConfigPath}: ${error}`,
			);
		}
	}
}

export function sandboxCommand(command: string): string {
	return `srt -s ${sandboxConfigPath} ${command}`;
}
