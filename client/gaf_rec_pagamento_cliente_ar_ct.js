/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
*/
define(['N/log', 'N/runtime'], function(log, runtime) {
const id_URL_Transacao = (str) => {
    return str.replace(/\D/g, '');
}

function lineInit(context) {}

function pageInit(context) {
    log.audit('pageInit', context);

    const registroAtual = context.currentRecord;

    const modo = context.mode;
    
    const ambiente = runtime.envType;

    if (modo == 'create') {
        var urlFormulario = window.location.href; //  URL do Formulário

        var id_url_transacao = ambiente == 'PRODUCTION' ? id_URL_Transacao(urlFormulario.substr(101, 10)) : id_URL_Transacao(urlFormulario.substr(105, 10));
        log.audit('id_url_transacao', id_url_transacao);
    
        registroAtual.setValue('custbody_rsc_id_url_transacao', id_url_transacao);
    }   
}

function postSourcing(context) {}

function saveRecord(context) {}

function sublistChanged(context) {}

function validateDelete(context) {}

function validateField(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function fieldChanged(context) {}

return {
    // lineInit: lineInit,
    pageInit: pageInit,
    // postSourcing : postSourcing,
    // saveRecord : saveRecord,
    // sublistChanged : sublistChanged,
    // validateDelete : validateDelete,
    // validateField : validateField,
    // validateInsert : validateInsert,
    // validateLine : validateLine,
    // fieldChanged : fieldChanged
}
});
