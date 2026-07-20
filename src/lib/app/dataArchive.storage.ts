import {
	applyDataImport,
	createDataArchive,
	parseDataArchive,
	serializeDataArchive,
	type DataArchive,
	type DataImportMode,
	type DurableData
} from './dataArchive';
import {
	loadDurableData,
	replaceDurableData
} from './durableData.storage';

export async function createStoredDataArchive(exportedAt?: string): Promise<DataArchive> {
	return createDataArchive(await loadDurableData(), exportedAt);
}

export async function serializeStoredDataArchive(exportedAt?: string): Promise<string> {
	return serializeDataArchive(await createStoredDataArchive(exportedAt));
}

export async function importStoredDataArchive(
	input: string | unknown,
	mode: DataImportMode
): Promise<DurableData> {
	const archive = parseDataArchive(input);
	const next = applyDataImport(await loadDurableData(), archive, mode);
	await replaceDurableData(next);
	return next;
}
