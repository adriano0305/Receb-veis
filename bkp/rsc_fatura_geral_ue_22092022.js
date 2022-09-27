/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

const custPage = 'custpage_rsc_';
const ZERO = Number('0').toFixed(2);

define(['N/file', 'N/https', 'N/log', 'N/query', 'N/record', 'N/runtime', 'N/url', 'N/search', 'N/task', 'N/ui/serverWidget'], (file, https, log, query, record, runtime, url, search, task, serverWidget) => {
const remold = (array) => {
    log.audit('remold', array);

    var arrayParcelas = [];

    for (var prop in array) {
        if (arrayParcelas.length > 0) {
            const result = arrayParcelas.find(parcela => parcela.ver === array[prop].ver);

            if (result) {
                log.audit('Finded!', result);
            } else {
                arrayParcelas.push({
                    ver: array[prop].ver,
                    reparcelamentoOrigem: array[prop].reparcelamentoOrigem,
                    reparcelamentoDestino: array[prop].reparcelamentoDestino,
                    parcela: array[prop].parcela,
                    prestacao: array[prop].prestacao,
                    tipoParcela: array[prop].tipoParcela,
                    valorOriginal: array[prop].valorOriginal,
                    multa: array[prop].multa,
                    juros: array[prop].juros,                    
                    valorAtualizado: array[prop].valorAtualizado,
                    dataPagamento: array[prop].dataPagamento,
                    valorPago: array[prop].valorPago, 
                    documento: array[prop].documento,
                    status: array[prop].status,
                    indice: array[prop].indice,
                });
            }
        } else {
            arrayParcelas.push({
                ver: array[prop].ver,
                reparcelamentoOrigem: array[prop].reparcelamentoOrigem,
                reparcelamentoDestino: array[prop].reparcelamentoDestino,
                parcela: array[prop].parcela,
                prestacao: array[prop].prestacao,
                tipoParcela: array[prop].tipoParcela,
                valorOriginal: array[prop].valorOriginal,
                multa: array[prop].multa,
                juros: array[prop].juros,                    
                valorAtualizado: array[prop].valorAtualizado,
                dataPagamento: array[prop].dataPagamento,
                valorPago: array[prop].valorPago,
                documento: array[prop].documento,
                status: array[prop].status,
                indice: array[prop].indice,
            });
        }
    }

    return arrayParcelas;
}

const localizarParcelas = (idFatura) => {
    var ambiente = runtime.envType;
    
    var arrayParcelas = [];
    const mes = Number ('30');

    var sql = "SELECT t.id, t.status, t.custbody_rsc_projeto_obra_gasto_compra, t.duedate, t.tranid, t.custbodyrsc_tpparc, t.custbody_rsc_tran_unidade, t.custbody_rsc_amortizada, t.custbody_rsc_data_pagamento, "+
    "t.custbody_rsc_reparcelamento_origem, t.custbody_rsc_reparcelamento_destino, t.foreigntotal, t.shipdate, t.closedate, t.foreignamountpaid, t.foreignamountunpaid, t.custbody_rsc_indice, "+
    "tl.item, tl.quantity, tl.rate, tl.foreignamount "+
    "FROM transaction as t "+
    "INNER JOIN transactionline AS tl ON (tl.transaction = t.id) "+
    "WHERE t.recordtype = 'invoice' "+
    "AND t.voided = 'F' "+
    "AND t.custbody_lrc_fatura_principal = ? "+
    // "AND tl.rate IS NOT NULL "+
    // "AND tl.item != 5 "+
    "ORDER BY t.duedate ASC";
    log.audit('sql', sql);

    var consulta = query.runSuiteQL({
        query: sql,
        params: [idFatura]
    });

    var sqlResults = consulta.asMappedResults();  

    var fileObj = file.create({
        name: 'arrayParcelas.txt',
        fileType: file.Type.PLAINTEXT,
        folder: 767, // SuiteScripts > teste > Arquivos
        // contents: JSON.stringify(arrayParcelas)
        contents: JSON.stringify(sqlResults)
    });

    var fileObjId = fileObj.save();   

    if (sqlResults.length > 0) {
        var lookupEmpreendimento, jurosAA, multa;

        if (sqlResults[0].custbody_rsc_projeto_obra_gasto_compra) {
            lookupEmpreendimento = search.lookupFields({type: 'job',
                id: sqlResults[0].custbody_rsc_projeto_obra_gasto_compra,
                columns: ['custentity_rsc_perc_cessao_direito','custentity_rsc_juros','custentity_rsc_multa','custentity_rsc_project_date_habite']
            });
            // log.audit('lookupEmpreendimento', lookupEmpreendimento);
            
            jurosAA = (lookupEmpreendimento.custentity_rsc_juros.replace('%','') / 100) || 0; // a.a
            multa = (lookupEmpreendimento.custentity_rsc_multa.replace('%','') / 100) || 0;   
        } else {
            jurosAA = 0; // a.a
            multa = 0;   
        }            

        const calcJuros = (total, delay, fees) => { 
            interestCalc = (fees / 360).toFixed(8);
            interestCalc = interestCalc * delay;
            interestCalc = interestCalc * total;            
            return interestCalc;
        }

        const pagamentos = (idFI) => {
            const valorPagamento = (idCP) => {
                var sql = "SELECT foreigntotal from TRANSACTION "+
                "WHERE recordtype = 'customerpayment' "+
                "AND id = ? ";

                var consulta = query.runSuiteQL({
                    query: sql,
                    params: [idCP]
                });
    
                var sqlResults = consulta.asMappedResults();

                return sqlResults
            }

            var sql = "SELECT linktype, nextdoc, previousdoc "+
            "FROM NextTransactionLink "+
            "WHERE previousdoc = ?";

            var consulta = query.runSuiteQL({
                query: sql,
                params: [idFI]
            });

            var sqlResults = consulta.asMappedResults();

            var memos = [];

            var arrayPagamentos = [];

            if (sqlResults.length > 0) {
                sqlResults = sqlResults.filter(function (dados) {
                    return !this[JSON.stringify(dados)] && (this[JSON.stringify(dados)] = true);
                }, Object.create(null));
                log.audit(idFI, sqlResults);

                sqlResults.forEach(function (result) {
                    if (result.linktype == 'SaleRet') {
                        memos.push(result.nextdoc);
                        arrayPagamentos.push(result);                        
                    } else {
                        arrayPagamentos.push(result);    
                    }
                });
                log.audit('idFI: '+idFI, {
                    memos: memos,
                    arrayPagamentos: arrayPagamentos
                });

                var valor_pagto_cliente = 0;

                if (memos.length > 0) {
                    for (m=0; m<memos; m++) {
                        for (var p in arrayPagamentos) {
                            if (arrayPagamentos[p].nextdoc == memos[m]) {
                                arrayPagamentos.splice(p, 1);
                            } 
                            // else {
                            //     log.audit('valor_pagto_cliente', valor_pagto_cliente);
                            //     // valor_pagto_cliente += valorPagamento(arrayPagamentos[p].nextdoc);
                            // }
                        }
                    }
                }
                // log.audit('valor_pagto_cliente', valor_pagto_cliente);
            }
        }

        const linhaTransacao = (id, item) => {
            var sql = "SELECT foreignamount FROM transactionline "+
            "WHERE transactionline.transaction = ? "+
            "AND transactionline.item = ? ";

            var consulta = query.runSuiteQL({
                query: sql,
                params: [id, item]
            });
        
            var sqlResults = consulta.asMappedResults();
            // log.audit('sqlResults', sqlResults);
            
            return sqlResults.length > 0 ? Math.abs(sqlResults[0].foreignamount) : ZERO;
        }

        const juros_e_acrescimos_moratorios = (id, sqlResults) => {
            // log.audit('juros_e_acrescimos_moratorios', {id: id, sqlResults: sqlResults});
            
            var ja = 0;
            var acrescimosMoratorios = 0;

            for (i=0; i<sqlResults.length; i++) { 
                if (sqlResults[i].id == id) {         
                    // Juros à incorrer e Acréscimos Moratórios
                    if (sqlResults[i].item == 28654 || sqlResults[i].item == 30694) {
                        // log.audit(sqlResults[i].id, {item: sqlResults[i].item, rate: sqlResults[i].rate});
                        ja = ja + sqlResults[i].rate;

                        if (sqlResults[i].item == 30694) {
                            acrescimosMoratorios = sqlResults[i].rate;
                        }                    
                    } 
                    // log.audit(sqlResults[i].id, {ja: ja, acrescimosMoratorios: acrescimosMoratorios});
                } 
            }

            return {ja: ja > 0 ? ja : 0, acrescimosMoratorios: acrescimosMoratorios > 0 ? acrescimosMoratorios : 0}
        }

        const totalOriginalParcelas = (id, allotments) => {
            log.audit('juros_e_acrescimos_moratorios', {id: id, allotments: allotments});
            
            const procV = allotments.find(allot => allot.id === id);
            log.audit('procV', procV);
            
            return procV ? procV.foreingamount : 0;
        }

        var arrayVO = [];

        /** O primeiro loop se faz necessário para preencher o valor original da parcela.
         * Item: FRAÇÃO PRINCIPAL 
         * Obs.: via query estava caindo na governança do Netsuite.
         * Mensagem do sistema: "SSS_USAGE_LIMIT_EXCEEDED: O limite de uso de execução de script foi ultrapassado"
         * */

        // for (var prop in sqlResults) { 
        //     if (sqlResults[prop].status !== 'V') {
        //         if (sqlResults[prop].item == 28650 || sqlResults[prop].item == 28627) {
        //             if (arrayVO.length == 0) {
        //                 arrayVO.push({
        //                     id: sqlResults[prop].id,
        //                     tranid: sqlResults[prop].tranid,
        //                     item: sqlResults[prop].item,
        //                     foreingamount: Math.abs(sqlResults[prop].foreignamount)
        //                 })
        //             } else {
        //                 const lock = arrayVO.find(installment => installment.id === sqlResults[prop].id);
        //                 if (!lock) {
        //                     arrayVO.push({
        //                         id: sqlResults[prop].id,
        //                         tranid: sqlResults[prop].tranid,
        //                         item: sqlResults[prop].item,
        //                         foreingamount: Math.abs(sqlResults[prop].foreignamount)
        //                     });
        //                 }
        //             }
        //         }
        //         // log.audit('arrayVO', arrayVO);          
        //     }
        // }

        for (var prop in sqlResults) { 
            if (sqlResults[prop].status !== 'V') {
                if (sqlResults[prop].item == 28650 || sqlResults[prop].item == 28651 || sqlResults[prop].item == 28652 || sqlResults[prop].item == 31346 || sqlResults[prop].item == 31347 || sqlResults[prop].item == 28627) {
                    if (arrayVO.length == 0) {
                        arrayVO.push({
                            id: sqlResults[prop].id,
                            tranid: sqlResults[prop].tranid,
                            item: sqlResults[prop].item,
                            foreingamount: Math.abs(sqlResults[prop].foreignamount)
                        })
                    } else {
                        const lock = arrayVO.find(installment => installment.id === sqlResults[prop].id);
                        if (!lock) {
                            arrayVO.push({
                                id: sqlResults[prop].id,
                                tranid: sqlResults[prop].tranid,
                                item: sqlResults[prop].item,
                                foreingamount: Math.abs(sqlResults[prop].foreignamount)
                            });
                        } else {
                            lock.foreingamount += Math.abs(sqlResults[prop].foreignamount)
                        }
                    }
                }
                // log.audit('arrayVO', arrayVO);          
            }
        }

        for (var prop in sqlResults) {
            if (sqlResults[prop].status !== 'V') {
                var parcelaVencida = validarVencimento(sqlResults[prop].duedate);

                var mj;
                if (parcelaVencida.status == true) {
                    mj = juros_e_acrescimos_moratorios(sqlResults[prop].id, sqlResults);
                } else {
                    mj = juros_e_acrescimos_moratorios(sqlResults[prop].id, sqlResults);
                }              

                var juros;
                if (sqlResults[prop].foreignamountpaid > 0) {
                    juros = parcelaVencida.status == true ? calcJuros((sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid), parcelaVencida.diasMora, jurosAA) : 0;
                } else {
                    juros = parcelaVencida.status == true ? calcJuros(sqlResults[prop].foreigntotal - mj.ja, parcelaVencida.diasMora, jurosAA) : 0;
                }

                var valorAtualizado;
                if (parcelaVencida.status == true) {
                    valorAtualizado = sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid;
                    valorAtualizado = (valorAtualizado + ((sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid) * multa)).toFixed(2);
                    valorAtualizado = parseFloat(valorAtualizado) + parseFloat(juros);
                }                 
            
                var status, vp;
            
                if (sqlResults[prop].foreignamountpaid == sqlResults[prop].foreigntotal) {
                    status = 'Pago';
                } else if ((sqlResults[prop].foreignamountpaid < sqlResults[prop].foreigntotal) || sqlResults[prop].foreignamountpaid == 0) {
                    if (sqlResults[prop].custbody_rsc_reparcelamento_destino) {
                        status = 'Aberto';
                        vp = sqlResults[prop].foreigntotal - sqlResults[prop].foreignamountpaid;
                    } else {
                        status = 'Aberto';
                        vp = sqlResults[prop].foreigntotal - sqlResults[prop].foreignamountpaid;
                    }
                }

                var amortizada = sqlResults[prop].custbody_rsc_amortizada;
                if (amortizada == 'T') {
                    if (sqlResults[prop].foreignamountpaid > 0) {
                        amortizada = 0;
                    } else {
                        amortizada = valorAtualizado || vp;
                    }
                    status = 'Aberto';
                } else {
                    amortizada = sqlResults[prop].foreignamountpaid;
                }

                var vo;
                if (status == 'Pago') {
                    calcMulta = juros = valorAtualizado = ZERO;
                    vp = sqlResults[prop].foreigntotal;

                    // O ID abaixo é do serviço "FRAÇÂO DO PRINCIPAL".
                    // vo = linhaTransacao(sqlResults[prop].id, 28650); 
                    vo = totalOriginalParcelas(sqlResults[prop].id, arrayVO);
                    vo = vo > 0 ? vo : sqlResults[prop].foreigntotal;
                } else {
                    calcMulta = (sqlResults[prop].foreignamountpaid > 0 && parcelaVencida.status == true) ? (sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid) * multa : 
                    (parcelaVencida.status == true ? (sqlResults[prop].foreigntotal - mj.ja) * multa : 0);

                    vo = sqlResults[prop].foreignamountunpaid;
                }

                if (arrayParcelas.length == 0) {
                    arrayParcelas.push({
                        ver: sqlResults[prop].id,
                        reparcelamentoOrigem: sqlResults[prop].custbody_rsc_reparcelamento_origem,
                        reparcelamentoDestino: sqlResults[prop].custbody_rsc_reparcelamento_destino,
                        parcela: sqlResults[prop].duedate,
                        prestacao: sqlResults[prop].foreigntotal,
                        tipoParcela: sqlResults[prop].custbodyrsc_tpparc,
                        valorOriginal: vo,
                        multa: calcMulta > 0 ? calcMulta : calcMulta,
                        juros: Number(juros).toFixed(2) || ZERO,
                        // valorAtualizado: status == 'Pago' ? 0 : (parcelaVencida.status == true ? valorAtualizado - juros_price_incorrer : vp - juros_price_incorrer),
                        valorAtualizado: status == 'Pago' ? 0 : (parcelaVencida.status == true ? (vo - mj.ja) + calcMulta + juros + mj.acrescimosMoratorios : (vp - mj.ja) + calcMulta + juros + mj.acrescimosMoratorios),
                        dataPagamento: sqlResults[prop].custbody_rsc_data_pagamento ? sqlResults[prop].custbody_rsc_data_pagamento : (sqlResults[prop].foreignamountpaid > 0 ? sqlResults[prop].closedate : null),
                        valorPago: amortizada,
                        documento: sqlResults[prop].tranid,
                        status: status,
                        indice: sqlResults[prop].custbody_rsc_indice
                    });
                } else {
                    const seek = arrayParcelas.find(parcela => parcela.ver === sqlResults[prop].id);

                    if (seek) {
                        seek.valorOriginal = vo;
                        seek.multa = calcMulta;
                        seek.juros = Number(juros).toFixed(2) || ZERO;
                        seek.valorAtualizado = status == 'Pago' ? 0 : (parcelaVencida.status == true ? (vo - mj.ja) + calcMulta + juros + mj.acrescimosMoratorios : (vp - mj.ja) + calcMulta + juros + mj.acrescimosMoratorios);
                    } else {
                        arrayParcelas.push({
                            ver: sqlResults[prop].id,
                            reparcelamentoOrigem: sqlResults[prop].custbody_rsc_reparcelamento_origem,
                            reparcelamentoDestino: sqlResults[prop].custbody_rsc_reparcelamento_destino,
                            parcela: sqlResults[prop].duedate,
                            prestacao: sqlResults[prop].foreigntotal,
                            tipoParcela: sqlResults[prop].custbodyrsc_tpparc,
                            valorOriginal: vo,
                            multa: calcMulta > 0 ? calcMulta : calcMulta,
                            juros: Number(juros).toFixed(2) || ZERO,
                            // valorAtualizado: status == 'Pago' ? 0 : (parcelaVencida.status == true ? valorAtualizado - juros_price_incorrer : vp - juros_price_incorrer),
                            valorAtualizado: status == 'Pago' ? 0 : (parcelaVencida.status == true ? (vo - mj.ja) + calcMulta + juros + mj.acrescimosMoratorios : (vp - mj.ja) + calcMulta + juros + mj.acrescimosMoratorios),
                            dataPagamento: sqlResults[prop].custbody_rsc_data_pagamento ? sqlResults[prop].custbody_rsc_data_pagamento : (sqlResults[prop].foreignamountpaid > 0 ? sqlResults[prop].closedate : null),
                            valorPago: amortizada,
                            documento: sqlResults[prop].tranid,
                            status: status,
                            indice: sqlResults[prop].custbody_rsc_indice
                        });
                    }
                }                 
            }
        }
    }

    arrayParcelas = arrayParcelas.filter(function (dados) {
        return !this[JSON.stringify(dados)] && (this[JSON.stringify(dados)] = true);
    }, Object.create(null));

    arrayParcelas = [...new Set(arrayParcelas)];

    var totalFinanciado = 0;

    arrayParcelas.forEach(function (dados) {
        totalFinanciado += Number(dados.prestacao);
    });

    // var fileObj = file.create({
    //     name: 'arrayParcelas.txt',
    //     fileType: file.Type.PLAINTEXT,
    //     folder: 704, // SuiteScripts > teste > Arquivos
    //     contents: JSON.stringify(arrayParcelas)
    // });

    // var fileObjId = fileObj.save();
    // log.audit('fileObjId: '+fileObjId, {totalFinanciado: totalFinanciado.toFixed(2), arrayParcelas: arrayParcelas});

    return {arrayParcelas: arrayParcelas, totalFinanciado: totalFinanciado.toFixed(2)};
}

const validarVencimento = (duedate) => {
    // log.audit('validarVencimento', duedate);

    const hoje = new Date();

    var diaHoje = hoje.getDate();
    var mesHoje = hoje.getMonth()+1;
    var anoHoje = hoje.getFullYear();

    var partesData = duedate.split("/");

    var vencimento = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    var diaVencimento = vencimento.getDate();
    var mesVencimento = vencimento.getMonth()+1;
    var anoVencimento = vencimento.getFullYear();

    if (hoje > vencimento) {
        var tempo = Math.abs(hoje.getTime() - vencimento.getTime());

        var diasMora = Math.ceil(tempo / (1000 * 3600 * 24));

        if ((diasMora-1) >= 1) {
            return {
                status: true, 
                diasMora: diasMora-1
            }
        }   
        
        return {
            status: false
        }
    } else {
        return {
            status: false
        }
    }
}

const validarVencimento2 = (shipdate, duedate) => {
    const partesShipdate = shipdate.split("/");

    var vencimentoShipdate = new Date(partesShipdate[2], partesShipdate[1] - 1, partesShipdate[0]);

    var diaShipdate = vencimentoShipdate.getDate();
    var mesShipdate = vencimentoShipdate.getMonth()+1;
    var anoShipdate = vencimentoShipdate.getFullYear();

    const partesDuedate = duedate.split("/");

    var vencimentoDuedate = new Date(partesDuedate[2], partesDuedate[1] - 1, partesDuedate[0]);

    var diaDuedate = vencimentoDuedate.getDate();
    var mesDuedate = vencimentoDuedate.getMonth()+1;
    var anoDuedate = vencimentoDuedate.getFullYear();
    log.audit('validarVencimento2', {
        shipdate: shipdate,
        duedate: duedate,
        vencimentoShipdate: vencimentoShipdate,
        vencimentoDuedate: vencimentoDuedate
    });

    if (vencimentoShipdate > vencimentoDuedate) {
        var tempo = Math.abs(vencimentoShipdate.getTime() - vencimentoDuedate.getTime());

        var diasMora = Math.ceil(tempo / (1000 * 3600 * 24));

        if ((diasMora-1) > 1) {
            return {
                status: true, 
                diasMora: diasMora
                // diasMora: diasMora-1
            }
        }   
        
        return {
            status: false
        }
    } 
    // else if (vencimentoDuedate > vencimentoShipdate) {
    //     var tempo = Math.abs(vencimentoDuedate.getTime() - vencimentoShipdate.getTime());

    //     var diasMora = Math.ceil(tempo / (1000 * 3600 * 24));

    //     if ((diasMora-1) > 1) {
    //         return {
    //             status: true, 
    //             diasMora: diasMora
    //             // diasMora: diasMora-1
    //         }
    //     }   
        
    //     return {
    //         status: false
    //     }
    // } 
    else {
        return {
            status: false
        }
    }
}

const sublista_fluxoPagamentos = (form, idFatura) => {
    // Guia Parcelamento do Contrato
    const guia_parcelamento_contrato = form.addTab({
        id: custPage+'guia_parcelas',
        label: 'Fluxo de pagamentos'
    });

    // Sublista Parcelas
    const sublistaParcelas = form.addSublist({
        id: custPage+'parcelas',
        type: 'list',
        label: 'Parcelas',
        // tab: 'custtab_116_5843489_622'
        tab: custPage+'guia_parcelas'
    });

    var numeroParcela = sublistaParcelas.addField({
        id: custPage+'numero_parcela',
        type: 'integer',
        label: '#'
    });

    var ver = sublistaParcelas.addField({
        id: custPage+'ver',
        type: 'text',
        label: 'Ver'
    });

    var vencimento = sublistaParcelas.addField({
        id: custPage+'vencimento',
        type: 'date',
        label: 'Vencimento'
    });

    var tipoParcela = sublistaParcelas.addField({
        id: custPage+'tipo_parcela',
        type: 'text',
        label: 'Tipo Parcela',
    });

    var indice = sublistaParcelas.addField({
        id: custPage+'indice',
        type: 'text',
        label: 'Índice',
        // source: 'customrecord_rsc_correction_unit'
    });
    
    var valorOriginal = sublistaParcelas.addField({
        id: custPage+'valor_original',
        type: 'currency',
        label: 'Valor'
    });

    var multa = sublistaParcelas.addField({
        id: custPage+'multa',
        type: 'currency',
        label: 'Multa'
    });

    var juros = sublistaParcelas.addField({
        id: custPage+'juros',
        type: 'float',
        // type: 'currency',
        label: 'Juros'
    });

    var valorAtualizado = sublistaParcelas.addField({
        id: custPage+'valor_atualizado',
        type: 'currency',
        label: 'Valor Atualizado'
    });

    var dataPagamento = sublistaParcelas.addField({
        id: custPage+'data_pagamento',
        type: 'date',
        label: 'Data Pagamento',
    });

    var valorPago = sublistaParcelas.addField({
        id: custPage+'valor_pago',
        type: 'currency',
        label: 'Valor Pago',
    });
    
    var status = sublistaParcelas.addField({
        id: custPage+'status',
        type: 'text',
        label: 'Status' // Aberto | Pago | Reparcelado | Atraso | Parcial
    });

    var prestacoes = localizarParcelas(idFatura);

    if (prestacoes.arrayParcelas.length > 0) {
        for (i=0; i<prestacoes.arrayParcelas.length; i++) { 
            sublistaParcelas.setSublistValue({
                id: ver.id,
                line: i,
                value: prestacoes.arrayParcelas[i].documento
            });

            sublistaParcelas.setSublistValue({
                id: numeroParcela.id, 
                line: i,
                value: i+1
            });

            sublistaParcelas.setSublistValue({
                id: vencimento.id, // Vencimento
                line: i,
                value: prestacoes.arrayParcelas[i].parcela
            });
            
            var lkpTipoParcela;
            
            if (prestacoes.arrayParcelas[i].tipoParcela) {
                lkpTipoParcela = search.lookupFields({
                    type: 'customrecord_rsc_tipo_parcela',
                    id: prestacoes.arrayParcelas[i].tipoParcela,
                    columns: 'name'
                });

                sublistaParcelas.setSublistValue({
                    id: tipoParcela.id,
                    line: i,
                    value: lkpTipoParcela.name
                });
            } 

            sublistaParcelas.setSublistValue({
                id: valorOriginal.id,
                line: i,
                value: prestacoes.arrayParcelas[i].valorOriginal
            });

            if (prestacoes.arrayParcelas[i].indice) {
                var lookupIndice = search.lookupFields({type: 'customrecord_rsc_correction_unit',
                    id: prestacoes.arrayParcelas[i].indice,
                    columns: ['name']
                });

                sublistaParcelas.setSublistValue({
                    id: indice.id,
                    line: i,
                    value: lookupIndice.name
                });
            }

            // var lookupIndice = search.lookupFields({type: 'customrecord_rsc_correction_unit',
            //     id: prestacoes.arrayParcelas[i].indice,
            //     columns: ['name']
            // });

            // sublistaParcelas.setSublistValue({
            //     id: indice.id,
            //     line: i,
            //     value: lookupIndice.name
            // }); 
            
            sublistaParcelas.setSublistValue({
                id: multa.id,
                line: i,
                value: prestacoes.arrayParcelas[i].multa
            });

            sublistaParcelas.setSublistValue({
                id: juros.id,
                line: i,
                value: prestacoes.arrayParcelas[i].juros
            });
            
            sublistaParcelas.setSublistValue({
                id: valorAtualizado.id,
                line: i,
                value: (prestacoes.arrayParcelas[i].status == 'Aberto' || prestacoes.arrayParcelas[i].status == 'Liquidado' || prestacoes.arrayParcelas[i].reparcelamentoDestino) ? Number(prestacoes.arrayParcelas[i].valorAtualizado).toFixed(2) : 0
            });

            sublistaParcelas.setSublistValue({
                id: dataPagamento.id,
                line: i,
                value: prestacoes.arrayParcelas[i].dataPagamento
            });

            sublistaParcelas.setSublistValue({
                id: valorPago.id,
                line: i,
                value: prestacoes.arrayParcelas[i].valorPago
            });

            sublistaParcelas.setSublistValue({
                id: status.id,
                line: i,
                value: prestacoes.arrayParcelas[i].status
            });
        }
    }
}

const sublista_proponentes = (form, idFatura) => {
    const buscarProponentes = (idContrato) => {
        var bscProp = search.create({type: "customrecord_rsc_finan_client_contrato",
            filters: [
               ["custrecord_rsc_fat_contrato","anyof",idContrato], "AND", 
               ["isinactive","is","F"]
            ],
            columns: [
                "id","custrecord_rsc_clientes_contratos","custrecord_rsc_pct_part","custrecord_rsc_fat_contrato","custrecord_rsc_principal"
            ]
        }).run().getRange(0,100);
        // log.audit('bscProp', bscProp);

        return bscProp;
    }
    // Guia Parcelamento do Contrato
    const guia_proponentes = form.addTab({
        id: custPage+'guia_proponentes',
        label: 'Proponentes'
    });

    // Sublista Parcelas
    const sublistaProp = form.addSublist({
        id: custPage+'proponentes',
        type: 'list',
        label: 'Proponentes',
        // tab: 'custtab_116_5843489_622'
        tab: custPage+'guia_proponentes',
    });

    var linhaProp = sublistaProp.addField({
        id: custPage+'linha_prop',
        type: 'integer',
        label: '#'
    });

    var idProp = sublistaProp.addField({
        id: custPage+'id_prop',
        type: 'integer',
        label: 'Nº Proponente'
    });


    var clientes = sublistaProp.addField({
        id: custPage+'clientes',
        type: 'text',
        label: 'Clientes'
    });

    var percParticipacao = sublistaProp.addField({
        id: custPage+'perc_participacao',
        type: 'percent',
        label: '% Participação'
    });

    var principal = sublistaProp.addField({
        id: custPage+'principal',
        type: 'text',
        label: 'Principal'
    });

    var listaProponentes = buscarProponentes(idFatura);

    if (listaProponentes.length > 0) {
        for (i=0; i<listaProponentes.length; i++) {
            // log.audit(i, listaProponentes[i]);
            sublistaProp.setSublistValue({
                id: linhaProp.id,
                line: i,
                value: i+1
            });

            sublistaProp.setSublistValue({
                id: idProp.id,
                line: i,
                value: listaProponentes[i].id
            });

            sublistaProp.setSublistValue({
                id: clientes.id,
                line: i,
                value: listaProponentes[i].getText('custrecord_rsc_clientes_contratos')
            });

            sublistaProp.setSublistValue({
                id: percParticipacao.id,
                line: i,
                value: listaProponentes[i].getValue('custrecord_rsc_pct_part') || 0
            });

            sublistaProp.setSublistValue({
                id: principal.id,
                line: i,
                value: listaProponentes[i].getValue('custrecord_rsc_principal') == true ? 'Sim' : 'Não'
            });
        }        
    }
}

const gerarFinanciamentoInvoice = (fatura) => {
    const condicaoPagto = fatura.getValue('custbody_rsc_terms');

    const formatData = (data) => {
        var partesData = data.split("/");
        var novaData = new Date(partesData[2], partesData[1] - 1, partesData[0]);
        return novaData;
    }

    var corpo = {
        // Informações Principais
        entity: fatura.getValue('entity'), 
        duedate: '',
        memo: '',
        // Contrato        
        custbody_rsc_projeto_obra_gasto_compra: fatura.getValue('custbody_rsc_projeto_obra_gasto_compra'),
        custbody_lrc_fatura_principal: fatura.id,
        subsidiary: fatura.getValue('subsidiary'),
        location: fatura.getValue('location'),
        class: fatura.getValue('class'),
        department: fatura.getValue('department'),
        custbody_rsc_natureza: 12, // Mensal
        custbody_rsc_indice: 1, // INCC
        custbody_rsc_data_juros: '',
        // Dados dos Contratos
        custbody_rsc_nrdocboleto: fatura.getValue('custbody_lrc_numero_contrato'),
        custbodyrsc_tpparc: '4', // Mensal
        custbody_rsc_nr_proposta: fatura.getValue('custbody_rsc_nr_proposta'),
        custbody_rsc_ebu: 'Pra quê serve este campo?',
        custbody_rsc_data_venda: fatura.getValue('custbody_rsc_data_venda'),
        custbody_rsc_vlr_venda: fatura.getValue('custbody_rsc_vlr_venda'),
        custbody_rsc_ativo: fatura.getValue('custbody_rsc_ativo'),
        custbody_rsc_tipo_op: 'MCMV',
        custbody_rsc_mod_financ: fatura.getValue('custbody_rsc_mod_financ'),
        custbody_rsc_sist_amort: fatura.getValue('custbody_rsc_sist_amort'),
        custbody_rsc_tran_unidade: fatura.getValue('custbody_rsc_tran_unidade'),
        custbody_rsc_finan_dateativacontrato: fatura.getValue('custbody_lrc_data_chave') ? fatura.getValue('custbody_lrc_data_chave') : fatura.getValue('custbody_lrc_data_liberacao_chave'),
        custbody_rsc_finan_indice_base_cont: fatura.getValue('custbody_rsc_finan_indice_base_cont'),
        custbody_lrc_fat_controle_escrituracao: fatura.getValue('custbody_lrc_fat_controle_escrituracao'),
        // Outros (se necessário)
        startdate: fatura.getValue('startdate'),
        enddate: fatura.getValue('enddate'),
        custbodyrsc_tpparc: fatura.getValue('custbodyrsc_tpparc'),
    }

    var item = {
        item: 19420,
        quantity: 1,
        amount: fatura.getValue('total')
    }

    var quantidadeParcelas, tarefaMR, idTarefaMR;
    
    switch(condicaoPagto) {
        case '5': // 12 parcelas
            quantidadeParcelas = 12;
            for (n=0; n<quantidadeParcelas; n++) {
                const financiamentoInvoice = record.create({type: 'customsale_rsc_financiamento'});
                // Informações Principais
                financiamentoInvoice.setValue('entity', corpo.entity);

                var parcela = new Date(fatura.getValue('duedate'));
                parcela.setMonth(parcela.getMonth()+(n+1));
                var novaParcela = parcela.getDate()+'/'+parcela.getMonth()+'/'+parcela.getFullYear();
                var splitParcela = novaParcela.split('/');
                
                var entregarAte = new Date(splitParcela[2], splitParcela[1] - 1, splitParcela[0]);

                financiamentoInvoice.setValue('duedate', entregarAte);
                
                // Contrato
                financiamentoInvoice.setValue('memo', (n+1)+'ª Parcela')
                .setValue('custbody_rsc_projeto_obra_gasto_compra', corpo.custbody_rsc_projeto_obra_gasto_compra)
                .setValue('custbody_lrc_fatura_principal', corpo.custbody_lrc_fatura_principal)
                .setValue('subsidiary', corpo.subsidiary)
                .setValue('location', corpo.location)
                .setValue('department', corpo.department)
                .setValue('custbody_rsc_natureza', corpo.custbody_rsc_natureza)
                .setValue('custbody_rsc_indice', corpo.custbody_rsc_indice)
                .setValue('custbody_rsc_data_juros', entregarAte);

                // Dados dos Contratos
                financiamentoInvoice.setValue('custbody_rsc_nrdocboleto', corpo.custbody_rsc_nrdocboleto)
                .setValue('custbodyrsc_tpparc', 4)
                .setValue('custbody_rsc_nr_proposta', corpo.custbody_rsc_nr_proposta)
                .setValue('custbody_rsc_ebu', corpo.custbody_rsc_ebu)
                .setValue('custbody_rsc_data_venda', corpo.custbody_rsc_data_venda)
                .setValue('custbody_rsc_vlr_venda', corpo.custbody_rsc_vlr_venda)
                .setValue('custbody_rsc_ativo', corpo.custbody_rsc_ativo)
                .setValue('custbody_rsc_tipo_op', corpo.custbody_rsc_tipo_op)
                .setValue('custbody_rsc_mod_financ', corpo.custbody_rsc_mod_financ)
                .setValue('custbody_rsc_sist_amort', corpo.custbody_rsc_sist_amort)
                .setValue('custbody_rsc_tran_unidade', corpo.custbody_rsc_tran_unidade)
                // .setValue('custbody_rsc_finan_dateativacontrato', corpo.custbody_rsc_finan_dateativacontrato)
                .setValue('custbody_rsc_finan_indice_base_cont', corpo.custbody_rsc_finan_indice_base_cont)
                .setValue('custbody_lrc_fat_controle_escrituracao', corpo.custbody_lrc_fat_controle_escrituracao);
                
                // Itens
                financiamentoInvoice.setSublistValue('item', 'item', 0, item.item)
                .setSublistValue('item', 'quantity', 0, item.quantity)
                .setSublistValue('item', 'rate', 0, item.amount / quantidadeParcelas)
                .setSublistValue('item', 'amount', 0, item.amount / quantidadeParcelas);

                var financiamentoInvoiceId = financiamentoInvoice.save({ìgnoreMandatoryFields: true});
                log.audit((n+1)+'ª parcela', financiamentoInvoiceId);    
            }
        break;

        case '4': // À VISTA
            quantidadeParcelas = 1;
            for (n=0; n<quantidadeParcelas; n++) {
                const financiamentoInvoice = record.create({type: 'customsale_rsc_financiamento'});
                // Informações Principais
                financiamentoInvoice.setValue('entity', corpo.entity);

                var parcela = new Date(fatura.getValue('duedate'));
                parcela.setMonth(parcela.getMonth()+(n+1));
                var novaParcela = parcela.getDate()+'/'+parcela.getMonth()+'/'+parcela.getFullYear();
                var splitParcela = novaParcela.split('/');
                
                var entregarAte = new Date(splitParcela[2], splitParcela[1] - 1, splitParcela[0]);

                financiamentoInvoice.setValue('duedate', entregarAte);
                
                // Contrato
                financiamentoInvoice.setValue('memo', 'À vista')
                .setValue('custbody_rsc_projeto_obra_gasto_compra', corpo.custbody_rsc_projeto_obra_gasto_compra)
                .setValue('custbody_lrc_fatura_principal', corpo.custbody_lrc_fatura_principal)
                .setValue('subsidiary', corpo.subsidiary)
                .setValue('location', corpo.location)
                .setValue('department', corpo.department)
                .setValue('custbody_rsc_natureza', corpo.custbody_rsc_natureza)
                .setValue('custbody_rsc_indice', corpo.custbody_rsc_indice)
                .setValue('custbody_rsc_data_juros', entregarAte);

                // Dados dos Contratos
                financiamentoInvoice.setValue('custbody_rsc_nrdocboleto', corpo.custbody_rsc_nrdocboleto)
                .setValue('custbodyrsc_tpparc', 6)
                .setValue('custbody_rsc_nr_proposta', corpo.custbody_rsc_nr_proposta)
                .setValue('custbody_rsc_ebu', corpo.custbody_rsc_ebu)
                .setValue('custbody_rsc_data_venda', corpo.custbody_rsc_data_venda)
                .setValue('custbody_rsc_vlr_venda', corpo.custbody_rsc_vlr_venda)
                .setValue('custbody_rsc_ativo', corpo.custbody_rsc_ativo)
                .setValue('custbody_rsc_tipo_op', corpo.custbody_rsc_tipo_op)
                .setValue('custbody_rsc_mod_financ', corpo.custbody_rsc_mod_financ)
                .setValue('custbody_rsc_sist_amort', corpo.custbody_rsc_sist_amort)
                .setValue('custbody_rsc_tran_unidade', corpo.custbody_rsc_tran_unidade)
                .setValue('custbody_rsc_finan_dateativacontrato', corpo.custbody_rsc_finan_dateativacontrato)
                .setValue('custbody_rsc_finan_indice_base_cont', corpo.custbody_rsc_finan_indice_base_cont)
                .setValue('custbody_lrc_fat_controle_escrituracao', corpo.custbody_lrc_fat_controle_escrituracao);
                
                // Itens
                financiamentoInvoice.setSublistValue('item', 'item', 0, item.item)
                .setSublistValue('item', 'quantity', 0, item.quantity)
                .setSublistValue('item', 'rate', 0, item.amount / quantidadeParcelas)
                .setSublistValue('item', 'amount', 0, item.amount / quantidadeParcelas);

                var financiamentoInvoiceId = financiamentoInvoice.save({ìgnoreMandatoryFields: true});
                log.audit((n+1)+'ª parcela', financiamentoInvoiceId);    
            }
        break;

        case '3': // 2 parcelas
            quantidadeParcelas = 2;
            for (n=0; n<quantidadeParcelas; n++) {
                const financiamentoInvoice = record.create({type: 'customsale_rsc_financiamento'});
                // Informações Principais
                financiamentoInvoice.setValue('entity', corpo.entity);

                var parcela = new Date(fatura.getValue('duedate'));
                parcela.setMonth(parcela.getMonth()+(n+1));
                var novaParcela = parcela.getDate()+'/'+parcela.getMonth()+'/'+parcela.getFullYear();
                var splitParcela = novaParcela.split('/');
                
                var entregarAte = new Date(splitParcela[2], splitParcela[1] - 1, splitParcela[0]);

                financiamentoInvoice.setValue('duedate', entregarAte);
                
                // Contrato
                financiamentoInvoice.setValue('memo', (n+1)+'ª Parcela')
                .setValue('custbody_rsc_projeto_obra_gasto_compra', corpo.custbody_rsc_projeto_obra_gasto_compra)
                .setValue('custbody_lrc_fatura_principal', corpo.custbody_lrc_fatura_principal)
                .setValue('subsidiary', corpo.subsidiary)
                .setValue('location', corpo.location)
                .setValue('department', corpo.department)
                .setValue('custbody_rsc_natureza', corpo.custbody_rsc_natureza)
                .setValue('custbody_rsc_indice', corpo.custbody_rsc_indice)
                .setValue('custbody_rsc_data_juros', entregarAte);

                // Dados dos Contratos
                financiamentoInvoice.setValue('custbody_rsc_nrdocboleto', corpo.custbody_rsc_nrdocboleto)
                .setValue('custbodyrsc_tpparc', 4)
                .setValue('custbody_rsc_nr_proposta', corpo.custbody_rsc_nr_proposta)
                .setValue('custbody_rsc_ebu', corpo.custbody_rsc_ebu)
                .setValue('custbody_rsc_data_venda', corpo.custbody_rsc_data_venda)
                .setValue('custbody_rsc_vlr_venda', corpo.custbody_rsc_vlr_venda)
                .setValue('custbody_rsc_ativo', corpo.custbody_rsc_ativo)
                .setValue('custbody_rsc_tipo_op', corpo.custbody_rsc_tipo_op)
                .setValue('custbody_rsc_mod_financ', corpo.custbody_rsc_mod_financ)
                .setValue('custbody_rsc_sist_amort', corpo.custbody_rsc_sist_amort)
                .setValue('custbody_rsc_tran_unidade', corpo.custbody_rsc_tran_unidade)
                .setValue('custbody_rsc_finan_dateativacontrato', corpo.custbody_rsc_finan_dateativacontrato)
                .setValue('custbody_rsc_finan_indice_base_cont', corpo.custbody_rsc_finan_indice_base_cont)
                .setValue('custbody_lrc_fat_controle_escrituracao', corpo.custbody_lrc_fat_controle_escrituracao);
                
                // Itens
                financiamentoInvoice.setSublistValue('item', 'item', 0, item.item)
                .setSublistValue('item', 'quantity', 0, item.quantity)
                .setSublistValue('item', 'rate', 0, item.amount / quantidadeParcelas)
                .setSublistValue('item', 'amount', 0, item.amount / quantidadeParcelas);

                var financiamentoInvoiceId = financiamentoInvoice.save({ìgnoreMandatoryFields: true});
                log.audit((n+1)+'ª parcela', financiamentoInvoiceId);    
            }            
        break;

        case '2': // Entrada + 240 parcelas
        quantidadeParcelas = 1;
        var financiamentoInvoiceId;
        for (n=0; n<quantidadeParcelas; n++) {
            const financiamentoInvoice = record.create({type: 'customsale_rsc_financiamento'});
            // Informações Principais
            financiamentoInvoice.setValue('entity', corpo.entity);

            var parcela = new Date(fatura.getValue('duedate'));
            parcela.setMonth(parcela.getMonth()+(n+1));
            var novaParcela = parcela.getDate()+'/'+parcela.getMonth()+'/'+parcela.getFullYear();
            var splitParcela = novaParcela.split('/');
            
            var entregarAte = new Date(splitParcela[2], splitParcela[1] - 1, splitParcela[0]);

            financiamentoInvoice.setValue('duedate', entregarAte);
            
            // Contrato
            financiamentoInvoice.setValue('memo', 'Ato')
            .setValue('custbody_rsc_projeto_obra_gasto_compra', corpo.custbody_rsc_projeto_obra_gasto_compra)
            .setValue('custbody_lrc_fatura_principal', corpo.custbody_lrc_fatura_principal)
            .setValue('subsidiary', corpo.subsidiary)
            .setValue('location', corpo.location)
            .setValue('department', corpo.department)
            .setValue('custbody_rsc_natureza', corpo.custbody_rsc_natureza)
            .setValue('custbody_rsc_indice', corpo.custbody_rsc_indice)
            .setValue('custbody_rsc_data_juros', entregarAte);

            // Dados dos Contratos
            financiamentoInvoice.setValue('custbody_rsc_nrdocboleto', corpo.custbody_rsc_nrdocboleto)
            .setValue('custbodyrsc_tpparc', 1)
            .setValue('custbody_rsc_nr_proposta', corpo.custbody_rsc_nr_proposta)
            .setValue('custbody_rsc_ebu', corpo.custbody_rsc_ebu)
            .setValue('custbody_rsc_data_venda', corpo.custbody_rsc_data_venda)
            .setValue('custbody_rsc_vlr_venda', corpo.custbody_rsc_vlr_venda)
            .setValue('custbody_rsc_ativo', corpo.custbody_rsc_ativo)
            .setValue('custbody_rsc_tipo_op', corpo.custbody_rsc_tipo_op)
            .setValue('custbody_rsc_mod_financ', corpo.custbody_rsc_mod_financ)
            .setValue('custbody_rsc_sist_amort', corpo.custbody_rsc_sist_amort)
            .setValue('custbody_rsc_tran_unidade', corpo.custbody_rsc_tran_unidade)
            .setValue('custbody_rsc_finan_dateativacontrato', corpo.custbody_rsc_finan_dateativacontrato)
            .setValue('custbody_rsc_finan_indice_base_cont', corpo.custbody_rsc_finan_indice_base_cont)
            .setValue('custbody_lrc_fat_controle_escrituracao', corpo.custbody_lrc_fat_controle_escrituracao);
            
            // Itens
            financiamentoInvoice.setSublistValue('item', 'item', 0, item.item)
            .setSublistValue('item', 'quantity', 0, item.quantity)
            .setSublistValue('item', 'rate', 0, item.amount / 241)
            .setSublistValue('item', 'amount', 0, item.amount / 241);

            financiamentoInvoiceId = financiamentoInvoice.save({ìgnoreMandatoryFields: true});
            log.audit('Ato', financiamentoInvoiceId);    
        }
        
        if (financiamentoInvoiceId) {
            tarefaMR = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_rsc_fatura_gera_parcelas_mr',
                deploymentId: 'customdeploy_rsc_fatura_gera_parcelas_mr',
                params: {custscript_rsc_json_fatura: {
                    ato: financiamentoInvoiceId,
                    duedate: fatura.getValue('duedate'),
                    custbodyrsc_tpparc: 4,
                    quantidadeParcelas: 240
                }}
            });
            
            idTarefaMR = tarefaMR.submit();
            log.audit('idTarefaMR', idTarefaMR);
        }
        break;

        case '1': // Entrada + 99 parcelas
            quantidadeParcelas = 1;
            var financiamentoInvoiceId;
            for (n=0; n<quantidadeParcelas; n++) {
                const financiamentoInvoice = record.create({type: 'customsale_rsc_financiamento'});
                // Informações Principais
                financiamentoInvoice.setValue('entity', corpo.entity);

                var parcela = new Date(fatura.getValue('duedate'));
                parcela.setMonth(parcela.getMonth()+(n+1));
                var novaParcela = parcela.getDate()+'/'+parcela.getMonth()+'/'+parcela.getFullYear();
                var splitParcela = novaParcela.split('/');
                
                var entregarAte = new Date(splitParcela[2], splitParcela[1] - 1, splitParcela[0]);

                financiamentoInvoice.setValue('duedate', entregarAte);
                
                // Contrato
                financiamentoInvoice.setValue('memo', 'Ato')
                .setValue('custbody_rsc_projeto_obra_gasto_compra', corpo.custbody_rsc_projeto_obra_gasto_compra)
                .setValue('custbody_lrc_fatura_principal', corpo.custbody_lrc_fatura_principal)
                .setValue('subsidiary', corpo.subsidiary)
                .setValue('location', corpo.location)
                .setValue('department', corpo.department)
                .setValue('custbody_rsc_natureza', corpo.custbody_rsc_natureza)
                .setValue('custbody_rsc_indice', corpo.custbody_rsc_indice)
                .setValue('custbody_rsc_data_juros', entregarAte);

                // Dados dos Contratos
                financiamentoInvoice.setValue('custbody_rsc_nrdocboleto', corpo.custbody_rsc_nrdocboleto)
                .setValue('custbodyrsc_tpparc', 1)
                .setValue('custbody_rsc_nr_proposta', corpo.custbody_rsc_nr_proposta)
                .setValue('custbody_rsc_ebu', corpo.custbody_rsc_ebu)
                .setValue('custbody_rsc_data_venda', corpo.custbody_rsc_data_venda)
                .setValue('custbody_rsc_vlr_venda', corpo.custbody_rsc_vlr_venda)
                .setValue('custbody_rsc_ativo', corpo.custbody_rsc_ativo)
                .setValue('custbody_rsc_tipo_op', corpo.custbody_rsc_tipo_op)
                .setValue('custbody_rsc_mod_financ', corpo.custbody_rsc_mod_financ)
                .setValue('custbody_rsc_sist_amort', corpo.custbody_rsc_sist_amort)
                .setValue('custbody_rsc_tran_unidade', corpo.custbody_rsc_tran_unidade)
                .setValue('custbody_rsc_finan_dateativacontrato', corpo.custbody_rsc_finan_dateativacontrato)
                .setValue('custbody_rsc_finan_indice_base_cont', corpo.custbody_rsc_finan_indice_base_cont)
                .setValue('custbody_lrc_fat_controle_escrituracao', corpo.custbody_lrc_fat_controle_escrituracao);
                
                // Itens
                financiamentoInvoice.setSublistValue('item', 'item', 0, item.item)
                .setSublistValue('item', 'quantity', 0, item.quantity)
                .setSublistValue('item', 'rate', 0, item.amount / 100)
                .setSublistValue('item', 'amount', 0, item.amount / 100);

                financiamentoInvoiceId = financiamentoInvoice.save({ìgnoreMandatoryFields: true});
                log.audit('Ato', financiamentoInvoiceId);    
            }
            
            if (financiamentoInvoiceId) {
                tarefaMR = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_rsc_fatura_gera_parcelas_mr',
                    deploymentId: 'customdeploy_rsc_fatura_gera_parcelas_mr',
                    params: {custscript_rsc_json_fatura: {
                        ato: financiamentoInvoiceId,
                        duedate: fatura.getValue('duedate'),
                        custbodyrsc_tpparc: 4,
                        quantidadeParcelas: 99
                    }}
                });
                
                idTarefaMR = tarefaMR.submit();
                log.audit('idTarefaMR', idTarefaMR);
            }
        break;
    }
}

const beforeLoad = (context) => {
    log.audit('beforeLoad', context);

    const novoRegistro = context.newRecord;

    const form = context.form;

    var ambiente = runtime.envType;

    var usuarioAtual = runtime.getCurrentUser().id;

    var orderStatus = novoRegistro.getValue('orderstatus');
    var tipoTransacaoWF = novoRegistro.getValue('custbody_rsc_tipo_transacao_workflow');
    
    if (novoRegistro.id) {
        form.clientScriptFileId = 9932; // RSC Fatura Geral CT

        if (orderStatus == 'H') {
            if (tipoTransacaoWF == 24) { // PV - Contrato
                form.addButton({
                    id: custPage+'reparcelamento_2',
                    label: 'Renegociação',
                    functionName: 'clientForSuitelet'
                });
                
                form.addButton({
                    id: custPage+'cessao_direito',
                    label: 'Cessão de Direitos',
                    functionName: 'cessaoDireito'
                });
        
                form.addButton({
                    id: custPage+'distrato',
                    label: 'Distrato',
                    functionName: 'distrato'
                });
            }             
        } else {
            if (tipoTransacaoWF == 22) { // PV - Proposta
                form.addButton({
                    id: custPage+'atualizar_contrato',
                    label: 'Aprovar Proposta',
                    functionName: 'atualizarContrato'
                });
            }
        }

        sublista_fluxoPagamentos(form, novoRegistro.id);
        sublista_proponentes(form, novoRegistro.id);
    }
}

const afterSubmit = (context) => {
    log.audit('afterSubmit', context);

    const registroAtual = context.newRecord;

    const usuarioAtual = runtime.getCurrentUser();
    const memo = registroAtual.getValue('memo');

    const criadoDe = registroAtual.getValue('createdfrom');

    // if (criadoDe) {
    if (criadoDe || memo == 'FI') {
        var bscFinanciamentoInvoice = search.create({type: "transaction",
            filters: [
                ["shipping","is","F"], "AND", 
                ["taxline","is","F"], "AND", 
                ["mainline","is","T"], "AND", 
                ["type","anyof","CuTrSale123"], "AND", 
                ["custbody_lrc_fatura_principal.internalid","anyof",registroAtual.id]
            ],
            columns: [
                "internalid","tranid","duedate"
            ]
        });

        var resultados = bscFinanciamentoInvoice.runPaged().count;
        log.audit(resultados, bscFinanciamentoInvoice);

        if (resultados == 0) {
            if (usuarioAtual.id == 3588 || usuarioAtual.id == 13365) {
                gerarFinanciamentoInvoice(registroAtual);
            }
        } 
        // else {
        //     if (usuarioAtual.id == 3588) {
        //         var clean = search.create({type: "transaction",
        //             filters: [
        //                 ["shipping","is","F"], "AND", 
        //                 ["taxline","is","F"], "AND", 
        //                 ["mainline","is","T"], "AND", 
        //                 ["type","anyof","CuTrSale123"], "AND", 
        //                 ["custbody_lrc_fatura_principal.internalid","anyof",registroAtual.id]
        //             ],
        //             columns: [
        //                 "internalid","tranid","duedate"
        //             ]
        //         }).run().getRange(0,1000);

        //         if (clean.length > 0) {
        //             for (var key in clean) {
        //                 if (clean.hasOwnProperty(key))
        //                 log.audit(key, clean[key]);
        //                 try {
        //                     record.delete({type: 'customsale_rsc_financiamento', id: clean[key].id});
        //                 } catch(e) {
        //                     log.error(key, e);
        //                 }
                        
        //             }
        //         }
        //     }            
        // }
    }
}

return {
    afterSubmit: afterSubmit,
    beforeLoad: beforeLoad
};

});