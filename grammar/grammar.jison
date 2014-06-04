%lex
%x number
%x string
%%
/** End of file/text **/
<*><<EOF>>     return 'EOF';

/** Punctuation characters **/
[{]  return '{';
[}]  return '}';
[\[] return '[';
[\]] return ']';
[,]  return ',';
[:]  return ':';

/** Named values **/
"true"  return 'TRUE';
"false" return 'FALSE';
"null"  return 'NULL';

/** Numbers **/
[-]?0                   this.begin('number'); return 'INT';
[-]?[1-9][0-9]*         this.begin('number'); return 'INT';
<number>\.[0-9]+        return 'FRAC';
<number>[eE][+-]?[0-9]+ return 'EXP';
<number>                this.popState();

/** Strings **/
["]                                         this.begin('string');       return 'QUOTE';
<string>\\[\\"bnfrt\/]                      /* C-style escaped chars */ return 'SIMPLE_ESCAPE_CHAR';
<string>\\u[0-9a-fA-F]{4}                   /* Unicode code points   */ return 'UNICODE_ESCAPE_CHAR';
<string>([^\\"\u0000-\u001f\u0080-\u009f])+ /* Normal characters     */ return 'NORMAL_CHARS';
<string>["]                                 this.popState();            return 'QUOTE';

/** Whitespace is only important inside strings and numbers **/
[\ \n\r\t]+ /* skip unimportant whitespace */

/** All other characters are invalid **/
. return 'INVALID';
/lex
%%
document
    : value EOF { return $value }
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
    : "{" "}"            -> {}
    | "{" properties "}" -> $properties
    ;
properties
    : pair
    | properties "," pair -> yy.merge($properties, $pair)
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
    | elements "," value -> yy.append($elements, $value)
    ;
string
    : QUOTE chars QUOTE -> $chars
    ;
chars
    : /* zero characters */     -> ""
    | chars NORMAL_CHARS        -> $1 + $2
    | chars UNICODE_ESCAPE_CHAR -> $1 + yy.unescapeUnicode($2)
    | chars SIMPLE_ESCAPE_CHAR  -> $1 + yy.unescapeSimple($2)
    ;
number
    : INT           -> yy.number($1)
    | INT EXP       -> yy.number($1 + $2)
    | INT FRAC      -> yy.number($1 + $2)
    | INT FRAC EXP  -> yy.number($1 + $2 + $3)
    ;
