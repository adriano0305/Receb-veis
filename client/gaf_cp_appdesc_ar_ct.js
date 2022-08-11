/**
 *@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/log'], (log) => {
const pageInit = (context) => {
    const registroAtual = context.currentRecord;

    var valorDesconto = registroAtual.getField({fieldId: 'discountamount'});
    valorDesconto.isDisabled = false;
}

const saveRecord = (context) => {}

const validateField = (context) => {
    const registroAtual = context.currentRecord;
    log.audit('registroAtual', registroAtual);
    return true;
}

const fieldChanged = (context) => {
    const registroAtual = context.currentRecord;

    var campo = context.fieldId;
    log.audit('campo', campo);

    if (campo == 'discountamount') {
        var valorDesconto = registroAtual.getField({fieldId: campo});
        log.audit('valorDesconto', valorDesconto);
        var focus_valor_desconto = document.getElementById(campo);
        log.audit('focus_valor_desconto', focus_valor_desconto);
        focus_valor_desconto.focus();
    }
}

const postSourcing = (context) => {}

const lineInit = (context) => {}

const validateDelete = (context) => {}

const validateInsert = (context) => {}

const validateLine = (context) => {}

const sublistChanged = (context) => {}

return {
    pageInit: pageInit,
    // saveRecord: saveRecord,
    validateField: validateField,
    // fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    // sublistChanged: sublistChanged
}
});
