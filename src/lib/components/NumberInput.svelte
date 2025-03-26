<script lang="ts">
	import { ltxWebSocket } from '$lib/core/LTXWebSocket.svelte';

	interface TextInputProps {
		id?: string;
		class?: string;
		disabled?: boolean;
		placeholder?: string;
		value?: number;
	}

	let { value = $bindable(), ...props }: TextInputProps = $props();
</script>

<input
	type="number"
	class="{props.class ||
		''} min-w-0 flex-none rounded-lg border border-neutral-700 bg-neutral-800 p-2"
	id={props.id}
	disabled={props.disabled || ltxWebSocket.busy}
	placeholder={props.placeholder}
	bind:value
/>
