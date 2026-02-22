<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="pending" class="flex h-64 items-center justify-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-100 p-4 text-red-700">
      {{ error }}
    </div>

    <template v-else-if="veiculo">
      <div class="mb-6">
        <NuxtLink to="/" class="flex items-center text-blue-600 hover:text-blue-800">
          <svg class="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Voltar para a lista
        </NuxtLink>
      </div>

      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">{{ veiculo.modelo }}</h1>
        <p class="text-gray-600">{{ veiculo.marca }} | {{ veiculo.ano }}</p>
      </div>

      <div class="mb-6 overflow-hidden rounded-lg bg-white shadow">
        <div class="p-6">
          <div class="mb-6 flex flex-wrap items-center justify-between">
            <div class="mb-4 flex items-center md:mb-0">
              <span class="mr-2 rounded-full px-3 py-1 text-sm font-medium" :class="getScoreClass(getScore(veiculo))">
                {{ getScoreIcon(getScore(veiculo)) }} {{ getScore(veiculo).toFixed(1) }}
              </span>
              <span class="text-gray-500">Capturado em {{ new Date(veiculo.dataCaptura).toLocaleString('pt-BR') }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="atualizarVeiculo"
                class="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                :disabled="isRefreshing"
                title="Atualizar lote"
              >
                <Icon :name="isRefreshing ? 'mdi:loading' : 'mdi:refresh'" class="text-lg" :class="{ 'animate-spin': isRefreshing }" />
              </button>
              <a
                v-if="veiculo.urlOrigem"
                :href="veiculo.urlOrigem"
                target="_blank"
                class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Ver no site original
              </a>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h2 class="mb-4 border-b pb-2 text-xl font-semibold">Especificações</h2>
              <dl class="grid grid-cols-2 gap-4">
                <div><dt class="text-sm text-gray-500">Marca</dt><dd>{{ veiculo.marca }}</dd></div>
                <div><dt class="text-sm text-gray-500">Ano</dt><dd>{{ veiculo.ano }}</dd></div>
                <div><dt class="text-sm text-gray-500">Quilometragem</dt><dd>{{ veiculo.quilometragem.toLocaleString('pt-BR') }} km</dd></div>
                <div><dt class="text-sm text-gray-500">Sinistro</dt><dd>{{ veiculo.sinistro }}</dd></div>
                <div><dt class="text-sm text-gray-500">Lote</dt><dd>{{ veiculo.numeroLote || '--' }}</dd></div>
                <div><dt class="text-sm text-gray-500">IPVA</dt><dd>{{ veiculo.ipvaPago ? 'Pago' : 'Por conta do arrematante' }}</dd></div>
              </dl>
            </div>

            <div>
              <h2 class="mb-4 border-b pb-2 text-xl font-semibold">Informações de Leilão</h2>
              <dl class="grid grid-cols-2 gap-4">
                <div><dt class="text-sm text-gray-500">Lance Inicial</dt><dd>R$ {{ formatarValor(veiculo.lanceInicial) }}</dd></div>
                <div><dt class="text-sm text-gray-500">Lance Atual</dt><dd>R$ {{ formatarValor(veiculo.lanceAtual) }}</dd></div>
                <div><dt class="text-sm text-gray-500">Valor de Mercado</dt><dd>R$ {{ formatarValor(veiculo.valorMercado) }}</dd></div>
                <div>
                  <dt class="text-sm text-gray-500">Economia Potencial</dt>
                  <dd class="font-medium" :class="getEconomiaClass(veiculo.valorMercado - veiculo.lanceAtual)">
                    R$ {{ formatarValor(veiculo.valorMercado - veiculo.lanceAtual) }}
                    ({{ Math.round((veiculo.valorMercado - veiculo.lanceAtual) / veiculo.valorMercado * 100) }}%)
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div v-if="breakdown" class="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h2 class="mb-4 border-b border-blue-200 pb-2 text-xl font-semibold">Estimativa de Lucro</h2>
            <div class="space-y-3">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p class="text-sm text-gray-500">Custos Estimados:</p>
                  <ul class="mt-1 space-y-1">
                    <li>Lance Base: R$ {{ formatarValor(breakdown.lance) }}</li>
                    <li>Comissão Leiloeiro: R$ {{ formatarValor(breakdown.custos.comissaoLeilao) }}</li>
                    <li>Taxa Administrativa: R$ {{ formatarValor(breakdown.custos.taxaAdm) }}</li>
                    <li>Despachante: R$ {{ formatarValor(breakdown.custos.taxaDespachante) }}</li>
                    <li>Vistoria: R$ {{ formatarValor(breakdown.custos.taxaVistoria) }}</li>
                    <li>Frete: R$ {{ formatarValor(breakdown.custos.frete) }}</li>
                    <li>IPVA estimado: R$ {{ formatarValor(breakdown.custos.ipva) }}</li>
                  </ul>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Vendas:</p>
                  <ul class="mt-1 space-y-1">
                    <li>Valor de Mercado: R$ {{ formatarValor(veiculo.valorMercado) }}</li>
                    <li>Deságio aplicado ({{ (breakdown.desagioAplicado * 100).toFixed(1) }}%): R$ {{ formatarValor(veiculo.valorMercado * breakdown.desagioAplicado) }}</li>
                    <li>Valor Líquido Projetado: R$ {{ formatarValor(breakdown.valorVendaLiquido) }}</li>
                  </ul>
                </div>
              </div>

              <div class="mt-4 border-t border-blue-200 pt-3">
                <div class="flex items-center justify-between">
                  <span class="font-semibold">Lucro Estimado:</span>
                  <span class="text-lg font-bold" :class="getLucroTextClass(breakdown.roiAjustado)">
                    R$ {{ formatarValor(breakdown.lucroProjetado) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { scrapperService } from '~/services/scrapperService';

const { formatarValor } = useFormatacao();
const { getBreakdown, getScore, getScoreClass, getScoreIcon, getLucroTextClass } = useVeiculoScore();

const route = useRoute();
const id = computed(() => route.params.id);

const { data: response, pending, error, refresh } = await useFetch(`/api/veiculos/${id}`, {
  params: { id },
  transform: (apiResponse: any) => {
    if (!apiResponse || !apiResponse.success || !apiResponse.data) return null;

    return {
      ...apiResponse.data,
      dataCaptura: new Date(apiResponse.data.dataCaptura),
      dataLeilao: apiResponse.data.dataLeilao ? new Date(apiResponse.data.dataLeilao) : undefined,
    };
  },
});

const veiculo = computed(() => response.value);
const isRefreshing = ref(false);
const breakdown = computed(() => (veiculo.value ? getBreakdown(veiculo.value) : null));

function getEconomiaClass(economia: number): string {
  if (economia >= 30000) return 'text-green-600';
  if (economia >= 10000) return 'text-blue-600';
  if (economia >= 5000) return 'text-yellow-600';
  return 'text-gray-600';
}

async function atualizarVeiculo() {
  if (!veiculo.value?.urlOrigem || isRefreshing.value) {
    return;
  }

  try {
    isRefreshing.value = true;
    const dataLeilao = veiculo.value.dataLeilao
      ? new Date(veiculo.value.dataLeilao).toISOString()
      : undefined;
    const result = await scrapperService.executarScrapper(veiculo.value.urlOrigem, dataLeilao);

    if (!result.veiculo) {
      alert('Lote cancelado/descartado.');
      return;
    }

    await refresh();
  } catch (refreshError) {
    console.error('Erro ao atualizar lote:', refreshError);
    alert('Erro ao atualizar lote. Verifique os logs.');
  } finally {
    isRefreshing.value = false;
  }
}
</script>
