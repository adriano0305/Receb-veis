/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
*/

const custPage = 'custpage_rsc_';
const ZERO = Number('0').toFixed(2);

define(['N/file', 'N/log', 'N/query', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url'], function(file, log, query, record, redirect, runtime, search, serverWidget, url) {
const baixaManual = (dados) => {
    log.audit('baixaManual', dados);

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

    var loadReg = record.load({type: 'invoice', id: dados.idParcela, isDynamic: true});

    try {
        var arrayBaixaManual = [];
        
        // JUROS PRICE
        if (dados.jurosPrice > 0) {
            arrayBaixaManual.push({
                item: itensAdicionais.item.JUROS_INCORRIDOS,
                quantity: itensAdicionais.quantity,
                rate: dados.jurosPrice,
                amount: dados.jurosPrice
            });
        }

        // ACRÉSCIMO SOBRE FINANCIAMENTO
        if (dados.multa > 0 || dados.juros > 0) {
            var mj = parseFloat(dados.multa) + parseFloat(dados.juros);
            arrayBaixaManual.push({
                item: itensAdicionais.item.ACRESCIMOS,
                quantity: itensAdicionais.quantity,
                rate: mj,
                amount: mj
            });
        } 

        // PRO RATA
        if (dados.proRata > 0) {
            var indice = loadReg.getValue('custbody_rsc_indice');

            var item;

            switch(indice) {
                case '1': item = itensAdicionais.item.FRACAO_PRINCIPAL; break;
                case '2': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCC); break;
                case '3': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_M); break;
                case '4': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
                case '5': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_P); break;
                case '6': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IPCA); break;
                case '7': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
            }

            arrayBaixaManual.push({
                item: item,
                quantity: itensAdicionais.quantity,
                rate: dados.proRata,
                amount: dados.proRata
            });
        }     
    
        arrayBaixaManual.forEach(function(baixaManual, linha) {
            loadReg.selectNewLine('item')
            .setCurrentSublistValue('item', 'item', baixaManual.item)
            .setCurrentSublistValue('item', 'quantity', baixaManual.quantity)
            .setCurrentSublistValue('item', 'rate', baixaManual.rate)
            .setCurrentSublistValue('item', 'amount', baixaManual.amount)
            .commitLine('item');
        });

        loadReg.setValue('custbody_rsc_pago', 1)
        .save({ignoreMandatoryFields: true});
        log.audit('baixaManual', {status: 'Sucesso'});

        return {
            status: 'Sucesso',
            total_parcela_atualizada: search.lookupFields({type: 'invoice',
                id: dados.idParcela,
                columns: ['total']            
            }).total
        }
    } catch(e) {
        log.error('Erro baixaManual', e);

        return {
            status: 'Erro'
        }
    }
}

const construtor = (method, parameters) => {
    log.audit('construtor', {method: method, parameters: parameters});

    var form = serverWidget.createForm({
        title: 'Atualizar Parcela'
    });

    const dados_boleto_parcela = form.addFieldGroup({
        id: custPage+'dados_parcela',
        label: 'Dados Parcela'
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

    // Valores Adicionais
    var jurosPrice = form.addField({
        id: custPage+'juros_price',
        label: 'Juros Price',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'valores_adicionais'
    });

    jurosPrice.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.STARTROW
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

    var juros = form.addField({
        id: custPage+'juros',
        label: 'Juros',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'valores_adicionais'
    });

    juros.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.MIDROW
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

        // Valores Adicionais
        jurosPrice.defaultValue = multa.defaultValue = juros.defaultValue = proRata.defaultValue = ZERO;
    } else {
        form.addButton({
            id: custPage+'fechar',
            label: 'Fechar',
            functionName: 'fechar'
        });

        jurosPrice.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        
        multa.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        juros.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        proRata.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        
        parametros = parameters;

        var atualizarParcela = baixaManual({
            idParcela: parametros.custpage_rsc_id_parcela,
            jurosPrice: parametros.custpage_rsc_juros_price,
            multa: parametros.custpage_rsc_multa,
            juros: parametros.custpage_rsc_juros,
            proRata: parametros.custpage_rsc_pro_rata
        });

        // Dados Parcela
        idParcela.defaultValue = parametros.custpage_rsc_id_parcela;
        parcela.defaultValue = parametros.custpage_rsc_parcela;
        // totalParcela.defaultValue = parametros.custpage_rsc_total_parcela;
        totalParcela.defaultValue = atualizarParcela.total_parcela_atualizada;

        // Valores Adicionais
        jurosPrice.defaultValue = parametros.custpage_rsc_juros_price;
        multa.defaultValue = parametros.custpage_rsc_multa;
        juros.defaultValue = parametros.custpage_rsc_juros;
        proRata.defaultValue = parametros.custpage_rsc_pro_rata;
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

    form.clientScriptModulePath = "./reparcelamento_cnab/gaf_rec_popup_parcela_ar.js";

    response.writePage({
        pageObject: form
    });
}

return {
    onRequest: onRequest
};
});