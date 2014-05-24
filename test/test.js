/// json-crumpet unit test suite
/// modified from https://github.com/bestiejs/json3
(function(root) {
  var isLoader = typeof define == "function" && !!define.amd;
  var isModule = typeof require == "function" && typeof exports == "object" && exports && !isLoader;

  var isPhantom = typeof phantom == "object" && phantom && typeof phantom.exit == "function" && typeof require == "function";
  var isBrowser = "window" in root && root.window == root && typeof root.navigator != "undefined" && !isPhantom;
  var isEngine = !isBrowser && !isModule && typeof root.load == "function";

  function load(module, path) {
    if (isModule || isPhantom) {
      return require(path);
    }
    if (isEngine) {
      root.load(path.replace(/\.js$/, "") + ".js");
    }
    return root[module] || null;
  }

  // The ExtendScript engine doesn't support named exceptions.
  var supportsNamedExceptions = new SyntaxError().name == "SyntaxError";

  function defineTests(Crumpet, Spec, Newton) {
    var JSON = Crumpet;
    var testSuite = new Spec.Suite("Crumpet Unit Tests");

    if (isBrowser) {
      testSuite.on("all", Newton.createReport("suite"));
    } else {
      var logResult = Newton.createConsole(function (message) {
        if (typeof console != "undefined" && console.log) {
          console.log(message);
        } else if (typeof print == "function" && !isBrowser) {
          // In browsers, the global `print` function prints the current page.
          print(message);
        } else {
          throw (typeof message == "object" && message || new Error(message));
        }
      });
      testSuite.on("all", function (event) {
        logResult.call(this, event);
        if (event.type != "complete") {
          return;
        }
        var suite = event.target, exitCode = suite.failures;
        if (typeof process == "object" && process && typeof process.exit == "function") {
          return process.exit(exitCode);
        }
        if (isPhantom) {
          return phantom.exit(exitCode);
        }
        if (Spec.Environment.java) {
          return java.lang.System.exit(exitCode);
        }
        if (exitCode) {
          throw new Error(Newton.substitute("%d unexpected failures.", exitCode));
        }
      });
    }

    // Ensures that `JSON.parse` throws an exception when parsing the given
    // `source` string.
    Spec.Test.prototype.parseError = function (source, message, callback) {
      return this.error(function () {
        JSON.parse(source, callback);
      }, function (exception) {
        return exception instanceof Error;
      }, message);
    };

    // Ensures that `JSON.parse` parses the given source string correctly.
    Spec.Test.prototype.parses = function (expected, source, message, callback) {
      return this.deepEqual(JSON.parse(source, callback), expected, message);
    };

    // Tests
    // -----

    testSuite.addTest("`parse`: Empty Source Strings", function () {
      this.parseError("", "Empty JSON source string");
      this.parseError("\n\n\r\n", "Source string containing only line terminators");
      this.parseError(" ", "Source string containing a single space character");
      this.parseError(" ", "Source string containing multiple space characters");
      this.done(4);
    });

    testSuite.addTest("`parse`: Whitespace", function (test) {
      // The only valid JSON whitespace characters are tabs, spaces, and line
      // terminators. All other Unicode category `Z` (`Zs`, `Zl`, and `Zp`)
      // characters are invalid (note that the `Zs` category includes the
      // space character).
      var characters = ["{\u00a0}", "{\u1680}", "{\u180e}", "{\u2000}", "{\u2001}",
        "{\u2002}", "{\u2003}", "{\u2004}", "{\u2005}", "{\u2006}", "{\u2007}",
        "{\u2008}", "{\u2009}", "{\u200a}", "{\u202f}", "{\u205f}", "{\u3000}",
        "{\u2028}", "{\u2029}"];

      Spec.forEach(characters, function (value) {
        test.parseError(value, "Source string containing an invalid Unicode whitespace character");
      });

      this.parseError("{\u000b}", "Source string containing a vertical tab");
      this.parseError("{\u000c}", "Source string containing a form feed");
      this.parseError("{\ufeff}", "Source string containing a byte-order mark");

      this.parses({}, "{\r\n}", "Source string containing a CRLF line ending");
      this.parses({}, "{\n\n\r\n}", "Source string containing multiple line terminators");
      this.parses({}, "{\t}", "Source string containing a tab character");
      this.parses({}, "{ }", "Source string containing a space character");
      this.done(26);
    });

    testSuite.addTest("`parse`: Octal Values", function (test) {
      // `08` and `018` are invalid octal values.
      Spec.forEach(["00", "01", "02", "03", "04", "05", "06", "07", "010", "011", "08", "018"], function (value) {
        test.parseError(value, "Octal literal");
        test.parseError("-" + value, "Negative octal literal");
        test.parseError('"\\' + value + '"', "Octal escape sequence in a string");
        test.parseError('"\\x' + value + '"', "Hex escape sequence in a string");
      });
      this.done(48);
    });

    testSuite.addTest("`parse`: Numeric Literals", function () {
      this.parses(100, "100", "Integer");
      this.parses(-100, "-100", "Negative integer");
      this.parses(10.5, "10.5", "Float");
      this.parses(-3.141, "-3.141", "Negative float");
      this.parses(0.625, "0.625", "Decimal");
      this.parses(-0.03125, "-0.03125", "Negative decimal");
      this.parses(1000, "1e3", "Exponential");
      this.parses(100, "1e+2", "Positive exponential");
      this.parses(-0.01, "-1e-2", "Negative exponential");
      this.parses(3125, "0.03125e+5", "Decimalized exponential");
      this.parses(100, "1E2", "Case-insensitive exponential delimiter");

      this.parseError("+1", "Leading `+`");
      this.parseError("1.", "Trailing decimal point");
      this.parseError(".1", "Leading decimal point");
      this.parseError("1e", "Missing exponent");
      this.parseError("1e-", "Missing signed exponent");
      this.parseError("--1", "Leading `--`");
      this.parseError("1-+", "Trailing `-+`");
      this.parseError("0xaf", "Hex literal");

      // The native `JSON.parse` implementation in IE 9 allows this syntax, but
      // the feature tests should detect the broken implementation.
      this.parseError("- 5", "Invalid negative sign");

      this.done(20);
    });

    testSuite.addTest("`parse`: String Literals", function (test) {
      var expected = 48, controlCharacters = ["\u0001", "\u0002", "\u0003",
        "\u0004", "\u0005", "\u0006", "\u0007", "\b", "\t", "\n", "\u000b", "\f",
        "\r", "\u000e", "\u000f", "\u0010", "\u0011", "\u0012", "\u0013",
        "\u0014", "\u0015", "\u0016", "\u0017", "\u0018", "\u0019", "\u001a",
        "\u001b", "\u001c", "\u001d", "\u001e", "\u001f"];

      // Opera 7 discards null characters in strings.
      if ("\0".length) {
        expected += 1;
        controlCharacters.push("\u0000");
      }

      this.parses("value", '"value"', "Double-quoted string literal");
      this.parses("", '""', "Empty string literal");

      this.parses("\u2028", '"\\u2028"', "String containing an escaped Unicode line separator");
      this.parses("\u2029", '"\\u2029"', "String containing an escaped Unicode paragraph separator");
      // ExtendScript doesn't handle surrogate pairs correctly; attempting to
      // parse `"\ud834\udf06"` will throw an uncatchable error (issue #29).
      this.parses("\ud834\udf06", '"\ud834\udf06"', "String containing an unescaped Unicode surrogate pair");
      this.parses("\u0001", '"\\u0001"', "String containing an escaped ASCII control character");
      this.parses("\b", '"\\b"', "String containing an escaped backspace");
      this.parses("\f", '"\\f"', "String containing an escaped form feed");
      this.parses("\n", '"\\n"', "String containing an escaped line feed");
      this.parses("\r", '"\\r"', "String containing an escaped carriage return");
      this.parses("\t", '"\\t"', "String containing an escaped tab");

      this.parses("hello/world", '"hello\\/world"', "String containing an escaped solidus");
      this.parses("hello\\world", '"hello\\\\world"', "String containing an escaped reverse solidus");
      this.parses("hello\"world", '"hello\\"world"', "String containing an escaped double-quote character");

      this.parseError("'hello'", "Single-quoted string literal");
      this.parseError('"\\x61"', "String containing a hex escape sequence");
      this.parseError('"hello \r\n world"', "String containing an unescaped CRLF line ending");

      Spec.forEach(controlCharacters, function (value) {
        test.parseError('"' + value + '"', "String containing an unescaped ASCII control character");
      });

      this.done(expected);
    });

    testSuite.addTest("`parse`: Array Literals", function () {
      this.parseError("[1, 2, 3,]", "Trailing comma in array literal");
      this.parses([1, 2, [3, [4, 5]], 6, [true, false], [null], [[]]], "[1, 2, [3, [4, 5]], 6, [true, false], [null], [[]]]", "Nested arrays");
      this.parses([{}], "[{}]", "Array containing empty object literal");
      this.parses([100, true, false, null, {"a": ["hello"], "b": ["world"]}, [0.01]], "[1e2, true, false, null, {\"a\": [\"hello\"], \"b\": [\"world\"]}, [1e-2]]", "Mixed array");
      this.done(4);
    });

    testSuite.addTest("`parse`: Object Literals", function () {
      this.parses({"hello": "world"}, "{\"hello\": \"world\"}", "Object literal containing one member");
      this.parses({"hello": "world", "foo": ["bar", true], "fox": {"quick": true, "purple": false}}, "{\"hello\": \"world\", \"foo\": [\"bar\", true], \"fox\": {\"quick\": true, \"purple\": false}}", "Object literal containing multiple members");

      this.parseError("{key: 1}", "Unquoted identifier used as a property name");
      this.parseError("{false: 1}", "`false` used as a property name");
      this.parseError("{true: 1}", "`true` used as a property name");
      this.parseError("{null: 1}", "`null` used as a property name");
      this.parseError("{'key': 1}", "Single-quoted string used as a property name");
      this.parseError("{1: 2, 3: 4}", "Number used as a property name");

      this.parseError("{\"hello\": \"world\", \"foo\": \"bar\",}", "Trailing comma in object literal");
      this.done(9);
    });

    // JavaScript expressions should never be evaluated, as Crumpet does not use
    // `eval`.
    testSuite.addTest("`parse`: Invalid Expressions", function (test) {
      Spec.forEach(["1 + 1", "1 * 2", "var value = 123;", "{});value = 123;({}", "call()", "1, 2, 3, \"value\""], function (expression) {
        test.parseError(expression, "Source string containing a JavaScript expression");
      });
      this.done(6);
    });

    /*
     * The following tests are adapted from the ECMAScript 5 Conformance Suite.
     * Copyright 2009, Microsoft Corporation. Distributed under the New BSD License.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are met:
     *
     *   - Redistributions of source code must retain the above copyright notice,
     *     this list of conditions and the following disclaimer.
     *   - Redistributions in binary form must reproduce the above copyright notice,
     *     this list of conditions and the following disclaimer in the documentation
     *     and/or other materials provided with the distribution.
     *   - Neither the name of Microsoft nor the names of its contributors may be
     *     used to endorse or promote products derived from this software without
     *     specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
     * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
     * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
     * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
     * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
     * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
     * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
     * POSSIBILITY OF SUCH DAMAGE.
    */
    testSuite.addTest("ECMAScript 5 Conformance", function () {
      var value = { "a1": { "b1": [1, 2, 3, 4], "b2": { "c1": 1, "c2": 2 } }, "a2": "a2" };

      // Section 15.12.1.1: The JSON Grammar.
      // ------------------------------------

      // Tests 15.12.1.1-0-1 thru 15.12.1.1-0-8.
      this.parseError("12\t\r\n 34", "Valid whitespace characters may not separate two discrete tokens");
      this.parseError("\u000b1234", "The vertical tab is not a valid whitespace character");
      this.parseError("\u000c1234", "The form feed is not a valid whitespace character");
      this.parseError("\u00a01234", "The non-breaking space is not a valid whitespace character");
      this.parseError("\u200b1234", "The zero-width space is not a valid whitespace character");
      this.parseError("\ufeff1234", "The byte order mark (zero-width non-breaking space) is not a valid whitespace character");
      this.parseError("\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u30001234", "Other Unicode category `Z` characters are not valid whitespace characters");
      this.parseError("\u2028\u20291234", "The line (U+2028) and paragraph (U+2029) separators are not valid whitespace characters");

      // Test 15.12.1.1-0-9.
      this.parses({ "property": {}, "prop2": [true, null, 123.456] },
        '\t\r \n{\t\r \n' +
        '"property"\t\r \n:\t\r \n{\t\r \n}\t\r \n,\t\r \n' +
        '"prop2"\t\r \n:\t\r \n' +
          '[\t\r \ntrue\t\r \n,\t\r \nnull\t\r \n,123.456\t\r \n]' +
        '\t\r \n}\t\r \n',
      "Valid whitespace characters may precede and follow all tokens");

      // Tests 15.12.1.1-g1-1 thru 15.12.1.1-g1-4.
      this.parses(1234, "\t1234", "Leading tab characters should be ignored");
      this.parseError("12\t34", "A tab character may not separate two disparate tokens");
      this.parses(1234, "\r1234", "Leading carriage returns should be ignored");
      this.parseError("12\r34", "A carriage return may not separate two disparate tokens");
      this.parses(1234, "\n1234", "Leading line feeds should be ignored");
      this.parseError("12\n34", "A line feed may not separate two disparate tokens");
      this.parses(1234, " 1234", "Leading space characters should be ignored");
      this.parseError("12 34", "A space character may not separate two disparate tokens");

      // Tests 15.12.1.1-g2-1 thru 15.12.1.1-g2-5.
      this.parses("abc", '"abc"', "Strings must be enclosed in double quotes");
      this.parseError("'abc'", "Single-quoted strings are not permitted");
      // Note: the original test 15.12.1.1-g2-3 (`"\u0022abc\u0022"`) is incorrect,
      // as the JavaScript interpreter will always convert `\u0022` to `"`.
      this.parseError("\\u0022abc\\u0022", "Unicode-escaped double quote delimiters are not permitted");
      this.parseError('"ab'+"c'", "Strings must terminate with a double quote character");
      this.parses("", '""', "Strings may be empty");

      // Tests 15.12.1.1-g4-1 thru 15.12.1.1-g4-4.
      this.parseError('"\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007"', "Unescaped control characters in the range [U+0000, U+0007] are not permitted within strings");
      this.parseError('"\u0008\u0009\u000a\u000b\u000c\u000d\u000e\u000f"', "Unescaped control characters in the range [U+0008, U+000F] are not permitted within strings");
      this.parseError('"\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017"', "Unescaped control characters in the range [U+0010, U+0017] are not permitted within strings");
      this.parseError('"\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f"', "Unescaped control characters in the range [U+0018, U+001F] are not permitted within strings");

      // Tests 15.12.1.1-g5-1 thru 15.12.1.1-g5-3.
      this.parses("X", '"\\u0058"', "Unicode escape sequences are permitted within strings");
      this.parseError('"\\u005"', "Unicode escape sequences may not comprise fewer than four hexdigits");
      this.parseError('"\\u0X50"', "Unicode escape sequences may not contain non-hex characters");

      // Tests 15.12.1.1-g6-1 thru 15.12.1.1-g6-7.
      this.parses("/", '"\\/"', "Escaped solidus");
      this.parses("\\", '"\\\\"', "Escaped reverse solidus");
      this.parses("\b", '"\\b"', "Escaped backspace");
      this.parses("\f", '"\\f"', "Escaped form feed");
      this.parses("\n", '"\\n"', "Escaped line feed");
      this.parses("\r", '"\\r"', "Escaped carriage return");
      this.parses("\t", '"\\t"', "Escaped tab");
    });

    // testSuite.shuffle();
    return testSuite;
  }

  if (isLoader) {
    define(["json", "spec", "newton"], defineTests);
  } else {
    var Spec = load("Spec", "./../vendor/spec");
    var Newton = load("Newton", "./../vendor/newton");
    var Crumpet = load("Crumpet", "../src/json-crumpet");

    var testSuite = defineTests(Crumpet, Spec, Newton);
    Crumpet.testSuite = testSuite;

    if (!isBrowser && (!isModule || (typeof module == "object" && module == require.main))) {
      testSuite.run();
    }
  }
})(this);
// vim: set sw=2 ts=2 sts=2 et:
