#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PKG_FILES = path.join(__dirname, '..', 'files');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Merge VIT hooks into .claude/settings.json without clobbering existing config.
 * Adds SessionStart hook + statusLine if not already present.
 */
function mergeSettings(projectRoot) {
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  let settings = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      // Malformed JSON — start fresh
      settings = {};
    }
  }

  // Ensure hooks structure exists
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];

  // Check if vit-check-update is already registered
  const sessionStartHooks = settings.hooks.SessionStart;
  const checkCmd = 'node .claude/hooks/vit-check-update.cjs';
  const alreadyRegistered = sessionStartHooks.some(block => {
    if (!block.hooks) return false;
    return block.hooks.some(h => h.type === 'command' && h.command === checkCmd);
  });

  if (!alreadyRegistered) {
    sessionStartHooks.push({
      hooks: [{ type: 'command', command: checkCmd }]
    });
  }

  // Add statusLine if not set
  if (!settings.statusLine) {
    settings.statusLine = {
      type: 'command',
      command: 'node .claude/hooks/vit-statusline.js'
    };
  }

  fs.mkdirSync(path.join(projectRoot, '.claude'), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

async function install(projectRoot, { dryRun = false } = {}) {
  const log = (msg) => console.log(msg);
  const installed = [];

  const steps = [
    {
      label: '13 specialist agents → .claude/agents/',
      src: path.join(PKG_FILES, 'agents'),
      dest: path.join(projectRoot, '.claude', 'agents'),
    },
    {
      label: '29 slash commands → .claude/commands/vit/',
      src: path.join(PKG_FILES, 'commands', 'vit'),
      dest: path.join(projectRoot, '.claude', 'commands', 'vit'),
    },
    {
      label: 'Session hooks → .claude/hooks/',
      src: path.join(PKG_FILES, 'hooks'),
      dest: path.join(projectRoot, '.claude', 'hooks'),
    },
    {
      label: 'Framework files → .claude/vit/',
      src: path.join(PKG_FILES, 'vit'),
      dest: path.join(projectRoot, '.claude', 'vit'),
    },
  ];

  for (const step of steps) {
    log(`  ${dryRun ? '[dry-run] ' : ''}${step.label}`);
    if (!dryRun) copyDir(step.src, step.dest);
    installed.push(step.label);
  }

  // Settings merge
  log(`  ${dryRun ? '[dry-run] ' : ''}Registering hooks in .claude/settings.json`);
  if (!dryRun) mergeSettings(projectRoot);
  installed.push('hooks registered in .claude/settings.json');

  // GitHub CI — opt-in
  const answer = await ask('\n  Install GitHub CI workflow (.github/workflows/phase-ci.yml)? [y/N] ');
  if (answer === 'y' || answer === 'yes') {
    const ciSrc = path.join(PKG_FILES, 'github', 'workflows', 'phase-ci.yml');
    const ciDest = path.join(projectRoot, '.github', 'workflows', 'phase-ci.yml');
    log(`  ${dryRun ? '[dry-run] ' : ''}GitHub CI → .github/workflows/phase-ci.yml`);
    if (!dryRun) {
      fs.mkdirSync(path.join(projectRoot, '.github', 'workflows'), { recursive: true });
      fs.copyFileSync(ciSrc, ciDest);
    }
    installed.push('GitHub CI workflow → .github/workflows/phase-ci.yml');
  } else {
    log('  Skipping GitHub CI workflow.');
  }

  return installed;
}

module.exports = { install };
