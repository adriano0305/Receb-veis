/**
 *@NApiVersion 2.1
*@NScriptType MapReduceScript
*/

const opcoes = {
    enableSourcing: true,
    ignoraMandatoryFields: true
}

define(['N/log', 'N/record', 'N/search'], function(log, record, search) {
const atualizarTransacao = (tipo, idInterno, valores) => {
    try {
        var loadReg = record.load({type: tipo, id: idInterno});

        loadReg.setValue('customform', valores.customform)
        .save(opcoes);
    
        log.audit('atualizarTransacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, valores});
    } catch(e) {
        log.error('atualizarTransacao', {status: 'Erro', tipo: tipo, idInterno: idInterno, valores: valores, msg: e});
    }   
}

function getInputData(context) {
    log.audit('getInputData', context);

    var bsc = search.create({
        type: "purchaseorder",
        filters:
        [
           ["mainline","is","F"], 
           "AND", 
           ["type","anyof","PurchOrd"], 
           "AND", 
           [["formulatext: {targetlocation}","isnotempty",""],"OR",["formulatext: {targetsubsidiary}","isnotempty",""]]
        //    , "AND", 
        //    ["internalid","anyof","810163"]
        ],
        columns:
        [
           search.createColumn({
              name: "datecreated",
              summary: "GROUP",
              sort: search.Sort.DESC,
              label: "Data de criação"
           }),
           search.createColumn({
              name: "internalid",
              summary: "GROUP",
              label: "ID interno"
           }),
           search.createColumn({
              name: "tranid",
              summary: "GROUP",
              label: "Número do documento"
           })
        ]
     });

    return bsc;
}

function map(context) {
    // log.audit('map', context);

    const resultBsc = JSON.parse(context.value);
    log.audit('map', resultBsc);
    
    try {
        var loadReg = record.load({type: 'purchaseorder', id: resultBsc.values['GROUP(internalid)'].value});

        var numDoc = resultBsc.values['GROUP(tranid)'];

        var linhaItens = loadReg.getLineCount('item');

        for (i=0; i<linhaItens; i++) {
            loadReg.setSublistValue('item', 'targetlocation', i, '')
            .setSublistValue('item', 'targetlocation', i, '')
        }
    
        loadReg.save(opcoes);    
        log.audit('Sucesso', {numDoc: numDoc});
    } catch(e) {
        log.error('Erro', {numDoc: numDoc, msg: e});
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
