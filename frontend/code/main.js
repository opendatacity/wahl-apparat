$(function () {
	setTimeout(init, 1);
});

var parameters = new Parameters();
var count = 0;
var parteiWidth = 52;
var form;

function init() {
	$('#showresult').click(function () {
		$('body').removeClass('hideresult');
	})

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
			'<div class="questionbox clearfix" name="questionbox_'+index+'" >'+
				'<div class="form-group">'+
					'<div class="col-sm-8">'+
						'<p class="question">'+text+'</p>'+
					'</div>'+
					'<div class="col-sm-4">'+
						'<div class="btn-group answer" data-toggle="buttons">'+
							'<label id="label_'+index+'_1"  class="btn btn-default label_'+index+'"><input type="radio" name="answer_'+index+'" id="answer_'+index+'_1"  value="1" ><!--<span class="glyphicon glyphicon-thumbs-up"></span>--> Ja</label>'+
							'<label id="label_'+index+'_0"  class="btn btn-default label_'+index+'"><input type="radio" name="answer_'+index+'" id="answer_'+index+'_0"  value="0" >Egal</label>'+
							'<label id="label_'+index+'_-1" class="btn btn-default label_'+index+'"><input type="radio" name="answer_'+index+'" id="answer_'+index+'_-1" value="-1">Nein <!--<span class="glyphicon glyphicon-thumbs-down"></span>--></label>'+
						'</div>'+
						'<div class="important" data-toggle="buttons">'+
							'<label class="btn btn-default" id="important_'+index+'"><input type="checkbox" name="important_'+index+'"><span class="glyphicon glyphicon-star"></span></label>'+
						'</div>'+
						'<div class="markerwrapper">'+
							'<div class="markers"></div>'+
							'<div class="markers"></div>'+
							'<div class="markers"></div>'+
						'</div>'+
					'</div>'+
				'</div>'+
			'</div>';
		var node = $(html);
		form.append(node);

		these.node = node;
		these.markers = node.find('.markers');

		$('.important label').tooltip({
			placement: 'right',
			title: 'Ist mir wichtig!'
		});
	});

   initChart();

	readLocalData(parameters);
	setForm(parameters);
	calcMatching(parameters);

	form.change(function () {
		readForm(parameters);
		setLocalData(parameters);
		calcMatching(parameters);
	});

	$(window).bind('hashchange', function (e) {
		readLocalData(parameters);
		setForm(parameters);
		calcMatching(parameters);
	});
}

function calcMatching(p) {
	var pn = wom.parteien.length;
	
	var parteiMatch = [];
	for (var i = 0; i < pn; i++) {
		var v = 0;
		var s = 0;
		for (var j = 0; j < count; j++) {
			var dv = 0;
			var ds = 0;
			var parteiValue = wom.thesenparteien[j][i];
			if (wom.thesen[j].reverse) parteiValue *= -1;
			switch (p.answers[j]) {
				case  1: dv = Math.abs(parteiValue - 1); ds = 2; break;
				case -1: dv = Math.abs(parteiValue + 1); ds = 2; break;
			}
			if (p.important[j]) {
				dv *= 2;
				ds *= 2;
			}
			v += dv;
			s += ds;
		}
		parteiMatch[i] = {
			distance: v/s,
			data: wom.parteien[i]
		}
	}

	for (var j = 0; j < count; j++) {
		var markers = wom.thesen[j].markers;
		markers.empty();
		for (var i = 0; i < pn; i++) {
			var partei = wom.parteien[i];
			if (partei.marked) {
				var parteiValue = wom.thesenparteien[j][i];
				var node;
				switch (parteiValue) {
					case  1: node = markers.eq(0); break;
					case  0: node = markers.eq(1); break;
					case -1: node = markers.eq(2); break;
				}
				node.append($(getMarker(partei)));
			}
		}
	}

	$('#questions .marker').tooltip({
		animation: false,
		placement: 'bottom'
	});

	parteiMatch.sort(function (a,b) {
		if (a.distance == b.distance) {
			return a.index - b.index;
		}
		return a.distance - b.distance;
	});

	$.each(parteiMatch, function (index, partei) {
		partei.data.node.css('left', index*parteiWidth);
		partei.data.bar.css('height', 100-100*partei.distance+'%');

		if (partei.data.marked) {
			partei.data.node.addClass('marked');
		} else {
			partei.data.node.removeClass('marked');
		}
		
	});

	//console.log(parteiMatch);
}

function initChart() {
	var chart = $('#chart');
	chart.empty();
	chart.css('width', wom.parteien.length*parteiWidth + 300);

	$.each(wom.parteien, function (index, partei) {
		partei.marked = (index < 7);

		var node = $(
			'<div class="partei'+(partei.marked ? ' marked' : '')+'" style="left:'+(index*parteiWidth)+'px">'+
				'<div class="barborder">'+
					'<div class="barinner" style="height:0%"></div>'+
				'</div>'+
				'<div class="title">'+partei.title+'</div>'+
				'<div class="icon" style="background-image:url(images/32/'+partei.id+'.png)">'+
					'<img src="images/32_grey/'+partei.id+'.png">'+
				'</div>'+
				'<div class="markers">'+
					getMarker(partei)+
				'</div>'+
			'</div>'
		);
		chart.append(node);
		partei.node = node;
		partei.bar = node.find('.barinner');
		partei.index = index;

		node.click(function () {
			partei.marked = !partei.marked;
			calcMatching(parameters);
		})
	});

}

function getMarker (partei) {
	html =
		'<div class="marker" style="'+
		'background-color:#'+partei.fill+';'+
		'border-color:#'+(partei.stroke ? partei.stroke : partei.fill)+
		'" title="'+partei.title+'"></div>';
	return html;
}

function readLocalData(p) {
	//p.decode($.jStorage.get('parameters'));
	var hash = window.location.hash;
	hash = hash.replace(/[\s\#]+/g, '');
	p.decode(hash);
}

function setLocalData(p) {
	//$.jStorage.set('parameters', p.encode());
	window.location.hash = '#'+p.encode();
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
		$('input[name="answer_'+index+'"]').removeAttr('checked');
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

		return code;
	}

	me.decode = function (code) {
		if (!code) code = '';
		var data = [];

		for (var i = 0; i < codeLength; i++) {
			var v = code.charCodeAt(i);
			if (!v) v = 0;
			v = decodeTable[v];
			data = data.concat(v);
		}

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