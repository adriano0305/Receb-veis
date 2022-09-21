/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/search','N/record', 'N/log'], function(search, record, log) {

    function execute(context) {
        var lista = []
        var journalentrySearchObj = search.create({
            type: "journalentry",
            filters:
            [
               ["type","anyof","Journal"], 
               "AND", 
               ["custbodysegregacao_curt_long","is","T"], 
               "AND", 
               ["systemnotes.context","anyof","MPR"]
            ],
            columns:
            [
               search.createColumn({
                  name: "internalid",
                  summary: "GROUP",
                  label: "ID interno"
               })
            ]
        }).run().each(function(result){
        lista.push({
            id: result.getValue({ name: "internalid",summary: "GROUP",})
        })
            return true
        })
        log.audit('quantidade da lista', lista.length)
        if(lista.length != 0){    
            for(var i = 0; i < lista.length; i++){
                record.delete({
                type: "journalentry",
                id: lista[i].id
                })
            }
        }else{
            log.audit('não há registro')
        }
    }

    return {
        execute: execute
    }
});
