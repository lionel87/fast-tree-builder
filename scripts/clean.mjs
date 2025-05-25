import { rmSync, readdirSync } from 'node:fs';

const rm = (dir) => rmSync(dir, { force: true, recursive: true });

rm('coverage');
rm('build');

for (const file of readdirSync('.')) {
	if (!file.startsWith('.') && ['.js', '.d.ts', '.cjs', '.d.cts', '.mjs', '.d.mts'].some(x => file.endsWith(x))) {
		rm(file);
	}
}
