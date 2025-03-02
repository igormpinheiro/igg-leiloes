<!-- components/VeiculoCard.vue -->
<template>
  <div class="bg-white rounded-lg overflow-hidden">
    <div class="p-4 border-b">
      <div class="flex justify-between items-center">
        <a
            :href="veiculo.urlOrigem"
            target="_blank"
            class="hover:text-blue-600"
        >
          <h3 class="text-lg font-semibold text-gray-800">
            <span v-if="veiculo.sinistro" class="mr-1 text-red-500" title="Veículo com sinistro">🚨</span>
            {{ veiculo.descricao }}
          </h3>
        </a>
        <span
            class="px-2 py-1 text-xs font-medium rounded-full"
            :class="getScoreClass(score)"
        >
          {{ getScoreIcon(score) }} {{ score.toFixed(1) }}
        </span>
      </div>
      <div class="text-sm text-gray-500 mt-1">
        {{ veiculo.marca }} | {{ veiculo.ano }}
      </div>
    </div>

    <div class="p-4">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p class="text-xs text-gray-500">Quilometragem</p>
          <p class="font-medium">{{ veiculo.quilometragem.toLocaleString('pt-BR') }} km</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Sinistro</p>
          <p class="font-medium">{{ veiculo.sinistro ? 'Sim' : 'Não' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Lance Inicial</p>
          <p class="font-medium">R$ {{ formatarValor(veiculo.lanceInicial) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Lance Atual</p>
          <p class="font-medium">R$ {{ formatarValor(veiculo.lanceAtual) }}</p>
        </div>
        <div class="col-span-2">
          <p class="text-xs text-gray-500">Valor de Mercado</p>
          <div class="flex items-center">
            <p class="font-medium mr-2">R$ {{ formatarValor(veiculo.valorMercado) }}</p>
            <span
                class="px-2 py-0.5 text-xs font-medium rounded"
                :class="getPercentageClass(getLancePercentage())"
            >
              {{ getLancePercentage() }}% do valor de mercado
            </span>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center mt-4">
        <div class="text-xs text-gray-500">
          Capturado em {{ new Date(veiculo.dataCaptura).toLocaleString('pt-BR') }}
        </div>
        <div class="flex space-x-2">
          <a
              v-if="veiculo.urlOrigem"
              :href="veiculo.urlOrigem"
              target="_blank"
              class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
              title="Ver no site original"
          >
            <Icon name="mdi:open-in-new" class="text-lg" />
          </a>
          <button
              @click="$emit('excluir', veiculo.id)"
              class="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
              title="Excluir veículo"
          >
            <Icon name="mdi:delete" class="text-lg" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';

// Props
const props = defineProps<{
  veiculo: Veiculo;
}>();

const emit = defineEmits(['excluir']);

// Calcular o score dinamicamente
const score = computed(() => {
  return VeiculoRanker.calcularScore(props.veiculo);
});

// Formatação de valores
function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR');
}

// Calcula a porcentagem do lance atual em relação ao valor de mercado
const getLancePercentage = (): number => {
  if (!props.veiculo.valorMercado) return 0;
  return Math.round((props.veiculo.lanceAtual / props.veiculo.valorMercado) * 100);
};

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
</script>