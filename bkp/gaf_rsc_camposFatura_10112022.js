/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search) => {
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
            var recorde = scriptContext.newRecord;
            var newRecord = record.load({
                type:recorde.type,
                id: recorde.id
            })
            var job = newRecord.getValue('custbody_rsc_projeto_obra_gasto_compra');
            var lineItem = newRecord.getLineCount({
                sublistId:'item'
            });
            var lineExpense = newRecord.getLineCount({
                sublistId:'expense'
            });
            log.debug('job', job);
            log.debug('lineItem', lineItem);
            log.debug('lineExpense', lineExpense);
            if(lineItem > 0){
                for(var i = 0; i < lineItem; i++){
                    log.debug('i', i)
                    var customer = newRecord.getSublistValue({
                        sublistId:'item',
                        fieldId: 'customer',
                        line: i 
                    })
                    var fieldCliente = newRecord.getSublistValue({
                        sublistId:'item',
                        fieldId: 'custcol_rsc_fieldcliente',
                        line: i
                    })
                    log.debug('fieldCliente', fieldCliente)
                    log.debug('customer', customer)
                    if(!fieldCliente){
                        log.debug('!fieldCliente', !fieldCliente)
                        if(customer){

                            newRecord.setSublistValue({
                                sublistId:'item',
                                fieldId: 'custcol_rsc_fieldcliente',
                                value: customer,
                                line: i
                            })
                        }
                    }
                }
            }
            if(lineExpense > 0){
                for(var i = 0; i < lineExpense; i++){
                    var customer = newRecord.getSublistValue({
                        sublistId:'expense',
                        fieldId: 'customer',
                        line: i 
                    })
                    var fieldCliente = newRecord.getSublistValue({
                        sublistId:'expense',
                        fieldId: 'custcol_rsc_fieldcliente',
                        line: i
                    })
                    if(!fieldCliente){
                        log.debug('!fieldCliente', !fieldCliente)
                        if(customer){

                            newRecord.setSublistValue({
                                sublistId:'expense',
                                fieldId: 'custcol_rsc_fieldcliente',
                                value: customer,
                                line: i
                            })
                        }
                    }
                }
            }
            newRecord.save({
                ignoreMandatoryFields:true
            })
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
