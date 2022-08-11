/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/task'], function(log, record, runtime, search, task) {
const atualizarReneg = (idReneg, idBoleto) => {
    log.audit('atualizarReneg', {idReneg: idReneg, idBoleto: idBoleto});

    const loadReg = record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: idReneg});

    try {
        loadReg.setValue('custrecord_rsc_boleto', idBoleto)
        loadReg.setValue('custrecord_rsc_status_aprovacao', 2)
        .save();
        return {status: 'Sucesso'}
    } catch(e) {
        log.error('Erro', {idReneg: idReneg, msg: e});
        return {status: 'error_update_reneg', msg: e}
    }
}

const gerarBoleto = (dados) => {
    log.audit('gerarBoleto', dados);

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

    var bscTabelaEfetivacao = search.create({type: "customrecord_rsc_tab_efetiva_reparcela",
        filters: [
           ["internalid","anyof",dados.idRenegociacao]
        ],
        columns: [
            "custrecord_rsc_data_renegociacao","custrecord_rsc_status_aprovacao","custrecord_rsc_contrato_fatura_principal","custrecord_rsc_cliente","custrecord_rsc_total_prestacoes_marcadas",
            "custrecord_rsc_unidade","custrecord_rsc_reparcelamento_2","custrecord_rsc_valor_financiado","custrecord_rsc_total_prestacoes_marcadas","custrecord_rsc_valor_total","custrecord_rsc_valor_da_entrada",
            "custrecord_rsc_vencimento_da_entrada","custrecord_rsc_tipo_renegociacao","custrecord_rsc_novo_valor","custrecord_rsc_novo_vencimento","custrecord_rsc_criador_ter"
        ]
    }).run().getRange(0,1);
    log.audit('bscTabelaEfetivacao', bscTabelaEfetivacao);

    const bsc_linhas_parcelas = search.create({type: "customrecord_rsc_sublista_tab_efetivacao",
        filters: [
           ["custrecord_rsc_resumo_reparcelamento","anyof",dados.idRenegociacao]
        ],
        columns: [
            "custrecord_rsc_tipo_parcela","custrecord_rsc_indice","custrecord_rsc_data_juros","custrecord_rsc_parcela","custrecord_rsc_prestacao","custrecord_rsc_juros_price","custrecord_rsc_valor_amortizar",
            "custrecord_rsc_pro_rata_am","custrecord_rsc_multa_reneg","custrecord_rsc_juros_reneg","custrecord_rsc_espelho"
        ]
    }).run().getRange(0,1000);
    log.audit('bsc_linhas_parcelas', bsc_linhas_parcelas);

    const bsc_linhasResumo = search.create({type: "customrecord_rsc_sublista_resumo",
        filters: [
            ["custrecord_rsc_resumo","anyof",dados.idRenegociacao]
        ],
        columns: [
            "custrecord_rsc_parcela_contrato","custrecord_rsc_indice_atualizacao","custrecord_rsc_vencimento_parcela","custrecord_rsc_valor_parcela","custrecord_rsc_multa_parcela","custrecord_rsc_juros_parcela","custrecord_rsc_prorata",
            "custrecord_rsc_valor_atualizado_parcela"
        ]
    }).run().getRange(0,1000);
    log.audit('bsc_linhasResumo', bsc_linhasResumo);

    const contrato = bscTabelaEfetivacao[0].getValue('custrecord_rsc_contrato_fatura_principal');

    var novoVencimento;

    if (bscTabelaEfetivacao[0].getValue('custrecord_rsc_novo_vencimento')) {
        novoVencimento = bscTabelaEfetivacao[0].getValue('custrecord_rsc_novo_vencimento').split('/');
    } else {
        novoVencimento = bscTabelaEfetivacao[0].getValue('custrecord_rsc_vencimento_da_entrada').split('/');
    }

    var lookupContrato = search.lookupFields({type: 'salesorder',
        id: contrato,
        columns: ['entity','subsidiary','location']
    })

    var arrayFI = {        
        valor: 0,
        multa: 0,
        juros: 0,
        proRata: 0,
        jurosPrice: 0,
        valorAtualizado: 0,
        ids: [],
    }

    var arrayReparcelamento = [];
    for (i=0; i<bsc_linhasResumo.length; i++) {
        arrayReparcelamento.push({
            parcela_contrato: bsc_linhasResumo[i].getValue('custrecord_rsc_parcela_contrato')
        });
    }
    log.audit('arrayReparcelamento', arrayReparcelamento);

    arrayReparcelamento.forEach(function(reparcelamento, index) {
        log.audit(index+1, reparcelamento);

        /************************* TODO *************************/
        var bsc_memorando_credito = search.create({type: "creditmemo",
            filters: [
                ["shipping","is","F"], "AND", 
                ["taxline","is","F"], "AND", 
                ["mainline","is","T"], "AND", 
                ["type","anyof","CustCred"], "AND", 
                ["custbody_rsc_id_parcelas","contains",reparcelamento.parcela_contrato], "AND",
                ["custbody_rsc_ref_contrato","anyof",contrato] 
            ],
            columns: [
                "datecreated","internalid","tranid","custbody_rsc_id_parcelas","custbody_rsc_ref_contrato","total"
            ]
        });

        var memorandos_baixa = bsc_memorando_credito.runPaged().count;
        log.audit('memorandos_baixa', memorandos_baixa);
        /************************* TODO *************************
         * COMO CANCELAR CORRETAMENTE OS MEMORANDOS DE CRÉDITO? */

        arrayFI.ids.push(reparcelamento.parcela_contrato);
    });
    log.audit('arrayFI após arrayReparcelamento', arrayFI);

    const tipoRenegociacao = bscTabelaEfetivacao[0].getValue('custrecord_rsc_tipo_renegociacao');

    var itemObject;

    const unidadeCorrecao = (idUC) => {
        log.audit('unidadeCorrecao', idUC);
        
        var lkpUC = search.lookupFields({type: 'customrecord_rsc_correction_unit',
            id: idUC,
            columns: ['name','custrecord_rsc_ucr_calc_base_item']
        });
        log.audit('lkpUC', lkpUC);

        return lkpUC.custrecord_rsc_ucr_calc_base_item[0].value;
    } 

    if (tipoRenegociacao == 1 || tipoRenegociacao == 5) { // Amortização/Antecipação
        // Novo Fluxo de Pagamentos ("custrecord_rsc_resumo_reparcelamento")
        for (i=0; i<bsc_linhas_parcelas.length; i++) {
            var espelho = bsc_linhas_parcelas[i].getValue('custrecord_rsc_espelho');
            if (espelho == false) {
                arrayFI.valor = parseFloat(arrayFI.valor) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_prestacao'));
                arrayFI.valorAtualizado = parseFloat(arrayFI.valorAtualizado) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_prestacao'));
            }            
        }        
        // Parcelas Selecionadas ("custrecord_rsc_resumo")
        for (i=0; i<bsc_linhasResumo.length; i++) {
            arrayFI.proRata = parseFloat(arrayFI.proRata) + parseFloat(bsc_linhasResumo[i].getValue('custrecord_rsc_prorata'));
        }
        log.audit('arrayFI', arrayFI);

        var itemObject = [];

        itemObject.push({
            item: itensAdicionais.item.FRACAO_PRINCIPAL, // FRAÇÃO DO PRINCIPAL
            quantity: itensAdicionais.quantity,
            rate: arrayFI.valor - arrayFI.proRata,
            amount: arrayFI.valor - arrayFI.proRata
        });

        if (arrayFI.proRata > 0) {
            var indice = bsc_linhas_parcelas[0].getValue('custrecord_rsc_indice');

            switch(indice) {
                case '1': item = itensAdicionais.item.FRACAO_PRINCIPAL; break;
                case '2': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCC); break;
                case '3': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_M); break;
                case '4': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
                case '5': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_P); break;
                case '6': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IPCA); break;
                case '7': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
            }

            itemObject.push({
                item: item,
                quantity: itensAdicionais.quantity,
                rate: arrayFI.proRata,
                amount: arrayFI.proRata
            });
        }
    } else if (tipoRenegociacao == 2 || tipoRenegociacao == 3) {
        log.audit('tipoRenegociacao', tipoRenegociacao);
        // Parcelas Selecionadas ("custrecord_rsc_resumo")
        for (i=0; i<bsc_linhasResumo.length; i++) {
            arrayFI.valorAtualizado = parseFloat(arrayFI.valorAtualizado) + parseFloat(bsc_linhasResumo[i].getValue('custrecord_rsc_valor_atualizado_parcela'));
        }
        // Novo Fluxo de Pagamentos ("custrecord_rsc_resumo_reparcelamento")
        for (i=0; i<bsc_linhas_parcelas.length; i++) {
            if (i==0) {
                arrayFI.valor = parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_prestacao')) - (parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_price')) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_multa_reneg')) + 
                parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_reneg')) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_pro_rata_am')));
                arrayFI.jurosPrice = parseFloat(arrayFI.jurosPrice) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_price'));
                arrayFI.multa = parseFloat(arrayFI.multa) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_multa_reneg'));
                arrayFI.juros = parseFloat(arrayFI.juros) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_reneg'));
                arrayFI.proRata = parseFloat(arrayFI.proRata) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_pro_rata_am'));
            }
        }
        log.audit('arrayFI', arrayFI);

        itemObject = [];
        var amount;

        itemObject.push({
            item: itensAdicionais.item.FRACAO_PRINCIPAL, // FRAÇÃO DO PRINCIPAL
            quantity: itensAdicionais.quantity,
            rate: arrayFI.valor,
            amount: arrayFI.valor
        });
        
        if (arrayFI.jurosPrice > 0) {
            itemObject.push({
                item: itensAdicionais.item.JUROS_A_INCORRER, // Juros à incorrer
                quantity: itensAdicionais.quantity,
                rate: arrayFI.jurosPrice,
                amount: arrayFI.jurosPrice
            });
        }

        if (arrayFI.multa > 0 || arrayFI.juros > 0) {
            amount = arrayFI.multa + arrayFI.juros;
            itemObject.push({
                item: itensAdicionais.item.ACRESCIMOS, // ACRÉSCIMO SOBRE FINANCIAMENTO
                quantity: itensAdicionais.quantity,
                rate: amount,
                amount: amount
            });
        }

        if (arrayFI.proRata > 0) {            
            var indice = bsc_linhas_parcelas[0].getValue('custrecord_rsc_indice');

            switch(indice) {
                case '1': item = itensAdicionais.item.FRACAO_PRINCIPAL; break;
                case '2': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCC); break;
                case '3': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_M); break;
                case '4': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
                case '5': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_P); break;
                case '6': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IPCA); break;
                case '7': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
            }                        

            itemObject.push({
                item: item,
                quantity: itensAdicionais.quantity,
                rate: arrayFI.proRata,
                amount: arrayFI.proRata
            });
        }
    } else { // Renegociação de Atrasos
        log.audit('tipoRenegociacao', tipoRenegociacao);
        // Parcelas Selecionadas ("custrecord_rsc_resumo")
        for (i=0; i<bsc_linhasResumo.length; i++) {
            arrayFI.valor = parseFloat(arrayFI.valor) + parseFloat(bsc_linhasResumo[i].getValue('custrecord_rsc_valor_parcela'));
            // arrayFI.multa = parseFloat(arrayFI.multa) + parseFloat(bsc_linhasResumo[i].getValue('custrecord_rsc_multa_parcela'));
            // arrayFI.juros = parseFloat(arrayFI.juros) + parseFloat(bsc_linhasResumo[i].getValue('custrecord_rsc_juros_parcela'));            
            // arrayFI.proRata = parseFloat(arrayFI.proRata) + parseFloat(bsc_linhasResumo[i].getValue('custrecord_rsc_prorata'));
            arrayFI.valorAtualizado = parseFloat(arrayFI.valorAtualizado) + parseFloat(bsc_linhasResumo[i].getValue('custrecord_rsc_valor_atualizado_parcela'));
        }
        // Novo Fluxo de Pagamentos ("custrecord_rsc_resumo_reparcelamento")
        for (i=0; i<bsc_linhas_parcelas.length; i++) {
            arrayFI.jurosPrice = parseFloat(arrayFI.jurosPrice) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_price'));
            arrayFI.multa = parseFloat(arrayFI.multa) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_multa_reneg'));
            arrayFI.juros = parseFloat(arrayFI.juros) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_juros_reneg'));
            arrayFI.proRata = parseFloat(arrayFI.proRata) + parseFloat(bsc_linhas_parcelas[i].getValue('custrecord_rsc_pro_rata_am'));
        }
        log.audit('arrayFI', arrayFI);

        itemObject = [];
        var amount;

        itemObject.push({
            item: itensAdicionais.item.FRACAO_PRINCIPAL, // FRAÇÃO DO PRINCIPAL
            quantity: itensAdicionais.quantity,
            rate: arrayFI.valor,
            amount: arrayFI.valor
        });

        if (arrayFI.jurosPrice > 0) {
            itemObject.push({
                item: itensAdicionais.item.JUROS_A_INCORRER, // Juros à incorrer
                quantity: itensAdicionais.quantity,
                rate: arrayFI.jurosPrice,
                amount: arrayFI.jurosPrice
            });
        }

        if (arrayFI.multa > 0 || arrayFI.juros > 0) {
            amount = arrayFI.multa + arrayFI.juros;
            itemObject.push({
                item: itensAdicionais.item.ACRESCIMOS, // ACRÉSCIMO SOBRE FINANCIAMENTO
                quantity: itensAdicionais.quantity,
                rate: amount,
                amount: amount
            });
        }

        if (arrayFI.proRata > 0) {            
            var indice = bsc_linhas_parcelas[0].getValue('custrecord_rsc_indice');

            switch(indice) {
                case '1': item = itensAdicionais.item.FRACAO_PRINCIPAL; break;
                case '2': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCC); break;
                case '3': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_M); break;
                case '4': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
                case '5': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_P); break;
                case '6': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IPCA); break;
                case '7': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
            }                      

            itemObject.push({
                item: item,
                quantity: itensAdicionais.quantity,
                rate: arrayFI.proRata,
                amount: arrayFI.proRata
            });
        }
    }     

    var campos = {
        entity: lookupContrato.entity[0].value,
        memo: 'Boleto',
        subsidiary: lookupContrato.subsidiary[0].value,
        location: lookupContrato.location[0].value,
        custbody_rsc_id_parcelas: JSON.stringify(arrayFI),
        custbody_rsc_ref_contrato: contrato,
        custbody_rsc_numero_renegociacao: dados.idRenegociacao,        
        custbody_rsc_vencimento_boleto: new Date(novoVencimento[2], novoVencimento[1] - 1, novoVencimento[0]),
        items: itemObject
    }
    log.audit('campos', campos);

    const memoCredito = record.create({type: 'creditmemo', isDynamic: true});

    Object.keys(campos).forEach(function(bodyField) {
        memoCredito.setValue(bodyField, campos[bodyField]);
    });

    campos.items.forEach(function(ps) {
        var valuesToSet = {
            item: ps.item,
            quantity: ps.quantity,
            rate: ps.rate,
            amount: ps.amount
        }

        memoCredito.selectNewLine('item');

        Object.keys(valuesToSet).forEach(function(sublistField) {
            memoCredito.setCurrentSublistValue('item', sublistField, valuesToSet[sublistField]);
        });

        memoCredito.commitLine('item');
    });    

    try {
        const id_memo_credito = memoCredito.save({ignoreMandatoryFields: true});
        const no_memo_credito = search.lookupFields({type: 'creditmemo',
            id: id_memo_credito,
            columns: ['tranid']
        }).tranid;
        log.audit('Boleto gerado com sucesso', {id: id_memo_credito, no: no_memo_credito});

        // TE (Tabela de Efetivação)
        const atualizarTE = atualizarReneg(dados.idRenegociacao, id_memo_credito);

        if (atualizarTE.status == 'Sucesso') {
            return {
                status: 'Sucesso',
                id: id_memo_credito,
                no: no_memo_credito
            }
        } else {
            return {
                status: atualizarTE.status, 
                id: id_memo_credito,
                no: no_memo_credito
            }
        }        
    } catch(e) {
        log.audit('Erro gerarBoleto', {contrato: dados.idFaturaPrincipal, msg: e});
        return {
            status: 'Erro', 
            contrato: dados.idFaturaPrincipal,
            msg: e
        }
    }
}

const onRequest = (context) => {
    log.audit('onRequest', context);

    const request = context.request;

    const response = context.response;
    
    const parameters = request.body;
    log.audit('parameters', parameters);

    const tarefa = JSON.parse(context.request.body).tarefa;
    log.audit('tarefa', tarefa);

    if (request.method == 'POST') {
        if (tarefa == 'boleto') {
            // var status = task.checkStatus(parameters.tarefa);
            // log.audit('status', status);

            const boleto = gerarBoleto(JSON.parse(context.request.body));

            response.write({
                output: JSON.stringify(boleto)
            });
        } else {
            log.audit(request.method, context);
            
            var taskReparcelamento = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_rsc_fatura_reparcela_2_mr',
                deploymentId: 'customdeploy_rsc_fatura_reparcela_2_mr',
                params: {
                    custscript_rsc_json_reparcelamento: parameters
                }
            });
    
            var taskReparcelamentoId = taskReparcelamento.submit();
            log.audit('taskReparcelamentoId', taskReparcelamentoId);   
            
            // return taskReparcelamentoId;
            response.write(taskReparcelamentoId);
        }        
    }
}

return {
    onRequest: onRequest
}
});
