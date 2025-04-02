export const encodeImage = async (imageSource: ImageData) => {
	const canvas = new OffscreenCanvas(imageSource.width, imageSource.height);
	const ctx = canvas.getContext('2d')!;
	ctx.putImageData(imageSource, 0, 0);
	return await canvas.convertToBlob();
};
