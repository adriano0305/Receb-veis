/**
* @NApiVersion 2.x
* @NScriptType Suitelet
*
* SuiteLet_sendEmail.ts
*
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/config"], function (require, exports, config_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    config_1 = __importDefault(config_1);
    exports.onRequest = function (ctx) {
        if (ctx.request.method == 'GET') {
            var companyTimeZone = config_1.default.load({ type: config_1.default.Type.COMPANY_INFORMATION }).getText({ fieldId: 'timezone' });
            var timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : companyTimeZone.substr(4, 6).split(':').map(Number);
            ctx.response.write(JSON.stringify(timeZoneOffSet));
        }
    };
});
