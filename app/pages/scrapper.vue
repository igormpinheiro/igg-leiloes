<!-- pages/scrapper.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Scrapper de Leilões</h1>

    <div class="bg-white p-6 rounded-lg shadow mb-8">
      <h2 class="text-xl font-semibold mb-4">Adicionar Nova URL</h2>

      <!-- Campo de Data do Leilão (compartilhado entre todos os modos) -->
      <!-- Mostrar apenas se NÃO for URL do Leilo em modo listagem -->
      <div v-if="!isLeiloListagem" class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Data do Leilão *</label>
        <input
            v-model="dataLeilao"
            type="date"
            class="p-3 border rounded-md focus:ring focus:ring-blue-200 focus:outline-none w-64"
            required
        />
        <p class="text-sm text-gray-500 mt-1">
          Informe a data do leilão para todos os veículos extraídos
        </p>
      </div>

      <!-- Aviso quando for Leilo em modo listagem -->
      <div v-else class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p class="text-sm text-blue-700">
          ℹ️ A data do leilão será extraída automaticamente da listagem
        </p>
      </div>

      <div class="mb-4">
        <div class="flex space-x-4 mb-4">
          <button
              @click="modoExtracao = 'individual'"
              class="px-4 py-2 rounded"
              :class="modoExtracao === 'individual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
          >
            URL Individual
          </button>
          <button
              @click="modoExtracao = 'listagem'"
              class="px-4 py-2 rounded"
              :class="modoExtracao === 'listagem' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
          >
            URL de Listagem
          </button>
          <button
              @click="modoExtracao = 'sequencial'"
              class="px-4 py-2 rounded"
              :class="modoExtracao === 'sequencial' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
          >
            Extração Sequencial
          </button>
        </div>

        <div v-if="modoExtracao === 'individual'">
          <form @submit.prevent="iniciarScrapper">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">URL do Leilão</label>
              <div class="flex">
                <input
                    v-model="url"
                    type="url"
                    placeholder="https://www.parquedosleiloes.com.br/leilao/1326/lote/71077"
                    class="flex-1 p-3 border rounded-l-md focus:ring focus:ring-blue-200 focus:outline-none"
                    required
                />
                <button
                    type="submit"
                    class="bg-blue-600 text-white px-6 py-3 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
                    :disabled="isLoading"
                >
                  <span v-if="!isLoading">Extrair Dados</span>
                  <span v-else class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                         fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </span>
                </button>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                Cole o link de um anúncio de veículo em leilão para extrair as informações
              </p>
            </div>
          </form>
        </div>

        <div v-if="modoExtracao === 'listagem'">
          <!-- Opção de extração completa (apenas para Leilo) -->
          <div v-if="urlListagem.includes('leilo.com.br')" class="mb-4 p-4 bg-gray-50 rounded border">
            <label class="block text-sm font-medium text-gray-700 mb-2">Modo de Extração</label>
            <div class="space-y-2">
              <label class="flex items-center cursor-pointer">
                <input type="radio" v-model="fullExtraction" :value="false" class="mr-2" />
                <div>
                  <span class="text-sm font-medium">Rápido</span>
                  <span class="text-sm text-gray-500 ml-2">~60% dos lotes (2 segundos)</span>
                </div>
              </label>
              <label class="flex items-center cursor-pointer">
                <input type="radio" v-model="fullExtraction" :value="true" class="mr-2" checked />
                <div>
                  <span class="text-sm font-semibold text-blue-700">Completo ⭐ Recomendado</span>
                  <span class="text-sm text-gray-500 ml-2">100% dos lotes (~20 segundos)</span>
                </div>
              </label>
            </div>
          </div>

          <form @submit.prevent="extrairListagem">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">URL da Listagem</label>
              <div class="flex">
                <input
                    v-model="urlListagem"
                    type="url"
                    placeholder="https://www.parquedosleiloes.com.br/leilao/1326/detalhes"
                    class="flex-1 p-3 border rounded-l-md focus:ring focus:ring-blue-200 focus:outline-none"
                    required
                />
                <button
                    type="submit"
                    class="bg-blue-600 text-white px-6 py-3 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
                    :disabled="isLoading"
                >
                  <span v-if="!isLoading">Extrair Listagem</span>
                  <span v-else class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                         fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </span>
                </button>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                Cole o link de uma página que lista vários lotes para extrair todos eles
              </p>
            </div>
          </form>

          <!-- Resultados da Listagem -->
          <div v-if="urlsListagem.length > 0" class="mt-4 bg-gray-50 p-4 rounded">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium">URLs encontradas: {{ urlsListagem.length }}</h3>
              <div>
                <button
                    @click="processarUrlsEmLote"
                    class="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
                    :disabled="isLoading || urlsListagem.length === 0"
                >
                  Processar Todas ({{ urlsListagem.length }})
                </button>
              </div>
            </div>

            <div class="max-h-60 overflow-y-auto bg-white border rounded p-2">
              <ul class="divide-y">
                <li v-for="(u, index) in urlsListagem" :key="index"
                    class="py-2 flex justify-between items-center">
                  <span class="text-sm truncate" style="max-width: 400px;">{{ u }}</span>
                  <button
                      @click="processarUrlUnica(u)"
                      class="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Processar
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="modoExtracao === 'sequencial'">
          <form @submit.prevent="iniciarExtracaoSequencial">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">URL Inicial</label>
              <div class="flex">
                <input
                    v-model="urlSequencial"
                    type="url"
                    placeholder="https://www.parquedosleiloes.com.br/leilao/1326/lote/71077"
                    class="flex-1 p-3 border rounded-l-md focus:ring focus:ring-blue-200 focus:outline-none"
                    required
                />
                <button
                    type="submit"
                    class="bg-blue-600 text-white px-6 py-3 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
                    :disabled="isLoading"
                >
                  <span v-if="!isLoading">Extrair Sequência</span>
                  <span v-else class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                         fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </span>
                </button>
              </div>
              <div class="flex items-center mt-2">
                <label class="block text-sm font-medium text-gray-700 mr-2">Limite de veículos:</label>
                <select v-model="limiteVeiculos" class="p-2 border rounded">
                  <option :value="5">5 veículos</option>
                  <option :value="10">10 veículos</option>
                  <option :value="20">20 veículos</option>
                  <option :value="30">30 veículos</option>
                  <option :value="500">Todos</option>
                </select>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                Cole o link de um veículo para iniciar a extração sequencial. O sistema navegará automaticamente pelos
                botões "Próximo".
              </p>
            </div>
          </form>
        </div>
      </div>

      <div v-if="statusMessage"
           :class="`mt-4 p-3 rounded text-sm ${statusMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`">
        {{ statusMessage.text }}
      </div>
    </div>

    <!-- Progresso da Extração Sequencial -->
    <div v-if="sequentialResults.length > 0 || isLoading && modoExtracao === 'sequencial'" class="bg-white rounded-lg shadow mb-8">
      <div class="border-b p-4">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-semibold">Extração Sequencial</h2>
            <p class="text-sm text-gray-500">
              {{ sequentialStats.total }} lote(s) processado(s) —
              {{ sequentialStats.created }} novo(s),
              {{ sequentialStats.updated }} atualizado(s),
              {{ sequentialStats.deleted }} descartado(s),
              {{ sequentialStats.errors }} erro(s)
            </p>
          </div>
          <button
              v-if="isLoading"
              @click="cancelarExtracao"
              class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none"
          >
            Cancelar
          </button>
        </div>

        <!-- Barra de progresso -->
        <div v-if="isLoading" class="mt-3">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ sequentialResults.length }} / {{ limiteVeiculos }} ({{ progressPercent }}%)
          </p>
        </div>
      </div>

      <div class="p-4 max-h-96 overflow-y-auto">
        <ul class="divide-y">
          <li v-for="(item, index) in sequentialResults" :key="index"
              class="py-2 flex items-center justify-between">
            <div class="flex items-center space-x-3 min-w-0">
              <!-- Status icon -->
              <span v-if="item.status === 'loading'" class="flex-shrink-0">
                <svg class="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <span v-else-if="item.status === 'success'" class="flex-shrink-0 text-green-600 font-bold">OK</span>
              <span v-else-if="item.status === 'deleted'" class="flex-shrink-0 text-yellow-600 font-bold">--</span>
              <span v-else class="flex-shrink-0 text-red-600 font-bold">ERR</span>

              <div class="min-w-0">
                <p class="text-sm font-medium truncate">
                  {{ item.descricao || item.url }}
                </p>
                <p v-if="item.error" class="text-xs text-red-500">{{ item.error }}</p>
              </div>
            </div>

            <!-- Badge de ação -->
            <span
                v-if="item.action"
                class="flex-shrink-0 ml-2 px-2 py-1 text-xs font-medium rounded"
                :class="getActionBadgeClass(item.action)"
            >
              {{ getActionLabel(item.action) }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Resultado Individual do Scrapper -->
    <div v-if="resultadoScrapper" class="bg-white rounded-lg shadow mb-8">
      <div class="border-b p-4">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-semibold">Resultado da Extração</h2>
            <p class="text-sm text-gray-500">URL: {{ resultadoScrapper.urlOrigem }}</p>
          </div>
          <!-- Badge de ação -->
          <span
              v-if="resultadoAction"
              class="px-3 py-1 text-sm font-medium rounded"
              :class="getActionBadgeClass(resultadoAction)"
          >
            {{ getActionLabel(resultadoAction) }}
          </span>
        </div>
      </div>

      <div class="p-4">
        <VeiculoCard :veiculo="resultadoScrapper"/>

        <div class="mt-6 flex justify-end">
          <button
              @click="limparResultado"
              class="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring focus:ring-gray-200"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>

    <!-- Resultados em Lote do Scrapper -->
    <div v-if="batchResults.length > 0" class="bg-white rounded-lg shadow mb-8">
      <div class="border-b p-4">
        <h2 class="text-xl font-semibold">Resultados do Processamento em Lote</h2>
        <p class="text-sm text-gray-500">{{ batchResults.length }} veículos extraídos</p>
      </div>

      <div class="p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Veículo
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preço
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in batchResults" :key="index" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ item.veiculo.descricao }}</div>
                <div class="text-sm text-gray-500">{{ item.veiculo.marca }} | {{ item.veiculo.ano }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">R$ {{ formatarValor(item.veiculo.lanceAtual) }}</div>
                <div class="text-sm text-gray-500">
                  {{ Math.round((item.veiculo.lanceAtual / item.veiculo.valorMercado) * 100) }}% do valor de mercado
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                        :class="getScoreClass(getVeiculoScore(item.veiculo))">
                    {{ getScoreIcon(getVeiculoScore(item.veiculo)) }} {{ getVeiculoScore(item.veiculo).toFixed(1) }}
                  </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                    class="px-2 py-1 text-xs font-medium rounded"
                    :class="getActionBadgeClass(item.action)"
                >
                  {{ getActionLabel(item.action) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="visualizarVeiculo(item.veiculo, item.action)" class="text-blue-600 hover:text-blue-900">
                  Visualizar
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Histórico de URLs Processadas -->
    <div v-if="historico.length > 0" class="mt-8 bg-white rounded-lg shadow">
      <div class="border-b p-4">
        <h2 class="text-xl font-semibold">Histórico de Extrações</h2>
      </div>
      <div class="p-4">
        <ul class="divide-y">
          <li v-for="(item, index) in historico" :key="index" class="py-3">
            <div class="flex justify-between">
              <div>
                <p class="font-medium truncate" style="max-width: 400px;">{{ item.url }}</p>
                <p class="text-sm text-gray-500">{{ item.data }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <span
                    class="px-2 py-1 text-xs font-medium rounded"
                    :class="getActionBadgeClass(item.action)"
                >
                  {{ getActionLabel(item.action) }}
                </span>
                <button
                    v-if="item.resultado"
                    @click="carregarHistorico(index)"
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Visualizar
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue';
import type {Veiculo} from '~/types/veiculo';
import {scrapperService} from '~/services/scrapperService';
import type {ExtractResult} from '~/services/scrapperService';
import {VeiculoRanker} from '~/services/veiculoRankerService';

// Estados
const url = ref('');
const urlListagem = ref('');
const urlSequencial = ref('');
const dataLeilao = ref('');
const limiteVeiculos = ref(500);
const modoExtracao = ref('individual');
const isLoading = ref(false);
const cancelRequested = ref(false);
const fullExtraction = ref(true); // Padrão: extração completa
const dataLeilaoExtraida = ref<string | null>(null); // Data extraída da API
const statusMessage = ref<{ text: string, type: 'success' | 'error' } | null>(null);
const resultadoScrapper = ref<Veiculo | null>(null);
const resultadoAction = ref<string | null>(null);
const historico = ref<{ url: string, data: string, resultado: Veiculo | null, action: string }[]>([]);
const urlsListagem = ref<string[]>([]);
const batchResults = ref<{ veiculo: Veiculo, action: string }[]>([]);

// Estado da extração sequencial
interface SequentialItem {
  url: string;
  status: 'loading' | 'success' | 'deleted' | 'error';
  descricao?: string;
  action?: string;
  error?: string;
}
const sequentialResults = ref<SequentialItem[]>([]);

const sequentialStats = computed(() => {
  const items = sequentialResults.value;
  return {
    total: items.filter(i => i.status !== 'loading').length,
    created: items.filter(i => i.action === 'created').length,
    updated: items.filter(i => i.action === 'updated').length,
    deleted: items.filter(i => i.status === 'deleted').length,
    errors: items.filter(i => i.status === 'error').length
  };
});

const progressPercent = computed(() => {
  if (limiteVeiculos.value === 0) return 0;
  return Math.min(100, Math.round((sequentialResults.value.length / limiteVeiculos.value) * 100));
});

// Computed: verifica se é Leilo em modo listagem (para extração automática de data)
const isLeiloListagem = computed(() => {
  return modoExtracao.value === 'listagem' && urlListagem.value.includes('leilo.com.br');
});

// Validar data do leilão
function validarDataLeilao(): boolean {
  // Para Leilo em modo listagem, a data será extraída automaticamente
  if (isLeiloListagem.value) {
    return true;
  }

  if (!dataLeilao.value) {
    statusMessage.value = {
      text: 'Informe a data do leilão antes de extrair.',
      type: 'error'
    };
    return false;
  }
  return true;
}

// Função para iniciar o scrapper para uma URL individual
async function iniciarScrapper() {
  if (!url.value || !validarDataLeilao()) return;

  isLoading.value = true;
  statusMessage.value = null;
  resultadoScrapper.value = null;
  resultadoAction.value = null;

  try {
    const result = await scrapperService.executarScrapper(url.value, dataLeilao.value);

    if (result.veiculo) {
      resultadoScrapper.value = result.veiculo;
      resultadoAction.value = result.action;
    }

    // Adicionar ao histórico
    historico.value.unshift({
      url: url.value,
      data: new Date().toLocaleString('pt-BR'),
      resultado: result.veiculo,
      action: result.action
    });

    statusMessage.value = {
      text: result.veiculo
          ? `Dados extraídos e salvos com sucesso! (${getActionLabel(result.action)})`
          : 'Lote cancelado/descartado.',
      type: result.veiculo ? 'success' : 'error'
    };
  } catch (error: any) {
    statusMessage.value = {
      text: error.message || 'Erro ao extrair dados da URL',
      type: 'error'
    };
  } finally {
    isLoading.value = false;
  }
}

// Extrair URLs de uma listagem
async function extrairListagem() {
  if (!urlListagem.value || !validarDataLeilao()) return;

  isLoading.value = true;
  urlsListagem.value = [];
  statusMessage.value = {
    text: fullExtraction.value && isLeiloListagem.value
        ? 'Extraindo listagem completa (pode levar ~20s)...'
        : 'Extraindo listagem...',
    type: 'success'
  };

  try {
    const result = await scrapperService.extrairListagem(
        urlListagem.value,
        fullExtraction.value
    );

    // Salvar data extraída se for Leilo
    if (isLeiloListagem.value && result.dataLeilao) {
      dataLeilaoExtraida.value = result.dataLeilao;
      // Converter ISO para formato date input (YYYY-MM-DD)
      dataLeilao.value = result.dataLeilao.split('T')[0];
    }

    urlsListagem.value = result.loteUrls;

    let message = `✓ ${result.total} lotes encontrados`;
    if (result.method) {
      message += ` (${result.method})`;
    }
    if (result.dataLeilao) {
      const dataFormatada = new Date(result.dataLeilao).toLocaleString('pt-BR');
      message += `\n📅 Data do leilão: ${dataFormatada}`;
    }
    if (result.warning) {
      message += `\n⚠️ ${result.warning}`;
    }

    statusMessage.value = {
      text: message,
      type: 'success'
    };
  } catch (error: any) {
    statusMessage.value = {
      text: `Erro: ${error.message}`,
      type: 'error'
    };
    urlsListagem.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Iniciar extração sequencial (client-side loop usando nextUrl)
async function iniciarExtracaoSequencial() {
  if (!urlSequencial.value || !validarDataLeilao()) return;

  isLoading.value = true;
  cancelRequested.value = false;
  statusMessage.value = null;
  sequentialResults.value = [];

  let currentUrl: string | null = urlSequencial.value;
  let count = 0;

  try {
    while (currentUrl && count < limiteVeiculos.value && !cancelRequested.value) {
      // Adicionar item como loading
      const item: SequentialItem = {
        url: currentUrl,
        status: 'loading'
      };
      sequentialResults.value.push(item);

      try {
        const result = await scrapperService.executarScrapper(currentUrl, dataLeilao.value);

        if (result.veiculo) {
          item.status = 'success';
          item.descricao = result.veiculo.descricao;
          item.action = result.action;
        } else {
          item.status = 'deleted';
          item.descricao = 'Lote cancelado/descartado';
          item.action = 'deleted';
        }

        currentUrl = result.nextUrl;
      } catch (error: any) {
        item.status = 'error';
        item.error = error.message || 'Erro desconhecido';
        currentUrl = null;
      }

      count++;

      // Pausa entre requisições
      if (currentUrl && !cancelRequested.value) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const stats = sequentialStats.value;
    statusMessage.value = {
      text: cancelRequested.value
          ? `Extração cancelada. ${stats.total} lote(s) processado(s): ${stats.created} novo(s), ${stats.updated} atualizado(s), ${stats.deleted} descartado(s), ${stats.errors} erro(s).`
          : `Extração concluída. ${stats.total} lote(s) processado(s): ${stats.created} novo(s), ${stats.updated} atualizado(s), ${stats.deleted} descartado(s), ${stats.errors} erro(s).`,
      type: 'success'
    };

  } catch (error: any) {
    statusMessage.value = {
      text: error.message || 'Erro ao realizar extração sequencial',
      type: 'error'
    };
  } finally {
    isLoading.value = false;
    cancelRequested.value = false;
  }
}

function cancelarExtracao() {
  cancelRequested.value = true;
}

// Processar uma URL específica da listagem
async function processarUrlUnica(urlParaProcessar: string) {
  if (!validarDataLeilao()) return;

  isLoading.value = true;
  statusMessage.value = null;

  try {
    const result = await scrapperService.executarScrapper(urlParaProcessar, dataLeilao.value);

    if (result.veiculo) {
      resultadoScrapper.value = result.veiculo;
      resultadoAction.value = result.action;

      statusMessage.value = {
        text: `Veículo extraído e salvo com sucesso! (${getActionLabel(result.action)})`,
        type: 'success'
      };
    } else {
      statusMessage.value = {
        text: 'Lote cancelado/descartado.',
        type: 'error'
      };
    }

    historico.value.unshift({
      url: urlParaProcessar,
      data: new Date().toLocaleString('pt-BR'),
      resultado: result.veiculo,
      action: result.action
    });
  } catch (error: any) {
    statusMessage.value = {
      text: error.message || 'Erro ao processar URL',
      type: 'error'
    };
  } finally {
    isLoading.value = false;
  }
}

// Processar todas as URLs em lote (sequencialmente com auto-save)
async function processarUrlsEmLote() {
  if (urlsListagem.value.length === 0 || !validarDataLeilao()) return;

  isLoading.value = true;
  statusMessage.value = null;
  batchResults.value = [];

  try {
    let sucessos = 0;
    let falhas = 0;

    for (const urlItem of urlsListagem.value) {
      try {
        const result = await scrapperService.executarScrapper(urlItem, dataLeilao.value);

        if (result.veiculo) {
          batchResults.value.push({ veiculo: result.veiculo, action: result.action });
          sucessos++;
        } else {
          falhas++;
        }

        historico.value.unshift({
          url: urlItem,
          data: new Date().toLocaleString('pt-BR'),
          resultado: result.veiculo,
          action: result.action
        });

        // Pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        falhas++;
      }
    }

    statusMessage.value = {
      text: `Processamento em lote concluído: ${sucessos} sucesso(s), ${falhas} falha(s).`,
      type: 'success'
    };

    if (batchResults.value.length === 1) {
      const first = batchResults.value[0];
      if (first) {
        resultadoScrapper.value = first.veiculo;
        resultadoAction.value = first.action;
      }
    }

  } catch (error: any) {
    statusMessage.value = {
      text: error.message || 'Erro ao processar URLs em lote',
      type: 'error'
    };
  } finally {
    isLoading.value = false;
  }
}

// Visualizar um veículo específico do lote
function visualizarVeiculo(veiculo: Veiculo, action?: string) {
  resultadoScrapper.value = veiculo;
  resultadoAction.value = action || null;
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// Funções auxiliares de score
function getScoreClass(score: number): string {
  if (score >= 8.5) return 'bg-green-100 text-green-800';
  if (score >= 7.0) return 'bg-blue-100 text-blue-800';
  if (score >= 5.0) return 'bg-yellow-100 text-yellow-800';
  if (score >= 3.0) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

function getVeiculoScore(veiculo: Veiculo): number {
  return VeiculoRanker.calcularScore(veiculo);
}

function getScoreIcon(score: number): string {
  if (score >= 8.5) return '🏆';
  if (score >= 7.0) return '🥈';
  if (score >= 5.0) return '🥉';
  if (score >= 3.0) return '⚠️';
  return '❌';
}

// Funções de ação (badge)
function getActionBadgeClass(action: string): string {
  switch (action) {
    case 'created': return 'bg-green-100 text-green-800';
    case 'updated': return 'bg-blue-100 text-blue-800';
    case 'deleted': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'created': return 'Novo';
    case 'updated': return 'Atualizado';
    case 'deleted': return 'Descartado';
    default: return action;
  }
}

// Carregar resultado do histórico
function carregarHistorico(index: number) {
  const item = historico.value[index];
  if (item && item.resultado) {
    resultadoScrapper.value = item.resultado;
    resultadoAction.value = item.action;
    statusMessage.value = null;
  }
}

// Limpar resultado
function limparResultado() {
  resultadoScrapper.value = null;
  resultadoAction.value = null;
  statusMessage.value = null;
  url.value = '';
  batchResults.value = [];
  sequentialResults.value = [];
}

// Formatar valores monetários
function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR');
}
</script>
