/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/file', 'N/https', 'N/log', 'N/search', 'N/record', 'N/runtime', 'N/transaction'], function(https, file, log, search, record, runtime, transaction) {
function atualizarReneg(idReneg, indiceReneg, idFI, novoBoleto) {
   log.audit('atualizarReneg', {idReneg: idReneg, indiceReneg: indiceReneg, idFI: idFI, novoBoleto: novoBoleto});

   const loadReneg = record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: idReneg});

   try {
        if (novoBoleto) {
            loadReneg.setValue('custrecord_rsc_boleto', novoBoleto);
        }    
        loadReneg.setSublistValue('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_nova_parcela', indiceReneg, idFI)
        .save({ignoreMandatoryFields: true});
   } catch(e) {
       log.error('Erro atualizarReneg', {idReneg: idReneg, indiceReneg: indiceReneg, idFI: idFI, novoBoleto: novoBoleto, msg: e});
   }   
}

function baixarTransacao(idTrans, tipo) {
    log.audit('baixarTransacao', {idTrans: idTrans, tipo: tipo});

    var voidTransaction;

    try {  
        log.audit('Anulando transação', idTrans);
        voidTransaction = transaction.void({type: tipo, id: idTrans});
        log.audit('voidTransaction', voidTransaction);
    } catch(e) {
        log.error('Erro baixarBoleto', e);
        if (e.name == 'RCRD_HAS_BEEN_CHANGED') {
            log.error('Retentativa baixarBoleto', {idTrans: idTrans, tipo: tipo});
            voidTransaction = transaction.void({type: tipo, id: idTrans});
        }
    }
}

function gerarBoleto(idBoleto) {
    log.audit('gerarBoleto', idBoleto);
    
    const loadReg = record.copy({type: 'creditmemo', id: idBoleto, isDynamic: true});

    try {
        const idBoleto = loadReg.save({ignoreMandatoryFields: true});
        log.audit('idBoleto', idBoleto);

        return {
            status: 'Sucesso', 
            idBoleto: idBoleto
        }
    } catch(e) {
        log.error('Erro gerarBoleto', e);
        return {
            status: 'Erro', 
            msg: e
        }
    }  
}

function aplicarBoleto(idParcela, idBoleto) {
    log.audit('aplicarBoleto', {idParcela: idParcela, idBoleto: idBoleto});
    const loadReg = record.load({type: 'creditmemo', id: idBoleto});

    const numDoc = loadReg.getValue('tranid');

    const linhasAplicar = loadReg.getLineCount('apply');

    var parcelasAplicadas = {
        boleto: numDoc,
        parcelas: []
    }

    for (i=0; i<linhasAplicar; i++) {
        var aplicado = loadReg.getSublistValue('apply', 'apply', i);
        var doc = loadReg.getSublistValue('apply', 'doc', i);
        var refnum = loadReg.getSublistValue('apply', 'refnum', i);

        if (doc == idParcela) {
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

function memorandoCredito(idFI) {
    const lookupFI = search.lookupFields({type: 'invoice',
        id: idFI,
        columns: ['memo','subsidiary','department','location','custbody_rsc_nrdocboleto','custbody_rsc_nr_proposta','custbody_rsc_status_contrato','custbody_rsc_vlr_venda','custbody_rsc_ativo',
        'custbody_rsc_sist_amort','custbody_rsc_tran_unidade','custbody_rsc_finan_dateativacontrato','custbody_rsc_finan_indice_base_cont','total']
    });
    log.audit('lookupFI', lookupFI);

    const objMemoCredito = record.transform({
        fromType: 'invoice',
        fromId: idFI,
        toType: 'creditmemo',
        isDynamic: true
    });

    if (objMemoCredito) {           
        // Definindo Código de Imposto: UNDEF-BR
        for (i=0; i<objMemoCredito.getLineCount('item'); i++) {
            objMemoCredito.selectLine('item', i).
            setCurrentSublistValue('item', 'taxcode', 5)
            .commitLine('item');
        }   
    }

    // const memo = record.create({type: 'creditmemo', isDynamic: true});

    // var campos = {
    //     memo: lookupFI.memo,
    //     subsidiary: lookupFI.subsidiary[0].value,
    //     department: lookupFI.department[0].value,
    //     location: lookupFI.location[0].value,
    //     custbody_rsc_nrdocboleto: lookupFI.custbody_rsc_nrdocboleto,
    //     custbody_rsc_nr_proposta: lookupFI.custbody_rsc_nr_proposta,
    //     custbody_rsc_status_contrato: lookupFI.custbody_rsc_status_contrato[0].value,
    //     custbody_rsc_vlr_venda: lookupFI.custbody_rsc_vlr_venda,
    //     custbody_rsc_ativo: lookupFI.custbody_rsc_ativo,
    //     custbody_rsc_sist_amort: lookupFI.custbody_rsc_sist_amort,
    //     custbody_rsc_tran_unidade: lookupFI.custbody_rsc_tran_unidade[0].value,
    //     custbody_rsc_finan_dateativacontrato: lookupFI.custbody_rsc_finan_dateativacontrato,
    //     custbody_rsc_finan_indice_base_cont: lookupFI.custbody_rsc_finan_indice_base_cont,
    // }
    // log.audit('campos', campos);

    // Object.keys(campos).forEach(function(bodyField) {
    //     log.audit(bodyField, campos[bodyField]);
    //     memo.setValue(bodyField, campos[bodyField]);      
    // });
   
    // memo.selectLine('item', 0)
    // .setCurrentSublistValue('item', 'item', 19420)
    // .setCurrentSublistValue('item', 'quantity', 1)
    // .setCurrentSublistValue('item', 'rate', lookupFI.total)
    // .setCurrentSublistValue('item', 'amount', lookupFI.total)
    // .setCurrentSublistValue('item', 'taxcode', 5)
    // .commitLine('item');

    try {
        const id_memo_credito = objMemoCredito.save({enbleSourcing: true, ignoreMandatoryFields: true});
        log.audit('memorandoCredito', {idFI: idFI, id_memo_credito: id_memo_credito});
    
        return {
            status: 'Sucesso', 
            id_memo_credito: id_memo_credito
        }
    } catch(e) {
        log.error('memorandoCredito', {idFI: idFI, msg: e});
        return {
            status: 'Erro', 
            msg: e
        }
    }
}

function atualizarTabelaEfetivacao(loadReparcelamento2, tabelaEfetivacaoId) {    
    const status = loadReparcelamento2.getValue('custrecord_rsc_status');

    // if (status == 3 || status == 4) {
        record.submitFields({type: 'customrecord_rsc_tab_efetiva_reparcela',
            id: tabelaEfetivacaoId,
            values: {
                custrecord_rsc_status_aprovacao: 4,
                custrecord_rsc_data_implantacao_reneg: new Date()
            },
            options: {
                ignoreMandatoryFields : true
            }
        });
    // }
}

function ultimoDiaMes(mes2, ano) {
    var ultimoDia;

    var mes = mes2 > '9' ? mes2 : '0'+mes2;

    if (typeof(mes) == 'number') {
        mes = String(mes);
    }

    switch(mes) {
        case '01': ultimoDia = '31/'+mes+'/'+ano; break;
        case '02': ultimoDia = '28/'+mes+'/'+ano; break;
        case '03': ultimoDia = '31/'+mes+'/'+ano; break;
        case '04': ultimoDia = '30/'+mes+'/'+ano; break;
        case '05': ultimoDia = '31/'+mes+'/'+ano; break;
        case '06': ultimoDia = '30/'+mes+'/'+ano; break;
        case '07': ultimoDia = '31/'+mes+'/'+ano; break;
        case '08': ultimoDia = '31/'+mes+'/'+ano; break;
        case '09': ultimoDia = '30/'+mes+'/'+ano; break;
        case '10': ultimoDia = '31/'+mes+'/'+ano; break;
        case '11': ultimoDia = '30/'+mes+'/'+ano; break;
        case '12': ultimoDia = '31/'+mes+'/'+ano; break;
    }
 
    return ultimoDia;
}

function fatorCorrecao(mes, status) {
    var bsc_UnidadeCorrecao;

    if (status == 'anterior2') {
        const mes2 = mes - 2;
        const ano = new Date().getFullYear();

        var periodo =  {
            inicio: "01/"+(mes2 > 9 ? mes2 : '0'+mes2)+"/"+ano,
            fim: ultimoDiaMes(mes2, ano)
        }

        bsc_UnidadeCorrecao = search.create({type: "customrecord_rsc_correction_unit",
            filters: [
                ["internalid","anyof","1"], "AND",
                ["custrecord_rsc_hif_correction_unit.custrecord_rsc_hif_effective_date","within",periodo.inicio,periodo.fim]
            ],
            columns: [
                "internalid","name",
                search.createColumn({name: "custrecord_rsc_hif_factor_percent", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", label: "Fator atualizado data"}),
                search.createColumn({name: "custrecord_rsc_hif_effective_date", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", sort: search.Sort.ASC, label: "Data de vigência"})
            ]
        }).run().getRange(0,12);

        if (bsc_UnidadeCorrecao.length > 0) {
            for (i=0; i<bsc_UnidadeCorrecao.length; i++) {
                var fator_atualizado = Number(bsc_UnidadeCorrecao[i].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(2);
                var data_vigencia = bsc_UnidadeCorrecao[i].getValue({name: 'custrecord_rsc_hif_effective_date', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'});

                var split_dtV = data_vigencia.split('/');
                
                if (split_dtV[1] == mes2) {
                    return fator_atualizado
                }
            }        
        }
    } else if (status == 'anterior3') {
        const mes3 = mes - 3;
        const ANO = new Date().getFullYear();

        var periodo =  {
            inicio: "01/"+(mes3 > 9 ? mes3 : '0'+mes3)+"/"+ANO,
            fim: ultimoDiaMes(mes3, ANO)
        }

        bsc_UnidadeCorrecao = search.create({type: "customrecord_rsc_correction_unit",
            filters: [
                ["internalid","anyof","1"], "AND",
                ["custrecord_rsc_hif_correction_unit.custrecord_rsc_hif_effective_date","within",periodo.inicio,periodo.fim]
            ],
            columns: [
                "internalid","name",
                search.createColumn({name: "custrecord_rsc_hif_factor_percent", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", label: "Fator atualizado data"}),
                search.createColumn({name: "custrecord_rsc_hif_effective_date", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", sort: search.Sort.ASC, label: "Data de vigência"})
            ]
        }).run().getRange(0,1);

        if (bsc_UnidadeCorrecao.length > 0) {
            return Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(2);
        }
    } else {
        bsc_UnidadeCorrecao = search.create({type: "customrecord_rsc_correction_unit",
            filters: [
                ["internalid","anyof","1"], "AND",
                ["custrecord_rsc_hif_correction_unit.custrecord_rsc_hif_effective_date","within","thismonth"]
            ],
            columns: [
                "internalid","name",
                search.createColumn({name: "custrecord_rsc_hif_factor_percent", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", label: "Fator atualizado data"}),
                search.createColumn({name: "custrecord_rsc_hif_effective_date", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", sort: search.Sort.ASC, label: "Data de vigência"})
            ]
        }).run().getRange(0,1);

        if (bsc_UnidadeCorrecao.length > 0) {
            return Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(2) || 0;
        }
    }
}

function carregarBoleto(idBoleto) {
    log.audit('carregarBoleto', idBoleto);

    const loadReg = record.load({type: 'creditmemo', id: idBoleto});

    var items = [];

    for (i=0; i<loadReg.getLineCount('item'); i++) {
        items.push({
            item: loadReg.getSublistValue('item', 'item', i),
            quantity: loadReg.getSublistValue('item', 'quantity', i),
            rate: loadReg.getSublistValue('item', 'rate', i),
            amount: loadReg.getSublistValue('item', 'amount', i)
        });
    }

    return items;
}

function formatValue(stringValue) {
    stringValue = stringValue.trim();
    var result = stringValue.replace(/[^0-9]/g, '');
    if (/[,\.]\d{2}$/.test(stringValue)) {
        result = result.replace(/(\d{2})$/, '.$1');
    }
    return parseFloat(result);
}

function formatData(data) {
    var partesData = data.split("/");
    var novaData = new Date(partesData[2], partesData[1] - 1, partesData[0]);
    return novaData;
}

function summarize(summary) {
    var type = summary.toString();
    log.audit(type, 
        '"Uso Consumido:" '+summary.usage+
        ', "Número de Filas:" '+summary.concurrency+
        ', "Quantidade de Saídas:" '+summary.yields
    );
    var contents = '';
    summary.output.iterator().each(function (key, value) {
        contents += (key + ' ' + value + '\n');
        return true;
    });
}

function reduce(context) {
    log.audit('reduce', context);
}

function map(context) {
    log.audit('map', context);
}

function getInputData(context) {
    log.audit('getInputData', context); 

    const scriptAtual = runtime.getCurrentScript();

    var ambiente = runtime.envType;

    const parametro = JSON.parse(scriptAtual.getParameter({name: 'custscript_rsc_json_reparcelamento'}));
    
    const tabelaEfetivacaoId = parametro.tabelaEfetivacaoId;

    const contrato_fatura_principal = parametro.contrato_fatura_principal;

    const tipoRenegociacao = parametro.custrecord_rsc_tipo_renegociacao;

    const novasParcelas = parametro.parcelas;

    const resumo = parametro.resumo;

    var lkpFaturaPrincipal = search.lookupFields({type: 'salesorder',
        id: contrato_fatura_principal,
        columns: ['tranid','startdate','enddate','entity','location','subsidiary','custbody_rsc_projeto_obra_gasto_compra']
    });

    const obj_fatura_principal = {
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

    const unidadeCorrecao = (idUC) => {
        log.audit('unidadeCorrecao', idUC);
        
        var lkpUC = search.lookupFields({type: 'customrecord_rsc_correction_unit',
            id: idUC,
            columns: ['name','custrecord_rsc_ucr_calc_base_item']
        });
        log.audit('lkpUC', lkpUC);

        return lkpUC.custrecord_rsc_ucr_calc_base_item[0].value;
    } 

    var np = [];
    var erro;
    var loadReparcelamento2;
    log.audit(tipoRenegociacao, parametro);

    // Amortização, Inadimplentes e Adimplentes
    if (tipoRenegociacao == 1 || tipoRenegociacao == 2 || tipoRenegociacao == 3 || tipoRenegociacao == 4 || tipoRenegociacao == 5) {
        novasParcelas.forEach(function (parcela, indice) {
            const num = indice+1;

            var tp, parcelaId, loadParcela;

            const novaParcela = record.create({type: 'invoice'});

            // Informações Principais
            novaParcela.setValue('entity', lkpFaturaPrincipal.entity[0].value)
            .setValue('location', lkpFaturaPrincipal.location[0].value)
            .setValue('subsidiary', lkpFaturaPrincipal.subsidiary[0].value)
            .setValue('custbody_rsc_projeto_obra_gasto_compra', lkpFaturaPrincipal.custbody_rsc_projeto_obra_gasto_compra[0].value)
            .setValue('custbody_rsc_tipo_renegociacao', tipoRenegociacao)
            .setValue('approvalstatus', 2); // Aprovado

            if (lkpFaturaPrincipal.startdate) {
                novaParcela.setValue('startdate', formatData(lkpFaturaPrincipal.startdate));
            }

            if (lkpFaturaPrincipal.enddate) {
                novaParcela.setValue('enddate', formatData(lkpFaturaPrincipal.enddate));
            }   

            var splitParcela = parcela.parcela.split('/');                
            var entregarAte = new Date(splitParcela[2], splitParcela[1]-1, splitParcela[0]);

            novaParcela.setValue('duedate', entregarAte)
            .setValue('memo', parcela.tipoParcela == 'Ato' ? 'Ato' : (num)+'ª Parcela')
            .setValue('custbody_lrc_fatura_principal', contrato_fatura_principal)
            .setValue('custbody_rsc_reparcelamento_origem', parametro.reparcelamento2Id);

            // Contrato
            novaParcela.setValue('custbodyrsc_tpparc', parcela.tipoParcela || 4)
            .setValue('custbody_rsc_indice', parcela.indice);

            if (parcela.dataJuros) {
                novaParcela.setValue('custbody_rsc_data_juros', formatData(parcela.dataJuros));
            }
            
            if (parcela.espelho == false) {
                log.audit('Dados', num+'ª Parcela: '+JSON.stringify(parcela));                

                if (tipoRenegociacao == 1) {
                    tp = parcela.prestacao;

                    // Item: FRAÇÃO PRINCIPAL (19420)
                    novaParcela.setSublistValue('item', 'item', 0, obj_fatura_principal.item.FRACAO_PRINCIPAL)
                    .setSublistValue('item', 'quantity', 0, obj_fatura_principal.quantity)
                    .setSublistValue('item', 'rate', 0, formatValue(tp))
                    .setSublistValue('item', 'amount', 0, formatValue(tp));
                }

                if (tipoRenegociacao == 2) {
                    if (novasParcelas.length == 1) {
                        tp = carregarBoleto(parametro.idBoleto);
                        tp.forEach(function(ps, index) { 
                            novaParcela.setSublistValue('item', 'item', index, ps.item)
                            .setSublistValue('item', 'quantity', index, ps.quantity)
                            .setSublistValue('item', 'rate', index, ps.rate)
                            .setSublistValue( 'item', 'amount', index, ps.amount);                           
                        });
                    } else {                       
                        if (parcela.tipoParcela == 1) {
                            tp = carregarBoleto(parametro.idBoleto);
                            tp.forEach(function(ps, index) { 
                                novaParcela.setSublistValue('item', 'item', index, ps.item)
                                .setSublistValue('item', 'quantity', index, ps.quantity)
                                .setSublistValue('item', 'rate', index, ps.rate)
                                .setSublistValue( 'item', 'amount', index, ps.amount);                           
                            });
                        } else {
                            var arrayInadimplentes = [];

                            // FRAÇÃO DO PRINCIPAL
                            var fp = parseFloat(parcela.prestacao) - parseFloat(parcela.jurosPrice) - (parseFloat(parcela.proRata) + parseFloat(parcela.juros) + parseFloat(parcela.multa));
                            
                            arrayInadimplentes.push({
                                item: obj_fatura_principal.item.FRACAO_PRINCIPAL,
                                quantity: obj_fatura_principal.quantity,
                                rate: fp,
                                amount: fp
                            });
                            
                            if (parcela.jurosPrice > 0 || parcela.juros > 0 || parcela.multa > 0) {
                                var mj = parseFloat(parcela.jurosPrice) - (parseFloat(parcela.juros) + parseFloat(parcela.multa));

                                arrayInadimplentes.push({
                                    item: obj_fatura_principal.item.ACRESCIMOS, // ACRÉSCIMO SOBRE FINANCIAMENTO
                                    quantity: obj_fatura_principal.quantity,
                                    rate: Math.abs(mj),
                                    amount: Math.abs(mj)
                                });
                            }

                            // PRO RATA
                            if (parcela.proRata > 0) {
                                var amount = parseFloat(parcela.proRata); 
                                var item;

                                switch(parcela.indice) {
                                    case '1': item = obj_fatura_principal.item.FRACAO_PRINCIPAL; break;
                                    case '2': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.INCC); break;
                                    case '3': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.IGP_M); break;
                                    case '4': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.INCP); break;
                                    case '5': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.IGP_P); break;
                                    case '6': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.IPCA); break;
                                    case '7': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.INCP); break;
                                }

                                arrayInadimplentes.push({
                                    item: item,
                                    quantity: obj_fatura_principal.quantity,
                                    rate: amount,
                                    amount: amount
                                });
                            }
                        
                            arrayInadimplentes.forEach(function(inadimplencia, linha) {
                                novaParcela.setSublistValue('item', 'item', linha, inadimplencia.item)
                                .setSublistValue('item', 'quantity', linha, inadimplencia.quantity)
                                .setSublistValue('item', 'rate', linha, inadimplencia.rate)
                                .setSublistValue('item', 'amount', linha, inadimplencia.amount);
                            });
                        }
                    }                   
                }

                if (tipoRenegociacao == 3) {
                    if (novasParcelas.length == 1) {
                        tp = carregarBoleto(parametro.idBoleto);
                        tp.forEach(function(ps, index) { 
                            novaParcela.setSublistValue('item', 'item', index, ps.item)
                            .setSublistValue('item', 'quantity', index, ps.quantity)
                            .setSublistValue('item', 'rate', index, ps.rate)
                            .setSublistValue( 'item', 'amount', index, ps.amount);                           
                        });
                    } else { 
                        if (parcela.tipoParcela == 1) {
                            tp = carregarBoleto(parametro.idBoleto);
                            tp.forEach(function(ps, index) { 
                                novaParcela.setSublistValue('item', 'item', index, ps.item)
                                .setSublistValue('item', 'quantity', index, ps.quantity)
                                .setSublistValue('item', 'rate', index, ps.rate)
                                .setSublistValue( 'item', 'amount', index, ps.amount);                           
                            });
                        } else {                        
                            var arrayAdimplentes = [];

                            // FRAÇÃO DO PRINCIPAL
                            var fp = parseFloat(parcela.prestacao) - parseFloat(parcela.jurosPrice) - (parseFloat(parcela.proRata) + parseFloat(parcela.juros) + parseFloat(parcela.multa));
                            
                            arrayAdimplentes.push({
                                item: obj_fatura_principal.item.FRACAO_PRINCIPAL,
                                quantity: obj_fatura_principal.quantity,
                                rate: fp,
                                amount: fp
                            }); 
                            
                            if (parcela.jurosPrice > 0 || parcela.juros > 0 || parcela.multa > 0) {
                                var mj = parseFloat(parcela.jurosPrice) - (parseFloat(parcela.juros) + parseFloat(parcela.multa));

                                arrayAdimplentes.push({
                                    item: obj_fatura_principal.item.ACRESCIMOS, // ACRÉSCIMO SOBRE FINANCIAMENTO
                                    quantity: obj_fatura_principal.quantity,
                                    rate: Math.abs(mj),
                                    amount: Math.abs(mj)
                                });
                            }

                            // PRO RATA
                            if (parcela.proRata > 0) {
                                var amount = parseFloat(parcela.proRata); 
                                var item;

                                switch(parcela.indice) {
                                    case '1': item = obj_fatura_principal.item.FRACAO_PRINCIPAL; break;
                                    case '2': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.INCC); break;
                                    case '3': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.IGP_M); break;
                                    case '4': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.INCP); break;
                                    case '5': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.IGP_P); break;
                                    case '6': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.IPCA); break;
                                    case '7': item = unidadeCorrecao(obj_fatura_principal.unidadeCorrecao.INCP); break;
                                }

                                arrayAdimplentes.push({
                                    item: item,
                                    quantity: obj_fatura_principal.quantity,
                                    rate: amount,
                                    amount: amount
                                });
                            }

                            arrayAdimplentes.forEach(function(adimplencia, linha) {
                                novaParcela.setSublistValue('item', 'item', linha, adimplencia.item)
                                .setSublistValue('item', 'quantity', linha, adimplencia.quantity)
                                .setSublistValue('item', 'rate', linha, adimplencia.rate)
                                .setSublistValue('item', 'amount', linha, adimplencia.amount);
                            });
                        } 
                    }                  
                }

                if (tipoRenegociacao == 5 || tipoRenegociacao == 4) {   
                    tp = carregarBoleto(parametro.idBoleto);
                    tp.forEach(function(ps, index) { 
                        novaParcela.setSublistValue('item', 'item', index, ps.item)
                        .setSublistValue('item', 'quantity', index, ps.quantity)
                        .setSublistValue('item', 'rate', index, ps.rate)
                        .setSublistValue( 'item', 'amount', index, ps.amount);                           
                    });               
                }

                parcelaId = novaParcela.save({ignoreMandatoryFields: true});  
                    
                if (parcelaId) {
                    loadParcela = record.load({type: 'invoice', id: parcelaId});            
                    log.audit('Contrato: '+lkpFaturaPrincipal.tranid, num+'ª Parcela: '+loadParcela.getValue('tranid'));

                    if (tipoRenegociacao == 1) {
                        if ((parcela.tipoParcela == 1 || parcela.tipoParcela == 11) && parcela.manual == true) {
                            // var gb = gerarBoleto(parametro.idBoleto);
                            baixarTransacao(parametro.idBoleto, 'creditmemo');
                            atualizarReneg(parametro.tabelaEfetivacaoId, indice, parcelaId);

                            // if (gb.status == 'Sucesso') {
                                // aplicarBoleto(parcelaId, gb.idBoleto);
                                // baixarTransacao(parametro.idBoleto, 'creditmemo');
                                // Atualizando nova parcela na Reneg.                  
                                // atualizarReneg(parametro.tabelaEfetivacaoId, indice, parcelaId, gb.idBoleto);  
                            // }                            
                        } else {
                            // aplicarBoleto(parcelaId, parametro.idBoleto);
                            // Atualizando nova parcela na Reneg.                  
                            atualizarReneg(parametro.tabelaEfetivacaoId, indice, parcelaId, parametro.idBoleto); 
                        }
                    } else {
                        if (parcela.manual == false) {
                            if ((parcela.tipoParcela == 1 || parcela.tipoParcela == 11)) {
                                aplicarBoleto(parcelaId, parametro.idBoleto);                                
                            }
                        } else {
                            var status = search.lookupFields({type: 'creditmemo',
                                id: parametro.idBoleto,
                                columns: ['status']
                            }).status[0].text;
                            log.audit('status', status);
                            
                            if (status == 'Em aberto' || status == 'Open') {
                                baixarTransacao(parametro.idBoleto, 'creditmemo');
                            }
                            
                        }
                        // Atualizando nova parcela na Reneg.                  
                        atualizarReneg(parametro.tabelaEfetivacaoId, indice, parcelaId);                           
                    }                            
            
                    np.push({
                        duedate: parcela.parcela,
                        reparcela: {
                            id: parcelaId,
                            tranid: loadParcela.getValue('tranid')
                        }
                    });
                } 
            } else {
                if (tipoRenegociacao == 1) {
                    tp = parcela.prestacao;

                    // Item: FRAÇÃO PRINCIPAL
                    novaParcela.setSublistValue('item', 'item', 0, obj_fatura_principal.item.FRACAO_PRINCIPAL)
                    .setSublistValue('item', 'quantity', 0, obj_fatura_principal.quantity)
                    .setSublistValue('item', 'rate', 0, formatValue(tp))
                    .setSublistValue('item', 'amount', 0, formatValue(tp));
                    
                    parcelaId = novaParcela.save({ignoreMandatoryFields: true});  

                    if (parcelaId) {
                        loadParcela = record.load({type: 'invoice', id: parcelaId});            
                        log.audit('Contrato: '+lkpFaturaPrincipal.tranid, num+'ª Parcela: '+loadParcela.getValue('tranid'));

                        atualizarReneg(parametro.tabelaEfetivacaoId, indice, parcelaId, '');                           
                
                        np.push({
                            duedate: parcela.parcela,
                            reparcela: {
                                id: parcelaId,
                                tranid: loadParcela.getValue('tranid')
                            }
                        });
                    }
                }
            }
        });

        if (np.length > 0) {            
            log.audit('Novas Parcelas', np);
            loadReparcelamento2 = record.load({type: 'customrecord_rsc_reparcelamento_2', id: parametro.reparcelamento2Id, isDynamic: true});
            loadReparcelamento2.setValue('custrecord_rsc_status', np.length == novasParcelas.length ? 3 : 4);
            loadReparcelamento2.save();

            resumo.forEach(function (fi) {
                // const loadFI = record.load({type: 'invoice', id: fi.parcela_contrato});

                // if (tipoRenegociacao == 1) {
                //     loadFI.setValue('duedate', formatData(parametro.custrecord_rsc_novo_vencimento))
                //     .setValue('approvalstatus', 2)
                //     .setValue('custbody_rsc_amortizada', true)                   

                //     var saldo_amortizado = parseFloat(novasParcelas[1].prestacao) - parseFloat(fi.proRata);

                //     // Atualizando saldo da parcela anterior
                //     loadFI.setSublistValue('item', 'rate', 0, saldo_amortizado)
                //     .setSublistValue('item', 'amount', 0, saldo_amortizado);

                //     // Adicionando valor do PRO RATA (19605)
                //     loadFI.setSublistValue('item', 'item', 1, 19605)
                //     .setSublistValue('item', 'quantity', 1)
                //     .setSublistValue('item', 'rate', 1, parseFloat(fi.proRata))
                //     .setSublistValue('item', 'amount', 1, parseFloat(fi.proRata));   

                //     loadFI.save({ignoreMandatoryFields: true});    
                // } else {                        
                    baixarTransacao(fi.parcela_contrato, 'invoice');
                // }  
            });
            
            atualizarTabelaEfetivacao(loadReparcelamento2, tabelaEfetivacaoId);
        } else {
            loadReparcelamento2.setValue('custrecord_rsc_status', 2)
            .save();
        }
    } else { // Renegociação de atraso e Antecipação
        loadReparcelamento2 = record.load({type: 'customrecord_rsc_reparcelamento_2', id: parametro.reparcelamento2Id, isDynamic: true});

        loadReparcelamento2.setValue('custrecord_rsc_status', 3);

        resumo.forEach(function (fi) {
            aplicarBoleto(fi.parcela_contrato, parametro.idBoleto);    
        });

        atualizarTabelaEfetivacao(loadReparcelamento2, tabelaEfetivacaoId);
    } 
}

return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
}
});
