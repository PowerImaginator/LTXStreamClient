import { encode as _msgpackEncode, decode as msgpackDecode } from '@msgpack/msgpack';
import { appState } from './AppState.svelte';

const msgpackEncode = (value: any) => {
	const encoded = _msgpackEncode(value);
	return encoded.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
};

export enum LTXWebSocketMessageType {
	CreatePipeline = 'CREATE_PIPELINE',
	SetPipelineArgs = 'SET_PIPELINE_ARGS',
	UpdatePrompt = 'UPDATE_PROMPT',
	UpdateConditioning = 'UPDATE_CONDITIONING',
	Generate = 'GENERATE'
}

export enum LTXWebSocketReceivedMessageType {
	Ready = 'READY',
	Output = 'OUTPUT'
}

export interface LTXWebSocketMessage {
	type: LTXWebSocketMessageType;
	[key: string]: any;
}

export interface LTXWebSocketReceivedMessage {
	type: LTXWebSocketReceivedMessageType;
	[key: string]: any;
}

export interface LTXGeneration {
	url: string;
	frameRate: number;
	framesToSkip: number;
}

export class LTXWebSocket {
	_ws?: WebSocket;
	_messagesToSend: LTXWebSocketMessage[] = [];
	_readyToSend = false;
	_shouldSkipFrames: boolean = false;
	_mostRecentSentMessageId?: number = $state(undefined);
	_mostRecentReceivedMessageId?: number = $state(undefined);

	connected = $state(false);
	busy = $derived(this._mostRecentSentMessageId !== this._mostRecentReceivedMessageId);

	constructor() {
		//
	}

	connect(url: string) {
		if (this._ws) {
			throw new Error('WebSocket connection already exists');
		}

		this._ws = new WebSocket(url);
		this._ws.binaryType = 'arraybuffer';
		this._ws.addEventListener('open', () => this._handleWebSocketOpen());
		this._ws.addEventListener('message', (event: MessageEvent) =>
			this._handleWebSocketMessage(event)
		);
		this._ws.addEventListener('close', () => this._handleWebSocketClose());

		this.sendMessage({
			type: LTXWebSocketMessageType.CreatePipeline
		});
	}

	disconnect() {
		this._ws?.close();
		this.clearMessagesToSendQueue();
	}

	sendMessage(message: LTXWebSocketMessage) {
		if (this._mostRecentSentMessageId === undefined) {
			this._mostRecentSentMessageId = 0;
		}

		const messageWithId = {
			...message,
			id: ++this._mostRecentSentMessageId
		};

		if (this._readyToSend) {
			this._readyToSend = false;
			this._ws?.send(msgpackEncode(messageWithId));
		} else {
			this._messagesToSend.push(messageWithId);
		}
	}

	clearMessagesToSendQueue() {
		this._messagesToSend = [];
	}

	_handleWebSocketOpen() {
		this.connected = true;
		this._sendPendingMessages();
	}

	_handleWebSocketMessage(event: MessageEvent) {
		this._sendPendingMessages();

		const receivedMessage = msgpackDecode(event.data) as LTXWebSocketReceivedMessage;
		this._mostRecentReceivedMessageId = receivedMessage.reply_to;

		if (receivedMessage.type === LTXWebSocketReceivedMessageType.Output) {
			appState.mostRecentGenerationUrl = URL.createObjectURL(
				new Blob([receivedMessage.video_bytes])
			);
			if (this._shouldSkipFrames) {
				appState.mostRecentGenerationSkipFrames = Math.max(
					0,
					appState.numFrames - appState.popLatents * 8
				);
			} else {
				this._shouldSkipFrames = true;
			}

			// FIXME: This is a temporary hack which will be removed in an update
			(window as any)._GENERATE_AGAIN();
		}
	}

	_handleWebSocketClose() {
		this._ws = undefined;
		this._messagesToSend = [];
		this._readyToSend = false;
		this._mostRecentSentMessageId = undefined;
		this._mostRecentReceivedMessageId = undefined;
		this._shouldSkipFrames = false;

		this.connected = false;
	}

	_sendPendingMessages() {
		if (this._messagesToSend.length > 0) {
			const messageToSend = this._messagesToSend.shift();
			if (messageToSend) {
				this._ws?.send(msgpackEncode(messageToSend));
			}
		} else {
			this._readyToSend = true;
		}
	}
}

export const ltxWebSocket = new LTXWebSocket();
