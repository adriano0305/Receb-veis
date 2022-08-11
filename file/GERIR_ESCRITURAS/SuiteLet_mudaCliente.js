/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *
 * SuiteLet_mudaCliente.ts
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/record", "N/log", "./ClientScript_fluxoEscritura"], function (require, exports, record_1, log_1, ClientScript_fluxoEscritura_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    record_1 = __importDefault(record_1);
    log_1 = __importDefault(log_1);
    exports.onRequest = function (ctx) {
        if (ctx.request.method == 'GET') {
            var params = ctx.request.parameters;
            log_1.default.error("params", params);
            var controleEscrituraAntigoId = params.oldId;
            log_1.default.error("controleEscrituracaoAntigo", controleEscrituraAntigoId);
            var controleEscrituraAntigoRecord = record_1.default.load({
                type: 'customrecord_lrc_controle_escrituracao',
                id: Number(controleEscrituraAntigoId)
            });
            var statusControleEscrituraAntigo = controleEscrituraAntigoRecord.getValue('custrecord_lrc_status_escrituracao');
            var jsonFaturaDados = {
                tipoEscrituracao: 0,
                novaDataInicio: 0,
                novaDataPlanejadaEntrega: 0,
                statusAtualEscrituracaoId: statusControleEscrituraAntigo,
                controleEscrituracaoId: controleEscrituraAntigoId,
                newStatusId: 26,
                escrituraEncerrada: true,
                subsidiaria: controleEscrituraAntigoRecord.getValue('subsidiary'),
                baixaAlienacao: 0
            };
            ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
            log_1.default.debug('muda cliente', 'done');
        }
    };
});
