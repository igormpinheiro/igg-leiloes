<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div class="max-h-[calc(100vh-14rem)] overflow-auto">
      <table class="w-full min-w-[1120px] table-fixed divide-y divide-slate-200">
        <thead class="sticky top-0 z-20 bg-slate-50">
          <tr class="text-xs uppercase tracking-wide text-slate-600">
            <th class="sticky left-0 z-30 w-[280px] bg-slate-50 px-3 py-2 text-left font-semibold">
              <button type="button" class="flex items-center gap-1" @click="$emit('ordenar', 'modelo')">
                Veículo
                <Icon
                  v-if="ordenacao.campo === 'modelo'"
                  :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                  class="text-sm"
                />
              </button>
            </th>
            <th class="w-[72px] px-2 py-2 text-left font-semibold" :aria-sort="getAriaSort('ano')">
              <button type="button" class="flex items-center gap-1" @click="$emit('ordenar', 'ano')">
                Ano
                <Icon v-if="ordenacao.campo === 'ano'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm" />
              </button>
            </th>
            <th class="w-[112px] px-2 py-2 text-right font-semibold" :aria-sort="getAriaSort('quilometragem')">
              <button type="button" class="ml-auto flex items-center gap-1" @click="$emit('ordenar', 'quilometragem')">
                KM
                <Icon v-if="ordenacao.campo === 'quilometragem'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm" />
              </button>
            </th>
            <th class="w-[112px] px-2 py-2 text-right font-semibold">Lance</th>
            <th class="w-[120px] px-2 py-2 text-right font-semibold" :aria-sort="getAriaSort('porcentagemMercado')">
              <div class="flex items-center justify-end gap-2">
                <span>Mercado /</span>
                <button type="button" class="flex items-center gap-1" @click="$emit('ordenar', 'porcentagemMercado')">
                  FIPE
                  <Icon v-if="ordenacao.campo === 'porcentagemMercado'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm" />
                </button>
              </div>
            </th>
            <th class="w-[120px] px-2 py-2 text-right font-semibold" :aria-sort="getAriaSort('lucroEstimado')">
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="flex items-center gap-1" @click="$emit('ordenar', 'lucroEstimado')">
                  Lucro /
                  <Icon v-if="ordenacao.campo === 'lucroEstimado'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm" />
                </button>
                <span>ROI</span>
              </div>
            </th>
            <th class="w-[96px] px-2 py-2 text-center font-semibold" :aria-sort="getAriaSort('score')">
              <button type="button" class="mx-auto flex items-center gap-1" @click="$emit('ordenar', 'score')">
                Score
                <Icon v-if="ordenacao.campo === 'score'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm" />
              </button>
            </th>
            <th class="w-[80px] px-2 py-2 text-center font-semibold">Ações</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-100 bg-white text-[13px] text-slate-700">
          <tr v-for="veiculo in veiculos" :key="veiculo.id" class="transition hover:bg-slate-50">
            <td class="sticky left-0 z-10 bg-white px-3 py-2 align-top">
              <div class="flex items-start gap-2">
                <span
                  class="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                  :class="getLeiloeiroClass(veiculo.leiloeiro)"
                  :title="veiculo.leiloeiro?.descricao || 'Leiloeiro não especificado'"
                >
                  {{ getLeiloeiroInitial(veiculo.leiloeiro) }}
                </span>
                <div class="min-w-0">
                  <a
                    :href="veiculo.urlOrigem"
                    target="_blank"
                    class="line-clamp-2 text-[15px] font-semibold text-blue-700 hover:text-blue-900"
                  >
                    {{ veiculo.marca }} {{ veiculo.modelo }}
                  </a>
                  <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span
                      v-if="veiculo.sinistro !== 'Nenhum'"
                      class="rounded px-1.5 py-0.5 font-semibold"
                      :class="getSinistroClass(veiculo.sinistro)"
                    >
                      {{ getSinistroLabel(veiculo.sinistro) }}
                    </span>
                    <span
                      v-if="veiculo.patioUf"
                      class="rounded px-1.5 py-0.5 font-semibold"
                      :class="getPatioUfClass(veiculo.patioUf)"
                    >
                      {{ veiculo.patioUf }}
                    </span>
                    <span
                      v-if="!veiculo.active"
                      class="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700"
                    >
                      Inativo
                    </span>
                    <span
                      v-if="temProblemaMotor(veiculo.descricao)"
                      class="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600 line-through"
                    >
                      Motor
                    </span>
                    <span
                      v-if="temProblemaChave(veiculo.descricao)"
                      class="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600 line-through"
                    >
                      Chave
                    </span>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-2 py-2 align-top text-sm font-medium text-slate-800">{{ veiculo.ano }}</td>
            <td class="px-2 py-2 text-right align-top text-sm text-slate-800">
              <span v-if="veiculo.quilometragem > 0">{{ veiculo.quilometragem.toLocaleString('pt-BR') }}</span>
              <span v-else class="text-slate-600">
                {{ VeiculoRanker.estimarQuilometragem(veiculo).km.toLocaleString('pt-BR') }}
                <span class="text-[11px] italic">*</span>
              </span>
            </td>
            <td class="px-2 py-2 text-right align-top text-sm font-medium text-slate-900">R$ {{ formatarValor(veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial) }}</td>
            <td class="px-2 py-2 text-right align-top">
              <div class="flex float-right flex-row items-end gap-1">
                <span class="text-sm text-slate-800">R$ {{ formatarValor(veiculo.valorMercado) }}</span>
                <span
                  v-if="veiculo.valorMercado > 0"
                  class="inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold"
                  :class="getPercentageClass(getPorcentagemMercado(veiculo))"
                  title="FIPE: percentual do lance em relação ao valor de mercado"
                >
                  {{ Math.round(getPorcentagemMercado(veiculo)) }}%
                </span>
                <span v-else class="text-xs text-slate-400">--</span>
              </div>
            </td>
            <td class="px-2 py-2 text-right align-top">
              <div class="flex float-right flex-row items-end gap-1">
                <span
                  v-if="veiculo.valorMercado > 0"
                  class="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold"
                  :class="getLucroClass(calcularRoi(veiculo))"
                >
                  R$ {{ formatarValor(calcularLucroEstimado(veiculo)) }}
                </span>
                <span v-else class="text-xs text-slate-400">--</span>
                <span
                  v-if="(veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial) > 0"
                  class="inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold"
                  :class="getRoiClass(calcularRoi(veiculo))"
                  title="ROI: retorno sobre o investimento estimado"
                >
                  {{ calcularRoi(veiculo).toFixed(1) }}%
                </span>
                <span v-else class="text-xs text-slate-400">--</span>
              </div>
            </td>
            <td class="px-2 py-2 text-center align-top">
              <div class="group relative inline-flex" data-score-tooltip-root>
                <button
                  type="button"
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="getScoreClass(getScore(veiculo))"
                  @click.stop="toggleScoreTooltip(veiculo.id)"
                >
                  {{ getScoreIcon(getScore(veiculo)) }} {{ getScore(veiculo).toFixed(1) }}
                </button>

                <div
                  class="pointer-events-none invisible absolute right-0 top-full z-40 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 text-left text-[11px] text-slate-700 shadow-lg opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                  :class="scoreTooltipAbertoId === veiculo.id ? '!visible !opacity-100' : ''"
                >
                  <div class="border-b border-slate-200 pb-2">
                    <div class="flex items-center justify-between text-xs font-semibold text-slate-900">
                      <span>Score final</span>
                      <span>{{ formatarNumero(scoreExplicacao(veiculo).scoreFinal, 1) }}</span>
                    </div>
                    <div class="mt-1 flex items-center justify-between text-[10px] text-slate-600">
                      <span>Base (antes de gates)</span>
                      <span>{{ formatarNumero(scoreExplicacao(veiculo).scoreBase10) }}</span>
                    </div>
                  </div>

                  <div class="mt-2 space-y-1">
                    <div class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Componentes</div>
                    <div class="flex items-center justify-between">
                      <span>ROI</span>
                      <span>N {{ formatarNumero(scoreExplicacao(veiculo).componentes.roi.notaBruta) }} • P {{ formatarPercentual(scoreExplicacao(veiculo).componentes.roi.peso) }} • C {{ formatarNumero(scoreExplicacao(veiculo).componentes.roi.contribuicao) }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Lucro</span>
                      <span>N {{ formatarNumero(scoreExplicacao(veiculo).componentes.lucro.notaBruta) }} • P {{ formatarPercentual(scoreExplicacao(veiculo).componentes.lucro.peso) }} • C {{ formatarNumero(scoreExplicacao(veiculo).componentes.lucro.contribuicao) }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>KM</span>
                      <span>N {{ formatarNumero(scoreExplicacao(veiculo).componentes.km.notaBruta) }} • P {{ formatarPercentual(scoreExplicacao(veiculo).componentes.km.peso) }} • C {{ formatarNumero(scoreExplicacao(veiculo).componentes.km.contribuicao) }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Marca</span>
                      <span>N {{ formatarNumero(scoreExplicacao(veiculo).componentes.marca.notaBruta) }} • P {{ formatarPercentual(scoreExplicacao(veiculo).componentes.marca.peso) }} • C {{ formatarNumero(scoreExplicacao(veiculo).componentes.marca.contribuicao) }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Dados</span>
                      <span>N {{ formatarNumero(scoreExplicacao(veiculo).componentes.dados.notaBruta) }} • P {{ formatarPercentual(scoreExplicacao(veiculo).componentes.dados.peso) }} • C {{ formatarNumero(scoreExplicacao(veiculo).componentes.dados.contribuicao) }}</span>
                    </div>
                  </div>

                  <div class="mt-2 border-t border-slate-200 pt-2">
                    <div class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Risco e ajustes</div>
                    <div class="mt-1 flex items-center justify-between">
                      <span>Risco total</span>
                      <span>{{ formatarPercentual(scoreExplicacao(veiculo).risco.riscoTotal) }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>ROI ajustado</span>
                      <span>{{ formatarNumero(scoreExplicacao(veiculo).risco.roiAjustado, 1) }}%</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Lucro ajustado</span>
                      <span>R$ {{ formatarValor(scoreExplicacao(veiculo).risco.lucroAjustado) }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>KM</span>
                      <span>{{ scoreExplicacao(veiculo).risco.kmInformada ? 'Informada' : 'Estimada' }}</span>
                    </div>
                    <div class="mt-1">
                      <span class="text-slate-500">Flags:</span>
                      <span v-if="scoreExplicacao(veiculo).risco.flagsDescricao.length" class="ml-1">{{ scoreExplicacao(veiculo).risco.flagsDescricao.join(', ') }}</span>
                      <span v-else class="ml-1">Sem flags</span>
                    </div>
                  </div>

                  <div class="mt-2 border-t border-slate-200 pt-2">
                    <div class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Penalidades</div>
                    <template v-if="scoreExplicacao(veiculo).gates.totalPenalidade === 0">
                      <div class="mt-1 text-slate-500">Sem penalidades</div>
                    </template>
                    <template v-else>
                      <div class="mt-1" :class="scoreExplicacao(veiculo).gates.penalidadeRoiBaixo ? 'text-red-600' : 'text-slate-500'">
                        ROI ajustado abaixo de {{ ROI_REGULAR }}%: -2
                      </div>
                      <div :class="scoreExplicacao(veiculo).gates.penalidadeDadosFinanceiros ? 'text-red-600' : 'text-slate-500'">
                        Dados financeiros insuficientes (lance/mercado): -2
                      </div>
                    </template>
                    <div class="mt-1 flex items-center justify-between font-semibold text-slate-900">
                      <span>Total penalidades</span>
                      <span>-{{ scoreExplicacao(veiculo).gates.totalPenalidade.toFixed(0) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-2 py-2 text-center align-top">
              <div class="flex items-center justify-center gap-1">
                <button
                  type="button"
                  class="rounded p-1 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="refreshingId === veiculo.id"
                  title="Atualizar lote"
                  aria-label="Atualizar lote"
                  @click="$emit('atualizar', veiculo)"
                >
                  <Icon
                    :name="refreshingId === veiculo.id ? 'mdi:loading' : 'mdi:refresh'"
                    class="text-base"
                    :class="{ 'animate-spin': refreshingId === veiculo.id }"
                  />
                </button>
                <button
                  type="button"
                  class="rounded p-1 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                  title="Editar veículo"
                  aria-label="Editar veículo"
                  @click="$emit('editar', veiculo)"
                >
                  <Icon name="mdi:pencil" class="text-base" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { TipoSinistro, Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';
import { CONFIG_NEGOCIO } from '~/config/negocio';

type CampoOrdenacao = 'modelo' | 'ano' | 'quilometragem' | 'porcentagemMercado' | 'lucroEstimado' | 'score';

const { formatarValor } = useFormatacao();
const {
  calcularLucroEstimado,
  calcularRoi,
  getLeiloeiroClass,
  getLeiloeiroInitial,
  getLucroClass,
  getPercentageClass,
  getPorcentagemMercado,
  getScoreExplicacao,
  getRoiClass,
  getScore,
  getScoreClass,
  getScoreIcon,
} = {
  ...useVeiculoScore(),
  ...useLeiloeiro(),
};
const ROI_REGULAR = CONFIG_NEGOCIO.roi.regular;
const scoreTooltipAbertoId = ref<string | null>(null);

function getPatioUfClass(uf: string | undefined): string {
  if (!uf) return 'bg-slate-100 text-slate-700';
  if (uf === 'DF') return 'bg-blue-100 text-blue-800';
  if (uf === 'GO') return 'bg-emerald-100 text-emerald-800';
  return 'bg-slate-100 text-slate-700';
}

function getSinistroClass(sinistro: TipoSinistro): string {
  if (sinistro === 'IndicioSinistro' || sinistro === 'RecuperadoSinistro') return 'bg-yellow-100 text-yellow-800';
  if (sinistro === 'PequenaMonta') return 'bg-orange-100 text-orange-800';
  if (sinistro === 'MediaMonta' || sinistro === 'GrandeMonta' || sinistro === 'Sucata') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
}

function getSinistroLabel(sinistro: TipoSinistro): string {
  const labels: Record<TipoSinistro, string> = {
    Nenhum: 'Sem sinistro',
    IndicioSinistro: 'Indício',
    RecuperadoSinistro: 'Recuperado',
    PequenaMonta: 'Pequena monta',
    MediaMonta: 'Média monta',
    GrandeMonta: 'Grande monta',
    Sucata: 'Sucata',
  };

  return labels[sinistro] || sinistro;
}

function temProblemaMotor(descricao: string): boolean {
  const upper = descricao.toUpperCase();
  return upper.includes('MOTOR DESMONTADO') || upper.includes('MOTOR FALTANDO') || upper.includes('FALTANDO PEÇAS');
}

function temProblemaChave(descricao: string): boolean {
  return descricao.toUpperCase().includes('SEM CHAVE');
}

const props = defineProps<{
  veiculos: Veiculo[];
  ordenacao: { campo: CampoOrdenacao; direcao: 'asc' | 'desc' };
  refreshingId: string | null;
}>();

const scoreExplicacoes = computed(() => {
  const explicacoes = new Map<string, ReturnType<typeof getScoreExplicacao>>();
  for (const veiculo of props.veiculos) {
    explicacoes.set(veiculo.id, getScoreExplicacao(veiculo));
  }
  return explicacoes;
});

function scoreExplicacao(veiculo: Veiculo): ReturnType<typeof getScoreExplicacao> {
  return scoreExplicacoes.value.get(veiculo.id) ?? getScoreExplicacao(veiculo);
}

function formatarNumero(valor: number, casasDecimais = 2): string {
  return valor.toFixed(casasDecimais);
}

function formatarPercentual(valor: number, casasDecimais = 1): string {
  return `${(valor * 100).toFixed(casasDecimais)}%`;
}

function toggleScoreTooltip(veiculoId: string): void {
  scoreTooltipAbertoId.value = scoreTooltipAbertoId.value === veiculoId ? null : veiculoId;
}

function handleClickForaTooltip(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (target?.closest('[data-score-tooltip-root]')) {
    return;
  }
  scoreTooltipAbertoId.value = null;
}

onMounted(() => {
  window.addEventListener('click', handleClickForaTooltip);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickForaTooltip);
});

function getAriaSort(campo: CampoOrdenacao): 'ascending' | 'descending' | 'none' {
  if (props.ordenacao.campo !== campo) {
    return 'none';
  }

  return props.ordenacao.direcao === 'asc' ? 'ascending' : 'descending';
}

defineEmits<{
  ordenar: [campo: CampoOrdenacao];
  editar: [veiculo: Veiculo];
  atualizar: [veiculo: Veiculo];
}>();
</script>
