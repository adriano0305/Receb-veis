/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
*/
define(['N/search', 'N/ui/message'], function(search, message) {
function lineInit(context) {}

function pageInit(context) {
    log.audit('pageInit', context);

    const registroAtual = context.currentRecord;
    log.audit('registroAtual', JSON.stringify(registroAtual));

    message.create({
        title: 'Aviso!',
        message: 'Favor configurar o registro "LRC @ Parametrizações da Escrituração" para a subsidiária: ',
        type: message_1.Type.INFORMATION,
        duration: 5000
    });
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
    saveRecord : saveRecord,
    // sublistChanged : sublistChanged,
    // validateDelete : validateDelete,
    // validateField : validateField,
    // validateInsert : validateInsert,
    // validateLine : validateLine,
    // fieldChanged : fieldChanged
};
});
