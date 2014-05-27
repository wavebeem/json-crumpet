var _ = require("underscore");

var parser = require("./parser");

function unescapeUnicode(s) {
    return s.replace(/\\u([a-fA-F0-9]{4})/, function(match, $1) {
        return String.fromCharCode(parseInt($1, 16));
    });
}

function unescapeSimple(s) {
    return s.replace(/\\([\\"\/bfnrt])/, function(match, $1) {
        return ({
            '"': '"',
            '\\': '\\',
            '/': '/',
            b: "\b",
            f: "\f",
            n: "\n",
            r: "\r",
            t: "\t"
        }[$1]);
    });
}

parser.yy = {
    merge: _.extend,
    pair: function(k, v) {
        var o = {};
        o[k] = v;
        return o;
    },
    conj: function(xs, x) {
        var ys = [].concat(xs);
        ys.push(x);
        return ys;
    },
    number: _.partial(parseFloat, _, 10),
    unescape: _.compose(unescapeUnicode, unescapeSimple)
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
