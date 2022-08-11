/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
*/

const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(['N/log', 'N/record', 'N/search'], function(log, record, search) {
const atualizarTransacao = (tipo, idInterno, campos) => {
    // log.audit('atualizarTransacao', {tipo: tipo, idInterno: idInterno, campos: campos});

    record.submitFields({type: tipo,
        id: idInterno,
        values: campos,
        options: opcoes        
    });

    log.audit('atualizarTransacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, campos: campos});
}

function beforeLoad(context) {}

function afterSubmit(context) {
    log.audit('afterSubmit', context);

    const novoRegistro = context.newRecord;

    if (novoRegistro.id) {
        var fornecedor = {
            value: novoRegistro.getValue('entity'),
            text: novoRegistro.getText('entity')
        }

        var lkpFornecedor = search.lookupFields({type: 'vendor',
            id: fornecedor.value,
            columns: ['email','custentity_enl_cnpjcpf']
        });

        var valores = {
            custbody_emaildofornecedor: lkpFornecedor.email,
            custbody_rsc_cnpjdofornecedor: lkpFornecedor.custentity_enl_cnpjcpf
        }

        atualizarTransacao(novoRegistro.type, novoRegistro.id, valores);
    }
}

function beforeSubmit(context) {}

return {
    beforeLoad : beforeLoad,
    afterSubmit : afterSubmit,
    beforeSubmit : beforeSubmit
}
});