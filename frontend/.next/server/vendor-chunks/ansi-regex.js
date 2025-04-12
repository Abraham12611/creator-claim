"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/ansi-regex";
exports.ids = ["vendor-chunks/ansi-regex"];
exports.modules = {

/***/ "(ssr)/./node_modules/ansi-regex/index.js":
/*!******************************************!*\
  !*** ./node_modules/ansi-regex/index.js ***!
  \******************************************/
/***/ ((module) => {

eval("\nmodule.exports = ({ onlyFirst = false } = {})=>{\n    const pattern = [\n        '[\\\\u001B\\\\u009B][[\\\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\\\d\\\\/#&.:=?%@~_]+)*|[a-zA-Z\\\\d]+(?:;[-a-zA-Z\\\\d\\\\/#&.:=?%@~_]*)*)?\\\\u0007)',\n        '(?:(?:\\\\d{1,4}(?:;\\\\d{0,4})*)?[\\\\dA-PR-TZcf-ntqry=><~]))'\n    ].join('|');\n    return new RegExp(pattern, onlyFirst ? undefined : 'g');\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYW5zaS1yZWdleC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTtBQUViQSxPQUFPQyxPQUFPLEdBQUcsQ0FBQyxFQUFDQyxZQUFZLEtBQUssRUFBQyxHQUFHLENBQUMsQ0FBQztJQUN6QyxNQUFNQyxVQUFVO1FBQ2Y7UUFDQTtLQUNBLENBQUNDLElBQUksQ0FBQztJQUVQLE9BQU8sSUFBSUMsT0FBT0YsU0FBU0QsWUFBWUksWUFBWTtBQUNwRCIsInNvdXJjZXMiOlsiL2hvbWUvdWJ1bnR1L2NyZWF0b3ItY2xhaW0vY2Vkb3JpLWNsYWltL2Zyb250ZW5kL25vZGVfbW9kdWxlcy9hbnNpLXJlZ2V4L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoe29ubHlGaXJzdCA9IGZhbHNlfSA9IHt9KSA9PiB7XG5cdGNvbnN0IHBhdHRlcm4gPSBbXG5cdFx0J1tcXFxcdTAwMUJcXFxcdTAwOUJdW1tcXFxcXSgpIzs/XSooPzooPzooPzooPzo7Wy1hLXpBLVpcXFxcZFxcXFwvIyYuOj0/JUB+X10rKSp8W2EtekEtWlxcXFxkXSsoPzo7Wy1hLXpBLVpcXFxcZFxcXFwvIyYuOj0/JUB+X10qKSopP1xcXFx1MDAwNyknLFxuXHRcdCcoPzooPzpcXFxcZHsxLDR9KD86O1xcXFxkezAsNH0pKik/W1xcXFxkQS1QUi1UWmNmLW50cXJ5PT48fl0pKSdcblx0XS5qb2luKCd8Jyk7XG5cblx0cmV0dXJuIG5ldyBSZWdFeHAocGF0dGVybiwgb25seUZpcnN0ID8gdW5kZWZpbmVkIDogJ2cnKTtcbn07XG4iXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm9ubHlGaXJzdCIsInBhdHRlcm4iLCJqb2luIiwiUmVnRXhwIiwidW5kZWZpbmVkIl0sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/ansi-regex/index.js\n");

/***/ })

};
;