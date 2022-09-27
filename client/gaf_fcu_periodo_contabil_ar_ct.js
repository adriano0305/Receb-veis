/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript   
*/
define(['N/log'], (log) => {
function lineInit(context) {}

function pageInit(context) {}

function postSourcing(context) {}

function saveRecord(context) {
    log.audit('saveRecord', context);
    return true;
}

function sublistChanged(context) {}

function validateDelete(context) {}

function validateField(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function fieldChanged(context) {}

return {
    // lineInit: lineInit,
    // pageInit: pageInit,
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
