import { buildDashboardData } from '$lib/finance/metrics';
import csvText from '../../data/Piano_dei_Conti.csv?raw';
import partBDocument from '../../docs/es1-parte-b.md?raw';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		dashboard: buildDashboardData(csvText),
		partBDocument
	};
};
