import type { Leiloeiro, Veiculo } from '~/types/veiculo';

function resolverNomeLeiloeiro(leiloeiro: string | Leiloeiro | undefined): string {
  if (!leiloeiro) return '';
  if (typeof leiloeiro === 'string') return leiloeiro;
  return leiloeiro.descricao;
}

export function useLeiloeiro() {
  function getLeiloeiroInitial(leiloeiro: string | Leiloeiro | undefined): string {
    const nome = resolverNomeLeiloeiro(leiloeiro).toLowerCase();
    if (!nome) return '?';
    if (nome.includes('parque')) return 'P';
    if (nome.includes('leilo')) return 'L';
    return nome.charAt(0).toUpperCase();
  }

  function getLeiloeiroClass(leiloeiro: string | Leiloeiro | undefined): string {
    const nome = resolverNomeLeiloeiro(leiloeiro).toLowerCase();
    if (!nome) return 'bg-gray-500';
    if (nome.includes('parque')) return 'bg-sky-600';
    if (nome.includes('leilo')) return 'bg-orange-500';
    return 'bg-gray-500';
  }

  function getLeiloeiroNome(veiculo: Veiculo): string {
    return resolverNomeLeiloeiro(veiculo.leiloeiro) || 'Desconhecido';
  }

  function getActionBadgeClass(action: string): string {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getActionLabel(action: string): string {
    switch (action) {
      case 'created': return 'Novo';
      case 'updated': return 'Atualizado';
      case 'deleted': return 'Descartado';
      default: return action;
    }
  }

  return {
    getLeiloeiroInitial,
    getLeiloeiroClass,
    getLeiloeiroNome,
    getActionBadgeClass,
    getActionLabel,
  };
}
