<template>
  <article class="rounded-2xl border p-4 shadow-sm" :class="cardClass">
    <header class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <div class="rounded-lg bg-white/80 px-3 py-1 text-4xl font-black text-slate-900">
          {{ veiculo.numeroLote ?? '--' }}
        </div>
        <div class="min-w-0">
          <h3 class="truncate text-lg font-bold text-slate-900">{{ veiculo.marca }} {{ veiculo.modelo }}</h3>
          <p class="text-xs text-slate-700">{{ veiculo.ano }} • {{ kmLabel }}</p>
          <p v-if="veiculo.candidatoStatus && veiculo.candidatoStatus !== 'ok'" class="mt-1 text-xs font-semibold text-red-700">
            Alerta: {{ veiculo.candidatoUltimoErro || 'Falha na última atualização.' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="getScoreClass(getScore(veiculo))">
          Score {{ getScore(veiculo).toFixed(1) }}
        </span>
        <button
          type="button"
          class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-50"
          :disabled="!podeSubir"
          @click="$emit('moverCima', veiculo.id)"
        >
          ↑
        </button>
        <button
          type="button"
          class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-50"
          :disabled="!podeDescer"
          @click="$emit('moverBaixo', veiculo.id)"
        >
          ↓
        </button>
      </div>
    </header>

    <div class="mb-4 flex flex-wrap gap-2 text-xs">
      <span v-if="temProblemaMotor" class="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">Motor</span>
      <span v-if="temProblemaChave" class="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">Sem chave</span>
      <span class="rounded bg-white/80 px-2 py-1 font-semibold text-slate-700">{{ veiculo.leiloeiro?.descricao || 'Leiloeiro' }}</span>
      <span v-if="veiculo.patioUf" class="rounded bg-white/80 px-2 py-1 font-semibold text-slate-700">{{ veiculo.patioUf }}</span>
      <span v-if="veiculo.sinistro !== 'Nenhum'" class="rounded bg-white/80 px-2 py-1 font-semibold text-slate-700">{{ veiculo.sinistro }}</span>
    </div>

    <p class="mb-4 line-clamp-3 text-sm text-slate-800">{{ veiculo.descricao || 'Sem descrição detalhada.' }}</p>

    <section class="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div class="rounded-lg bg-white/70 p-3">
        <p class="mb-1 text-xs font-semibold text-slate-700">Incremento global</p>
        <input
          :value="incrementoLance"
          type="number"
          min="1"
          class="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          @change="emitirIncremento"
        >

        <p class="mb-1 text-xs font-semibold text-slate-700">Lance atual (local)</p>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded border border-slate-300 bg-white px-2 py-1 text-sm" @click="ajustarLance(-incrementoLance)">-</button>
          <input
            :value="lanceAtualLocal"
            type="number"
            min="0"
            class="w-full rounded border border-slate-300 px-2 py-1 text-sm"
            @change="emitirLanceLocal"
          >
          <button type="button" class="rounded border border-slate-300 bg-white px-2 py-1 text-sm" @click="ajustarLance(incrementoLance)">+</button>
        </div>
      </div>

      <div class="rounded-lg bg-white/70 p-3">
        <p class="mb-1 text-xs font-semibold text-slate-700">Lance limite</p>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded border border-slate-300 bg-white px-2 py-1 text-sm" @click="ajustarLanceLimite(-incrementoLance)">-</button>
          <input
            :value="lanceLimiteInput"
            type="number"
            min="1"
            class="w-full rounded border border-slate-300 px-2 py-1 text-sm"
            @change="emitirLanceLimite"
          >
          <button type="button" class="rounded border border-slate-300 bg-white px-2 py-1 text-sm" @click="ajustarLanceLimite(incrementoLance)">+</button>
          <button type="button" class="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white" @click="atualizarLanceLimite">Atualizar</button>
        </div>
        <p class="mt-2 text-xs text-slate-600">
          Base de estratégia: ~60% do mercado em múltiplos do incremento.
        </p>
      </div>

      <div class="rounded-lg border border-slate-200 bg-slate-100 p-3">
        <p class="text-sm font-semibold text-slate-900">Resumo rápido</p>
        <div class="mt-2 space-y-2 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-700">Lucro (limite)</span>
            <span class="rounded px-2 py-0.5 font-semibold" :class="getLucroClass(breakdownLanceLimite.roiAjustado)">
              R$ {{ formatarValor(breakdownLanceLimite.lucroProjetado) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-700">ROI (limite)</span>
            <span class="rounded px-2 py-0.5 font-semibold" :class="getRoiClass(breakdownLanceLimite.roiAjustado)">
              {{ breakdownLanceLimite.roiProjetado.toFixed(1) }}%
            </span>
          </div>
          <div class="flex items-center justify-between border-t border-slate-300 pt-2">
            <span class="text-slate-700">Lucro (local)</span>
            <span class="rounded px-2 py-0.5 font-semibold" :class="getLucroClass(breakdownLanceLocal.roiAjustado)">
              R$ {{ formatarValor(breakdownLanceLocal.lucroProjetado) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-700">ROI (local)</span>
            <span class="rounded px-2 py-0.5 font-semibold" :class="getRoiClass(breakdownLanceLocal.roiAjustado)">
              {{ breakdownLanceLocal.roiProjetado.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </section>

    <div class="space-y-3">
      <EstimativaLucroTabela
        titulo="Estimativa de Lucro (Base: Lance Atual Local)"
        :valor-mercado="veiculo.valorMercado"
        :breakdown="breakdownLanceLocal"
      />
    </div>

    <footer class="mt-4 flex flex-wrap items-center justify-between gap-2">
      <a :href="veiculo.urlOrigem" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-blue-700 underline">Abrir Lote</a>
      <button type="button" class="rounded border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700" @click="$emit('remover', veiculo.id)">Remover</button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';

const props = defineProps<{
  veiculo: Veiculo;
  incrementoLance: number;
  lanceAtualLocal: number;
  podeSubir: boolean;
  podeDescer: boolean;
}>();

const emit = defineEmits<{
  moverCima: [id: string];
  moverBaixo: [id: string];
  remover: [id: string];
  atualizarLanceLimite: [payload: { id: string; lanceLimite: number }];
  atualizarLanceLocal: [payload: { id: string; lanceAtualLocal: number }];
  atualizarIncrementoGlobal: [incremento: number];
}>();

const { formatarValor } = useFormatacao();
const { getScore, getScoreClass, getLucroClass, getRoiClass } = useVeiculoScore();

const lanceLimiteInput = ref<number>(props.veiculo.lanceLimite ?? 0);

watch(
  () => props.veiculo.lanceLimite,
  (valor) => {
    lanceLimiteInput.value = valor ?? 0;
  },
);

const kmLabel = computed(() => {
  if (props.veiculo.quilometragem > 0) {
    return `${props.veiculo.quilometragem.toLocaleString('pt-BR')} km`;
  }

  const estimativa = VeiculoRanker.estimarQuilometragem(props.veiculo).km;
  return `${estimativa.toLocaleString('pt-BR')} km (estimado)`;
});

const temProblemaMotor = computed(() => {
  const d = (props.veiculo.descricao || '').toUpperCase();
  return d.includes('MOTOR DESMONTADO') || d.includes('MOTOR FALTANDO') || d.includes('FALTANDO PEÇAS');
});

const temProblemaChave = computed(() => (props.veiculo.descricao || '').toUpperCase().includes('SEM CHAVE'));

function montarBreakdown(lance: number) {
  const simulado = {
    ...props.veiculo,
    lanceAtual: lance,
    lanceInicial: 0,
  };

  return VeiculoRanker.calcularBreakdown(simulado, props.veiculo.leiloeiro);
}

const breakdownLanceLimite = computed(() => {
  const lance = props.veiculo.lanceLimite && props.veiculo.lanceLimite > 0 ? props.veiculo.lanceLimite : 0;
  return montarBreakdown(lance);
});

const breakdownLanceLocal = computed(() => {
  const lance = props.lanceAtualLocal > 0 ? props.lanceAtualLocal : 0;
  return montarBreakdown(lance);
});

const cardClass = computed(() => {
  const score = getScore(props.veiculo);
  if (score >= 8.5) return 'border-emerald-200 bg-emerald-50';
  if (score >= 7) return 'border-blue-200 bg-blue-50';
  if (score >= 5) return 'border-amber-200 bg-amber-50';
  if (score >= 3) return 'border-orange-200 bg-orange-50';
  return 'border-red-200 bg-red-50';
});

function atualizarLanceLimite() {
  if (!Number.isFinite(lanceLimiteInput.value) || lanceLimiteInput.value <= 0) {
    return;
  }

  emit('atualizarLanceLimite', {
    id: props.veiculo.id,
    lanceLimite: lanceLimiteInput.value,
  });
}

function ajustarLanceLimite(delta: number) {
  const proximo = Math.max(1, (lanceLimiteInput.value || 0) + delta);
  lanceLimiteInput.value = proximo;
}

function emitirLanceLimite(event: Event) {
  const target = event.target as HTMLInputElement;
  const valor = Number(target.value);
  lanceLimiteInput.value = Number.isFinite(valor) && valor > 0 ? valor : 1;
}

function ajustarLance(delta: number) {
  const proximo = Math.max(0, (props.lanceAtualLocal || 0) + delta);
  emit('atualizarLanceLocal', {
    id: props.veiculo.id,
    lanceAtualLocal: proximo,
  });
}

function emitirLanceLocal(event: Event) {
  const target = event.target as HTMLInputElement;
  const valor = Number(target.value);

  emit('atualizarLanceLocal', {
    id: props.veiculo.id,
    lanceAtualLocal: Number.isFinite(valor) && valor >= 0 ? valor : 0,
  });
}

function emitirIncremento(event: Event) {
  const target = event.target as HTMLInputElement;
  const valor = Number(target.value);
  if (Number.isFinite(valor) && valor > 0) {
    emit('atualizarIncrementoGlobal', valor);
  }
}
</script>
