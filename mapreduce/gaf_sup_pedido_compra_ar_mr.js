/**
 *@NApiVersion 2.1
*@NScriptType MapReduceScript
*/

const opcoes = {
    enableSourcing: true,
    ignoreMandatoryFields: true    
}

define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
const getInputData = (context) => {
    log.audit('getInputData', context);

    var bsc = search.create({type: "purchaseorder",
        filters: [
            ["cogs","is","F"], "AND",
            ["shipping","is","F"], "AND",
            ["taxline","is","F"], "AND",
            ["mainline","is","F"], "AND",
            ["type","anyof","PurchOrd"], "AND",
            ["custcol_rsc_saldo_linha","isempty",""]
            // , "AND", 
            // ["internalid","anyof","149984"]
        ],
        columns: [
            search.createColumn({name: "datecreated", summary: "GROUP", sort: search.Sort.DESC, label: "Data de criação"}),
            search.createColumn({name: "type", summary: "GROUP", label: "Tipo"}),
            search.createColumn({name: "internalid", summary: "GROUP", label: "ID interno"}),
            search.createColumn({name: "tranid", summary: "GROUP", label: "Número do documento"})
        ]
    });
    
    return bsc;
}

const map = (context) => {
    // log.audit('map', context);

    const src = JSON.parse(context.value);
    // log.audit('map', src);
    
    var loadReg = record.load({type: 'purchaseorder', id: src.values['GROUP(internalid)'].value});

    var numDoc = loadReg.getValue('tranid');

    var linhaItens = loadReg.getLineCount('item');

    for (i=0; i<linhaItens; i++) {
        var quantidade = loadReg.getSublistValue('item', 'quantity', i);
        var recebido = loadReg.getSublistValue('item', 'quantityreceived', i);
        var taxa = loadReg.getSublistValue('item', 'rate', i);

        var sl = (quantidade - recebido) * taxa;
        // log.audit(i, {quantidade: quantidade, recebido: recebido, taxa: taxa, sl: sl});

        loadReg.setSublistValue('item', 'custcol_rsc_saldo_linha', i, sl);
    }

    try {
        loadReg.save(opcoes);
        log.audit('Sucesso', {numDoc: numDoc});
    } catch(e) {
        log.error('Erro', {numDoc: numDoc, msg: e});
    }    
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
