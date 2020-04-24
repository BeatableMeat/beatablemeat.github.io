/*jslint browser: true*/
/*global $, jQuery, console*/
/*jslint plusplus: true */
$(function () {
	"use strict";
	var tools, canvas;
	tools = {
		mt_rand : function (a, b) {
			return a < b ?
					(Math.floor(Math.abs(a - b) * Math.random()) + a) : (Math.floor(Math.abs(a - b) * Math.random()) + b);
		}
	};
	function Mnws(canvas) {
		if (this instanceof Mnws) {
			this.can = canvas;
			this.box = {};
			this.box.w = $(this.can).width();
			this.box.h = $(this.can).height();
			this.ctx = this.can.getContext('2d');
			this.ctx.strokeStyle = '#eee';
			this.ctx.fillStyle = '#333';
			this.is_fail = false;
			this.rows = 4;
			this.cols = 4;
			this.speed = 1;
			this.stepy = Math.floor(this.box.h / this.rows);
			this.stepx = Math.floor(this.box.w / this.cols);
			this.initial();
			this.event();
		} else {
			return new Mnws(canvas);
		}
	}
	Mnws.prototype = {
		initial : function () {
			this.doCanvas();
			this.drawYLines();
			this.imgData = this.ctx.getImageData(0, 0, this.box.w, this.box.h);
			this.createModel();
			this.changeModel();
			this.controlSpeed();
		},
		doCanvas : function () {
			$(this.can).attr('width', this.box.w);
			$(this.can).attr('height', this.box.h);
		},
		drawYLines : function () {
			var lineNum = this.rows;
			while (--lineNum) {
				this.ctx.save();
				this.ctx.beginPath();
				this.ctx.strokeStyle = '#aaa';
				this.ctx.moveTo(this.stepx * lineNum + 0.5, 0);
				this.ctx.lineTo(this.stepx * lineNum + 0.5, this.box.h);
				this.ctx.stroke();
				this.ctx.restore();
			}
		},
		createModel : function () {
			var i, num;
			this.model = [];
			num = this.rows + 2;
			for (i = 1; i < num; i++) {
				this.pushOneToModel();
			}
		},
		pushOneToModel : function () {
			var model = this.model,
				rand = tools.mt_rand(0, this.cols),
				initialY;
			if (model.length === 0) {
				initialY = this.box.h * (this.rows - 1) / this.rows + 0.5;
				this.model.push({
					index : 0,
					y : initialY,
					rect_x : this.stepx * rand + 0.5,
					clicked : 0
				});
			}
			model.push({
				index : model[model.length - 1].index + 1,
				y : model[model.length - 1].y - this.stepy,
				rect_x : this.stepx * rand + 0.5,
				clicked : 0
			});
		},
		renderModel : function () {
			var that = this;
			this.ctx.putImageData(this.imgData, 0, 0, 0, 0, this.box.w, this.box.h);
			this.model.forEach(function (obj) {
				that.ctx.save();
				that.ctx.strokeStyle = '#aaa';
				that.ctx.beginPath();
				that.ctx.moveTo(0, obj.y);
				that.ctx.lineTo(that.box.w, obj.y);
				that.ctx.stroke();
				that.ctx.restore();
				if (!obj.clicked) {
					that.ctx.fillRect(obj.rect_x, obj.y - that.stepy, that.stepx, that.stepy);
				} else {
					that.ctx.save();
					that.ctx.globalAlpha = obj.opacity;
					that.ctx.fillStyle = '#aaa';
					that.ctx.fillRect(obj.rect_x, obj.y - that.stepy, that.stepx, that.stepy);
					that.ctx.restore();
				}
				if (obj.wrong) {
					that.ctx.save();
					that.ctx.globalAlpha =	obj.wrong.opacity;
					that.ctx.fillStyle = 'red';
					that.ctx.fillRect(obj.wrong.rect_x, obj.y - that.stepy, that.stepx, that.stepy);
					that.ctx.restore();
				}
			});
		},
		changeModel : function () {
			var model = this.model,
				that = this;
			this.timer = setInterval(function () {
				if (model[0].y > that.box.h + that.stepy) {
					console.log(model[0]);
					if (model[0].clicked) {
						model.shift();
						that.pushOneToModel();
					} else {
						that.stop();
						that.fail();
					}
				}
				model.forEach(function (obj) {
					if (obj.clicked) {
						obj.opacity = obj.opacity || 1;
						obj.opacity = (obj.opacity - 0.1) > 0.2 ? (obj.opacity - 0.1) : 0.2;
					}
					if (obj.wrong) {
						// obj.wrong.opacity = obj.wrong.opacity === 1 ?  0.5 : 1;
						obj.wrong.opacity = obj.wrong.opacity || 1;
						obj.wrong.opacity = (obj.wrong.opacity - 0.1 > 0.5) ? (obj.wrong.opacity - 0.1) : 0.5;
					}
					obj.y += that.speed;
				});
				that.renderModel();
			}, 1000 / 24);
		},
		controlSpeed : function () {
			var that = this,
				timer,
				result;
			timer = setInterval(function () {
				// that.speed = Math.floor(that.model[0].index / 5) >= 1 ? Math.floor(that.model[0].index / 5) : that.speed;
				if (!that.is_fail) {
					result = Math.floor(Math.log(that.model[0].index) / Math.log(1.3));
					that.speed = result > 1 ? result : 1;
					console.log(that.speed);
				} else {
					clearInterval(timer);
				}
			}, 1000 / 2);
		},
		event : function () {
			var that = this;
			$(this.can).click(function (e) {
				var c_x = e.clientX,
					c_y = e.clientY,
					top = $(that.can).offset().top,
					left = $(that.can).offset().left,
					x = c_x - left,
					y = c_y - top;
				that.whichClicked(x, y);
			});
		},
		whichClicked : function (x, y) {
			var model = this.model,
				that = this,
				obj,
				i;
			for (i = 0; i < this.model.length; i++) {
				obj = this.model[i];
				if (y < obj.y && y > obj.y - that.stepy) {
					if (x > obj.rect_x && x < obj.rect_x + that.stepx) {
						console.log(obj.index);
						obj.clicked = 1;
						break;
					} else {
						obj.wrong = {};
						obj.wrong.opacity = 1;
						obj.wrong.rect_x = Math.floor(x / this.stepx) * this.stepx;
						this.stop();
						this.fail();
					}
				}
			}
		},
		stop : function () {
			var that = this;
			clearInterval(this.timer);
			function auto() {
				that.model.forEach(function (obj) {
					obj.y -= 4;
				});
				that.renderModel();
				if (that.model[0].y < that.box.h) {
					clearInterval(that.timer2);
				}
			}
			this.timer2 = setInterval(auto, 1000 / 24);
		},
		fail : function () {
			var that = this;
			this.is_fail = true;
			$('.fail').fadeIn();
			$('.fail .score span').html(this.getScore());
			$('.fail .btn').on('click', function () {
				document.location.reload();
			});
		},
		getScore : function () {
			var i;
			for (i = 0; i < this.model.length; i++) {
				if (!this.model[i].clicked) {
					return this.model[i].index;
				}
			}
		}
	};

	canvas = document.getElementById('container');
	window.xx = new Mnws(canvas);
});