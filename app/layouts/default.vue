<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-gray-100">
    <AppHeader />
    <main>
      <slot />
    </main>
    <footer class="bg-white mt-8 py-4 border-t">
      <div class="container mx-auto px-4">
        <p class="text-center text-gray-500 text-sm">
          &copy; {{ new Date().getFullYear() }} LeilãoTracker - Todos os direitos reservados
        </p>
      </div>
    </footer>
  </div>
</template>