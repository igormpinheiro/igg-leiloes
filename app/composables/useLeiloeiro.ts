// composables/useLeiloeiro.ts

export function useLeiloeiro() {
  function getLeiloeiroInitial(leiloeiro: string | undefined): string {
    if (!leiloeiro) return '?'
    if (leiloeiro.toLowerCase().includes('parque')) return 'P'
    if (leiloeiro.toLowerCase().includes('leilo')) return 'L'
    return leiloeiro.charAt(0).toUpperCase()
  }

  function getLeiloeiroClass(leiloeiro: string | undefined): string {
    if (!leiloeiro) return 'bg-gray-500'
    if (leiloeiro.toLowerCase().includes('parque')) return 'bg-purple-500'
    if (leiloeiro.toLowerCase().includes('leilo')) return 'bg-orange-500'
    return 'bg-gray-500'
  }

  function getActionBadgeClass(action: string): string {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800'
      case 'updated': return 'bg-blue-100 text-blue-800'
      case 'deleted': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getActionLabel(action: string): string {
    switch (action) {
      case 'created': return 'Novo'
      case 'updated': return 'Atualizado'
      case 'deleted': return 'Descartado'
      default: return action
    }
  }

  return {
    getLeiloeiroInitial,
    getLeiloeiroClass,
    getActionBadgeClass,
    getActionLabel,
  }
}
