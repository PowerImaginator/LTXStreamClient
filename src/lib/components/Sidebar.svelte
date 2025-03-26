<script lang="ts">
	import { appState } from '$lib/core/AppState.svelte';
	import { ltxWebSocket } from '$lib/core/LTXWebSocket.svelte';
	import Button from './Button.svelte';
	import Label from './Label.svelte';
	import NumberInput from './NumberInput.svelte';
	import TextInput from './TextInput.svelte';

	/*
	let hasConfigured = $state(false);
	let hasGenerated = $state(false);

	const validateConfiguration = () => {
		const errors: string[] = [];

		if (appState.numFrames != Math.floor(appState.numFrames / 8) * 8 + 1) {
			errors.push('Number of frames must be a multiple of 8, plus 1 (e.g. 9, 17, 25, etc.)');
		}
		if (appState.popLatents >= appState.numFrames / 8) {
			errors.push(`Pop latents must be less than number of frames divided by 8`);
		}

		if (errors.length > 0) {
			window.alert(errors.join('\n\n'));
			return false;
		} else {
			return true;
		}
	};

	const handleConfigure = () => {
		if (!validateConfiguration()) {
			return;
		}

		ltxWebSocket.sendMessage(appState.buildSetPipelineArgsMessage());
		ltxWebSocket.sendMessage(appState.buildUpdatePromptMessage());
		hasConfigured = true;
	};

	const handleGenerate = () => {
		if (!validateConfiguration()) {
			return;
		}

		ltxWebSocket.sendMessage(
			appState.buildUpdateConditioningMessage({ allowPopLatents: hasGenerated })
		);
		ltxWebSocket.sendMessage(appState.buildGenerateMessage());
		hasGenerated = true;
	};
	*/

	let hasGenerated = $state(false);

	const handleGenerate = () => {
		const generate = () => {
			ltxWebSocket.sendMessage(appState.buildSetPipelineArgsMessage());
			ltxWebSocket.sendMessage(appState.buildUpdatePromptMessage());
			ltxWebSocket.sendMessage(
				appState.buildUpdateConditioningMessage({ allowPopLatents: hasGenerated })
			);
			ltxWebSocket.sendMessage(appState.buildGenerateMessage());
			hasGenerated = true;
		};
		// FIXME: This is a temporary hack which will be removed in an update
		(window as any)._GENERATE_AGAIN = () => {
			generate();
		};
		generate();
	};
</script>

<div class="flex h-full w-full flex-col items-start justify-start p-4">
	<Label for="prompt">Prompt</Label>
	<TextInput id="prompt" class="mt-2 w-full" bind:value={appState.prompt} />
	<Label for="negative-prompt" class="mt-4">Negative Prompt</Label>
	<TextInput id="negative-prompt" class="mt-2 w-full" bind:value={appState.negativePrompt} />
	<Label for="seed" class="mt-4">Seed</Label>
	<NumberInput id="seed" class="mt-2 w-full" bind:value={appState.seed} />
	<!--
	<Label for="num-frames" class="mt-4">Frame count</Label>
	<NumberInput id="num-frames" class="mt-2 w-full" bind:value={appState.numFrames} />
	<Label for="frame-rate" class="mt-4">Frame rate</Label>
	<NumberInput id="frame-rate" class="mt-2 w-full" bind:value={appState.frameRate} />
	<Label for="num-inference-steps" class="mt-4">Steps</Label>
	<NumberInput
		id="num-inference-steps"
		class="mt-2 w-full"
		bind:value={appState.numInferenceSteps}
	/>
	<Label for="pop-latents" class="mt-4">Pop latents</Label>
	<NumberInput id="pop-latents" class="mt-2 w-full" bind:value={appState.numInferenceSteps} />
	<Button class="mt-4 w-full" onclick={handleConfigure}>Configure</Button>
	-->
	<Button class="mt-4 w-full" onclick={handleGenerate}>Generate</Button>
</div>
