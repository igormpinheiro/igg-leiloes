<!-- components/scrapper/ExtracacaoSequencial.vue -->
<template>
  <div v-if="results.length > 0 || showProgress" class="bg-white rounded-lg shadow mb-8">
    <div class="border-b p-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold">Extração Sequencial</h2>
          <p class="text-sm text-gray-500">
            {{ stats.total }} lote(s) processado(s) —
            {{ stats.created }} novo(s),
            {{ stats.updated }} atualizado(s),
            {{ stats.deleted }} descartado(s),
            {{ stats.errors }} erro(s)
          </p>
        </div>
        <button
            v-if="showProgress"
            @click="$emit('cancelar')"
            class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none"
        >
          Cancelar
        </button>
      </div>

      <!-- Barra de progresso -->
      <div v-if="showProgress" class="mt-3">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          {{ results.length }} / {{ limite }} ({{ progressPercent }}%)
        </p>
      </div>
    </div>

    <div class="p-4 max-h-96 overflow-y-auto">
      <ul class="divide-y">
        <li v-for="(item, index) in results" :key="index"
            class="py-2 flex items-center justify-between">
          <div class="flex items-center space-x-3 min-w-0">
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
              <p class="text-sm font-medium truncate">{{ item.modelo || item.url }}</p>
              <p v-if="item.error" class="text-xs text-red-500">{{ item.error }}</p>
            </div>
          </div>

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
</template>

<script setup lang="ts">
const { getActionBadgeClass, getActionLabel } = useLeiloeiro();

interface SequentialItem {
  url: string;
  status: 'loading' | 'success' | 'deleted' | 'error';
  modelo?: string;
  action?: string;
  error?: string;
}

const props = defineProps<{
  results: SequentialItem[];
  stats: { total: number; created: number; updated: number; deleted: number; errors: number };
  showProgress: boolean;
  progressPercent: number;
  limite: number;
}>();

defineEmits(['cancelar']);
</script>
