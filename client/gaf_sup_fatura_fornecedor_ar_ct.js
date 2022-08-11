/**
 *@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/currentRecord', 'N/log', 'N/runtime', 'N/ui/dialog'], function(currentRecord, log, runtime, dialog) {
function pageInit(context) {}

function saveRecord(context) {}

function validateField(context) {}

function fieldChanged(context) {
    // log.audit('fieldChanged', context);

    const registroAtual = context.currentRecord;
    
    const sublista = context.sublistId;
    const campo = context.fieldId;
    const linha = context.line;

    var valor;

    if (sublista != null && sublista == 'item') {
        if (campo == 'customer') {            
            registroAtual.selectLine({sublistId: sublista, line: linha})
            valor = registroAtual.getCurrentSublistValue({sublistId: sublista, fieldId: campo});
            if (valor) {
                log.audit('fieldChanged', {sublista: sublista, campo: campo, linha: linha, status: 'Preenchendo campo "Nome do Projeto".', valor: valor});
                registroAtual.setCurrentSublistValue({sublistId: sublista, fieldId: 'custcol_rsc_fieldcliente', value: valor});
            }
        }
    }
}

function postSourcing(context) {}

function lineInit(context) {}

function validateDelete(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function sublistChanged(context) {}

return {
    // pageInit: pageInit,
    // saveRecord: saveRecord,
    // validateField: validateField,
    fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    // sublistChanged: sublistChanged
}
});
