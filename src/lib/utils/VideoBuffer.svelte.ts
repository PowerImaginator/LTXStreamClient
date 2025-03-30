export class VideoBuffer {
	private _width: number;
	private _height: number;
	private _frames: ImageBitmap[];

	constructor(width: number, height: number) {
		this._width = width;
		this._height = height;
		this._frames = [];
	}

	pushImageBitmap(frame: ImageBitmap) {
		this._frames.push(frame);
	}

	async pushImageData(frame: ImageData) {
		this._frames.push(await window.createImageBitmap(frame));
	}

	getWidth() {
		return this._width;
	}

	getHeight() {
		return this._height;
	}
}
