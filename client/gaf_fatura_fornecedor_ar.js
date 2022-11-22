/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
*/
define(['N/log', 'N/runtime', 'N/search'], function(log, runtime, search) {
const srcTransacao = (tipo, idInterno, coluna) => {
    var lkpTransacao = search.lookupFields({type: tipo,
        id: idInterno,
        columns: coluna
    });

    return lkpTransacao;
}

const numeroRecebimentoFisico = (str) => {
    return str.replace(/\D/g, '');
}

function lineInit(context) {}

function pageInit(context) {
    log.audit('pageInit', context);

    const registroAtual = context.currentRecord;
    
    const ambiente = runtime.envType;

    var urlFormulario = window.location.href; //  URL do Formulário

    var reciboFisico = ambiente == 'PRODUCTION' ? numeroRecebimentoFisico(urlFormulario.substr(101, 10)) : numeroRecebimentoFisico(urlFormulario.substr(105, 10));
    log.audit('reciboFisico', reciboFisico);

    if (reciboFisico) {
        var dadosRecibo = srcTransacao('itemreceipt', reciboFisico, 'custbody_rsc_data_emissao_nf_receb');
        log.audit('dadosRecibo', dadosRecibo);

        registroAtual.setValue('custbody_rsc_numero_recebimento_fisico', reciboFisico);

        if (Object.keys(dadosRecibo).length > 0) {
            registroAtual.setText('trandate', dadosRecibo.custbody_rsc_data_emissao_nf_receb)
            .setText('custbody_rsc_data_emissao_nf_receb', dadosRecibo.custbody_rsc_data_emissao_nf_receb);
        }        
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
