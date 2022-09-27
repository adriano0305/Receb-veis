/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

const dados = {
    indice: 1, // BRL
    item: 28632, // Seguro Prestamista
    localidade: 112, // GAFISA S/A.	
    memo: 'Seguro Prestamista',
    subsidiaria: 2, // GAFISA S/A.	
    tipo_transacao_workflow: 22, // PV - Contrato
    opcoes: {
        enableSourcing: true,
        ignoreMandatoryFields: true
    }    
}

define(['N/record', 'N/runtime', 'N/search'],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (record, runtime, search) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            log.debug('getInputData', inputContext);
            
            var script = runtime.getCurrentScript();
			var segPrestRec = script.getParameter({ name:'custscript_gaf_prestamista_rec_id_detalh' });
            
            var customrecord_gaf_seguro_prestamista_detaSearchObj = search.create({
                type: "customrecord_gaf_seguro_prestamista_deta",
                filters:
                [
                   ["custrecord_gaf_psp_detalhes_id_proce","anyof",segPrestRec], 
                   "AND", 
                   ["custrecord_gaf_psp_detalhes_status","anyof","8"]
                ],
                columns:
                [
                   "custrecord_gaf_psp_detalhes_cliente",
                   "custrecord_gaf_psp_detalhes_iof",
                   "custrecord_gaf_psp_detalhes_pv",
                   "custrecord_gaf_psp_detalhes_residual",
                   "custrecord_gaf_psp_detalhes_status",
                   "custrecord_gaf_psp_detalhes_taxa",
                   "custrecord_gaf_psp_detalhes_total",
                   "custrecord_gaf_psp_detalhes_valor_nf",
                   "custrecord_gaf_psp_detalhes_id_proce",
                    search.createColumn({
                        name: "custrecord_gaf_seg_presta_periodo",
                        join: "CUSTRECORD_GAF_PSP_DETALHES_ID_PROCE"
                    }),
                    search.createColumn({
                        name: "custrecord_gaf_seg_presta_subsidiaria",
                        join: "CUSTRECORD_GAF_PSP_DETALHES_ID_PROCE"
                    })
                ]
             });
             log.debug({segPrestRec: segPrestRec}, {script: script, customrecord_gaf_seguro_prestamista_detaSearchObj: customrecord_gaf_seguro_prestamista_detaSearchObj});
             
             return customrecord_gaf_seguro_prestamista_detaSearchObj

        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            log.debug("mapContext", mapContext);
            try{
                var recPV = mapContext.key
                var valuesArray = JSON.parse(mapContext.value)
                // var script = runtime.getCurrentScript();
                // var segPrestRec = script.getParameter({ name:'custscript_gaf_prestamista_rec_id' });

                var lkpSO = search.lookupFields({type: 'salesorder',
                    id: valuesArray.values.custrecord_gaf_psp_detalhes_pv.value,
                    columns: ['subsidiary', 'location']
                });
                log.debug(recPV, {valuesArray: valuesArray, lkpSO: lkpSO});

                var pvRecord = record.create({
                    type: "salesorder",
                    isDynamic: true                
                })
                pvRecord.setValue({
                    fieldId: 'entity',
                    value: valuesArray["values"]["custrecord_gaf_psp_detalhes_cliente"].value
                });
                pvRecord.setValue({
                    fieldId: 'subsidiary',
                    value: lkpSO.subsidiary[0].value
                });
                pvRecord.setValue({
                    fieldId: 'location',
                    value: lkpSO.location[0].value
                });
                pvRecord.setValue({
                    fieldId: 'memo',
                    value: dados.memo
                });
                pvRecord.setValue({
                    fieldId: 'custbody_rsc_indice',
                    value: dados.indice
                });
                pvRecord.setValue({
                    fieldId: 'custbody_rsc_tipo_transacao_workflow',
                    value: dados.tipo_transacao_workflow
                });
                pvRecord.selectNewLine({
                    sublistId: 'item' 
                });
                pvRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: dados.item
                });
                pvRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: valuesArray["values"]["custrecord_gaf_psp_detalhes_total"]
                });
                pvRecord.commitLine({
                    sublistId: 'item'
                });
                var pedidoCriado = pvRecord.save(dados.opcoes)

                record.submitFields({
                    type: "customrecord_gaf_seguro_prestamista_deta",
                    id: recPV,
                    values: {
                        custrecord_gaf_psp_detalhes_pv_criado: pedidoCriado,
                        custrecord_gaf_psp_detalhes_status:11
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }                
                })
                record.submitFields({
                    type: "customrecord_gaf_seguro_prestamista",
                    id: valuesArray["values"]["custrecord_gaf_psp_detalhes_id_proce"].value,
                    values: {                    
                        custrecord_gaf_seg_presta_status:11
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }                
                })
                log.debug('Finalizado', {
                    pedidoCriado: pedidoCriado,
                    type: "customrecord_gaf_seguro_prestamista_deta", 
                    id: recPV,
                    type: "customrecord_gaf_seguro_prestamista", 
                    id: valuesArray["values"]["custrecord_gaf_psp_detalhes_id_proce"].value                    
                });

            } catch(e){
                log.debug("e",e)
            }            
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce, summarize}

    });
