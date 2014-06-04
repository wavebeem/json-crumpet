var _ = require("underscore");

var parser = require("./parser");

function unescapeUnicode(s) {
}

function unescapeSimple(s) {
}

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
    number: _.partial(parseFloat, _, 10),
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
            f: "\f",
            n: "\n",
            r: "\r",
            t: "\t"
        }[c]);
    }
};

function parse(text, reviver) {
    if (reviver) {
        throw new Error("reviver functions are not supported in JSON Crumpet");
    }
    return parser.parse(text);
}

function stringify(value, replacer, space) {
    throw new Error("stringify is not yet implemented in JSON Crumpet");
}

module.exports = {
    parse: parse,
    stringify: stringify
};
