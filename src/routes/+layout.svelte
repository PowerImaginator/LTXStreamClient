<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}

<style lang="postcss">
	@reference "tailwindcss";

	:global(html),
	:global(body) {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	:global(body) {
		background-color: theme(--color-black);
		color: theme(--color-white);
	}
</style>
