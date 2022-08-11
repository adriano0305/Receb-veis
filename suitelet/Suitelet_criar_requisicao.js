/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*
* Suitelet para criação dos parâmetros de modelo de requisição
*
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/ui/serverWidget", "N/log", "N/search", "N/record"], function (require, exports, UI, log_1, search_1, record_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    UI = __importStar(UI);
    log_1 = __importDefault(log_1);
    search_1 = __importDefault(search_1);
    record_1 = __importDefault(record_1);
    var onRequest = function (ctx) {
        var form = UI.createForm({
            title: 'Selecione o modelo que deseja transformar em requisição'
        });
        form.clientScriptModulePath = './Clientscript_telaCriarRequi.js';
        var params = ctx.request.parameters;
        var sublist = form.addSublist({
            id: 'custpage_sublista',
            label: 'Modelos de requisição',
            type: UI.SublistType.INLINEEDITOR
        });
        sublist.addField({
            id: 'custpage_id',
            label: 'ID Interna',
            type: UI.FieldType.INTEGER
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED });
        sublist.addField({
            id: 'custpage_data',
            label: 'Data',
            type: UI.FieldType.DATE
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED });
        sublist.addField({
            id: 'custpage_data_entrega',
            label: 'Data Entrega',
            type: UI.FieldType.DATE
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED });
        sublist.addField({
            id: 'custpage_tarefa',
            label: 'Tarefa Relacionada',
            type: UI.FieldType.SELECT,
            source: 'projecttask'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED });
        sublist.addField({
            id: 'custpage_valor',
            label: 'Valor Estimado',
            type: UI.FieldType.CURRENCY
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED });
        sublist.addField({
            id: 'custpage_projeto',
            label: 'Projeto',
            type: UI.FieldType.INTEGER
        }).updateDisplayType({ displayType: UI.FieldDisplayType.HIDDEN }).defaultValue = params.projeto;
        sublist.addField({
            id: 'custpage_transformar',
            label: 'Selecionar',
            type: UI.FieldType.CHECKBOX
        });
        form.addButton({
            label: 'Criar Requisição',
            id: 'custpage_criar',
            functionName: 'criar'
        });
        form.addButton({
            label: 'Cancelar',
            id: 'custpage_cancelar',
            functionName: 'cancelar'
        });
        ctx.response.writePage(form);
        var lineCount = 0;
        search_1.default.create({
            type: 'customrecord_lrc_param_req_mod_projeto',
            filters: [
                ['custrecord_lrc_mod_proj', 'IS', params.projeto],
                'AND',
                ['custrecord_lrc_processado_modelo', 'IS', 'F'],
                'AND',
                ['custrecord_lrc_criar_requi', 'IS', 'F']
            ],
            columns: [
                'custrecord_lrc_mod_proj_data',
                'custrecord_lrc_mod_proj_data_entrega',
                // 'custrecord_lrc_taf_proj_relacionada',
                'custrecord_lrc_sublist_itens_data',
            ]
        }).run().each(function (result) {
            log_1.default.error('lineCount', result);
            sublist.setSublistValue({
                id: 'custpage_data',
                value: String(result.getValue('custrecord_lrc_mod_proj_data')),
                line: lineCount
            });
            sublist.setSublistValue({
                id: 'custpage_data_entrega',
                value: String(result.getValue('custrecord_lrc_mod_proj_data_entrega')),
                line: lineCount
            });
            // sublist.setSublistValue({
            //     id: 'custpage_tarefa',
            //     value: String(result.getValue('custrecord_lrc_taf_proj_relacionada')),
            //     line: lineCount
            // });
            // const itens = JSON.parse(result.getValue('custrecord_lrc_sublist_itens_data'));
            var valorTotal = 0;
            search_1.default.create({
                type: 'customrecord_lrc_sublista_parametros',
                filters: [
                    ['custrecord_lrc_parametros_sub', 'IS', result.id]
                ],
            }).run().each(function (sublista) {
                var itens = record_1.default.load({
                    type: 'customrecord_lrc_sublista_parametros',
                    id: sublista.id
                });
                var valor = itens.getValue('custrecord_lrc_valoresti');
                valorTotal += Number(valor);
                return true;
            });
            sublist.setSublistValue({
                id: 'custpage_valor',
                value: valorTotal,
                line: lineCount
            });
            sublist.setSublistValue({
                id: 'custpage_id',
                value: result.id,
                line: lineCount
            });
            lineCount++;
            return true;
        });
    };
    exports.onRequest = onRequest;
});
