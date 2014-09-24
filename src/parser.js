var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var jison = require("jison");

var bnf = fs.readFileSync(path.join(__dirname, "../grammar/grammar.jison"), "utf8");
var parser = new jison.Parser(bnf);

parser.yy = {
    merge: _.extend,
    pair: function(k, v) {
        var o = {};
        o[k] = v;
        return o;
    },
    append: function(xs, x) {
        xs.push(x);
        return xs;
    },
    number: _.partialRight(parseFloat, 10),
    unescapeUnicode: function(s) {
        // Returns the part after "\u" in something like "\u1f09"
        var codePoint = parseInt(s.substring(2), 16);
        return String.fromCharCode(codePoint);
    },
    unescapeSimple: function(s) {
        // Returns the character after the "\", like "n" in "\n"
        var c = s.substring(1);
        return ({
            '"': '"',
            '\\': '\\',
            '/': '/',
            b: "\b",
            n: "\n",
            f: "\f",
            r: "\r",
            t: "\t"
        }[c]);
    }
};

module.exports = parser;
