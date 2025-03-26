<script lang="ts">
	import type { Snippet } from 'svelte';

	interface LabelProps {
		for?: string;
		class?: string;
		children: Snippet;
	}

	let props: LabelProps = $props();
</script>

<label class="{props.class || ''} flex-none text-sm text-neutral-400" for={props.for}>
	{@render props.children()}
</label>
