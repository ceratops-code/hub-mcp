# Contributing to Docker Hub MCP Server

Thank you for contributing to this Docker Hub MCP server fork.

This repository tracks the upstream Docker Hub MCP server and carries compatibility fixes that are useful before they are available upstream.

## Before You Start

- Use issues for bug reports, enhancement requests, and design discussion: https://github.com/ceratops-code/hub-mcp/issues
- Use GitHub private vulnerability reporting for suspected security issues: https://github.com/ceratops-code/hub-mcp/security/advisories/new
- Check the upstream project before starting broad changes: https://github.com/docker/hub-mcp
- Keep pull requests focused and small enough to review.

## Development Setup

1. Fork this repository.
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR-USERNAME/hub-mcp.git
   cd hub-mcp
   ```

3. Add this repository as the upstream remote:

   ```bash
   git remote add upstream https://github.com/ceratops-code/hub-mcp.git
   git fetch upstream
   ```

4. Install dependencies and build:

   ```bash
   npm ci
   npm run build
   ```

## Expected Checks

Run the full local verification suite before opening a pull request:

```bash
npm run verify:all
```

This runs linting, formatting checks, tests, TypeScript build, generated tool-list checks, Docker image build, MCP smoke tests, and Docker MCP smoke tests.

For small documentation-only changes, at minimum run:

```bash
npm run format:check
```

## Pull Requests

- Branch from the latest `main`.
- Fill out the pull request template.
- Link related issues when applicable.
- Include documentation updates with behavior changes.
- Add or update regression checks for bug fixes.
- Rebase on `main` instead of merging `main` into the feature branch.

## Tool Changes

When adding or changing MCP tools:

- Follow the Model Context Protocol documentation: https://modelcontextprotocol.io
- Keep tool names, descriptions, schemas, and annotations accurate.
- Mark non-mutating tools with `readOnlyHint: true`.
- Document any new configuration, environment variables, or authentication requirements.
- Verify behavior through the MCP smoke tests and, when relevant, a real MCP client.

## Code Style

- Follow the existing TypeScript style.
- Prefer clear error handling and precise user-facing messages.
- Do not commit generated output unless it is intentionally tracked by the repository.
- Run `npm run format:fix` when formatting fails.

## Security

Do not open public issues for vulnerabilities. Use private vulnerability reporting:

https://github.com/ceratops-code/hub-mcp/security/advisories/new
