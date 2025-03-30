<script lang="ts">
	import ArrowUpTray from '$lib/components/icons/20/ArrowUpTray.svelte';
	import { convertImageUrlToImageData } from '$lib/utils/convertImageUrlToImageData';
	import { LTXWebSocket } from '$lib/utils/LTXWebSocket.svelte';
	import { openImageFile } from '$lib/utils/openImageFile';
	import { VideoBuffer } from '$lib/utils/VideoBuffer.svelte';

	const isValidServerUrl = (urlString: string) => {
		let url: URL | null = null;

		try {
			url = new URL(urlString);
		} catch (error) {
			return false;
		}

		return url.protocol === 'ws:' || url.protocol === 'wss:';
	};

	const validationLabelStyles = (valid: boolean) => {
		if (valid) {
			return 'text-neutral-400';
		} else {
			return 'text-red-500';
		}
	};

	const validationInputStyles = (valid: boolean) => {
		if (valid) {
			return 'border border-white/25 hover:border-white/75 focus:border-white/75';
		} else {
			return 'border border-red-500 hover:border-red-300 focus:border-red-300';
		}
	};

	let serverUrl = $state('ws://localhost:8000/ws');
	let serverUrlValid = $derived(isValidServerUrl(serverUrl));
	let conditionImageUrl: string | null = $state(null);
	let conditionImageUrlValid = $derived(!!conditionImageUrl);
	let width = $state(768);
	let widthValid = $derived(!!width && width % 8 === 0);
	let height = $state(512);
	let heightValid = $derived(!!height && height % 8 === 0);
	let prompt = $state(''),
		prevPrompt = $state('');
	let promptValid = $derived(!!prompt);
	let negativePrompt = $state(''),
		prevNegativePrompt = $state('');
	let negativePromptValid = $derived(true);
	let seed = $state(Math.floor(Math.random() * 999999999));
	let seedValid = $derived(Number.isInteger(seed));
	let chunkFramesToAdd = $state(8);
	let chunkFramesToAddValid = $derived(chunkFramesToAdd >= 8 && chunkFramesToAdd % 8 === 0);
	let chunkTotalFrames = $state(25);
	let chunkTotalFramesValid = $derived(chunkTotalFrames >= 9 && (chunkTotalFrames - 1) % 8 === 0);
	let allValid = $derived(
		serverUrlValid &&
			conditionImageUrlValid &&
			widthValid &&
			heightValid &&
			promptValid &&
			negativePromptValid &&
			seedValid &&
			chunkFramesToAddValid &&
			chunkTotalFramesValid
	);

	let ltxWebSocket: LTXWebSocket | null = $state(null);
	let videoBuffer: VideoBuffer | null = $state(null);

	const handleUpload = async () => {
		const selectedFile = await openImageFile();
		if (!selectedFile) {
			return;
		}
		if (conditionImageUrl) {
			URL.revokeObjectURL(conditionImageUrl);
		}
		conditionImageUrl = URL.createObjectURL(selectedFile!);
	};

	const handleGenerate = async () => {
		if (!ltxWebSocket || ltxWebSocket.getConnectedUrl() !== serverUrl) {
			ltxWebSocket?.disconnect();
			ltxWebSocket = new LTXWebSocket(serverUrl);

			// TODO: Create pipeline
		}

		if (prompt !== prevPrompt || negativePrompt !== prevNegativePrompt) {
			// TODO: Update prompt
			prevPrompt = prompt;
			prevNegativePrompt = negativePrompt;
		}

		if (!videoBuffer || videoBuffer.getWidth() !== width || videoBuffer.getHeight() !== height) {
			videoBuffer = new VideoBuffer(width, height);
			await videoBuffer.pushImageData(
				await convertImageUrlToImageData(conditionImageUrl!, width, height)
			);
		}

		// TODO: Update conditioning

		// TODO: Generate
	};
</script>

<div class="flex h-full w-full flex-row space-x-4 overflow-hidden bg-neutral-900 p-4">
	<div
		class="flex w-[400px] flex-none flex-col items-start justify-start overflow-x-hidden overflow-y-auto rounded-lg bg-neutral-800 px-6 py-4"
	>
		<div class="flex-none text-sm uppercase {validationLabelStyles(conditionImageUrlValid)}">
			Reference Image
		</div>
		<button
			class="relative mt-2 w-full flex-none cursor-pointer overflow-hidden rounded-lg bg-neutral-900 pb-[56.25%] transition-colors hover:bg-neutral-800 focus:bg-neutral-800 {validationInputStyles(
				conditionImageUrlValid
			)}"
			style={conditionImageUrl
				? `background: url("${conditionImageUrl}") no-repeat center center; background-size: cover;`
				: ''}
			onclick={handleUpload}
		>
			<div
				class="absolute top-0 left-0 flex flex h-full w-full items-center justify-center overflow-hidden"
			>
				<div
					class="flex flex-row items-center justify-center space-x-2 rounded-full bg-black/50 px-4 py-2 text-white"
				>
					<div class="size-5 flex-none">
						<ArrowUpTray />
					</div>
					<div class="text-sm">Upload</div>
				</div>
			</div>
		</button>

		{#if !conditionImageUrlValid}
			<div class="mt-2 text-sm text-red-500 italic">Required</div>
		{/if}

		<div class="flex w-full flex-none flex-row space-x-4">
			<div class="flex flex-auto basis-0 flex-col">
				<label
					class="mt-4 flex-none text-sm uppercase {validationLabelStyles(widthValid)}"
					for="width">Width</label
				>
				<input
					class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors hover:bg-neutral-800 focus:bg-neutral-800 {validationInputStyles(
						widthValid
					)}"
					type="number"
					id="width"
					bind:value={width}
				/>
			</div>

			<div class="flex flex-auto basis-0 flex-col">
				<label
					class="mt-4 flex-none text-sm uppercase {validationLabelStyles(heightValid)}"
					for="height">Height</label
				>
				<input
					class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors hover:bg-neutral-800 focus:bg-neutral-800 {validationInputStyles(
						heightValid
					)}"
					type="number"
					id="height"
					bind:value={height}
				/>
			</div>
		</div>

		{#if !widthValid || !heightValid}
			<div class="mt-2 text-sm text-red-500 italic">Width and height must be multiples of 8</div>
		{/if}

		<label
			class="mt-4 flex-none text-sm uppercase {validationLabelStyles(promptValid)}"
			for="prompt">Prompt</label
		>
		<input
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors hover:bg-neutral-800 focus:bg-neutral-800 {validationInputStyles(
				promptValid
			)}"
			id="prompt"
			bind:value={prompt}
		/>

		{#if !promptValid}
			<div class="mt-2 text-sm text-red-500 italic">Required</div>
		{/if}

		<label
			class="mt-4 flex-none text-sm uppercase {validationLabelStyles(negativePromptValid)}"
			for="negative-prompt"
		>
			Negative Prompt
		</label>
		<input
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors hover:bg-neutral-800 focus:bg-neutral-800 {validationInputStyles(
				negativePromptValid
			)}"
			id="negative-prompt"
			bind:value={negativePrompt}
		/>

		<label class="mt-4 flex-none text-sm uppercase {validationLabelStyles(seedValid)}" for="seed"
			>Seed</label
		>
		<input
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors hover:bg-neutral-800 focus:bg-neutral-800 {validationInputStyles(
				seedValid
			)}"
			type="number"
			id="seed"
			bind:value={seed}
		/>

		{#if !seedValid}
			<div class="mt-2 text-sm text-red-500 italic">Must be an integer number</div>
		{/if}

		<label
			class="mt-4 flex-none text-sm uppercase {validationLabelStyles(chunkFramesToAddValid)}"
			for="chunk-frames-to-add"
		>
			Frames To Add (per chunk)
		</label>
		<input
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors hover:bg-neutral-800 focus:bg-neutral-800 {validationInputStyles(
				chunkFramesToAddValid
			)}"
			type="number"
			id="chunk-frames-to-add"
			bind:value={chunkFramesToAdd}
		/>

		{#if !chunkFramesToAddValid}
			<div class="mt-2 text-sm text-red-500 italic">Must be a multiple of 8</div>
		{/if}

		<label
			class="mt-4 flex-none text-sm uppercase {validationLabelStyles(chunkTotalFramesValid)}"
			for="chunk-total-frames"
		>
			Total Frames (per chunk)
		</label>
		<input
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors hover:bg-neutral-800 focus:bg-neutral-800 {validationInputStyles(
				chunkTotalFramesValid
			)}"
			type="number"
			id="chunk-total-frames"
			bind:value={chunkTotalFrames}
		/>

		{#if !chunkTotalFramesValid}
			<div class="mt-2 text-sm text-red-500 italic">
				Must be a multiple of 8, plus 1 (e.g. 9, 17, 25, 33, ...)
			</div>
		{/if}

		<label
			class="mt-4 flex-none text-sm uppercase {validationLabelStyles(serverUrlValid)}"
			for="server-url">Server URL</label
		>
		<input
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors hover:bg-neutral-800 focus:bg-neutral-800 {validationInputStyles(
				serverUrlValid
			)}"
			type="url"
			id="server-url"
			bind:value={serverUrl}
		/>

		{#if !serverUrlValid}
			<div class="mt-2 text-sm text-red-500 italic">Must be a WebSocket (ws: or wss:) URL</div>
		{/if}

		<button
			class="mt-4 w-full flex-none cursor-pointer rounded-full border border-transparent bg-rose-500 px-4 py-2 transition-colors hover:bg-rose-600 focus:border-rose-300 focus:bg-rose-600 disabled:cursor-auto disabled:bg-neutral-600"
			disabled={!allValid}
			onclick={handleGenerate}
		>
			Generate
		</button>
	</div>
</div>
