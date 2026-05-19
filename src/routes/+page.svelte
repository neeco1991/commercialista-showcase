<script lang="ts">
	import {
		ChartColumn,
		CircleAlert,
		FileText,
		Gauge,
		Landmark,
		Package,
		ReceiptText,
		Scale,
		Table2,
		TrendingUp,
		Wallet
	} from '@lucide/svelte';

	import type { PageData } from './$types';

	type ActivePart = 'parte-a' | 'parte-b';
	type MarkdownBlock =
		| { type: 'heading'; level: 1 | 2 | 3; html: string }
		| { type: 'paragraph'; html: string }
		| { type: 'list'; ordered: boolean; items: string[] };

	let { data }: { data: PageData } = $props();

	let activePart = $state<ActivePart>('parte-a');

	const dashboard = $derived(data.dashboard);
	const documentBlocks = $derived(parseMarkdown(data.partBDocument));
	const maxCostShare = $derived(Math.max(...dashboard.mix.costs.map((item) => Math.abs(item.share))));
	const maxBridgeValue = $derived(
		Math.max(...dashboard.profitability.bridge.map((item) => Math.abs(item.value)))
	);

	function formatCurrency(value: number): string {
		const sign = value < 0 ? '-' : '';
		const absolute = Math.abs(value);

		if (absolute >= 1_000_000) {
			return `${sign}${(absolute / 1_000_000).toLocaleString('it-IT', {
				maximumFractionDigits: 2
			})}M EUR`;
		}

		if (absolute >= 1_000) {
			return `${sign}${Math.round(absolute / 1_000).toLocaleString('it-IT')}k EUR`;
		}

		return `${sign}${Math.round(absolute).toLocaleString('it-IT')} EUR`;
	}

	function formatNumber(value: number, digits = 1): string {
		return value.toLocaleString('it-IT', {
			maximumFractionDigits: digits,
			minimumFractionDigits: digits
		});
	}

	function formatMetric(card: (typeof dashboard.summary.headline)[number]): string {
		if (card.display === 'currency') return formatCurrency(card.value);
		if (card.display === 'percentage') return `${formatNumber(card.value, 1)}%`;
		if (card.display === 'ratio') return `${formatNumber(card.value, 2)}x`;
		if (card.display === 'days') return `${formatNumber(card.value, 0)} gg`;
		return `${formatNumber(card.value, 2)} mesi`;
	}

	function toneClass(tone: string): string {
		if (tone === 'positive') {
			return 'border-emerald-200 bg-emerald-50 text-emerald-950';
		}
		if (tone === 'warning') {
			return 'border-amber-200 bg-amber-50 text-amber-950';
		}
		if (tone === 'risk') {
			return 'border-rose-200 bg-rose-50 text-rose-950';
		}
		return 'border-sky-200 bg-sky-50 text-sky-950';
	}

	function barWidth(value: number, max = 100): string {
		const width = Math.max(2, Math.min(100, (Math.abs(value) / max) * 100));
		return `${width.toFixed(1)}%`;
	}

	function sidebarButtonClass(part: ActivePart): string {
		const base = 'flex h-10 items-center gap-2 rounded-[6px] px-3 text-sm font-semibold transition';
		const tone =
			activePart === part
				? 'bg-slate-950 text-white'
				: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950';

		return `${base} ${tone}`;
	}

	function escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	function inlineMarkdown(value: string): string {
		return escapeHtml(value)
			.replace(
				/`([^`]+)`/g,
				'<code class="rounded-[4px] bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-900">$1</code>'
			)
			.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-slate-950">$1</strong>');
	}

	function parseMarkdown(markdown: string): MarkdownBlock[] {
		const blocks: MarkdownBlock[] = [];
		let paragraphLines: string[] = [];
		let list: { ordered: boolean; items: string[] } | null = null;

		function flushParagraph() {
			if (paragraphLines.length === 0) return;
			blocks.push({ type: 'paragraph', html: inlineMarkdown(paragraphLines.join(' ')) });
			paragraphLines = [];
		}

		function flushList() {
			if (!list) return;
			blocks.push({ type: 'list', ordered: list.ordered, items: list.items });
			list = null;
		}

		for (const line of markdown.split(/\r?\n/)) {
			const trimmed = line.trim();

			if (!trimmed) {
				flushParagraph();
				flushList();
				continue;
			}

			const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
			if (headingMatch) {
				flushParagraph();
				flushList();
				blocks.push({
					type: 'heading',
					level: headingMatch[1].length as 1 | 2 | 3,
					html: inlineMarkdown(headingMatch[2])
				});
				continue;
			}

			const orderedListMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
			const unorderedListMatch = /^[-*]\s+(.+)$/.exec(trimmed);
			if (orderedListMatch || unorderedListMatch) {
				flushParagraph();
				const ordered = Boolean(orderedListMatch);
				if (!list || list.ordered !== ordered) {
					flushList();
					list = { ordered, items: [] };
				}
				list.items.push(inlineMarkdown((orderedListMatch ?? unorderedListMatch)?.[1] ?? ''));
				continue;
			}

			flushList();
			paragraphLines.push(trimmed);
		}

		flushParagraph();
		flushList();

		return blocks;
	}
</script>

<svelte:head>
	<title>Cash Conversion Cockpit</title>
	<meta
		name="description"
		content="Dashboard CEO per leggere redditivita, capitale circolante, liquidita e debito dal piano dei conti."
	/>
</svelte:head>

<main class="min-h-screen bg-slate-50 text-slate-950">
	<div
		class="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:px-8"
	>
		<aside
			class="w-full shrink-0 rounded-[8px] border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-5 lg:w-48"
		>
			<nav class="grid grid-cols-2 gap-2 lg:grid-cols-1" aria-label="Sezioni dashboard">
				<button
					type="button"
					class={sidebarButtonClass('parte-a')}
					aria-current={activePart === 'parte-a' ? 'page' : undefined}
					onclick={() => (activePart = 'parte-a')}
				>
					<Gauge class="size-4" />
					<span>Parte A</span>
				</button>
				<button
					type="button"
					class={sidebarButtonClass('parte-b')}
					aria-current={activePart === 'parte-b' ? 'page' : undefined}
					onclick={() => (activePart = 'parte-b')}
				>
					<FileText class="size-4" />
					<span>Parte B</span>
				</button>
			</nav>
		</aside>

		<div class="min-w-0 flex-1">
			{#if activePart === 'parte-a'}
				<div class="flex flex-col gap-6">
					<section class="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
			<div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
				<div class="max-w-3xl">
					<div class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
						<Gauge class="size-4" />
						<span>Dashboard CEO / esercizio 2026</span>
					</div>
					<h1 class="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
						{dashboard.summary.title}
					</h1>
					<p class="mt-3 text-lg text-slate-700">{dashboard.summary.insight}</p>
				</div>

				<div class="rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-amber-950 lg:w-80">
					<div class="flex items-start gap-3">
						<CircleAlert class="mt-0.5 size-5 shrink-0" />
						<div>
							<p class="text-sm font-semibold">Punto debole: liquidita</p>
							<p class="mt-1 text-sm leading-6">
								La cassa copre circa {formatNumber(dashboard.cashConversion.cashMonthsOfCosts, 2)}
								mesi di costi della produzione.
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{#each dashboard.summary.headline as card, index}
					<article class={`rounded-[8px] border p-4 ${toneClass(card.tone)}`}>
						<div class="flex items-center justify-between gap-3">
							<p class="text-sm font-medium">{card.label}</p>
							{#if index === 0}
								<ReceiptText class="size-4" />
							{:else if index === 1}
								<TrendingUp class="size-4" />
							{:else if index === 2}
								<Wallet class="size-4" />
							{:else}
								<Scale class="size-4" />
							{/if}
						</div>
						<p class="mt-3 text-2xl font-semibold tracking-normal">{formatMetric(card)}</p>
						<p class="mt-2 text-sm opacity-80">{card.helper}</p>
					</article>
				{/each}
			</div>
		</section>

		<section class="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
			<div class="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div class="flex items-center gap-2 text-sm font-medium text-slate-500">
							<Wallet class="size-4" />
							<span>Cash conversion</span>
						</div>
						<h2 class="mt-2 text-xl font-semibold tracking-normal">Dove resta bloccata la cassa</h2>
					</div>
					<p class="text-sm text-slate-500">
						Stime su saldi di fine anno, non medie mensili.
					</p>
				</div>

				<div class="mt-5 grid gap-3 md:grid-cols-4">
					{#each dashboard.cashConversion.flow as item}
						<div class="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
							<div class="flex items-center justify-between text-sm text-slate-500">
								<span>{item.label}</span>
								<span class="font-semibold">{item.operator}</span>
							</div>
							<p class="mt-3 text-2xl font-semibold tracking-normal text-slate-950">
								{formatCurrency(item.value)}
							</p>
						</div>
					{/each}
				</div>

				<div class="mt-5 grid gap-3 sm:grid-cols-4">
					<div class="rounded-[8px] border border-slate-200 p-4">
						<p class="text-sm text-slate-500">DSO clienti</p>
						<p class="mt-2 text-2xl font-semibold">{formatNumber(dashboard.cashConversion.dso, 0)} gg</p>
					</div>
					<div class="rounded-[8px] border border-slate-200 p-4">
						<p class="text-sm text-slate-500">DIO magazzino</p>
						<p class="mt-2 text-2xl font-semibold">{formatNumber(dashboard.cashConversion.dio, 0)} gg</p>
					</div>
					<div class="rounded-[8px] border border-slate-200 p-4">
						<p class="text-sm text-slate-500">DPO fornitori</p>
						<p class="mt-2 text-2xl font-semibold">{formatNumber(dashboard.cashConversion.dpo, 0)} gg</p>
					</div>
					<div class="rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-amber-950">
						<p class="text-sm">Ciclo cassa</p>
						<p class="mt-2 text-2xl font-semibold">{formatNumber(dashboard.cashConversion.ccc, 0)} gg</p>
					</div>
				</div>
			</div>

			<div class="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex items-center gap-2 text-sm font-medium text-slate-500">
					<Landmark class="size-4" />
					<span>Liquidita e debito</span>
				</div>
				<h2 class="mt-2 text-xl font-semibold tracking-normal">La leva e sostenibile, la cassa e corta</h2>

				<div class="mt-5 space-y-4">
					<div class="flex items-center justify-between border-b border-slate-100 pb-3">
						<span class="text-sm text-slate-600">Cassa</span>
						<strong>{formatCurrency(dashboard.cashConversion.cash)}</strong>
					</div>
					<div class="flex items-center justify-between border-b border-slate-100 pb-3">
						<span class="text-sm text-slate-600">Debito finanziario</span>
						<strong>{formatCurrency(dashboard.debt.financialDebt)}</strong>
					</div>
					<div class="flex items-center justify-between border-b border-slate-100 pb-3">
						<span class="text-sm text-slate-600">PFN</span>
						<strong>{formatCurrency(dashboard.debt.netFinancialDebt)}</strong>
					</div>
					<div class="flex items-center justify-between border-b border-slate-100 pb-3">
						<span class="text-sm text-slate-600">Copertura interessi</span>
						<strong>{formatNumber(dashboard.debt.interestCoverage, 1)}x</strong>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-slate-600">Patrimonio / Attivo</span>
						<strong>{formatNumber(dashboard.debt.equityToAssets, 1)}%</strong>
					</div>
				</div>
			</div>
		</section>

		<section class="grid gap-6 xl:grid-cols-2">
			<div class="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex items-center gap-2 text-sm font-medium text-slate-500">
					<ChartColumn class="size-4" />
					<span>Redditivita</span>
				</div>
				<h2 class="mt-2 text-xl font-semibold tracking-normal">Dal valore prodotto all'utile netto</h2>

				<div class="mt-5 space-y-3">
					{#each dashboard.profitability.bridge as item}
						<div>
							<div class="mb-1 flex items-center justify-between gap-3 text-sm">
								<span class="text-slate-600">{item.label}</span>
								<strong
									class={item.kind === 'negative'
										? 'text-rose-700'
										: item.kind === 'result'
											? 'text-slate-950'
											: 'text-emerald-700'}>{formatCurrency(item.value)}</strong
								>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-slate-100">
								<div
									class={item.kind === 'negative'
										? 'h-full bg-rose-500'
										: item.kind === 'result'
											? 'h-full bg-slate-700'
											: 'h-full bg-emerald-500'}
									style={`width: ${barWidth(item.value, maxBridgeValue)}`}
								></div>
							</div>
						</div>
					{/each}
				</div>

				<div class="mt-5 grid gap-3 sm:grid-cols-3">
					<div class="rounded-[8px] bg-emerald-50 p-4 text-emerald-950">
						<p class="text-sm">EBITDA margin</p>
						<p class="mt-2 text-2xl font-semibold">
							{formatNumber(dashboard.profitability.ebitdaMargin, 1)}%
						</p>
					</div>
					<div class="rounded-[8px] bg-sky-50 p-4 text-sky-950">
						<p class="text-sm">EBIT margin</p>
						<p class="mt-2 text-2xl font-semibold">
							{formatNumber(dashboard.profitability.ebitMargin, 1)}%
						</p>
					</div>
					<div class="rounded-[8px] bg-slate-100 p-4 text-slate-950">
						<p class="text-sm">Net margin</p>
						<p class="mt-2 text-2xl font-semibold">
							{formatNumber(dashboard.profitability.netMargin, 1)}%
						</p>
					</div>
				</div>
			</div>

			<div class="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex items-center gap-2 text-sm font-medium text-slate-500">
					<Package class="size-4" />
					<span>Mix ricavi e costi</span>
				</div>
				<h2 class="mt-2 text-xl font-semibold tracking-normal">Concentrazione vendite e leve di costo</h2>

				<div class="mt-5">
					<p class="mb-3 text-sm font-semibold text-slate-700">Ricavi</p>
					<div class="flex h-5 overflow-hidden rounded-[6px] bg-slate-100">
						{#each dashboard.mix.revenue as item}
							<div
								class={item.value < 0 ? 'bg-rose-400' : 'bg-sky-500'}
								style={`width: ${barWidth(item.share)}`}
								title={`${item.label}: ${formatNumber(item.share, 1)}%`}
							></div>
						{/each}
					</div>
					<div class="mt-3 grid gap-2">
						{#each dashboard.mix.revenue as item}
							<div class="flex items-center justify-between gap-3 text-sm">
								<span class="truncate text-slate-600">{item.label}</span>
								<strong>{formatNumber(item.share, 1)}%</strong>
							</div>
						{/each}
					</div>
				</div>

				<div class="mt-6">
					<p class="mb-3 text-sm font-semibold text-slate-700">Costi della produzione</p>
					<div class="space-y-3">
						{#each dashboard.mix.costs as item}
							<div>
								<div class="mb-1 flex items-center justify-between gap-3 text-sm">
									<span class="truncate text-slate-600">{item.label}</span>
									<strong>{formatNumber(item.share, 1)}%</strong>
								</div>
								<div class="h-2 overflow-hidden rounded-full bg-slate-100">
									<div
										class={item.value < 0 ? 'h-full bg-emerald-400' : 'h-full bg-indigo-500'}
										style={`width: ${barWidth(item.share, maxCostShare)}`}
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<section class="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div class="flex items-center gap-2 text-sm font-medium text-slate-500">
						<Table2 class="size-4" />
						<span>Tracciabilita</span>
					</div>
					<h2 class="mt-2 text-xl font-semibold tracking-normal">Conti principali usati per leggere il business</h2>
				</div>
				<p class="text-sm text-slate-500">
					{dashboard.source.leafRows} sottoconti su {dashboard.source.rows} righe pulite
				</p>
			</div>

			<div class="mt-5 overflow-x-auto">
				<table class="w-full min-w-[720px] text-left text-sm">
					<thead>
						<tr class="border-b border-slate-200 text-slate-500">
							<th class="py-3 pr-4 font-medium">Codice</th>
							<th class="py-3 pr-4 font-medium">Descrizione</th>
							<th class="py-3 pr-4 font-medium">CEE</th>
							<th class="py-3 pr-4 font-medium">Natura</th>
							<th class="py-3 text-right font-medium">Valore</th>
						</tr>
					</thead>
					<tbody>
						{#each dashboard.traceability.topAccounts as account}
							<tr class="border-b border-slate-100 last:border-0">
								<td class="py-3 pr-4 font-mono text-xs text-slate-600">{account.codice}</td>
								<td class="py-3 pr-4 font-medium text-slate-900">{account.descrizione}</td>
								<td class="py-3 pr-4 text-slate-600">{account.sezione_cee}</td>
								<td class="py-3 pr-4 text-slate-600">{account.natura}</td>
								<td class="py-3 text-right font-semibold">{formatCurrency(account.value)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
					</section>
				</div>
			{:else}
				<article class="w-full rounded-[8px] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
					{#each documentBlocks as block}
						{#if block.type === 'heading'}
							{#if block.level === 1}
								<h1 class="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
									{@html block.html}
								</h1>
							{:else if block.level === 2}
								<h2
									class="mt-9 border-t border-slate-100 pt-7 text-xl font-semibold tracking-normal text-slate-950"
								>
									{@html block.html}
								</h2>
							{:else}
								<h3 class="mt-6 text-lg font-semibold tracking-normal text-slate-950">
									{@html block.html}
								</h3>
							{/if}
						{:else if block.type === 'paragraph'}
							<p class="mt-4 text-base leading-7 text-slate-700">{@html block.html}</p>
						{:else if block.ordered}
							<ol class="mt-4 list-decimal space-y-2 pl-6 text-base leading-7 text-slate-700">
								{#each block.items as item}
									<li class="pl-1 marker:text-slate-400">{@html item}</li>
								{/each}
							</ol>
						{:else}
							<ul class="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-700">
								{#each block.items as item}
									<li class="pl-1 marker:text-slate-400">{@html item}</li>
								{/each}
							</ul>
						{/if}
					{/each}
				</article>
			{/if}
		</div>
	</div>
</main>
