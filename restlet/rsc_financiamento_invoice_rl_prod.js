/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/error', 'N/log', 'N/query', 'N/record', 'N/runtime', 'N/search', 'N/transaction'], (error, log, query, record, runtime, search, transaction) => {
const anularTransacao = (tipo, id) => {
    log.audit('anularTranscao', {tipo: tipo, id: id});

    try {
        var voidTransaction = transaction.void({
            type: tipo,
            id: id
        });
        log.audit('voidTransaction', voidTransaction);

        var lkpBoleto = search.lookupFields({type: tipo,
            id: id,
            columns: ['status','tranid']
        });
        log.audit('lkpBoleto', lkpBoleto);

        return {
            boleto: lkpBoleto.tranid,
            status: lkpBoleto.status
        }           
    } catch(e) {
        log.error('Erro anularTransacao', e);
        return e;
    }
}

const _put = (context) => {
    log.audit('put', context);
    // anularTransacao('creditmemo', 178746);

    var sucesso = [];
    var erro = [];

    for (i=0; i<context.ids.length; i++) {
        var journalentry = context.ids[i];

        try {
            record.delete({type: context.type, id: context.ids[i]});
            log.audit('Excluído!', {journalentry: context.ids[i]});
            sucesso.push(journalentry);
        } catch(e) {
            log.audit('Erro excluir!', {journalentry: context.ids[i], msg: e});
            erro.push(journalentry);
        }
    }

    if (sucesso.length > 0 || erro.length > 0) {
        return {
            status: 'Processado',
            sucesso: sucesso,
            erro: erro
        }
    } else {
        return {
            status: 'Não-processado'
        }
    }
}

const _post2 = (context) => {
    log.audit('_post2', context);
    
    var ambiente = runtime.envType;
    log.audit('ambiente', ambiente);

    var Record, soId, lkpSO, salesOrder;
    var parcelas = []; 
    
    Record = record.create({
        type: 'salesorder'
        , isDynamic: true
    });
    
    Object.keys(context).forEach(function(bodyField) {
        if (bodyField == 'custbody_rsc_data_venda' || bodyField == 'duedate') {    
            var split = context[bodyField].split('/');
            Record.setValue(bodyField, new Date(split[2], split[1] - 1, split[0]));
        } else {
            Record.setValue(bodyField, context[bodyField]);
        }
    });

    for (i=0; i<context.itens.length; i++) {
        Record.selectLine('item', 0)    
        .setCurrentSublistValue('item', 'item', context.itens[i].item)
        .setCurrentSublistValue('item', 'quantity', context.itens[i].quantity)
        .setCurrentSublistValue('item', 'rate', context.itens[i].rate)
        .setCurrentSublistValue('item', 'amount', context.itens[i].amount)
        .commitLine('item');
    }

    // Object.keys(context.itens[0]).forEach(function(sublistField) {
    //     Record.selectLine({
    //         sublistId: 'item',
    //         line: 0
    //     });

    //     if (sublistField == 'amount') {
    //         Record.setCurrentSublistValue({
    //             sublistId: 'item',
    //             fieldId: sublistField, 
    //             value: Number(context.itens[0][sublistField])
    //         });
    //     } else {
    //         Record.setCurrentSublistValue({
    //             sublistId: 'item',
    //             fieldId: sublistField, 
    //             value: context.itens[0][sublistField]
    //         });
    //     }

    //     Record.commitLine({
    //         sublistId: 'item'
    //     });
    // });

    soId = Record.save({ignoreMandatoryFields: true});

    lkpSO = search.lookupFields({type: 'salesorder',
        id: soId,
        columns: ['tranid','location']
    });
    log.audit('Contrato gerado!', {id: soId, traind: lkpSO.tranid});

    const gerarProponente = (idCliente, principal, participacao, idPedido) => {
        // log.audit('gerarProponente', {
        //     idCliente: idCliente,
        //     principal: principal,
        //     participacao: participacao,
        //     idPedido: idPedido
        // });

        var proponente = record.create({type: 'customrecord_rsc_finan_client_contrato'});

        proponente.setValue('custrecord_rsc_clientes_contratos', idCliente)
        .setValue('custrecord_rsc_principal', principal)
        .setValue('custrecord_rsc_pct_part', participacao)
        .setValue('custrecord_rsc_fat_contrato', idPedido);
    
        var idProponente = proponente.save();
        log.audit('Contrato', {idProponente: idProponente, idPedido: idPedido, tranid: lkpSO.tranid});  

        return idProponente;
    }

    const gerarEscritura = (idPedido, idCliente, empreendimento, unidade, statusEsc, dataEsc) => {
        // log.audit('gerarEscritura', {
        //     idPedido: idPedido,
        //     idCliente: idCliente,
        //     empreendimento: empreendimento,
        //     unidade: unidade,
        //     statusEsc: statusEsc,
        //     dataEsc: dataEsc
        // });

        var escrituracao = record.create({type: 'customrecord_lrc_controle_escrituracao'});

        var hoje = new Date();
        var umAno = new Date();
        umAno.setDate(umAno.getDate()+365)
        var umAnoE1Dia = new Date();
        umAnoE1Dia.setDate(umAnoE1Dia.getDate()+366)

        escrituracao.setValue('custrecord_lrc_fatura_de_venda', idPedido)
        .setValue('custrecord_lrc_cliente_ce', idCliente)
        .setValue('custrecord_lrc_empreendimento_fatura', empreendimento)
        .setValue('custrecord_lrc_unidade_vendida', unidade)
        .setValue('custrecord_lrc_tipo_escrituracao', statusEsc)
        .setValue('custrecord_lrc_status_escrituracao', dataEsc)
        .setValue('custrecord_lrc_data_escrituracao', hoje)
        .setValue('custrecord_lrc_data_entrega_construcao', umAno)
        .setValue('custrecord_lrc_data_procurador', umAnoE1Dia);
    
        var idEscrituracao = escrituracao.save();
        log.audit('Contrato', {idEscrituracao: idEscrituracao, idPedido: idPedido, tranid: lkpSO.tranid});
        
        record.load({
            type: 'salesorder',
            id: idPedido,
            isDynamic: true
        })
        .setValue('custbody_lrc_fat_controle_escrituracao', idEscrituracao)
        .save({ignoreMandatoryFields: true});

        return idEscrituracao;
    }   

    salesOrder = {        
        idEscrituracao: gerarEscritura(soId, context.entity, context.custbody_rsc_projeto_obra_gasto_compra, context.custbody_rsc_tran_unidade, 1, 1),
        idProponente: gerarProponente(context.entity, true, 1000, soId),
        id: soId,
        tranid: lkpSO.tranid
    }

    // try {
        if (context.custbody_rsc_terms) {
            switch(context.custbody_rsc_terms) {
                case '5': // 12 parcelas
                    quantidadeParcelas = 12;
                    for (n=0; n<quantidadeParcelas; n++) {
                        Record = record.transform({
                            fromType: 'salesorder',
                            fromId: soId,
                            toType: 'invoice',
                            isDynamic: true
                        });

                        Record.setValue('createdfrom', soId)
                        .setValue('approvalstatus', 2); // Aprovado
                        
                        var data = context['duedate'];
                        var split = data.split('/');
                        novaData = new Date(split[2], split[1] - 1, split[0]);
                        nd = novaData.setMonth(novaData.getMonth()+n);
                        var dia = new Date(nd).getDate();
                        var mes = new Date(nd).getMonth()+1;

                        if (mes == 2 && dia > 28) {
                            nd = novaData.setDate(28);
                        }

                        if ((mes == 4 || mes == 6 || mes == 9 || mes == 11) && dia > 30) {
                            nd = novaData.setDate(30);
                        }
                        
                        Record.setValue('duedate', n == 0 ? novaData : new Date(nd));

                        Object.keys(context.itens[0]).forEach(function(sublistField) {
                            Record.selectLine({
                                sublistId: 'item',
                                line: 0
                            });
                
                            if (sublistField == 'amount' || sublistField == 'rate') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: Number(context.itens[0][sublistField]) / quantidadeParcelas
                                });
                            } else if (sublistField == 'item') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: 19420
                                });
                            } else {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: context.itens[0][sublistField]
                                });
                            }
                
                            Record.commitLine({
                                sublistId: 'item'
                            });
                        });

                        Record.setValue('custbody_lrc_fatura_principal', soId);

                        var idParcela = Record.save({ignoreMandatoryFields: true});
                
                        parcelas.push({
                            id: idParcela,
                            tranid: search.lookupFields({type: 'invoice',
                                id: idParcela,
                                columns: ['tranid']
                            }).tranid
                        });
                        //  log.audit('parcelas', parcelas);
                    }
                break;

                case '4': // À VISTA
                    quantidadeParcelas = 1;
                    for (n=0; n<quantidadeParcelas; n++) {
                        Record = record.transform({
                            fromType: 'salesorder',
                            fromId: soId,
                            toType: 'invoice',
                            isDynamic: true
                        });

                        Record.setValue('createdfrom', soId)
                        .setValue('approvalstatus', 2); // Aprovado
                        
                        var data = context['duedate'];
                        var split = data.split('/');
                        novaData = new Date(split[2], split[1] - 1, split[0]);
                        nd = novaData.setMonth(novaData.getMonth()+n);
                        var dia = new Date(nd).getDate();
                        var mes = new Date(nd).getMonth()+1;

                        if (mes == 2 && dia > 28) {
                            nd = novaData.setDate(28);
                        }

                        if ((mes == 4 || mes == 6 || mes == 9 || mes == 11) && dia > 30) {
                            nd = novaData.setDate(30);
                        }
                        
                        Record.setValue('duedate', n == 0 ? novaData : new Date(nd));

                        Object.keys(context.itens[0]).forEach(function(sublistField) {
                            Record.selectLine({
                                sublistId: 'item',
                                line: 0
                            });
                
                            if (sublistField == 'amount' || sublistField == 'rate') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: Number(context.itens[0][sublistField]) / quantidadeParcelas
                                });
                            } else if (sublistField == 'item') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: 19420
                                });
                            } else {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: context.itens[0][sublistField]
                                });
                            }
                
                            Record.commitLine({
                                sublistId: 'item'
                            });
                        });

                        Record.setValue('custbody_lrc_fatura_principal', soId);

                        var idParcela = Record.save({ignoreMandatoryFields: true});
                
                        parcelas.push({
                            id: idParcela,
                            tranid: search.lookupFields({type: 'invoice',
                                id: idParcela,
                                columns: ['tranid']
                            }).tranid
                        });
                        //  log.audit('parcelas', parcelas);
                    }
                break;

                case '3': // 2 parcelas
                    quantidadeParcelas = 2;
                    for (n=0; n<quantidadeParcelas; n++) {
                        Record = record.transform({
                            fromType: 'salesorder',
                            fromId: soId,
                            toType: 'invoice',
                            isDynamic: true
                        });

                        Record.setValue('createdfrom', soId)
                        .setValue('approvalstatus', 2); // Aprovado
                        
                        var data = context['duedate'];
                        var split = data.split('/');
                        novaData = new Date(split[2], split[1] - 1, split[0]);
                        nd = novaData.setMonth(novaData.getMonth()+n);
                        var dia = new Date(nd).getDate();
                        var mes = new Date(nd).getMonth()+1;         

                        if (mes == 2 && dia > 28) {   
                            nd = novaData.setDate(28);
                        }

                        if ((mes == 4 || mes == 6 || mes == 9 || mes == 11) && dia > 30) {
                            nd = novaData.setDate(30);
                        }
                        
                        Record.setValue('duedate', n == 0 ? novaData : new Date(nd));

                        // Object.keys(context.itens[0]).forEach(function(sublistField) {
                        //     Record.selectLine({
                        //         sublistId: 'item',
                        //         line: 0
                        //     });
                
                        //     if (sublistField == 'amount' || sublistField == 'rate') {
                        //         Record.setCurrentSublistValue({
                        //             sublistId: 'item',
                        //             fieldId: sublistField, 
                        //             value: Number(context.itens[0][sublistField]) / quantidadeParcelas
                        //         });
                        //     } else if (sublistField == 'item') {
                        //         Record.setCurrentSublistValue({
                        //             sublistId: 'item',
                        //             fieldId: sublistField, 
                        //             value: 28650
                        //         });
                        //     } else {
                        //         Record.setCurrentSublistValue({
                        //             sublistId: 'item',
                        //             fieldId: sublistField, 
                        //             value: context.itens[0][sublistField]
                        //         });
                        //     }
                
                        //     Record.commitLine({
                        //         sublistId: 'item'
                        //     });
                        // });

                        for (i=0; i<context.itens.length; i++) {
                            Record.selectLine('item', 0)    
                            .setCurrentSublistValue('item', 'item', 28650)
                            .setCurrentSublistValue('item', 'quantity', context.itens[i].quantity)
                            .setCurrentSublistValue('item', 'rate', context.itens[i].rate / quantidadeParcelas)
                            .setCurrentSublistValue('item', 'amount', context.itens[i].amount / quantidadeParcelas)
                            .commitLine('item');
                        }

                        Record.setValue('custbody_lrc_fatura_principal', soId);

                        var idParcela = Record.save({ignoreMandatoryFields: true});
                
                        parcelas.push({
                            id: idParcela,
                            tranid: search.lookupFields({type: 'invoice',
                                id: idParcela,
                                columns: ['tranid']
                            }).tranid
                        });
                        //  log.audit('parcelas', parcelas);
                    }          
                break;

                case '2': // Entrada + 240 parcelas
                    // corpo.duedate = fatura.getValue('duedate');
                    // corpo.item = item;
                    // corpo.quantidadeParcelas = 241;
                    
                    // tarefaMR = task.create({
                    //     taskType: task.TaskType.MAP_REDUCE,
                    //     scriptId: 'customscript_rsc_fatura_gera_parcelas_mr',
                    //     deploymentId: 'customdeploy_rsc_fatura_gera_parcelas_mr',
                    //     params: {custscript_rsc_json_fatura: corpo}
                    // });
                    
                    // idTarefaMR = tarefaMR.submit();
                    // log.audit('idTarefaMR', idTarefaMR);
                    quantidadeParcelas = 100;
                    for (n=0; n<quantidadeParcelas; n++) {
                        Record = record.transform({
                            fromType: 'salesorder',
                            fromId: soId,
                            toType: 'invoice',
                            isDynamic: true
                        });

                        Record.setValue('createdfrom', soId)
                        .setValue('approvalstatus', 2); // Aprovado
                        
                        var data = context['duedate'];
                        var split = data.split('/');
                        novaData = new Date(split[2], split[1] - 1, split[0]);
                        nd = novaData.setMonth(novaData.getMonth()+n);
                        var dia = new Date(nd).getDate();
                        var mes = new Date(nd).getMonth()+1;         

                        if (mes == 2 && dia > 28) {   
                            nd = novaData.setDate(28);
                        }

                        if ((mes == 4 || mes == 6 || mes == 9 || mes == 11) && dia > 30) {
                            nd = novaData.setDate(30);
                        }
                        
                        Record.setValue('duedate', n == 0 ? novaData : new Date(nd));

                        Object.keys(context.itens[0]).forEach(function(sublistField) {
                            Record.selectLine({
                                sublistId: 'item',
                                line: 0
                            });
                
                            if (sublistField == 'amount' || sublistField == 'rate') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: Number(context.itens[0][sublistField]) / quantidadeParcelas
                                });
                            } else if (sublistField == 'item') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: 19420
                                });
                            } else {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: context.itens[0][sublistField]
                                });
                            }
                
                            Record.commitLine({
                                sublistId: 'item'
                            });
                        });

                        Record.setValue('custbody_lrc_fatura_principal', soId);

                        var idParcela = Record.save({ignoreMandatoryFields: true});
                
                        parcelas.push({
                            id: idParcela,
                            tranid: search.lookupFields({type: 'invoice',
                                id: idParcela,
                                columns: ['tranid']
                            }).tranid
                        });
                        //  log.audit('parcelas', parcelas);
                    }      
                break;

                case '1':
                    quantidadeParcelas = 100;
                    for (n=0; n<quantidadeParcelas; n++) {
                        Record = record.transform({
                            fromType: 'salesorder',
                            fromId: soId,
                            toType: 'invoice',
                            isDynamic: true
                        });

                        Record.setValue('createdfrom', soId)
                        .setValue('approvalstatus', 2); // Aprovado
                        
                        var data = context['duedate'];
                        var split = data.split('/');
                        novaData = new Date(split[2], split[1] - 1, split[0]);
                        nd = novaData.setMonth(novaData.getMonth()+n);
                        var dia = new Date(nd).getDate();
                        var mes = new Date(nd).getMonth()+1;

                        if (mes == 2 && dia > 28) {
                            nd = novaData.setDate(28);
                        }

                        if ((mes == 4 || mes == 6 || mes == 9 || mes == 11) && dia > 30) {
                            nd = novaData.setDate(30);
                        }
                        
                        Record.setValue('duedate', n == 0 ? novaData : new Date(nd));

                        Object.keys(context.itens[0]).forEach(function(sublistField) {
                            Record.selectLine({
                                sublistId: 'item',
                                line: 0
                            });
                
                            if (sublistField == 'amount' || sublistField == 'rate') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: Number(context.itens[0][sublistField]) / quantidadeParcelas
                                });
                            } else if (sublistField == 'item') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: 19420
                                });
                            } else {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: context.itens[0][sublistField]
                                });
                            }
                
                            Record.commitLine({
                                sublistId: 'item'
                            });
                        });

                        Record.setValue('custbody_lrc_fatura_principal', soId);

                        var idParcela = Record.save({ignoreMandatoryFields: true});
                
                        parcelas.push({
                            id: idParcela,
                            tranid: search.lookupFields({type: 'invoice',
                                id: idParcela,
                                columns: ['tranid']
                            }).tranid
                        });
                        //  log.audit('parcelas', parcelas);
                    }        
                break;

                default: ''; break;
            }
        }
    // } catch(e) {
    //     log.error('Erro', e);

    //     if (e.error.code == 'DATE_EXPECTED' || e.error.code == 'INVALID_INITIALIZE_REF') {                
    //         parcelas.push({
    //             id: idParcela,
    //             tranid: search.lookupFields({type: 'invoice',
    //                 id: idParcela,
    //                 columns: ['tranid']
    //             }).tranid
    //         });
    //         //  log.audit('parcelas', parcelas);
    //     }
    // }
    
    log.audit('return', {salesOrder: salesOrder, parcelas: parcelas});

    return {
        salesOrder: salesOrder,
        parcelas: parcelas        
    }
}

const _post = (context) => {
    log.audit('_post', context);

    var Record, invoiceId, invoice, idFi;
    var fi = []; 
    
    Record = record.create({type: 'invoice', isDynamic: true});
    
    Object.keys(context).forEach(function(bodyField) {
        if (bodyField == 'duedate' || bodyField == 'custbody_rsc_finan_dateativacontrato' || bodyField == 'custbody_lrc_data_chave' || bodyField == 'custbody_lrc_data_previsao_entrega' || 
        bodyField == 'custbody_lrc_data_previsao_entrega' || bodyField == 'custbody_lrc_data_liberacao_chave') {    
            var split = context[bodyField].split('/');

            Record.setValue({
                fieldId: bodyField, 
                value: new Date(split[2], split[1] - 1, split[0])
            });
        } else {
            Record.setValue({
                fieldId: bodyField, 
                value: context[bodyField]
            });
        }
    });

    Object.keys(context.itens[0]).forEach(function(sublistField) {
        Record.selectLine({
            sublistId: 'item',
            line: 0
        });

        if (sublistField == 'amount') {
            Record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: sublistField, 
                value: Number(context.itens[0][sublistField])
            });
        } else {
            Record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: sublistField, 
                value: context.itens[0][sublistField]
            });
        }

        Record.commitLine({
            sublistId: 'item'
        });
    });

    invoiceId = Record.save({ignoreMandatoryFields: true});

    if (invoiceId) {
        const proponente = record.create({type: 'customrecord_rsc_finan_client_contrato'});

        proponente.setValue('custrecord_rsc_clientes_contratos', context.entity)
        .setValue('custrecord_rsc_principal', true)
        .setValue('custrecord_rsc_pct_part', 100)
        .setValue('custrecord_rsc_fat_contrato', invoiceId);

        try {
            const idProponente = proponente.save();
            log.audit('Contrato: '+invoiceId, {idProponente: idProponente});
        } catch(e) {
            log.error('Erro proponente', e);
        }       
    }

    invoice = {
        id: invoiceId,
        tranid: search.lookupFields({type: 'invoice',
            id: invoiceId,
            columns: ['tranid']
        }).tranid
    }

    try {
            if (context.custbody_rsc_terms) {
            switch(context.custbody_rsc_terms) {
                case 5: // 12 parcelas
                    quantidadeParcelas = 12;
                    for (n=0; n<quantidadeParcelas; n++) {
                        Record = record.create({type: 'customsale_rsc_financiamento', isDynamic: true});
                        Object.keys(context).forEach(function(bodyField) {
                            if (bodyField == 'duedate' || bodyField == 'custbody_rsc_finan_dateativacontrato' || bodyField == 'custbody_lrc_data_chave' || bodyField == 'custbody_lrc_data_previsao_entrega' || 
                            bodyField == 'custbody_lrc_data_previsao_entrega' || bodyField == 'custbody_lrc_data_liberacao_chave') {
                                var split = context[bodyField].split('/');

                                if (bodyField == 'duedate') {
                                    Record.setValue({
                                        fieldId: bodyField, 
                                        value: n == 0 ? new Date(split[2], split[1] - 1, split[0]) : new Date(split[2], split[1] + 1, split[0])
                                    });
                                } else {
                                    Record.setValue({
                                        fieldId: bodyField, 
                                        value: new Date(split[2], split[1] - 1, split[0])
                                    });
                                }                            
                            } else {
                                Record.setValue({
                                    fieldId: bodyField, 
                                    value: context[bodyField]
                                });
                            }
                        });
                
                        Object.keys(context.itens[0]).forEach(function(sublistField) {
                            Record.selectLine({
                                sublistId: 'item',
                                line: 0
                            });
                
                            if (sublistField == 'amount' || sublistField == 'rate') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: Number(context.itens[0][sublistField])
                                });
                            } else if (sublistField == 'item') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: 19420
                                });
                            } else {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: context.itens[0][sublistField]
                                });
                            }
                
                            Record.commitLine({
                                sublistId: 'item'
                            });
                        });

                        Record.setValue('custbody_lrc_fatura_principal', invoiceId);

                        idFi = Record.save({ignoreMandatoryFields: true});
                
                        fi.push({
                            id: idFi,
                            tranid: search.lookupFields({type: 'customsale_rsc_financiamento',
                                id: idFi,
                                columns: ['tranid']
                            }).tranid
                        });
                        log.audit('fi', fi);
                    }
                break;

                case 4: // À VISTA
                    quantidadeParcelas = 1;
                    for (n=0; n<quantidadeParcelas; n++) {
                        Record = record.create({type: 'customsale_rsc_financiamento', isDynamic: true});
                        
                        Object.keys(context).forEach(function(bodyField) {
                            if (bodyField == 'duedate' || bodyField == 'custbody_rsc_finan_dateativacontrato' || bodyField == 'custbody_lrc_data_chave' || bodyField == 'custbody_lrc_data_previsao_entrega' || 
                            bodyField == 'custbody_lrc_data_previsao_entrega' || bodyField == 'custbody_lrc_data_liberacao_chave') {
                                var split = context[bodyField].split('/');
                
                                Record.setValue({
                                    fieldId: bodyField, 
                                    value: new Date(split[2], split[1] - 1, split[0])
                                });
                            } else {
                                Record.setValue({
                                    fieldId: bodyField, 
                                    value: context[bodyField]
                                });
                            }
                        });
                
                        Object.keys(context.itens[0]).forEach(function(sublistField) {
                            Record.selectLine({
                                sublistId: 'item',
                                line: 0
                            });
                
                            if (sublistField == 'amount') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: Number(context.itens[0][sublistField])
                                });
                            } else {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: context.itens[0][sublistField]
                                });
                            }
                
                            Record.commitLine({
                                sublistId: 'item'
                            });
                        });

                        Record.setValue('custbody_lrc_fatura_principal', invoiceId);

                        idFi = Record.save();
                
                        fi.push({
                            id: idFi,
                            tranid: search.lookupFields({type: 'customsale_rsc_financiamento',
                                id: idFi,
                                columns: ['tranid']
                            }).tranid
                        }); 
                    }
                break;

                case 3: // 2 parcelas
                    quantidadeParcelas = 2;
                    for (n=0; n<quantidadeParcelas; n++) {
                        Record = record.create({type: 'customsale_rsc_financiamento', isDynamic: true});
                        Object.keys(context).forEach(function(bodyField) {
                            if (bodyField == 'duedate' || bodyField == 'custbody_rsc_finan_dateativacontrato' || bodyField == 'custbody_lrc_data_chave' || bodyField == 'custbody_lrc_data_previsao_entrega' || 
                            bodyField == 'custbody_lrc_data_previsao_entrega' || bodyField == 'custbody_lrc_data_liberacao_chave') {
                                var split = context[bodyField].split('/');

                                if (bodyField == 'duedate') {
                                    Record.setValue({
                                        fieldId: bodyField, 
                                        value: n == 0 ? new Date(split[2], split[1] - 1, split[0]) : new Date(split[2], split[1] + 1, split[0])
                                    });
                                } else {
                                    Record.setValue({
                                        fieldId: bodyField, 
                                        value: new Date(split[2], split[1] - 1, split[0])
                                    });
                                }                            
                            } else {
                                Record.setValue({
                                    fieldId: bodyField, 
                                    value: context[bodyField]
                                });
                            }
                        });
                
                        Object.keys(context.itens[0]).forEach(function(sublistField) {
                            Record.selectLine({
                                sublistId: 'item',
                                line: 0
                            });
                
                            if (sublistField == 'amount' || sublistField == 'rate') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: Number(context.itens[0][sublistField])
                                });
                            } else if (sublistField == 'item') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: 19420
                                });
                            } else {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: context.itens[0][sublistField]
                                });
                            }
                
                            Record.commitLine({
                                sublistId: 'item'
                            });
                        });

                        Record.setValue('custbody_lrc_fatura_principal', invoiceId);

                        idFi = Record.save({ignoreMandatoryFields: true});
                
                        fi.push({
                            id: idFi,
                            tranid: search.lookupFields({type: 'customsale_rsc_financiamento',
                                id: idFi,
                                columns: ['tranid']
                            }).tranid
                        });
                        log.audit('fi', fi);
                    }            
                break;

                case 2: // Entrada + 240 parcelas
                    corpo.duedate = fatura.getValue('duedate');
                    corpo.item = item;
                    corpo.quantidadeParcelas = 241;
                    
                    tarefaMR = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_rsc_fatura_gera_parcelas_mr',
                        deploymentId: 'customdeploy_rsc_fatura_gera_parcelas_mr',
                        params: {custscript_rsc_json_fatura: corpo}
                    });
                    
                    idTarefaMR = tarefaMR.submit();
                    log.audit('idTarefaMR', idTarefaMR);
                break;

                case 1:
                    quantidadeParcelas = 100;
                    for (n=0; n<quantidadeParcelas; n++) {
                        Record = record.create({type: 'customsale_rsc_financiamento', isDynamic: true});
                        Object.keys(context).forEach(function(bodyField) {
                            if (bodyField == 'duedate' || bodyField == 'custbody_rsc_finan_dateativacontrato' || bodyField == 'custbody_lrc_data_chave' || bodyField == 'custbody_lrc_data_previsao_entrega' || 
                            bodyField == 'custbody_lrc_data_previsao_entrega' || bodyField == 'custbody_lrc_data_liberacao_chave') {
                                log.audit(bodyField, context[bodyField]);

                                var split = context[bodyField].split('/');

                                if (bodyField == 'duedate') {
                                    Record.setValue({
                                        fieldId: bodyField, 
                                        value: n == 0 ? new Date(split[2], split[1] - 1, split[0]) : new Date(split[2], split[1] + 1, split[0])
                                    });
                                } 
                                // else {
                                //     Record.setValue({
                                //         fieldId: bodyField, 
                                //         value: copyInvoice.getValue(bodyField)
                                //         // value: new Date(split[2], split[1] - 1, split[0]) 
                                //     });
                                // }                            
                            } else {
                                Record.setValue({
                                    fieldId: bodyField, 
                                    value: context[bodyField]
                                });
                            }
                        });
                
                        Object.keys(context.itens[0]).forEach(function(sublistField) {
                            Record.selectLine({
                                sublistId: 'item',
                                line: 0
                            });
                
                            if (sublistField == 'amount' || sublistField == 'rate') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: Number(context.itens[0][sublistField]) / quantidadeParcelas
                                });
                            } else if (sublistField == 'item') {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: 19420
                                });
                            } else {
                                Record.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: sublistField, 
                                    value: context.itens[0][sublistField]
                                });
                            }
                
                            Record.commitLine({
                                sublistId: 'item'
                            });
                        });

                        Record.setValue('custbody_lrc_fatura_principal', invoiceId);

                        idFi = Record.save({ignoreMandatoryFields: true});
                
                        fi.push({
                            id: idFi,
                            tranid: search.lookupFields({type: 'customsale_rsc_financiamento',
                                id: idFi,
                                columns: ['tranid']
                            }).tranid
                        });
                        log.audit('fi', fi);
                    }        
                break;

                default: ''; break;
            }
        }
    } catch(e) {
        log.error('Erro', e);

        if (e.error.code == 'DATE_EXPECTED') {
            fi.push({
                id: idFi,
                tranid: search.lookupFields({type: 'customsale_rsc_financiamento',
                    id: idFi,
                    columns: ['tranid']
                }).tranid
            });
            log.audit('fi', fi);
        }
    }

    return {
        invoice: invoice,
        fi: fi        
    }
}

const _get = (context) => {
    log.audit('_get', context);

    var relacao = {
        sucesso: [],
        erro: []
    }

    search.create({type: "transaction",
        filters: [
            ["mainline","is","T"], "AND", 
            ["type","anyof","PurchOrd","PurchReq"]
               , "AND", 
               ["internalid","anyof","152181","328161","230149","319407"]
        ],
        columns: [
            search.createColumn({name: "datecreated", sort: search.Sort.DESC, label: "Data de criação"}),
            search.createColumn({name: "internalid", label: "ID interno"}),
            search.createColumn({name: "type", label: "Tipo"}),
            search.createColumn({name: "tranid", label: "Número do documento"}),
            search.createColumn({name: "customform", label: "Formulário personalizado"})
        ]
    }).run().each(function(result) {
        log.audit('result', result);

        try {
            var loadReg = record.load({type: 'purchaserequisition', id: result.id});
    
            loadReg.setValue('customform', 274) // GAFISA - Requisição de Compras
            .save(opcoes);

            relacao.sucesso.push(result.getValue('tranid'));
        
            log.audit('Sucesso', {tipo: 'purchaserequisition', idInterno: result.id, valores: 274});
        } catch(e) {
            log.error('Erro', {tipo: 'purchaserequisition', idInterno: result.id, valores: 274, msg: e});
            relacao.erro.push(result.getValue('tranid'));
        } 
    });
}

const _delete = (context) => {}

return {
    delete: _delete,
    get: _get,
    post: _post2,
    // post: _post,
    put: _put
}
});
