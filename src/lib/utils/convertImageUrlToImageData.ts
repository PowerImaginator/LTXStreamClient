export const convertImageUrlToImageData = (
	imageUrl: string,
	width: number,
	height: number
): Promise<ImageData> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.addEventListener('load', () => {
			const canvas = new OffscreenCanvas(width, height);
			const ctx = canvas.getContext('2d')!;
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, width, height);
			const hRatio = width / img.width;
			const vRatio = height / img.height;
			const ratio = Math.max(hRatio, vRatio);
			const posX = (width - img.width * ratio) / 2;
			const posY = (height - img.height * ratio) / 2;
			ctx.drawImage(
				img,
				0,
				0,
				img.width,
				img.height,
				posX,
				posY,
				img.width * ratio,
				img.height * ratio
			);
			resolve(ctx.getImageData(0, 0, width, height));
		});
		img.addEventListener('error', () => {
			reject(new Error('convertImageUrlToImageData failed'));
		});
		img.src = imageUrl;
	});
};
