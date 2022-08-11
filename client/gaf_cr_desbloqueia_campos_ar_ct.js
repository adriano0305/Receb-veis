/**
 *@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/currentRecord', 'N/log'], function(currentRecord, log) {
function pageInit(context) {
    const registroAtual = currentRecord.get();

    var duedate = registroAtual.getField('duedate');
    log.audit('duedate', duedate);

    duedate.isDisabled = false;
}

function saveRecord(context) {}

function validateField(context) {}

function fieldChanged(context) {}

function postSourcing(context) {}

function lineInit(context) {}

function validateDelete(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function sublistChanged(context) {}

return {
    pageInit: pageInit,
    // saveRecord: saveRecord,
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
