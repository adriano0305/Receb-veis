/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', './rsc_junix_call_api.js', './rsc_finan_createproposta.js', 'N/runtime', 'N/query'],
    /**
 * @param{record} record
 */
    (record, api, finan, runtime, query) => {

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {
            var result = '';
            /* Get Proposta */
            var dadosRetorno = requestBody;
            var dadosSPE = getSPEObra(requestBody.CodigoEmpreendimento);
            if (requestBody.NumeroProposta){
                var compradores = dadosRetorno.ListaCompradores;
                if (compradores.length > 0) {
                    for (let i = 0; i < compradores.length; i++) {
                        var comprador = compradores[i];
                        var principal = comprador.Principal;

                        var cliente = finan._createCustomer(comprador, dadosSPE.codEmpreendimento);
                        //listaClientes.push(cliente);
                        if (principal == true) {
                            idClientePrincipal = cliente;
                        }
                    }
                }
                /* Atualiza o status da unidade para reservada */
                var unidade = record.load(
                    {
                        type: 'customrecord_rsc_unidades_empreendimento',
                        id: dadosRetorno.CodigoUnidade,
                        isDynamic: false
                    }
                );
                unidade.setValue('custrecord_rsc_un_emp_status', 5);
                unidade.save({
                    ignoreMandatoryFields: true
                });
                var scriptObj = runtime.getCurrentScript();
                var faturas = dadosRetorno.ListaParcelas;
                if (faturas.length > 0) {
                    for (let i = 0; i < faturas.length; i++) {
                        var fatura = faturas[i];
                        if (fatura.TipoParcela === 'Ato') {

                            log.debug('Remaining governance units: ' + scriptObj.getRemainingUsage());

                            /*log.audit({title: 'Lista Fatura', details: fatura})*/
                            /* Prepara a data de vencimento */
                            var parcelaVencData = finan.tratarData(fatura.Data);
                            log.debug({title: "Venciemento", details: parcelaVencData});
                            var dataCadastroJunix = finan.tratarData(dadosRetorno.DataCadastro);
                            var tipoParcela = 1;

                            var fieldsCustomerParcela = {
                                "custbody_rsc_nr_proposta": dadosRetorno.NumeroProposta,
                                // "duedate": parcelaVencData,
                                "trandate": parcelaVencData,
                                // "startdate": dataCadastroJunix,
                                // "enddate": parcelaVencData,
                                "subsidiary": dadosSPE.codEmpreendimento,
                                "custbody_rsc_projeto_obra_gasto_compra": dadosSPE.codProjeto,
                                "custbody_lrc_cod_parcela": fatura.CodParcela,
                                "custbodyrsc_tpparc": tipoParcela,
                                "terms": 4,
                                "status": 'B',
                                "account": 122,
                                // "custbody_rsc_tran_unidade": dadosRetorno.CodigoUnidade
                            };

                        log.audit({title: 'Dados Parcela', details: fieldsCustomerParcela});

                        var invoiceRecord = record.create({
                            type: 'creditmemo'
                        });

                        log.debug('Remaining governance units: ' + scriptObj.getRemainingUsage());

                        invoiceRecord.setValue({
                            fieldId: 'entity',
                            value: idClientePrincipal
                        });

                        Object.keys(fieldsCustomerParcela).forEach(function (key) {
                            invoiceRecord.setValue({
                                fieldId: key,
                                value: fieldsCustomerParcela[key],
                                ignoreFieldChange: true
                            });
                        });


                        var localidade = dadosSPE.codLocation;
                        invoiceRecord.setValue({
                            fieldId: 'location',
                            value: localidade
                        });
                        /* Busca Estrutura do parcelamento */

                        var queryResults
                        // queryResults = query.runSuiteQL(
                        //     {
                        //         query: 'select b.CUSTRECORD_RSC_ISI_MAIN_ITEM ,  b.custrecord_rsc_isi_item, a.custrecord_rsc_ist_project from customrecord_rsc_installment_setup a, customrecord_rsc_installment_setup_item b\n' +
                        //             '                                                where\n' +
                        //             '                                                b.CUSTRECORD_RSC_ISI_INSTALLMENT_SETUP = a.id\n' +
                        //             '                                                and\n' +
                        //             '                                                custrecord_rsc_ist_project = ?',
                        //         params: [dadosSPE.codProjeto]
                        //     }
                        // );

                        // var records = queryResults.asMappedResults();
                        // if (records.length > 0) {
                            // Add the records to the sublist...
                            // for (r = 0; r < records.length; r++) {
                        // var dados = records[r];
                        // if (dados['custrecord_rsc_isi_main_item'] === 'T') {
                        invoiceRecord.setSublistValue({
                            fieldId: 'item',
                            sublistId: 'item',
                            line: 0,
                            value: 19420
                        });
                        invoiceRecord.setSublistValue({
                            fieldId: 'amount',
                            sublistId: 'item',
                            line: 0,
                            value: fatura.ValorIncorporadora
                        });
                        invoiceRecord.setSublistValue({
                            fieldId: 'quantity',
                            sublistId: 'item',
                            line: 0,
                            value: 1
                        });
                        // }


                                //invoiceRecord.commitLine({"sublistId": "item"});
                            // }
                        // }

                        log.debug('Remaining governance units: ' + scriptObj.getRemainingUsage());
                        var idParcelaRecord = invoiceRecord.save({
                            ignoreMandatoryFields: true
                        })
                        log.debug('Remaining governance units: ' + scriptObj.getRemainingUsage());

                        log.audit({title: 'Id Boleto', details: idParcelaRecord});
                        if (idParcelaRecord > 0){
                            /* Call Nexxera Call*/

                        }
                        }
                    }
                }
                result = {
                    idBoleto: idParcelaRecord,
                    nossoNumero : '',
                    numeroDocumento: '',
                    dataVencimento: '',
                    valor: '',
                    codProposta: '',
                    linkPdf: '',
                    cedenteNome: '',
                    cedenteCPFCNPJ: '',
                    codigoBanco: '',
                    cedenteAgencia: '',
                    cedenteConta: '',
                    nomeBanco: ''
                }

            }
            return  result;
        }
        function getSPEObra(codEmpreend) {
            var codEmpreendimento;
            var codProjeto;
            var codLocation;
            log.debug('codEmpreend', codEmpreend);
            var queryResults = query.runSuiteQL({
                    query: 'select id from subsidiary ' +
                        'where substr(name, 0, 4) = ?',
                    params: [codEmpreend]
            });
            var records = queryResults.asMappedResults();
            log.debug('records', records);
            if (records.length > 0) {
                    // Add the records to the sublist...
                    for (r = 0; r < records.length; r++) {
                            dados = records[r];
                            codEmpreendimento = dados['id'];
                    }
    
                    log.debug({title: 'CodEmpreendimento', details: codEmpreendimento});
    
                    // queryResults = query.runSuiteQL({
                    //         query: 'select * from job ' +
                    //             'where custentity_rsc_codigo_junix_obra = ?',
                    //         params: [codEmpreend]
                    // });
    
                    // records = queryResults.asMappedResults();
                    // if (records.length > 0) {
                    //         // Add the records to the sublist...
                    //         for (r = 0; r < records.length; r++) {
                    //                 dados = records[r];
                    //                 codProjeto = dados['id'];
                    //         }
                    // }
                    log.audit({title: 'CodProjeto', details: codProjeto});
    
                    queryResults = query.runSuiteQL({
                            query: 'select location.id from location, locationsubsidiarymap, subsidiary\n' +
                                'where \n' +
                                'Location.id = LocationSubsidiaryMap.location\n' +
                                'and LocationSubsidiaryMap.subsidiary = Subsidiary.id\n' +
                                'and subsidiary.id = ?',
                            params: [codEmpreendimento]
                    });
                    records = queryResults.asMappedResults();
                    if (records.length > 0) {
                            // Add the records to the sublist...
                            for (r = 0; r < records.length; r++) {
                                    dados = records[r];
                                    codLocation = dados['id'];
                            }
                    }
                    return {codEmpreendimento: codEmpreendimento, codProjeto: codProjeto, codLocation: codLocation};
            } else {
                    return {codEmpreendimento: null, codProjeto: null, codLocation: null};
            }
        }


        return { post , getSPEObra} 

    });

    
