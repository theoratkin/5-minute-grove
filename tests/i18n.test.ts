import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const locales = ['en', 'es', 'pt-BR', 'fr', 'de', 'zh-CN', 'ja', 'ko', 'id', 'ru'];

function readMessages(locale: string): Record<string, string> {
	return JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Record<string, string>;
}

function placeholders(message: string): string[] {
	return [...message.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
}

test('every locale has the same messages and placeholders as English', () => {
	const english = readMessages('en');
	const englishKeys = Object.keys(english).sort();

	for (const locale of locales) {
		const messages = readMessages(locale);
		assert.deepEqual(Object.keys(messages).sort(), englishKeys, `${locale} message keys`);

		for (const key of englishKeys) {
			assert.deepEqual(
				placeholders(messages[key]),
				placeholders(english[key]),
				`${locale}.${key} placeholders`
			);
		}
	}
});
