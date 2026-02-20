<!-- components/FiltroVeiculos.vue -->
<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Filtros</h2>

    <!-- Filtro de descrição -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">Descrição ou Marca</label>
      <input
          v-model="filtros.termoPesquisa"
          type="text"
          placeholder="Pesquisar..."
          class="w-full p-2 border rounded focus:ring focus:ring-blue-200"
      />
    </div>

    <!-- Filtro de ano -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">Ano</label>
      <div class="flex gap-2">
        <input
            v-model.number="filtros.anoMin"
            type="number"
            placeholder="Min"
            class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
        />
        <input
            v-model.number="filtros.anoMax"
            type="number"
            placeholder="Max"
            class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
        />
      </div>
    </div>

    <!-- Filtro de preço -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">Lance Atual (R$)</label>
      <div class="flex gap-2">
        <input
            v-model.number="filtros.precoMin"
            type="number"
            placeholder="Min"
            class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
        />
        <input
            v-model.number="filtros.precoMax"
            type="number"
            placeholder="Max"
            class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
        />
      </div>
    </div>

    <!-- Filtro de quilometragem -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">Quilometragem</label>
      <div class="flex gap-2">
        <input
            v-model.number="filtros.kmMin"
            type="number"
            placeholder="Min"
            class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
        />
        <input
            v-model.number="filtros.kmMax"
            type="number"
            placeholder="Max"
            class="w-1/2 p-2 border rounded focus:ring focus:ring-blue-200"
        />
      </div>
    </div>

    <!-- Filtro de sinistro -->
    <div class="mb-4">
      <label class="flex items-center text-sm font-medium text-gray-700">
        <input v-model="filtros.semSinistro" type="checkbox" class="mr-2 rounded" />
        Sem sinistro
      </label>
    </div>

    <!-- Filtro de veículos ativos -->
    <div class="mb-4">
      <label class="flex items-center text-sm font-medium text-gray-700">
        <input v-model="filtros.apenasAtivos" type="checkbox" class="mr-2 rounded" />
        Apenas veículos ativos
      </label>
    </div>

    <!-- Filtro de UF -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">UF do pátio</label>
      <select
          v-model="filtros.patioUf"
          class="w-full p-2 border rounded focus:ring focus:ring-blue-200"
      >
        <option value="">Todas</option>
        <option value="DF">DF</option>
        <option value="GO">GO</option>
      </select>
    </div>

    <button
        @click="$emit('aplicar')"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
    >
      Aplicar Filtros
    </button>

    <button
        @click="$emit('resetar')"
        class="w-full mt-2 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition"
    >
      Limpar Filtros
    </button>
  </div>
</template>

<script setup lang="ts">
interface Filtros {
  termoPesquisa: string;
  anoMin: number | null;
  anoMax: number | null;
  precoMin: number | null;
  precoMax: number | null;
  kmMin: number | null;
  kmMax: number | null;
  semSinistro: boolean;
  apenasAtivos: boolean;
  patioUf: string;
}

defineProps<{
  filtros: Filtros;
}>();

defineEmits(['aplicar', 'resetar']);
</script>
