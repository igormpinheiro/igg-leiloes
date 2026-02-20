<!-- components/TabelaVeiculos.vue -->
<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
      <tr>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="$emit('ordenar', 'descricao')">
          Veículo
          <Icon
              v-if="ordenacao.campo === 'descricao'"
              :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
              class="text-sm ml-1"
          />
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="$emit('ordenar', 'ano')">
          <div class="flex items-center">
            Ano
            <Icon v-if="ordenacao.campo === 'ano'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm ml-1" />
          </div>
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="$emit('ordenar', 'quilometragem')">
          <div class="flex items-center">
            Quilometragem
            <Icon v-if="ordenacao.campo === 'quilometragem'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm ml-1" />
          </div>
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Mercado</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="$emit('ordenar', 'porcentagemMercado')">
          <div class="flex items-center">
            FIPE
            <Icon v-if="ordenacao.campo === 'porcentagemMercado'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm ml-1" />
          </div>
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="$emit('ordenar', 'lucroEstimado')">
          <div class="flex items-center">
            Lucro Est.
            <Icon v-if="ordenacao.campo === 'lucroEstimado'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm ml-1" />
          </div>
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="$emit('ordenar', 'score')">
          <div class="flex items-center">
            Score
            <Icon v-if="ordenacao.campo === 'score'" :name="ordenacao.direcao === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="text-sm ml-1" />
          </div>
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
      </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
      <tr v-for="veiculo in veiculos" :key="veiculo.id" class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <span
                class="w-5 h-5 flex items-center justify-center rounded-full text-white text-xs font-bold mr-2"
                :class="getLeiloeiroClass(veiculo.leiloeiro)"
                :title="veiculo.leiloeiro || 'Leiloeiro não especificado'"
            >
              {{ getLeiloeiroInitial(veiculo.leiloeiro) }}
            </span>
            <div class="relative">
              <a :href="veiculo.urlOrigem" target="_blank" class="text-sm font-medium text-blue-600 hover:text-blue-800">
                {{ veiculo.marca }} {{ veiculo.descricao }}
              </a>
              <span v-if="veiculo.sinistro" class="mr-1 text-red-500" title="Veículo com sinistro">🚨</span>
              <span
                  v-if="veiculo.patioUf"
                  class="ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold"
                  :class="getPatioUfClass(veiculo.patioUf)"
              >
                {{ veiculo.patioUf }}
              </span>
              <span
                  class="absolute h-1.5 w-1.5 rounded-full"
                  :class="veiculo.active ? 'bg-green-500' : 'bg-gray-400'"
                  :title="veiculo.active ? 'Ativo' : 'Inativo'"
              ></span>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ veiculo.ano }}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ veiculo.quilometragem.toLocaleString('pt-BR') }} km</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {{ formatarValor(veiculo.lanceAtual > 0 ? veiculo.lanceAtual : veiculo.lanceInicial) }}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {{ formatarValor(veiculo.valorMercado) }}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span v-if="veiculo.valorMercado > 0" class="px-2 py-1 text-xs font-medium rounded" :class="getPercentageClass(getPorcentagemMercado(veiculo))">
            {{ getPorcentagemMercado(veiculo) }}%
          </span>
          <span v-else> -- </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span v-if="veiculo.valorMercado > 0" class="px-2 py-1 text-xs font-medium rounded" :class="getLucroClass(calcularLucroEstimado(veiculo))">
            R$ {{ formatarValor(calcularLucroEstimado(veiculo)) }}
          </span>
          <span v-else> -- </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getScoreClass(getScore(veiculo))">
            {{ getScoreIcon(getScore(veiculo)) }} {{ getScore(veiculo).toFixed(1) }}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button
              @click="$emit('atualizar', veiculo)"
              class="text-emerald-600 hover:text-emerald-800 mr-2 disabled:opacity-50"
              :disabled="refreshingId === veiculo.id"
              title="Atualizar lote"
          >
            <Icon
                :name="refreshingId === veiculo.id ? 'mdi:loading' : 'mdi:refresh'"
                class="text-lg"
                :class="{ 'animate-spin': refreshingId === veiculo.id }"
            />
          </button>
          <button
              @click="$emit('editar', veiculo)"
              class="text-blue-600 hover:text-blue-800 mr-2"
              title="Editar veículo"
          >
            <Icon name="mdi:pencil" class="text-lg" />
          </button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Veiculo } from '~/types/veiculo';

const { formatarValor } = useFormatacao();
const { getScore, getScoreClass, getScoreIcon, getPercentageClass, getPorcentagemMercado, calcularLucroEstimado, getLucroClass } = useVeiculoScore();
const { getLeiloeiroInitial, getLeiloeiroClass } = useLeiloeiro();

function getPatioUfClass(uf: string | undefined): string {
  if (!uf) return 'bg-gray-100 text-gray-700';
  if (uf === 'DF') return 'bg-blue-100 text-blue-800';
  if (uf === 'GO') return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-700';
}

defineProps<{
  veiculos: Veiculo[];
  ordenacao: { campo: string; direcao: string };
  refreshingId: string | null;
}>();

defineEmits(['ordenar', 'editar', 'atualizar']);
</script>
