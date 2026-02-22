<!-- components/scrapper/ResultadosLote.vue -->
<template>
  <div v-if="results.length > 0" class="bg-white rounded-lg shadow mb-8">
    <div class="border-b p-4">
      <h2 class="text-xl font-semibold">Resultados do Processamento em Lote</h2>
      <p class="text-sm text-gray-500">{{ results.length }} veículos extraídos</p>
    </div>

    <div class="p-4">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(item, index) in results" :key="index" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ item.veiculo.modelo }}</div>
              <div class="text-sm text-gray-500">{{ item.veiculo.marca }} | {{ item.veiculo.ano }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">R$ {{ formatarValor(item.veiculo.lanceAtual) }}</div>
              <div class="text-sm text-gray-500">
                {{ Math.round((item.veiculo.lanceAtual / item.veiculo.valorMercado) * 100) }}% do valor de mercado
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getScoreClass(getScore(item.veiculo))">
                {{ getScoreIcon(getScore(item.veiculo)) }} {{ getScore(item.veiculo).toFixed(1) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 text-xs font-medium rounded" :class="getActionBadgeClass(item.action)">
                {{ getActionLabel(item.action) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button @click="$emit('visualizar', item.veiculo, item.action)" class="text-blue-600 hover:text-blue-900">
                Visualizar
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Veiculo } from '~/types/veiculo';

const { formatarValor } = useFormatacao();
const { getScore, getScoreClass, getScoreIcon } = useVeiculoScore();
const { getActionBadgeClass, getActionLabel } = useLeiloeiro();

defineProps<{
  results: { veiculo: Veiculo; action: string }[];
}>();

defineEmits(['visualizar']);
</script>
