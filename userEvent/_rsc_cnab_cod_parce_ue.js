/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'],
    /**
 * @param{record} record
 */
    (record) => {
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

            var newRecord =scriptContext.newRecord

            if (scriptContext.type !=  'delete') {
                var countParc = newRecord.getLineCount({
                    sublistId: "installment"
                })
                log.debug("countParc",countParc)
                
    
                if(countParc > 0){
    
                var curId = newRecord.id
                    if(curId) {
                        var curRec = record.load({
                            type: "vendorbill",
                            id: curId,
                            isDynamic: true,                
                        })       
                    }
                   
    
                    for(var i = 0; i < countParc; i++){
    
                        try{
    
                            var curLine = curRec.selectLine({
                                sublistId: "installment",
                                line: i
                            })
        
                            var lineId = curRec.getCurrentSublistValue({
                                sublistId: "installment",
                                fieldId: "id"
                            })
        
                            curRec.setCurrentSublistValue({
                                sublistId: "installment",
                                fieldId: "custrecord_rsc_cnab_codigo",
                                value:(parseInt(lineId)).toString(36) + '-' + (parseInt(curId)).toString(36),
                                ignoreFieldChange: true                        
                            })
                            curRec.setCurrentSublistValue({
                                sublistId: "installment",
                                fieldId: "custrecord_rsc_cnab_id_parcela",
                                value:(lineId),
                                ignoreFieldChange: true                        
                            })
                            curRec.commitLine({
                                sublistId: "installment",
                                ignoreRecalc: true
                            })
        
                            log.debug("curLineId",lineId)
    
                        } catch(e){
                            
                            log.audit("e",e)
                            
                        }
    
                       
    
                    }
                    try{
                        curRec.save()
                    } catch(e){
                        log.audit("e",e)
                    }
                    
    
                }
            }

            

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
