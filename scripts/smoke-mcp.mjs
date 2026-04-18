import process from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const REQUIRED_TOOLS = ['checkRepository', 'createRepository', 'getPersonalNamespace', 'search'];
const READ_ONLY_TOOLS = ['checkRepository', 'getPersonalNamespace', 'search'];
const MUTATING_TOOLS = ['createRepository'];

function getArgValue(name) {
    const prefix = `${name}=`;
    const inline = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
    if (inline) {
        return inline.slice(prefix.length);
    }

    const index = process.argv.indexOf(name);
    return index === -1 ? undefined : process.argv[index + 1];
}

function getUsername() {
    return (
        getArgValue('--username') ||
        process.env.HUB_USERNAME ||
        process.env.DOCKERHUB_USERNAME ||
        process.env.DOCKERHUB_USER
    );
}

function buildServerParams() {
    const dockerImage = getArgValue('--docker-image');
    const username = getUsername();
    const patToken = process.env.HUB_PAT_TOKEN;
    const serverArgs = ['--transport=stdio'];

    if (username) {
        serverArgs.push(`--username=${username}`);
    }

    if (dockerImage) {
        const dockerArgs = ['run', '--rm', '-i', '--init', '--pull', 'never'];
        if (patToken) {
            dockerArgs.push('-e', 'HUB_PAT_TOKEN');
        }

        dockerArgs.push(dockerImage, ...serverArgs);
        return {
            command: 'docker',
            args: dockerArgs,
            stderr: 'pipe',
            env: process.env,
        };
    }

    return {
        command: process.execPath,
        args: ['dist/index.js', ...serverArgs],
        stderr: 'pipe',
        env: process.env,
    };
}

function getToolByName(tools, name) {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) {
        throw new Error(`Expected MCP tool '${name}' to be listed.`);
    }

    return tool;
}

function assertToolMetadata(tools) {
    for (const name of REQUIRED_TOOLS) {
        getToolByName(tools, name);
    }

    for (const name of READ_ONLY_TOOLS) {
        const tool = getToolByName(tools, name);
        if (tool.annotations?.readOnlyHint !== true) {
            throw new Error(`Expected '${name}' to advertise annotations.readOnlyHint=true.`);
        }
    }

    for (const name of MUTATING_TOOLS) {
        const tool = getToolByName(tools, name);
        if (tool.annotations?.readOnlyHint === true) {
            throw new Error(`Expected mutating tool '${name}' not to advertise readOnlyHint=true.`);
        }
    }
}

function resultText(result) {
    return (result.content || [])
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join('\n');
}

async function assertPublicReadCall(client) {
    const result = await client.callTool({
        name: 'checkRepository',
        arguments: {
            namespace: 'library',
            repository: 'alpine',
        },
    });

    if (result.isError) {
        throw new Error(`checkRepository returned an MCP error: ${resultText(result)}`);
    }

    const text = resultText(result);
    if (!/library exists/i.test(text)) {
        throw new Error(`checkRepository returned unexpected text: ${text}`);
    }
}

async function assertAuthenticatedReadCall(client) {
    const username = getUsername();
    if (!username || !process.env.HUB_PAT_TOKEN) {
        process.stdout.write(
            'authenticated MCP smoke skipped; HUB_PAT_TOKEN and username were not both provided.\n'
        );
        return;
    }

    const result = await client.callTool({
        name: 'getPersonalNamespace',
        arguments: {},
    });

    const text = resultText(result);
    if (result.isError) {
        throw new Error(`getPersonalNamespace returned an MCP error: ${text}`);
    }

    if (!text.includes(username)) {
        throw new Error(
            `getPersonalNamespace did not return expected username '${username}': ${text}`
        );
    }
}

async function main() {
    const client = new Client({
        name: 'dockerhub-mcp-smoke',
        version: '1.0.0',
    });
    const transport = new StdioClientTransport(buildServerParams());

    try {
        await client.connect(transport);
        const { tools } = await client.listTools();
        assertToolMetadata(tools);
        await assertPublicReadCall(client);
        await assertAuthenticatedReadCall(client);
        process.stdout.write('MCP smoke checks passed.\n');
    } finally {
        await client.close();
    }
}

main().catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exit(1);
});
