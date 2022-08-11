/**
 *@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/currentRecord', 'N/log', 'N/search', 'N/ui/dialog',], function(currentRecord, log, search, dialog) {
function duplicidade(nome) {
    log.audit('duplicidade', nome);

    var bsc_duplicity = search.create({type: "customrecord_rsc_correction_unit",
        filters: [
           ["name","is",nome]
        ],
        columns: [
            "internalid","name"
        ]
    }).run().getRange(0,1);

    if (bsc_duplicity.length > 0) {
        log.audit('bsc_duplicity', bsc_duplicity);

        dialog.alert({
            title: 'Aviso!',
            message: 'Já existe um registro com este nome. <br>'+
            'ID Interno: '+bsc_duplicity[0].id
        });

        return false;
    } else {
        return true;
    }
}

function pageInit(context) {
    log.audit('pageInit', context);
}

function saveRecord(context) {
    log.audit('saveRecord', context);

    const registroAtual = context.currentRecord;

    const eNovo = registroAtual.isNew;

    const nome = registroAtual.getValue('name');

    return eNovo == true ? duplicidade(nome) : true;
}

function validateField(context) {
    // log.audit('validateField', context);
}

function fieldChanged(context) {
    log.audit('fieldChanged', context);

    const registroAtual = context.currentRecord;
    
    const campo = context.fieldId;

    if (campo == 'name') {
        duplicidade(registroAtual.getValue(campo));
    }
}

function postSourcing(context) {
    // log.audit('postSourcing', context);
}

function lineInit(context) {
    // log.audit('lineInit', context);
}

function validateDelete(context) {
    // log.audit('validateDelete', context);
}

function validateInsert(context) {
    // log.audit('validateInsert', context);
}

function validateLine(context) {
    // log.audit('validateLine', context);
}

function sublistChanged(context) {
    log.audit('sublistChanged', context);

    var registroAtual = context.currentRecord;
    log.audit('registroAtual', registroAtual);

    var sublista = context.sublistId;
    log.audit('sublista', sublista);

    var fator = registroAtual.getCurrentSublistValue({
        sublistId: context.sublistId,
        fieldId: 'custrecord_rsc_hif_factor_percent'
    });
    log.audit('fator', fator);
    log.audit('type fator', typeof(fator));

    fator = String(fator);
    log.audit('fator', fator);

    // if (fator.indexOf('.') != -1) {
    //     dialog.alert({
    //         title: 'Aviso!',
    //         message: 'Favor utilizar pontos para valores decimais.'
    //     });
    // }
}

function addZeroes(num, len) {
    var numberWithZeroes = String(num);

    var counter = numberWithZeroes.length;
        
    while(counter < len) {    
        numberWithZeroes = "0" + numberWithZeroes;        
        counter++;    
     }
    
    return numberWithZeroes;
}

return {
    // pageInit: pageInit,
    saveRecord: saveRecord,
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
