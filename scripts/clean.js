import { rmSync, readdirSync } from 'node:fs';

const rm = (dir) => rmSync(dir, { force: true, recursive: true });

rm('coverage');
rm('build');

for (const file of readdirSync('.')) {
	if (!file.startsWith('.') && ['.js', '.cjs', '.mjs', '.d.ts'].some(x => file.endsWith(x))) {
		rm(file);
	}
}
