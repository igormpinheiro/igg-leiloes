<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50 p-4">
    <div class="w-full max-w-4xl rounded-lg bg-white shadow-xl">
      <div class="border-b p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Editar Veículo</h3>
          <button @click="fecharModal" class="text-gray-500 hover:text-gray-700">
            <Icon name="mdi:close" class="text-xl" />
          </button>
        </div>
      </div>

      <div class="p-4">
        <form @submit.prevent="salvarVeiculo">
          <div class="mb-4 grid grid-cols-6 gap-4 rounded-lg bg-gray-50 p-3">
            <div class="text-center">
              <div class="mb-1 text-sm text-gray-600">Score</div>
              <span class="rounded-full px-2 py-1 text-sm font-medium" :class="getScoreClass(getScore(veiculoEditado))">
                {{ getScoreIcon(getScore(veiculoEditado)) }} {{ getScore(veiculoEditado).toFixed(1) }}
              </span>
            </div>
            <div class="text-center">
              <div class="mb-1 text-sm text-gray-600">% Mercado</div>
              <span v-if="veiculoEditado.valorMercado > 0" class="rounded px-2 py-1 text-sm font-medium" :class="getPercentageClass(getPorcentagemMercado(veiculoEditado))">
                {{ getPorcentagemMercado(veiculoEditado) }}%
              </span>
              <span v-else>--</span>
            </div>
            <div class="text-center">
              <div class="mb-1 text-sm text-gray-600">Lucro Est.</div>
              <span v-if="veiculoEditado.valorMercado > 0" class="rounded px-2 py-1 text-sm font-medium" :class="getLucroTextClass(calcularLucroEstimado(veiculoEditado))">
                {{ formatarValor(calcularLucroEstimado(veiculoEditado)) }}
              </span>
              <span v-else>--</span>
            </div>
            <div class="text-center">
              <div class="mb-1 text-sm text-gray-600">ROI</div>
              <span class="rounded px-2 py-1 text-sm font-medium" :class="getRoiClass(calcularRoi(veiculoEditado))">
                {{ calcularRoi(veiculoEditado).toFixed(1) }}%
              </span>
            </div>
            <div class="text-center">
              <div class="mb-1 text-sm text-gray-600">Status</div>
              <span class="rounded px-2 py-1 text-sm font-medium" :class="ativoCalculado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                {{ ativoCalculado ? 'Ativo' : 'Inativo' }}
              </span>
            </div>
            <div class="text-center">
              <div class="mb-1 text-sm text-gray-600">Sinistro</div>
              <span class="rounded px-2 py-1 text-sm font-medium" :class="veiculoEditado.sinistro === TipoSinistro.Nenhum ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ veiculoEditado.sinistro === TipoSinistro.Nenhum ? 'Não' : 'Sim' }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="mb-4">
                <label class="mb-1 block text-sm font-medium text-gray-700">Modelo</label>
                <input v-model="veiculoEditado.modelo" type="text" class="w-full rounded border p-2 focus:ring focus:ring-blue-200" />
              </div>

              <div class="mb-4">
                <label class="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
                <textarea v-model="veiculoEditado.descricao" rows="4" class="w-full rounded border p-2 focus:ring focus:ring-blue-200" />
              </div>

              <div class="mb-4">
                <label class="mb-1 block text-sm font-medium text-gray-700">Marca</label>
                <input v-model="veiculoEditado.marca" type="text" class="w-full rounded border p-2 focus:ring focus:ring-blue-200" />
              </div>

              <div class="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">Ano</label>
                  <input v-model="veiculoEditado.ano" type="text" class="w-full rounded border p-2 focus:ring focus:ring-blue-200" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">Número Lote</label>
                  <input v-model.number="veiculoEditado.numeroLote" type="number" class="w-full rounded border p-2 focus:ring focus:ring-blue-200" />
                </div>
              </div>

              <div class="mb-4">
                <label class="mb-1 block text-sm font-medium text-gray-700">Quilometragem</label>
                <input v-model.number="veiculoEditado.quilometragem" type="number" class="w-full rounded border p-2 focus:ring focus:ring-blue-200" />
              </div>
            </div>

            <div>
              <div class="mb-4">
                <label class="mb-1 block text-sm font-medium text-gray-700">Lance Inicial (R$)</label>
                <input v-model.number="veiculoEditado.lanceInicial" type="number" class="w-full rounded border p-2 focus:ring focus:ring-blue-200" />
              </div>

              <div class="mb-4">
                <label class="mb-1 block text-sm font-medium text-gray-700">Lance Atual (R$)</label>
                <input v-model.number="veiculoEditado.lanceAtual" type="number" class="w-full rounded border p-2 focus:ring focus:ring-blue-200" />
              </div>

              <div class="mb-4">
                <label class="mb-1 block text-sm font-medium text-gray-700">Valor de Mercado (R$)</label>
                <input v-model.number="veiculoEditado.valorMercado" type="number" class="w-full rounded border p-2 focus:ring focus:ring-blue-200" />
              </div>

              <div class="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">Sinistro</label>
                  <select v-model="veiculoEditado.sinistro" class="w-full rounded border p-2 focus:ring focus:ring-blue-200">
                    <option v-for="option in opcoesSinistro" :key="option" :value="option">{{ option }}</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <label class="flex items-center text-sm font-medium text-gray-700">
                    <input v-model="veiculoEditado.ipvaPago" type="checkbox" class="mr-2 rounded" />
                    IPVA pago
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 class="mb-3 text-lg font-semibold text-gray-800">Estimativa de Lucro</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <h4 class="mb-2 text-sm font-medium text-gray-700">Custos</h4>
                <ul class="space-y-1 text-sm">
                  <li class="flex justify-between"><span>Lance:</span><span>R$ {{ formatarValor(lanceBase) }}</span></li>
                  <li class="flex justify-between"><span>Taxa ({{ taxas.comissao }}%):</span><span>R$ {{ formatarValor(valorTaxaLeiloeiro) }}</span></li>
                  <li class="flex justify-between"><span>Taxa administrativa:</span><span>R$ {{ formatarValor(taxas.taxaAdm) }}</span></li>
                  <li class="flex justify-between"><span>Despachante:</span><span>R$ {{ formatarValor(taxas.taxaDespachante) }}</span></li>
                  <li class="flex justify-between"><span>Vistoria:</span><span>R$ {{ formatarValor(taxas.taxaVistoria) }}</span></li>
                  <li class="flex justify-between border-t border-blue-200 pt-1 font-medium"><span>Total Custos:</span><span>R$ {{ formatarValor(custoTotal) }}</span></li>
                </ul>
              </div>

              <div>
                <h4 class="mb-2 text-sm font-medium text-gray-700">Venda</h4>
                <ul class="space-y-1 text-sm">
                  <li class="flex justify-between"><span>Valor de Mercado:</span><span>R$ {{ formatarValor(veiculoEditado.valorMercado) }}</span></li>
                  <li class="flex justify-between"><span>Comissão ({{ comissaoPercent }}%):</span><span>R$ {{ formatarValor(veiculoEditado.valorMercado * CONFIG_NEGOCIO.comissaoVenda) }}</span></li>
                  <li class="flex justify-between border-t border-blue-200 pt-1 font-medium"><span>Valor Líquido:</span><span>R$ {{ formatarValor(valorLiquido) }}</span></li>
                </ul>
              </div>

              <div class="rounded-lg bg-blue-100 p-3">
                <h4 class="mb-2 text-sm font-medium text-gray-700">Resultado</h4>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm"><span>Valor Líquido:</span><span>R$ {{ formatarValor(valorLiquido) }}</span></div>
                  <div class="flex justify-between text-sm"><span>Total Custos:</span><span>R$ {{ formatarValor(custoTotal) }}</span></div>
                  <div class="flex justify-between border-t border-blue-300 pt-2 font-medium"><span>Lucro Estimado:</span><span :class="getLucroTextClass(calcularLucroEstimado(veiculoEditado))">R$ {{ formatarValor(calcularLucroEstimado(veiculoEditado)) }}</span></div>
                  <div class="flex justify-between text-sm"><span>ROI:</span><span :class="getRoiTextClass(calcularRoi(veiculoEditado))">{{ calcularRoi(veiculoEditado).toFixed(1) }}%</span></div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="flex justify-end space-x-2 border-t p-4">
        <button @click="fecharModal" class="rounded bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300">Cancelar</button>
        <button @click="salvarVeiculo" class="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">Salvar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { Veiculo } from '~/types/veiculo';
import { TipoSinistro } from '~/types/veiculo';
import { CONFIG_NEGOCIO } from '~/config/negocio';

const { formatarValor } = useFormatacao();
const { calcularActive } = useDataLeilao();
const {
  getScore,
  getScoreClass,
  getScoreIcon,
  getPercentageClass,
  getPorcentagemMercado,
  calcularLucroEstimado,
  calcularRoi,
  getLucroTextClass,
  getRoiClass,
  getRoiTextClass,
} = useVeiculoScore();

const props = defineProps<{
  isOpen: boolean;
  veiculo: Veiculo | null;
}>();

const emit = defineEmits(['close', 'save']);

const opcoesSinistro = Object.values(TipoSinistro);
const comissaoPercent = CONFIG_NEGOCIO.comissaoVenda * 100;

const veiculoEditado = reactive<Veiculo>({
  id: '',
  modelo: '',
  descricao: '',
  marca: '',
  ano: '',
  quilometragem: 0,
  sinistro: TipoSinistro.Nenhum,
  ipvaPago: true,
  numeroLote: null,
  lanceInicial: 0,
  lanceAtual: 0,
  valorMercado: 0,
  dataCaptura: new Date(),
  urlOrigem: '',
  active: false,
  leiloeiroId: 0,
});

watch(() => props.veiculo, (novoVeiculo) => {
  if (novoVeiculo) {
    Object.assign(veiculoEditado, JSON.parse(JSON.stringify(novoVeiculo)));
  }
}, { immediate: true });

const ativoCalculado = computed(() => calcularActive(veiculoEditado.dataLeilao));
const lanceBase = computed(() => veiculoEditado.lanceAtual > 0 ? veiculoEditado.lanceAtual : veiculoEditado.lanceInicial);

const taxas = computed(() => ({
  comissao: veiculoEditado.leiloeiro?.comissao ?? 5,
  taxaAdm: veiculoEditado.leiloeiro?.taxaAdm ?? 1700,
  taxaDespachante: veiculoEditado.leiloeiro?.taxaDespachante ?? 0,
  taxaVistoria: veiculoEditado.leiloeiro?.taxaVistoria ?? 0,
}));

const valorTaxaLeiloeiro = computed(() => lanceBase.value * (taxas.value.comissao / 100));

const custoTotal = computed(() =>
  lanceBase.value
  + valorTaxaLeiloeiro.value
  + taxas.value.taxaAdm
  + taxas.value.taxaDespachante
  + taxas.value.taxaVistoria,
);

const valorLiquido = computed(() =>
  veiculoEditado.valorMercado - (veiculoEditado.valorMercado * CONFIG_NEGOCIO.comissaoVenda),
);

function fecharModal() {
  emit('close');
}

function salvarVeiculo() {
  emit('save', { ...veiculoEditado });
  fecharModal();
}
</script>
