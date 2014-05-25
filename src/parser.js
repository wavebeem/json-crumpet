var fs = require("fs");
var path = require("path");
var jison = require("jison");

var bnf = fs.readFileSync(path.join(__dirname, "../grammar/grammar.jison"), "utf8");
var parser = new jison.Parser(bnf);

module.exports = parser;
