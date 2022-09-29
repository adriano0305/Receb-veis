/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/log', 'N/query', 'N/record', 'N/runtime', 'N/search'], (log, query, record, runtime, search) => {
function tratativasContrato(idContrato) {
    log.audit('tratativasContrato', idContrato);

    // var bsc_parcelas_aberto = search.create({type: "invoice",
    //     filters: [
    //        ["cogs","is","F"], "AND", 
    //        ["shipping","is","F"], "AND", 
    //        ["taxline","is","F"], "AND", 
    //        ["mainline","is","T"], "AND", 
    //        ["type","anyof","CustInvc"], "AND", 
    //        ["custbody_lrc_fatura_principal","anyof",idContrato], "AND", 
    //        ["status","anyof","CustInvc:A"]
    //     ],
    //     columns: [
    //         search.createColumn({name: "datecreated", sort: search.Sort.ASC, label: "Data de criação"}),
    //         "entity","tranid","statusref","custbody_lrc_fatura_principal","total"
    //     ]
    // }).run().getRange(0,1000);
    // log.audit('bsc_parcelas_aberto', bsc_parcelas_aberto);

    // if (bsc_parcelas_aberto.length > 0) {
    //     for (var prop in bsc_parcelas_aberto) {
    //         if (bsc_parcelas_aberto.hasOwnProperty(prop)) {
    //             log.audit(bsc_parcelas_aberto[prop].id, 'Aguardando retorno do consultor para as tratativas de cancelamento...');
    //         }
    //     }
    // }

    // Aqui.

    var myInvoiceQuery = query.create({type: 'transaction'});

    var type = myInvoiceQuery.createCondition({
        fieldId: 'type',
        operator: query.Operator.ANY_OF,
        values: 'CustInvc'
    });

    var faturaPrincipal = myInvoiceQuery.createCondition({
        fieldId: 'custbody_lrc_fatura_principal',
        operator: query.Operator.ANY_OF,
        values: idContrato
    });

    myInvoiceQuery.condition = myInvoiceQuery.and(
        type, faturaPrincipal
    );

    myInvoiceQuery.columns = [
        myInvoiceQuery.createColumn({
            fieldId: 'id'
        }),
        myInvoiceQuery.createColumn({
            fieldId: 'tranid'
        }),
    ];

    var resultSet = myInvoiceQuery.run();
    log.audit('resultSet', resultSet);

    var results = resultSet.results;
    log.audit('results', results);

    results.forEach(function(result){
        log.audit(result.values, 'Aguardando retorno do consultor para as tratativas de cancelamento...');
    });        
}

const execute = (context) => {
    log.audit('execute', context);

    const scriptAtual = runtime.getCurrentScript();
    const distrato = JSON.parse(scriptAtual.getParameter({name: 'custscript_rsc_distrato'}));
    log.audit('distrato', distrato);

    if (distrato) {
        var lookupDistrato = search.lookupFields({type: 'customrecord_rsc_escritura_distrato',
            id: distrato,
            columns: ['custrecord_rsc_contrato_distrato']
        });
        log.audit('lookupDistrato', lookupDistrato);

        if (lookupDistrato.custrecord_rsc_contrato_distrato[0]) {
            tratativasContrato(lookupDistrato.custrecord_rsc_contrato_distrato[0].value);
        }        
    }
}

return {
    execute: execute
}
});
