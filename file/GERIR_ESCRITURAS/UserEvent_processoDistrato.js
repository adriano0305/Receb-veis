/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *
 * UserEvent_processoDistrato.js
 *
 *
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/log", "N/record", "./ClientScript_fluxoEscritura"], function (require, exports, log_1, record_1, ClientScript_fluxoEscritura_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = void 0;
    log_1 = __importDefault(log_1);
    record_1 = __importDefault(record_1);
    var afterSubmit = function (ctx) {
        if (ctx.type == ctx.UserEventType.EDIT) {
            var newRecord = ctx.newRecord;
            var invoiceId = newRecord.getValue("tranid");
            var tipo_contrato = newRecord.getValue('custbody_rsc_status_contrato');
            var controle_escrituracao = newRecord.getValue('custbody_lrc_fat_controle_escrituracao');
            var subsidiary = newRecord.getValue('subsidiary');
            if (tipo_contrato == 3) {
                if (controle_escrituracao) {
                    // const faturaSearchResult = Search.lookupFields({
                    //     type: 'invoice',
                    //     id: invoiceId,
                    //     columns: [
                    //         'custbody_lrc_fat_controle_escrituracao',
                    //         'subsidiary'
                    //     ]
                    // }) as any;
                    // Log.error('faturaSearchResult', faturaSearchResult);
                    var controleEscrituracaoRecord = record_1.default.load({
                        type: 'customrecord_lrc_controle_escrituracao',
                        id: controle_escrituracao
                    });
                    log_1.default.error('controle_id', controle_escrituracao);
                    var jsonFaturaDados = {
                        tipoEscrituracao: 0,
                        novaDataInicio: 0,
                        novaDataPlanejadaEntrega: 0,
                        controleEscrituracaoId: controleEscrituracaoRecord.getValue('id'),
                        statusAtualEscrituracaoId: controleEscrituracaoRecord.getValue('custrecord_lrc_status_escrituracao'),
                        newStatusId: 25,
                        escrituraEncerrada: true,
                        subsidiaria: subsidiary,
                        baixaAlienacao: 0
                    };
                    log_1.default.error('processo distrato', jsonFaturaDados);
                    ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
                }
            }
        }
    };
    exports.afterSubmit = afterSubmit;
});
