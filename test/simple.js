var Crumpet = require("../src/json-crumpet");

// var parsed = Crumpet.parse('[1, 2,    "ab\\""]');
// var parsed = Crumpet.parse('[1, 2,    "ab"]');
// var parsed = Crumpet.parse('{}');
// var parsed = Crumpet.parse('{"a":1}');
// var parsed = Crumpet.parse('{"a  \\" ":1,"b":2, "a":"z"}');
// var parsed = Crumpet.parse('{"\u1234 \ucafe \ubabe \u304a\u65e9 a  \\n\\r\\t\\b\\f\\\\ ":1,"b":2, "a":"z"}');
// var parsed = Crumpet.parse(JSON.stringify({
//     a: "asdasd\n",
//     "potato \"skin": "",
//     123: null,
//     c: 3, p: 0,
//     b: 123,
//     pi: Math.PI
// }, null, 4));
// var parsed = Crumpet.parse('[3.14e2]');
// var parsed = Crumpet.parse('100');
// var parsed = Crumpet.parse('0100');
// var parsed = Crumpet.parse('-3');
// var parsed = Crumpet.parse('"\\00"');
// var parsed = Crumpet.parse('"hi\\\\world"');
var parsed = Crumpet.parse('3.14e2');
// var parsed = Crumpet.parse('3 .14e2');
// var parsed = Crumpet.parse('345');
// var parsed = Crumpet.parse('"abc');
// var parsed = Crumpet.parse('[3]');
// var parsed = Crumpet.parse('[[],[[]]]');
// var parsed = Crumpet.parse('"\\\\"');
// var parsed = Crumpet.parse('[1, 2, [3, [4, 5]], 6, [true, false], [null], [[]]]');
// var parsed = Crumpet.parse('{"a":1   }');
// var parsed = Crumpet.parse('"ab"');

console.log("parsed:", JSON.stringify(parsed));
