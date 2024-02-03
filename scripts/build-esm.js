import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname, relative, normalize } from 'node:path';
import { rimrafSync } from 'rimraf';

try {
	// clean up previous build
	rimrafSync('build');

	// generate transpiled code
	execSync(
		normalize('./node_modules/.bin/tsc'),
		{ stdio: 'inherit' }
	);

	// move files to package root
	for (const file of readdirSync('build', { recursive: true, withFileTypes: true })) {
		const source = join(file.path, file.name);
		const target = relative('build', source);
		mkdirSync(dirname(target), { recursive: true });
		renameSync(source, target);
	}
} catch (error) {
	console.error(error);
	console.error('ESM build failed.');
} finally {
	// clean up build
	rimrafSync('build');
}
