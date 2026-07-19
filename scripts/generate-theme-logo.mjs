import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePath = resolve(process.argv[2] ?? 'media/logo.inkscape.svg');
const outputPath = resolve(process.argv[3] ?? 'src/lib/app/GroveLogo.svelte');
const activeLayer = 'v2';

const themeFills = {
	dirt: 'color-mix(in srgb, var(--color-clay) 58%, var(--color-ink))',
	trunk: 'var(--color-clay)',
	leaf: 'var(--color-moss)'
};

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function elementWithLabel(svg, label) {
	const escapedLabel = escapeRegExp(label);
	const match = svg.match(
		new RegExp(`<(?:path|use|g)\\b(?=[^>]*inkscape:label=["']${escapedLabel}["'])[^>]*>`, 'i')
	);

	if (!match) throw new Error(`Could not find an SVG element labeled "${label}".`);
	return match[0];
}

function fillFromElement(element, label) {
	const styleFill = element.match(/(?:^|;)\s*fill\s*:\s*(#[0-9a-f]{3,8})/i);
	const fillAttribute = element.match(/\sfill=["'](#[0-9a-f]{3,8})["']/i);
	const fill = styleFill?.[1] ?? fillAttribute?.[1];

	if (!fill) throw new Error(`The element labeled "${label}" needs a hexadecimal fill color.`);
	return fill;
}

function extractLayer(svg, label) {
	const escapedLabel = escapeRegExp(label);
	const opening = new RegExp(`<g\\b(?=[^>]*inkscape:label=["']${escapedLabel}["'])[^>]*>`, 'i').exec(svg);
	if (!opening) throw new Error(`Could not find the Inkscape layer "${label}".`);

	const tags = /<g\b[^>]*>|<\/g\s*>/gi;
	tags.lastIndex = opening.index;
	let depth = 0;
	let match;

	while ((match = tags.exec(svg))) {
		depth += match[0].startsWith('</') ? -1 : 1;
		if (depth === 0) return svg.slice(opening.index, tags.lastIndex);
	}

	throw new Error(`The Inkscape layer "${label}" is not closed.`);
}

function replaceFill(svg, sourceFill, themeFill) {
	const color = escapeRegExp(sourceFill);
	return svg
		.replace(new RegExp(`(fill\\s*:\\s*)${color}`, 'gi'), `$1${themeFill}`)
		.replace(new RegExp(`(fill=["'])${color}(["'])`, 'gi'), `$1${themeFill}$2`);
}

function cleanForSvelte(svg) {
	return svg
		.replace(/\s+(?:inkscape|sodipodi):[\w-]+=(?:"[^"]*"|'[^']*')/gi, '')
		.replace(/\s+xlink:href=/gi, ' href=')
		.replace(/^/gm, '\t');
}

const source = await readFile(sourcePath, 'utf8');
const viewBox = source.match(/\bviewBox=["']([^"']+)["']/i)?.[1];
if (!viewBox) throw new Error('The source SVG needs a viewBox.');

const sourceFills = Object.fromEntries(
	Object.keys(themeFills).map((label) => [label, fillFromElement(elementWithLabel(source, label), label)])
);

if (new Set(Object.values(sourceFills).map((fill) => fill.toLowerCase())).size !== 3) {
	throw new Error('The dirt, trunk, and leaf labels must identify three different fill colors.');
}

let illustration = extractLayer(source, activeLayer);
for (const [label, themeFill] of Object.entries(themeFills)) {
	illustration = replaceFill(illustration, sourceFills[label], themeFill);
}

const component = `<!-- Generated from media/logo.inkscape.svg by npm run generate:logo. Do not edit directly. -->
<svg
\tclass="block h-full w-full"
\tviewBox="${viewBox}"
\trole="presentation"
\taria-hidden="true"
>
${cleanForSvelte(illustration)}
</svg>
`;

await writeFile(outputPath, component);
console.log(`Generated ${outputPath} from ${sourcePath}`);
