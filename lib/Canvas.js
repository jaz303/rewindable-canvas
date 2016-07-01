module.exports = Canvas;

function Canvas(el) {
    this.el                     = el;
    this.ctx                    = el.getContext('2d');

    this._nextSurrogateColor    = 1;

    // surrogate image 
    this._surrogateImageCanvas  = document.createElement('canvas');
    this._surrogateImageCtx     = this._surrogateImageCanvas.getContext('2d');
    this._surrogateImageLast    = null;
    this._surrogateImageWidth   = 0;
    this._surrogateImageHeight  = 0;
    
}

Canvas.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this._nextSurrogateColor = 1;

}

Canvas.prototype.drawImage = function(img, n1, n2, n3, n4, n5, n6, n7, n8) {
    if (arguments.length === 3) {
        this._blitImage(
            img,
            0, 0, img.width, img.height,
            n1, n2, img.width, img.height
        );
    } else if (arguments.length === 5) {
        this._blitImage(
            img,
            0, 0, img.width, img.height,
            n1, n2, n3, n4
        );
    } else if (arguments.length === 9) {
        this._blitImage(
            img,
            n1, n2, n3, n4,
            n5, n6, n7, n8
        );
    } else {
        throw new Error("drawImage() expects 3, 5 or 9 arguments");
    }
}

Canvas.prototype.drawImageCentered = function(img, n1, n2, n3, n4, n5, n6, n7, n8) {
    if (arguments.length === 3) {
        return this.drawImage(img, n1 - img.width / 2, n2 - img.height / 2);
    } else if (arguments.length === 5) {
        return this.drawImage(img, n1 - n3 / 2, n2 - n4 / 2, n3, n4);
    } else if (arguments.length === 9) {
        return this.drawImage(img, n1, n2, n3, n4, n5 - n7 / 2, n6 - n8 / 2, n7, n8);
    } else {
        throw new Error("drawImageCentered() expects 3, 5 or 9 arguments");
    }
}

Canvas.prototype._blitImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    
    this._blitSurrogateImage(img);

    this.ctx.drawImage(
        img,
        sx, sy, sw, sh,
        dx, dy, dw, dh
    );

    // this.ctx.drawImage(
    //     this._surrogateImageCanvas,
    //     sx, sy, sw, sh,
    //     dx, dy, dw, dh
    // );

}

Canvas.prototype._blitSurrogateImage = function(img) {

    if (this._surrogateImageWidth < img.width) {
        this._surrogateImageCanvas.width = img.width;
    }

    if (this._surrogateImageHeight < img.height) {
        this._surrogateImageCanvas.height = img.height;
    }

    this._surrogateImageCtx.globalCompositeOperation = 'source-over';
    this._surrogateImageCtx.fillStyle = this._generateSurrogateColor();
    this._surrogateImageCtx.fillRect(0, 0, img.width, img.height);

    this._surrogateImageCtx.globalCompositeOperation = 'destination-in';
    this._surrogateImageCtx.drawImage(img, 0, 0);

}

Canvas.prototype._generateSurrogateColor = function() {
    var rawHex = (this._nextSurrogateColor++).toString(16);
    return '#' + ('00000' + rawHex).substr(-6);
}