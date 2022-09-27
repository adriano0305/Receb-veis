/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/log', 'N/record'], function(log, record) {
function beforeLoad(ctx) {
    var page = ctx.newRecord;

    if (ctx.request.parameters.itemrcpt) {
        page.setValue({
            fieldId: 'custbody_rsc_numero_recebimento_fisico',
            value: ctx.request.parameters.itemrcpt
        });
    }   
}

function afterSubmit(ctx) {
    var page = ctx.newRecord;

    var pageid = page.id;
    var recibo = page.getValue('custbody_rsc_numero_recebimento_fisico');

    if (ctx.type != 'delete') {
        if (recibo) {
            record.submitFields({ // record.load e record.save junto
                type: 'itemreceipt',
                id: recibo,
                values: {
                    'custbody_rsc_numero_fatura_for': pageid
                },
                options: {
                    enablesourcing: true,
                    ignoreMandatoryFields: true
                }
            });
        }        
    }    
}

return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit
}
});