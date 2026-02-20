<!-- components/VeiculoCard.vue -->
<template>
  <div class="h-full flex flex-col">
    <!-- Card header -->
    <div class="p-4 border-b flex justify-between items-center">
      <div>
        <h3 class="text-lg font-semibold truncate">
          <a :href="veiculo.urlOrigem" target="_blank" class="text-blue-600 hover:text-blue-800">
            {{ veiculo.marca }} {{ veiculo.descricao }}
          </a>
        </h3>
        <p class="text-gray-600 text-sm">{{ veiculo.ano }} • {{ veiculo.quilometragem.toLocaleString('pt-BR') }} km</p>
        <p v-if="veiculo.dataLeilao" class="text-gray-500 text-xs">Leilão: {{ formatarData(veiculo.dataLeilao) }}</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Refresh button -->
        <button
            @click="atualizarVeiculo"
            class="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            :disabled="isRefreshing"
            title="Atualizar lote"
        >
          <Icon
              :name="isRefreshing ? 'mdi:loading' : 'mdi:refresh'"
              class="text-emerald-600 text-lg"
              :class="{ 'animate-spin': isRefreshing }"
          />
        </button>
        <!-- Edit button -->
        <button
            @click="editarVeiculo"
            class="p-2 rounded-full hover:bg-gray-100"
            title="Editar veículo"
        >
          <Icon name="mdi:pencil" class="text-blue-600 text-lg" />
        </button>
      </div>
    </div>

    <!-- Card body -->
    <div class="flex-1 p-4">
      <!-- Status indicator -->
      <div class="flex items-center mb-2">
        <span
            v-if="veiculo.sinistro"
            class="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded mr-2"
        >
          Sinistro
        </span>
        <span
            class="px-2 py-1 text-xs font-medium rounded"
            :class="veiculo.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
        >
          {{ veiculo.active ? 'Ativo' : 'Inativo' }}
        </span>
      </div>

      <!-- Price information -->
      <div class="grid grid-cols-2 gap-2 mt-3">
        <div class="text-sm">
          <div class="text-gray-600">Lance Atual</div>
          <div class="font-semibold">
            R$ {{ formatarValor(veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial) }}
          </div>
        </div>
        <div class="text-sm">
          <div class="text-gray-600">Valor Mercado</div>
          <div class="font-semibold">R$ {{ formatarValor(veiculo.valorMercado) }}</div>
        </div>
      </div>

      <!-- Percentage and Score indicators -->
      <div class="grid grid-cols-2 gap-2 mt-3">
        <div class="text-sm">
          <div class="text-gray-600">% Mercado</div>
          <div>
            <span
                v-if="veiculo.valorMercado > 0"
                class="px-2 py-1 text-xs font-medium rounded"
                :class="getPercentageClass(getPorcentagemMercado())"
            >
              {{ getPorcentagemMercado() }}%
            </span>
            <span v-else>--</span>
          </div>
        </div>
        <div class="text-sm">
          <div class="text-gray-600">Score</div>
          <div>
            <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getScoreClass(getScore())"
            >
              {{ getScoreIcon(getScore()) }} {{ getScore().toFixed(1) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';
import { scrapperService } from '~/services/scrapperService';

const props = defineProps<{
  veiculo: Veiculo;
}>();

const emit = defineEmits(['edit', 'refresh']);
const isRefreshing = ref(false);

// Formatação de valores
function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR');
}

// Formatação de data
function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleDateString('pt-BR');
}

// Calcula a porcentagem do lance atual em relação ao valor de mercado
function getPorcentagemMercado(): number {
  if (!props.veiculo.valorMercado) return 0;
  const valorVeiculo = props.veiculo.lanceAtual > 0 ? props.veiculo.lanceAtual : props.veiculo.lanceInicial;
  return Math.round((valorVeiculo / props.veiculo.valorMercado) * 100);
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
  if (percentage < 50) return 'bg-green-500 text-white font-bold'; // Excelente (destaque maior)
  if (percentage < 60) return 'bg-green-200 text-green-900'; // Muito Bom
  if (percentage < 70) return 'bg-blue-100 text-blue-800'; // Bom
  if (percentage < 80) return 'bg-yellow-100 text-yellow-800'; // Regular
  return 'bg-red-100 text-red-800'; // Ruim
}

// Calcular o score do veículo
function getScore(): number {
  return VeiculoRanker.calcularScore(props.veiculo);
}

// Emitir evento para editar o veículo
function editarVeiculo() {
  emit('edit', props.veiculo);
}

async function atualizarVeiculo() {
  if (!props.veiculo.urlOrigem || isRefreshing.value) {
    return;
  }

  try {
    isRefreshing.value = true;
    const dataLeilao = props.veiculo.dataLeilao
        ? new Date(props.veiculo.dataLeilao).toISOString()
        : undefined;
    const result = await scrapperService.executarScrapper(props.veiculo.urlOrigem, dataLeilao);

    if (!result.veiculo) {
      alert('Lote cancelado/descartado.');
      return;
    }

    emit('refresh', result.veiculo);
  } catch (error) {
    console.error('Erro ao atualizar lote:', error);
    alert('Erro ao atualizar lote. Verifique os logs.');
  } finally {
    isRefreshing.value = false;
  }
}
</script>
