import { createSolidColorImageData } from './createSolidColorImageData';
import { encodeImage } from './encodeImage';
import { encodeVideo } from './encodeVideo';

export class VideoBuffer {
	width: number;
	height: number;
	frames: ImageBitmap[];
	pendingFrames: ImageBitmap[];

	private _blackFrame?: ImageBitmap;
	private _grayFrame?: ImageBitmap;
	private _whiteFrame?: ImageBitmap;
	private _blackBlob?: Blob;
	private _grayBlob?: Blob;
	private _whiteBlob?: Blob;
	private _blackBytes?: Uint8Array;
	private _grayBytes?: Uint8Array;
	private _whiteBytes?: Uint8Array;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.frames = [];
		this.pendingFrames = [];
	}

	async prepareConditioningItems({
		chunkTotalFrames,
		chunkFramesToAdd,
		bitRate,
		frameRate
	}: {
		chunkTotalFrames: number;
		chunkFramesToAdd: number;
		bitRate: number;
		frameRate: number;
	}) {
		await this._initPlaceholderFrames();

		const numWantedConditioningFrames = chunkTotalFrames - chunkFramesToAdd;
		const videoFrames = this.frames.slice(-numWantedConditioningFrames);
		const numAvailableConditioningFrames = videoFrames.length;

		const numTotalLatents = 1 + Math.floor(chunkTotalFrames / 8);
		const numAvailableConditioningLatents = 1 + Math.floor(numAvailableConditioningFrames / 8);

		for (let i = numAvailableConditioningFrames; i < chunkTotalFrames; ++i) {
			videoFrames.push(this._grayFrame!);
		}

		const masksBytes: Uint8Array[] = [];
		for (let i = 0; i < numAvailableConditioningLatents; ++i) {
			masksBytes.push(this._whiteBytes!);
		}
		for (let i = numAvailableConditioningLatents; i < numTotalLatents; ++i) {
			masksBytes.push(this._blackBytes!);
		}

		const videoBytes = new Uint8Array(
			await encodeVideo({
				width: this.width,
				height: this.height,
				bitRate,
				frameRate,
				frames: videoFrames
			})
		);

		return {
			videoBytes,
			masksBytes
		};
	}

	private async _initPlaceholderFrames() {
		if (
			!this._blackFrame ||
			this._blackFrame.width !== this.width ||
			this._blackFrame.height !== this.height
		) {
			const imageData = createSolidColorImageData(this.width / 32, this.height / 32, '#000');
			this._blackFrame = await window.createImageBitmap(imageData);
			this._blackBlob = await encodeImage(imageData);
			this._blackBytes = new Uint8Array(await this._blackBlob.arrayBuffer());
		}

		if (
			!this._grayFrame ||
			this._grayFrame.width !== this.width ||
			this._grayFrame.height !== this.height
		) {
			const imageData = createSolidColorImageData(
				this.width / 32,
				this.height / 32,
				'rgb(127, 127, 127)'
			);
			this._grayFrame = await window.createImageBitmap(imageData);
			this._grayBlob = await encodeImage(imageData);
			this._grayBytes = new Uint8Array(await this._grayBlob.arrayBuffer());
		}

		if (
			!this._whiteFrame ||
			this._whiteFrame.width !== this.width ||
			this._whiteFrame.height !== this.height
		) {
			const imageData = createSolidColorImageData(this.width / 32, this.height / 32, '#fff');
			this._whiteFrame = await window.createImageBitmap(imageData);
			this._whiteBlob = await encodeImage(imageData);
			this._whiteBytes = new Uint8Array(await this._whiteBlob.arrayBuffer());
		}
	}
}
