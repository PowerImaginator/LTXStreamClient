<script lang="ts">
	import { appState } from '$lib/core/AppState.svelte';
	import { ltxWebSocket } from '$lib/core/LTXWebSocket.svelte';
	import Button from './Button.svelte';
	import TextInput from './TextInput.svelte';

	const handleConnect = () => {
		ltxWebSocket.connect(appState.ltxWebSocketUrl);
	};
</script>

<div class="flex h-full w-full flex-col items-center justify-center space-y-4">
	<TextInput
		class="w-full max-w-[480px]"
		placeholder="ws://localhost:8000/ws"
		bind:value={appState.ltxWebSocketUrl}
	/>
	<Button onclick={handleConnect}>Connect</Button>
</div>
