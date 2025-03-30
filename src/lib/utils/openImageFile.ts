export const openImageFile = (): Promise<File | null> => {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.style.display = 'none';

		input.addEventListener('change', () => {
			if (!input.files?.length) {
				resolve(null);
				return;
			}

			const file = input.files[0];
			if (file.type.indexOf('image/') === -1) {
				resolve(null);
				return;
			}

			resolve(file);
		});

		document.body.appendChild(input);
		input.click();
		document.body.removeChild(input);
	});
};
