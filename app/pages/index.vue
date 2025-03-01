<!-- pages/index.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Leilão de Carros</h1>
      <p class="text-gray-600">Encontre as melhores oportunidades em leilões de veículos</p>
    </header>

    <div class="flex flex-col md:flex-row gap-6">
      <!-- Coluna de filtros -->
      <div class="w-full md:w-1/4 bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Filtros</h2>

        <!-- Filtro de marca -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Marca</label>
          <select v-model="filtros.marca" class="w-full p-2 border rounded focus:ring focus:ring-blue-200">
            <option value="">Todas as marcas</option>
            <option v-for="marca in marcasDisponiveis" :key="marca" :value="marca">{{ marca }}</option>
          </select>
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
            @click="carregarVeiculos(1)"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Aplicar Filtros
        </button>
      </div>

      <!-- Coluna da tabela de veículos -->
      <div class="w-full md:w-3/4">
        <!-- Status e ordenação -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <p class="text-gray-600">Exibindo {{ veiculos.length }} veículos</p>

          <div class="flex items-center">
            <label class="text-sm mr-2">Ordenar por:</label>
            <select
                v-model="filtros.ordenacao"
                @change="carregarVeiculos(1)"
                class="p-2 border rounded focus:ring focus:ring-blue-200"
            >
              <option value="lanceAtual_asc">Menor preço</option>
              <option value="lanceAtual_desc">Maior preço</option>
              <option value="dataCaptura_desc">Mais recentes</option>
              <option value="valorMercado_desc">Maior valor de mercado</option>
            </select>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="bg-white rounded-lg shadow p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p class="text-gray-600">Carregando veículos...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="veiculos.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum veículo encontrado</h3>
          <p class="mt-1 text-sm text-gray-500">
            Tente ajustar os filtros para encontrar veículos.
          </p>
        </div>

        <!-- Veiculos grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div v-for="veiculo in veiculos" :key="veiculo.id" class="bg-white rounded-lg shadow overflow-hidden">
            <VeiculoCard :veiculo="veiculo" />
          </div>
        </div>

        <!-- Paginação -->
        <div v-if="pagination.pages > 1" class="mt-6 flex justify-center">
          <div class="flex rounded-md">
            <button
                @click="paginaAnterior"
                :disabled="pagination.page === 1"
                :class="[
                'px-3 py-1 rounded-l-md border',
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              ]"
            >
              Anterior
            </button>

            <template v-for="pagina in paginasVisiveis" :key="pagina">
              <button
                  v-if="pagina !== '...'"
                  @click="carregarVeiculos(Number(pagina))"
                  :class="[
                  'px-3 py-1 border-t border-b',
                  Number(pagina) === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                ]"
              >
                {{ pagina }}
              </button>
              <span
                  v-else
                  class="px-3 py-1 border-t border-b bg-white text-gray-500"
              >
                ...
              </span>
            </template>

            <button
                @click="proximaPagina"
                :disabled="pagination.page === pagination.pages"
                :class="[
                'px-3 py-1 rounded-r-md border',
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              ]"
            >
              Próxima
            </button>
          </div>
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
const filtros = reactive({
  marca: '',
  anoMin: null as number | null,
  anoMax: null as number | null,
  precoMin: null as number | null,
  precoMax: null as number | null,
  kmMin: null as number | null,
  kmMax: null as number | null,
  semSinistro: false,
  ordenacao: 'lanceAtual_asc'
});

// Estado da tabela
const veiculos = ref<Veiculo[]>([]);
const marcasDisponiveis = ref<string[]>([]);
const isLoading = ref(false);
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0
});

// Carregar veículos do banco de dados
async function carregarVeiculos(pagina: number = 1) {
  isLoading.value = true;

  try {
    // Construir query params
    const params = new URLSearchParams();
    params.append('page', pagina.toString());
    params.append('limit', pagination.limit.toString());

    if (filtros.marca) params.append('marca', filtros.marca);
    if (filtros.anoMin) params.append('anoMin', filtros.anoMin.toString());
    if (filtros.anoMax) params.append('anoMax', filtros.anoMax.toString());
    if (filtros.precoMin) params.append('precoMin', filtros.precoMin.toString());
    if (filtros.precoMax) params.append('precoMax', filtros.precoMax.toString());
    if (filtros.kmMin) params.append('kmMin', filtros.kmMin.toString());
    if (filtros.kmMax) params.append('kmMax', filtros.kmMax.toString());
    if (filtros.semSinistro) params.append('semSinistro', 'true');
    params.append('ordenacao', filtros.ordenacao);

    // Fazer requisição
    const response = await fetch(`/api/veiculos?${params.toString()}`);

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

    // Atualizar marcas disponíveis
    if (data.marcas) {
      marcasDisponiveis.value = data.marcas;
    }

    // Atualizar paginação
    pagination.page = data.pagination.page;
    pagination.total = data.pagination.total;
    pagination.pages = data.pagination.pages;

  } catch (error) {
    console.error('Erro ao carregar veículos:', error);
    veiculos.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Navegação de paginação
function paginaAnterior() {
  if (pagination.page > 1) {
    carregarVeiculos(pagination.page - 1);
  }
}

function proximaPagina() {
  if (pagination.page < pagination.pages) {
    carregarVeiculos(pagination.page + 1);
  }
}

// Gerar array de números de página visíveis
const paginasVisiveis = computed(() => {
  if (pagination.pages <= 7) {
    return Array.from({ length: pagination.pages }, (_, i) => String(i + 1));
  }

  // Sempre mostrar primeira, última e algumas páginas ao redor da atual
  const paginas: string[] = [];

  paginas.push('1');

  if (pagination.page > 3) {
    paginas.push('...');
  }

  // Páginas ao redor da atual
  const inicio = Math.max(2, pagination.page - 1);
  const fim = Math.min(pagination.pages - 1, pagination.page + 1);

  for (let i = inicio; i <= fim; i++) {
    paginas.push(String(i));
  }

  if (pagination.page < pagination.pages - 2) {
    paginas.push('...');
  }

  paginas.push(String(pagination.pages));

  return paginas;
});

// Carregar veículos ao montar o componente
onMounted(() => {
  carregarVeiculos();
});

// Observar mudanças em ordenação e recarregar
watch(() => filtros.ordenacao, (newValue) => {
  carregarVeiculos(1);
});
</script>