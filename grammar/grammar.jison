%lex
%x string
%%

[{] return '{';
[}] return '}';

[\[] return '[';
[\]] return ']';

[,] return ',';
[:] return ':';

"true"  return 'TRUE';
"false" return 'FALSE';
"null"  return 'NULL';

[-]?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)? return 'NUMBER';

["]                                         this.begin('string');       return 'QUOTE';
<string>(\\[\\"bnfrt\/])+                   /* C-style escaped chars */ return 'CHARS';
<string>(\\u[0-9a-fA-F]{4})+                /* Unicode code points   */ return 'CHARS';
<string>([^\\"\u0000-\u001f\u0080-\u009f])+ /* Normal characters     */ return 'CHARS';
<string>["]                                 this.popState();            return 'QUOTE';

[\ \n\r\t]+ /* nope */

. return 'INVALID';

<<EOF>> return 'EOF';

/lex
%start document
%%

document
: value EOF
{ return $value }
;

value
: string
| number
| object
| array
| TRUE  -> true
| FALSE -> false
| NULL  -> null
;

object
: "{" "}"         -> {}
| "{" members "}" -> $members
;

members
: pair
| members "," pair -> yy.merge($members, $pair)
;

pair
: string ":" value -> yy.pair($string, $value)
;

array
: "[" "]"          -> []
| "[" elements "]" -> $elements
;

elements
: value              -> [$value]
| elements "," value -> yy.conj($elements, $value)
;

string
: QUOTE QUOTE       -> ""
| QUOTE chars QUOTE -> yy.unescape($chars)
;

chars
: CHARS       -> $1
| chars CHARS -> $1  + $2
;

number
: NUMBER -> parseFloat($1, 10)
;
