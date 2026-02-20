<!-- components/scrapper/HistoricoExtracoes.vue -->
<template>
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
                  @click="$emit('carregar', index)"
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
</template>

<script setup lang="ts">
import type { Veiculo } from '~/types/veiculo';

const { getActionBadgeClass, getActionLabel } = useLeiloeiro();

defineProps<{
  historico: { url: string; data: string; resultado: Veiculo | null; action: string }[];
}>();

defineEmits(['carregar']);
</script>
