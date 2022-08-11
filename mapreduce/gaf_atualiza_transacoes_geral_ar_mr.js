/**
* @NApiVersion 2.1
* @NScriptType MapReduceScript
* @author Adriano Barbosa
* @since 2020.10
*/

define(['N/log', 'N/record', 'N/search'], function (log, record, search) {

function getInputData(context) {
    return search.create({type: "purchaseorder",
        filters: [
           ["shipping","is","F"], "AND", 
           ["taxline","is","F"], "AND", 
           ["mainline","is","T"], "AND", 
           ["type","anyof","PurchOrd"], "AND", 
           ["internalid","anyof","279300"]
        ],
        columns: [
            "datecreated","tranid","type","customform"
        ]
    })
}

function map(context) {
    var resultBsc = JSON.parse(context['value']);
    log.audit('resultBsc', resultBsc);   

    var transacao;
    var tipo = resultBsc.values.type.text;

    if (tipo == 'Pedido de compra') {
        transacao = pedidoCompras({tipo: 'purchaseorder', dados: resultBsc});
    } 
}

const pedidoCompras = (info) => {
    try {
        var loadReg = record.load({type: info.tipo, id: info.dados.id});

        loadReg.setValue('customform', 117) // Pedido de Compra BR
        .save({ignoreMandatoryFields: true});

        log.audit('pedidoCompras', {status: 'Sucesso', tranid: info.dados.values.tranid});
    } catch(e) {
        log.error('pedidoCompras', {status: 'Sucesso', tranid: info.dados.values.tranid, msg: e});
    }    
}

function summarize(summary) {
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
    
return { 'getInputData': getInputData, 'map': map, 'summarize': summarize }
});