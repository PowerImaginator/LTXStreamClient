<script lang="ts">
	import type { VideoBuffer } from '$lib/utils/VideoBuffer.svelte';
	import { onMount } from 'svelte';
	import { preventDefault, stopPropagation } from 'svelte/legacy';
	import LoadingSpinner from './icons/24/LoadingSpinner.svelte';

	let {
		videoBuffer,
		frameRate,
		busy
	}: { videoBuffer: VideoBuffer; frameRate: number; busy: boolean } = $props();

	let canvas: HTMLCanvasElement | null = $state(null);
	let canvasContext: CanvasRenderingContext2D | null = $state(null);
	let playing = $state(true);
	let currentFrame = $state(0);
	let prevTime = $state(performance.now());
	let animationFrameId: number | null = $state(null);

	const redraw = (ctx: CanvasRenderingContext2D, frames: ImageBitmap[], frameIndex: number) => {
		if (videoBuffer.frames.length === 0) {
			ctx.clearRect(0, 0, canvas!.width, canvas!.height);
		} else {
			ctx.drawImage(frames[frameIndex], 0, 0, canvas!.width, canvas!.height);
		}
	};

	$effect(() => {
		if (canvasContext) {
			redraw(canvasContext, videoBuffer.frames, currentFrame);
		}
	});

	const animate = () => {
		if (animationFrameId === null) {
			return;
		}
		animationFrameId = window.requestAnimationFrame(animate);

		const now = performance.now();
		if (playing) {
			const msPerFrame = 1000 / frameRate;
			if (now - prevTime > msPerFrame && currentFrame < videoBuffer.frames.length - 1) {
				prevTime = now;
				++currentFrame;
			}
		} else {
			prevTime = now;
		}
	};

	onMount(() => {
		canvasContext = canvas!.getContext('2d')!;
		animationFrameId = window.requestAnimationFrame(animate);
		return () => {
			if (animationFrameId !== null) {
				window.cancelAnimationFrame(animationFrameId);
			}
			animationFrameId = null;
		};
	});
</script>

<div class="flex flex-none flex-col items-center justify-center">
	<canvas
		bind:this={canvas}
		width={videoBuffer.width}
		height={videoBuffer.height}
		class="rounded-lg bg-black outline outline-neutral-700"
	></canvas>
	{#if videoBuffer.frames.length > 1}
		<div class="mt-4 flex w-full flex-row items-center justify-center">
			<button
				class="flex-none cursor-pointer rounded-full border border-transparent bg-rose-500 px-3 py-1 text-xs transition-colors focus:bg-rose-600 enabled:hover:bg-rose-600 enabled:focus:border-rose-300 disabled:cursor-auto disabled:bg-neutral-700 disabled:text-neutral-400"
				onclick={() => (playing = !playing)}
			>
				{playing ? 'Pause' : 'Play'}
			</button>
			<div
				role="slider"
				tabindex="0"
				aria-valuemin="0"
				aria-valuemax="1"
				aria-valuenow={currentFrame / (videoBuffer.frames.length - 1)}
				class="ml-2 h-full w-full overflow-hidden rounded-full bg-rose-900/50"
				onmousedown={(event: MouseEvent) => {
					event.preventDefault();
					event.stopPropagation();
					const rect = (event.target as HTMLDivElement).getBoundingClientRect();
					const x = (event.clientX - rect.left) / rect.width;
					currentFrame = Math.min(
						Math.floor(x * videoBuffer.frames.length),
						videoBuffer.frames.length - 1
					);
				}}
			>
				<div
					class="h-full bg-rose-500"
					style="width: {(currentFrame / (videoBuffer.frames.length - 1)) * 100}%;"
				></div>
			</div>
		</div>
	{/if}
	{#if busy}
		<div
			class="mt-4 flex flex-none flex-row items-center justify-center space-x-2 rounded-md bg-black/75 px-4 py-2"
		>
			<div class="h-5 w-5 flex-none">
				<LoadingSpinner />
			</div>
			<div class="flex-none">Generating...</div>
		</div>
	{/if}
</div>
