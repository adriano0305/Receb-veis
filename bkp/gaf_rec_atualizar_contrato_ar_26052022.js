/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
const approvalStatus = (idContrato) => {
    log.audit('approvasStatus', idContrato);

    var bscTransacao = search.create({type: "invoice",
        filters: [
            ["shipping","is","F"], "AND", 
            ["taxline","is","F"], "AND", 
            ["mainline","is","T"], "AND", 
            ["type","anyof","CustInvc"], "AND", 
            ["custbody_lrc_fatura_principal","anyof",idContrato]
        ],
        columns: [
            "internalid","tranid","trandate","total"
        ]
    }).run().getRange(0,1000);
    log.audit('bscTransacao', bscTransacao);

    if (bscTransacao.length > 0) {
        for (i=0; i<bscTransacao.length; i++) {
            record.submitFields({type: 'invoice',
                id: bscTransacao[i].id,
                values: {
                    approvalstatus: 2, // Aprovado
                    custbody_rsc_tipo_transacao_workflow: 102 // PV - Contrato
                },
                options: {
                    ignoreMandatoryFields : true
                }
            });
        }
    }
}

const onRequest = (context) => {
    log.audit('onRequest', context);
    
    const metodo = context.request.method;

    const parametros = context.request.parameters;

    const response = context.response;
    
    log.audit(metodo, parametros);

    if (metodo == 'POST') {
        approvalStatus(parametros.id);
    }
}

return {
    onRequest: onRequest
}
});
