/**
 *@NApiVersion 2.1
*@NScriptType MapReduceScript
*/
define(['N/log', 'N/query', 'N/record', 'N/search', 'N/transaction'], (log, query, record, search, transaction) => {
// const getInputData =  (context) => {
//     log.audit('getInputData', context);

//     return search.create({type: "customrecord_rsc_perc_cessao_direito",
//         filters: [
//            ["custrecord_rsc_criador_cd","anyof","3600"], "AND", 
//            ["internalid","anyof","4"]
//         ],
//         columns: [
//             "created","internalid","custrecord_rsc_criador_cd","custrecord_rsc_contrato","custrecord_rsc_cliente_atual","custrecord_rsc_novo_cliente"
//         ]
//     });
// }

// const map = (context) => {
//     log.audit('map', context);

//     const src = JSON.parse(context.value);
//     log.audit('src', src);

//     const junix = 45240; // 18840 TESTE JUNIX 002
//     const taxaCessao = Number('72976,24');

//     const loadPedido = record.load({type: 'salesorder', id: src.values.custrecord_rsc_contrato.value});

//     const total = loadPedido.getValue('total');

//     loadPedido.setValue('entity', junix)
//     .setSublistValue('item', 'rate', 0, total)
//     .setSublistValue('item', 'amount', 0, total)
//     .save({ignoreMandatoryFields: true});

//     log.audit('Status', 'Pedido Atualizado!');

//     const loadCD = record.load({type: 'customrecord_rsc_perc_cessao_direito', id: src.id});

//     for (i=0; i<loadCD.getLineCount('recmachcustrecord_rsc_transferencia_posse'); i++) {
//         var custrecord_rsc_parcela_cessao = loadCD.getSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_parcela_cessao', i);

//         var loadReg = record.load({type: 'invoice', id: custrecord_rsc_parcela_cessao});

//         loadReg.setValue('entity', junix)
//         .setValue('custbody_lrc_fatura_principal', src.values.custrecord_rsc_contrato.value)
//         .save({ingnoreMandatoryFields: true});

//         log.audit(i, 'Parcela Atualizada: '+custrecord_rsc_parcela_cessao);     
//     }

//     loadCD.setValue('custrecord_rsc_status_cessao', 2)
//     .setValue('custrecord_rsc_calculo', taxaCessao)
//     .save({ingnoreMandatoryFields: true});
    
//     log.audit('Status', 'Cessão de Direitos '+src.id+' atualizada.');
// }

const getInputData =  (context) => {
    log.audit('getInputData', context);

    var bsc = search.create({type: "invoice",
        filters: [
           ["shipping","is","F"], "AND", 
           ["taxline","is","F"], "AND", 
           ["mainline","is","T"], "AND", 
           [
                ["type","anyof","SalesOrd"],"AND",
                ["internalid","anyof","213293"],"OR",
                ["type","anyof","CustInvc"],"AND",
                ["custbody_lrc_fatura_principal","anyof","213293"]
           ]
        ],
        columns: [
           search.createColumn({name: "datecreated", sort: search.Sort.ASC, label: "Data de criação"}),
           "internalid", "type"
        ]
    });

    var resultadosBsc = bsc.runPaged().count;
    log.audit('resultadosBsc', resultadosBsc);

    var pedidoCopia = record.copy({type: 'salesorder', id: 213293, isDynamic: true});
    var id_pedido_copia = pedidoCopia.save({ignoreMandatoryFields: true});

    if (id_pedido_copia) {
        var lookupPC = search.lookupFields({type: 'salesorder',
            id: id_pedido_copia,
            columns: ['tranid']
        });
        log.audit('dadosPedido', {
            pedido_copia: {
                id: id_pedido_copia,
                tranid: lookupPC.tranid
            }
        });

        var arrayFaturas = [];

        bsc.run().each(function(result) {
            // log.audit('result', result);

            var lookupResult = search.lookupFields({type: 'invoice',
                id: result.id,
                columns: ['duedate']
            });
            // log.audit('lookupResult', lookupResult);

            var faturaCopia = record.copy({
                type: 'invoice',
                id: result.id,
                defaultValues: {
                    custbody_rsc_tipo_transacao_workflow: 25 // PV - Proposta
                }
            });

            var id_fatura_copia = faturaCopia.save({ignoreMandatoryFields: true});

            if (id_fatura_copia) {
                record.submitFields({
                    type: 'invoice',
                    id: id_fatura_copia,
                    values: {
                        duedate: lookupResult.duedate,
                        custbody_lrc_fatura_principal: id_pedido_copia
                    },
                    options: {
                        ignoreMandatoryFields: true,
                        enablesourcing: true
                    }                    
                });

                var lookupFC = search.lookupFields({type: 'invoice',
                    id: id_fatura_copia,
                    columns: ['tranid']
                });

                arrayFaturas.push({id: id_fatura_copia, tranid: lookupFC.tranid});

                log.audit('Faturamento', {
                    pedido_copia: {
                        id: id_pedido_copia,
                        tranid: lookupPC.tranid
                    },
                    fatura_copia: {
                        total: arrayFaturas.length,
                        lista: arrayFaturas
                    }
                });
            }

            return true;
        });
    }    
}

const map = (context) => {
    log.audit('map', context);

    const src = JSON.parse(context.value);
    log.audit('src', src);
}

const reduce = (context) => {
    log.audit('reduce', context);
}

const summarize = (summary) => {
    var type = summary.toString();
    log.audit(type, 
        '"Uso Consumido:" '+summary.usage+
        ', "Número de Filas:" '+summary.concurrency+
        ', "Quantidade de Saídas:" '+summary.yields
    );
    var contents = '';
    summary.output.iterator().each(function (key, value) {
        contents += (key + ' ' + value + '\n');
        return true;
    });
}

return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
}
});
