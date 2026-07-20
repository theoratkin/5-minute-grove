import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const themeDirectory = 'src/lib/styles/themes';
const requiredColorTokens = [
	'ink',
	'ink-muted',
	'paper',
	'mist',
	'surface',
	'on-accent',
	'moss',
	'moss-dark',
	'moss-pressed',
	'moss-hover-pressed',
	'sprout',
	'sun',
	'clay'
];

function luminance(hex: string): number {
	const channels = hex
		.slice(1)
		.match(/.{2}/g)!
		.map((channel) => Number.parseInt(channel, 16) / 255)
		.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);

	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: string, second: string): number {
	const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
	return (lighter + 0.05) / (darker + 0.05);
}

function colorToken(source: string, token: string): string {
	const value = source.match(new RegExp(`--theme-color-${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
	assert.ok(value, `missing --theme-color-${token}`);
	return value;
}

test('registered themes, pre-hydration themes, and theme files stay in sync', () => {
	const registry = readFileSync('src/lib/app/theme.ts', 'utf8');
	const registeredThemes = [...registry.matchAll(/\{ id: '([^']+)'/g)].map((match) => match[1]).sort();

	const appHtml = readFileSync('src/app.html', 'utf8');
	const preHydrationList = appHtml.match(/const themes = \[([\s\S]*?)\];/)?.[1];
	assert.ok(preHydrationList, 'missing pre-hydration theme list');
	const preHydrationThemes = [...preHydrationList.matchAll(/'([^']+)'/g)].map((match) => match[1]).sort();

	const themeFiles = readdirSync(themeDirectory)
		.filter((file) => file.endsWith('.css'))
		.map((file) => file.replace(/\.css$/, ''))
		.sort();
	const tokens = readFileSync('src/lib/styles/tokens.css', 'utf8');
	const importedThemes = [...tokens.matchAll(/@import '\.\/themes\/([^']+)\.css';/g)]
		.map((match) => match[1])
		.sort();

	assert.deepEqual(preHydrationThemes, registeredThemes);
	assert.deepEqual(themeFiles, registeredThemes);
	assert.deepEqual(importedThemes, registeredThemes);
});

test('every theme defines the semantic palette with accessible primary actions', () => {
	for (const file of readdirSync(themeDirectory).filter((entry) => entry.endsWith('.css'))) {
		const source = readFileSync(`${themeDirectory}/${file}`, 'utf8');

		for (const token of requiredColorTokens) colorToken(source, token);
		assert.match(source, /--splash-color:\s*rgb\(/, `${file} missing --splash-color`);

		const onAccent = colorToken(source, 'on-accent');
		for (const backgroundToken of ['moss', 'moss-dark']) {
			const ratio = contrast(onAccent, colorToken(source, backgroundToken));
			assert.ok(ratio >= 4.5, `${file} ${backgroundToken} contrast is ${ratio.toFixed(2)}:1`);
		}
	}
});
