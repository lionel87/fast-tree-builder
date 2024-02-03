import { execSync } from 'node:child_process';
import { rmSync, readdirSync, mkdirSync, renameSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname, relative, normalize } from 'node:path';

// Creates a temporary `build` directory where the `tsc` generates its outputs.
// Later steps should copy and edit those files and remove the `build` dir.

try {
	// --- BUILD ESM ---
	// clean up previous build, should not exist
	rmSync('build', { force: true, recursive: true });

	// generate transpiled code
	execSync(
		normalize('./node_modules/.bin/tsc'),
		{ stdio: 'inherit' }
	);

	// move files to package root
	for (const file of readdirSync('build', { recursive: true, withFileTypes: true })) {
		if (!file.isFile()) continue;
		const source = join(file.path, file.name);
		const target = relative('build', source);
		mkdirSync(dirname(target), { recursive: true });
		renameSync(source, target);
	}

	// --- BUILD CJS ---
	// clean up previous build
	rmSync('build', { force: true, recursive: true });

	// generate transpiled code
	execSync(
		normalize('./node_modules/.bin/tsc --module commonjs --moduleResolution node --declaration false'),
		{ stdio: 'inherit' }
	);

	// move files to package root
	for (const file of readdirSync('build', { recursive: true, withFileTypes: true })) {
		if (!file.isFile()) continue;
		const source = join(file.path, file.name);
		const target = relative('build', source);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(
			target.slice(0, -2) + 'cjs', // replace extension from ".js" to ".cjs"
			readFileSync(source, 'utf8').replace(/require\(\"(.+?)\.js\"\)/g, 'require("$1.cjs")')
		);
	}
} catch (error) {
	console.error(error);
	console.error('Build failed.');
} finally {
	// clean up build
	rmSync('build', { force: true, recursive: true });
}
