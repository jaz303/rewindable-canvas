module.exports = createCanvas;

// TODO: improve architecture

// TODO: handle resizing of canvas (?)
// TODO: highlight effect of given state

// TODO: snapshots (w. configurable frequency)

// TODO: operations :-
//  - pen, fill config
//  - matrix operations
//  - save/restore
//  - advanced image operations
//  - clear
//  - moveTo, lineTo, line
//  - polyline, polygon (just an array of points for now)
//  - gradients

function createCanvas(el) {
	return new Canvas(el);
}

//
//

function Canvas(el) {
	this.el = el;
	this.ctx = el.getContext('2d');

	var self = this;
	this.el.addEventListener('click', function(evt) {
		if (self.onSelect) {
			var ix = self.surrogate.getOperationIndexAtPixel(evt.offsetX, evt.offsetY);
			if (ix !== null) {
				self.onSelect(ix);
			}
		}
	});

	this.surrogate = new SurrogateCanvas(this.width, this.height);
	this.record = [];
}

Canvas.prototype.reset = function() {
	this.ctx.resetTransform();
	this.ctx.clearRect(0, 0, this.width, this.height);
	this.surrogate.reset();
}

Canvas.prototype.startScrubbing = function() {
	console.log("scrubbing started");
}

Canvas.prototype.endScrubbing = function() {

}

Canvas.prototype.scrubTo = function(ix) {
	this.reset();
	var rawIx = 0;
	while (rawIx < this.record.length && this.record[rawIx][0] <= ix) {
		var r = this.record[rawIx];
		r[1].apply(this, r[3]);
		if (r[2]) {
			var sargs = [r[0]].concat(r[3]);
			r[2].apply(this.surrogate, sargs);
		}
		rawIx++;
	}
}

Object.defineProperty(Canvas.prototype, 'width', {
	get: function() {
		return this.el.width;
	}
});

Object.defineProperty(Canvas.prototype, 'height', {
	get: function() {
		return this.el.height;
	}
});

//
//

function SurrogateCanvas(width, height) {
	this.el = document.createElement('canvas');
	this.el.width = width;
	this.el.height = height;
	this.ctx = this.el.getContext('2d');
	this.ctx.imageSmoothingEnabled = false;
	this.dirty = true;
	this.data = null;

	this.tmpImage = document.createElement('canvas');
	this.tmpImage.imageSmoothingEnabled = false;
	this.tmpImage.width = 0;
	this.tmpImage.height = 0;
	this.tmpImageCtx = this.tmpImage.getContext('2d');
}

SurrogateCanvas.prototype.reset = function() {
	this.ctx.resetTransform();
	this.ctx.clearRect(0, 0, this.el.width, this.el.height);
}

SurrogateCanvas.prototype.getOperationIndexAtPixel = function(x, y) {
	if (this.dirty) {
		this.dirty = false;
		this.data = this.ctx.getImageData(0, 0, this.el.width, this.el.height).data;
	}
	var d = this.data;
	var base = ((y * this.el.width) + x) * 4;
	if (d[base+3] === 0) {
		return null;
	} else {
		return (d[base] << 16) | (d[base+1] << 8) | d[base+2];
	}
}

SurrogateCanvas.prototype.scale = function(ix, sx, sy) {
	this.ctx.scale(sx, sy);
}

SurrogateCanvas.prototype.fillRect = function(ix, x, y, w, h) {
	this._setFill(ix);
	this.ctx.fillRect(x, y, w, h);
	this.dirty = true;
}

SurrogateCanvas.prototype.fillCircle = function(ix, cx, cy, r) {
	this._setFill(ix);
	this.ctx.beginPath();
	this.ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
	this.ctx.fill();
	this.dirty = true;
}

SurrogateCanvas.prototype.drawImage = function(ix, img, x, y) {
	if (this.tmpImage.width < img.width) {
		this.tmpImage.width = img.width;
	}
	if (this.tmpImage.height < img.height) {
		this.tmpImage.height = img.height;
	}
	
	this.tmpImageCtx.globalCompositeOperation = 'source-over';
	this.tmpImageCtx.fillStyle = this._indexToColor(ix);
	this.tmpImageCtx.fillRect(0, 0, img.width, img.height);
	this.tmpImageCtx.globalCompositeOperation = 'destination-in';
	this.tmpImageCtx.drawImage(img, 0, 0);

	this.ctx.drawImage(
		this.tmpImage,
		0, 0, img.width, img.height,
		x, y, img.width, img.height
	);

	this.dirty = true;
}

SurrogateCanvas.prototype._setFill = function(ix) {
	this.ctx.fillStyle = this._indexToColor(ix);
	this.dirty = true;
}

SurrogateCanvas.prototype._indexToColor = function(ix) {
	ix = ix % 0x1000000;
	var hex = ix.toString(16);
	switch (hex.length) {
		case 1: return '#00000' + hex;
		case 2: return '#0000' + hex;
		case 3: return '#000' + hex;
		case 4: return '#00' + hex;
		case 5: return '#0' + hex;
		case 6: return '#' + hex;
	}
}

//
// Operations

OPS = {
	setFill: function(color) {
		this.ctx.fillStyle = color;
	},
	setStroke: function(color) {
		this.ctx.strokeStyle = color;
	},

	scale: function(sx, sy) {
		this.ctx.scale(sx, sy);
	},

	fillRect: function(x, y, w, h) {
		this.ctx.fillRect(x, y, w, h);
	},
	fillCircle: function(cx, cy, r) {
		this.ctx.beginPath();
		this.ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
		this.ctx.fill();
	},
	drawImage: function(img, x, y) {
		this.ctx.drawImage(img, x, y);
	}
};

var slice = Array.prototype.slice;
for (var k in OPS) {
	Canvas.prototype[k] = (function(name, impl) {
		var surrogateOp = SurrogateCanvas.prototype[name];
		if (surrogateOp) {
			return function(ix) {
				var args = slice.call(arguments, 1);
				this.record.push([ix, impl, surrogateOp, args]);
				impl.apply(this, args);
				surrogateOp.apply(this.surrogate, arguments);
			}
		} else {
			return function(ix) {
				var args = slice.call(arguments, 1);
				this.record.push([ix, impl, null, args])
				impl.apply(this, args);
			}
		}
	})(k, OPS[k]);
}