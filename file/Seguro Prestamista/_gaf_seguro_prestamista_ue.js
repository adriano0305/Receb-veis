/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/ui/message', 'N/task'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search, message, task) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

            var newRec = scriptContext.newRecord;
            var curForm = scriptContext.form;
            var triggerType = scriptContext.type
            var newRecId = newRec.id;

            //injecting the CS scriptContext
            curForm.clientScriptModulePath = './_gaf_seguro_prestamista_cs.js';
            
            //current status
            var curStatus = newRec.getValue({
                fieldId: "custrecord_gaf_seg_presta_status"
            })
            log.debug("curStatus",curStatus)
            log.debug("triggerType",triggerType)
            //action taken by status on view mode
            if (triggerType == "view") {
                switch(curStatus){
                    case "1":
                        var functionName = 'buscarContratos("' + newRecId + '")'
                        curForm.addButton({
                            id:'custpage_buscar_contrato', 
                            label:"Buscar contratos", 
                            functionName:functionName
                        })
                        var msgTitle = 'Aguardando envio'
                        var msgMessage = 'para ver a lista de contratos, clique no botão "Buscar contratos"'
                        var msgType = message.Type.INFORMATION
                        log.debug("CASE 1")  
                        log.debug("msgTitle",msgTitle)  
                    break
                    case "2":
                        var msgTitle = 'Informações enviadas'
                        var msgMessage = 'Dados enviados para processamento, dependendo da fila de JOBS o processamento pode demorar alguns minutos para inciar, atualize esta tela para ver o status atual'
                        var msgType = message.Type.INFORMATION    
                        log.debug("CASE 2")  
                    break
                    case "6":
                        log.debug("CASE 6")  
                    //check the line
                    var scheduledscriptinstanceSearchObj = search.create({
                        type: "scheduledscriptinstance",
                        filters:
                        [
                           ["script.scriptid","is","customscript_gaf_seguro_prestamista_mr"], 
                           "AND", 
                           ["status","noneof","COMPLETE","FAILED","CANCELED"]
                        ],
                        columns:
                        [
                           search.createColumn({
                              name: "datecreated",
                              sort: search.Sort.ASC
                           }),
                           "startdate",
                           "enddate",
                           "queue",
                           "status",
                           "mapreducestage",
                           "percentcomplete",
                           "queueposition"
                        ]
                     });
                     var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
                     log.debug("CASE 6 searchResultCount",searchResultCount)  
                     if(searchResultCount > 0){                                    

                        var msgTitle = 'Fila de processamento indisponível'
                        var msgMessage = 'No momento não existe processadores disponíveis, atualize a página em alguns minutos'
                        var msgType = message.Type.INFORMATION    

                     } else {                                                         
                        
                        scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_gaf_seguro_prestamista_mr",    //         
                                    params: {
                                        custscript_gaf_prestamista_rec_id: newRecId
                                    }
                                });
                                log.audit('scriptTask', scriptTask);
                        
                                scriptTaskId = scriptTask.submit();

                                record.submitFields({
                                    type: "customrecord_gaf_seguro_prestamista",
                                    id: newRecId,
                                    values: {
                                        custrecord_gaf_seg_presta_status:7
                                    }            
                                }) 

                                var msgTitle = 'Processamento agendado'
                                var msgMessage = 'Processamento dos dados agendados, aguarde o início para ter o status atualizado'
                                var msgType = message.Type.INFORMATION    
            
            
                     }

                    break;
                    case "7":
                        log.debug("CASE 7") 
                        var msgTitle = 'Processamento agendado'
                        var msgMessage = 'Processamento dos dados agendados, aguarde o início para ter o status atualizado'
                        var msgType = message.Type.INFORMATION 
                    break;
                    case "10":
                        log.debug("CASE 10") 
                        var msgTitle = 'Pedidos em processamento'
                        var msgMessage = 'Pedidos em processamento'
                        var msgType = message.Type.INFORMATION 
                    break;
                    case "4":
                        log.debug("CASE 4") 
                        var msgTitle = 'Processamento Concluído'
                        var msgMessage = 'Revise a lista apresentada antes de processar os dados'
                        var msgType = message.Type.INFORMATION 
                        
                        var functionName = 'processar("' + newRecId + '")'                        
                        log.debug("functionName",functionName) 
                        curForm.addButton({
                            id:'custpage_processar', 
                            label:"Processar", 
                            functionName:functionName

                        })
                    break;
                    case "9":                       
                            log.debug("CASE 9")  
                        //check the line
                        var scheduledscriptinstanceSearchObj = search.create({
                            type: "scheduledscriptinstance",
                            filters:
                            [
                               ["script.scriptid","is","customscript_gaf_seguro_prest_pedidos_mr"], 
                               "AND", 
                               ["status","noneof","COMPLETE","FAILED","CANCELED"]
                            ],
                            columns:
                            [
                               search.createColumn({
                                  name: "datecreated",
                                  sort: search.Sort.ASC
                               }),
                               "startdate",
                               "enddate",
                               "queue",
                               "status",
                               "mapreducestage",
                               "percentcomplete",
                               "queueposition"
                            ]
                         });
                         var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
                         log.debug("CASE 9 searchResultCount",searchResultCount)  
                         if(searchResultCount > 0){                                    
    
                            var msgTitle = 'Fila de processamento indisponível'
                            var msgMessage = 'No momento não existe processadores disponíveis, atualize a página em alguns minutos'
                            var msgType = message.Type.INFORMATION    
    
                         } else {                                                         
                            
                            scriptTask = task.create({
                                        taskType: task.TaskType.MAP_REDUCE,
                                        scriptId: "customscript_gaf_seguro_prest_pedidos_mr",    //         
                                        params: {
                                            custscript_gaf_prestamista_rec_id_detalh: newRecId
                                        }
                                    });
                                    log.audit('scriptTask', scriptTask);
                            
                                    scriptTaskId = scriptTask.submit();
    
                                    record.submitFields({
                                        type: "customrecord_gaf_seguro_prestamista",
                                        id: newRecId,
                                        values: {
                                            custrecord_gaf_seg_presta_status:10
                                        }            
                                    }) 
    
                                    var msgTitle = 'Processamento agendado'
                                    var msgMessage = 'Processamento dos dados agendados, aguarde o início para ter o status atualizado'
                                    var msgType = message.Type.INFORMATION                                    
                         }                        
                    break
                }

                log.debug("msgTitle",msgTitle)

                if (msgTitle) {
                    var messageObj = message.create({
                        type: msgType,
                        title: msgTitle,
                        message: msgMessage,
                        duration: 100000
                    });
                    curForm.addPageInitMessage({
                        message: messageObj
                    });
                }               

            }
            

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
