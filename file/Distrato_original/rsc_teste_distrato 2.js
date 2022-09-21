/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*
*
*
*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeSubmit = void 0;
    var beforeSubmit = function (ctx) {
        var newRecord = ctx.newRecord;
        newRecord.setValue({
            fieldId: 'transtatus',
            value: "C"
        });
    };
    exports.beforeSubmit = beforeSubmit;
});
