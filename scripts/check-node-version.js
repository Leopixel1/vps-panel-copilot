#!/usr/bin/env node

const { engines } = require('../package.json');
const currentVersion = process.version;
const requiredVersion = engines.node;

const semver = currentVersion.slice(1).split('.').map(Number);
const required = requiredVersion.replace('>=', '').split('.').map(Number);

const [currentMajor] = semver;
const [requiredMajor] = required;

if (currentMajor < requiredMajor) {
  console.error('\x1b[31m%s\x1b[0m', `
╔═══════════════════════════════════════════════════════════════════╗
║                    NODE.JS VERSION ERROR                          ║
╚═══════════════════════════════════════════════════════════════════╝

Your Node.js version (${currentVersion}) is not compatible with this project.
Required: Node.js ${requiredVersion}

This error typically occurs when running "pnpm install" with:
  - SyntaxError: Unexpected token '.' in pnpm.cjs
  - Optional chaining (?.) syntax errors

SOLUTION:
  1. Update Node.js to version 18 or higher:
     
     # Using nvm (recommended):
     nvm install 18
     nvm use 18
     
     # Or download from: https://nodejs.org/

  2. Verify the version:
     node --version

  3. Try the installation again:
     pnpm install

For more help, see: https://github.com/Leopixel1/vps-panel-copilot/blob/main/SETUP.md

`);
  process.exit(1);
}

console.log('\x1b[32m%s\x1b[0m', `✓ Node.js version check passed (${currentVersion})`);
