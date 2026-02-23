<template>
  <div class="container mx-auto px-4 py-6 lg:py-8">
    <div class="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-base font-semibold text-slate-900">Candidatos a Lance</h1>
          <p class="text-sm text-slate-600">{{ totalCandidatos }} candidatos ({{ ativos.length }} ativos / {{ inativos.length }} inativos)</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <label class="text-xs font-medium text-slate-700">Incremento global</label>
          <input
            v-model.number="incrementoGlobal"
            type="number"
            min="1"
            class="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
          >
          <span v-if="recalculandoLanceLimite" class="text-xs text-amber-700">Recalculando limites...</span>
          <button
            type="button"
            class="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            :disabled="refreshing"
            @click="refreshTodos"
          >
            {{ refreshing ? 'Atualizando...' : 'Atualizar Todos' }}
          </button>
        </div>
      </div>

      <div class="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium"
          :class="abaAtiva === 'ativos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          @click="abaAtiva = 'ativos'"
        >
          Ativos ({{ ativos.length }})
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium"
          :class="abaAtiva === 'historico' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          @click="abaAtiva = 'historico'"
        >
          Histórico ({{ inativos.length }})
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div class="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      <p class="text-sm text-slate-600">Carregando candidatos...</p>
    </div>

    <div v-else-if="!totalCandidatos" class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p class="text-sm text-slate-600">Nenhum candidato selecionado ainda.</p>
    </div>

    <div v-else class="space-y-3">
      <template v-if="abaAtiva === 'ativos'">
        <div v-if="!ativos.length" class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p class="text-sm text-slate-600">Não há candidatos ativos no momento.</p>
        </div>

        <CandidatoCard
          v-for="(veiculo, index) in ativos"
          :key="veiculo.id"
          :veiculo="veiculo"
          :incremento-lance="incrementoGlobal"
          :lance-atual-local="obterLanceAtualLocal(veiculo)"
          :pode-subir="index > 0"
          :pode-descer="index < ativos.length - 1"
          @mover-cima="() => moverCandidato(veiculo.id, 'cima', 'ativos')"
          @mover-baixo="() => moverCandidato(veiculo.id, 'baixo', 'ativos')"
          @atualizar-lance-limite="atualizarLanceLimite"
          @atualizar-lance-local="atualizarLanceLocal"
          @atualizar-incremento-global="(v) => incrementoGlobal = v"
          @remover="removerCandidato"
        />
      </template>

      <template v-else>
        <div v-if="!inativos.length" class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p class="text-sm text-slate-600">Ainda não há histórico de candidatos inativos.</p>
        </div>

        <CandidatoCard
          v-for="(veiculo, index) in inativos"
          :key="veiculo.id"
          :veiculo="veiculo"
          :incremento-lance="incrementoGlobal"
          :lance-atual-local="obterLanceAtualLocal(veiculo)"
          :pode-subir="index > 0"
          :pode-descer="index < inativos.length - 1"
          @mover-cima="() => moverCandidato(veiculo.id, 'cima', 'inativos')"
          @mover-baixo="() => moverCandidato(veiculo.id, 'baixo', 'inativos')"
          @atualizar-lance-limite="atualizarLanceLimite"
          @atualizar-lance-local="atualizarLanceLocal"
          @atualizar-incremento-global="(v) => incrementoGlobal = v"
          @remover="removerCandidato"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { CONFIG_NEGOCIO } from '~/config/negocio';

const STORAGE_LANCES = 'candidatos-lances';

const isLoading = ref(false);
const refreshing = ref(false);
const recalculandoLanceLimite = ref(false);
const ativos = ref<Veiculo[]>([]);
const inativos = ref<Veiculo[]>([]);
const abaAtiva = ref<'ativos' | 'historico'>('ativos');
const incrementoGlobal = ref<number>(CONFIG_NEGOCIO.candidatos.incrementoLancePadrao);
const lancesLocais = ref<Record<string, number>>({});
const timerRecalculo = ref<ReturnType<typeof setTimeout> | null>(null);

const totalCandidatos = computed(() => ativos.value.length + inativos.value.length);
const todosOrdenados = computed(() => [...ativos.value, ...inativos.value]);

function valorLance(veiculo: Veiculo) {
  return veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial;
}

function carregarLancesLocais() {
  if (!import.meta.client) {
    return;
  }

  try {
    const raw = localStorage.getItem(STORAGE_LANCES);
    if (!raw) {
      lancesLocais.value = {};
      return;
    }

    const parsed = JSON.parse(raw) as Record<string, number>;
    lancesLocais.value = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    lancesLocais.value = {};
  }
}

function persistirLancesLocais() {
  if (!import.meta.client) {
    return;
  }

  localStorage.setItem(STORAGE_LANCES, JSON.stringify(lancesLocais.value));
}

function obterLanceAtualLocal(veiculo: Veiculo): number {
  const salvo = lancesLocais.value[veiculo.id];
  if (typeof salvo === 'number' && Number.isFinite(salvo)) {
    return salvo;
  }

  return valorLance(veiculo);
}

function atualizarLanceLocal(payload: { id: string; lanceAtualLocal: number }) {
  lancesLocais.value = {
    ...lancesLocais.value,
    [payload.id]: payload.lanceAtualLocal,
  };
}

async function carregarCandidatos() {
  isLoading.value = true;

  try {
    const response = await fetch('/api/veiculos/candidatos');
    if (!response.ok) {
      throw new Error('Erro ao carregar candidatos');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Erro ao carregar candidatos');
    }

    ativos.value = (data.ativos || []).map((item: Veiculo) => ({
      ...item,
      dataCaptura: new Date(item.dataCaptura),
      dataLeilao: item.dataLeilao ? new Date(item.dataLeilao) : undefined,
      candidatoAtualizadoEm: item.candidatoAtualizadoEm ? new Date(item.candidatoAtualizadoEm) : null,
    }));

    inativos.value = (data.inativos || []).map((item: Veiculo) => ({
      ...item,
      dataCaptura: new Date(item.dataCaptura),
      dataLeilao: item.dataLeilao ? new Date(item.dataLeilao) : undefined,
      candidatoAtualizadoEm: item.candidatoAtualizadoEm ? new Date(item.candidatoAtualizadoEm) : null,
    }));
  } catch (error) {
    console.error('Erro ao carregar candidatos:', error);
    ativos.value = [];
    inativos.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function recalcularLanceLimiteGlobal() {
  if (!Number.isFinite(incrementoGlobal.value) || incrementoGlobal.value <= 0) {
    return;
  }

  recalculandoLanceLimite.value = true;
  try {
    const response = await fetch('/api/veiculos/candidatos/lance-limite', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incrementoGlobal: incrementoGlobal.value }),
    });

    if (!response.ok) {
      throw new Error('Erro ao recalcular lance limite');
    }

    await carregarCandidatos();
  } catch (error) {
    console.error('Erro ao recalcular lance limite:', error);
    alert('Não foi possível recalcular o lance limite de todos os candidatos.');
  } finally {
    recalculandoLanceLimite.value = false;
  }
}

async function atualizarLanceLimite(payload: { id: string; lanceLimite: number }) {
  try {
    const response = await fetch(`/api/veiculos/${payload.id}/lance-limite`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lanceLimite: payload.lanceLimite }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar lance limite');
    }

    await carregarCandidatos();
  } catch (error) {
    console.error('Erro ao atualizar lance limite:', error);
    alert('Não foi possível atualizar o lance limite.');
  }
}

function reordenarNoArray(lista: Veiculo[], id: string, direcao: 'cima' | 'baixo'): Veiculo[] {
  const copia = [...lista];
  const index = copia.findIndex((item) => item.id === id);

  if (index < 0) {
    return copia;
  }

  const destino = direcao === 'cima' ? index - 1 : index + 1;
  if (destino < 0 || destino >= copia.length) {
    return copia;
  }

  const [item] = copia.splice(index, 1);
  copia.splice(destino, 0, item);
  return copia;
}

async function moverCandidato(id: string, direcao: 'cima' | 'baixo', secao: 'ativos' | 'inativos') {
  const novaOrdemAtivos = secao === 'ativos' ? reordenarNoArray(ativos.value, id, direcao) : [...ativos.value];
  const novaOrdemInativos = secao === 'inativos' ? reordenarNoArray(inativos.value, id, direcao) : [...inativos.value];

  const ids = [...novaOrdemAtivos, ...novaOrdemInativos].map((item) => item.id);

  try {
    const response = await fetch('/api/veiculos/candidatos/ordem', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar ordem');
    }

    ativos.value = novaOrdemAtivos;
    inativos.value = novaOrdemInativos;
  } catch (error) {
    console.error('Erro ao mover candidato:', error);
    alert('Não foi possível atualizar a ordem.');
    await carregarCandidatos();
  }
}

async function removerCandidato(id: string) {
  const confirmar = window.confirm('Remover este veículo da lista de candidatos?');
  if (!confirmar) {
    return;
  }

  try {
    const response = await fetch(`/api/veiculos/${id}/candidato`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isCandidato: false,
        confirmar: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao remover candidato');
    }

    await carregarCandidatos();
  } catch (error) {
    console.error('Erro ao remover candidato:', error);
    alert('Não foi possível remover o candidato.');
  }
}

async function refreshTodos() {
  if (refreshing.value) {
    return;
  }

  refreshing.value = true;

  try {
    const response = await fetch('/api/scrapper/candidatos/refresh', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar candidatos');
    }

    await carregarCandidatos();
  } catch (error) {
    console.error('Erro no refresh de candidatos:', error);
    alert('Não foi possível atualizar todos os candidatos.');
  } finally {
    refreshing.value = false;
  }
}

watch(
  incrementoGlobal,
  () => {
    if (timerRecalculo.value) {
      clearTimeout(timerRecalculo.value);
    }

    timerRecalculo.value = setTimeout(() => {
      recalcularLanceLimiteGlobal();
    }, 400);
  },
);

watch(
  lancesLocais,
  () => {
    persistirLancesLocais();
  },
  { deep: true },
);

watch(
  todosOrdenados,
  (lista) => {
    const idsValidos = new Set(lista.map((item) => item.id));
    const filtrado = Object.entries(lancesLocais.value).reduce<Record<string, number>>((acc, [id, valor]) => {
      if (idsValidos.has(id)) {
        acc[id] = valor;
      }
      return acc;
    }, {});

    lancesLocais.value = filtrado;
  },
  { deep: true },
);

onMounted(async () => {
  carregarLancesLocais();
  await carregarCandidatos();
});
</script>
