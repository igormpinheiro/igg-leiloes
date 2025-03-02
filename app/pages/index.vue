<!-- pages/index.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Leilão de Carros</h1>
      <p class="text-gray-600">Encontre as melhores oportunidades em leilões de veículos</p>
    </header>

    <div class="flex flex-col md:flex-row relative">
      <!-- Botão para alternar o painel de filtros -->
      <div
          @click="filtrosColapsados = !filtrosColapsados"
          class="absolute left-0 top-0 bg-white p-2 rounded-r-lg shadow cursor-pointer z-10"
          :class="{'left-72': !filtrosColapsados, 'left-0': filtrosColapsados}"
      >
        <Icon
            :name="filtrosColapsados ? 'mdi:chevron-right' : 'mdi:chevron-left'"
            class="text-lg text-gray-500"
        />
      </div>

      <!-- Painel de filtros colapsável -->
      <div
          class="fixed md:relative inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out bg-white shadow-lg overflow-y-auto"
          :class="{'translate-x-0': !filtrosColapsados, '-translate-x-full': filtrosColapsados}"
          style="width: 18rem; max-width: 100%;"
      >
        <div class="p-4">
          <h2 class="text-xl font-semibold mb-4">Filtros</h2>

          <!-- Filtro de descrição -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Descrição ou Marca</label>
            <input
                v-model="filtros.termoPesquisa"
                type="text"
                placeholder="Pesquisar..."
                class="w-full p-2 border rounded focus:ring focus:ring-blue-200"
            />
          </div>

          <!-- Filtro de ano -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <div class="flex gap-2">
              <input
                  v-model.number="filtros.anoMin"
                  type="number"
                  placeholder="Min"
                  class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
              />
              <input
                  v-model.number="filtros.anoMax"
                  type="number"
                  placeholder="Max"
                  class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
              />
            </div>
          </div>

          <!-- Filtro de preço -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Lance Atual (R$)</label>
            <div class="flex gap-2">
              <input
                  v-model.number="filtros.precoMin"
                  type="number"
                  placeholder="Min"
                  class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
              />
              <input
                  v-model.number="filtros.precoMax"
                  type="number"
                  placeholder="Max"
                  class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
              />
            </div>
          </div>

          <!-- Filtro de quilometragem -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Quilometragem</label>
            <div class="flex gap-2">
              <input
                  v-model.number="filtros.kmMin"
                  type="number"
                  placeholder="Min"
                  class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
              />
              <input
                  v-model.number="filtros.kmMax"
                  type="number"
                  placeholder="Max"
                  class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
              />
            </div>
          </div>

          <!-- Filtro de sinistro -->
          <div class="mb-4">
            <label class="flex items-center text-sm font-medium text-gray-700">
              <input v-model="filtros.semSinistro" type="checkbox" class="mr-2 rounded" />
              Sem sinistro
            </label>
          </div>

          <!-- Botão de aplicar filtros -->
          <button
              @click="aplicarFiltros"
              class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Aplicar Filtros
          </button>

          <!-- Botão de resetar filtros -->
          <button
              @click="resetarFiltros"
              class="w-full mt-2 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      <!-- Conteúdo principal -->
      <div
          class="w-full transition-all duration-300"
          :class="{'md:ml-4': !filtrosColapsados}"
      >
        <!-- Status e controles de visualização -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <p class="text-gray-600">Exibindo {{ veiculosFiltrados.length }} veículos</p>

          <div class="flex items-center space-x-4">
            <!-- Toggle de visualização -->
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
          <p class="mt-1 text-sm text-gray-500">
            Tente ajustar os filtros para encontrar veículos.
          </p>
        </div>

        <!-- Modo de visualização Cards -->
        <div v-else-if="modoVisualizacao === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div v-for="veiculo in veiculosFiltrados" :key="veiculo.id" class="bg-white rounded-lg shadow overflow-hidden relative">
            <VeiculoCard :veiculo="veiculo" />
          </div>
        </div>

        <!-- Modo de visualização Tabela -->
        <div v-else-if="modoVisualizacao === 'tabela'" class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Veículo
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="toggleOrdenacao('ano')">
                <div class="flex items-center">
                  Ano
                  <Icon
                      v-if="ordenacao.campo === 'ano'"
                      :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                      class="text-sm ml-1"
                  />
                </div>
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="toggleOrdenacao('quilometragem')">
                <div class="flex items-center">
                  Quilometragem
                  <Icon
                      v-if="ordenacao.campo === 'quilometragem'"
                      :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                      class="text-sm ml-1"
                  />
                </div>
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Mercado
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="toggleOrdenacao('porcentagemMercado')">
                <div class="flex items-center">
                  %
                  <Icon
                      v-if="ordenacao.campo === 'porcentagemMercado'"
                      :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                      class="text-sm ml-1"
                  />
                </div>
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="toggleOrdenacao('score')">
                <div class="flex items-center">
                  Score
                  <Icon
                      v-if="ordenacao.campo === 'score'"
                      :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                      class="text-sm ml-1"
                  />
                </div>
              </th>

            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="veiculo in veiculosFiltrados" :key="veiculo.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span v-if="veiculo.sinistro" class="mr-1 text-red-500" title="Veículo com sinistro">🚨</span>
                  <div>
                    <a
                        :href="veiculo.urlOrigem"
                        target="_blank"
                        class="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {{ veiculo.marca }} {{ veiculo.descricao }}
                    </a>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ veiculo.ano }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ veiculo.quilometragem.toLocaleString('pt-BR') }} km</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {{ formatarValor(veiculo.lanceAtual) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {{ formatarValor(veiculo.valorMercado) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                  <span
                      class="px-2 py-1 text-xs font-medium rounded"
                      :class="getPercentageClass(getPorcentagemMercado(veiculo))"
                  >
                    {{ getPorcentagemMercado(veiculo) }}%
                  </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                  <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="getScoreClass(getScore(veiculo))"
                  >
                    {{ getScoreIcon(getScore(veiculo)) }} {{ getScore(veiculo).toFixed(1) }}
                  </span>
              </td>

            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';

// Estado dos filtros
const filtrosColapsados = ref(true);

const filtros = reactive({
  termoPesquisa: '',
  anoMin: null as number | null,
  anoMax: null as number | null,
  precoMin: null as number | null,
  precoMax: null as number | null,
  kmMin: null as number | null,
  kmMax: null as number | null,
  semSinistro: false
});

// Estado da ordenação
const ordenacao = reactive({
  campo: 'score' as 'ano' | 'quilometragem' | 'porcentagemMercado' | 'score',
  direcao: 'desc' as 'asc' | 'desc'
});

// Estado da tabela
const veiculos = ref<Veiculo[]>([]);
const isLoading = ref(false);
const modoVisualizacao = ref<'cards' | 'tabela'>('tabela');

// Aplicar todos os filtros aos veículos
const veiculosFiltrados = computed(() => {
  let resultado = [...veiculos.value];

  // Aplicar filtro de termo de pesquisa (descrição ou marca)
  if (filtros.termoPesquisa && filtros.termoPesquisa.trim() !== '') {
    const termo = filtros.termoPesquisa.toLowerCase().trim();
    resultado = resultado.filter(
        v => v.descricao.toLowerCase().includes(termo) || v.marca.toLowerCase().includes(termo)
    );
  }

  // Aplicar filtro de ano
  if (filtros.anoMin !== null) {
    resultado = resultado.filter(v => parseInt(v.ano) >= filtros.anoMin!);
  }
  if (filtros.anoMax !== null) {
    resultado = resultado.filter(v => parseInt(v.ano) <= filtros.anoMax!);
  }

  // Aplicar filtro de preço
  if (filtros.precoMin !== null) {
    resultado = resultado.filter(v => v.lanceAtual >= filtros.precoMin!);
  }
  if (filtros.precoMax !== null) {
    resultado = resultado.filter(v => v.lanceAtual <= filtros.precoMax!);
  }

  // Aplicar filtro de quilometragem
  if (filtros.kmMin !== null) {
    resultado = resultado.filter(v => v.quilometragem >= filtros.kmMin!);
  }
  if (filtros.kmMax !== null) {
    resultado = resultado.filter(v => v.quilometragem <= filtros.kmMax!);
  }

  // Aplicar filtro de sinistro
  if (filtros.semSinistro) {
    resultado = resultado.filter(v => !v.sinistro);
  }

  // Aplicar ordenação
  resultado.sort((a, b) => {
    let valorA: number;
    let valorB: number;

    // Determinar os valores a serem comparados com base no campo de ordenação
    switch (ordenacao.campo) {
      case 'ano':
        valorA = parseInt(a.ano);
        valorB = parseInt(b.ano);
        break;
      case 'quilometragem':
        valorA = a.quilometragem;
        valorB = b.quilometragem;
        break;
      case 'porcentagemMercado':
        valorA = getPorcentagemMercado(a);
        valorB = getPorcentagemMercado(b);
        break;
      case 'score':
        valorA = getScore(a);
        valorB = getScore(b);
        break;
    }

    // Aplicar a direção da ordenação
    return ordenacao.direcao === 'asc'
        ? valorA - valorB
        : valorB - valorA;
  });

  return resultado;
});

// Carregar veículos do backend
async function carregarVeiculos() {
  isLoading.value = true;

  try {
    const response = await fetch('/api/veiculos');

    if (!response.ok) {
      throw new Error('Erro ao carregar veículos');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Erro ao carregar veículos');
    }

    // Processar dados
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

// Alternar a ordenação quando clica em uma coluna
function toggleOrdenacao(campo: 'ano' | 'quilometragem' | 'porcentagemMercado' | 'score') {
  if (ordenacao.campo === campo) {
    // Se já está ordenando por este campo, inverte a direção
    ordenacao.direcao = ordenacao.direcao === 'asc' ? 'desc' : 'asc';
  } else {
    // Se está mudando o campo, define a direção padrão
    ordenacao.campo = campo;
    ordenacao.direcao = 'desc'; // Começar com decrescente (melhor para score e anos)
  }
}

// Aplicar filtros
function aplicarFiltros() {
  // Como os filtros são reativos, não precisamos fazer nada aqui
  // O computed veiculosFiltrados já aplica automaticamente
}

// Resetar filtros
function resetarFiltros() {
  filtros.termoPesquisa = '';
  filtros.anoMin = null;
  filtros.anoMax = null;
  filtros.precoMin = null;
  filtros.precoMax = null;
  filtros.kmMin = null;
  filtros.kmMax = null;
  filtros.semSinistro = false;
}

// Formatação de valores
function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR');
}

// Calcula a porcentagem do lance atual em relação ao valor de mercado
function getPorcentagemMercado(veiculo: Veiculo): number {
  if (!veiculo.valorMercado) return 0;
  return Math.round((veiculo.lanceAtual / veiculo.valorMercado) * 100);
}

// Classes CSS dinâmicas baseadas no score
function getScoreClass(score: number): string {
  if (score >= 8.5) return 'bg-green-100 text-green-800';
  if (score >= 7.0) return 'bg-blue-100 text-blue-800';
  if (score >= 5.0) return 'bg-yellow-100 text-yellow-800';
  if (score >= 3.0) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

// Ícones baseados no score
function getScoreIcon(score: number): string {
  if (score >= 8.5) return '🏆'; // Excelente
  if (score >= 7.0) return '🥈'; // Muito Bom
  if (score >= 5.0) return '🥉'; // Bom
  if (score >= 3.0) return '⚠️'; // Regular
  return '❌'; // Ruim
}

// Classes CSS dinâmicas baseadas na porcentagem do lance
function getPercentageClass(percentage: number): string {
  if (percentage <= 70) return 'bg-green-100 text-green-800';
  if (percentage <= 85) return 'bg-blue-100 text-blue-800';
  if (percentage <= 95) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

// Calcular o score do veículo
function getScore(veiculo: Veiculo): number {
  return VeiculoRanker.calcularScore(veiculo);
}

// Carregar veículos ao montar o componente
onMounted(() => {
  carregarVeiculos();
});
</script>