<script lang="ts">
	import { ltxWebSocket } from '$lib/core/LTXWebSocket.svelte';
	import type { Snippet } from 'svelte';

	interface ButtonProps {
		class?: string;
		disabled?: boolean;
		onclick: (event: Event) => void;
		children: Snippet;
	}

	let props: ButtonProps = $props();
</script>

<button
	class="{props.class || ''} flex-none rounded-md bg-blue-500 px-4 py-2 disabled:bg-neutral-700"
	disabled={props.disabled || ltxWebSocket.busy}
	onclick={props.onclick}
>
	{@render props.children()}
</button>
