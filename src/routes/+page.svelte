<script lang="ts">
	import ArrowUpTray from '$lib/components/icons/20/ArrowUpTray.svelte';
	import { convertImageUrlToImageData } from '$lib/utils/convertImageUrlToImageData';
	import { LTXWebSocket, LTXWebSocketMessageType } from '$lib/utils/LTXWebSocket.svelte';
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
			return 'border border-white/25 enabled:hover:border-white/75 enabled:focus:border-white/75';
		} else {
			return 'border border-red-500 enabled:hover:border-red-300 enabled:focus:border-red-300';
		}
	};

	let serverUrl = $state('ws://localhost:8000/ws');
	let serverUrlValid = $derived(isValidServerUrl(serverUrl));
	let conditionImageUrl: string | null = $state(null);
	let conditionImageUrlValid = $derived(!!conditionImageUrl);
	let width = $state(768);
	let widthValid = $derived(!!width && width % 32 === 0);
	let height = $state(512);
	let heightValid = $derived(!!height && height % 32 === 0);
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
	let frameRate = $state(24);
	let frameRateValid = $derived(Number.isInteger(frameRate) && frameRate > 0);
	let bitRate = $state(1e6);
	let bitRateValid = $derived(Number.isInteger(bitRate) && bitRate > 0);
	let numInferenceSteps = $state(25);
	let numInferenceStepsValid = $derived(
		Number.isInteger(numInferenceSteps) && numInferenceSteps > 0
	);
	let allValid = $derived(
		serverUrlValid &&
			conditionImageUrlValid &&
			widthValid &&
			heightValid &&
			promptValid &&
			negativePromptValid &&
			seedValid &&
			chunkFramesToAddValid &&
			chunkTotalFramesValid &&
			frameRateValid &&
			bitRateValid &&
			numInferenceStepsValid
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
		if (!videoBuffer || videoBuffer.width !== width || videoBuffer.height !== height) {
			videoBuffer = new VideoBuffer(width, height);
			videoBuffer.frames = [
				await window.createImageBitmap(
					await convertImageUrlToImageData(conditionImageUrl!, width, height)
				)
			];
		}

		if (!ltxWebSocket || ltxWebSocket.getConnectedUrl() !== serverUrl) {
			ltxWebSocket?.disconnect();
			ltxWebSocket = new LTXWebSocket();
			await ltxWebSocket.connect(serverUrl);
			await ltxWebSocket.sendMessage({
				type: LTXWebSocketMessageType.CreatePipeline
			});
		}

		const conditioningItems = await videoBuffer.prepareConditioningItems({
			chunkTotalFrames,
			chunkFramesToAdd,
			bitRate,
			frameRate
		});

		const pipelineArgsMessage = {
			type: LTXWebSocketMessageType.SetPipelineArgs,
			seed,
			pipeline_args: {
				width,
				height,
				prompt,
				negative_prompt: negativePrompt,
				num_frames: chunkTotalFrames,
				frame_rate: frameRate,
				num_inference_steps: numInferenceSteps,
				conditioning_videos: [conditioningItems.videoBytes],
				conditioning_masks: [conditioningItems.masksBytes],
				conditioning_start_frames: [0]
			}
		};
		await ltxWebSocket.sendMessage(pipelineArgsMessage);

		if (prompt !== prevPrompt || negativePrompt !== prevNegativePrompt) {
			await ltxWebSocket.sendMessage({
				type: LTXWebSocketMessageType.UpdatePrompt
			});
			prevPrompt = prompt;
			prevNegativePrompt = negativePrompt;
		}

		await ltxWebSocket.sendMessage({
			type: LTXWebSocketMessageType.UpdateConditioning
		});

		const generationResult = await ltxWebSocket.sendMessage({
			type: LTXWebSocketMessageType.Generate
		});
		// Decode generationResult.video_bytes, then add its pending frames to the VideoBuffer
		// VideoBuffer should inform the video player that there is more content to be displayed
		// We also need a button to "apply" the pending frames to move them to the VideoBuffer.frames (i.e. used for conditioning) frames array in VideoBuffer
	};
</script>

<div class="flex h-full w-full flex-row overflow-hidden bg-neutral-900 p-4">
	<div
		class="flex w-[400px] flex-none flex-col items-start justify-start overflow-x-hidden overflow-y-auto rounded-lg bg-neutral-800 px-6 py-4"
	>
		<div class="flex-none text-sm uppercase {validationLabelStyles(conditionImageUrlValid)}">
			Reference Image
		</div>
		<button
			class="relative mt-2 w-full flex-none cursor-pointer overflow-hidden rounded-lg bg-neutral-900 pb-[56.25%] transition-colors enabled:hover:bg-neutral-800 enabled:focus:bg-neutral-800 disabled:cursor-auto disabled:opacity-30 {validationInputStyles(
				conditionImageUrlValid
			)}"
			style={conditionImageUrl
				? `background: url("${conditionImageUrl}") no-repeat center center; background-size: cover;`
				: ''}
			disabled={ltxWebSocket?.busy}
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
					class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors enabled:hover:bg-neutral-800 enabled:focus:bg-neutral-800 disabled:opacity-30 {validationInputStyles(
						widthValid
					)}"
					type="number"
					id="width"
					disabled={ltxWebSocket?.busy}
					bind:value={width}
				/>
			</div>

			<div class="flex flex-auto basis-0 flex-col">
				<label
					class="mt-4 flex-none text-sm uppercase {validationLabelStyles(heightValid)}"
					for="height">Height</label
				>
				<input
					class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors enabled:hover:bg-neutral-800 enabled:focus:bg-neutral-800 disabled:opacity-30 {validationInputStyles(
						heightValid
					)}"
					type="number"
					id="height"
					disabled={ltxWebSocket?.busy}
					bind:value={height}
				/>
			</div>
		</div>

		{#if !widthValid || !heightValid}
			<div class="mt-2 text-sm text-red-500 italic">Width and height must be multiples of 32</div>
		{/if}

		<label
			class="mt-4 flex-none text-sm uppercase {validationLabelStyles(promptValid)}"
			for="prompt">Prompt</label
		>
		<input
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors enabled:hover:bg-neutral-800 enabled:focus:bg-neutral-800 disabled:opacity-30 {validationInputStyles(
				promptValid
			)}"
			id="prompt"
			disabled={ltxWebSocket?.busy}
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
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors enabled:hover:bg-neutral-800 enabled:focus:bg-neutral-800 disabled:opacity-30 {validationInputStyles(
				negativePromptValid
			)}"
			id="negative-prompt"
			disabled={ltxWebSocket?.busy}
			bind:value={negativePrompt}
		/>

		<label class="mt-4 flex-none text-sm uppercase {validationLabelStyles(seedValid)}" for="seed"
			>Seed</label
		>
		<input
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors enabled:hover:bg-neutral-800 enabled:focus:bg-neutral-800 disabled:opacity-30 {validationInputStyles(
				seedValid
			)}"
			type="number"
			id="seed"
			disabled={ltxWebSocket?.busy}
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
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors enabled:hover:bg-neutral-800 enabled:focus:bg-neutral-800 disabled:opacity-30 {validationInputStyles(
				chunkFramesToAddValid
			)}"
			type="number"
			id="chunk-frames-to-add"
			disabled={ltxWebSocket?.busy}
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
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors enabled:hover:bg-neutral-800 enabled:focus:bg-neutral-800 disabled:opacity-30 {validationInputStyles(
				chunkTotalFramesValid
			)}"
			type="number"
			id="chunk-total-frames"
			disabled={ltxWebSocket?.busy}
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
			class="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2 transition-colors enabled:hover:bg-neutral-800 enabled:focus:bg-neutral-800 disabled:opacity-30 {validationInputStyles(
				serverUrlValid
			)}"
			type="url"
			id="server-url"
			disabled={ltxWebSocket?.busy}
			bind:value={serverUrl}
		/>

		{#if !serverUrlValid}
			<div class="mt-2 text-sm text-red-500 italic">Must be a WebSocket (ws: or wss:) URL</div>
		{/if}

		<button
			class="mt-4 w-full flex-none cursor-pointer rounded-full border border-transparent bg-rose-500 px-4 py-2 transition-colors focus:bg-rose-600 enabled:hover:bg-rose-600 enabled:focus:border-rose-300 disabled:cursor-auto disabled:bg-neutral-700 disabled:text-neutral-400"
			disabled={!allValid || ltxWebSocket?.busy}
			onclick={handleGenerate}
		>
			Generate
		</button>
	</div>
	<div class="flex flex-auto flex-col items-center justify-center overflow-hidden">
		<!-- Video player -->
	</div>
</div>
