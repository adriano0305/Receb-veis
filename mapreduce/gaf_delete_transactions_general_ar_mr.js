/**
 *@NApiVersion 2.1
*@NScriptType MapReduceScript
*/
define(['N/log', 'N/record', 'N/search'], function(log, record, search) {
function getInputData(context) {
    log.audit('getInputData', context);

    // return search.create({type: "vendorbill",
    //     filters: [
    //         ["cogs","is","F"], "AND", 
    //         ["shipping","is","F"], "AND", 
    //         ["taxline","is","F"], "AND", 
    //         ["mainline","is","F"], "AND", 
    //         ["type","anyof","VendBill"], "AND", 
    //         ["item","noneof","@NONE@"], "AND", 
    //         ["item","anyof","30387"], "AND", 
    //         ["amount","equalto","2040.58"], "AND", 
    //         ["postingperiod","abs","159"]
    //         // , "AND", 
    //         // ["internalid","anyof","173493"]
    //     ],
    //     columns: [
    //        search.createColumn({name: "datecreated", sort: search.Sort.DESC, label: "Data de criação"}),
    //        search.createColumn({name: "formulatext", formula: "{tranid}", label: "Fórmula (texto)"}),
    //        search.createColumn({name: "item", label: "Item"}),
    //        search.createColumn({name: "amount", label: "Valor"})
    //     ]
    // });

    return search.load(1525);
}

function map(context) {
    // log.audit('map', context);

    const resultBsc = JSON.parse(context.value);
    log.audit('map', resultBsc);

    try {
        record.delete({type: 'purchaseorder', id: resultBsc.id});
        log.audit('Sucesso', resultBsc.id);
    } catch (error) {
        log.error('Erro', {id: resultBsc.id, msg: error});
    }           
}

function reduce(context) {}

function summarize(summary) {}

return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
}
});
