/**
 *@NApiVersion 2.1
*@NScriptType MassUpdateScript
*/
define(['N/log', 'N/record'], function(log, record) {
const each = (params) => {
    try {
        log.audit('params', params);

        const loadReg = record.load({type: params.type, id: params.id, isDynamic: true});

        loadReg.save({ignoreMandatoryFields: true});

        // loadReg.setValue('customform', 117) // Pedido de Compra BR
        // .save({ignoreMandatoryFields: true});

        log.audit('Atualizado!', {params: params});
    } catch(e) {
        log.error(params.id, e);
    }
}

return {
    each: each
}
});
