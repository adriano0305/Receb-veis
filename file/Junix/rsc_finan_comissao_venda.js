/**
 * @NApiVersion 2.1
 */
define(['N/query', 'N/record','N/runtime'],
    /**
 * @param{query} query
 * @param{record} record
 */
    (query, record, runtime) => {

        var idSubsidiaria = 0;
        var codLocation = 230;
        function _getSubsidiary(cnpj){
            /* Valida se é filial Gafisa */
            var subsidiary = query.runSuiteQL({
                query: 'select id from subsidiary where federalidnumber = ?',
                params: [cnpj]}
            ).asMappedResults();
            if (subsidiary.length> 0){
                idSubsidiaria = subsidiary[0].id;
                return true;
            }
            return false;
        }

        function _createCommission(comission, faturaPrincipalId){
            if (comission){
                /* Create a new Invoice with value total off gafisa vendas. */
                log.audit({title: 'Valor comissao', details: comission});

                var fieldsInvoice = {
                    "custbody_rsc_nr_proposta": comission.proposta,
                    "duedate": comission.dataProposta,
                    "trandate": comission.dataProposta,
                    "subsidiary": 158,
                    "custbody_rsc_projeto_obra_gasto_compra": comission.projetoObra,
                    "custbody_lrc_codigo_unidade": comission.codigoUnidade,
                    "custbody_rsc_data_venda": comission.dataProposta,
                    "custbody_rsc_tran_unidade": comission.codigoUnidade,
                    "custbody_rsc_contrato_relacionado": faturaPrincipalId
                };

                var faturaComissao = record.create({
                    type: 'salesorder',
                    isDynamic: true
                });

                faturaComissao.setValue({
                    fieldId: 'entity',
                    value: comission.cliente
                });

                Object.keys(fieldsInvoice).forEach(function (key) {
                    faturaComissao.setValue({
                        fieldId: key,
                        value: fieldsInvoice[key]
                    });
                });

                var localidade = codLocation;
                var item =  runtime.getCurrentScript().getParameter({name:'custscript_rsc_cdt_venda_unidade_1'})
                faturaComissao.setValue({
                    fieldId: 'location',
                    value: 114
                });
                faturaComissao.insertLine({sublistId:'item', line: 0})
                faturaComissao.setCurrentSublistValue({
                    fieldId: 'item',
                    sublistId: 'item',
                    value: item
                });
                faturaComissao.setCurrentSublistValue({
                    fieldId: 'rate',
                    sublistId: 'item',
                    value: comission.value
                });
                faturaComissao.setCurrentSublistValue({
                    fieldId: 'quantity',
                    sublistId: 'item',
                    value: 1
                });

                faturaComissao.commitLine({sublistId:'item'});

                var idFaturacomissao = faturaComissao.save({ignoreMandatoryFields: true});
                if (comission.parcelas.length > 0){
                    for (let i = 0; i < comission.parcelas.length; i++) {
                        var commLine = comission.parcelas[i];
                        var fieldsCustomerParcela = {
                            "custbody_rsc_nr_proposta": comission.NumeroProposta,
                            "duedate": commLine.dataVencimento,
                            "trandate": comission.dataProposta,
                            "startdate": commLine.dataVencimento,
                            "enddate": commLine.dataVencimento,
                            "subsidiary": 158,
                            "custbody_rsc_projeto_obra_gasto_compra": comission.projetoObra,
                            "custbody_lrc_fatura_principal": idFaturacomissao,
                            "custbody_lrc_cod_parcela": commLine.codParcela,
                            "terms": 4,
                            "status": 'B',
                            "account": 122,
                            "custbody_rsc_tran_unidade": comission.codigoUnidade
                        };

                        var parcela = record.create({type: 'invoice', isDynamic: false});

                        parcela.setValue({
                            fieldId: 'entity',
                            value: comission.cliente
                        });
                        Object.keys(fieldsCustomerParcela).forEach(function (key) {
                            parcela.setValue({
                                fieldId: key,
                                value: fieldsCustomerParcela[key],
                                ignoreFieldChange: true
                            });
                        });

                        var localidade = codLocation;
                         
                        parcela.setValue({
                            fieldId: 'location',
                            value: 114
                        });

                        var item = runtime.getCurrentScript().getParameter({name:'custscript_rsc_servico'})

                        parcela.setSublistValue({
                            fieldId: 'item',
                            sublistId: 'item',
                            line: 0,
                            value: item
                        });
                        parcela.setSublistValue({
                            fieldId: 'amount',
                            sublistId: 'item',
                            line: 0,
                            value: commLine.valor
                        });
                        parcela.setSublistValue({
                            fieldId: 'quantity',
                            sublistId: 'item',
                            line: 0,
                            value: 1
                        });

                        parcela.save({ignoreMandatoryFields: true})
                    }
                }
                log.audit({title: 'Fatura Comissão', details: idFaturacomissao});
                var contratoRecord = record.load({
                    type:'salesorder',
                    id:faturaPrincipalId
                })
                contratoRecord.setValue({
                    fieldId:'custbody_rsc_comissao_relacionada',
                    value: idFaturacomissao
                })
                contratoRecord.save({
                    ignoreMandatoryFields:true
                })
            }
        };

        function _summarizeValues(comission, comissionado, dataVencimento, codParcela){
            log.audit({title: 'comissionado', details: comissionado});
            if (_getSubsidiary(comissionado.CPF_CNPJ)){
                comission.idSub = idSubsidiaria;
                var parcela = {
                    dataVencimento: dataVencimento,
                    codParcela: codParcela,
                    valor: comissionado.ValorComissao
                }
                comission.parcelas.push(parcela);
            };
            comission = _updateValueTotal(comission);
            return comission
        }

        function _updateValueTotal(comission){
            if (comission.parcelas.length > 0){
                var value = 0;
                for (let i = 0; i < comission.parcelas.length; i++) {
                    var parcela = comission.parcelas[i];
                    value += parcela.valor;
                }
                comission.value = value;
            }

            return comission;
        }

        function _newCommission( client, propostaJunix, propostaNetSuite, dataProposta, projetoObra, codigoUnidade){
            return {
                cliente : client,
                proposta : propostaJunix,
                propostaNetSuite: propostaNetSuite,
                dataProposta: dataProposta,
                projetoObra: projetoObra,
                codigoUnidade: codigoUnidade,
                value: 0,
                parcelas: []
            }
        }


        return {_createCommission, _summarizeValues, _newCommission}

    });
