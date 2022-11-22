/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
*/

const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(['N/log', 'N/record', 'N/search'], function(log, record, search) {
const atualizarEntrada = (tipo, idInterno, valores) => {
    record.submitFields({type: tipo,
        id: idInterno,
        values: valores,
        options: opcoes        
    });

    log.audit('atualizarEntrada', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, valores: valores});
}

function afterSubmit(context) {
    log.audit('afterSumbit', context);

    const novoRegistro = context.newRecord;

    const tipo = context.type;

    const entidade = novoRegistro.type;

    var campos = {};

    if (novoRegistro.id && tipo == 'edit') {
        var inativo = novoRegistro.getValue('isinactive');

        campos.custitem_rsc_status_item = 7; // Item reprovado

        if (inativo == true) {
            atualizarEntrada(entidade, novoRegistro.id, campos);
        }   
    }
}

function beforeLoad(context) {}

function beforeSubmit(context) {}

return {
    afterSubmit : afterSubmit,
    beforeLoad : beforeLoad,    
    beforeSubmit : beforeSubmit
}
});