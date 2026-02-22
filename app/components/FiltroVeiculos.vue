<template>
  <div class="p-4">
    <div class="mb-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-900">Filtros</h2>
      <p class="mt-1 text-xs text-slate-500">Atualização automática dos resultados</p>
    </div>

    <div class="space-y-3">
      <section class="rounded-lg border border-slate-200 p-3">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Busca</label>
        <input
          v-model="filtros.termoPesquisa"
          type="text"
          placeholder="Modelo ou marca"
          class="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </section>

      <section class="rounded-lg border border-slate-200 p-3">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Ano</label>
        <div class="grid grid-cols-2 gap-2">
          <input
            v-model.number="filtros.anoMin"
            type="number"
            placeholder="Mín"
            class="rounded-md border px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-100"
            :class="anoInvalido ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'"
          />
          <input
            v-model.number="filtros.anoMax"
            type="number"
            placeholder="Máx"
            class="rounded-md border px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-100"
            :class="anoInvalido ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'"
          />
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 p-3">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Lance (R$)</label>
        <div class="grid grid-cols-2 gap-2">
          <input
            v-model.number="filtros.precoMin"
            type="number"
            placeholder="Mín"
            class="rounded-md border px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-100"
            :class="precoInvalido ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'"
          />
          <input
            v-model.number="filtros.precoMax"
            type="number"
            placeholder="Máx"
            class="rounded-md border px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-100"
            :class="precoInvalido ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'"
          />
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 p-3">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Quilometragem</label>
        <div class="grid grid-cols-2 gap-2">
          <input
            v-model.number="filtros.kmMin"
            type="number"
            placeholder="Mín"
            class="rounded-md border px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-100"
            :class="kmInvalido ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'"
          />
          <input
            v-model.number="filtros.kmMax"
            type="number"
            placeholder="Máx"
            class="rounded-md border px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-100"
            :class="kmInvalido ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'"
          />
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 p-3">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Status e Localização</label>
        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input v-model="filtros.semSinistro" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Sem sinistro
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input v-model="filtros.apenasAtivos" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Apenas ativos
          </label>

          <select
            v-model.number="filtros.leiloeiroId"
            class="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option :value="null">Todos os leiloeiros</option>
            <option v-for="leiloeiro in leiloeiros" :key="leiloeiro.id" :value="leiloeiro.id">
              {{ leiloeiro.descricao }}
            </option>
          </select>

          <select
            v-model="filtros.patioUf"
            class="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todas as UFs</option>
            <option v-for="uf in ufs" :key="uf" :value="uf">{{ uf }}</option>
          </select>
        </div>
      </section>
    </div>

    <button
      type="button"
      class="mt-3 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      @click="$emit('resetar')"
    >
      Limpar filtros
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Leiloeiro } from '~/types/veiculo';

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
  leiloeiroId: number | null;
  patioUf: string;
}

const props = defineProps<{
  filtros: Filtros;
  leiloeiros: Leiloeiro[];
}>();

defineEmits<{
  resetar: [];
}>();

const ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const anoInvalido = computed(() => props.filtros.anoMin !== null && props.filtros.anoMax !== null && props.filtros.anoMin > props.filtros.anoMax);
const precoInvalido = computed(() => props.filtros.precoMin !== null && props.filtros.precoMax !== null && props.filtros.precoMin > props.filtros.precoMax);
const kmInvalido = computed(() => props.filtros.kmMin !== null && props.filtros.kmMax !== null && props.filtros.kmMin > props.filtros.kmMax);
</script>
