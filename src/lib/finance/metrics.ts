export type AccountRow = {
	codice: string;
	livello: string;
	descrizione: string;
	sezione_cee: string;
	natura: string;
	d_a: string;
	saldo_dare: number;
	saldo_avere: number;
	note: string;
	netDa: number;
};

export type MetricCard = {
	label: string;
	value: number;
	display: 'currency' | 'percentage' | 'ratio' | 'days' | 'months';
	tone: 'positive' | 'warning' | 'neutral' | 'risk';
	helper: string;
};

export type MixItem = {
	label: string;
	value: number;
	share: number;
};

export type BridgeItem = {
	label: string;
	value: number;
	kind: 'positive' | 'negative' | 'result';
};

export type FlowItem = {
	label: string;
	value: number;
	operator: '+' | '-' | '=';
};

export type TopAccount = {
	codice: string;
	descrizione: string;
	sezione_cee: string;
	natura: string;
	value: number;
};

export type DashboardData = {
	source: {
		file: string;
		rows: number;
		leafRows: number;
	};
	summary: {
		title: string;
		insight: string;
		headline: MetricCard[];
	};
	profitability: {
		revenue: number;
		valueOfProduction: number;
		productionCosts: number;
		ebitda: number;
		ebitdaMargin: number;
		ebit: number;
		ebitMargin: number;
		financialIncome: number;
		financialCosts: number;
		taxes: number;
		netProfit: number;
		netMargin: number;
		bridge: BridgeItem[];
	};
	cashConversion: {
		tradeReceivables: number;
		totalReceivables: number;
		inventory: number;
		tradePayables: number;
		operatingNwc: number;
		operatingNwcRatio: number;
		dso: number;
		dio: number;
		dpo: number;
		ccc: number;
		cash: number;
		cashMonthsOfCosts: number;
		flow: FlowItem[];
	};
	debt: {
		financialDebt: number;
		netFinancialDebt: number;
		nfdToEbitda: number;
		interestCoverage: number;
		equityIncludingProfit: number;
		equityToAssets: number;
		assets: number;
	};
	mix: {
		revenue: MixItem[];
		costs: MixItem[];
	};
	traceability: {
		topAccounts: TopAccount[];
	};
};

const HEADERS = [
	'codice',
	'livello',
	'descrizione',
	'sezione_cee',
	'natura',
	'd_a',
	'saldo_dare',
	'saldo_avere',
	'note'
] as const;

const COST_GROUPS = [
	{ section: 'B.6', label: 'Materie prime e merci' },
	{ section: 'B.7', label: 'Servizi' },
	{ section: 'B.8', label: 'Godimento beni terzi' },
	{ section: 'B.9', label: 'Personale' },
	{ section: 'B.10', label: 'Ammortamenti e svalutazioni' },
	{ section: 'B.11', label: 'Variazione rimanenze' },
	{ section: 'B.12', label: 'Accantonamenti rischi' },
	{ section: 'B.13', label: 'Altri accantonamenti' },
	{ section: 'B.14', label: 'Oneri diversi di gestione' }
];

function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		const next = text[index + 1];

		if (char === '"') {
			if (inQuotes && next === '"') {
				field += '"';
				index += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (char === ',' && !inQuotes) {
			row.push(field);
			field = '';
			continue;
		}

		if ((char === '\n' || char === '\r') && !inQuotes) {
			if (char === '\r' && next === '\n') {
				index += 1;
			}
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
			continue;
		}

		field += char;
	}

	if (field || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

function toAmount(value: string): number {
	const trimmed = value.trim();
	const normalized = trimmed.includes(',')
		? trimmed.replace(/\./g, '').replace(',', '.')
		: /^-?\d{1,3}(\.\d{3})+$/.test(trimmed)
			? trimmed.replace(/\./g, '')
			: trimmed;
	const amount = Number(normalized);

	if (!Number.isFinite(amount)) {
		throw new Error(`Invalid numeric value: ${value}`);
	}

	return amount;
}

function parseAccountsCsv(text: string): AccountRow[] {
	const [headerRow, ...dataRows] = parseCsv(text);

	if (!headerRow || HEADERS.some((header, index) => headerRow[index] !== header)) {
		throw new Error(`Unexpected CSV headers: ${headerRow?.join(', ') ?? 'none'}`);
	}

	return dataRows.map((cells) => {
		const saldoDare = toAmount(cells[6] ?? '0');
		const saldoAvere = toAmount(cells[7] ?? '0');

		return {
			codice: cells[0] ?? '',
			livello: cells[1] ?? '',
			descrizione: cells[2] ?? '',
			sezione_cee: cells[3] ?? '',
			natura: cells[4] ?? '',
			d_a: cells[5] ?? '',
			saldo_dare: saldoDare,
			saldo_avere: saldoAvere,
			note: cells[8] ?? '',
			netDa: saldoDare - saldoAvere
		};
	});
}

function sectionMatches(section: string, prefix: string): boolean {
	return section === prefix || section.startsWith(`${prefix}.`) || section.startsWith(`${prefix}-`);
}

function ceAmount(row: AccountRow): number {
	if (row.natura === 'Ricavo (CE)') {
		return -row.netDa;
	}

	if (row.natura === 'Costo (CE)') {
		return row.netDa;
	}

	return 0;
}

function liabilityAmount(row: AccountRow): number {
	return -row.netDa;
}

function sum(rows: AccountRow[], predicate: (row: AccountRow) => boolean, amount = ceAmount): number {
	return rows.reduce((total, row) => (predicate(row) ? total + amount(row) : total), 0);
}

function safeRatio(numerator: number, denominator: number): number {
	return denominator === 0 ? 0 : numerator / denominator;
}

function round(value: number, digits = 1): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function mastro(rows: AccountRow[], code: string): AccountRow {
	const row = rows.find((account) => account.livello === 'Mastro' && account.codice === code);

	if (!row) {
		throw new Error(`Missing mastro row ${code}`);
	}

	return row;
}

function revenueLabel(description: string): string {
	return description
		.replace('Ricavi vendita prodotti ', 'Prodotti ')
		.replace('Ricavi prestazioni di servizi ', 'Servizi ')
		.replace('Sconti e abbuoni commerciali passivi', 'Sconti e abbuoni');
}

export function buildDashboardData(csvText: string): DashboardData {
	const rows = parseAccountsCsv(csvText);
	const leafRows = rows.filter((row) => row.livello === 'Sottoconto');

	const revenue = sum(
		leafRows,
		(row) => row.natura === 'Ricavo (CE)' && sectionMatches(row.sezione_cee, 'A.1')
	);
	const valueOfProduction = sum(
		leafRows,
		(row) => row.natura === 'Ricavo (CE)' && row.sezione_cee.startsWith('A.')
	);
	const productionCosts = sum(
		leafRows,
		(row) => row.natura === 'Costo (CE)' && row.sezione_cee.startsWith('B.')
	);
	const depreciationAndAmortization = sum(
		leafRows,
		(row) => row.natura === 'Costo (CE)' && sectionMatches(row.sezione_cee, 'B.10')
	);
	const provisions = sum(
		leafRows,
		(row) =>
			row.natura === 'Costo (CE)' &&
			(sectionMatches(row.sezione_cee, 'B.12') || sectionMatches(row.sezione_cee, 'B.13'))
	);
	const ebit = valueOfProduction - productionCosts;
	const ebitda = ebit + depreciationAndAmortization + provisions;
	const financialIncome = sum(
		leafRows,
		(row) => row.natura === 'Ricavo (CE)' && row.sezione_cee.startsWith('C.')
	);
	const financialCosts = sum(
		leafRows,
		(row) => row.natura === 'Costo (CE)' && row.sezione_cee.startsWith('C.')
	);
	const taxes = sum(
		leafRows,
		(row) => row.natura === 'Costo (CE)' && row.sezione_cee.startsWith('20')
	);
	const netProfit = ebit + financialIncome - financialCosts - taxes;

	const totalReceivables = mastro(rows, '050').netDa;
	const tradeReceivables = sum(
		leafRows,
		(row) => row.sezione_cee === 'C.II.1',
		(row) => row.netDa
	);
	const inventory = mastro(rows, '040').netDa;
	const cash = mastro(rows, '070').netDa;
	const assets = ['010', '020', '030', '040', '050', '060', '070', '080'].reduce(
		(total, code) => total + mastro(rows, code).netDa,
		0
	);

	const tradePayables = sum(
		leafRows,
		(row) => row.codice.startsWith('130.030'),
		liabilityAmount
	);
	const materials = sum(
		leafRows,
		(row) => row.natura === 'Costo (CE)' && sectionMatches(row.sezione_cee, 'B.6')
	);
	const services = sum(
		leafRows,
		(row) => row.natura === 'Costo (CE)' && sectionMatches(row.sezione_cee, 'B.7')
	);
	const operatingNwc = tradeReceivables + inventory - tradePayables;
	const dso = safeRatio(tradeReceivables, revenue) * 365;
	const dio = safeRatio(inventory, materials) * 365;
	const dpo = safeRatio(tradePayables, materials + services) * 365;
	const ccc = dso + dio - dpo;

	const financialDebt = sum(
		leafRows,
		(row) =>
			row.codice.startsWith('130.010') ||
			row.codice.startsWith('130.015') ||
			row.codice.startsWith('130.020'),
		liabilityAmount
	);
	const netFinancialDebt = financialDebt - cash;
	const equityIncludingProfit = liabilityAmount(mastro(rows, '100')) + netProfit;

	const revenueMix = leafRows
		.filter(
			(row) =>
				row.natura === 'Ricavo (CE)' &&
				sectionMatches(row.sezione_cee, 'A.1') &&
				ceAmount(row) !== 0
		)
		.map((row) => ({
			label: revenueLabel(row.descrizione),
			value: ceAmount(row),
			share: safeRatio(ceAmount(row), revenue) * 100
		}))
		.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

	const costMix = COST_GROUPS.map((group) => {
		const value = sum(
			leafRows,
			(row) => row.natura === 'Costo (CE)' && sectionMatches(row.sezione_cee, group.section)
		);

		return {
			label: group.label,
			value,
			share: safeRatio(value, productionCosts) * 100
		};
	}).filter((item) => item.value !== 0);

	const topAccounts = leafRows
		.map((row) => ({
			codice: row.codice,
			descrizione: row.descrizione,
			sezione_cee: row.sezione_cee,
			natura: row.natura,
			value:
				row.natura === 'Ricavo (CE)' || row.natura === 'Passivo Patrimoniale'
					? -row.netDa
					: row.netDa
		}))
		.filter((row) => row.value !== 0)
		.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
		.slice(0, 8);

	return {
		source: {
			file: 'data/Piano_dei_Conti.csv',
			rows: rows.length,
			leafRows: leafRows.length
		},
		summary: {
			title: 'Cash Conversion Cockpit',
			insight: `Profittevole, ma con ${Math.round(operatingNwc / 1000)}k EUR assorbiti dal capitale circolante operativo.`,
			headline: [
				{
					label: 'Ricavi netti',
					value: revenue,
					display: 'currency',
					tone: 'positive',
					helper: "Base vendite dell'esercizio"
				},
				{
					label: 'Margine EBITDA',
					value: safeRatio(ebitda, revenue) * 100,
					display: 'percentage',
					tone: 'positive',
					helper: 'Buona redditivita operativa'
				},
				{
					label: 'CCN operativo',
					value: operatingNwc,
					display: 'currency',
					tone: 'warning',
					helper: 'Cassa assorbita da clienti e magazzino'
				},
				{
					label: 'PFN / EBITDA',
					value: safeRatio(netFinancialDebt, ebitda),
					display: 'ratio',
					tone: 'neutral',
					helper: 'Leva finanziaria sostenibile'
				}
			]
		},
		profitability: {
			revenue,
			valueOfProduction,
			productionCosts,
			ebitda,
			ebitdaMargin: safeRatio(ebitda, revenue) * 100,
			ebit,
			ebitMargin: safeRatio(ebit, revenue) * 100,
			financialIncome,
			financialCosts,
			taxes,
			netProfit,
			netMargin: safeRatio(netProfit, revenue) * 100,
			bridge: [
				{ label: 'Valore produzione', value: valueOfProduction, kind: 'positive' },
				{ label: 'Costi produzione', value: -productionCosts, kind: 'negative' },
				{ label: 'EBIT', value: ebit, kind: 'result' },
				{ label: 'Oneri finanziari netti', value: financialIncome - financialCosts, kind: 'negative' },
				{ label: 'Imposte', value: -taxes, kind: 'negative' },
				{ label: 'Utile netto', value: netProfit, kind: 'result' }
			]
		},
		cashConversion: {
			tradeReceivables,
			totalReceivables,
			inventory,
			tradePayables,
			operatingNwc,
			operatingNwcRatio: safeRatio(operatingNwc, revenue) * 100,
			dso: round(dso),
			dio: round(dio),
			dpo: round(dpo),
			ccc: round(ccc),
			cash,
			cashMonthsOfCosts: safeRatio(cash, productionCosts / 12),
			flow: [
				{ label: 'Crediti clienti', value: tradeReceivables, operator: '+' },
				{ label: 'Magazzino', value: inventory, operator: '+' },
				{ label: 'Debiti fornitori', value: tradePayables, operator: '-' },
				{ label: 'CCN operativo', value: operatingNwc, operator: '=' }
			]
		},
		debt: {
			financialDebt,
			netFinancialDebt,
			nfdToEbitda: safeRatio(netFinancialDebt, ebitda),
			interestCoverage: safeRatio(ebit, financialCosts),
			equityIncludingProfit,
			equityToAssets: safeRatio(equityIncludingProfit, assets) * 100,
			assets
		},
		mix: {
			revenue: revenueMix,
			costs: costMix
		},
		traceability: {
			topAccounts
		}
	};
}
