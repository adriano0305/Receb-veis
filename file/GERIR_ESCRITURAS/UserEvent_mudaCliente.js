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
            var tipo_contrato = newRecord.getValue('custbody_rsc_status_contrato');
            var controleEscritura = newRecord.getValue('custbody_lrc_fat_controle_escrituracao');
            if (tipo_contrato == 4) {
                if (controleEscritura) {
                    var controleEscrituraAntigoRecord = record_1.default.load({
                        type: 'customrecord_lrc_controle_escrituracao',
                        id: Number(controleEscritura)
                    });
                    var status = controleEscrituraAntigoRecord.getValue('custrecord_lrc_status_escrituracao');
                    // Se o status for "Escritura transferida" significa que o processo foi realizado.
                    if (status != 26) {
                        var statusControleEscrituraAntigo = controleEscrituraAntigoRecord.getValue('custrecord_lrc_status_escrituracao');
                        var jsonFaturaDados = {
                            tipoEscrituracao: 0,
                            novaDataInicio: 0,
                            novaDataPlanejadaEntrega: 0,
                            statusAtualEscrituracaoId: statusControleEscrituraAntigo,
                            controleEscrituracaoId: controleEscritura,
                            newStatusId: 26,
                            escrituraEncerrada: true,
                            subsidiaria: controleEscrituraAntigoRecord.getValue('subsidiary'),
                            baixaAlienacao: 0
                        };
                        ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
                        log_1.default.audit('afterSubmit', {controleEscritura: controleEscritura, status: status});
                    } else {
                        log_1.default.audit('afterSubmit', {controleEscritura: controleEscritura, status: {value: status, text: 'Escritura transferida'}});
                    }
                    
                }
            }
        }
    };
    exports.afterSubmit = afterSubmit;
});
