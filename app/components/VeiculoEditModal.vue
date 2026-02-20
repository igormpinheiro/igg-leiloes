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
          <div class="bg-gray-50 p-3 mb-4 rounded-lg grid grid-cols-5 gap-4">
            <!-- Score -->
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Score</div>
              <div>
                <span
                    class="px-2 py-1 text-sm font-medium rounded-full"
                    :class="getScoreClass(getScore(veiculoEditado))"
                >
                  {{ getScoreIcon(getScore(veiculoEditado)) }} {{ getScore(veiculoEditado).toFixed(1) }}
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
                    :class="getPercentageClass(getPorcentagemMercado(veiculoEditado))"
                >
                  {{ getPorcentagemMercado(veiculoEditado) }}%
                </span>
                <span v-else>--</span>
              </div>
            </div>

            <!-- Estimativa de Lucro -->
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Lucro Est.</div>
              <div>
                <span
                    v-if="veiculoEditado.valorMercado > 0"
                    class="px-2 py-1 text-sm font-medium rounded"
                    :class="getLucroTextClass(calcularLucroEstimado(veiculoEditado))"
                >
                  {{ formatarValor(calcularLucroEstimado(veiculoEditado)) }}
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

          <!-- Detalhes da Estimativa de Lucro -->
          <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">Estimativa de Lucro</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Custos -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Custos</h4>
                <ul class="space-y-1 text-sm">
                  <li class="flex justify-between">
                    <span>Lance Atual:</span>
                    <span>R$ {{ formatarValor(veiculoEditado.lanceAtual) }}</span>
                  </li>
                  <li class="flex justify-between">
                    <span>Taxa ({{ taxaPercent }}%):</span>
                    <span>R$ {{ formatarValor(veiculoEditado.lanceAtual * CONFIG_NEGOCIO.taxaLeilao) }}</span>
                  </li>
                  <li class="flex justify-between">
                    <span>Despesas Fixas:</span>
                    <span>R$ {{ formatarValor(CONFIG_NEGOCIO.despesasFixas) }}</span>
                  </li>
                  <li class="flex justify-between font-medium pt-1 border-t border-blue-200">
                    <span>Total Custos:</span>
                    <span>R$ {{ formatarValor(custoTotal) }}</span>
                  </li>
                </ul>
              </div>

              <!-- Venda -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Venda</h4>
                <ul class="space-y-1 text-sm">
                  <li class="flex justify-between">
                    <span>Valor de Mercado:</span>
                    <span>R$ {{ formatarValor(veiculoEditado.valorMercado) }}</span>
                  </li>
                  <li class="flex justify-between">
                    <span>Comissão ({{ comissaoPercent }}%):</span>
                    <span>R$ {{ formatarValor(veiculoEditado.valorMercado * CONFIG_NEGOCIO.comissaoVenda) }}</span>
                  </li>
                  <li class="flex justify-between font-medium pt-1 border-t border-blue-200">
                    <span>Valor Líquido:</span>
                    <span>R$ {{ formatarValor(valorLiquido) }}</span>
                  </li>
                </ul>
              </div>

              <!-- Resultado -->
              <div class="bg-blue-100 rounded-lg p-3">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Resultado</h4>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span>Valor Líquido:</span>
                    <span>R$ {{ formatarValor(valorLiquido) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span>Total Custos:</span>
                    <span>R$ {{ formatarValor(custoTotal) }}</span>
                  </div>
                  <div class="flex justify-between font-medium pt-2 border-t border-blue-300">
                    <span>Lucro Estimado:</span>
                    <span :class="getLucroTextClass(calcularLucroEstimado(veiculoEditado))">
                      R$ {{ formatarValor(calcularLucroEstimado(veiculoEditado)) }}
                    </span>
                  </div>
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
import { reactive, watch, computed } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { CONFIG_NEGOCIO } from '~/config/negocio';

const { formatarValor } = useFormatacao();
const { getScore, getScoreClass, getScoreIcon, getPercentageClass, getPorcentagemMercado, calcularLucroEstimado, getLucroTextClass } = useVeiculoScore();

const props = defineProps<{
  isOpen: boolean;
  veiculo: Veiculo | null;
}>();

const emit = defineEmits(['close', 'save']);

const taxaPercent = CONFIG_NEGOCIO.taxaLeilao * 100;
const comissaoPercent = CONFIG_NEGOCIO.comissaoVenda * 100;

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

watch(() => props.veiculo, (novoVeiculo) => {
  if (novoVeiculo) {
    Object.assign(veiculoEditado, JSON.parse(JSON.stringify(novoVeiculo)));
  }
}, { immediate: true });

const custoTotal = computed(() =>
  veiculoEditado.lanceAtual + (veiculoEditado.lanceAtual * CONFIG_NEGOCIO.taxaLeilao) + CONFIG_NEGOCIO.despesasFixas
);

const valorLiquido = computed(() =>
  veiculoEditado.valorMercado - (veiculoEditado.valorMercado * CONFIG_NEGOCIO.comissaoVenda)
);

function incrementarQuilometragem() { veiculoEditado.quilometragem += 10000; }
function decrementarQuilometragem() { if (veiculoEditado.quilometragem >= 10000) veiculoEditado.quilometragem -= 10000; }
function incrementarLanceInicial() { veiculoEditado.lanceInicial += 1000; }
function decrementarLanceInicial() { if (veiculoEditado.lanceInicial >= 1000) veiculoEditado.lanceInicial -= 1000; }
function incrementarLanceAtual() { veiculoEditado.lanceAtual += 1000; }
function decrementarLanceAtual() { if (veiculoEditado.lanceAtual >= 1000) veiculoEditado.lanceAtual -= 1000; }
function incrementarValorMercado() { veiculoEditado.valorMercado += 1000; }
function decrementarValorMercado() { if (veiculoEditado.valorMercado >= 1000) veiculoEditado.valorMercado -= 1000; }

function fecharModal() { emit('close'); }
function salvarVeiculo() {
  emit('save', { ...veiculoEditado });
  fecharModal();
}
</script>
