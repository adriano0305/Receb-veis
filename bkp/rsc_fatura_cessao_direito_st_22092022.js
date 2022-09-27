/**
 *@NApiVersion 2.1
*@NScriptType Suitelet
*/
const custPage = 'custpage_rsc_';

define(['N/format', 'N/log', 'N/query', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/redirect'], (format, log, query, record, runtime, search, serverWidget, url, redirect) => {
/* ******************* FIELD TYPES ****************** *
    * ■ CHECKBOX ■ CURRENCY ■ DATE ■ DATETIMETZ ■ EMAIL   *
    * ■ FILE ■ FLOAT ■ HELP ■ INLINEHTML ■ INTEGER        *
    * ■ IMAGE ■ LABEL ■ LONGTEXT ■ MULTISELECT ■ PASSPORT *
    * ■ PERCENT ■ PHONE ■ SELECT ■ RADIO ■ RICHTEXT       *
    * ■ TEXT ■ TEXTAREA ■ TIMEOFDAY ■ URL                 *
    * *************************************************** */ 

    /* ****************** SUBLIST TYPES ***************** *
    * ■ INLINEEDITOR ■ EDITOR ■ LIST ■ STATICLIST         *
    * *************************************************** */
const formatData = (data) => {
    var partesData = data.split("/");

    var novaData = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    return novaData;
}

const moedaBR = (valor) => {
    var formatoBR = format.format({value: valor, type: format.Type.FLOAT});
    return formatoBR;
}

const lookupCustomer = (entitytitle) => {
    var sql = "SELECT id "+
    "FROM customer "+
    "WHERE entitytitle = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [entitytitle]
    });

    var sqlResults = consulta.asMappedResults();

    return sqlResults[0].id;  
}

const localizarCLiente = (altname) => {
    const sql = 'SELECT customer.altname '+
    'FROM customer '+
    'WHERE customer.id = ?';

    var consulta = query.runSuiteQL({
        query: sql,
        params: [altname]
    });

    var sqlResults = consulta.asMappedResults();

    return sqlResults[0].altname;    
}

const transferirContrato = (idContrato, idFI, cessionario) => {
    log.audit('transferirContrato', {idContrato: idContrato, idFI: idFI, cessionario, cessionario});
    const clienteContrato = (idFatura) => {
        const sql = "SELECT transaction.entity FROM transaction WHERE transaction.custbody_lrc_fatura_principal = ?";

        var consulta = query.runSuiteQL({
            query: sql,
            params: [idFatura]
        });

        var sqlResults = consulta.asMappedResults()[0].entity;
        
        return sqlResults;
    }
    
    try {
        if (clienteContrato(idContrato) != cessionario) {
            record.submitFields({type: 'invoice',
                id: idContrato,
                values: {
                    entity: cessionario
                },
                options: {
                    ignoreMandatoryFields : true
                }
            });
        }

        // record.load({type: 'invoice', id: idFI})
        // .setValue('entity', cessionario)            
        // .setValue('custbody_lrc_fatura_principal', idContrato)
        // .save({ignoreMandatoryFields: true});

        record.submitFields({type: 'invoice',
            id: idFI,
            values: {
                entity: cessionario,
                custbody_lrc_fatura_principal: idContrato
            },
            options: {
                ignoreMandatoryFields: true
            }
        });

        return { status: 'Sucesso' }
    } catch(e) {
        log.error('Erro transferirContrato', e);

        return { status: 'Erro' }
    }
}

const localizarParcelas = (idContrato, idCliente) => {    
    const sql = "SELECT transaction.id, transaction.tranid, transaction.status, transaction.duedate, transaction.entity, transaction.foreigntotal, transaction.shipdate, transaction.closedate "+
    "FROM transaction "+
    "WHERE transaction.recordtype = 'invoice' "+
    "AND transaction.custbody_lrc_fatura_principal = ? "+
    "AND transaction.entity = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [idContrato, idCliente]
    });

    var sqlResults = consulta.asMappedResults();    
    log.audit('sqlResults', sqlResults);

    var arrayParcelas = [];

    sqlResults.forEach(function(result) {
        if ((result.status === 'A' || result.status === 'B' || result.status == 'D') && result.closedate == null) {
            arrayParcelas.push({
                id: result.id,
                tranid: result.tranid,
                duedate: result.duedate,
                foreigntotal: result.foreigntotal
            });
        }
    });

    return arrayParcelas;
}

const construtor = (metodo, parametros) => {
    var atencao, contrato, empreendimento, clienteAtual, novoCliente, perc_cessao_direito, calculo, link_cessao_dirito, juros, multa, observacoes, totalParcelas, jsonProponentes, id_cessao_direito;
    
    const form = serverWidget.createForm({
        title: 'Cessão de Direito'
    });

    const dadosGerais = form.addFieldGroup({
        id: custPage+'dados_gerais',
        label: 'Dados Gerais'
    });

    const infoCessao = form.addFieldGroup({
        id: custPage+'info_cessao',
        label: 'Info Cessão'
    });

    atencao = form.addField({
        id: custPage+'atencao',
        type: serverWidget.FieldType.INLINEHTML,
        label: ' ',
    });

    atencao.defaultValue = '<B>Selecione o novo cliente para alterações no contrato e suas respectivas parcelas (em aberto).</B> <br><br>';

    atencao.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
    });

    // Dados Gerais
    contrato = form.addField({
        id: custPage+'contrato',
        type: serverWidget.FieldType.SELECT,
        label: 'Contrato',
        container: custPage+'dados_gerais',
        source: 'invoice'
    });

    contrato.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });
    
    empreendimento = form.addField({
        id: custPage+'empreendimento',
        type: serverWidget.FieldType.SELECT,
        label: 'Empreendimento',
        container: custPage+'dados_gerais',
        source: 'job'
    });

    empreendimento.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    clienteAtual = form.addField({
        id: custPage+'cliente_atual',
        type: serverWidget.FieldType.SELECT,
        label: 'Cliente Atual',
        container: custPage+'dados_gerais',
        source: 'customer'
    });

    clienteAtual.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    totalParcelas = form.addField({
        id: custPage+'total_parcelas',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total Parcelas',
        container: custPage+'dados_gerais',
    });

    totalParcelas.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    jsonProponentes = form.addField({
        id: custPage+'json_proponentes',
        type: serverWidget.FieldType.LONGTEXT,
        label: 'JSON Proponentes',
        // container:  custPage+'dados_gerais'
    });

    jsonProponentes.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    // Info Cessão
    novoCliente = form.addField({
        id: custPage+'novo_cliente',
        type: serverWidget.FieldType.SELECT,
        label: 'Novo Cliente',
        container: custPage+'info_cessao',
        source: 'customer'
    });

    perc_cessao_direito = form.addField({
        id: custPage+'perc_cessao_direito',
        type: serverWidget.FieldType.PERCENT,
        label: '% Cessão Direito',
        container: custPage+'info_cessao'
    });

    perc_cessao_direito.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    calculo = form.addField({
        id: custPage+'calculo',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Taxa de Cessão',
        container: custPage+'info_cessao'
    });

    link_cessao_direito = form.addField({
        id: custPage+'cessao_direito',
        type: serverWidget.FieldType.URL,
        label: 'Link Cessão Direito',
        container: custPage+'info_cessao'
    });

    link_cessao_direito.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    juros = form.addField({
        id: custPage+'juros',
        type: serverWidget.FieldType.PERCENT,
        label: 'Juros (%)',
        container: custPage+'info_cessao'
    });

    juros.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    multa = form.addField({
        id: custPage+'multa',
        type: serverWidget.FieldType.PERCENT,
        label: 'Multa (%)',
        container: custPage+'info_cessao'
    });

    multa.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    observacoes = form.addField({
        id: custPage+'observacoes',
        type: serverWidget.FieldType.LONGTEXT,
        label: 'Observações',
        container: custPage+'info_cessao'
    });

    id_cessao_direito = form.addField({
        id: custPage+'id_cessao_direito',
        type: serverWidget.FieldType.INTEGER,
        label: 'ID Cessão Direito',
        container: custPage+'info_cessao'
    });

    id_cessao_direito.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    // Lista de Parcelas
    var queryFI, sublistaFI, linha, link, ver, vencimento, newCustomer, valor, atualizado;
    var arrayParcelas = [];
    
    sublistaFI = form.addSublist({
        id: custPage+'sublista_lista_parcelas',
        type: serverWidget.SublistType.LIST,
        label: 'Parcelas'
    });

    linha = sublistaFI.addField({
        id: custPage+'linha',
        type: serverWidget.FieldType.TEXT,
        label: '#'
    });

    link = sublistaFI.addField({
        id: custPage+'link',
        type: serverWidget.FieldType.URL,
        label: 'Link'
    });

    link.linkText = 'Visualizar';

    ver = sublistaFI.addField({
        id: custPage+'ver',
        type: serverWidget.FieldType.TEXT,
        label: 'Ver'
    });

    vencimento = sublistaFI.addField({
        id: custPage+'vencimento',
        type: serverWidget.FieldType.TEXT,
        label: 'Vencimento'
    });

    newCustomer = sublistaFI.addField({
        id: custPage+'new_customer',
        type: serverWidget.FieldType.TEXT,
        label: 'Cliente'
    });

    valor = sublistaFI.addField({
        id: custPage+'valor',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Valor'
    });

    atualizado = sublistaFI.addField({
        id: custPage+'status_fi',
        type: serverWidget.FieldType.TEXT,
        label: 'Atualizado?'
    });

    var valorFI = 0;    

    // Lista Proponentes
    var sublistaProp, linhaProp, prop, perc_participacao_prop, propPrincipal, arrayProponentes;

    var sublistaProp = form.addSublist({
        id: custPage+'sublista_lista_proponentes',
        type: serverWidget.SublistType.LIST,
        label: 'Proponentes'
    });

    linhaProp = sublistaProp.addField({
        id: custPage+'linha_prop',
        type: serverWidget.FieldType.TEXT,
        label: '#'
    });

    prop = sublistaProp.addField({
        id: custPage+'prop',
        type: serverWidget.FieldType.TEXT,
        label: 'Proponente'
    });

    perc_participacao_prop = sublistaProp.addField({
        id: custPage+'perc_participacao_prop',
        type: serverWidget.FieldType.PERCENT,
        label: 'Percentual Participação'
    });

    propPrincipal = sublistaProp.addField({
        id: custPage+'prop_principal',
        type: serverWidget.FieldType.TEXT,
        label: 'Principal'
    });

    // Lista Novos Proponentes
    var sublista_novos_props, linha_novo_prop, novoProp, perc_participacao_novo_prop, novo_prop_principal;

    var sublista_novos_props = form.addSublist({
        id: custPage+'sublista_lista_novos_props',
        type: serverWidget.SublistType.INLINEEDITOR,
        label: 'Novos Proponentes'
    });

    // linha_novo_prop = sublista_novos_props.addField({
    //     id: custPage+'linha_novo_prop',
    //     type: serverWidget.FieldType.TEXT,
    //     label: '#'
    // });

    novoProp = sublista_novos_props.addField({
        id: custPage+'novo_prop',
        type: serverWidget.FieldType.SELECT,
        label: 'Proponente',
        source: 'customer'
    });

    perc_participacao_novo_prop = sublista_novos_props.addField({
        id: custPage+'perc_participacao_novo_prop',
        type: serverWidget.FieldType.PERCENT,
        label: 'Percentual Participação'
    });

    novo_prop_principal = sublista_novos_props.addField({
        id: custPage+'novo_prop_principal',
        type: serverWidget.FieldType.CHECKBOX,
        label: 'Principal'
    });

    if (metodo == 'GET') {
        contrato.defaultValue = parametros.recordid;
        empreendimento.defaultValue = parametros.job;
        clienteAtual.defaultValue = parametros.entity;
        perc_cessao_direito.defaultValue = parametros.perc_cessao_direito;
        juros.defaultValue = parametros.juros || 0;
        multa.defaultValue = parametros.multa || 0;
        
        arrayProponentes = JSON.parse(parametros.proponentes);

        for (i=0; i<arrayProponentes.length; i++) {
            sublistaProp.setSublistValue({
                id: linhaProp.id,
                line: i,
                value: String(parseInt(i+1))
            });

            sublistaProp.setSublistValue({
                id: prop.id,
                line: i,
                value: arrayProponentes[i].custrecord_rsc_clientes_contratos.text
            });

            sublistaProp.setSublistValue({
                id: perc_participacao_prop.id,
                line: i,
                value: arrayProponentes[i].custrecord_rsc_pct_part
            });

            sublistaProp.setSublistValue({
                id: propPrincipal.id,
                line: i,
                value: arrayProponentes[i].custrecord_rsc_principal == true ? 'Sim' : 'Não'
            });
        }

        queryFI = localizarParcelas(parametros.recordid, parametros.entity);

        if (queryFI.length > 0) {
            for (i=0; i<queryFI.length; i++) {
                valorFI += queryFI[i].foreigntotal;

                sublistaFI.setSublistValue({
                    id: linha.id,
                    line: i,
                    value: String(parseInt(i+1))
                });  
                
                var urlFI = url.resolveRecord({
                    recordType: 'invoice',
                    recordId: queryFI[i].id
                });

                sublistaFI.setSublistValue({
                    id: link.id,
                    line: i,
                    value: urlFI
                });

                sublistaFI.setSublistValue({
                    id: ver.id,
                    line: i,
                    value: 'Parcela '+queryFI[i].tranid
                }); 

                sublistaFI.setSublistValue({
                    id: vencimento.id,
                    line: i,
                    value: queryFI[i].duedate
                }); 

                sublistaFI.setSublistValue({
                    id: newCustomer.id,
                    line: i,
                    value: localizarCLiente(parametros.entity)
                });

                sublistaFI.setSublistValue({
                    id: valor.id,
                    line: i,
                    value: queryFI[i].foreigntotal
                }); 

                sublistaFI.setSublistValue({
                    id: atualizado.id,
                    line: i,
                    value: 'Não'
                });
            }
        }

        totalParcelas.defaultValue = valorFI;
        calculo.defaultValue = ((valorFI * parametros.perc_cessao_direito.replace('%', '')) / 100).toFixed(2);

        novoCliente.isMandatory = true;

        form.addSubmitButton({
            label: 'Salvar'
        });
    } else {
        form.addButton({
            id: custPage+'voltar',
            label: 'Retornar ao contrato',
            functionName: 'retornarContrato'
        });
        
        atencao.defaultValue = '';
        contrato.defaultValue = parametros.custpage_rsc_contrato;
        empreendimento.defaultValue = parametros.custpage_rsc_empreendimento;
        clienteAtual.defaultValue = parametros.custpage_rsc_cliente_atual;        
        jsonProponentes.defaultValue = JSON.parse(parametros.custpage_rsc_json_proponentes);

        var jp = {
            obj: parametros.custpage_rsc_json_proponentes,
            parse: JSON.parse(parametros.custpage_rsc_json_proponentes),
            string: JSON.stringify(parametros.custpage_rsc_json_proponentes)
        }
        log.audit('jp', jp);

        novoCliente.defaultValue = parametros.custpage_rsc_novo_cliente;
        perc_cessao_direito.defaultValue = parametros.custpage_rsc_perc_cessao_direito;
        juros.defaultValue = parametros.custpage_rsc_juros || 0;
        multa.defaultValue = parametros.custpage_rsc_multa || 0;
        observacoes.defaultValue = parametros.custpage_rsc_observacoes;
        
        novoCliente.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        perc_cessao_direito.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        observacoes.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        // Proponentes
        jp.parse.proponentes.forEach(function(bidder, indexP) {
            sublistaProp.setSublistValue({
                id: linhaProp.id,
                line: indexP,
                value: String(parseInt(indexP+1))
            });

            sublistaProp.setSublistValue({
                id: prop.id,
                line: indexP,
                value: bidder.proponente
            });

            sublistaProp.setSublistValue({
                id: perc_participacao_prop.id,
                line: indexP,
                value: bidder.percParticipacao
            });

            sublistaProp.setSublistValue({
                id: propPrincipal.id,
                line: indexP,
                value: bidder.principal == 'Sim' ? 'Sim' : 'Não'
            });
        });

        // Novos Proponentes
        jp.parse.novosProponentes.forEach(function(newBidder, indexNP) {
            sublista_novos_props.setSublistValue({
                id: novoProp.id,
                line: indexNP,
                value: lookupCustomer(newBidder.proponente)
            });

            sublista_novos_props.setSublistValue({
                id: perc_participacao_novo_prop.id,
                line: indexNP,
                value: newBidder.percParticipacao
            });

            sublista_novos_props.setSublistValue({
                id: novo_prop_principal.id,
                line: indexNP,
                value: newBidder.principal == true ? 'T' : 'F'
            });
        });

        queryFI = localizarParcelas(parametros.custpage_rsc_contrato, parametros.custpage_rsc_cliente_atual);

        if (queryFI.length > 0) {
            for (i=0; i<queryFI.length; i++) {
                // var cessaoDireito = transferirContrato(parametros.custpage_rsc_contrato, queryFI[i].id, parametros.custpage_rsc_scriptnovo_cliente);
                valorFI += queryFI[i].foreigntotal;
                
                sublistaFI.setSublistValue({
                    id: linha.id,
                    line: i,
                    value: String(parseInt(i+1))
                });  
                
                var urlFI = url.resolveRecord({
                    recordType: 'invoice',
                    recordId: queryFI[i].id
                });

                sublistaFI.setSublistValue({
                    id: link.id,
                    line: i,
                    value: urlFI
                });

                sublistaFI.setSublistValue({
                    id: ver.id,
                    line: i,
                    value: 'Parcela '+queryFI[i].tranid
                }); 

                sublistaFI.setSublistValue({
                    id: vencimento.id,
                    line: i,
                    value: queryFI[i].duedate
                });

                sublistaFI.setSublistValue({
                    id: newCustomer.id,
                    line: i,
                    value: localizarCLiente(parametros.custpage_rsc_novo_cliente)
                }); 

                sublistaFI.setSublistValue({
                    id: valor.id,
                    line: i,
                    value: queryFI[i].foreigntotal
                });

                sublistaFI.setSublistValue({
                    id: atualizado.id,
                    line: i,
                    value: 'Não'
                });

                arrayParcelas.push({
                    custrecord_rsc_parcela_cessao: queryFI[i].id,
                    custrecord_rsc_vencimento_cessao: queryFI[i].duedate,
                    custrecord_rsc_cliente_atual_cessao: parametros.custpage_rsc_cliente_atual,
                    custrecord_rsc_novo_cliente_cessao: parametros.custpage_rsc_novo_cliente,
                    custrecord_rsc_valor_cessao: queryFI[i].foreigntotal,
                    custrecord_rsc_atualizado: 2
                });
            };
        }

        totalParcelas.defaultValue = valorFI;
        // calculo.defaultValue = parametros.custpage_rsc_calculo_formattedValue;
        calculo.defaultValue = ((valorFI * parametros.custpage_rsc_perc_cessao_direito.replace('%', '')) / 100).toFixed(2);

        var splitCalc = parametros.custpage_rsc_calculo_formattedValue.split(',');
        log.audit('splitCalc', splitCalc);

        var parte1 = splitCalc[0].replace(/\./g,'');
        var parte2 = '.'+splitCalc[1];

        var _rsc_calculo = Number(parte1 + parte2);
        log.audit('_rsc_calculo', _rsc_calculo);

        var camposCD = {
            custrecord_rsc_data_criacao_cd: new Date(),
            custrecord_rsc_criador_cd: runtime.getCurrentUser().id,
            custrecord_rsc_contrato: parametros.custpage_rsc_contrato,
            custrecord_rsc_empreendimento: parametros.custpage_rsc_empreendimento,
            custrecord_rsc_cliente_atual: parametros.custpage_rsc_cliente_atual,
            custrecord_rsc_total_parcelas: valorFI,
            custrecord_rsc_observacao_memo_cessao: parametros.custpage_rsc_observacoes,
            custrecord_rsc_novo_cliente: parametros.custpage_rsc_novo_cliente,
            custrecord_rsc_perc_cessao_direito: parametros.custpage_rsc_perc_cessao_direito,
            // custrecord_rsc_novo_valor_cd: splitCalc[0],
            // custrecord_rsc_calculo: (valorFI * parametros.custpage_rsc_perc_cessao_direito.replace('%', '')) / 100,
            custrecord_rsc_calculo: _rsc_calculo,
            custrecord_rsc_perc_juros: parametros.custpage_rsc_juros || 0,
            custrecord_rsc_perc_multa: parametros.custpage_rsc_multa || 0,
            custrecord_rsc_status_cessao: 1,
            recmachcustrecord_rsc_transferencia_posse: arrayParcelas,
            recmachcustrecord_rsc_novos_proponentes: jp.parse
        }
        log.audit('camposCD', camposCD);

        const perc_CD = record.create({type: 'customrecord_rsc_perc_cessao_direito', isDynamic: true});

        Object.keys(camposCD).forEach(function(bodyField) {
            if (bodyField == 'custrecord_rsc_perc_cessao_direito' || bodyField == 'custrecord_rsc_perc_juros' || bodyField == 'custrecord_rsc_perc_multa') {
                const percValue = camposCD[bodyField].replace('%', '')
                log.audit('bodyField', percValue);
                if (percValue > 0) {
                    log.audit('percentual > 0', 'done')
                    perc_CD.setValue(bodyField, percValue);
                }                 
            } else {
                perc_CD.setValue(bodyField, camposCD[bodyField]);
            }            
        });

        arrayParcelas.forEach(function(recmachcustrecord, index) {
            perc_CD.selectLine('recmachcustrecord_rsc_transferencia_posse', index)

            .setCurrentSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_parcela_cessao', recmachcustrecord.custrecord_rsc_parcela_cessao)
            .setCurrentSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_vencimento_cessao', formatData(recmachcustrecord.custrecord_rsc_vencimento_cessao))
            .setCurrentSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_cliente_atual_cessao', recmachcustrecord.custrecord_rsc_cliente_atual_cessao)
            .setCurrentSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_novo_cliente_cessao', recmachcustrecord.custrecord_rsc_novo_cliente_cessao)
            .setCurrentSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_valor_cessao', recmachcustrecord.custrecord_rsc_valor_cessao)
            .setCurrentSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_atualizado', recmachcustrecord.custrecord_rsc_atualizado)

            .commitLine('recmachcustrecord_rsc_transferencia_posse');
        });

        jp.parse.novosProponentes.forEach(function(recmachcustrecord, index) {
            perc_CD.selectLine('recmachcustrecord_rsc_novos_proponentes', index)

            .setCurrentSublistValue('recmachcustrecord_rsc_novos_proponentes', 'custrecord_rsc_novo_proponente', lookupCustomer(recmachcustrecord.proponente))
            .setCurrentSublistValue('recmachcustrecord_rsc_novos_proponentes', 'custrecord_perc_part_proponente', recmachcustrecord.percParticipacao)            
            .setCurrentSublistValue('recmachcustrecord_rsc_novos_proponentes', 'custrecord_rsc_principal_proponente', recmachcustrecord.principal)

            .commitLine('recmachcustrecord_rsc_novos_proponentes');
        });

        const id_perc_CD = perc_CD.save({ignoreMandatoryFields: true});
        log.audit('% Cessão Direito', id_perc_CD);
        
        redirect.toRecord({
            type: 'customrecord_rsc_perc_cessao_direito',
            id: id_perc_CD,
        });
        // if (id_perc_CD) {
        //     id_cessao_direito.defaultValue = id_perc_CD;

        //     link_cessao_direito.linkText = 'Cessão Nº '+id_perc_CD;
        //     link_cessao_direito.defaultValue = url.resolveRecord({recordType: 'customrecord_rsc_perc_cessao_direito', recordId: id_perc_CD});            
        // }
    }
    
    return form;
}

const onRequest = (context) => {
    log.audit('onRequest', context);

    const request = context.request;
    const method = request.method;
    const response = context.response;
    const parameters = request.parameters;
    log.audit('request', request);
    log.audit('response', response);
    log.audit('parameters', parameters);

    const form = construtor(method, parameters);

    form.clientScriptModulePath = "./reparcelamento_cnab/rsc_fatura_cessao_direito_ct.js";

    response.writePage({
        pageObject: form
    });
}

return {
    onRequest: onRequest
}
});
