import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, relative, normalize } from 'node:path';
import { rimrafSync } from 'rimraf';

try {
	// clean up previous build
	rimrafSync('build');

	// generate transpiled code
	execSync(
		normalize('./node_modules/.bin/tsc --module commonjs --moduleResolution node --declaration false'),
		{ stdio: 'inherit' }
	);

	// move files to package root
	for (const file of readdirSync('build', { recursive: true, withFileTypes: true })) {
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
	console.error('CJS build failed.');
} finally {
	// clean up build
	rimrafSync('build');
}
