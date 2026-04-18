import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const expectations = [
    {
        file: 'src/accounts.ts',
        mustBeReadOnly: ['listNamespaces', 'getPersonalNamespace', 'listAllNamespacesMemberOf'],
        mustNotBeReadOnly: [],
    },
    {
        file: 'src/repos.ts',
        mustBeReadOnly: [
            'listRepositoriesByNamespace',
            'getRepositoryInfo',
            'checkRepository',
            'listRepositoryTags',
            'getRepositoryTag',
            'checkRepositoryTag',
        ],
        mustNotBeReadOnly: ['createRepository', 'updateRepositoryInfo'],
    },
    {
        file: 'src/scout.ts',
        mustBeReadOnly: ['dockerHardenedImages'],
        mustNotBeReadOnly: [],
    },
    {
        file: 'src/search.ts',
        mustBeReadOnly: ['search'],
        mustNotBeReadOnly: [],
    },
];

function readFile(relativePath) {
    return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function getToolBlock(source, toolName) {
    const marker = `'${toolName}'`;
    const start = source.indexOf(marker);
    if (start === -1) {
        throw new Error(`Could not locate registerTool block for ${toolName}.`);
    }

    const nextTool = source.indexOf('this.tools.set(', start + marker.length);
    return source.slice(start, nextTool === -1 ? undefined : nextTool);
}

function assertReadOnlyState(source, toolName, expectedReadOnly) {
    const block = getToolBlock(source, toolName);
    const hasHint = /readOnlyHint:\s*true/.test(block);

    if (expectedReadOnly && !hasHint) {
        throw new Error(`${toolName} is missing readOnlyHint: true.`);
    }

    if (!expectedReadOnly && hasHint) {
        throw new Error(`${toolName} should not publish readOnlyHint: true.`);
    }
}

for (const fileExpectation of expectations) {
    const source = readFile(fileExpectation.file);

    for (const toolName of fileExpectation.mustBeReadOnly) {
        assertReadOnlyState(source, toolName, true);
    }

    for (const toolName of fileExpectation.mustNotBeReadOnly) {
        assertReadOnlyState(source, toolName, false);
    }
}

process.stdout.write('readOnlyHint annotations validated successfully.\n');
