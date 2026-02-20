<!-- pages/index.vue -->
<template>
  <div class="container mx-auto px-4 py-8">

    <!-- Modal de edição -->
    <VeiculoEditModal
        :is-open="modalEditarAberto"
        :veiculo="veiculoSelecionado"
        @close="fecharModalEditar"
        @save="salvarVeiculo"
    />

    <div class="flex flex-col md:flex-row min-h-[calc(100vh-12rem)]">
      <!-- Container do painel de filtros e botão -->
      <div class="relative flex-shrink-0">
        <!-- Botão para alternar o painel de filtros -->
        <div
            @click="filtrosColapsados = !filtrosColapsados"
            class="absolute top-0 bg-white p-2 rounded-r-lg shadow cursor-pointer z-10 transition-all duration-300"
            :class="{'left-[18rem]': !filtrosColapsados, 'left-0': filtrosColapsados}"
        >
          <Icon
              :name="filtrosColapsados ? 'mdi:chevron-right' : 'mdi:chevron-left'"
              class="text-lg text-gray-500"
          />
        </div>

        <!-- Painel de filtros colapsável -->
        <div
            class="fixed md:relative inset-y-0 left-0 z-30 bg-white shadow-lg overflow-y-auto transition-all duration-300 ease-in-out"
            :class="{
            'w-72': !filtrosColapsados,
            'w-0': filtrosColapsados,
            'overflow-hidden': filtrosColapsados
          }"
        >
          <FiltroVeiculos
              :filtros="filtros"
              @aplicar="aplicarFiltros"
              @resetar="resetarFiltros"
          />
        </div>
      </div>

      <!-- Conteúdo principal -->
      <div class="flex-1 w-full transition-all duration-300">
        <!-- Status e controles de visualização -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <div class="text-gray-600 ml-16">Exibindo {{ veiculosFiltrados.length }} veículos</div>

          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <button
                  @click="modoVisualizacao = 'cards'"
                  class="p-2 rounded-l"
                  :class="modoVisualizacao === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
              >
                <Icon name="mdi:view-grid" class="text-sm" />
              </button>
              <button
                  @click="modoVisualizacao = 'tabela'"
                  class="p-2 rounded-r"
                  :class="modoVisualizacao === 'tabela' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
              >
                <Icon name="mdi:view-list" class="text-sm" />
              </button>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="bg-white rounded-lg shadow p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p class="text-gray-600">Carregando veículos...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="veiculosFiltrados.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum veículo encontrado</h3>
          <p class="mt-1 text-sm text-gray-500">Tente ajustar os filtros para encontrar veículos.</p>
        </div>

        <!-- Modo de visualização Cards -->
        <div v-else-if="modoVisualizacao === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div v-for="veiculo in veiculosFiltrados" :key="veiculo.id" class="bg-white rounded-lg shadow overflow-hidden relative">
            <VeiculoCard
                :veiculo="veiculo"
                @edit="abrirModalEditar"
                @refresh="atualizarVeiculoDaLista"
            />
          </div>
        </div>

        <!-- Modo de visualização Tabela -->
        <TabelaVeiculos
            v-else-if="modoVisualizacao === 'tabela'"
            :veiculos="veiculosFiltrados"
            :ordenacao="ordenacao"
            :refreshing-id="refreshingId"
            @ordenar="toggleOrdenacao"
            @editar="abrirModalEditar"
            @atualizar="atualizarVeiculo"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { scrapperService } from '~/services/scrapperService';

const { getScore, getPorcentagemMercado, calcularLucroEstimado } = useVeiculoScore();

const filtrosColapsados = ref(true);
const modalEditarAberto = ref(false);
const veiculoSelecionado = ref<Veiculo | null>(null);

const filtros = reactive({
  termoPesquisa: '',
  anoMin: null as number | null,
  anoMax: null as number | null,
  precoMin: null as number | null,
  precoMax: null as number | null,
  kmMin: null as number | null,
  kmMax: null as number | null,
  semSinistro: false,
  apenasAtivos: true
});

const ordenacao = reactive({
  campo: 'score' as 'descricao' | 'ano' | 'quilometragem' | 'porcentagemMercado' | 'lucroEstimado' | 'score',
  direcao: 'desc' as 'asc' | 'desc'
});

const veiculos = ref<Veiculo[]>([]);
const refreshingId = ref<string | null>(null);
const isLoading = ref(false);
const modoVisualizacao = ref<'cards' | 'tabela'>('tabela');

const veiculosFiltrados = computed(() => {
  let resultado = [...veiculos.value];

  if (filtros.termoPesquisa && filtros.termoPesquisa.trim() !== '') {
    const termo = filtros.termoPesquisa.toLowerCase().trim();
    resultado = resultado.filter(
        v => v.descricao.toLowerCase().includes(termo) || v.marca.toLowerCase().includes(termo)
    );
  }

  if (filtros.anoMin !== null) resultado = resultado.filter(v => parseInt(v.ano) >= filtros.anoMin!);
  if (filtros.anoMax !== null) resultado = resultado.filter(v => parseInt(v.ano) <= filtros.anoMax!);

  if (filtros.precoMin !== null) resultado = resultado.filter(v => (v.lanceAtual || v.lanceInicial) >= filtros.precoMin!);
  if (filtros.precoMax !== null) resultado = resultado.filter(v => (v.lanceAtual || v.lanceInicial) <= filtros.precoMax!);

  if (filtros.kmMin !== null) resultado = resultado.filter(v => v.quilometragem >= filtros.kmMin!);
  if (filtros.kmMax !== null) resultado = resultado.filter(v => v.quilometragem <= filtros.kmMax!);

  if (filtros.semSinistro) resultado = resultado.filter(v => !v.sinistro);
  if (filtros.apenasAtivos) resultado = resultado.filter(v => v.active);

  resultado.sort((a, b) => {
    let valorA: any;
    let valorB: any;

    switch (ordenacao.campo) {
      case 'descricao':
        return ordenacao.direcao === 'asc'
            ? a.descricao.localeCompare(b.descricao)
            : b.descricao.localeCompare(a.descricao);
      case 'ano': valorA = parseInt(a.ano); valorB = parseInt(b.ano); break;
      case 'quilometragem': valorA = a.quilometragem; valorB = b.quilometragem; break;
      case 'porcentagemMercado': valorA = getPorcentagemMercado(a); valorB = getPorcentagemMercado(b); break;
      case 'lucroEstimado': valorA = calcularLucroEstimado(a); valorB = calcularLucroEstimado(b); break;
      case 'score': valorA = getScore(a); valorB = getScore(b); break;
      default: valorA = 0; valorB = 0;
    }

    return ordenacao.direcao === 'asc' ? valorA - valorB : valorB - valorA;
  });

  return resultado;
});

async function carregarVeiculos() {
  isLoading.value = true;
  try {
    const response = await fetch('/api/veiculos?limit=10000');
    if (!response.ok) throw new Error('Erro ao carregar veículos');
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Erro ao carregar veículos');
    veiculos.value = data.data.map((veiculo: any) => ({
      ...veiculo,
      dataCaptura: new Date(veiculo.dataCaptura)
    }));
  } catch (error) {
    console.error('Erro ao carregar veículos:', error);
    veiculos.value = [];
  } finally {
    isLoading.value = false;
  }
}

function toggleOrdenacao(campo: 'descricao' | 'ano' | 'quilometragem' | 'porcentagemMercado' | 'lucroEstimado' | 'score') {
  if (ordenacao.campo === campo) {
    ordenacao.direcao = ordenacao.direcao === 'asc' ? 'desc' : 'asc';
  } else {
    ordenacao.campo = campo;
    ordenacao.direcao = 'desc';
  }
}

function aplicarFiltros() {}

function resetarFiltros() {
  filtros.termoPesquisa = '';
  filtros.anoMin = null;
  filtros.anoMax = null;
  filtros.precoMin = null;
  filtros.precoMax = null;
  filtros.kmMin = null;
  filtros.kmMax = null;
  filtros.semSinistro = false;
  filtros.apenasAtivos = true;
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
  const index = veiculos.value.findIndex(v => v.urlOrigem === veiculoAtualizado.urlOrigem);
  if (index !== -1) {
    veiculos.value[index] = { ...veiculos.value[index], ...veiculoAtualizado };
  }
}

async function atualizarVeiculo(veiculo: Veiculo) {
  if (!veiculo.urlOrigem || refreshingId.value === veiculo.id) return;

  try {
    refreshingId.value = veiculo.id;
    const dataLeilao = veiculo.dataLeilao ? new Date(veiculo.dataLeilao).toISOString() : undefined;
    const result = await scrapperService.executarScrapper(veiculo.urlOrigem, dataLeilao);
    if (!result.veiculo) { alert('Lote cancelado/descartado.'); return; }
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
    if (!response.ok) throw new Error('Erro ao atualizar veículo');
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Erro ao atualizar veículo');

    const index = veiculos.value.findIndex(v => v.id === veiculoEditado.id);
    if (index !== -1) veiculos.value[index] = veiculoEditado;
    alert('Veículo atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar veículo:', error);
    alert(`Erro ao salvar veículo: ${error}`);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => { carregarVeiculos(); });
</script>
