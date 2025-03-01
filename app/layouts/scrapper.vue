<!-- pages/scrapper.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Scrapper de Leilões</h1>

    <div class="bg-white p-6 rounded-lg shadow mb-8">
      <h2 class="text-xl font-semibold mb-4">Adicionar Nova URL</h2>
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
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

      <div v-if="statusMessage" :class="`mt-4 p-3 rounded text-sm ${statusMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`">
        {{ statusMessage.text }}
      </div>
    </div>

    <!-- Resultados do Scrapper -->
    <div v-if="resultadoScrapper" class="bg-white rounded-lg shadow">
      <div class="border-b p-4">
        <h2 class="text-xl font-semibold">Resultado da Extração</h2>
        <p class="text-sm text-gray-500">URL: {{ url }}</p>
      </div>

      <div class="p-4">
        <!-- Card de Veículo -->
        <VeiculoCard :veiculo="resultadoScrapper" />

        <!-- Botões de Ação -->
        <div class="mt-6 flex justify-end space-x-2">
          <button
              @click="salvarVeiculo"
              class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-200"
              :disabled="isLoading"
          >
            <span v-if="!isLoading">Salvar no Banco de Dados</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
import { ref, reactive } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { scrapperService } from '~/services/scrapperService';

// Estados
const url = ref('');
const isLoading = ref(false);
const statusMessage = ref<{ text: string, type: 'success' | 'error' } | null>(null);
const resultadoScrapper = ref<Veiculo | null>(null);
const historico = ref<{ url: string, data: string, resultado: Veiculo }[]>([]);

// Função para iniciar o scrapper
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

// Salvar veículo no banco de dados
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
}