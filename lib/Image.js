module.exports = Image;

function Image(nativeImage) {
	this._canvas = document.createElement('canvas');
	this._canvas.width = nativeImage.width;
	this._canvas.height = nativeImage.height;
}