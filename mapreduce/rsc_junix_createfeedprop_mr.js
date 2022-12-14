/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/runtime', 'N/record', './rsc_junix_call_api.js', './rsc_finan_createproposta.js'],
    
    (search, runtime, record, api, propostaFunction) => {
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
                // var dataAtual = new Date();
                // var dataInicio = new Date().setDate(new Date().getDate() - 2);
                // log.debug('dataInicio', dataInicio);
                // log.debug('dataAtual', dataAtual);
                var body = {
                        fase: 'SECRETARIA INCORP',
                        sintese: 'CONTRATO ESCRITURADO'
                        // dataDe: dataInicio,
                        // dataAte: dataAtual
                }
                var retorno = JSON.parse(api.sendRequest(body, 'PROPOSTA_PESQVENDA_JUNIX/1.0/'));
                log.debug({title: 'Resultado', details: retorno});
                return retorno;
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
//                log.debug({title: 'Resultado', details: mapContext.value});
                var proposta = JSON.parse(mapContext.value);
                var fase = proposta.Status.Fase;
                var sintese = proposta.Status.Sintese;
                log.debug({title: 'Fase', details: proposta.Status.Fase});
                log.debug({title: 'Sintese', details: proposta.Status.Sintese});
                log.debug({title: 'Resultado', details: proposta.NumeroProposta});
                var getSpe = propostaFunction.getSPEObra(proposta.CodigoEmpreendimento);
                log.debug({title: 'GetSPE', details: getSpe});
                var feedSearch = search.create({
                        type:'customrecord_rsc_junix_feed_proposta',
                        filters:[
                                ['custrecord_rsc_numero_proposta', 'IS',proposta.NumeroProposta]
                        ]
                }).run().getRange({
                        start:0,
                        end:1
                })
                log.debug({title: 'feedSearch[0]', details: feedSearch[0]});
                log.debug({title: '!feedSearch[0]', details: !feedSearch[0]});
                if(!feedSearch[0]){
                        if (getSpe.codEmpreendimento != null){
                                var feed = record.create({
                                        type: 'customrecord_rsc_junix_feed_proposta',
                                        isDynamic: true
                                });
                                feed.setValue({fieldId: 'custrecord_rsc_numero_proposta', value: proposta.NumeroProposta});
                                feed.setValue({fieldId: 'custrecord_rsc_feed_json', value: proposta});
                                feed.save({
                                        ignoreMandatoryFields: true
                                });
                        }else{
                                var body = {
                                        processado: false,
                                        motivo: 'O c??digo '+ proposta.CodigoEmpreendimento + ' n??o existe na base netsuite'
                                }
                                log.debug('body', body);
                                // log.debug('Error', e);
                                api.sendResult(body, 'PROPOSTA_RESULTADO_INTEGRA_JUNIX/1.0/' + proposta.NumeroProposta);
                        }
                }
                
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

        return {getInputData, map, summarize}

    });
