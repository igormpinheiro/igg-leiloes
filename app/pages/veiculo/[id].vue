<!-- pages/veiculo/[id].vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="pending" class="flex justify-center items-center h-64">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="error" class="bg-red-100 p-4 rounded-lg text-red-700">
      {{ error }}
    </div>

    <template v-else-if="veiculo">
      <!-- Navegação -->
      <div class="mb-6">
        <NuxtLink to="/" class="text-blue-600 hover:text-blue-800 flex items-center">
          <svg class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Voltar para a lista
        </NuxtLink>
      </div>

      <!-- Cabeçalho -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">{{ veiculo.descricao }}</h1>
        <p class="text-gray-600">{{ veiculo.marca }} | {{ veiculo.ano }}</p>
      </div>

      <!-- Conteúdo principal -->
      <div class="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div class="p-6">
          <!-- Score e informações de destaque -->
          <div class="flex flex-wrap justify-between items-center mb-6">
            <div class="flex items-center mb-4 md:mb-0">
              <span
                  class="px-3 py-1 text-sm font-medium rounded-full mr-2"
                  :class="getScoreClass(getVeiculoScore(veiculo))"
              >
                {{ getScoreIcon(getVeiculoScore(veiculo)) }} {{ getVeiculoScore(veiculo).toFixed(1) }}
              </span>
              <span class="text-gray-500">Capturado em {{ new Date(veiculo.dataCaptura).toLocaleString('pt-BR') }}</span>
            </div>

            <a
                v-if="veiculo.urlOrigem"
                :href="veiculo.urlOrigem"
                target="_blank"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ver no site original
            </a>
          </div>

          <!-- Detalhes do veículo -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Especificações -->
            <div>
              <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Especificações</h2>
              <dl class="grid grid-cols-2 gap-4">
                <div>
                  <dt class="text-sm text-gray-500">Marca</dt>
                  <dd>{{ veiculo.marca }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-500">Ano</dt>
                  <dd>{{ veiculo.ano }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-500">Quilometragem</dt>
                  <dd>{{ veiculo.quilometragem.toLocaleString('pt-BR') }} km</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-500">Sinistro</dt>
                  <dd>{{ veiculo.sinistro ? 'Sim' : 'Não' }}</dd>
                </div>
              </dl>
            </div>

            <!-- Informações de leilão -->
            <div>
              <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Informações de Leilão</h2>
              <dl class="grid grid-cols-2 gap-4">
                <div>
                  <dt class="text-sm text-gray-500">Lance Inicial</dt>
                  <dd>R$ {{ formatarValor(veiculo.lanceInicial) }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-500">Lance Atual</dt>
                  <dd>R$ {{ formatarValor(veiculo.lanceAtual) }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-500">Valor de Mercado</dt>
                  <dd>R$ {{ formatarValor(veiculo.valorMercado) }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-500">Economia Potencial</dt>
                  <dd class="font-medium"
                      :class="getEconomiaClass(veiculo.valorMercado - veiculo.lanceAtual)">
                    R$ {{ formatarValor(veiculo.valorMercado - veiculo.lanceAtual) }}
                    ({{ Math.round((veiculo.valorMercado - veiculo.lanceAtual) / veiculo.valorMercado * 100) }}%)
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { VeiculoRanker } from '~/services/veiculoRankerService';

const route = useRoute();
const id = computed(() => route.params.id);

// const data = null;
// const pending = null;
// const error = null;
// const refresh = null;

const { data: response, pending, error, refresh } = await useFetch(`/api/veiculos/${id}`, {
  params: { id },
  transform: (response) => {
    if (!response || !response.success || !response.data) return null;

    return {
      ...response.data,
      dataCaptura: new Date(response.data.dataCaptura)
    };
  }
});

const veiculo = computed(() => response.value);

// Função para calcular o score de um veículo
function getVeiculoScore(veiculo) {
  return VeiculoRanker.calcularScore(veiculo);
}

// Função para obter o ícone baseado no score
function getScoreIcon(score) {
  if (score >= 8.5) return '🏆'; // Excelente
  if (score >= 7.0) return '🥈'; // Muito Bom
  if (score >= 5.0) return '🥉'; // Bom
  if (score >= 3.0) return '⚠️'; // Regular
  return '❌'; // Ruim
}

// Função auxiliar para determinar a classe CSS do score
function getScoreClass(score) {
  if (score >= 8.5) return 'bg-green-100 text-green-800';
  if (score >= 7.0) return 'bg-blue-100 text-blue-800';
  if (score >= 5.0) return 'bg-yellow-100 text-yellow-800';
  if (score >= 3.0) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

// Função para formatar valores monetários
function formatarValor(valor) {
  return valor.toLocaleString('pt-BR');
}

// Função para determinar a classe CSS da economia
function getEconomiaClass(economia) {
  if (economia >= 30000) return 'text-green-600';
  if (economia >= 10000) return 'text-blue-600';
  if (economia >= 5000) return 'text-yellow-600';
  return 'text-gray-600';
}
</script>