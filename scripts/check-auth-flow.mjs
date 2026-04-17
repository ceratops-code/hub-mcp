/* eslint-env node */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(rootDir, 'src/asset.ts'), 'utf8');

const expectations = [
    {
        name: 'uses documented Docker Hub auth token endpoint',
        pattern: /https:\/\/hub\.docker\.com\/v2\/auth\/token/,
    },
    {
        name: 'sends username as identifier',
        pattern: /identifier:\s*username/,
    },
    {
        name: 'sends PAT as secret',
        pattern: /secret:\s*this\.config\.auth\?\.token\?\.trim\(\)/,
    },
    {
        name: 'returns access_token from the auth response',
        pattern: /return\s+data\.access_token/,
    },
];

for (const expectation of expectations) {
    if (!expectation.pattern.test(source)) {
        throw new Error(`Auth flow check failed: ${expectation.name}.`);
    }
}

const forbiddenPatterns = [
    {
        name: 'legacy users/login endpoint',
        pattern: /https:\/\/hub\.docker\.com\/v2\/users\/login/,
    },
    {
        name: 'legacy password payload field',
        pattern: /password:\s*this\.config\.auth\?\.token/,
    },
    {
        name: 'legacy token response field',
        pattern: /return\s+data\.token/,
    },
];

for (const forbidden of forbiddenPatterns) {
    if (forbidden.pattern.test(source)) {
        throw new Error(`Auth flow check failed: found ${forbidden.name}.`);
    }
}

process.stdout.write('Docker Hub PAT auth flow validated successfully.\n');
