/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */

const opcoes = {
    enableSoucing: true,
    ignoreMandatoryFields: true
}

define(['N/log', 'N/record', 'N/search'], function(log, record, search) {
const atualizar_registro_personalizado = (tipo, idInterno, valores) => {
    // log.audit('atualizar_registro_personalizado', {tipo: tipo, idInterno: idInterno, valores: valores});
    
    record.submitFields({type: tipo,
        id: idInterno,
        values: valores,
        options: opcoes       
    });

    log.audit('atualizar_registro_personalizado', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, valores: valores});
}

function execute(context) {
    log.audit('execute', context) ;

    var bsc_boletos_vencidos = search.create({type: "creditmemo",
        filters: [
            ["mainline","is","T"], "AND", 
            ["type","anyof","CustCred"], "AND", 
            ["custbody_rsc_vencimento_boleto","before","today"], "AND", 
            ["custbody_rsc_numero_renegociacao.custrecord_rsc_status_aprovacao","anyof","1","2"] // Esperando aprovação ou Aprovado
        ],
        columns: [
            "trandate","entity","tranid","custbody_rsc_vencimento_boleto","custbody_rsc_numero_renegociacao"
        ]
    }).run().getRange(0,1000);
    log.audit('bsc_boletos_vencidos', bsc_boletos_vencidos);

    var campos = {
        custrecord_rsc_status_aprovacao: 3 // Rejeitado
    }

    if (bsc_boletos_vencidos.length > 0) {
        for (var prop in bsc_boletos_vencidos) {
            var numeroRenegociacao = bsc_boletos_vencidos[prop].getValue('custbody_rsc_numero_renegociacao');
            atualizar_registro_personalizado('customrecord_rsc_tab_efetiva_reparcela', numeroRenegociacao, campos);
        }        
    }   
}

return {
    execute: execute
}
});
