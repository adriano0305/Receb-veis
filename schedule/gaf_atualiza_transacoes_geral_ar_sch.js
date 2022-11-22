/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */

const opcoes = {
    enableSourcing: true,
    ignoraMandatoryFields: true
}

define(['N/log', 'N/record', 'N/search'], function(log, record, search) {
function execute(context) {
    search.create({type: "transaction",
        filters: [
            ["mainline","is","T"], "AND", 
            ["type","anyof","PurchOrd","PurchReq"]
               , "AND", 
               ["internalid","anyof","152181","328161","230149","319407"]
        ],
        columns: [
            search.createColumn({name: "datecreated", sort: search.Sort.DESC, label: "Data de criação"}),
            search.createColumn({name: "internalid", label: "ID interno"}),
            search.createColumn({name: "type", label: "Tipo"}),
            search.createColumn({name: "tranid", label: "Número do documento"}),
            search.createColumn({name: "customform", label: "Formulário personalizado"})
        ]
    }).run().each(function(result) {
        log.audit('result', result);

        try {
            var loadReg = record.load({type: 'purchaserequisition', id: result.id});
    
            loadReg.setValue('customform', 274) // GAFISA - Requisição de Compras
            .save(opcoes);
        
            log.audit('Sucesso', {tipo: 'purchaserequisition', idInterno: result.id, valores: 274});
        } catch(e) {
            log.error('Erro', {tipo: 'purchaserequisition', idInterno: result.id, valores: 274, msg: e});
        } 
    });
}

return {
    execute: execute
}
});
