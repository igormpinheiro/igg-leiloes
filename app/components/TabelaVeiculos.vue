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
              <span v-else>
                {{ VeiculoRanker.estimarQuilometragem(veiculo).toLocaleString('pt-BR') }}*
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
                  {{ getPorcentagemMercado(veiculo) }}%
                </span>
                <span v-else class="text-xs text-slate-400">--</span>
              </div>
            </td>
            <td class="px-2 py-2 text-right align-top">
              <div class="flex float-right flex-row items-end gap-1">
                <span
                  v-if="veiculo.valorMercado > 0"
                  class="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold"
                  :class="getLucroClass(calcularLucroEstimado(veiculo))"
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
              <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="getScoreClass(getScore(veiculo))">
                {{ getScoreIcon(getScore(veiculo)) }} {{ getScore(veiculo).toFixed(1) }}
              </span>
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
import type { TipoSinistro, Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';

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
  getRoiClass,
  getScore,
  getScoreClass,
  getScoreIcon,
} = {
  ...useVeiculoScore(),
  ...useLeiloeiro(),
};

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
