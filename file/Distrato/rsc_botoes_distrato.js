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

const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(["require", "exports", "N/log", "N/record", "N/search", "N/task"], function (require, exports, log_1, record_1, search_1, task_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = void 0;
    log_1 = __importDefault(log_1);
    record_1 = __importDefault(record_1);
    search_1 = __importDefault(search_1);
    task_1 = __importDefault(task_1);
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
                form.addButton({
                    id: 'custpage_gerar_minuta',
                    label: "Gerar Minuta do Distrato",
                    functionName: "gerar_minuta"
                });
            }
        }
        // log_1.default.error("canceladas", canceladas);
        if (status == 5 && canceladas) {
            form.addButton({
                id: 'custpage_gerar_relatorio',
                label: "Gerar Relatório de Distrato",
                functionName: "gerar_relatorio"
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

    const afterSubmit = function (context) {
        log_1.default.audit('afterSubmit', context);
        
        const novoRegistro = context.newRecord;

        const tipo = context.type;

        if (novoRegistro.id && (tipo == 'create' || tipo == 'edit')) {
            var statusDistrato = novoRegistro.getValue('custrecord_rsc_status_distrato');
        
            // Escriturado
            if (statusDistrato == 2) {
                var contrato = novoRegistro.getValue('custrecord_rsc_contrato_distrato');

                var campos = {
                    custbody_rsc_status_contrato: 3, // Distrato
                    custbody_rsc_distrato: novoRegistro.id,
                }

                atualizarTransacao('salesorder', contrato, campos);
            }

            // Aprovado
            if (statusDistrato == 3) {
                taskDistrato(novoRegistro.id);             
            }
        }
    };
    exports.afterSubmit = afterSubmit;

    function taskDistrato(idInterno) {
        var scriptTask = task_1.default.create({
            taskType: task_1.default.TaskType.SCHEDULED_SCRIPT,
            scriptId: 1972,                                
            params: {
                custscript_rsc_distrato: idInterno
            }
        });
        log_1.default.audit('scriptTask', scriptTask);
    
        var scriptTaskId = scriptTask.submit();
        log_1.default.audit('task', {scriptTaskId: scriptTaskId, scriptTask: scriptTask});        
    }

    function atualizarTransacao(tipo, idInterno, valores) {
        // log_1.default.audit('atualizarTransacao', {tipo: tipo, idInterno: idInterno, valores: valores});

        const loadReg = record_1.default.load({type: tipo, id: idInterno});

        var load_ctrl_esc = record_1.default.load({type: 'customrecord_lrc_controle_escrituracao', id: loadReg.getValue('custbody_lrc_fat_controle_escrituracao')});

        loadReg.setValue('custbody_rsc_status_contrato', valores.custbody_rsc_status_contrato)
        .setValue('custbody_rsc_distrato', valores.custbody_rsc_distrato)
        .save(opcoes);

        log_1.default.audit('atualizarTransacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, valores: valores});

        ctrlEsc(load_ctrl_esc);
    }

    function ctrlEsc(bookeepingControl) {
        // log_1.default.audit('ctrlEsc', bookeepingControl);

        var relacao = {
            id_ctrl_esc: bookeepingControl.id,
            TAS: []
        };

        var id_ctrl_esc = bookeepingControl.id;

        bookeepingControl.setValue('custrecord_lrc_status_escrituracao', 25) // Unidade Distratada
        .save(opcoes)

        log_1.default.audit('ctrlEsc', {status: 'Sucesso', ctrlEsc: id_ctrl_esc, status_ctrl_esc: 'Unidade Distratada'});

        var bscTAS = search_1.default.create({type: "customrecord_lrc_tab_andamento_status",
            filters: [
               ["custrecord_lrc_controle_escrituracao","anyof",id_ctrl_esc]
            ],
            columns: [
                search_1.default.createColumn({name: "name", sort: search_1.default.Sort.ASC, label: "Nome"}),
               "custrecord_lrc_controle_escrituracao","custrecord_lrc_referente_faturamento","custrecord_lrc_referente_cliente","custrecord_lrc_status_alterado","custrecord_lrc_alterado_para_status"
            ]
        }).run().getRange(0,1000);
        log_1.default.audit('bscTAS', bscTAS);

        if (bscTAS.length > 0) {
            for (var prop in bscTAS) {
                if (bscTAS.hasOwnProperty(prop)) {
                    record_1.default.submitFields({type: 'customrecord_lrc_tab_andamento_status',
                        id: bscTAS[prop].id,
                        values: {
                            custrecord_lrc_alterado_para_status: 25 // Unidade Distratada
                        },
                        options: opcoes                    
                    });

                    relacao.TAS.push(bscTAS[prop].id);
                }                
            }
            log_1.default.audit('ctrlEsc', {status: 'Sucesso', ctrlEsc: relacao});
        }
    }
});
