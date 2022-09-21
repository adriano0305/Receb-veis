/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/

const ZERO = Number('0').toFixed(2);

const opcoes = {
    enableSoucing: true,
    ignoreMandatoryFields: true
}

define(['N/https', 'N/log', 'N/record', 'N/search', 'N/url'], (https, log, record, search, url) => {
const formatData = (data) => {
    var partesData = data.split("/");

    var novaData = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    return novaData;
}

const gerarReparcelamento2 = (campos) => {
    log.audit('gerarReparcelamento2', campos);

    const reparcelamento2 = record.create({type: 'customrecord_rsc_reparcelamento_2', isDynamic: true});
    
    Object.keys(campos).forEach(function(bodyField) {
        if (bodyField != 'resumo') {
            switch(bodyField) {
                case 'custrecord_rsc_vencimento_entrada': 
                    reparcelamento2.setValue({
                        fieldId: bodyField, 
                        value: formatData(campos[bodyField])
                    });
                break;

                default: 
                reparcelamento2.setValue({
                    fieldId: bodyField, 
                    value: campos[bodyField]
                });
            }
        }        
    });

    const reparcelamento2Id = reparcelamento2.save();
    log.audit('reparcelamento2Id', reparcelamento2Id);

    if (reparcelamento2Id) {
        campos.resumo.forEach(function (parcela) {
            const loadFinanciamentoInvoice = record.load({
                type: 'invoice',
                id: parcela.parcela_contrato
            });
            log.audit('Parcela Nº: '+loadFinanciamentoInvoice.getValue('tranid'), 'Atualizando reparcelamento destino...');

            loadFinanciamentoInvoice.setValue({
                fieldId: 'custbody_rsc_reparcelamento_destino',
                value: reparcelamento2Id
            });

            loadFinanciamentoInvoice.save({ignoreMandatoryFields: true});
        });

        return reparcelamento2Id;
    } else {
        return null;
    }
}

const validarVencimento = (dataReneg, hoje) => {
    const partesReneg = dataReneg.split("/");

    var vencimentoReneg = new Date(partesReneg[2], partesReneg[1] - 1, partesReneg[0]);

    var diaReneg = vencimentoReneg.getDate();
    var mesReneg = vencimentoReneg.getMonth()+1;
    var anoReneg = vencimentoReneg.getFullYear();

    var diaHJ = hoje.getDate();
    var mesHJ = hoje.getMonth()+1;
    var anoHJ = hoje.getFullYear();

    if ((anoReneg < anoHJ) || (anoReneg == anoHJ && mesReneg < mesHJ)) {
        return {
            status: true,
            mesReneg: mesReneg
        }
    }

    return {
        status: false
    }
}

const implantarReneg = (idReneg, idBoleto) => {
    log.audit('aprovarReneg', {idReneg: idReneg, idBoleto: idBoleto});
    
    var bscTabelaEfetivacao = search.create({type: "customrecord_rsc_tab_efetiva_reparcela",
        filters: [
            ["internalid","anyof",idReneg]
        ],
        columns: [
            "custrecord_rsc_data_renegociacao","custrecord_rsc_status_aprovacao","custrecord_rsc_contrato_fatura_principal","custrecord_rsc_cliente","custrecord_rsc_total_prestacoes_marcadas",
            "custrecord_rsc_unidade","custrecord_rsc_reparcelamento_2","custrecord_rsc_valor_financiado","custrecord_rsc_total_prestacoes_marcadas","custrecord_rsc_valor_total","custrecord_rsc_valor_da_entrada",
            "custrecord_rsc_vencimento_da_entrada","custrecord_rsc_tipo_renegociacao","custrecord_rsc_novo_valor","custrecord_rsc_novo_vencimento","custrecord_rsc_criador_ter"
        ]
    }).run().getRange(0,1);
    log.audit('bscTabelaEfetivacao', bscTabelaEfetivacao);

    var parcelas = [];
    var resumo = [];

    const bsc_linhas_parcelas = search.create({type: "customrecord_rsc_sublista_tab_efetivacao",
        filters: [
           ["custrecord_rsc_resumo_reparcelamento","anyof",idReneg]
        ],
        columns: [
            "custrecord_rsc_tipo_parcela","custrecord_rsc_indice","custrecord_rsc_data_juros","custrecord_rsc_parcela","custrecord_rsc_prestacao","custrecord_rsc_juros_price","custrecord_rsc_valor_amortizar",
            "custrecord_rsc_pro_rata_am","custrecord_rsc_multa_reneg","custrecord_rsc_juros_reneg","custrecord_rsc_espelho"
        ]
    }).run().getRange(0,1000);

    if (bsc_linhas_parcelas.length > 0) {
        for (i=0; i<bsc_linhas_parcelas.length; i++) {
            if (validarVencimento(bsc_linhas_parcelas[i].getValue('custrecord_rsc_parcela'), new Date()).status == true) {
                log.audit('Aviso!', 'Implantação não permitida para parcelas vencidas.');
            }

            parcelas.push({
                tipoParcela: bsc_linhas_parcelas[i].getValue('custrecord_rsc_tipo_parcela'),
                parcela: bsc_linhas_parcelas[i].getValue('custrecord_rsc_parcela'),
                indice: bsc_linhas_parcelas[i].getValue('custrecord_rsc_indice'),
                dataJuros: bsc_linhas_parcelas[i].getValue('custrecord_rsc_data_juros'),
                prestacao: bsc_linhas_parcelas[i].getValue('custrecord_rsc_prestacao'),
                jurosPrice: bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_price') > 0 ? bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_price') : ZERO,
                valorAmortizar: bsc_linhas_parcelas[i].getValue('custrecord_rsc_valor_amortizar') > 0 ? bsc_linhas_parcelas[i].getValue('custrecord_rsc_valor_amortizar') : ZERO,
                proRata: bsc_linhas_parcelas[i].getValue('custrecord_rsc_pro_rata_am') > 0 ? bsc_linhas_parcelas[i].getValue('custrecord_rsc_pro_rata_am') : ZERO,
                multa: bsc_linhas_parcelas[i].getValue('custrecord_rsc_multa_reneg') > 0 ? bsc_linhas_parcelas[i].getValue('custrecord_rsc_multa_reneg') : ZERO,
                juros: bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_reneg') > 0 ? bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_reneg') : ZERO,
                espelho: bsc_linhas_parcelas[i].getValue('custrecord_rsc_espelho') > 0 ? bsc_linhas_parcelas[i].getValue('custrecord_rsc_espelho') : ZERO,
                manual: false
            });
        }
    }

    const bsc_linhasResumo = search.create({type: "customrecord_rsc_sublista_resumo",
        filters: [
            ["custrecord_rsc_resumo","anyof",idReneg]
        ],
        columns: [
            "custrecord_rsc_parcela_contrato","custrecord_rsc_vencimento_parcela","custrecord_rsc_valor_parcela","custrecord_rsc_multa_parcela","custrecord_rsc_juros_parcela","custrecord_rsc_prorata",
            "custrecord_rsc_valor_atualizado_parcela"
        ]
    }).run().getRange(0,1000);

    if (bsc_linhasResumo.length > 0) {
        for (i=0; i<bsc_linhasResumo.length; i++) {
            resumo.push({
                parcela_contrato: bsc_linhasResumo[i].getValue('custrecord_rsc_parcela_contrato'),
                vencimentoParcela: bsc_linhasResumo[i].getValue('custrecord_rsc_vencimento_parcela'),
                valor: bsc_linhasResumo[i].getValue('custrecord_rsc_valor_parcela') > 0 ? bsc_linhasResumo[i].getValue('custrecord_rsc_valor_parcela') : ZERO,
                multa: bsc_linhasResumo[i].getValue('custrecord_rsc_multa_parcela') > 0 ? bsc_linhasResumo[i].getValue('custrecord_rsc_multa_parcela') : ZERO,
                juros: bsc_linhasResumo[i].getValue('custrecord_rsc_juros_parcela') > 0 ? bsc_linhasResumo[i].getValue('custrecord_rsc_juros_parcela') : ZERO,
                proRata: bsc_linhasResumo[i].getValue('custrecord_rsc_prorata') > 0 ? bsc_linhasResumo[i].getValue('custrecord_rsc_prorata') : ZERO
            });
        }
    }

    var json, response;

    json = {
        statusReneg: bscTabelaEfetivacao[0].getValue('custrecord_rsc_status_aprovacao'),
        idBoleto: idBoleto,
        tabelaEfetivacaoId: bscTabelaEfetivacao[0].id,
        recalcIndex: validarVencimento(bscTabelaEfetivacao[0].getValue('custrecord_rsc_data_renegociacao'), new Date()),
        contrato_fatura_principal: bscTabelaEfetivacao[0].getValue('custrecord_rsc_contrato_fatura_principal'),
        custrecord_rsc_tipo_renegociacao: bscTabelaEfetivacao[0].getValue('custrecord_rsc_tipo_renegociacao'),    
        custrecord_rsc_novo_valor: bscTabelaEfetivacao[0].getValue('custrecord_rsc_novo_valor'),
        custrecord_rsc_novo_vencimento: bscTabelaEfetivacao[0].getValue('custrecord_rsc_novo_vencimento'),
        reparcelamento2Id: gerarReparcelamento2({
            custrecord_rsc_total_financiado: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_financiado') || 0,
            custrecord_rsc_total_parcelas_marcadas: bscTabelaEfetivacao[0].getValue('custrecord_rsc_total_prestacoes_marcadas') || 0,
            custrecord_custo_total: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_total') || 0,
            custrecord_rsc_valor_entrada: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_da_entrada') || 0,
            custrecord_rsc_vencimento_entrada: bscTabelaEfetivacao[0].getValue('custrecord_rsc_vencimento_da_entrada') || parcelas[0].parcela,
            custrecord_rsc_fatura_principal: bscTabelaEfetivacao[0].getValue('custrecord_rsc_contrato_fatura_principal'),
            custrecord_rsc_enviado: true,
            custrecord_rsc_status: 1,
            resumo: resumo
        }),
        parcelas: parcelas,
        resumo: resumo        
    };
    log.audit('json', json);

    var urlExterna = url.resolveScript({
        scriptId: 'customscript_rsc_fatura_novas_parc_2_st',
        deploymentId: 'customdeploy_rsc_fatura_novas_parc_2_st',
        returnExternalUrl: true
    });
    log.audit('urlExterna', urlExterna);

    // Suitelet: RSC Fatura Novas Parcelas 2 ST
    response = https.post({
        url: urlExterna,
        body: JSON.stringify(json)
    });
    log.audit('response', {code: response.code, body: response.body});

    if (response.code == 200) {
        var loadReg = record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: bscTabelaEfetivacao[0].id});
        loadReg.setValue({fieldId: 'custrecord_rsc_reparcelamento_2', value: json.reparcelamento2Id})
        .save({ignoreMandatoryFields: true});
    } else {
        log.error('Erro', 'Houve um erro no envio da solicitação. Tente novamente.')
    }
}

const aplicarBoleto = (idBoleto) => {
    const loadReg = record.load({type: 'creditmemo', id: idBoleto});

    const numDoc = loadReg.getValue('tranid');

    const idParcelas = JSON.parse(loadReg.getValue('custbody_rsc_id_parcelas'));

    const ids = idParcelas.ids;

    const linhasAplicar = loadReg.getLineCount('apply');

    var parcelasAplicadas = {
        boleto: numDoc,
        parcelas: []
    }

    for (i=0; i<linhasAplicar; i++) {
        var aplicado = loadReg.getSublistValue('apply', 'apply', i);
        var doc = loadReg.getSublistValue('apply', 'doc', i);
        var refnum = loadReg.getSublistValue('apply', 'refnum', i);

        var explorer = ids.find(id => id === doc);
        if (explorer) {
            log.audit('Boleto: '+numDoc, {explorer: explorer});
            loadReg.setSublistValue('apply', 'apply', i, true);
            parcelasAplicadas.parcelas.push(refnum);
        }
    }

    try {
        loadReg.save({ignoreMandatoryFields: true});
        log.audit('Boleto aplicado!', parcelasAplicadas);
    } catch(e) {
        log.error('Erro aplicarBoleto', e);
    }
}

const atualizarRegistroPersonalizado = (idInterno) => {
    log.audit('atualizarRegistroPersonalizado', {idInterno: idInterno});

    const loadRP = record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: idInterno});

    var tipoRenegociacao = loadRP.getValue('custrecord_rsc_tipo_renegociacao');
    var total_recmachcustrecord_rsc_resumo = loadRP.getLineCount('recmachcustrecord_rsc_resumo');

    // Inadimplentes
    if (tipoRenegociacao == 4) {
        for (i=0; i<total_recmachcustrecord_rsc_resumo; i++) {
            var parcelaContrato = loadRP.getSublistValue('recmachcustrecord_rsc_resumo', 'custrecord_rsc_parcela_contrato', i);
            if (parcelaContrato) {
                var itensRemovidos = {
                    parcelaContrato: parcelaContrato,
                    itens: []
                }

                var loadPC = record.load({type: 'invoice', id: parcelaContrato, isDynamic: true});                

                for (n=loadPC.getLineCount('item')-1; n>=0; n--) {
                    loadPC.selectLine('item', n);
                    var item = loadPC.getCurrentSublistValue('item', 'item');

                    // INCC, IGP-M, INPC e ACRÉSCIMO SOBRE FINANCIAMENTO
                    if (item == 28651 || item == 28652 || item == 31347 || item == 30694) {
                        itensRemovidos.itens.push(item);
                        loadPC.removeLine('item', n);
                    }
                }

                if (itensRemovidos.itens.length > 0) {
                    log.audit('Itens removidos!', {reneg: idInterno, recmachcustrecord_rsc_resumo: i, itens: itensRemovidos});
                    loadPC.save(opcoes);
                }                
            }            
        }
        
        // Rejeitado
        loadRP.setValue('custrecord_rsc_status_aprovacao', 3) 
        .save(opcoes);
    }    
}

const beforeLoad = (context) => {}

const beforeSubmit = (context) => {
    log.audit('afterSubmit', context);

    const novoRegistro = context.newRecord;

    const tipo = context.type;

    if (tipo == 'delete') {
        var numeroRenegociacao = novoRegistro.getValue('custbody_rsc_numero_renegociacao');

        if (numeroRenegociacao) {
            atualizarRegistroPersonalizado(numeroRenegociacao);
        }
    }
}

const afterSubmit = (context) => {
    log.audit('afterSubmit', context);

    const novoRegistro = context.newRecord;

    const pago = novoRegistro.getValue('custbody_rsc_pago');
    const numeroRenegociacao = novoRegistro.getValue('custbody_rsc_numero_renegociacao');
    const status = novoRegistro.getValue('status');

    if (novoRegistro.id) {
        if (pago == 1 && (status == 'Em aberto' || status == 'Open')) {
            // aplicarBoleto(novoRegistro.id);
            implantarReneg(numeroRenegociacao, novoRegistro.id);
        }
    }
}

return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
}
});
