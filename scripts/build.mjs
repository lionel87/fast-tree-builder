import { execSync } from 'node:child_process';
import { rmSync, renameSync, readFileSync, writeFileSync } from 'node:fs';
import { normalize } from 'node:path';
import esbuild from 'esbuild';

try {
	rmSync('build', { force: true, recursive: true });
	execSync(normalize('./node_modules/.bin/tsc'), { stdio: 'inherit' });
	renameSync('build/index.d.mts', 'index.d.mts');
	const dmts = readFileSync('index.d.mts', 'utf-8');
	const dcts = dmts
		.replace('export default function buildTree', 'declare function buildTree')
		.replace('export {};', 'declare const _default: { default: typeof buildTree };\nexport = _default;');
	writeFileSync('index.d.cts', dcts);
} catch (error) {
	console.error(error);
	console.error('Build failed.');
} finally {
	rmSync('build', { force: true, recursive: true });
}

esbuild.buildSync({
	format: 'esm',
	outdir: '.',
	outExtension: { '.js': '.mjs' },
	entryPoints: ['src/index.mts'],
});

esbuild.buildSync({
	format: 'cjs',
	outdir: '.',
	outExtension: { '.js': '.cjs' },
	entryPoints: ['src/index.mts'],
});
