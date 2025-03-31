export class VideoBuffer {
	width: number;
	height: number;
	frames: ImageBitmap[];
	pendingFrames: ImageBitmap[];

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.frames = [];
		this.pendingFrames = [];
	}
}
