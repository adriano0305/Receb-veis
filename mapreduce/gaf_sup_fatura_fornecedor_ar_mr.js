/**
 *@NApiVersion 2.1
*@NScriptType MapReduceScript
*/

const opcoes = {
    enableSourcing: true,
    ignoreMandatoryFields: true    
}

define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
function atualizarTransacao(tipo, idInterno) {
    log.audit('atualizarTransacao', {tipo: tipo, idInterno: idInterno});

    try {
        const loadReg = record.load({type: tipo, id: idInterno});
        loadReg.save();
        log.audit('atualizar_linhas_transacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno});
    } catch (e) {
        log.error('atualizar_linhas_transacao', {status: 'Erro', tipo: tipo, idInterno: idInterno, msg: e});
    }
}
    
const getInputData = (context) => {
    log.audit('getInputData', context);

    var bsc = search.create({type: "vendorbill",
        filters: [
           ["cogs","is","F"], "AND", 
           ["shipping","is","F"], "AND", 
           ["taxline","is","F"], "AND", 
           ["mainline","is","F"], "AND", 
           ["type","anyof","VendBill"]
        //    , "AND", 
        //    [["custbody_valor_restante_nf","isempty",""],"OR",["custbody_valor_restante_nf","greaterthan","0.00"]]
           , "AND", 
           ["internalid","anyof","670807","670810"]
        ],
        columns: [
            search.createColumn({name: "datecreated", summary: "GROUP", sort: search.Sort.DESC, label: "Data de criação"}),
            search.createColumn({name: "internalid", summary: "GROUP", label: "ID interno"}),
             search.createColumn({name: "formulatext", summary: "GROUP", formula: "{tranid}", label: "numero do documento"}),
             search.createColumn({name: "statusref", summary: "GROUP", label: "Status"}),
             search.createColumn({name: "custbody_rsc_total_pago_nf", summary: "GROUP", label: "Total Pago NF"}),
             search.createColumn({name: "custbody_valor_restante_nf", summary: "GROUP", label: "Valor Restante NF"})
        ]
     });
    
    return bsc;
}

const map = (context) => {
    // log.audit('map', context);

    const src = JSON.parse(context.value);
    log.audit('map', src);

    atualizarTransacao('vendorbill', src.values['GROUP(internalid)'].value);     
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
