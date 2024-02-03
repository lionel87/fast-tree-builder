import { execSync } from 'child_process';
import { watch } from 'chokidar';

watch('src/**/*', { ignoreInitial: false })
	.addListener('all', () => execSync('npm run build', { stdio: 'inherit' }));
