<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  CRYPTO_SELECTION_STORAGE_KEY,
  type CryptoChangedDetail,
  type CryptoOption,
} from "../../lib/types";

const props = defineProps<{
  cryptos: CryptoOption[];
}>();

const query = ref("");
const selectedIds = ref<string[]>([]);

const filteredCryptos = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();

  if (!normalizedQuery) {
    return props.cryptos;
  }

  return props.cryptos.filter((coin) => {
    return (
      coin.name.toLowerCase().includes(normalizedQuery) ||
      coin.symbol.toLowerCase().includes(normalizedQuery)
    );
  });
});

function emitSelection() {
  const selectedCryptos = props.cryptos.filter((coin) =>
    selectedIds.value.includes(coin.id)
  );
  const detail: CryptoChangedDetail = {
    selectedIds: [...selectedIds.value],
    selectedCryptos,
  };

  try {
    sessionStorage.setItem(
      CRYPTO_SELECTION_STORAGE_KEY,
      JSON.stringify(detail)
    );
  } catch {
    // The custom event remains the primary channel if storage is unavailable.
  }

  window.dispatchEvent(
    new CustomEvent<CryptoChangedDetail>("crypto-changed", { detail })
  );
}

function resetSelection() {
  selectedIds.value = props.cryptos.slice(0, 3).map((coin) => coin.id);
}

onMounted(() => {
  resetSelection();
});

watch(selectedIds, emitSelection, { deep: true });
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <label class="block flex-1">
        <span class="text-sm font-medium text-slate-300">Buscar cripto</span>
        <input
          v-model="query"
          class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
          type="search"
          placeholder="Bitcoin, ETH, Solana..."
        />
      </label>

      <button
        class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
        type="button"
        @click="resetSelection"
      >
        Reiniciar
      </button>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label
        v-for="coin in filteredCryptos"
        :key="coin.id"
        class="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 transition hover:border-cyan-500"
        :class="{ 'border-cyan-400 bg-cyan-950/30': selectedIds.includes(coin.id) }"
      >
        <input
          v-model="selectedIds"
          class="h-4 w-4 accent-cyan-400"
          type="checkbox"
          :value="coin.id"
        />
        <img :src="coin.image" :alt="coin.name" class="h-8 w-8" />
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold text-white">
            {{ coin.name }}
          </span>
          <span class="block text-xs uppercase text-slate-400">
            {{ coin.symbol }}
          </span>
        </span>
      </label>
    </div>

    <p class="text-sm text-slate-400">
      {{ selectedIds.length }} criptomonedas seleccionadas. Esta isla Vue emite
      el evento <code class="text-cyan-300">crypto-changed</code>.
    </p>
  </div>
</template>
