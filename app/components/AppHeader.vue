<!-- components/AppHeader.vue -->
<template>
  <header class="bg-white shadow">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center py-4">
        <div class="flex items-center">
          <h1 class="text-xl font-bold text-gray-800">LeilãoTracker</h1>
        </div>
        <nav>
          <ul class="flex space-x-6">
            <li>
              <NuxtLink to="/" class="text-gray-600 hover:text-blue-600 transition">Início</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/scrapper" class="text-gray-600 hover:text-blue-600 transition">Scrapper</NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </header>
</template>