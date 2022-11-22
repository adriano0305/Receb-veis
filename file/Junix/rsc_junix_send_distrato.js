/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', './rsc_junix_call_api.js'],
    
    (search, record, api) => {
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
            return search.create({
                type:'customrecord_rsc_escritura_distrato',
                filters:[
                    ['custrecord_rsc_status_distrato','ANYOF', [3,5]],
                    'AND',
                    ['custrecord_rsc_enviado_junix', 'IS', 'F']
                ],
                columns:[
                    'custrecord_rsc_contrato_distrato',
                    'custrecord_rsc_valor_acordado',
                    'custrecord_rsc_valorpago',
                    'custrecord_rsc_empreedimento_distrato',
                    'custrecord_rsc_subsidiaria_distrato',
                    'custrecord_rsc_bloco_distrato',
                    'custrecord_rsc_unidade_distrato'
                ]
            })
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
            var searchResult = JSON.parse(mapContext.value);
            var contrato = searchResult.values['custrecord_rsc_contrato_distrato'].value
            var subsidiaryId = searchResult.values['custrecord_rsc_subsidiaria_distrato'].value
            var unidadeId = searchResult.values['custrecord_rsc_unidade_distrato'].value
            var contratoLookup = search.lookupFields({
                type:'salesorder',
                id: contrato,
                columns:[
                    'custbody_rsc_data_venda',
                    'custbody_rsc_vlr_venda',
                    'custbody_rsc_nr_proposta',
                ]
            })
            var subsidiary = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryId,
                isDynamic: false,
            });
            var unidadeLookup = search.lookupFields({
                type:'customrecord_rsc_unidades_empreendimento',
                id: unidadeId,
                columns:[
                    'custrecord_rsc_un_emp_unidade',
                    'custrecord_rsc_un_emp_status'
                ]
            })
            
            var body = {
                "numeroContrato": contratoLookup.custbody_rsc_nr_proposta,
                "dataCadastro": contratoLookup.custbody_rsc_data_venda,
                "saldoQuitacao": searchResult.values['custrecord_rsc_valorpago'],
                "valorDevolucao": searchResult.values['custrecord_rsc_valor_acordado'],
                "valorContrato": contratoLookup.custbody_rsc_vlr_venda,
                "valorSaldoQuitacao": searchResult.values['custrecord_rsc_valorpago'],
                "cnpJ_SPE": subsidiary.getValue('federalidnumber'),
                "codigoEmpreendimento": searchResult.values['custrecord_rsc_empreedimento_distrato'].value,
                "codigoBloco": searchResult.values['custrecord_rsc_bloco_distrato'].value,
                "numeroUnidade": unidadeLookup.custrecord_rsc_un_emp_unidade,
                "numeroProposta": contratoLookup.custbody_rsc_nr_proposta,
                "statusUnidade": unidadeLookup.custrecord_rsc_un_emp_status[0].text
            }
            log.debug({title: 'Body', details: body})
            var retorno = JSON.parse(api.sendRequest(body, 'DISTRATO_JUNIX/1.0/'));
            log.debug({title: "retorno", details: retorno});
            var distrato = record.load({
                type:'customrecord_rsc_escritura_distrato',
                id: searchResult.id
            })
            if (retorno.OK){
                log.debug({title: "Retornou Ok.", details: "Retornou o ID " + retorno.Dados});
                // distrato.setValue('custrecord_rsc_id_junix', retorno.Dados);
                distrato.setValue('custrecord_rsc_enviado_junix', true);
                distrato.save()
                // subsidiary.setValue('custrecord_rsc_status_sub_junix', '');
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
