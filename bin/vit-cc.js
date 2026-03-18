#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const VERSION = pkgJson.version;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const projectRoot = process.cwd();

console.log(`
╔══════════════════════════════════════════════════════╗
║          VIT — Claude Code Workflow Framework        ║
║                    v${VERSION.padEnd(30)}║
╚══════════════════════════════════════════════════════╝
`);

if (dryRun) {
  console.log('  Running in DRY-RUN mode — no files will be written.\n');
}

console.log(`  Target: ${projectRoot}\n`);

const { install } = require('../src/install.js');

install(projectRoot, { dryRun })
  .then(installed => {
    console.log(`
  ✓ VIT ${VERSION} installed successfully!

  What was installed:
${installed.map(s => `    • ${s}`).join('\n')}

  Get started:
    /vit:new-project    — Initialize a new project
    /vit:help           — Show all available commands
    /vit:update         — Update to the latest version

  GitHub integration:
    Requires GITHUB_TOKEN in your repo secrets.
    Automatically posts CI results to phase issues on push.

  Docs: https://github.com/LeVarez/vit-cc
`);
  })
  .catch(err => {
    console.error('\n  Installation failed:', err.message);
    process.exit(1);
  });
