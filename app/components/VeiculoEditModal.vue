<!-- components/VeiculoEditModal.vue -->
<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full">
      <!-- Header -->
      <div class="p-4 border-b">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">Editar Veículo</h3>
          <button @click="fecharModal" class="text-gray-500 hover:text-gray-700">
            <Icon name="mdi:close" class="text-xl" />
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-4">
        <form @submit.prevent="salvarVeiculo">
          <!-- Summary Stats Row -->
          <div class="bg-gray-50 p-3 mb-4 rounded-lg grid grid-cols-4 gap-4">
            <!-- Score -->
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Score</div>
              <div>
                <span
                    class="px-2 py-1 text-sm font-medium rounded-full"
                    :class="getScoreClass(getScore())"
                >
                  {{ getScoreIcon(getScore()) }} {{ getScore().toFixed(1) }}
                </span>
              </div>
            </div>

            <!-- Mercado % -->
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">% Mercado</div>
              <div>
                <span
                    v-if="veiculoEditado.valorMercado > 0"
                    class="px-2 py-1 text-sm font-medium rounded"
                    :class="getPercentageClass(getPorcentagemMercado())"
                >
                  {{ getPorcentagemMercado() }}%
                </span>
                <span v-else>--</span>
              </div>
            </div>

            <!-- Status -->
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Status</div>
              <div>
                <span
                    class="px-2 py-1 text-sm font-medium rounded"
                    :class="veiculoEditado.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ veiculoEditado.active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
            </div>

            <!-- Sinistro -->
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Sinistro</div>
              <div>
                <span
                    class="px-2 py-1 text-sm font-medium rounded"
                    :class="veiculoEditado.sinistro ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
                >
                  {{ veiculoEditado.sinistro ? 'Sim' : 'Não' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Form Fields - Two Column Layout -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Left Column -->
            <div>
              <!-- Descricão -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                    v-model="veiculoEditado.descricao"
                    type="text"
                    class="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                />
              </div>

              <!-- Marca -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input
                    v-model="veiculoEditado.marca"
                    type="text"
                    class="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                />
              </div>

              <!-- Ano -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                <input
                    v-model="veiculoEditado.ano"
                    type="text"
                    class="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                />
              </div>

              <!-- Quilometragem com incrementos -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Quilometragem</label>
                <div class="flex items-center">
                  <button
                      type="button"
                      @click="decrementarQuilometragem"
                      class="p-2 bg-gray-200 rounded-l hover:bg-gray-300 focus:outline-none"
                  >
                    <Icon name="mdi:minus" class="text-sm" />
                  </button>
                  <input
                      v-model.number="veiculoEditado.quilometragem"
                      type="number"
                      class="flex-1 p-2 border-t border-b focus:ring focus:ring-blue-200 text-center"
                  />
                  <button
                      type="button"
                      @click="incrementarQuilometragem"
                      class="p-2 bg-gray-200 rounded-r hover:bg-gray-300 focus:outline-none"
                  >
                    <Icon name="mdi:plus" class="text-sm" />
                  </button>
                </div>
                <div class="mt-1 text-xs text-gray-500">Incremento: 10.000 km</div>
              </div>
            </div>

            <!-- Right Column -->
            <div>
              <!-- Lance Inicial com incrementos -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Lance Inicial (R$)</label>
                <div class="flex items-center">
                  <button
                      type="button"
                      @click="decrementarLanceInicial"
                      class="p-2 bg-gray-200 rounded-l hover:bg-gray-300 focus:outline-none"
                  >
                    <Icon name="mdi:minus" class="text-sm" />
                  </button>
                  <input
                      v-model.number="veiculoEditado.lanceInicial"
                      type="number"
                      class="flex-1 p-2 border-t border-b focus:ring focus:ring-blue-200 text-center"
                  />
                  <button
                      type="button"
                      @click="incrementarLanceInicial"
                      class="p-2 bg-gray-200 rounded-r hover:bg-gray-300 focus:outline-none"
                  >
                    <Icon name="mdi:plus" class="text-sm" />
                  </button>
                </div>
                <div class="mt-1 text-xs text-gray-500">Incremento: R$ 1.000,00</div>
              </div>

              <!-- Lance Atual com incrementos -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Lance Atual (R$)</label>
                <div class="flex items-center">
                  <button
                      type="button"
                      @click="decrementarLanceAtual"
                      class="p-2 bg-gray-200 rounded-l hover:bg-gray-300 focus:outline-none"
                  >
                    <Icon name="mdi:minus" class="text-sm" />
                  </button>
                  <input
                      v-model.number="veiculoEditado.lanceAtual"
                      type="number"
                      class="flex-1 p-2 border-t border-b focus:ring focus:ring-blue-200 text-center"
                  />
                  <button
                      type="button"
                      @click="incrementarLanceAtual"
                      class="p-2 bg-gray-200 rounded-r hover:bg-gray-300 focus:outline-none"
                  >
                    <Icon name="mdi:plus" class="text-sm" />
                  </button>
                </div>
                <div class="mt-1 text-xs text-gray-500">Incremento: R$ 1.000,00</div>
              </div>

              <!-- Valor de Mercado com incrementos -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Valor de Mercado (R$)</label>
                <div class="flex items-center">
                  <button
                      type="button"
                      @click="decrementarValorMercado"
                      class="p-2 bg-gray-200 rounded-l hover:bg-gray-300 focus:outline-none"
                  >
                    <Icon name="mdi:minus" class="text-sm" />
                  </button>
                  <input
                      v-model.number="veiculoEditado.valorMercado"
                      type="number"
                      class="flex-1 p-2 border-t border-b focus:ring focus:ring-blue-200 text-center"
                  />
                  <button
                      type="button"
                      @click="incrementarValorMercado"
                      class="p-2 bg-gray-200 rounded-r hover:bg-gray-300 focus:outline-none"
                  >
                    <Icon name="mdi:plus" class="text-sm" />
                  </button>
                </div>
                <div class="mt-1 text-xs text-gray-500">Incremento: R$ 1.000,00</div>
              </div>

              <!-- Checkboxes -->
              <div class="grid grid-cols-2 gap-4">
                <!-- Sinistro -->
                <div class="mb-4">
                  <label class="flex items-center text-sm font-medium text-gray-700">
                    <input v-model="veiculoEditado.sinistro" type="checkbox" class="mr-2 rounded" />
                    Veículo com sinistro
                  </label>
                </div>

                <!-- Status -->
                <div class="mb-4">
                  <label class="flex items-center text-sm font-medium text-gray-700">
                    <input v-model="veiculoEditado.active" type="checkbox" class="mr-2 rounded" />
                    Veículo ativo
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex justify-end space-x-2">
        <button
            @click="fecharModal"
            class="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
        <button
            @click="salvarVeiculo"
            class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Salvar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits, watch } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { VeiculoRanker } from '~/services/veiculoRankerService';

const props = defineProps<{
  isOpen: boolean;
  veiculo: Veiculo | null;
}>();

const emit = defineEmits(['close', 'save']);

// Cria uma cópia do veículo para edição
const veiculoEditado = reactive<Veiculo>({
  id: '',
  descricao: '',
  marca: '',
  ano: '',
  quilometragem: 0,
  sinistro: false,
  lanceInicial: 0,
  lanceAtual: 0,
  valorMercado: 0,
  dataCaptura: new Date(),
  urlOrigem: '',
  active: true
});

// Atualiza os dados do formulário quando o veículo muda
watch(() => props.veiculo, (novoVeiculo) => {
  if (novoVeiculo) {
    Object.assign(veiculoEditado, JSON.parse(JSON.stringify(novoVeiculo)));
  }
}, { immediate: true });

// Funções para incrementar/decrementar quilometragem (10.000 km)
function incrementarQuilometragem() {
  veiculoEditado.quilometragem += 10000;
}

function decrementarQuilometragem() {
  if (veiculoEditado.quilometragem >= 10000) {
    veiculoEditado.quilometragem -= 10000;
  }
}

// Funções para incrementar/decrementar valores (R$ 1.000,00)
function incrementarLanceInicial() {
  veiculoEditado.lanceInicial += 1000;
}

function decrementarLanceInicial() {
  if (veiculoEditado.lanceInicial >= 1000) {
    veiculoEditado.lanceInicial -= 1000;
  }
}

function incrementarLanceAtual() {
  veiculoEditado.lanceAtual += 1000;
}

function decrementarLanceAtual() {
  if (veiculoEditado.lanceAtual >= 1000) {
    veiculoEditado.lanceAtual -= 1000;
  }
}

function incrementarValorMercado() {
  veiculoEditado.valorMercado += 1000;
}

function decrementarValorMercado() {
  if (veiculoEditado.valorMercado >= 1000) {
    veiculoEditado.valorMercado -= 1000;
  }
}

// Calcular o score do veículo
function getScore(): number {
  return VeiculoRanker.calcularScore(veiculoEditado);
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

// Calcula a porcentagem do lance atual em relação ao valor de mercado
function getPorcentagemMercado(): number {
  if (!veiculoEditado.valorMercado) return 0;
  const valorVeiculo = veiculoEditado.lanceAtual > 0 ? veiculoEditado.lanceAtual : veiculoEditado.lanceInicial;
  return Math.round((valorVeiculo / veiculoEditado.valorMercado) * 100);
}

// Classes CSS dinâmicas baseadas na porcentagem do lance
function getPercentageClass(percentage: number): string {
  if (percentage < 50) return 'bg-green-500 text-white font-bold'; // Excelente (destaque maior)
  if (percentage < 60) return 'bg-green-200 text-green-900'; // Muito Bom
  if (percentage < 70) return 'bg-blue-100 text-blue-800'; // Bom
  if (percentage < 80) return 'bg-yellow-100 text-yellow-800'; // Regular
  return 'bg-red-100 text-red-800'; // Ruim
}

// Fecha o modal
function fecharModal() {
  emit('close');
}

// Salvar as alterações
function salvarVeiculo() {
  emit('save', { ...veiculoEditado });
  fecharModal();
}
</script>