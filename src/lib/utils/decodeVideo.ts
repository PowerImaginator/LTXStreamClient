export const decodeVideo = async (videoBytes: ArrayBuffer) => {
	const frames: VideoFrame[] = [];

	const decoder = new VideoDecoder({
		output: async (frame) => {
			frames.push(frame);
		},
		error: (e) => {
			throw e;
		}
	});

	const file = (window as any).MP4Box.createFile();

	file.onReady = (info: any) => {
		const description = (track: any) => {
			const trak = file.getTrackById(track.id);
			for (const entry of trak.mdia.minf.stbl.stsd.entries) {
				const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
				if (box) {
					const stream = new (window as any).DataStream(
						undefined,
						0,
						(window as any).DataStream.BIG_ENDIAN
					);
					box.write(stream);
					return new Uint8Array(stream.buffer, 8);
				}
			}
			throw new Error('avcC, hvcC, vpcC, or av1C not found');
		};

		const track = info.videoTracks[0];

		decoder.configure({
			codec: track.codec.startsWith('vp08') ? 'vp8' : track.codec,
			codedHeight: track.video.height,
			codedWidth: track.video.width,
			description: description(track)
		});

		file.setExtractionOptions(track.id);
		file.start();
	};

	file.onSamples = (track_id: any, ref: any, samples: any) => {
		for (const sample of samples) {
			const chunk = new EncodedVideoChunk({
				type: sample.is_sync ? 'key' : 'delta',
				timestamp: (1e6 * sample.cts) / sample.timescale,
				duration: (1e6 * sample.duration) / sample.timescale,
				data: sample.data
			});
			decoder.decode(chunk);
		}
	};

	file.onError = (error: Error) => {
		throw error;
	};

	(videoBytes as any).fileStart = 0;
	file.appendBuffer(videoBytes);
	file.flush();

	await decoder.flush();

	const imageBitmaps = [];
	for (const frame of frames) {
		imageBitmaps.push(await window.createImageBitmap(frame));
	}

	return imageBitmaps;
};
