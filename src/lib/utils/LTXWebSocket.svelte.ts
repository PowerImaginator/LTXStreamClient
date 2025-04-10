import { encode as _msgpackEncode, decode as msgpackDecode } from '@msgpack/msgpack';

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

export class LTXWebSocket {
	connected = $state(false);
	busy = $state(false);

	private _url?: string;
	private _ws?: WebSocket;
	private _messageCallback?: (message: LTXWebSocketReceivedMessage) => void = undefined;

	constructor() {
		//
	}

	connect(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this._url = url;
			this._ws = new WebSocket(this._url);
			this._ws.binaryType = 'arraybuffer';
			this._ws.addEventListener('open', () => {
				this._handleWebSocketOpen();
				resolve();
			});
			this._ws.addEventListener('message', (event: MessageEvent) =>
				this._handleWebSocketMessage(event)
			);
			this._ws.addEventListener('close', () => this._handleWebSocketClose());
			this._ws.addEventListener('error', () => {
				window.alert(
					'Unable to connect to the server - please ensure you entered the correct Server URL (e.g. http://127.0.0.1:8000/ws)'
				);
			});
		});
	}

	disconnect() {
		this._ws?.close();
	}

	sendMessage(message: LTXWebSocketMessage): Promise<LTXWebSocketReceivedMessage> {
		return new Promise((resolve, reject) => {
			if (this.busy) {
				reject(
					new Error(
						'LTXWebSocket is busy - did you forget to await a previous sendMessage(...) call?'
					)
				);
				return;
			}

			this.busy = true;
			this._messageCallback = resolve;
			const encoded = msgpackEncode(message);
			this._ws?.send(encoded);
		});
	}

	getConnectedUrl() {
		return this._url;
	}

	_handleWebSocketOpen() {
		this.connected = true;
	}

	_handleWebSocketMessage(event: MessageEvent) {
		this.busy = false;
		const message = msgpackDecode(event.data) as LTXWebSocketReceivedMessage;
		this._messageCallback?.(message);
	}

	_handleWebSocketClose() {
		this._url = undefined;
		this._ws = undefined;
		this._messageCallback = undefined;
		this.connected = false;
		this.busy = false;
	}
}
