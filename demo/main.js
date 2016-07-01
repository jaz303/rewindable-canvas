var createCanvas = require('../');

window.init = function() {

	var canvas = createCanvas(document.getElementById('canvas'));

	document.body.appendChild(canvas.surrogate.el);

	var tree = document.getElementById('tree');
	tree.toString = function() { return 'tree'; };

	var ops = [
		['setFill', 'red'],
		['fillRect', 10, 10, 50, 100],
		['fillRect', 200, 200, 50, 30],
		['setFill', 'blue'],
		['fillRect', 150, 50, 90, 90],
		['setFill', '#00ff00'],
		['fillRect', 30, 30, 100, 100],
		['setFill', 'purple'],
		['fillCircle', 100, 130, 30],
		['scale', 0.5, 0.5],
		['drawImage', tree, 10, 100]
	];

	var slider = document.querySelector('input');
	var code = document.querySelector('.operations');

	var ix = 0;
	var timer = setInterval(function() {
		if (ix === ops.length) {
			clearInterval(timer);
			slider.removeAttribute('disabled');
			canvas.startScrubbing();
			return;
		}
		var op = ops[ix];
		var args = [ix].concat(op.slice(1));
		canvas[op[0]].apply(canvas, args);
		var el = document.createElement('div');
		el.className = 'operation';
		el.textContent = op[0] + '(' + op.slice(1).join(', ') + ')';
		code.appendChild(el);
		slider.setAttribute('max', ix);
		slider.value = ix;
		ix++;
	}, 500);

	var selected = null;
	canvas.onSelect = function(ix) {
		if (selected) {
			selected.classList.remove('is-highlighted');
		}
		selected = code.childNodes[ix];
		selected.classList.add('is-highlighted');
	}

	slider.addEventListener('input', function() {
		canvas.scrubTo(parseInt(slider.value, 10));
	});

}