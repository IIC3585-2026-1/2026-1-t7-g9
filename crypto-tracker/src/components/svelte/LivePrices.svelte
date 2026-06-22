<script lang="ts">
  import { onMount } from "svelte";
  import {
    CRYPTO_SELECTION_STORAGE_KEY,
    type CryptoChangedDetail,
    type CryptoMarket,
    type CryptoOption,
    type CryptoPrices,
  } from "../../lib/types";

  export let initialCryptos: CryptoMarket[] = [];

  let selectedCryptos: CryptoOption[] = initialCryptos.slice(0, 3);
  let prices: CryptoPrices = {};
  let loading = true;
  let hasFetchError = false;
  let lastUpdated = "";
  let timeoutId: number | undefined;
  let abortController: AbortController | undefined;
  let pollingGeneration = 0;

  $: selectedIds = selectedCryptos.map((coin) => coin.id);
  $: chartMax = Math.max(...selectedIds.map((id) => prices[id]?.usd ?? 0), 1);

  function formatPrice(value: number | undefined) {
    if (typeof value !== "number") {
      return "Sin dato";
    }

    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value > 100 ? 0 : 4,
    }).format(value);
  }

  function formatChange(value: number | undefined) {
    if (typeof value !== "number") {
      return "0.00%";
    }

    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  }

  async function fetchPrices(ids: string[], generation: number) {
    loading = true;
    const controller = new AbortController();
    abortController = controller;

    try {
      const params = new URLSearchParams({
        ids: ids.join(","),
        vs_currencies: "usd",
        include_24hr_change: "true",
      });
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?${params.toString()}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los precios");
      }

      const nextPrices = (await response.json()) as CryptoPrices;

      if (generation !== pollingGeneration) {
        return;
      }

      prices = nextPrices;
      hasFetchError = false;
      lastUpdated = new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date());
    } catch {
      if (generation === pollingGeneration) {
        hasFetchError = true;
      }
    } finally {
      if (abortController === controller) {
        abortController = undefined;
      }

      if (generation === pollingGeneration) {
        loading = false;
      }
    }
  }

  function stopPolling() {
    pollingGeneration += 1;

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    abortController?.abort();
    abortController = undefined;
  }

  async function pollPrices(ids: string[], generation: number) {
    await fetchPrices(ids, generation);

    if (generation === pollingGeneration) {
      timeoutId = window.setTimeout(
        () => void pollPrices(ids, generation),
        5000
      );
    }
  }

  function restartPolling() {
    stopPolling();

    const generation = pollingGeneration;
    const ids = selectedCryptos.map((coin) => coin.id);

    if (ids.length === 0) {
      prices = {};
      loading = false;
      hasFetchError = false;
      return;
    }

    void pollPrices(ids, generation);
  }

  function applySelection(detail: CryptoChangedDetail) {
    selectedCryptos = detail.selectedCryptos;
    restartPolling();
  }

  function handleCryptoChanged(event: CustomEvent<CryptoChangedDetail>) {
    applySelection(event.detail);
  }

  function isCryptoChangedDetail(value: unknown): value is CryptoChangedDetail {
    if (!value || typeof value !== "object") {
      return false;
    }

    const detail = value as Partial<CryptoChangedDetail>;

    return (
      Array.isArray(detail.selectedIds) &&
      detail.selectedIds.every((id) => typeof id === "string") &&
      Array.isArray(detail.selectedCryptos) &&
      detail.selectedCryptos.every(
        (coin) =>
          coin !== null &&
          typeof coin === "object" &&
          typeof coin.id === "string" &&
          typeof coin.symbol === "string" &&
          typeof coin.name === "string" &&
          typeof coin.image === "string"
      )
    );
  }

  function restoreStoredSelection() {
    let storedSelection: string | null = null;

    try {
      storedSelection = sessionStorage.getItem(
        CRYPTO_SELECTION_STORAGE_KEY
      );
    } catch {
      restartPolling();
      return;
    }

    if (!storedSelection) {
      restartPolling();
      return;
    }

    try {
      const detail: unknown = JSON.parse(storedSelection);

      if (isCryptoChangedDetail(detail)) {
        applySelection(detail);
        return;
      }
    } catch {
      // Invalid JSON is handled below by discarding the stored value.
    }

    try {
      sessionStorage.removeItem(CRYPTO_SELECTION_STORAGE_KEY);
    } catch {
      // Storage may be disabled; initial data still keeps the island usable.
    }

    restartPolling();
  }

  onMount(() => {
    window.addEventListener("crypto-changed", handleCryptoChanged);
    restoreStoredSelection();

    return () => {
      window.removeEventListener("crypto-changed", handleCryptoChanged);
      stopPolling();
    };
  });
</script>

<div class="space-y-5">
  <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p class="text-sm text-slate-400">Polling cada 5 segundos con CoinGecko</p>
      <p class="text-sm text-slate-500">
        {lastUpdated ? `Ultima actualizacion: ${lastUpdated}` : "Esperando datos..."}
      </p>
    </div>

    <div class="text-sm text-slate-400">
      {#if loading}
        Actualizando...
      {:else if hasFetchError && lastUpdated}
        Reintentando...
      {:else if hasFetchError}
        Esperando conexion...
      {:else}
        En vivo
      {/if}
    </div>
  </div>

  {#if selectedCryptos.length === 0}
    <p class="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
      Selecciona al menos una criptomoneda en la isla Vue.
    </p>
  {:else}
    <div class="grid gap-3 lg:grid-cols-3">
      {#each selectedCryptos as coin}
        {@const price = prices[coin.id]}
        {@const change = price?.usd_24h_change ?? 0}
        <article class="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div class="flex items-center gap-3">
            <img src={coin.image} alt={coin.name} class="h-9 w-9" />
            <div class="min-w-0">
              <h3 class="truncate font-semibold text-white">{coin.name}</h3>
              <p class="text-xs uppercase text-slate-400">{coin.symbol}</p>
            </div>
          </div>

          <p class="mt-4 text-2xl font-bold text-cyan-300">
            {formatPrice(price?.usd)}
          </p>

          <p class:text-emerald-300={change >= 0} class:text-rose-300={change < 0} class="mt-1 text-sm">
            {formatChange(change)} en 24h
          </p>

          <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              class="h-full rounded-full bg-cyan-400 transition-all duration-500"
              style={`width: ${Math.max(((price?.usd ?? 0) / chartMax) * 100, 6)}%`}
            ></div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>
