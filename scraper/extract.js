
var source = '../../wahlomat_bundestagswahl/wahlomat_2013/';
var destination = '../frontend/data/wom.js';


var fs = require('fs');
var code = fs.readFileSync(source+'app/module_definition.js', 'utf8');

//console.log(code);

var data = getVariables(code);

//console.log(data);

fs.writeFileSync(destination, 'var wom = '+JSON.stringify(data, null, '\t') ,'utf8');

function getVariables(code) {
	"use strict";
		
	var
		var_WOMT_sCheckSumImport,
		var_WOMT_sCheckSumExport,
		WOMT_sCheckSumImport,
		WOMT_sCheckSumExport,
		WOMT_sCheckSumDivText,
		WOMT_sCheckThesenText,
		WOMT_sCheckPN,
		result;

	code += ";result = { thesen: WOMT_aThesen, thesenparteien: WOMT_aThesenParteien, parteien: WOMT_aParteien };";
	eval(code);

	result.thesen = result.thesen.map(function (o) {
		return { title:o[0][0], text:o[0][1], text2:o[0][1], reverse:false }
	})

	result.thesenparteien = result.thesenparteien.map(function (these) {
		return these.map(function (value) {
			return parseFloat(value);
		})
	})

	result.parteien = result.parteien.map(function (o) {
		var id = o[0][1].toLowerCase();
		id = id.replace(/ä/g, 'ae');
		id = id.replace(/ö/g, 'oe');
		id = id.replace(/ü/g, 'ue');
		id = id.replace(/[^a-z]+/g, '_');
		return { title:o[0][1], text:o[0][0], id:id }
	})

	return result;
}
