"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/onetime";
exports.ids = ["vendor-chunks/onetime"];
exports.modules = {

/***/ "(ssr)/./node_modules/onetime/index.js":
/*!***************************************!*\
  !*** ./node_modules/onetime/index.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nconst mimicFn = __webpack_require__(/*! mimic-fn */ \"(ssr)/./node_modules/mimic-fn/index.js\");\n\nconst calledFunctions = new WeakMap();\n\nconst onetime = (function_, options = {}) => {\n\tif (typeof function_ !== 'function') {\n\t\tthrow new TypeError('Expected a function');\n\t}\n\n\tlet returnValue;\n\tlet callCount = 0;\n\tconst functionName = function_.displayName || function_.name || '<anonymous>';\n\n\tconst onetime = function (...arguments_) {\n\t\tcalledFunctions.set(onetime, ++callCount);\n\n\t\tif (callCount === 1) {\n\t\t\treturnValue = function_.apply(this, arguments_);\n\t\t\tfunction_ = null;\n\t\t} else if (options.throw === true) {\n\t\t\tthrow new Error(`Function \\`${functionName}\\` can only be called once`);\n\t\t}\n\n\t\treturn returnValue;\n\t};\n\n\tmimicFn(onetime, function_);\n\tcalledFunctions.set(onetime, callCount);\n\n\treturn onetime;\n};\n\nmodule.exports = onetime;\n// TODO: Remove this for the next major release\nmodule.exports[\"default\"] = onetime;\n\nmodule.exports.callCount = function_ => {\n\tif (!calledFunctions.has(function_)) {\n\t\tthrow new Error(`The given function \\`${function_.name}\\` is not wrapped by the \\`onetime\\` package`);\n\t}\n\n\treturn calledFunctions.get(function_);\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvb25ldGltZS9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTtBQUNiLGdCQUFnQixtQkFBTyxDQUFDLHdEQUFVOztBQUVsQzs7QUFFQSx3Q0FBd0M7QUFDeEM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSixpQ0FBaUMsYUFBYTtBQUM5Qzs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseUJBQXNCOztBQUV0Qix3QkFBd0I7QUFDeEI7QUFDQSwwQ0FBMEMsZUFBZTtBQUN6RDs7QUFFQTtBQUNBIiwic291cmNlcyI6WyIvaG9tZS91YnVudHUvY3JlYXRvci1jbGFpbS9jZWRvcmktY2xhaW0vZnJvbnRlbmQvbm9kZV9tb2R1bGVzL29uZXRpbWUvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuY29uc3QgbWltaWNGbiA9IHJlcXVpcmUoJ21pbWljLWZuJyk7XG5cbmNvbnN0IGNhbGxlZEZ1bmN0aW9ucyA9IG5ldyBXZWFrTWFwKCk7XG5cbmNvbnN0IG9uZXRpbWUgPSAoZnVuY3Rpb25fLCBvcHRpb25zID0ge30pID0+IHtcblx0aWYgKHR5cGVvZiBmdW5jdGlvbl8gIT09ICdmdW5jdGlvbicpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBhIGZ1bmN0aW9uJyk7XG5cdH1cblxuXHRsZXQgcmV0dXJuVmFsdWU7XG5cdGxldCBjYWxsQ291bnQgPSAwO1xuXHRjb25zdCBmdW5jdGlvbk5hbWUgPSBmdW5jdGlvbl8uZGlzcGxheU5hbWUgfHwgZnVuY3Rpb25fLm5hbWUgfHwgJzxhbm9ueW1vdXM+JztcblxuXHRjb25zdCBvbmV0aW1lID0gZnVuY3Rpb24gKC4uLmFyZ3VtZW50c18pIHtcblx0XHRjYWxsZWRGdW5jdGlvbnMuc2V0KG9uZXRpbWUsICsrY2FsbENvdW50KTtcblxuXHRcdGlmIChjYWxsQ291bnQgPT09IDEpIHtcblx0XHRcdHJldHVyblZhbHVlID0gZnVuY3Rpb25fLmFwcGx5KHRoaXMsIGFyZ3VtZW50c18pO1xuXHRcdFx0ZnVuY3Rpb25fID0gbnVsbDtcblx0XHR9IGVsc2UgaWYgKG9wdGlvbnMudGhyb3cgPT09IHRydWUpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgRnVuY3Rpb24gXFxgJHtmdW5jdGlvbk5hbWV9XFxgIGNhbiBvbmx5IGJlIGNhbGxlZCBvbmNlYCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJldHVyblZhbHVlO1xuXHR9O1xuXG5cdG1pbWljRm4ob25ldGltZSwgZnVuY3Rpb25fKTtcblx0Y2FsbGVkRnVuY3Rpb25zLnNldChvbmV0aW1lLCBjYWxsQ291bnQpO1xuXG5cdHJldHVybiBvbmV0aW1lO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBvbmV0aW1lO1xuLy8gVE9ETzogUmVtb3ZlIHRoaXMgZm9yIHRoZSBuZXh0IG1ham9yIHJlbGVhc2Vcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBvbmV0aW1lO1xuXG5tb2R1bGUuZXhwb3J0cy5jYWxsQ291bnQgPSBmdW5jdGlvbl8gPT4ge1xuXHRpZiAoIWNhbGxlZEZ1bmN0aW9ucy5oYXMoZnVuY3Rpb25fKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgVGhlIGdpdmVuIGZ1bmN0aW9uIFxcYCR7ZnVuY3Rpb25fLm5hbWV9XFxgIGlzIG5vdCB3cmFwcGVkIGJ5IHRoZSBcXGBvbmV0aW1lXFxgIHBhY2thZ2VgKTtcblx0fVxuXG5cdHJldHVybiBjYWxsZWRGdW5jdGlvbnMuZ2V0KGZ1bmN0aW9uXyk7XG59O1xuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/onetime/index.js\n");

/***/ })

};
;