var fs = require("fs");
var jison = require("jison");

var bnf = fs.readFileSync("../grammar/grammar.jison", "utf8");
var parser = new jison.Parser(bnf);

module.exports = parser;
