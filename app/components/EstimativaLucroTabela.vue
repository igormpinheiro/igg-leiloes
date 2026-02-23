<template>
  <section class="rounded-lg border border-blue-200 bg-blue-50 p-4">
    <h3 class="mb-3 text-base font-semibold text-gray-800">{{ titulo }}</h3>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <h4 class="mb-2 text-sm font-medium text-gray-700">Custos</h4>
        <ul class="space-y-1 text-sm">
          <li class="flex justify-between"><span>Lance:</span><span>R$ {{ formatarValor(breakdown.lance) }}</span></li>
          <li class="flex justify-between"><span>Comissão leiloeiro:</span><span>R$ {{ formatarValor(breakdown.custos.comissaoLeilao) }}</span></li>
          <li class="flex justify-between"><span>Taxa administrativa:</span><span>R$ {{ formatarValor(breakdown.custos.taxaAdm) }}</span></li>
          <li class="flex justify-between"><span>Despachante:</span><span>R$ {{ formatarValor(breakdown.custos.taxaDespachante) }}</span></li>
          <li class="flex justify-between"><span>Vistoria:</span><span>R$ {{ formatarValor(breakdown.custos.taxaVistoria) }}</span></li>
          <li class="flex justify-between"><span>Frete:</span><span>R$ {{ formatarValor(breakdown.custos.frete) }}</span></li>
          <li class="flex justify-between"><span>IPVA estimado:</span><span>R$ {{ formatarValor(breakdown.custos.ipva) }}</span></li>
          <li class="flex justify-between border-t border-blue-200 pt-1 font-medium"><span>Total Custos:</span><span>R$ {{ formatarValor(breakdown.custoTotal) }}</span></li>
        </ul>
      </div>

      <div>
        <h4 class="mb-2 text-sm font-medium text-gray-700">Venda</h4>
        <ul class="space-y-1 text-sm">
          <li class="flex justify-between"><span>Valor de Mercado:</span><span>R$ {{ formatarValor(valorMercado) }}</span></li>
          <li class="flex justify-between"><span>Deságio aplicado ({{ (breakdown.desagioAplicado * 100).toFixed(1) }}%):</span><span>R$ {{ formatarValor(valorMercado * breakdown.desagioAplicado) }}</span></li>
          <li class="flex justify-between border-t border-blue-200 pt-1 font-medium"><span>Valor Líquido:</span><span>R$ {{ formatarValor(breakdown.valorVendaLiquido) }}</span></li>
        </ul>
      </div>

      <div class="rounded-lg bg-blue-100 p-3">
        <h4 class="mb-2 text-sm font-medium text-gray-700">Resultado</h4>
        <div class="space-y-2">
          <div class="flex justify-between text-sm"><span>Valor Líquido:</span><span>R$ {{ formatarValor(breakdown.valorVendaLiquido) }}</span></div>
          <div class="flex justify-between text-sm"><span>Total Custos:</span><span>R$ {{ formatarValor(breakdown.custoTotal) }}</span></div>
          <div class="flex justify-between border-t border-blue-300 pt-2 font-medium"><span>Lucro Estimado:</span><span :class="getLucroTextClass(breakdown.roiAjustado)">R$ {{ formatarValor(breakdown.lucroProjetado) }}</span></div>
          <div class="flex justify-between text-sm"><span>ROI:</span><span :class="getRoiTextClass(breakdown.roiAjustado)">{{ breakdown.roiAjustado.toFixed(1) }}%</span></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { VeiculoBreakdown } from '~/services/veiculoRankerService';

defineProps<{
  titulo: string;
  valorMercado: number;
  breakdown: VeiculoBreakdown;
}>();

const { formatarValor } = useFormatacao();
const { getLucroTextClass, getRoiTextClass } = useVeiculoScore();
</script>
