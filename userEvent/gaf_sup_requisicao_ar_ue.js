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
        var linhaItens = novoRegistro.getLineCount('item');

        for (i=0; i<linhaItens; i++) {
            var pedidoVinculado = novoRegistro.getSublistValue('item', 'linkedorder', i); // Pedido de compras

            if (pedidoVinculado.length > 0) {
                var valores = {
                    custbody_rsc_id_requisicao: novoRegistro.id
                }

                atualizarTransacao('purchaseorder', pedidoVinculado[0], valores);
            }
        }        
    }
}

function beforeSubmit(context) {}

return {
    beforeLoad : beforeLoad,
    afterSubmit : afterSubmit,
    beforeSubmit : beforeSubmit
}
});