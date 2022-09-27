/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
*/

const custPage = 'custpage_rsc_';
const ZERO = Number('0').toFixed(2);

const opcoes = {
    ignoreMandatoryFields: true,
    enableSourcing: true
}

define(['N/file', 'N/log', 'N/query', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url'], function(file, log, query, record, redirect, runtime, search, serverWidget, url) {
const pagamentoManual = (dados) => {
    log.audit('pagamentoManual', dados);

    var ambiente = runtime.envType;

    const itensAdicionais = {
        item: {
            FRACAO_PRINCIPAL: 28650,
            JUROS_INCORRIDOS: 28653,
            JUROS_A_INCORRER: 28654,
            ACRESCIMOS: 30694,
            JUROS_PRICE: 30695                   
        },
        unidadeCorrecao: {
            BRL: 1,
            INCC: 2,
            IGP_M: 3,
            INCP: 4,
            IGP_P: 5,
            IPCA: 6,
            INCP: 7
        },
        quantity: 1
    }
    
    const codigoImposto = {
        'UNDEF-BR': 5
    }

    const unidadeCorrecao = (idUC) => {
        log.audit('unidadeCorrecao', idUC);
        
        var lkpUC = search.lookupFields({type: 'customrecord_rsc_correction_unit',
            id: idUC,
            columns: ['name','custrecord_rsc_ucr_calc_base_item']
        });
        log.audit('lkpUC', lkpUC);

        return lkpUC.custrecord_rsc_ucr_calc_base_item[0].value;
    }

    var loadParcela = record.load({type: 'invoice', id: dados.idParcela, isDynamic: true});

    var cliente = loadParcela.getValue('entity');

    var linha_fracao_principal = loadParcela.findSublistLineWithValue('item', 'item', itensAdicionais.item.FRACAO_PRINCIPAL);

    if (linha_fracao_principal != -1) {
        loadParcela.selectLine('item', linha_fracao_principal)
        // .setCurrentSublistValue('item', 'rate', dados.principal)
        .setCurrentSublistValue('item', 'amount', dados.principal)
        .commitLine('item');
    }

    try {
        var array_pagamento_manual = [];
        
        // JUROS PRICE
        if (dados.jurosPrice > 0) {
            array_pagamento_manual.push({
                item: itensAdicionais.item.JUROS_INCORRIDOS,
                quantity: itensAdicionais.quantity,
                rate: dados.jurosPrice,
                amount: dados.jurosPrice
            });
        }

        // ACRÉSCIMO SOBRE FINANCIAMENTO
        if (dados.multa > 0 || dados.juros > 0) {
            var mj = parseFloat(dados.multa) + parseFloat(dados.juros);
            array_pagamento_manual.push({
                item: itensAdicionais.item.ACRESCIMOS,
                quantity: itensAdicionais.quantity,
                rate: mj,
                amount: mj
            });
        } 

        // PRO RATA
        if (dados.proRata > 0) {
            var indice = loadParcela.getValue('custbody_rsc_indice');
            var findItem;
            var find_amount_item = 0;
            var atualizacao_monetaria = dados.atualizacao_monetaria;
            var item;

            switch(indice) {
                case '1': 
                    item = itensAdicionais.item.FRACAO_PRINCIPAL;
                    findItem = loadParcela.findSublistLineWithValue('item', 'item', item);
                    if (findItem != -1) {
                        find_amount_item = loadParcela.getSublistValue('item', 'amount', findItem);
                        loadParcela.selectLine('item', findItem)
                        .setCurrentSublistValue('item', 'item', item)
                        .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                        .setCurrentSublistValue('item', 'rate', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .setCurrentSublistValue('item', 'amount', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .commitLine('item');
                    } else {
                        array_pagamento_manual.push({
                            item: item,
                            quantity: itensAdicionais.quantity,
                            rate: parseFloat(dados.proRata + atualizacao_monetaria),
                            amount: parseFloat(dados.proRata + atualizacao_monetaria)
                        });
                    }
                    log.audit({indice: indice, findItem: findItem}, {proRata: dados.proRata, atualizacao_monetaria: dados.atualizacao_monetaria, item: item, findItem: findItem, find_amount_item: find_amount_item});
                break;
                case '2': 
                    item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCC); 
                    findItem = loadParcela.findSublistLineWithValue('item', 'item', item);
                    if (findItem != -1) {
                        find_amount_item = loadParcela.getSublistValue('item', 'amount', findItem);
                        loadParcela.selectLine('item', findItem)
                        .setCurrentSublistValue('item', 'item', item)
                        .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                        .setCurrentSublistValue('item', 'rate', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .setCurrentSublistValue('item', 'amount', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .commitLine('item');
                    } else {
                        array_pagamento_manual.push({
                            item: item,
                            quantity: itensAdicionais.quantity,
                            rate: parseFloat(dados.proRata + atualizacao_monetaria),
                            amount: parseFloat(dados.proRata + atualizacao_monetaria)
                        });
                    }
                    log.audit({indice: indice, findItem: findItem}, {proRata: dados.proRata, atualizacao_monetaria: dados.atualizacao_monetaria, item: item, findItem: findItem, find_amount_item: find_amount_item});
                break;
                case '3': 
                    item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_M);
                    findItem = loadParcela.findSublistLineWithValue('item', 'item', item);
                    if (findItem != -1) {
                        find_amount_item = loadParcela.getSublistValue('item', 'amount', findItem);
                        loadParcela.selectLine('item', findItem)
                        .setCurrentSublistValue('item', 'item', item)
                        .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                        .setCurrentSublistValue('item', 'rate', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .setCurrentSublistValue('item', 'amount', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .commitLine('item');
                    } else {
                        array_pagamento_manual.push({
                            item: item,
                            quantity: itensAdicionais.quantity,
                            rate: parseFloat(dados.proRata + atualizacao_monetaria),
                            amount: parseFloat(dados.proRata + atualizacao_monetaria)
                        });
                    }
                    log.audit({indice: indice, findItem: findItem}, {proRata: dados.proRata, atualizacao_monetaria: dados.atualizacao_monetaria, item: item, findItem: findItem, find_amount_item: find_amount_item});
                break;
                case '4': 
                    item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); 
                    findItem = loadParcela.findSublistLineWithValue('item', 'item', item);
                    if (findItem != -1) {
                        find_amount_item = loadParcela.getSublistValue('item', 'amount', findItem);
                        loadParcela.selectLine('item', findItem)
                        .setCurrentSublistValue('item', 'item', item)
                        .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                        .setCurrentSublistValue('item', 'rate', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .setCurrentSublistValue('item', 'amount', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .commitLine('item');
                    } else {
                        array_pagamento_manual.push({
                            item: item,
                            quantity: itensAdicionais.quantity,
                            rate: parseFloat(dados.proRata + atualizacao_monetaria),
                            amount: parseFloat(dados.proRata + atualizacao_monetaria)
                        });
                    }
                    log.audit({indice: indice, findItem: findItem}, {proRata: dados.proRata, atualizacao_monetaria: dados.atualizacao_monetaria, item: item, findItem: findItem, find_amount_item: find_amount_item});
                break;
                case '5': 
                    item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_P);
                    findItem = loadParcela.findSublistLineWithValue('item', 'item', item);
                    if (findItem != -1) {
                        find_amount_item = loadParcela.getSublistValue('item', 'amount', findItem);
                        loadParcela.selectLine('item', findItem)
                        .setCurrentSublistValue('item', 'item', item)
                        .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                        .setCurrentSublistValue('item', 'rate', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .setCurrentSublistValue('item', 'amount', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .commitLine('item');
                    } else {
                        array_pagamento_manual.push({
                            item: item,
                            quantity: itensAdicionais.quantity,
                            rate: parseFloat(dados.proRata + atualizacao_monetaria),
                            amount: parseFloat(dados.proRata + atualizacao_monetaria)
                        });
                    }
                    log.audit({indice: indice, findItem: findItem}, {proRata: dados.proRata, atualizacao_monetaria: dados.atualizacao_monetaria, item: item, findItem: findItem, find_amount_item: find_amount_item});
                break;
                case '6': 
                    item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IPCA); 
                    findItem = loadParcela.findSublistLineWithValue('item', 'item', item);
                    if (findItem != -1) {
                        find_amount_item = loadParcela.getSublistValue('item', 'amount', findItem);
                        loadParcela.selectLine('item', findItem)
                        .setCurrentSublistValue('item', 'item', item)
                        .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                        .setCurrentSublistValue('item', 'rate', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .setCurrentSublistValue('item', 'amount', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .commitLine('item');
                    } else {
                        array_pagamento_manual.push({
                            item: item,
                            quantity: itensAdicionais.quantity,
                            rate: parseFloat(dados.proRata + atualizacao_monetaria),
                            amount: parseFloat(dados.proRata + atualizacao_monetaria)
                        });
                    }
                    log.audit({indice: indice, findItem: findItem}, {proRata: dados.proRata, atualizacao_monetaria: dados.atualizacao_monetaria, item: item, findItem: findItem, find_amount_item: find_amount_item});
                break;
                case '7': 
                    item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP);
                    findItem = loadParcela.findSublistLineWithValue('item', 'item', item);
                    if (findItem != -1) {
                        find_amount_item = loadParcela.getSublistValue('item', 'amount', findItem);
                        loadParcela.selectLine('item', findItem)
                        .setCurrentSublistValue('item', 'item', item)
                        .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                        .setCurrentSublistValue('item', 'rate', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .setCurrentSublistValue('item', 'amount', parseFloat(dados.proRata + find_amount_item + atualizacao_monetaria))
                        .commitLine('item');
                    } else {
                        array_pagamento_manual.push({
                            item: item,
                            quantity: itensAdicionais.quantity,
                            rate: parseFloat(dados.proRata + atualizacao_monetaria),
                            amount: parseFloat(dados.proRata + atualizacao_monetaria)
                        });
                    }
                    log.audit({indice: indice, findItem: findItem}, {proRata: dados.proRata, atualizacao_monetaria: dados.atualizacao_monetaria, item: item, findItem: findItem, find_amount_item: find_amount_item});
                break;
            }
        }   
        
        log.audit('array_pagamento_manual', array_pagamento_manual);
    
        array_pagamento_manual.forEach(function(pagamentoManual, linha) {
            loadParcela.selectNewLine('item')
            .setCurrentSublistValue('item', 'item', pagamentoManual.item)
            .setCurrentSublistValue('item', 'quantity', pagamentoManual.quantity)
            .setCurrentSublistValue('item', 'rate', pagamentoManual.rate)
            .setCurrentSublistValue('item', 'amount', pagamentoManual.amount)
            .commitLine('item');
        });

        loadParcela.setValue('custbody_rsc_pago', 1)
        .save(opcoes);
        log.audit('pagamentoManual', {status: 'Sucesso'});

        if (dados.boleto) {
            record.delete({type: 'creditmemo', id: dados.boleto});
            log.audit('Boleto excluído!', dados.boleto);
        }

        // Criação do Pagamento
        var pagamentoCliente = record.transform({
            fromType: 'invoice',
            fromId: dados.idParcela,
            toType: 'customerpayment',
            // isDynamic: true
        });  
        log.audit('pagamentoCliente', pagamentoCliente);

        pagamentoCliente.setValue('account', dados.contaB)
        pagamentoCliente.setValue('memo', 'Renegociação: ' + dados.reneg)
        pagamentoCliente.setValue('custbody_rsc_id_url_transacao', dados.idparcela);

        var id_pagamento_cliente = pagamentoCliente.save(opcoes);
        log.audit('Pagamento gerado!', {parcela: dados.idparcela, pagamentoCliente: id_pagamento_cliente});
        
        // Atualização da Reneg
        if (dados.reneg) {
            record.submitFields({type: 'customrecord_rsc_tab_efetiva_reparcela',
                id: dados.reneg,
                values: {
                    custrecord_rsc_status_aprovacao: 4 // Implantado
                },
                options: opcoes                
            });
        }

        return {
            status: 'Sucesso',
            total_parcela_atualizada: search.lookupFields({type: 'invoice',
                id: dados.idParcela,
                columns: ['total']            
            }).total,
            pagamentoCliente: id_pagamento_cliente
        }
    } catch(e) {
        log.error('Erro pagamentoManual', e);

        return {
            status: 'Erro'
        }
    }
}

const construtor = (method, parameters) => {
    log.audit('construtor', {method: method, parameters: parameters});

    var form = serverWidget.createForm({
        title: 'Pagamento Manual'
    });

    const dados_parcela = form.addFieldGroup({
        id: custPage+'dados_parcela',
        label: 'Dados Parcela'
    });

    const dadosBancarios = form.addFieldGroup({
        id: custPage+'dados_bancarios',
        label: 'Dados Bancários'
    });

    const valoresAdicionais = form.addFieldGroup({
        id: custPage+'valores_adicionais',
        label: 'Valores Adicionais'
    });

    // Dados da Parcela
    var idParcela = form.addField({
        id: custPage+'id_parcela',
        label: 'ID Parcela',
        type: serverWidget.FieldType.INTEGER,
        container: custPage+'dados_parcela',
    });

    idParcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var parcela = form.addField({
        id: custPage+'parcela',
        label: 'Parcela',
        type: serverWidget.FieldType.INTEGER,
        container: custPage+'dados_parcela',
    });

    parcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    parcela.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.STARTROW
    });

    var totalParcela = form.addField({
        id: custPage+'total_parcela',
        label: 'Total Parcela',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'dados_parcela',
    });

    totalParcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });
    
    totalParcela.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.MIDROW
    });

    var reneg = form.addField({
        id: custPage+'reneg',
        label: 'Reneg',
        type: serverWidget.FieldType.TEXT,
        container: custPage+'dados_parcela',
    });

    reneg.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });
    
    reneg.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.MIDROW
    });

    var boleto = form.addField({
        id: custPage+'boleto',
        label: 'Boleto',
        type: serverWidget.FieldType.INTEGER,
        container: custPage+'dados_parcela',
    });

    boleto.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    boleto.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.MIDROW
    });

    // Dados Bancários
    var contaB = form.addField({
        id: custPage+'conta_b',
        label: 'Conta Banco',
        type: serverWidget.FieldType.SELECT,
        container: custPage+'dados_bancarios',
        source: 'account'
    });

    contaB.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });
    
    contaB.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.MIDROW
    });

    // Valores Adicionais
    var principal = form.addField({
        id: custPage+'principal',
        label: 'Principal',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'valores_adicionais'
    });

    principal.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.STARTROW
    });

    principal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var atualizacaoMonetaria = form.addField({
        id: custPage+'atualizacao_monetaria',
        label: 'Atualização Monetária',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'valores_adicionais'
    });

    atualizacaoMonetaria.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.MIDROW
    });

    atualizacaoMonetaria.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var multa = form.addField({
        id: custPage+'multa',
        label: 'Multa',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'valores_adicionais'
    });

    multa.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.MIDROW
    });

    multa.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var juros = form.addField({
        id: custPage+'juros',
        label: 'Juros',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'valores_adicionais'
    });

    juros.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.MIDROW
    });

    juros.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var proRata = form.addField({
        id: custPage+'pro_rata',
        label: 'Pro Rata',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'valores_adicionais'
    });

    proRata.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.ENDROW
    });    

    proRata.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var parametros;

    if (method == 'GET') {
        form.addSubmitButton({
            label: 'Salvar'
        });

        parametros = JSON.parse(parameters.dados);

        // Dados Parcela
        idParcela.defaultValue = parametros.id;
        parcela.defaultValue = parametros.tranid;
        totalParcela.defaultValue = parametros.total;
        reneg.defaultValue = parametros.reneg;
        boleto.defaultValue = parametros.boleto;

        // Dados Bancários
        contaB.defaultValue = parametros.contaB.value;       

        // Valores Adicionais
        principal.defaultValue = parametros.principal;
        atualizacaoMonetaria.defaultValue = parametros.atualizacaoMonetaria,
        multa.defaultValue = parametros.multa,
        juros.defaultValue = parametros.juros,
        proRata.defaultValue = parametros.proRata
    } else {
        log.audit(method, parameters);

        form.addButton({
            id: custPage+'fechar',
            label: 'Fechar',
            functionName: 'fechar'
        });
        
        parametros = parameters;

        var atualizarParcela = pagamentoManual({
            idParcela: parametros.custpage_rsc_id_parcela,
            reneg: parametros.custpage_rsc_reneg,
            boleto: parametros.custpage_rsc_boleto,
            principal: parametros.custpage_rsc_principal,
            atualizacaoMonetaria: parametros.custpage_rsc_atualizacao_monetaria,
            multa: parametros.custpage_rsc_multa,
            juros: parametros.custpage_rsc_juros,
            proRata: parametros.custpage_rsc_pro_rata,
            contaB: parametros.custpage_rsc_conta_b
        });

        // Dados Parcela
        idParcela.defaultValue = parametros.custpage_rsc_id_parcela;
        parcela.defaultValue = parametros.custpage_rsc_parcela;
        // totalParcela.defaultValue = parametros.custpage_rsc_total_parcela;
        totalParcela.defaultValue = atualizarParcela.total_parcela_atualizada;
        reneg.defaultValue = parametros.custpage_rsc_reneg;
        boleto.defaultValue = parametros.custpage_rsc_boleto;

        // Dados Bancários
        contaB.defaultValue = parametros.custpage_rsc_conta_b;

        // Valores Adicionais
        principal.defaultValue = parametros.custpage_rsc_principal;
        atualizacaoMonetaria.defaultValue = parametros.custpage_rsc_atualizacao_monetaria;
        multa.defaultValue = parametros.custpage_rsc_multa;
        juros.defaultValue = parametros.custpage_rsc_juros;
        proRata.defaultValue = parametros.custpage_rsc_pro_rata;

        if (atualizarParcela.pagamentoCliente) {
            log.audit('Status', 'Redirecionando para o pagamento (ID '+ atualizarParcela.pagamentoCliente + ').');
            redirect.toRecord({type: 'customerpayment', id: atualizarParcela.pagamentoCliente});
        }
    }

    return form;
}

function onRequest(context) {
    log.audit('onRequest', context);

    const request = context.request;
    const method = request.method;
    const response = context.response;
    const parameters = request.parameters;
    log.audit('request', request);
    log.audit('response', response);
    log.audit('parameters', parameters);

    const form = construtor(method, parameters);

    form.clientScriptModulePath = "./reparcelamento_cnab/gaf_rec_popup_baixa_manual_ar.js";

    response.writePage({
        pageObject: form
    });
}

return {
    onRequest: onRequest
};
});