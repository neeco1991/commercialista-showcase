import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildDashboardData } from '$lib/finance/metrics';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const csvPath = join(process.cwd(), 'data', 'Piano_dei_Conti.csv');
	const partBDocumentPath = join(process.cwd(), 'docs', 'es1-parte-b.md');
	const csvText = await readFile(csvPath, 'utf-8');
	const partBDocument = await readFile(partBDocumentPath, 'utf-8');

	return {
		dashboard: buildDashboardData(csvText),
		partBDocument
	};
};
