<!-- pages/scrapper.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Scrapper de Leilões</h1>

    <div class="bg-white p-6 rounded-lg shadow mb-8">
      <h2 class="text-xl font-semibold mb-4">Adicionar Nova URL</h2>

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
                  Processar Todas ({{ Math.min(urlsListagem.length, 10) }})
                </button>
              </div>
            </div>

            <div class="max-h-60 overflow-y-auto bg-white border rounded p-2">
              <ul class="divide-y">
                <li v-for="(url, index) in urlsListagem.slice(0, 10)" :key="index"
                    class="py-2 flex justify-between items-center">
                  <span class="text-sm truncate" style="max-width: 400px;">{{ url }}</span>
                  <button
                      @click="processarUrlUnica(url)"
                      class="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Processar
                  </button>
                </li>
                <li v-if="urlsListagem.length > 10" class="py-2 text-center text-sm text-gray-500">
                  + {{ urlsListagem.length - 10 }} URLs adicionais (limitado a 10 para processamento)
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

    <!-- Resultado Individual do Scrapper -->
    <div v-if="resultadoScrapper" class="bg-white rounded-lg shadow mb-8">
      <div class="border-b p-4">
        <h2 class="text-xl font-semibold">Resultado da Extração</h2>
        <p class="text-sm text-gray-500">URL: {{ resultadoScrapper.urlOrigem }}</p>
      </div>

      <div class="p-4">
        <!-- Card de Veículo -->
        <VeiculoCard :veiculo="resultadoScrapper"/>

        <!-- Botões de Ação -->
        <div class="mt-6 flex justify-end space-x-2">
          <button
              @click="salvarVeiculo"
              class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-200"
              :disabled="isLoading"
          >
            <span v-if="!isLoading">Salvar no Banco de Dados</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </span>
          </button>
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
                Ações
              </th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(veiculo, index) in batchResults" :key="index" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ veiculo.descricao }}</div>
                <div class="text-sm text-gray-500">{{ veiculo.marca }} | {{ veiculo.ano }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">R$ {{ formatarValor(veiculo.lanceAtual) }}</div>
                <div class="text-sm text-gray-500">
                  {{ Math.round((veiculo.lanceAtual / veiculo.valorMercado) * 100) }}% do valor de mercado
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                        :class="getScoreClass(getVeiculoScore(veiculo))">
                    {{ getScoreIcon(getVeiculoScore(veiculo)) }} {{ getVeiculoScore(veiculo).toFixed(1) }}
                  </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="visualizarVeiculo(veiculo)" class="text-blue-600 hover:text-blue-900 mr-3">
                  Visualizar
                </button>
                <button @click="salvarVeiculoIndividual(veiculo)" class="text-green-600 hover:text-green-900">
                  Salvar
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Botão para salvar todos os veículos -->
        <div class="mt-4 flex justify-end">
          <button
              @click="salvarTodosVeiculos"
              class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-200"
              :disabled="isLoading"
          >
            <span v-if="!isLoading">Salvar Todos no Banco de Dados</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </span>
          </button>
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
              <div>
                <button
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
import {ref, reactive} from 'vue';
import type {Veiculo} from '~/types/veiculo';
import {scrapperService} from '~/services/scrapperService';
import {VeiculoRanker} from '~/services/veiculoRankerService';

// Estados
const url = ref('');
const urlListagem = ref('');
const urlSequencial = ref('');
const limiteVeiculos = ref(10);
const modoExtracao = ref('individual');
const isLoading = ref(false);
const statusMessage = ref<{ text: string, type: 'success' | 'error' } | null>(null);
const resultadoScrapper = ref<Veiculo | null>(null);
const historico = ref<{ url: string, data: string, resultado: Veiculo }[]>([]);
const urlsListagem = ref<string[]>([]);
const batchResults = ref<Veiculo[]>([]);

// Função para iniciar o scrapper para uma URL individual
async function iniciarScrapper() {
  if (!url.value) return;

  isLoading.value = true;
  statusMessage.value = null;
  resultadoScrapper.value = null;

  try {
    // Utilizar o serviço de scrapper
    const novoVeiculo = await scrapperService.executarScrapper(url.value);

    resultadoScrapper.value = novoVeiculo;

    // Adicionar ao histórico
    historico.value.unshift({
      url: url.value,
      data: new Date().toLocaleString('pt-BR'),
      resultado: novoVeiculo
    });

    statusMessage.value = {
      text: 'Dados extraídos com sucesso!',
      type: 'success'
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
  if (!urlListagem.value) return;

  isLoading.value = true;
  statusMessage.value = null;
  urlsListagem.value = [];

  try {
    // Chamar a API para extrair URLs da listagem
    const response = await fetch('/api/scrapper/extract-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({url: urlListagem.value}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'Erro ao extrair URLs da listagem');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Erro ao extrair URLs da listagem');
    }

    urlsListagem.value = data.loteUrls || [];

    statusMessage.value = {
      text: `Extraídas ${urlsListagem.value.length} URLs de lotes. Você pode processá-las individualmente ou em lote.`,
      type: 'success'
    };
  } catch (error: any) {
    statusMessage.value = {
      text: error.message || 'Erro ao extrair URLs da listagem',
      type: 'error'
    };
    urlsListagem.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Iniciar extração sequencial
async function iniciarExtracaoSequencial() {
  if (!urlSequencial.value) return;

  isLoading.value = true;
  statusMessage.value = null;
  batchResults.value = [];

  try {
    // Chamar a API para extração sequencial
    const response = await fetch('/api/scrapper/extract-sequential', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlSequencial.value,
        maxVeiculos: limiteVeiculos.value
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'Erro ao realizar extração sequencial');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Erro ao realizar extração sequencial');
    }

    // Processar resultados
    const veiculosExtraidos = data.results
        .filter((result: any) => result.success)
        .map((result: any) => {
          const veiculo = result.data;
          veiculo.dataCaptura = new Date(veiculo.dataCaptura);
          return veiculo;
        });

    batchResults.value = veiculosExtraidos;

    // Adicionar ao histórico
    for (const veiculo of veiculosExtraidos) {
      historico.value.unshift({
        url: veiculo.urlOrigem,
        data: new Date().toLocaleString('pt-BR'),
        resultado: veiculo
      });
    }

    const sucessos = data.results.filter((r: any) => r.success).length;
    const falhas = data.results.length - sucessos;
    const completo = data.completed ? 'completa' : 'parcial';

    statusMessage.value = {
      text: `Extração sequencial ${completo}: ${sucessos} sucesso(s), ${falhas} falha(s). ${veiculosExtraidos.length} veículo(s) extraído(s).`,
      type: 'success'
    };

    // Se apenas um veículo foi extraído, exibi-lo
    if (veiculosExtraidos.length === 1) {
      resultadoScrapper.value = veiculosExtraidos[0];
    }

  } catch (error: any) {
    statusMessage.value = {
      text: error.message || 'Erro ao realizar extração sequencial',
      type: 'error'
    };
  } finally {
    isLoading.value = false;
  }
}

// Processar uma URL específica da listagem
async function processarUrlUnica(urlParaProcessar: string) {
  url.value = urlParaProcessar;
  await iniciarScrapper();
}

// Processar todas as URLs em lote
async function processarUrlsEmLote() {
  if (urlsListagem.value.length === 0) return;

  isLoading.value = true;
  statusMessage.value = null;
  batchResults.value = [];

  try {
    // Limitar o número de URLs para evitar sobrecarga
    const urlsParaProcessar = urlsListagem.value.slice(0, 10);

    // Chamar a API para processar URLs em lote
    const response = await fetch('/api/scrapper/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({urls: urlsParaProcessar}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'Erro ao processar URLs em lote');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Erro ao processar URLs em lote');
    }

    // Processar resultados
    const veiculosExtraidos = data.results
        .filter((result: any) => result.success)
        .map((result: any) => {
          const veiculo = result.data;
          veiculo.dataCaptura = new Date(veiculo.dataCaptura);
          return veiculo;
        });

    batchResults.value = veiculosExtraidos;

    // Adicionar ao histórico
    for (const veiculo of veiculosExtraidos) {
      historico.value.unshift({
        url: veiculo.urlOrigem,
        data: new Date().toLocaleString('pt-BR'),
        resultado: veiculo
      });
    }

    const sucessos = data.results.filter((r: any) => r.success).length;
    const falhas = data.results.length - sucessos;

    statusMessage.value = {
      text: `Processamento em lote concluído: ${sucessos} sucesso(s), ${falhas} falha(s). ${veiculosExtraidos.length} veículo(s) extraído(s).`,
      type: 'success'
    };

    // Se apenas um veículo foi extraído, exibi-lo
    if (veiculosExtraidos.length === 1) {
      resultadoScrapper.value = veiculosExtraidos[0];
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
function visualizarVeiculo(veiculo: Veiculo) {
  resultadoScrapper.value = veiculo;
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// Salvar um veículo individual do lote
async function salvarVeiculoIndividual(veiculo: Veiculo) {
  isLoading.value = true;
  statusMessage.value = null;

  try {
    // Chamar a API para salvar o veículo
    const response = await fetch('/api/veiculos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(veiculo),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'Erro ao salvar veículo no banco de dados');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Erro ao salvar veículo no banco de dados');
    }

    statusMessage.value = {
      text: `Veículo "${veiculo.descricao}" salvo com sucesso no banco de dados!`,
      type: 'success'
    };

    // Remover o veículo da lista de resultados
    batchResults.value = batchResults.value.filter(v => v !== veiculo);

  } catch (error: any) {
    statusMessage.value = {
      text: error.message || 'Erro ao salvar veículo no banco de dados',
      type: 'error'
    };
  } finally {
    isLoading.value = false;
  }
}

// Salvar todos os veículos do lote
async function salvarTodosVeiculos() {
  if (batchResults.value.length === 0) return;

  isLoading.value = true;
  statusMessage.value = null;

  try {
    const totalVeiculos = batchResults.value.length;
    let sucessos = 0;
    let falhas = 0;

    // Processar cada veículo sequencialmente
    for (const veiculo of batchResults.value) {
      try {
        const response = await fetch('/api/veiculos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(veiculo),
        });

        if (response.ok) {
          sucessos++;
        } else {
          falhas++;
        }

        // Pequena pausa para não sobrecarregar o servidor
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        falhas++;
      }
    }

    statusMessage.value = {
      text: `Salvamento em lote concluído: ${sucessos} sucesso(s), ${falhas} falha(s) de um total de ${totalVeiculos} veículo(s).`,
      type: 'success'
    };

    // Limpar a lista de resultados se todos foram salvos com sucesso
    if (sucessos === totalVeiculos) {
      batchResults.value = [];
    }

  } catch (error: any) {
    statusMessage.value = {
      text: error.message || 'Erro ao salvar veículos em lote',
      type: 'error'
    };
  } finally {
    isLoading.value = false;
  }
}

// Função auxiliar para determinar a classe CSS do score
function getScoreClass(score: number): string {
  if (score >= 8.5) return 'bg-green-100 text-green-800';
  if (score >= 7.0) return 'bg-blue-100 text-blue-800';
  if (score >= 5.0) return 'bg-yellow-100 text-yellow-800';
  if (score >= 3.0) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

// Função para calcular o score de um veículo
function getVeiculoScore(veiculo: Veiculo): number {
  return VeiculoRanker.calcularScore(veiculo);
}

// Função para obter o ícone baseado no score
function getScoreIcon(score: number): string {
  if (score >= 8.5) return '🏆'; // Excelente
  if (score >= 7.0) return '🥈'; // Muito Bom
  if (score >= 5.0) return '🥉'; // Bom
  if (score >= 3.0) return '⚠️'; // Regular
  return '❌'; // Ruim
}

// Salvar veículo no banco de dados (para resultado individual)
async function salvarVeiculo() {
  if (!resultadoScrapper.value) return;

  statusMessage.value = null;
  isLoading.value = true;

  try {
    // Chamar a API para salvar o veículo
    const response = await fetch('/api/veiculos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resultadoScrapper.value),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'Erro ao salvar veículo no banco de dados');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Erro ao salvar veículo no banco de dados');
    }

    statusMessage.value = {
      text: 'Veículo salvo com sucesso no banco de dados!',
      type: 'success'
    };
  } catch (error: any) {
    statusMessage.value = {
      text: error.message || 'Erro ao salvar veículo no banco de dados',
      type: 'error'
    };
  } finally {
    isLoading.value = false;
  }
}

// Carregar resultado do histórico
function carregarHistorico(index: number) {
  const item = historico.value[index];
  if (item) {
    url.value = item.url;
    resultadoScrapper.value = item.resultado;
    statusMessage.value = null;
  }
}

// Limpar resultado
function limparResultado() {
  resultadoScrapper.value = null;
  statusMessage.value = null;
  url.value = '';
  batchResults.value = [];
}

// Formatar valores monetários
function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR');
}
</script>