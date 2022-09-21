/**
*@NApiVersion 2.x
*@NScriptType MapReduceScript
*
* MapReduce_fluxoEscritura.js
*
*
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/search", "N/record", "N/log"], function (require, exports, search_1, record_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reduce = exports.map = exports.getInputData = void 0;
    search_1 = __importDefault(search_1);
    record_1 = __importDefault(record_1);
    log_1 = __importDefault(log_1);
    var getInputData = function () {
        return search_1.default.create({
            type: 'customrecord_rsc_escritura_distrato',
            filters: [
                ['custrecord_rsc_cancelou_invoice', 'IS', 'F'],
                'AND',
                ['custrecord_rsc_status_distrato', 'IS', 3]
            ],
            columns: [
                'custrecord_rsc_contrato_distrato'
            ]
        });
    };
    exports.getInputData = getInputData;
    var map = function (ctx) {
        log_1.default.error("entrou no map", "done");
        var pedido = 0;
        var req = JSON.parse(ctx.value);
        log_1.default.error("req.id", req.id);
        var escrituraDistrato = req.values;
        var contratoId = escrituraDistrato.custrecord_rsc_contrato_distrato;
        log_1.default.error("contratoId", contratoId);
        var financiamentoID = 0;
        var arrayResult = [];
        search_1.default.create({
            type: 'customsale_rsc_financiamento',
            filters: [
                ['custbody_lrc_fatura_principal', 'IS', contratoId.value],
                "AND",
                ['mainline', 'IS', 'T']
            ]
        }).run().each(function (result) {
            ctx.write({
                key: pedido++,
                value: result.id
            });
            return true;
        });
        var distratoRecord = record_1.default.load({
            type: 'customrecord_rsc_escritura_distrato',
            id: req.id
        });
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_cancelou_invoice',
            value: true
        });
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_status_cancelamento',
            value: "Concluido"
        });
        distratoRecord.save({
            ignoreMandatoryFields: true
        });
        log_1.default.error('Error', 'e');
    };
    exports.map = map;
    var reduce = function (ctx) {
        log_1.default.error("entrou no reduce", "done");
        var financiamentoID = JSON.parse(ctx.values[0]);
        log_1.default.error("result.id", financiamentoID);
        var financiamentoRecord = record_1.default.load({
            type: 'customsale_rsc_financiamento',
            id: financiamentoID
        });
        log_1.default.error("result.id", financiamentoID);
        financiamentoRecord.setValue({
            fieldId: 'transtatus',
            value: "C"
        });
        financiamentoRecord.save({
            ignoreMandatoryFields: true
        });
    };
    exports.reduce = reduce;
});
