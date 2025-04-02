import { Muxer, ArrayBufferTarget } from 'webm-muxer';

export const encodeVideo = async ({
	width,
	height,
	bitRate,
	frameRate,
	frames
}: {
	width: number;
	height: number;
	bitRate: number;
	frameRate: number;
	frames: ImageBitmap[];
}) => {
	const muxer = new Muxer({
		target: new ArrayBufferTarget(),
		video: {
			codec: 'V_VP9',
			width,
			height
		}
	});

	const encoderConfig = {
		codec: 'vp09.00.10.08',
		bitrate: bitRate,
		width,
		height
	};
	const supported = await VideoEncoder.isConfigSupported(encoderConfig);
	if (!supported.supported) {
		throw new Error('Encoder configuration not supported');
	}

	const encoder = new VideoEncoder({
		output: (chunk, meta) => {
			muxer.addVideoChunk(chunk, meta);
		},
		error: (error) => {
			console.error(error);
		}
	});
	encoder.configure(encoderConfig);

	for (let i = 0; i < frames.length; ++i) {
		const frame = new VideoFrame(frames[i], {
			timestamp: i * (1e6 / frameRate)
		});
		encoder.encode(frame, {
			keyFrame: i === 0 || (i - 1) % 8 === 0
		});
		frame.close();
	}

	await encoder.flush();
	muxer.finalize();

	return muxer.target.buffer;
};
