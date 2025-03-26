<script lang="ts">
	import { ltxWebSocket } from '$lib/core/LTXWebSocket.svelte';

	import Sidebar from '$lib/components/Sidebar.svelte';
	import VideoPreview from '$lib/components/VideoPreview.svelte';
	import Connect from '$lib/components/Connect.svelte';
	import LoadingSpinner from '$lib/components/icons/LoadingSpinner.svelte';
</script>

{#if ltxWebSocket.connected}
	<div class="flex h-full w-full flex-row gap-1 overflow-hidden bg-neutral-700">
		<div class="h-full w-[320px] flex-none overflow-hidden bg-neutral-900">
			<Sidebar />
		</div>

		<div class="flex flex-auto items-center justify-center overflow-hidden bg-neutral-900">
			<VideoPreview />
		</div>
	</div>
{:else}
	<div class="h-full w-full overflow-hidden">
		<Connect />
	</div>
{/if}

<!--
{#if ltxWebSocket.busy}
	<div
		class="fixed left-0 top-0 flex h-full w-full flex-row items-center justify-center space-x-4 overflow-hidden bg-black/50"
	>
		<div class="h-6 w-6"><LoadingSpinner /></div>
		<div class="text-xl font-bold">Loading...</div>
	</div>
{/if}
-->
