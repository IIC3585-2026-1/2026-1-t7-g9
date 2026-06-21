<script>
  import { onMount } from "svelte";

  export let initialCryptos = [];

  let selectedCryptos = initialCryptos.slice(0, 3);
  let prices = {};
  let loading = true;
  let hasFetchError = false;
  let lastUpdated = "";
  let intervalId;

  $: selectedIds = selectedCryptos.map((coin) => coin.id);
  $: chartMax = Math.max(...selectedIds.map((id) => prices[id]?.usd ?? 0), 1);

  function formatPrice(value) {
    if (typeof value !== "number") {
      return "Sin dato";
    }

    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value > 100 ? 0 : 4,
    }).format(value);
  }

  function formatChange(value) {
    if (typeof value !== "number") {
      return "0.00%";
    }

    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  }

  async function fetchPrices() {
    if (selectedIds.length === 0) {
      prices = {};
      loading = false;
      hasFetchError = false;
      return;
    }

    loading = true;

    try {
      const params = new URLSearchParams({
        ids: selectedIds.join(","),
        vs_currencies: "usd",
        include_24hr_change: "true",
      });
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los precios");
      }

      prices = await response.json();
      hasFetchError = false;
      lastUpdated = new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date());
    } catch {
      hasFetchError = true;
    } finally {
      loading = false;
    }
  }

  function restartPolling() {
    if (intervalId) {
      window.clearInterval(intervalId);
    }

    fetchPrices();
    intervalId = window.setInterval(fetchPrices, 5000);
  }

  function handleCryptoChanged(event) {
    selectedCryptos = event.detail.selectedCryptos;
    restartPolling();
  }

  onMount(() => {
    window.addEventListener("crypto-changed", handleCryptoChanged);
    restartPolling();

    return () => {
      window.removeEventListener("crypto-changed", handleCryptoChanged);

      if (intervalId) {
        window.clearInterval(intervalId);
      }
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
