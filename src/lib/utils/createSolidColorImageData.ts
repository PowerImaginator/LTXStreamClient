export const convertImageUrlToImageData = (width: number, height: number, color: string) => {
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, width, height);
	return ctx.getImageData(0, 0, width, height);
};
