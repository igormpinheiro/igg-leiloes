<!-- pages/index.vue -->
<template>
  <div class="container mx-auto px-4 py-6 lg:py-8">
    <VeiculoEditModal
      :is-open="modalEditarAberto"
      :veiculo="veiculoSelecionado"
      @close="fecharModalEditar"
      @save="salvarVeiculo"
    />

    <div class="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-base font-semibold text-slate-900">Visão Geral dos Veículos</h1>
          <p class="text-sm text-slate-600">Exibindo {{ veiculosFiltrados.length }} de {{ veiculos.length }} veículos</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 md:hidden"
            aria-label="Abrir filtros"
            @click="filtrosMobileAbertos = true"
          >
            <Icon name="mdi:filter-variant" class="text-base" />
            Filtros
          </button>
          <button
            type="button"
            class="hidden items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 md:inline-flex"
            :aria-label="filtrosColapsados ? 'Exibir filtros' : 'Recolher filtros'"
            @click="filtrosColapsados = !filtrosColapsados"
          >
            <Icon :name="filtrosColapsados ? 'mdi:chevron-right' : 'mdi:chevron-left'" class="text-base" />
            {{ filtrosColapsados ? 'Exibir filtros' : 'Recolher filtros' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
            @click="resetarFiltros"
          >
            <Icon name="mdi:filter-remove" class="text-base" />
            Limpar tudo
          </button>
        </div>
      </div>

      <div v-if="chipsFiltrosAtivos.length > 0" class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="chip in chipsFiltrosAtivos"
          :key="chip.chave"
          type="button"
          class="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 transition hover:bg-blue-100"
          @click="limparFiltro(chip.chave)"
        >
          {{ chip.rotulo }}
          <Icon name="mdi:close" class="text-sm" />
        </button>
      </div>
    </div>

    <div
      class="flex min-h-[calc(100vh-12rem)] transition-all duration-200"
      :class="filtrosColapsados ? 'gap-0' : 'gap-4'"
    >
      <aside
        v-if="!filtrosColapsados"
        class="hidden w-80 rounded-xl border border-slate-200 bg-white p-0 shadow-sm md:block"
      >
        <FiltroVeiculos
          :filtros="filtros"
          :leiloeiros="leiloeiros"
          @resetar="resetarFiltros"
        />
      </aside>

      <div class="flex-1 min-w-0">
        <div v-if="isLoading" class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div class="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p class="text-sm text-slate-600">Carregando veículos...</p>
        </div>

        <div v-else-if="veiculosFiltrados.length === 0" class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <svg class="mx-auto h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-slate-900">Nenhum veículo encontrado</h3>
          <p class="mt-1 text-sm text-slate-500">Ajuste os filtros para encontrar oportunidades.</p>
        </div>

        <TabelaVeiculos
          v-else
          :veiculos="veiculosFiltrados"
          :ordenacao="ordenacao"
          :refreshing-id="refreshingId"
          @ordenar="toggleOrdenacao"
          @editar="abrirModalEditar"
          @atualizar="atualizarVeiculo"
        />
      </div>
    </div>

    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div v-if="filtrosMobileAbertos" class="fixed inset-0 z-40 bg-black/30 md:hidden" @click="filtrosMobileAbertos = false" />
    </Transition>

    <aside
      class="fixed inset-y-0 left-0 z-50 w-80 max-w-[88vw] overflow-y-auto border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 md:hidden"
      :class="filtrosMobileAbertos ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 class="text-sm font-semibold text-slate-900">Filtros</h2>
        <button
          type="button"
          class="rounded-md p-1 text-slate-600 transition hover:bg-slate-100"
          aria-label="Fechar filtros"
          @click="filtrosMobileAbertos = false"
        >
          <Icon name="mdi:close" class="text-xl" />
        </button>
      </div>
      <FiltroVeiculos
        :filtros="filtros"
        :leiloeiros="leiloeiros"
        @resetar="resetarFiltros"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { Leiloeiro, Veiculo } from '~/types/veiculo';
import { scrapperService } from '~/services/scrapperService';
import { TipoSinistro } from '~/types/veiculo';

const { getPorcentagemMercado, getScore, calcularLucroEstimado } = useVeiculoScore();
const { calcularActive } = useDataLeilao();

type CampoOrdenacao = 'modelo' | 'ano' | 'quilometragem' | 'porcentagemMercado' | 'lucroEstimado' | 'score';

type FiltrosVeiculos = {
  termoPesquisa: string;
  anoMin: number | null;
  anoMax: number | null;
  precoMin: number | null;
  precoMax: number | null;
  kmMin: number | null;
  kmMax: number | null;
  semSinistro: boolean;
  apenasAtivos: boolean;
  leiloeiroId: number | null;
  patioUf: string;
};

type ChaveFiltro = keyof FiltrosVeiculos;

const FILTROS_PADRAO: FiltrosVeiculos = {
  termoPesquisa: '',
  anoMin: null,
  anoMax: null,
  precoMin: null,
  precoMax: null,
  kmMin: null,
  kmMax: null,
  semSinistro: false,
  apenasAtivos: true,
  leiloeiroId: null,
  patioUf: '',
};

const filtrosColapsados = ref(false);
const filtrosMobileAbertos = ref(false);
const modalEditarAberto = ref(false);
const veiculoSelecionado = ref<Veiculo | null>(null);
const isLoading = ref(false);
const refreshingId = ref<string | null>(null);
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const filtros = reactive<FiltrosVeiculos>({ ...FILTROS_PADRAO });
const filtrosAplicados = reactive<FiltrosVeiculos>({ ...FILTROS_PADRAO });

const ordenacao = reactive<{
  campo: CampoOrdenacao;
  direcao: 'asc' | 'desc';
}>({
  campo: 'score',
  direcao: 'desc',
});

const veiculos = ref<Veiculo[]>([]);
const leiloeiros = ref<Leiloeiro[]>([]);

function valorLance(veiculo: Veiculo): number {
  return veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial;
}

function copiarFiltros(origem: FiltrosVeiculos, destino: FiltrosVeiculos): void {
  destino.termoPesquisa = origem.termoPesquisa;
  destino.anoMin = origem.anoMin;
  destino.anoMax = origem.anoMax;
  destino.precoMin = origem.precoMin;
  destino.precoMax = origem.precoMax;
  destino.kmMin = origem.kmMin;
  destino.kmMax = origem.kmMax;
  destino.semSinistro = origem.semSinistro;
  destino.apenasAtivos = origem.apenasAtivos;
  destino.leiloeiroId = origem.leiloeiroId;
  destino.patioUf = origem.patioUf;
}

const veiculosFiltrados = computed(() => {
  let resultado = [...veiculos.value];

  if (filtrosAplicados.termoPesquisa.trim() !== '') {
    const termo = filtrosAplicados.termoPesquisa.toLowerCase().trim();
    resultado = resultado.filter((v) => v.modelo.toLowerCase().includes(termo) || v.marca.toLowerCase().includes(termo));
  }

  if (filtrosAplicados.anoMin !== null) {
    resultado = resultado.filter((v) => parseInt(v.ano, 10) >= filtrosAplicados.anoMin!);
  }

  if (filtrosAplicados.anoMax !== null) {
    resultado = resultado.filter((v) => parseInt(v.ano, 10) <= filtrosAplicados.anoMax!);
  }

  if (filtrosAplicados.precoMin !== null) {
    resultado = resultado.filter((v) => valorLance(v) >= filtrosAplicados.precoMin!);
  }

  if (filtrosAplicados.precoMax !== null) {
    resultado = resultado.filter((v) => valorLance(v) <= filtrosAplicados.precoMax!);
  }

  if (filtrosAplicados.kmMin !== null) {
    resultado = resultado.filter((v) => v.quilometragem >= filtrosAplicados.kmMin!);
  }

  if (filtrosAplicados.kmMax !== null) {
    resultado = resultado.filter((v) => v.quilometragem <= filtrosAplicados.kmMax!);
  }

  if (filtrosAplicados.semSinistro) {
    resultado = resultado.filter((v) => v.sinistro === TipoSinistro.Nenhum);
  }

  if (filtrosAplicados.apenasAtivos) {
    resultado = resultado.filter((v) => v.active);
  }

  if (filtrosAplicados.leiloeiroId !== null) {
    resultado = resultado.filter((v) => v.leiloeiroId === filtrosAplicados.leiloeiroId);
  }

  if (filtrosAplicados.patioUf) {
    resultado = resultado.filter((v) => (v.patioUf || '').toUpperCase() === filtrosAplicados.patioUf);
  }

  resultado.sort((a, b) => {
    let valorA = 0;
    let valorB = 0;

    switch (ordenacao.campo) {
      case 'modelo':
        return ordenacao.direcao === 'asc'
          ? a.modelo.localeCompare(b.modelo)
          : b.modelo.localeCompare(a.modelo);
      case 'ano':
        valorA = parseInt(a.ano, 10);
        valorB = parseInt(b.ano, 10);
        break;
      case 'quilometragem':
        valorA = a.quilometragem;
        valorB = b.quilometragem;
        break;
      case 'porcentagemMercado':
        valorA = getPorcentagemMercado(a);
        valorB = getPorcentagemMercado(b);
        break;
      case 'lucroEstimado':
        valorA = calcularLucroEstimado(a);
        valorB = calcularLucroEstimado(b);
        break;
      case 'score':
        valorA = getScore(a);
        valorB = getScore(b);
        break;
    }

    return ordenacao.direcao === 'asc' ? valorA - valorB : valorB - valorA;
  });

  return resultado;
});

const chipsFiltrosAtivos = computed(() => {
  const chips: Array<{ chave: ChaveFiltro; rotulo: string }> = [];

  if (filtrosAplicados.termoPesquisa.trim()) {
    chips.push({ chave: 'termoPesquisa', rotulo: `Busca: ${filtrosAplicados.termoPesquisa}` });
  }

  if (filtrosAplicados.anoMin !== null) {
    chips.push({ chave: 'anoMin', rotulo: `Ano min: ${filtrosAplicados.anoMin}` });
  }

  if (filtrosAplicados.anoMax !== null) {
    chips.push({ chave: 'anoMax', rotulo: `Ano max: ${filtrosAplicados.anoMax}` });
  }

  if (filtrosAplicados.precoMin !== null) {
    chips.push({ chave: 'precoMin', rotulo: `Lance min: R$ ${filtrosAplicados.precoMin.toLocaleString('pt-BR')}` });
  }

  if (filtrosAplicados.precoMax !== null) {
    chips.push({ chave: 'precoMax', rotulo: `Lance max: R$ ${filtrosAplicados.precoMax.toLocaleString('pt-BR')}` });
  }

  if (filtrosAplicados.kmMin !== null) {
    chips.push({ chave: 'kmMin', rotulo: `KM min: ${filtrosAplicados.kmMin.toLocaleString('pt-BR')}` });
  }

  if (filtrosAplicados.kmMax !== null) {
    chips.push({ chave: 'kmMax', rotulo: `KM max: ${filtrosAplicados.kmMax.toLocaleString('pt-BR')}` });
  }

  if (filtrosAplicados.semSinistro) {
    chips.push({ chave: 'semSinistro', rotulo: 'Sem sinistro' });
  }

  if (!filtrosAplicados.apenasAtivos) {
    chips.push({ chave: 'apenasAtivos', rotulo: 'Inclui inativos' });
  }

  if (filtrosAplicados.leiloeiroId !== null) {
    const leiloeiro = leiloeiros.value.find((item) => item.id === filtrosAplicados.leiloeiroId);
    chips.push({ chave: 'leiloeiroId', rotulo: `Leiloeiro: ${leiloeiro?.descricao || filtrosAplicados.leiloeiroId}` });
  }

  if (filtrosAplicados.patioUf) {
    chips.push({ chave: 'patioUf', rotulo: `UF: ${filtrosAplicados.patioUf}` });
  }

  return chips;
});

watch(
  () => [
    filtros.termoPesquisa,
    filtros.anoMin,
    filtros.anoMax,
    filtros.precoMin,
    filtros.precoMax,
    filtros.kmMin,
    filtros.kmMax,
  ],
  () => {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value);
    }

    debounceTimer.value = setTimeout(() => {
      filtrosAplicados.termoPesquisa = filtros.termoPesquisa;
      filtrosAplicados.anoMin = filtros.anoMin;
      filtrosAplicados.anoMax = filtros.anoMax;
      filtrosAplicados.precoMin = filtros.precoMin;
      filtrosAplicados.precoMax = filtros.precoMax;
      filtrosAplicados.kmMin = filtros.kmMin;
      filtrosAplicados.kmMax = filtros.kmMax;
    }, 250);
  },
);

watch(
  () => [filtros.semSinistro, filtros.apenasAtivos, filtros.leiloeiroId, filtros.patioUf],
  () => {
    filtrosAplicados.semSinistro = filtros.semSinistro;
    filtrosAplicados.apenasAtivos = filtros.apenasAtivos;
    filtrosAplicados.leiloeiroId = filtros.leiloeiroId;
    filtrosAplicados.patioUf = filtros.patioUf;
  },
);

function limparFiltro(chave: ChaveFiltro): void {
  switch (chave) {
    case "termoPesquisa": filtros.termoPesquisa = FILTROS_PADRAO.termoPesquisa; break;
    case "anoMin": filtros.anoMin = FILTROS_PADRAO.anoMin; break;
    case "anoMax": filtros.anoMax = FILTROS_PADRAO.anoMax; break;
    case "precoMin": filtros.precoMin = FILTROS_PADRAO.precoMin; break;
    case "precoMax": filtros.precoMax = FILTROS_PADRAO.precoMax; break;
    case "kmMin": filtros.kmMin = FILTROS_PADRAO.kmMin; break;
    case "kmMax": filtros.kmMax = FILTROS_PADRAO.kmMax; break;
    case "semSinistro": filtros.semSinistro = FILTROS_PADRAO.semSinistro; break;
    case "apenasAtivos": filtros.apenasAtivos = FILTROS_PADRAO.apenasAtivos; break;
    case "leiloeiroId": filtros.leiloeiroId = FILTROS_PADRAO.leiloeiroId; break;
    case "patioUf": filtros.patioUf = FILTROS_PADRAO.patioUf; break;
  }
  copiarFiltros(filtros, filtrosAplicados);
}

function resetarFiltros(): void {
  copiarFiltros(FILTROS_PADRAO, filtros);
  copiarFiltros(FILTROS_PADRAO, filtrosAplicados);
}

async function carregarVeiculos() {
  isLoading.value = true;
  try {
    const response = await fetch('/api/veiculos?limit=10000');
    if (!response.ok) {
      throw new Error('Erro ao carregar veículos');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Erro ao carregar veículos');
    }

    leiloeiros.value = data.leiloeiros || [];
    veiculos.value = data.data.map((veiculo: Veiculo) => ({
      ...veiculo,
      dataCaptura: new Date(veiculo.dataCaptura),
      dataLeilao: veiculo.dataLeilao ? new Date(veiculo.dataLeilao) : undefined,
      active: veiculo.dataLeilao ? calcularActive(new Date(veiculo.dataLeilao)) : false,
    }));
  } catch (error) {
    console.error('Erro ao carregar veículos:', error);
    veiculos.value = [];
  } finally {
    isLoading.value = false;
  }
}

function toggleOrdenacao(campo: CampoOrdenacao) {
  if (ordenacao.campo === campo) {
    ordenacao.direcao = ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    return;
  }

  ordenacao.campo = campo;
  ordenacao.direcao = 'desc';
}

function abrirModalEditar(veiculo: Veiculo) {
  veiculoSelecionado.value = veiculo;
  modalEditarAberto.value = true;
}

function fecharModalEditar() {
  modalEditarAberto.value = false;
  veiculoSelecionado.value = null;
}

function atualizarVeiculoDaLista(veiculoAtualizado: Veiculo) {
  const index = veiculos.value.findIndex((v) => v.urlOrigem === veiculoAtualizado.urlOrigem);
  if (index !== -1) {
    veiculos.value[index] = { ...veiculos.value[index], ...veiculoAtualizado };
  }
}

async function atualizarVeiculo(veiculo: Veiculo) {
  if (!veiculo.urlOrigem || refreshingId.value === veiculo.id) {
    return;
  }

  try {
    refreshingId.value = veiculo.id;
    const dataLeilao = veiculo.dataLeilao ? new Date(veiculo.dataLeilao).toISOString() : undefined;
    const result = await scrapperService.executarScrapper(veiculo.urlOrigem, dataLeilao);

    if (!result.veiculo) {
      alert('Lote cancelado/descartado.');
      return;
    }

    atualizarVeiculoDaLista(result.veiculo);
  } catch (error) {
    console.error('Erro ao atualizar lote:', error);
    alert('Erro ao atualizar lote. Verifique os logs.');
  } finally {
    refreshingId.value = null;
  }
}

async function salvarVeiculo(veiculoEditado: Veiculo) {
  try {
    isLoading.value = true;
    const response = await fetch(`/api/veiculos/${veiculoEditado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(veiculoEditado),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar veículo');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Erro ao atualizar veículo');
    }

    const index = veiculos.value.findIndex((v) => v.id === veiculoEditado.id);
    if (index !== -1) {
      veiculos.value[index] = {
        ...veiculoEditado,
        dataLeilao: veiculoEditado.dataLeilao ? new Date(veiculoEditado.dataLeilao) : undefined,
        active: veiculoEditado.dataLeilao ? calcularActive(new Date(veiculoEditado.dataLeilao)) : false,
      };
    }

    alert('Veículo atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar veículo:', error);
    alert(`Erro ao salvar veículo: ${error}`);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  carregarVeiculos();
});
</script>
