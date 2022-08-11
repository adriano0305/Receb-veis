/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

    function getInputData(context) {
        log.audit('getInputData', context);

        return search.create({
            type: "journalentry",
            filters:
            [
               ["type","anyof","Journal"], 
               "AND", 
               ["custbody_rsc_aprop_flag","is","T"]
            //    , "AND",
            //    ["internalid","anyof",533251]
            ],
            columns:
            [
               search.createColumn({
                  name: "trandate",
                  sort: search.Sort.ASC,
                  label: "Data"
               }),
               search.createColumn({name: "tranid", label: "Número do documento"}),
               search.createColumn({name: "custbody_rsc_aprop_flag", label: "Lançamento Apropriação"})
            ]
         });
    }

    function map(context) {
        log.audit('map', context);

        var resultBsc = JSON.parse(context.value);

        try {
            record.delete({type: 'journalentry', id: resultBsc.id});
            log.audit('Excluído!', resultBsc.id);
        } catch(e) {
            log.error('Erro', {id: resultBsc.id, msg: e});
        }        
    }

    function reduce(context) {
        
    }

    function summarize(summary) {
        
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
