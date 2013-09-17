$(function () {
	setTimeout(init, 1);
});

var parameters = new Parameters();
var count = 0;
var form;

function init() {
	form = $('#questions');

	count = wom.thesen.length;

	$.each(wom.thesen, function (index, these) {
		var text = these.text2;
		text = text.replace(/\{/g, '<strong>');
		text = text.replace(/\}/g, '</strong>');

		if (these.reverse) {
			var a = wom.thesenparteien[index];
			for (var i = 0; i < a.length; i++) a[i] = 1 - a[i];
		}

		var html =
			'<div class="questionbox" name="questionbox_'+index+'" >'+
				'<div class="form-group">'+
					'<div class="col-lg-8">'+
						'<p class="question">'+text+'</p>'+
					'</div>'+
					'<div class="col-lg-4">'+
						'<div class="btn-group answer" data-toggle="buttons">'+
							'<label id="label_'+index+'_1"  class="btn btn-default label_'+index+'"><input type="radio" name="answer_'+index+'" id="answer_'+index+'_1"  value="1" ><!--<span class="glyphicon glyphicon-thumbs-up"></span>--> Dafür</label>'+
							'<label id="label_'+index+'_0"  class="btn btn-default label_'+index+'"><input type="radio" name="answer_'+index+'" id="answer_'+index+'_0"  value="0" >Egal</label>'+
							'<label id="label_'+index+'_-1" class="btn btn-default label_'+index+'"><input type="radio" name="answer_'+index+'" id="answer_'+index+'_-1" value="-1">Dagegen <!--<span class="glyphicon glyphicon-thumbs-down"></span>--></label>'+
						'</div>'+
						'<div class="important btn-group" data-toggle="buttons">'+
							'<label class="btn btn-default" id="important_'+index+'"><input type="checkbox" name="important_'+index+'"><span class="glyphicon glyphicon-star"></span></label>'+
						'</div>'+
					'</div>'+
				'</div>'+
			'</div>';
		form.append($(html));
	});

	readCookie(parameters);
	setForm(parameters);

	form.change(function () {
		readForm(parameters);
		setCookie(parameters);
	});
}

function readCookie(p) {
	p.decode($.cookie('parameters'));
}

function setCookie(p) {
	$.cookie('parameters', p.encode(), { expires: 365 });
}

function readForm(p) {
	p.reset();

	$.each(form.serializeArray(), function (index, object) {
		if (object.name.substr(0,7) == 'answer_') {
			p.answers[parseInt(object.name.substr(7),10)] = parseInt(object.value,10);
		}
		if (object.name.substr(0,10) == 'important_') {
			p.important[parseInt(object.name.substr(10),10)] = true;
		}
	});

}

function setForm(p) {
	$.each(wom.thesen, function (index, these) {
		$('input[name="answer_'+index+']').removeAttr('checked');
		$('label.label_'+index).removeClass('active');
		$('#important_'+index).removeClass('active');
		$('#important_'+index+' input').removeAttr('checked');

		answer = p.answers[index];
		$('#answer_'+index+'_'+answer).attr('checked','checked');
		$('#label_'+index+'_'+answer).addClass('active');
		if (p.important[index]) {
			$('#important_'+index+' input').attr('checked','checked');
			$('#important_'+index).addClass('active');
		}
	});
}

function Parameters() {
	var me = this;

	me.answers = [];
	me.important = [];

	me.reset = function () {
		for (var i = 0; i < count; i++) {
			me.answers[i] = undefined;
			me.important[i] = false;
		}
	}

	var codeLength = 19;
	var encodeTable = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_.';
	var decodeTable = [];
	for (var i = 0; i < 256; i++) decodeTable[i] = [0,0,0,0,0,0];
	for (var i = 0; i < encodeTable.length; i++) {
		var a = [];
		var v = i;
		for (var j = 0; j < 6; j++) {
			a.push(v % 2);
			v = v >> 1;
		}
		decodeTable[encodeTable.charCodeAt(i)] = a;
	}

	me.encode = function () {
		var data = [];

		for (var i = 0; i < count; i++) {
			switch (me.answers[i]) {
				case  1: data.push(1, 0); break;
				case  0: data.push(0, 1); break;
				case -1: data.push(1, 1); break;
				default: data.push(0, 0); break;
			}
			data.push(me.important[i] ? 1 : 0);
		}

		var code = '';
		for (var i = 0; i < codeLength; i++) {
			var s = 0;
			for (var j = i*6+5; j >= i*6; j--) {
				s = s << 1;
				if (data[j] == 1) s++;
			}
			code += encodeTable[s];
		}

		code = code.replace(/0+$/, '');

		console.log('encode');
		console.log(data.join(''));
		console.log(code);

		return code;
	}

	me.decode = function (code) {
		if (code === undefined) code = '';
		var data = [];

		for (var i = 0; i < codeLength; i++) {
			var v = code.charCodeAt(i);
			if (!v) v = 0;
			v = decodeTable[v];
			data = data.concat(v);
		}


		console.log('decode');
		console.log(code);
		console.log(data.join(''));

		for (var i = 0; i < count; i++) {
			var a = data[i*3+0] + 2*data[i*3+1];
			switch (a) {
				case 1:  me.answers[i] =  1; break;
				case 2:  me.answers[i] =  0; break;
				case 3:  me.answers[i] = -1; break;
				default: me.answers[i] = undefined; break;
			}
			me.important[i] = data[i*3+2];
		}
	}

	return me;
}