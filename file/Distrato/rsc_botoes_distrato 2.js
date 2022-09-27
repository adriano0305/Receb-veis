/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*
*
*
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = void 0;
    log_1 = __importDefault(log_1);
    var beforeLoad = function (ctx) {
        var form = ctx.form;
        var record = ctx.newRecord;
        // const distratoRecord = Record.load({
        //    type:'customrecord_rsc_escritura_distrato',
        //    id: record.id
        // })
        // Log.error('obs', record.getValue('custrecord_rsc_observacoes'))
        // distratoRecord.setValue({
        //     fieldId:'custrecord_rsc_observacoes',
        //     value: String(record.getValue('custrecord_rsc_observacoes')) + "Teste"
        // })
        // distratoRecord.save();
        var status = record.getValue('custrecord_rsc_status_distrato');
        var canceladas = record.getValue('custrecord_rsc_cancelou_invoice');
        if (status == 2) {
            form.addButton({
                id: 'custpage_btt_cancelar',
                label: "Cancelar Distrato",
                functionName: "cancelar_distrato"
            });
            if (status == 2) {
                form.addButton({
                    id: 'custpage_btt_aprovar_lanc',
                    label: "Aprovar",
                    functionName: "aprovarLanc"
                });
            }
        }
        log_1.default.error("canceladas", canceladas);
        if (status == 5 && canceladas) {
            form.addButton({
                id: 'custpage_gerar_relatorio',
                label: "Gerar Relatório de Distrato",
                functionName: "gerar_relatorio"
            });
            form.addButton({
                id: 'custpage_gerar_minuta',
                label: "Gerar Minuta do Distrato",
                functionName: "gerar_minuta"
            });
        }
        if (status == 3) {
            form.addButton({
                id: 'custpage_btt_aprovar',
                label: "Gerar parcelas negociadas",
                functionName: "aprovar"
            });
        }

        form.clientScriptModulePath = './rsc_funcionalidade_btts_distrato.js';
    };
    exports.beforeLoad = beforeLoad;
});
