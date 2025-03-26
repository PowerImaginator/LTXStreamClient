<script lang="ts">
	import { appState } from '$lib/core/AppState.svelte';

	let videoEl: HTMLVideoElement | undefined = $state(undefined);

	$effect(() => {
		if (
			videoEl &&
			appState.mostRecentGenerationUrl &&
			typeof appState.mostRecentGenerationSkipFrames !== 'undefined'
		) {
			videoEl.pause();
			videoEl.src = appState.mostRecentGenerationUrl;
			videoEl.currentTime = appState.mostRecentGenerationSkipFrames / appState.frameRate;
			setTimeout(() => {
				videoEl?.play();
			}, 0);
		}
	});
</script>

{#if appState.mostRecentGenerationUrl}
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		autoplay
		muted
		playsinline
		width={appState.width}
		height={appState.height}
		class="rounded-lg border border-neutral-700"
		bind:this={videoEl}
	>
	</video>
{/if}
