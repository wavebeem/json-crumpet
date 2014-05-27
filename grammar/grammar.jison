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
<number>.{0}            this.popState();

/** Strings **/
["]                                         this.begin('string');       return 'QUOTE';
<string>(\\[\\"bnfrt\/])+                   /* C-style escaped chars */ return 'CHARS';
<string>(\\u[0-9a-fA-F]{4})+                /* Unicode code points   */ return 'CHARS';
<string>([^\\"\u0000-\u001f\u0080-\u009f])+ /* Normal characters     */ return 'CHARS';
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
    : INT           -> yy.number($1)
    | INT EXP       -> yy.number($1 + $2)
    | INT FRAC      -> yy.number($1 + $2)
    | INT FRAC EXP  -> yy.number($1 + $2 + $3)
    ;
