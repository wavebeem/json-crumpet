var parser = require("./parser");

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
