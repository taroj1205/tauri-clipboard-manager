import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Read package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Read tauri.conf.json
const tauriConfigPath = join('src-tauri', 'tauri.conf.json');
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf8'));

// Update version in tauri.conf.json
tauriConfig.version = version;

// Write back to tauri.conf.json
writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');
