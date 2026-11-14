import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url));
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

function parseTheme(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`Theme selector not found: ${selector}`);
  return Object.fromEntries([...match[1].matchAll(/--([\w-]+)\s*:\s*(#[\da-fA-F]{6})/g)].map(([, name, value]) => [name, value.toLowerCase()]));
}

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [path] : [];
  });
}

const themes = [
  ['light', parseTheme(':root,\n[data-theme="light"]')],
  ['dark', parseTheme('[data-theme="dark"]')],
];
const contracts = [
  ['body text', 'foreground', 'background', 4.5],
  ['secondary text', 'muted-foreground', 'surface', 4.5],
  ['subtle text', 'subtle', 'surface', 4.5],
  ['primary action text', 'primary-foreground', 'primary', 4.5],
  ['danger text', 'danger', 'danger-soft', 4.5],
  ['success text', 'success', 'success-soft', 4.5],
  ['info text', 'info', 'info-soft', 4.5],
  ['warning text', 'warning', 'warning-soft', 4.5],
  ['brand text', 'brand', 'surface', 4.5],
  ['focus indicator', 'focus', 'surface', 3],
  ['disabled text', 'disabled-foreground', 'disabled', 4.5],
  ['auth panel text on gradient start', 'auth-foreground', 'auth-gradient-start', 4.5],
  ['auth panel text on gradient end', 'auth-foreground', 'auth-gradient-end', 4.5],
];

let failed = false;
for (const [themeName, tokens] of themes) {
  for (const [label, foreground, background, minimum] of contracts) {
    if (!tokens[foreground] || !tokens[background]) {
      console.error(`FAIL ${themeName} ${label}: missing semantic color token.`);
      failed = true;
      continue;
    }
    const ratio = contrast(tokens[foreground], tokens[background]);
    const passed = ratio >= minimum;
    console.log(`${passed ? 'PASS' : 'FAIL'} ${themeName} ${label}: ${ratio.toFixed(2)}:1 (min ${minimum}:1)`);
    failed ||= !passed;
  }
}

const hardcodedColorClass = /(?:text|bg|border|ring|outline)-\[#(?:[\da-fA-F]{3}|[\da-fA-F]{6})\]|(?:text|bg|border|ring|outline)-(?:white|black|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:\d{2,3})?/;
const hardcodedColorValue = /#[\da-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/i;
for (const file of collectSourceFiles(sourceRoot)) {
  const content = readFileSync(file, 'utf8');
  if (hardcodedColorClass.test(content) || hardcodedColorValue.test(content)) {
    console.error(`FAIL hardcoded color in ${file.replace(sourceRoot, 'src')}`);
    failed = true;
  }
}

if (failed) process.exit(1);
