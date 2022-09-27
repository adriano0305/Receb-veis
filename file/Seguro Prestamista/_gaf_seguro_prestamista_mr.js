/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/query'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search, runtime, query) => {
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
            log.debug( 'getInputData', inputContext );


            var script = runtime.getCurrentScript();
            log.debug( 'script', script );
			var segPrestRec = script.getParameter({ name:'custscript_gaf_prestamista_rec_id' });
			log.debug( 'segPrestRec', segPrestRec );

            record.submitFields({
                type: "customrecord_gaf_seguro_prestamista",
                id: segPrestRec,
                values: {
                    custrecord_gaf_seg_presta_status:2
                }            
            }) 

            var getParams = getRecordData(segPrestRec)
                      
            var dateFilter = getParams["custrecord_gaf_seg_presta_periodo.startdate"]
            log.debug("dateFilter",dateFilter)

            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                [
                   ["type","anyof","SalesOrd"], 
                   "AND", 
                   ["status","noneof","SalesOrd:A","SalesOrd:C","SalesOrd:G","SalesOrd:H"], 
                   "AND", 
                   ["mainline","is","T"], 
                   "AND", 
                   ["custbody_lrc_fat_controle_escrituracao","noneof","@NONE@"], 
                   "AND", 
                   [["custbody_gaf_periodo_ultimo_seguro","anyof","@NONE@"],"OR",[["custbody_gaf_periodo_ultimo_seguro.startdate","before",dateFilter]]],
                //    "AND", 
                //    ["custbodycustbody_rsc_parcela_alienacao","is","T"]
                ],
                columns:
                [
                   "internalid",
                   "amountunbilled"
                ]
             });  
             log.debug("salesorderSearchObj",salesorderSearchObj)           


            return salesorderSearchObj

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
            log.debug("map", mapContext);

            // log.debug("mapContext.key ",mapContext.key )
            // log.debug("mapContext.value ",mapContext.value )
            try {
            var recPV = mapContext.key
            var valuesArray = JSON.parse(mapContext.value)
            // var valorBase = parseFloat(valuesArray.values.amountunbilled)
            var valorBase = naoFaturado(recPV);
            var script = runtime.getCurrentScript();
			var segPrestRec = script.getParameter({ name:'custscript_gaf_prestamista_rec_id' });

            var getParams = getRecordData(segPrestRec)
            var percResidual = parseFloat(getParams.custrecord_gaf_seg_presta_perc_residual)
            var percIof = parseFloat(getParams.custrecord_gaf_seg_presta_iof)
            var taxaSeguro = parseFloat(getParams.custrecord_gaf_seg_presta_tx_seguro)
            var periodoRef = getParams.custrecord_gaf_seg_presta_periodo[0].value

            log.debug("paramsData",{
                percResidual:percResidual,
                percIof:percIof,
                taxaSeguro:taxaSeguro,
                valorBase:valorBase,
                segPrestRec: segPrestRec,
                getParams: getParams
            })

            lookupSO = search.lookupFields({type: 'salesorder',
                id: recPV,
                columns: ['subsidiary']
            });

            var recDetalhes = record.create({
                type: "customrecord_gaf_seguro_prestamista_deta",
                isDynamic: true               
            })
            recDetalhes.setValue({
                fieldId: 'custrecord_gaf_psp_detalhes_id_proce',
                value: segPrestRec
            })
            recDetalhes.setValue({
                fieldId: 'custrecord_gaf_psp_detalhes_pv',
                value: recPV
            })
            recDetalhes.setValue({
                fieldId: 'custrecord_gaf_psp_subsidiaria',
                value: lookupSO.subsidiary[0].value
            })
            recDetalhes.setValue({
                fieldId: 'custrecord_gaf_psp_detalhes_valor_nf',
                value: valorBase
            })

            var custrecord_gaf_psp_detalhes_residual = valorBase * percResidual;
            var custrecord_gaf_psp_detalhes_iof = custrecord_gaf_psp_detalhes_residual * percIof;
            var custrecord_gaf_psp_detalhes_total = custrecord_gaf_psp_detalhes_iof + taxaSeguro;
            log.debug('Cálculo SG', {
                custrecord_gaf_psp_detalhes_residual: custrecord_gaf_psp_detalhes_residual,
                custrecord_gaf_psp_detalhes_iof: custrecord_gaf_psp_detalhes_iof,
                custrecord_gaf_psp_detalhes_total: custrecord_gaf_psp_detalhes_total
            });

            recDetalhes.setValue({
                fieldId: 'custrecord_gaf_psp_detalhes_residual',
                value: custrecord_gaf_psp_detalhes_residual
                // value: valorBase * percResidual
            })
            recDetalhes.setValue({
                fieldId: 'custrecord_gaf_psp_detalhes_iof',
                value: custrecord_gaf_psp_detalhes_iof
                // value: valorBase * percResidual * percIof
            })
            recDetalhes.setValue({
                fieldId: 'custrecord_gaf_psp_detalhes_taxa',
                value: taxaSeguro
            })
            recDetalhes.setValue({
                fieldId: 'custrecord_gaf_psp_detalhes_total',
                value: custrecord_gaf_psp_detalhes_total
                // value: (valorBase * percResidual) + (valorBase * percResidual * percIof) + taxaSeguro
            })
            var rec_detalhes_id = recDetalhes.save();
            log.debug('rec_detalhes_id', rec_detalhes_id);

            record.submitFields({
                type: "salesorder",
                id: recPV,
                values: {
                    custbody_gaf_periodo_ultimo_seguro: periodoRef
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }                
            })

            mapContext.write(recPV, valuesArray);
            } catch(e) {
                log.error('Erro DSP', e);
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
            log.debug('reduce', reduceContext);    
            
            var loadReg = record.load({type: 'salesorder', id: reduceContext.key});

            var total = loadReg.getValue('total');
            var naoPago = naoFaturado(reduceContext.key);

            if (total > naoPago) {
                var saldo_devedor_seguro_prestamista = total - naoPago;

                loadReg.setValue('custbody_rsc_sld_dvd_seguro_prestamist', saldo_devedor_seguro_prestamista)
                .save({ignoreMandatoryFields: true, enableSourcing: true});
                log.debug('Saldo devedor atualizado!', {
                    pedidoNS: reduceContext.key, 
                    total: total, 
                    naoPago: naoPago, 
                    saldo_devedor_seguro_prestamista: saldo_devedor_seguro_prestamista
                });
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

            var processamento = {};
            log.debug("inputSummary",summaryContext.inputSummary)
            summaryContext.output.iterator().each( function( key, value ){
                processamento[ key ] = {};
                processamento[ key ] = JSON.parse( value );
                log.debug("key", key)
                log.debug("value", value)
                log.debug("processamento", processamento)
                log.debug("processamento", JSON.stringify(processamento))

            })
            var script = runtime.getCurrentScript();
			var segPrestRec = script.getParameter({ name:'custscript_gaf_prestamista_rec_id' });
			log.debug( 'segPrestRec', segPrestRec );    
            
            record.submitFields({
                type: "customrecord_gaf_seguro_prestamista",
                id: segPrestRec,
                values: {
                    custrecord_gaf_seg_presta_status:4
                }            
            }) 
            

        }

        function getRecordData (newRecId) {

            log.debug("getRecordData",newRecId)

            var lookup = search.lookupFields({
                type: "customrecord_gaf_seguro_prestamista",
                id: newRecId,
                columns: [
                    "custrecord_gaf_seg_presta_periodo",
                    "custrecord_gaf_seg_presta_subsidiaria",
                    "custrecord_gaf_seg_presta_perc_residual",
                    "custrecord_gaf_seg_presta_iof",
                    "custrecord_gaf_seg_presta_tx_seguro",
                    "custrecord_gaf_seg_presta_status",
                    "custrecord_gaf_seg_presta_periodo.startdate"
                ]
            })
            log.debug("lookup",lookup)

            return lookup

        }

        function naoFaturado(internalid) {
            var sql = "SELECT sum(foreignamountunpaid) " +  
            "FROM transaction " +
            "WHERE recordtype = 'invoice' " +
            "AND custbody_lrc_fatura_principal = ? "
            "AND foreignamountunpaid > 0 ";

            var consulta = query.runSuiteQL({
                query: sql,
                params: [internalid]
            }); 

            var sqlResults = consulta.asMappedResults(); 
            log.debug('naoFaturado', {internalid: internalid, sqlResults: sqlResults});

            return sqlResults[0].expr1;
        }

        return {getInputData, map, reduce, summarize}

    });
