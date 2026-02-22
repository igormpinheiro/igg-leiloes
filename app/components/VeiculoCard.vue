<template>
  <div class="h-full flex flex-col">
    <div class="p-4 border-b flex justify-between items-center">
      <div>
        <h3 class="text-lg font-semibold truncate">
          <a :href="veiculo.urlOrigem" target="_blank" class="text-blue-600 hover:text-blue-800">
            {{ veiculo.marca }} {{ veiculo.modelo }}
          </a>
        </h3>
        <p class="text-gray-600 text-sm">{{ veiculo.ano }} • {{ veiculo.quilometragem.toLocaleString('pt-BR') }} km</p>
        <p v-if="veiculo.dataLeilao" class="text-gray-500 text-xs">Leilão: {{ formatarData(veiculo.dataLeilao) }}</p>
      </div>
      <div class="flex items-center gap-2">
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
        <button
          @click="editarVeiculo"
          class="p-2 rounded-full hover:bg-gray-100"
          title="Editar veículo"
        >
          <Icon name="mdi:pencil" class="text-blue-600 text-lg" />
        </button>
      </div>
    </div>

    <div class="flex-1 p-4">
      <div class="flex items-center mb-2 gap-2">
        <span
          v-if="veiculo.sinistro !== 'Nenhum'"
          class="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded"
        >
          {{ veiculo.sinistro }}
        </span>
        <span
          class="px-2 py-1 text-xs font-medium rounded"
          :class="veiculo.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
        >
          {{ veiculo.active ? 'Ativo' : 'Inativo' }}
        </span>
      </div>

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

      <div class="grid grid-cols-2 gap-2 mt-3">
        <div class="text-sm">
          <div class="text-gray-600">% Mercado</div>
          <div>
            <span
              v-if="veiculo.valorMercado > 0"
              class="px-2 py-1 text-xs font-medium rounded"
              :class="getPercentageClass(getPorcentagemMercado(veiculo))"
            >
              {{ getPorcentagemMercado(veiculo) }}%
            </span>
            <span v-else>--</span>
          </div>
        </div>
        <div class="text-sm">
          <div class="text-gray-600">Score</div>
          <div>
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="getScoreClass(getScore(veiculo))"
            >
              {{ getScoreIcon(getScore(veiculo)) }} {{ getScore(veiculo).toFixed(1) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { scrapperService } from '~/services/scrapperService';

const { formatarValor, formatarData } = useFormatacao();
const { getScore, getScoreClass, getScoreIcon, getPercentageClass, getPorcentagemMercado } = useVeiculoScore();

const props = defineProps<{
  veiculo: Veiculo;
}>();

const emit = defineEmits(['edit', 'refresh']);
const isRefreshing = ref(false);

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
