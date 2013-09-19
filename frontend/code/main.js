$(function () {
	setTimeout(init, 1);
});

var parameters = new Parameters();
var count = 0;
var pcount = 0;
var parteiWider = 52;
var parteiWidth = 20;
var form;

function init() {
	setTimeout(function () {
		if ($('body').scrollTop() < 300) $('html, body').animate({ scrollTop: 300 }, 500)
	}, 1000);

	form = $('#questions');

	count = wom.thesen.length;
	pcount = wom.parteien.length;

	$.each(wom.thesen, function (index, these) {
		var text = these.text2;
		text = text.replace(/\{/g, '<strong>');
		text = text.replace(/\}/g, '</strong>');

		if (these.reverse) {
			var a = wom.thesenparteien[index];
			for (var i = 0; i < a.length; i++) a[i] *= -1;
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
	updateFromData();

	form.change(function () {
		readForm(parameters);
		calcMatching(parameters);
	});


	$(window).bind('hashchange', function (e) {
		readLocalData(parameters);
		updateFromData();
	});

	function updateFromData () {
		setForm(parameters);
		if (parameters.showresult) {
			$('body').removeClass('hideresult');
		} else {
			$('body').addClass('hideresult');
		}
		calcMatching(parameters);
	}

	$('#btnreset').click(function () {
		parameters.reset();
		updateFromData();
		$('html, body').animate({ scrollTop: 300 }, 500);
	})

	$('#btnshare').click(function () {
		$('#url').val('http://apps.opendatacity.de/wahl/#'+parameters.encode());
		$('#myModal').modal();
	})

	$('#url').on('mouseup', function () {
		$(this).select();
	});

	$('#showresult input').change(function () {
		parameters.showresult = Boolean($('#showresult input').prop('checked'));

		if (parameters.showresult) {
			var selected = 0;
			$.each(wom.parteien, function (index, partei) {
				if (parameters.selectedParties[index]) selected++;
			});

			if (selected == 0) {
				$.each(wom.parteien, function (index, partei) {
					parameters.selectedParties[index] = (index < 5);
				});
			}
			$('body').removeClass('hideresult');
			calcMatching(parameters);
		} else {
			$('body').addClass('hideresult');
		}
	});
}

function calcMatching(p) {
	var width = 0;
	
	for (var i = 0; i < wom.parteien.length; i++) {
		width += (parameters.selectedParties[i] ? parteiWider : parteiWidth);
	}

	$('#chart').css('width', width);

	if ($('body').hasClass('hideresult')) return;

	var parteiMatch = [];
	for (var i = 0; i < pcount; i++) {
		var v = 0;
		var s = 0;
		for (var j = 0; j < count; j++) {
			var dv = 0;
			var ds = 0;
			var parteiValue = wom.thesenparteien[j][i];
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
		for (var i = 0; i < pcount; i++) {
			var partei = wom.parteien[i];
			if (parameters.selectedParties[i]) {
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

	var left = 0;
	$.each(parteiMatch, function (index, partei) {
		var marked = parameters.selectedParties[partei.data.index];
		var value = 100-100*partei.distance;

		partei.data.node.css('left', left + (marked ? 3 : 0));
		left += marked ? parteiWider : parteiWidth;
		partei.data.bar.css('height', value+'%');

		partei.data.span.text(value.toFixed(0));

		if (marked) {
			partei.data.node.addClass('marked');
		} else {
			partei.data.node.removeClass('marked');
		}
		
	});
}

function initChart() {
	var chart = $('#chart');
	chart.empty();
	chart.css('width', parteiWidth*wom.parteien.length);

	$.each(wom.parteien, function (index, partei) {
		partei.index = index;
		parameters.selectedParties[index] = false;

		var node = $(
			'<div class="partei" style="left:'+(index*parteiWidth)+'px">'+
				'<div class="barborder">'+
					'<div class="barinner" style="height:0%"></div>'+
				'</div>'+
				'<div class="title">'+partei.title+' - <span>0</span>%</div>'+
				'<div class="icon">'+
					'<img src="images/32/'+partei.id+'.png">'+
				'</div>'+
				'<div class="markers">'+
					getMarker(partei)+
				'</div>'+
			'</div>'
		);
		chart.append(node);
		partei.node = node;
		partei.bar = node.find('.barinner');
		partei.span = node.find('span');
		partei.index = index;

		node.click(function () {
			parameters.selectedParties[index] = !parameters.selectedParties[index];
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
	var hash = window.location.hash;
	hash = hash.replace(/[\s\#]+/g, '');
	p.decode(hash);
}

function readForm(p) {
	p.reset(true);

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
	me.showresult = false;
	me.selectedParties = [];

	me.reset = function (formOnly) {
		for (var i = 0; i < count; i++) {
			me.answers[i] = undefined;
			me.important[i] = false;
		}
		
		if (formOnly) return;

		me.showresult = false;
		for (var i = 0; i < pcount; i++) {
			me.selectedParties[i] = false;
		}
	}

	var codeLength = 24;
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

		data.push(me.showresult ? 1 : 0);

		for (var i = 0; i < pcount; i++) {
			data.push(me.selectedParties[i] ? 1 : 0);
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

		for (var i = 0; i < code.length; i++) {
			var v = code.charCodeAt(i);
			if (!v) v = 0;
			v = decodeTable[v];
			data = data.concat(v);
		}

		for (var i = 0; i < count; i++) {
			var a = data.shift() + 2*data.shift();
			switch (a) {
				case 0: me.answers[i] =  undefined; break;
				case 1: me.answers[i] =  1; break;
				case 2: me.answers[i] =  0; break;
				case 3: me.answers[i] = -1; break;
				default: me.answers[i] =  undefined;
			}
			switch (data.shift()) {
				case 0: me.important[i] = false; break;
				case 1: me.important[i] = true;  break;
				default: me.important[i] = false;
			}
		}

		switch (data.shift()) {
			case 0: me.showresult = false; break;
			case 1: me.showresult = true;  break;
				default: me.showresult = false;
		}

		for (var i = 0; i < pcount; i++) {
			switch (data.shift()) {
				case 0: me.selectedParties[i] = false; break;
				case 1: me.selectedParties[i] = true;  break;
				default: me.selectedParties[i] = false;
			}
		}
	}

	return me;
}