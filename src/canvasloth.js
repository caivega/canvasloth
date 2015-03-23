/*
	Canvasloth - 1.7
	https://github.com/Mr21/Canvasloth
*/

"use strict";

function Canvasloth(p) {
	var
		that = this,
		// utils
		attachEvent = function(e, v, f) {
			if (e.addEventListener)
				e.addEventListener(v, f, false);
			else
				e.attachEvent("on" + v, f);
		},
		// attr
		ctx,
		el_ctn,
		el_cnv,
		el_hudAbove,
		el_evt,
		startTime = 0,
		currentOldTime = 0,
		currentTime = 0,
		fps = p.fps
			? 1000 / p.fps
			: 1000 / 60;

	this.container = p.container.nodeType === Node.ELEMENT_NODE
		? p.container
		: p.container[0];

	this.resetTime = function() { startTime = currentTime; };
	this.totalTime = function() { return currentTime - startTime; };
	this.frameTime = function() { return currentTime - currentOldTime; };

	this.refreshViewportSize = function() {
		el_cnv.width  = el_cnv.clientWidth;
		el_cnv.height = el_cnv.clientHeight;
		return that;
	};

	// assets
	var	nl_img,
		nl_audio;
	(function() {

		function getAsset(arr, name) {
			for (var i = 0, e; e = arr[i]; ++i)
				if (e.src.lastIndexOf(name) === e.src.length - name.length)
					return e;
			console.error('Canvasloth: "'+name+'" not found.');
		}

		that.image = function(name) { return getAsset(nl_img, name); };
		that.audio = function(name) { return getAsset(nl_audio, name); };
		that.file = function(name) { return that.image(name) || that.audio(name); };

	})();

	// dom
	(function () {

		var el_ast;

		el_ctn = that.container;
		el_ast = el_ctn.querySelector(".canvasloth-assets");
		el_hudAbove = el_ctn.querySelector(".canvasloth-hud-above");
		el_cnv = document.createElement("canvas");
		el_evt = document.createElement("div");
		if (!el_ast) {
			el_ast = document.createElement("div");
			el_ast.className = "canvasloth-assets";
			el_ctn.appendChild(el_ast);
		}
		nl_img = el_ast.getElementsByTagName("img");
		nl_audio = el_ast.getElementsByTagName("audio");
		if (el_ctn.className.indexOf("canvasloth") === -1)
			el_ctn.className += " canvasloth";
		el_evt.tabIndex = 0;
		el_evt.className = "canvasloth-events";
		el_ctn.appendChild(el_cnv);
		if (!el_hudAbove) {
			el_hudAbove = document.createElement("div");
			el_hudAbove.className = "canvasloth-hud-above";
			el_ctn.appendChild(el_hudAbove);
		}
		el_hudAbove.insertBefore(el_evt, el_hudAbove.firstChild);
		ctx = p.context === "2d"
			? el_cnv.getContext("2d")
			: (
				el_cnv.getContext("webgl") ||
				el_cnv.getContext("experimental-webgl")
			);

	})();

	this.refreshViewportSize();

	// callbacks
	var	fn_events = [],
		fn_loop;
	(function() {

		el_ctn.oncontextmenu = function() { return false; };

		that.events = function(ev, fn) {
			ev = ev.toLowerCase();
			if (ev === "click")
				return console.error('Canvasloth: use the event "mouseup" instead of "click".');
			else if (ev === "keypress")
				return console.error('Canvasloth: use the event "keyup" instead of "keypress".');
			fn_events[ev] = fn;
			return that;
		};

		var noop = function() {};

		fn_loop = p.loop || noop;

		that.events("focus",      noop);
		that.events("blur",       noop);
		that.events("keydown",    noop);
		that.events("keyup",      noop);
		that.events("mousedown",  noop);
		that.events("mouseup",    noop);
		that.events("mousemove",  noop);
		that.events("wheel",      noop);
		that.events("touchstart", noop);
		that.events("touchend",   noop);
		that.events("touchmove",  noop);

		for (var ev in p.events)
			that.events(ev, p.events[ev]);

	})();

	// touchscreen
	(function() {

		var touches = {};

		function calcX(t, rc) { return t.pageX - rc.left - window.scrollX; }
		function calcY(t, rc) { return t.pageY - rc.top  - window.scrollY; }

		attachEvent(el_evt, "touchstart", function(e) {
			var	id, t, to, i = 0,
				rc = el_evt.getBoundingClientRect();
			e.preventDefault();
			for (; t = e.changedTouches[i]; ++i)
				if (!touches[id = t.identifier]) {
					to = touches[id] = {};
					to.x = to.xold = calcX(t, rc);
					to.y = to.yold = calcY(t, rc);
					fn_events.touchstart.call(p.thisApp, {
						id: id,
						x: to.x,
						y: to.y,
						force: t.force,
						radiusX: t.radiusX,
						radiusY: t.radiusY
					});
					fn_events.touchmove.call(p.thisApp, {
						id: id,
						x: to.x,
						y: to.y,
						rx: 0,
						ry: 0,
						force: t.force,
						radiusX: t.radiusX,
						radiusY: t.radiusY
					});
				}
		});

		attachEvent(el_evt, "touchmove", function(e) {
			var	id, t, to, i = 0, x, y,
				rc = el_evt.getBoundingClientRect();
			e.preventDefault();
			for (; t = e.changedTouches[i]; ++i) {
				to = touches[id = t.identifier];
				x = calcX(t, rc);
				y = calcY(t, rc);
				fn_events.touchmove.call(p.thisApp, {
					id: id,
					x: x,
					y: y,
					rx: x - to.xold,
					ry: y - to.yold,
					force: t.force,
					radiusX: t.radiusX,
					radiusY: t.radiusY
				});
				to.x = to.xold = x;
				to.y = to.yold = y;
			}
		});

		attachEvent(window, "touchend", function(e) {
			var	id, t, to, i = 0;
			for (; t = e.changedTouches[i]; ++i)
				if (to = touches[id = t.identifier]) {
					fn_events.touchend.call(p.thisApp, {
						id: id,
						x: to.x,
						y: to.y
					});
					delete touches[id];
				}
		});

	})();

	// keyboard
	var ar_keys = [];
	(function() {

		that.key = function(k) { return ar_keys[k]; };

		attachEvent(el_evt, "keydown", function(e) {
			e.preventDefault();
			if (!ar_keys[e.keyCode]) {
				ar_keys[e.keyCode] = true;
				fn_events.keydown.call(p.thisApp, {
					key: e.keyCode
				});
			}
		});

		attachEvent(el_evt, "keyup", function(e) {
			if (ar_keys[e.keyCode]) {
				ar_keys[e.keyCode] = false;
				fn_events.keyup.call(p.thisApp, {
					key: e.keyCode
				});
			}
		});

	})();

	// focus / blur
	var isFocused = false;
	(function() {

		attachEvent(el_evt, "focus", function() {
			isFocused = true;
			el_ctn.className += " canvasloth-focus";
			fn_events.focus.call(p.thisApp);
		});
		
		attachEvent(el_evt, "blur", function() {
			if (isFocused) {
				isFocused = false;
				el_ctn.className = el_ctn.className.replace(/ canvasloth-focus/g, "");
				for (var i in ar_keys)
					if (ar_keys[i = parseInt(i)]) {
						fn_events.keyup.call(p.thisApp, {
							key: i
						});
						ar_keys[i] = false;
					}
				if (!p.autoFocus)
					el_evt.blur();
				fn_events.blur.call(p.thisApp);
			}
		});

	})();

	// mouse
	(function() {

		var	xold, yold,
			mouseButtonsStatus = [];

		function event_mousemove(e) {
			var	x = e.layerX,
				y = e.layerY;
			fn_events.mousemove.call(p.thisApp, {
				x: x,
				y: y,
				rx: x - xold,
				ry: y - yold
			});
			xold = x;
			yold = y;
		}

		attachEvent(el_evt, "mouseover", function(e) {
			xold = e.layerX;
			yold = e.layerY;
		});

		attachEvent(el_evt, "mousemove", event_mousemove);

		attachEvent(el_evt, "mousedown", function(e) {
			mouseButtonsStatus[e.button] = 1;
			if (!isFocused)
				el_evt.focus();
			fn_events.mousedown.call(p.thisApp, {
				x: e.layerX,
				y: e.layerY,
				button: e.button
			});
			event_mousemove(e);
		});

		attachEvent(el_evt, "mouseup", function(e) {
			if (mouseButtonsStatus[e.button] === 1) {
				mouseButtonsStatus[e.button] = 2;
				fn_events.mouseup.call(p.thisApp, {
					x: e.layerX,
					y: e.layerY,
					button: e.button
				});
			}
		});

		attachEvent(el_evt, "wheel", function(e) {
			e.preventDefault();
			fn_events.wheel.call(p.thisApp, {
				x: e.layerX,
				y: e.layerY,
				rx: e.webkitMovementX !== undefined ? e.deltaX / 100 : e.deltaX,
				ry: e.webkitMovementX !== undefined ? e.deltaY / 100 : e.deltaY
			});
		});

		attachEvent(window, "mouseup", function(e) {
			if (mouseButtonsStatus[e.button] === 1) {
				mouseButtonsStatus[e.button] = 0;
				fn_events.mouseup.call(p.thisApp, {
					x: 0,
					y: 0,
					button: e.button
				});
			}
		});

		attachEvent(el_hudAbove, "mousedown", function(e) {
			e.preventDefault();
			if (!isFocused)
				el_evt.focus();
		});

	})();

	// load & go
	(function() {

		var	nbElementsToLoad = 1;

		function startLooping() {
			setInterval(function() {
				currentOldTime = currentTime;
				currentTime = new Date().getTime() / 1000;
				fn_loop.call(p.thisApp);
			}, fps);
		}

		function loaded() {
			if (!--nbElementsToLoad) {
				currentTime =
				startTime = new Date().getTime() / 1000;
				if (p.ready)
					p.ready.call(p.thisApp, {
						canvasloth: that,
						ctx: ctx
					});
				if (p.autoFocus)
					el_evt.focus();
				currentTime = new Date().getTime() / 1000;
				startLooping();
			}
		}

		if (p.ready) {
			for (var i = 0, img; img = nl_img[i]; ++i)
				if (!img.complete) {
					++nbElementsToLoad;
					img.onload = function() {
						loaded();
					};
				}
			for (var i = 0, audio; audio = nl_audio[i]; ++i)
				if (audio.readyState !== audio.HAVE_ENOUGH_DATA) {
					++nbElementsToLoad;
					audio.oncanplaythrough = function() {
						loaded();
					};
				}
		}

		loaded();

	})();

}
