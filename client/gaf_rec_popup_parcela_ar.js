/**
*@NApiVersion 2.x
*@NScriptType ClientScript
*/

const custPage = 'custpage_rsc_';

define(['N/currentRecord', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/ui/dialog', 'N/url'], function(currentRecord, log, record, runtime, search, dialog, url) {
function fechar() {
    const registroAtual = currentRecord.get();

    var idBoleto = registroAtual.getValue(custPage+'id_boleto');

    var urlBoleto = url.resolveRecord({
        recordType: 'creditmemo',
        recordId: idBoleto,
        isEditMode: false
    });
    console.log('urlBoleto', urlBoleto);
    // window.opener.location.navigate(urlBoleto);
    // window.opener.location.replace(urlBoleto);

    // window.opener.location.reload();
    window.opener.location.replace(window.opener.location);
    window.close();
}

function pageInit(context) {}

function saveRecord(context) {
    const registroAtual = context.currentRecord;

    // dialog.alert({
    //     title: 'Aviso!',
    //     message: 'Validar dados antes de salvar.'
    // });

    // return false;

    return true;
}

function validateField(context) {}

function fieldChanged(context) {}

function postSourcing(context) {}

function lineInit(context) {}

function validateDelete(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function sublistChanged(context) {}

return {
    fechar: fechar,
    // pageInit: pageInit,
    saveRecord: saveRecord,
    // validateField: validateField,
    // fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    // sublistChanged: sublistChanged
}
});
