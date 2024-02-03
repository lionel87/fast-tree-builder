import { execSync } from 'child_process';
import { watch } from 'chokidar';

watch('src/**/*', { ignoreInitial: false })
	.addListener('all', () => execSync('node scripts/build.js', { stdio: 'inherit' }));
