import { LTXWebSocketMessageType } from './LTXWebSocket.svelte';

export class AppState {
	ltxWebSocketUrl = $state('ws://localhost:8000/ws');

	width = $state(768);
	height = $state(512);
	seed = $state(Math.floor(Math.random() * 999999999));
	prompt = $state(
		'A clear, turquoise river flows through a rocky canyon, cascading over a small waterfall and forming a pool of water at the bottom.The river is the main focus of the scene, with its clear water reflecting the surrounding trees and rocks. The canyon walls are steep and rocky, with some vegetation growing on them. The trees are mostly pine trees, with their green needles contrasting with the brown and gray rocks. The overall tone of the scene is one of peace and tranquility.'
	);
	negativePrompt = $state('worst quality, inconsistent motion, blurry, jittery, distorted');
	numFrames = $state(25);
	frameRate = $state(25);
	numInferenceSteps = $state(25);
	popLatents = $state(2);
	/*
	numFrames = $state(97);
	frameRate = $state(24);
	numInferenceSteps = $state(40);
	popLatents = $state(6);
	*/

	mostRecentGenerationUrl?: string = $state(undefined);
	mostRecentGenerationSkipFrames: number = $state(0);

	constructor() {
		//
	}

	buildSetPipelineArgsMessage() {
		return {
			type: LTXWebSocketMessageType.SetPipelineArgs,
			seed: this.seed,
			pipeline_args: {
				prompt: this.prompt,
				negative_prompt: this.negativePrompt,
				num_frames: this.numFrames,
				frame_rate: this.frameRate,
				num_inference_steps: this.numInferenceSteps
			}
		};
	}

	buildUpdatePromptMessage() {
		return {
			type: LTXWebSocketMessageType.UpdatePrompt
		};
	}

	buildUpdateConditioningMessage({ allowPopLatents }: { allowPopLatents: boolean }) {
		return {
			type: LTXWebSocketMessageType.UpdateConditioning,
			pop_latents: allowPopLatents ? this.popLatents : null
		};
	}

	buildGenerateMessage() {
		return {
			type: LTXWebSocketMessageType.Generate
		};
	}
}

export const appState = new AppState();
