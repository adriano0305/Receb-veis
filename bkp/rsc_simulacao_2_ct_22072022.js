/**
 *@NApiVersion 2.x
*@NScriptType ClientScript
*/
const custPage = 'custpage_rsc_';
const ZERO = Number('0').toFixed(2);

define(['N/currentRecord', 'N/log', 'N/record', 'N/search', 'N/ui/dialog', 'N/url'], function(currentRecord, log, record, search, dialog, url) {
function campanhaDesconto(data, valor) {
    console.log('campanhaDesconto', data);

    var vigenciaInicio, vigenciaFim;
    
    var split = data.split('/');
    console.log('split', split);

    var mes = split[1];
    var ano = split[2];
    
    switch (mes) {
        case '01': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('31/'+mes+'/'+ano);
        break;

        case '02': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('28/'+mes+'/'+ano);
        break;

        case '03': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('31/'+mes+'/'+ano);
        break;

        case '04': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('30/'+mes+'/'+ano);
        break;

        case '05': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('31/'+mes+'/'+ano);
        break;

        case '06': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('30/'+mes+'/'+ano);
        break;

        case '07': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('31/'+mes+'/'+ano);
        break;

        case '08': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('31/'+mes+'/'+ano);
        break;

        case '09': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('30/'+mes+'/'+ano);
        break;

        case '10': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('31/'+mes+'/'+ano);
        break;

        case '11': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('30/'+mes+'/'+ano);
        break;

        case '12': 
            vigenciaInicio = String('01/'+mes+'/'+ano);
            vigenciaFim = String('31/'+mes+'/'+ano);
        break;
    }

    var bscCD = search.create({type: "customrecord_rsc_campanhadesconto",
        filters: [
            ["custrecord_rsc_vigenciainicio","on",vigenciaInicio], "AND", 
            ["custrecord_rsc_vigenciafim","on",vigenciaFim], "AND", 
            ["isinactive","is","F"]
        ],
        columns: [
            "id","name","custrecord_rsc_vigenciainicio","custrecord_rsc_vigenciafim","custrecord_rsc_percentualdesconto"
        ]
    }).run().getRange(0,1);
    console.log('bscCD', JSON.stringify(bscCD));

    var percentualDesconto, desconto, valorDesconto, objCD;

    if (bscCD.length > 0) {
        percentualDesconto = Number(bscCD[0].getValue('custrecord_rsc_percentualdesconto').replace('%', '')).toFixed(2);
        desconto = Number((valor * percentualDesconto) / 100).toFixed(2);
        valorDesconto = Number(valor - ((valor * percentualDesconto) / 100)).toFixed(2);
        console.log('result', JSON.stringify({
            valor: valor,
            cd: bscCD[0].getValue('custrecord_rsc_percentualdesconto'),
            desconto: desconto, 
            valorDesconto: valorDesconto
        }));

        objCD = {
            valor: valor,
            cd: bscCD[0].getValue('custrecord_rsc_percentualdesconto'),
            desconto: desconto, 
            valorDesconto: valorDesconto
        } 
    } else {
        objCD = {    
            valor: valor,
            cd: '',        
            desconto: desconto,
            valorDesconto: valor
        }
    }   
    
    return objCD;
}

function atualizaJSONRenegociacao(registroAtual, linha, renegociacao, sublista) {
    console.log('atualizaJSONRenegociacao', {linha: linha, renegociacao: renegociacao, sublista: sublista, registroAtual: registroAtual});

    var arrayRenegociacao = [];

    if (renegociacao == 'Amortização') {
        arrayRenegociacao.push({
            link: registroAtual.getSublistValue({
                sublistId: sublista.resumoReparcelamento,
                fieldId: custPage+'link',
                line: linha.amortizacao
            }),
            ver: registroAtual.getSublistValue({
                sublistId: sublista.resumoReparcelamento,
                fieldId: custPage+'ver',
                line: linha.amortizacao
            }),
            parcela: {
                value: registroAtual.getSublistValue({
                    sublistId: sublista.resumoReparcelamento,
                    fieldId: custPage+'parcela',
                    line: linha.amortizacao
                }),
                text: registroAtual.getSublistText({
                    sublistId: sublista.resumoReparcelamento,
                    fieldId: custPage+'parcela',
                    line: linha.amortizacao
                })
            },
            tipoParcela: registroAtual.getSublistValue({
                sublistId: sublista.resumoReparcelamento,
                fieldId: custPage+'tipo_parcela',
                line: linha.amortizacao
            }),
            indice: registroAtual.getSublistText({
                sublistId: sublista.resumoReparcelamento,
                fieldId: custPage+'indice',
                line: linha.amortizacao
            }),
            valorAmortizar: Number(registroAtual.getSublistValue({
                sublistId: sublista.resumoReparcelamento,
                fieldId: custPage+'valor_amortizar',
                line: linha.amortizacao
            })),
            proRata: Number(registroAtual.getSublistValue({
                sublistId: sublista.resumoReparcelamento,
                fieldId: custPage+'pro_rata',
                line: linha.amortizacao
            })),
            desconto: Number(registroAtual.getSublistValue({
                sublistId: sublista.resumoReparcelamento,
                fieldId: custPage+'desconto',
                line: linha.amortizacao
            })),
            total: Number(registroAtual.getSublistValue({
                sublistId: sublista.resumoReparcelamento,
                fieldId: custPage+'total',
                line: linha.amortizacao
            }))
        });
    } else if (renegociacao == 'Recálculo de atrasos' || renegociacao == 'Antecipação') {
        for (i=0; i<linha['recalc_atraso_antecipa']; i++) {
            arrayRenegociacao.push({
                link: registroAtual.getSublistValue({
                    sublistId: sublista.resumoReparcelamento,
                    fieldId: custPage+'link',
                    line: linha.amortizacao
                }),
                ver: registroAtual.getSublistValue({
                    sublistId: sublista.resumoReparcelamento,
                    fieldId: custPage+'ver',
                    line: linha.amortizacao
                }),
                parcela: {
                    value: registroAtual.getSublistValue({
                        sublistId: sublista.resumoReparcelamento,
                        fieldId: custPage+'parcela',
                        line: linha.amortizacao
                    }),
                    text: registroAtual.getSublistText({
                        sublistId: sublista.resumoReparcelamento,
                        fieldId: custPage+'parcela',
                        line: linha.amortizacao
                    })
                },
                tipoParcela: registroAtual.getSublistValue({
                    sublistId: sublista.resumoReparcelamento,
                    fieldId: custPage+'tipo_parcela',
                    line: linha.amortizacao
                }),
                indice: registroAtual.getSublistText({
                    sublistId: sublista.resumoReparcelamento,
                    fieldId: custPage+'indice',
                    line: linha.amortizacao
                }),
                proRata: Number(registroAtual.getSublistValue({
                    sublistId: sublista.resumoReparcelamento,
                    fieldId: custPage+'pro_rata',
                    line: linha.amortizacao
                })),
                desconto: Number(registroAtual.getSublistValue({
                    sublistId: sublista.resumoReparcelamento,
                    fieldId: custPage+'desconto',
                    line: linha.amortizacao
                })),
                total: Number(registroAtual.getSublistValue({
                    sublistId: sublista.resumoReparcelamento,
                    fieldId: custPage+'total',
                    line: linha.amortizacao
                }))
            });
        }
    } else {
        for (i=0; i<linha['inadimplentes/adimplentes']; i++) {
            arrayRenegociacao.push({
                link: registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'link',
                    line: i
                }),
                ver: registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'ver',
                    line: i
                }),
                parcela: {
                    value: registroAtual.getSublistValue({
                        sublistId: sublista.listaParcelas,
                        fieldId: custPage+'parcela',
                        line: i
                    }),
                    text: registroAtual.getSublistText({
                        sublistId: sublista.listaParcelas,
                        fieldId: custPage+'parcela',
                        line: i
                    })
                },
                tipoParcela: registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'tipo_parcela',
                    line: i
                }),
                indice: registroAtual.getSublistText({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'indice',
                    line: i
                }),
                dataJuros: {
                    value: registroAtual.getSublistValue({
                        sublistId: sublista.listaParcelas,
                        fieldId: custPage+'data_juros',
                        line: i
                    }),
                    text: registroAtual.getSublistText({
                        sublistId: sublista.listaParcelas,
                        fieldId: custPage+'data_juros',
                        line: i
                    })
                },
                valor: registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'valor_original',
                    line: i
                }),
                multa: registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'multa',
                    line: i
                }),
                juros: registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'juros',
                    line: i
                }),
                proRata: registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'pro_rata',
                    line: i
                }),
                desconto: Number(registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'desconto',
                    line: i
                })),
                valorAtualizado: Number(registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    line: i
                })),
                status: registroAtual.getSublistValue({
                    sublistId: sublista.listaParcelas,
                    fieldId: custPage+'status',
                    line: i
                })
            });
        } 
    }

    registroAtual.setValue({
        fieldId: custPage+'json_renegociacao',
        value: JSON.stringify(arrayRenegociacao)
    });
}

function ultimoDiaMes(mes2, ano) {
    console.log('ultimoDiaMes', {mes2: mes2, ano: ano});
    var ultimoDia;

    var mes = mes2 > '9' ? mes2 : '0'+mes2;
    console.log('mes', mes);

    if (typeof(mes) == 'number') {
        mes = String(mes);
    }
    console.log('typeof(mes)', typeof(mes));

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
    console.log('ultimoDia(mes)', ultimoDia);
    
    return ultimoDia;
}

function fatorCorrecao(mes, status, indice) {
    console.log('fatorCorrecao', {mes: mes, status: status, indice: indice});
    var bsc_UnidadeCorrecao;

    if (status == 'anterior2') {
        var mes2 = mes - 2;
        if (mes2 == -1) {
            mes2 = 11;
        } else if (mes2 == 00 || mes2 == '00') {
            mes2 = 12;
        }
        // const ano = new Date().getFullYear();
        var ano;

        if (mes == 01 || mes == 02 || mes == 03) {
            ano = new Date().getFullYear() - 1;
        } else {
            ano = new Date().getFullYear();
        }
        console.log('ano', ano);

        var periodo =  {
            inicio: "01/"+(mes2 > 9 ? mes2 : '0'+mes2)+"/"+ano,
            fim: ultimoDiaMes(mes2, ano)
        }
        console.log('periodo', periodo);

        bsc_UnidadeCorrecao = search.create({type: "customrecord_rsc_correction_unit",
            filters: [
                // ["internalid","anyof","1"], "AND",
                ["internalid","anyof",indice], "AND",
                ["custrecord_rsc_hif_correction_unit.custrecord_rsc_hif_effective_date","within",periodo.inicio,periodo.fim]
            ],
            columns: [
                "internalid","name",
                search.createColumn({name: "custrecord_rsc_hif_factor_percent", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", label: "Fator atualizado data"}),
                search.createColumn({name: "custrecord_rsc_hif_effective_date", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", sort: search.Sort.ASC, label: "Data de vigência"})
            ]
        }).run().getRange(0,12);
        console.log('bsc_UnidadeCorrecao', JSON.stringify(bsc_UnidadeCorrecao));

        if (bsc_UnidadeCorrecao.length > 0) {
            for (i=0; i<bsc_UnidadeCorrecao.length; i++) {
                var fator_atualizado = Number(bsc_UnidadeCorrecao[i].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(2);
                var data_vigencia = bsc_UnidadeCorrecao[i].getValue({name: 'custrecord_rsc_hif_effective_date', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'});

                var split_dtV = data_vigencia.split('/');
                console.log('anterior2', {fator_atualizado: fator_atualizado, data_vigencia: data_vigencia, split_dtV: split_dtV});
                
                if (split_dtV[1] == mes2) {
                    return fator_atualizado;
                }
            }        
        } else {
            return Number('0');
        }
    } else if (status == 'anterior3') {
        var mes3 = mes - 3;
        if (mes3 == -2) {
            mes3 = 10;
        } else if (mes3 == -1) {
            mes3 = 11;
        } else if (mes3 == 00 || mes3 == '00') {
            mes3 = 12;
        }
        // const ANO = new Date().getFullYear();
        var ANO;

        if (mes == 01 || mes == 02 || mes == 03) {
            ANO = new Date().getFullYear() - 1;
        } else {
            ANO = new Date().getFullYear();
        }
        console.log('ANO', ANO);

        var periodo =  {
            inicio: "01/"+(mes3 > 9 ? mes3 : '0'+mes3)+"/"+ANO,
            fim: ultimoDiaMes(mes3, ANO)
        }
        console.log('periodo', periodo);

        bsc_UnidadeCorrecao = search.create({type: "customrecord_rsc_correction_unit",
            filters: [
                // ["internalid","anyof","1"], "AND",
                ["internalid","anyof",indice], "AND",
                ["custrecord_rsc_hif_correction_unit.custrecord_rsc_hif_effective_date","within",periodo.inicio,periodo.fim]
            ],
            columns: [
                "internalid","name",
                search.createColumn({name: "custrecord_rsc_hif_factor_percent", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", label: "Fator atualizado data"}),
                search.createColumn({name: "custrecord_rsc_hif_effective_date", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", sort: search.Sort.ASC, label: "Data de vigência"})
            ]
        }).run().getRange(0,1);
        console.log('bsc_UnidadeCorrecao', JSON.stringify(bsc_UnidadeCorrecao));

        if (bsc_UnidadeCorrecao.length > 0) {
            console.log('anterior3', Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(2));
            return Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(2);
        } else {
            return 0;
        }
    } else {
        bsc_UnidadeCorrecao = search.create({type: "customrecord_rsc_correction_unit",
            filters: [
                // ["internalid","anyof","1"], "AND",
                ["internalid","anyof",indice], "AND",
                ["custrecord_rsc_hif_correction_unit.custrecord_rsc_hif_effective_date","within","thismonth"]
            ],
            columns: [
                "internalid","name",
                search.createColumn({name: "custrecord_rsc_hif_factor_percent", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", label: "Fator atualizado data"}),
                search.createColumn({name: "custrecord_rsc_hif_effective_date", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", sort: search.Sort.ASC, label: "Data de vigência"})
            ]
        }).run().getRange(0,1);
        console.log('bsc_UnidadeCorrecao', JSON.stringify(bsc_UnidadeCorrecao));

        if (bsc_UnidadeCorrecao.length > 0) {
            console.log('anterior3', Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(2) || 0);
            return Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(2) || 0;
        }
    }
}

function calcularProRata(reneg, dt1, dt2, registroAtual) {    
    console.log('calcularProRata', JSON.stringify({dt1: dt1, dt2: dt2, registroAtual: registroAtual}));
    
    var vencimentoEntrada = {
        dia: dt1.getDate() > 9 ? dt1.getDate() : '0'+dt1.getDate(),
        mes: dt1.getMonth() > 9 ? dt1.getMonth()+1 : '0'+(dt1.getMonth()+1),
        ano: dt1.getFullYear()
    }
    console.log('vencimentoEntrada', vencimentoEntrada);

    if (vencimentoEntrada.mes == 00) {
        vencimentoEntrada.mes = 12;
    } 
    console.log('vencimentoEntrada.mes', vencimentoEntrada.mes);

    // const splitDt2 = dt2[0].vencimento.novo.split('/');
    const splitDt2 = dt2[0].vencimento.original.text.split('/');
    console.log('splitDt2', splitDt2);

    const format_dt2 = new Date(splitDt2[2], splitDt2[1], splitDt2[0]);
    console.log('format_dt2', format_dt2);

    var parcela = {
        dia: format_dt2.getDate() > 9 ? format_dt2.getDate() : '0'+format_dt2.getDate(),
        mes: format_dt2.getMonth() > 9 ? format_dt2.getMonth() : '0'+format_dt2.getMonth(),
        ano: format_dt2.getFullYear()
    }
    console.log('parcela', parcela);

    if (parcela.mes == 00) {
        parcela.mes = 12;
    }
    console.log('parcela.mes', parcela.mes);

    const indice = registroAtual.getSublistValue({
        sublistId: custPage+'sublista_resumo_reparcelamento',
        fieldId: custPage+'indice',
        line: 0
    });
    console.log('indice', indice);

    const fator_anterior2 = fatorCorrecao(vencimentoEntrada.mes, 'anterior2', indice);
    console.log('fator_anterior2: '+fator_anterior2, 'typeof: '+typeof(fator_anterior2));
    
    const fator_anterior3 = fatorCorrecao(vencimentoEntrada.mes, 'anterior3', indice);
    console.log('fator_anterior3: '+fator_anterior3, 'typeof: '+typeof(fator_anterior3));
    
    const fator_atual = fatorCorrecao(parcela.mes, 'atual', indice) || 0;
    console.log('fator_atual', fator_atual);

    const principalCalculado = registroAtual.getValue(custPage+'principal_calculado');
    console.log('principal_calculado', principalCalculado);
    
    var parcela_atualizada, difDias, proRata;

    if (reneg == 'Amortização') {        
        if (fator_anterior2 > 0 && fator_anterior3 > 0) {
            parcela_atualizada = Number((fator_anterior2 / fator_anterior3) * principalCalculado).toFixed(2);               
        } else {
            parcela_atualizada = 0;
        }
        console.log('parcela_atualizada', parcela_atualizada);        
        
        if (vencimentoEntrada.dia > parcela.dia) {
            difDias = Math.abs(vencimentoEntrada.dia - parcela.dia); 
            if (parcela_atualizada > 0) {
                proRata = Number(((parcela_atualizada - principalCalculado) / 30) * difDias).toFixed(2);                    
            } else {
                proRata = 0; 
            }
            console.log('return', {difDias: difDias, proRata: proRata});               
            
            return {difDias: difDias, proRata: proRata}
        } else {
            return {difDias: 0, proRata: 0}
        }
    }   
}

function checarStatus() {
    const registroAtual = currentRecord.get();

    const idReparcelamento2 = registroAtual.getValue({fieldId: custPage+'id_reparcelamento_2'});

    const idTabelaEfetivacao = registroAtual.getValue({fieldId: custPage+'id_tabela_efetivacao_reparcelamento'});

    if (idReparcelamento2) {
        var status = search.lookupFields({type: 'customrecord_rsc_reparcelamento_2',
            id: idReparcelamento2,
            columns: ['custrecord_rsc_status']
        }).custrecord_rsc_status[0].text;

        dialog.alert({
            title: 'Status',
            message: status
        });
    }

    if (idTabelaEfetivacao) {
        var status = search.lookupFields({type: 'customrecord_rsc_tab_efetiva_reparcela',
            id: idTabelaEfetivacao,
            columns: ['custrecord_rsc_status_ter']
        }).custrecord_rsc_status_ter[0].text;

        dialog.alert({
            title: 'Status',
            message: status
        });
    }
}

function compararDatas(dt1, dt2) {
    var partesDt1 = dt1.split("/");
    var partesDt2 = dt2.split("/");

    var vencDt1 = new Date(partesDt1[2], partesDt1[1] - 1, partesDt1[0]);
    var vencDt2 = new Date(partesDt2[2], partesDt2[1] - 1, partesDt2[0]);

    console.log({dt1: dt1, dt2: dt2}, vencDt1 > vencDt2 ? true : false);

    return (vencDt1 >= vencDt2) ? true : false;
}

function validarDataVencimento(dataInicio) {
    const partesData = dataInicio.split("/");

    const dataVencParcela = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    const hoje = new Date();

    var diaVencParcela = dataVencParcela.getDate();
    var mesVencParcela = dataVencParcela.getMonth()+1;
    var anoVencParcela = dataVencParcela.getFullYear();

    var diaHoje = hoje.getDate();
    var mesHoje = hoje.getMonth()+1;
    var anoHoje = hoje.getFullYear();

    if (anoVencParcela < anoHoje) {
        return false;
    }

    if (mesVencParcela < mesHoje) {
        if (anoVencParcela <= anoHoje) {
            return false;
        }   
    } 

    if (diaVencParcela < diaHoje) {
        if (anoVencParcela <= anoHoje && mesVencParcela <= mesHoje) {
            return false;
        } 
    }

    return true;
}

function submeter() {
    const registroAtual = currentRecord.get();

    const resumoReparcelamento = custPage+'sublista_resumo_reparcelamento';

    var json = {
        idFaturaPrincipal: registroAtual.getValue({fieldId: custPage+'id_fatura_principal'}),
        faturaPrincipal: registroAtual.getValue({fieldId: custPage+'fatura_principal'}),
        link_fatura_principal: registroAtual.getValue({fieldId: custPage+'link_fatura_principal'}),
        total_fatura_principal: registroAtual.getValue({fieldId: custPage+'total_fatura_principal'}),
        cliente: registroAtual.getValue({fieldId: custPage+'cliente'}),
        unidade: registroAtual.getValue({fieldId: custPage+'unidade'})        
    }

    // Dados para Simulação (Periodicidade das parcelas do contrato)
    const renegociacao = registroAtual.getValue({fieldId: custPage+'renegociacao'});

    switch (renegociacao) {
        case 'Amortização':
            json.dataInicio = {
                value: registroAtual.getValue({fieldId: custPage+'data_inicio'}),
                text: registroAtual.getText({fieldId: custPage+'data_inicio'}),
                newDate: new Date(registroAtual.getValue({fieldId: custPage+'data_inicio'}))
            }; 
        break;
        case 'Inadimplentes': break;
        case 'Adimplentes': break;
    }    

    // Resumo do Reparcelamento
    var arrayParcelas = [];

    for (i=0; i<registroAtual.getLineCount({sublistId: resumoReparcelamento}); i++) {
        arrayParcelas.push({
            link: registroAtual.getSublistValue({
                sublistId: resumoReparcelamento,
                fieldId: custPage+'link',
                line: i
            }),
            ver: registroAtual.getSublistValue({
                sublistId: resumoReparcelamento,
                fieldId: custPage+'ver',
                line: i
            }),
            parcela: {
                value: registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'parcela',
                    line: i
                }),
                text: registroAtual.getSublistText({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'parcela',
                    line: i
                })
            },
            valorPrincipal: registroAtual.getSublistValue({
                sublistId: resumoReparcelamento,
                fieldId: custPage+'valor_principal',
                line: i
            }),
            proRata: registroAtual.getSublistValue({
                sublistId: resumoReparcelamento,
                fieldId: custPage+'proRata',
                line: i
            }),
            total: registroAtual.getSublistValue({
                sublistId: resumoReparcelamento,
                fieldId: custPage+'total',
                line: i
            })
        });
    }
    
    json.arrayParcelas = arrayParcelas;
    
    const urlResumoReparcelamentoSuitelet = url.resolveScript({
        scriptId: 'customscript_rsc_resumo_reparcela_2_st',
        deploymentId: 'customdeploy_rsc_resumo_reparcela_2_st',
        params: {
            json: JSON.stringify(json)
        }
    });

    document.location = urlResumoReparcelamentoSuitelet;
}

function completarGrid() {
    const registroAtual = currentRecord.get();
    
    const listaParcelas = custPage+'sublista_lista_parcelas';
    
    const indice_primeira_linha = {
        text: registroAtual.getSublistText({sublistId: listaParcelas, fieldId: custPage+'indice', line: 0}),
        value: registroAtual.getSublistValue({sublistId: listaParcelas, fieldId: custPage+'indice', line: 0})
    }
    const data_juros_primeira_linha = registroAtual.getSublistText({sublistId: listaParcelas, fieldId: custPage+'data_juros', line: 0});

    if (!indice_primeira_linha.value) {
        dialog.alert({
            title: 'Aviso!',
            message: 'Linha 1: Índice não preenchido.'
        });

        return false;
    }

    if (!data_juros_primeira_linha) {
        dialog.alert({
            title: 'Aviso!',
            message: 'Linha 1: Data Juros não preenchido.'
        });

        return false;
    }

    if (confirm('Índice: '+indice_primeira_linha.text+'\n'+'Data Juros: '+data_juros_primeira_linha+'\n'+'Confirma?')) {
        var splitData = data_juros_primeira_linha.split('/');

        for (i=1; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
            registroAtual.selectLine({
                sublistId: listaParcelas,
                line: i
            });
    
            registroAtual.setCurrentSublistValue({
                sublistId: listaParcelas,
                fieldId: custPage+'indice',
                value: indice_primeira_linha.value
            });       

            registroAtual.setCurrentSublistValue({
                sublistId: listaParcelas,
                fieldId: custPage+'data_juros',
                value: new Date(splitData[2], splitData[1] - 1, splitData[0])    
            });
        }
    } else {
        return false;
    }
}

function voltar() {
    const registroAtual = currentRecord.get();

    const idTabelaEfetivacao = registroAtual.getValue({fieldId: custPage+'id_tabela_efetivacao_reparcelamento'});

    const linkTabelaEfetivacao = registroAtual.getValue({fieldId: custPage+'link_tabela_efetivacao_reparcelamento'});  
    
    var status;
    
    if (idTabelaEfetivacao || linkTabelaEfetivacao) {
        status = search.lookupFields({type: 'customrecord_rsc_tab_efetiva_reparcela',
            id: idTabelaEfetivacao,
            columns: ['custrecord_rsc_status_ter']
        }).custrecord_rsc_status_ter[0].text;

        if (status == 'Em andamento') {
            dialog.alert({
                title: 'Aviso!',
                message: 'Operação em andamento. Aguarde...'
            });

            return false;
        } else {
            history.go(-3); // Fatura Principal
        }
    } else {
        history.back();
    }
}

function setDate(month) {
    var date;

    switch(month) {
        case 1: date = 31; break;
        case 2: date = 28; break;
        case 3: date = 31; break;
        case 4: date = 30; break;
        case 5: date = 31; break;
        case 6: date = 30; break;
        case 7: date = 31; break;
        case 8: date = 31; break;
        case 9: date = 30; break;
        case 10: date = 31; break;
        case 11: date = 30; break;
        case 12: date = 31; break;
    }

    return date;
}

function pageInit(context) {
    const registroAtual = context.currentRecord;

    const renegociacao = registroAtual.getValue({fieldId: custPage+'renegociacao'});

    const primeiroVencimento = {
        text: registroAtual.getText({fieldId: custPage+'data_inicio'}),
        value: new Date(registroAtual.getValue({fieldId: custPage+'data_inicio'}))
    } 

    var objPrimeiroVencimento = {
        dia: primeiroVencimento.value.getDate(),
        mes: primeiroVencimento.value.getMonth()+1 < 10 ? '0'+primeiroVencimento.value.getMonth()+1 : primeiroVencimento.value.getMonth()+1,
        ano: primeiroVencimento.value.getFullYear()
    }

    const resumoReparcelamento = custPage+'sublista_resumo_reparcelamento';
    const listaParcelas = custPage+'sublista_lista_parcelas';

    var campos = {
        valorEntrada: registroAtual.getField({fieldId: custPage+'valor_entrada'}),
        reparcelarEm: registroAtual.getField({fieldId: custPage+'reparcelar_em'}),
        // vencimentoEntrada: registroAtual.getField({fieldId: custPage+'vencimento_entrada'}),
        jurosMora: registroAtual.getField({fieldId: custPage+'juros_mora'}),
        // jsonRenegociacao: registroAtual.getField({fieldId: custPage+'json_renegociacao'})
    }

    var arrayRenegociacao = [];

    switch (renegociacao) {
        case 'Amortização': 
            Object.keys(campos).forEach(function(bodyField) {
                campos[bodyField].isVisible = false;
                campos[bodyField].isDisplay = false;
            });

            for (i=0; i<registroAtual.getLineCount({sublistId: resumoReparcelamento}); i++) {
                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    indice: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistText({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    proRata: registroAtual.getSublistText({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    total: registroAtual.getSublistText({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'total',
                        line: i
                    })
                });
            }   
        break;

        case 'Inadimplentes':
            Object.keys(campos).forEach(function(bodyField) {
                if (bodyField == 'valorEntrada' || bodyField == 'reparcelarEm' || bodyField == 'jurosMora' || bodyField == 'jsonRenegociacao') {
                    campos[bodyField].isVisible = false;
                    campos[bodyField].isDisplay = false;
                }
            });

            for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistText({
                        sublistId: listaParcelas,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    tipoParcela: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'tipo_parcela',
                        line: i
                    }),
                    indice: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: listaParcelas,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valor: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'valor_original',
                        line: i
                    }),
                    multa: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'multa',
                        line: i
                    }),
                    juros: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'juros',
                        line: i
                    }),
                    proRata: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    valorAtualizado: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'valor_atualizado',
                        line: i
                    }),
                    status: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'status',
                        line: i
                    })                    
                });

                if (primeiroVencimento.value.getDate() == 31) {
                    if (i >= 2) {
                        var split_parcela_anterior = registroAtual.getSublistText({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            line: i-1
                        }).split('/');

                        var parcelaAnterior = new Date(split_parcela_anterior[2], split_parcela_anterior[1] - 1, split_parcela_anterior[0]);

                        var objParcelaAnterior = {
                            dia: parcelaAnterior.getDate(),
                            mes: parcelaAnterior.getMonth()+1,
                            ano: parcelaAnterior.getFullYear()
                        }

                        var split_parcela_atual = registroAtual.getSublistText({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        }).split('/');

                        var parcelaAtual = new Date(split_parcela_atual[2], split_parcela_atual[1] - 1, split_parcela_atual[0]);
                        
                        var objParcelaAtual = {
                            dia: parcelaAtual.getDate(),
                            mes: parcelaAtual.getMonth()+1,
                            ano: parcelaAtual.getFullYear()
                        }

                        var diffMeses = objParcelaAtual.mes - objParcelaAnterior.mes;

                        if (diffMeses == 2) {
                            parcelaAtual.setMonth(parcelaAtual.getMonth()-1);
                            parcelaAtual.setDate(setDate(parcelaAtual.getMonth()+1));
                        }

                        if (diffMeses == 0) {
                            console.log(parcelaAtual.getMonth()+1);
                            console.log(parcelaAtual.getMonth()-1);
                            if (parcelaAtual.getMonth()+1 == 2) {
                                parcelaAtual.setMonth(parcelaAtual.getMonth()+1);
                                parcelaAtual.setDate(setDate(parcelaAtual.getMonth()+2));
                            }
                        }
                        
                        registroAtual.selectLine({
                            sublistId: listaParcelas,
                            line: i
                        });

                        registroAtual.setCurrentSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            value: parcelaAtual
                        });
                    }
                }
            }
        break;

        case 'Adimplentes': 
            Object.keys(campos).forEach(function(bodyField) {
                if (bodyField == 'valorEntrada' || bodyField == 'reparcelarEm' || bodyField == 'jurosMora' || bodyField == 'jsonRenegociacao') {
                    campos[bodyField].isVisible = false;
                    campos[bodyField].isDisplay = false;
                }
            });

            for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistText({
                        sublistId: listaParcelas,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    tipoParcela: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'tipo_parcela',
                        line: i
                    }),
                    indice: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: listaParcelas,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valor: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'valor_original',
                        line: i
                    }),
                    multa: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'multa',
                        line: i
                    }),
                    juros: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'juros',
                        line: i
                    }),
                    proRata: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    valorAtualizado: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'valor_atualizado',
                        line: i
                    }),
                    status: registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'status',
                        line: i
                    })                    
                });

                if (primeiroVencimento.value.getDate() == 31) {
                    if (i >= 2) {
                        var split_parcela_anterior = registroAtual.getSublistText({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            line: i-1
                        }).split('/');

                        var parcelaAnterior = new Date(split_parcela_anterior[2], split_parcela_anterior[1] - 1, split_parcela_anterior[0]);

                        var objParcelaAnterior = {
                            dia: parcelaAnterior.getDate(),
                            mes: parcelaAnterior.getMonth()+1,
                            ano: parcelaAnterior.getFullYear()
                        }

                        var split_parcela_atual = registroAtual.getSublistText({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        }).split('/');

                        var parcelaAtual = new Date(split_parcela_atual[2], split_parcela_atual[1] - 1, split_parcela_atual[0]);
                        
                        var objParcelaAtual = {
                            dia: parcelaAtual.getDate(),
                            mes: parcelaAtual.getMonth()+1,
                            ano: parcelaAtual.getFullYear()
                        }

                        var diffMeses = objParcelaAtual.mes - objParcelaAnterior.mes;

                        if (diffMeses == 2) {
                            parcelaAtual.setMonth(parcelaAtual.getMonth()-1);
                            parcelaAtual.setDate(setDate(parcelaAtual.getMonth()+1));
                        }

                        if (diffMeses == 0) {
                            console.log(parcelaAtual.getMonth()+1);
                            console.log(parcelaAtual.getMonth()-1);
                            if (parcelaAtual.getMonth()+1 == 2) {
                                parcelaAtual.setMonth(parcelaAtual.getMonth()+1);
                                parcelaAtual.setDate(setDate(parcelaAtual.getMonth()+2));
                            }
                        }
                        
                        registroAtual.selectLine({
                            sublistId: listaParcelas,
                            line: i
                        });

                        registroAtual.setCurrentSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'parcela',
                            value: parcelaAtual
                        });
                    }
                }
            }
        break;

        case 'Recálculo de atrasos': 
            Object.keys(campos).forEach(function(bodyField) {
                if (bodyField != 'vencimentoEntrada') {
                    campos[bodyField].isVisible = false;
                    campos[bodyField].isDisplay = false;
                }
                // campos[bodyField].isVisible = false;
                // campos[bodyField].isDisplay = false;
            });

            for (i=0; i<registroAtual.getLineCount({sublistId: resumoReparcelamento}); i++) {
                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    indice: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistText({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    proRata: registroAtual.getSublistText({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    total: registroAtual.getSublistText({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'total',
                        line: i
                    })
                });
            }   
        break;

        case 'Antecipação': 
            Object.keys(campos).forEach(function(bodyField) {
                campos[bodyField].isVisible = false;
                campos[bodyField].isDisplay = false;
            });

            for (i=0; i<registroAtual.getLineCount({sublistId: resumoReparcelamento}); i++) {
                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    indice: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistText({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    proRata: registroAtual.getSublistText({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    total: registroAtual.getSublistText({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'total',
                        line: i
                    })
                });
            }   
        break;
    } 

    if (arrayRenegociacao.length > 0) {
        registroAtual.setValue({
            fieldId: custPage+'json_renegociacao',
            value: JSON.stringify(arrayRenegociacao)
        });
    } 
}

function saveRecord(context) {
    const registroAtual = context.currentRecord;

    const resumoReparcelamento = custPage+'sublista_resumo_reparcelamento';

    const listaPàrcelas = custPage+'sublista_lista_parcelas';

    const renegociacao = registroAtual.getValue({fieldId: custPage+'renegociacao'});

    const total_fatura_principal = registroAtual.getValue({fieldId: custPage+'total_fatura_principal'});

    var arrayRenegociacao = [];

    switch (renegociacao) {
        case 'Amortização':
            for (i=0; i<registroAtual.getLineCount({sublistId: resumoReparcelamento}); i++) {
                var parcela = registroAtual.getSublistText({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'parcela',
                    line: i
                });

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Vencimento.'
                    });
                    
                    return false;
                }
    
                if (validarDataVencimento(parcela) == false) {   
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }

                var indice = registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'indice',
                    line: i
                });

                if (!indice) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Índice.'
                    });

                    return false;
                }

                var total = registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'total',
                    line: i
                });

                if (!total || total == 0) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Selecione o valor a amortizar.'
                    });
    
                    return false;
                }
    
                if (total > total_fatura_principal) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha '+(i+1)+': total maior que a Fatura Principal.'
                    });
    
                    return false;
                }

                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    tipoParcela: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'tipo_parcela',
                        line: i
                    }),
                    indice: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    valorAmortizar: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'valor_amortizar',
                        line: i
                    }),
                    proRata: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    total: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'total',
                        line: i
                    })
                });                
            }        
        break;

        case 'Inadimplentes':
            for (i=0; i<registroAtual.getLineCount({sublistId: listaPàrcelas}); i++) {
                var parcela = registroAtual.getSublistText({
                    sublistId: listaPàrcelas,
                    fieldId: custPage+'parcela',
                    line: i
                });

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Vencimento.'
                    });
                    
                    return false;
                }
    
                if (validarDataVencimento(parcela) == false) {   
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }

                var dataJuros = registroAtual.getSublistText({
                    sublistId: listaPàrcelas,
                    fieldId: custPage+'data_juros',
                    line: i
                });

                if (dataJuros && validarDataVencimento(dataJuros) == false) {   
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Data Juros deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }

                var indice = registroAtual.getSublistValue({
                    sublistId: listaPàrcelas,
                    fieldId: custPage+'indice',
                    line: i
                });

                if (!indice) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Índice.'
                    });

                    return false;
                }
    
                var valorAtualizado = registroAtual.getSublistValue({
                    sublistId: listaPàrcelas,
                    fieldId: custPage+'valor_atualizado',
                    line: i
                });

                if (!valorAtualizado || valorAtualizado == 0) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha '+(i+1)+': total zero ou em branco.'
                    });
    
                    return false;
                }
    
                // if (valorAtualizado > total_fatura_principal) {
                //     dialog.alert({
                //         title: 'Aviso!',
                //         message: 'Linha '+(i+1)+': total maior que a Fatura Principal.'
                //     });
    
                //     return false;
                // }

                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: listaPàrcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: listaPàrcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistText({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    tipoParcela: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'tipo_parcela',
                        line: i
                    }),
                    indice: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: listaPàrcelas,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: listaPàrcelas,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valor: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'valor_original',
                        line: i
                    }),
                    multa: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'multa',
                        line: i
                    }),
                    juros: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'juros',
                        line: i
                    }),
                    proRata: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    valorAtualizado: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'valor_atualizado',
                        line: i
                    }),
                    status: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'status',
                        line: i
                    })                    
                });
            }        
        break;

        case 'Adimplentes':
            for (i=0; i<registroAtual.getLineCount({sublistId: listaPàrcelas}); i++) {
                var parcela = registroAtual.getSublistText({
                    sublistId: listaPàrcelas,
                    fieldId: custPage+'parcela',
                    line: i
                });

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Vencimento.'
                    });
                    
                    return false;
                }

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe o vencimento.'
                    });
            
                    return false;
                }
    
                if (validarDataVencimento(parcela) == false) {   
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }

                var indice = registroAtual.getSublistValue({
                    sublistId: listaPàrcelas,
                    fieldId: custPage+'indice',
                    line: i
                });

                if (!indice) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Índice.'
                    });

                    return false;
                }

                var dataJuros = registroAtual.getSublistText({
                    sublistId: listaPàrcelas,
                    fieldId: custPage+'data_juros',
                    line: i
                });

                if (dataJuros && validarDataVencimento(dataJuros) == false) {   
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Data Juros deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
    
                var valorAtualizado = registroAtual.getSublistValue({
                    sublistId: listaPàrcelas,
                    fieldId: custPage+'valor_atualizado',
                    line: i
                });

                if (!valorAtualizado || valorAtualizado == 0) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha '+(i+1)+': total zero ou em branco.'
                    });
    
                    return false;
                }
    
                // if (valorAtualizado > total_fatura_principal) {
                //     dialog.alert({
                //         title: 'Aviso!',
                //         message: 'Linha '+(i+1)+': total maior que a Fatura Principal.'
                //     });
    
                //     return false;
                // }

                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: listaPàrcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: listaPàrcelas,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistText({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    tipoParcela: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'tipo_parcela',
                        line: i
                    }),
                    indice: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: listaPàrcelas,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: listaPàrcelas,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valor: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'valor_original',
                        line: i
                    }),
                    multa: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'multa',
                        line: i
                    }),
                    juros: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'juros',
                        line: i
                    }),
                    proRata: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    valorAtualizado: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'valor_atualizado',
                        line: i
                    }),
                    status: registroAtual.getSublistValue({
                        sublistId: listaPàrcelas,
                        fieldId: custPage+'status',
                        line: i
                    })                    
                });
            } 
        break;

        case 'Recálculo de atrasos':
            for (i=0; i<registroAtual.getLineCount({sublistId: resumoReparcelamento}); i++) {
                var parcela = registroAtual.getSublistText({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'parcela',
                    line: i
                });

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Vencimento.'
                    });
                    
                    return false;
                }
    
                if (validarDataVencimento(parcela) == false) {   
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }

                var indice = registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'indice',
                    line: i
                });

                if (!indice) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Índice.'
                    });

                    return false;
                }

                var total = registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'total',
                    line: i
                });

                if (!total || total == 0) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Selecione o valor a amortizar.'
                    });
    
                    return false;
                }
    
                // if (total > total_fatura_principal) {
                //     dialog.alert({
                //         title: 'Aviso!',
                //         message: 'Linha '+(i+1)+': total maior que a Fatura Principal.'
                //     });
    
                //     return false;
                // }

                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    tipoParcela: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'tipo_parcela',
                        line: i
                    }),
                    indice: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    valorAmortizar: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'valor_amortizar',
                        line: i
                    }),
                    proRata: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    total: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'total',
                        line: i
                    })
                });                
            }        
        break;

        case 'Antecipação':
            for (i=0; i<registroAtual.getLineCount({sublistId: resumoReparcelamento}); i++) {
                var parcela = registroAtual.getSublistText({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'parcela',
                    line: i
                });

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Vencimento.'
                    });
                    
                    return false;
                }
    
                if (validarDataVencimento(parcela) == false) {   
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }

                var indice = registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'indice',
                    line: i
                });

                if (!indice) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha: '+(i+1)+'. Informe Índice.'
                    });

                    return false;
                }

                var total = registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'total',
                    line: i
                });

                if (!total || total == 0) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Selecione o valor a amortizar.'
                    });
    
                    return false;
                }
    
                if (total > total_fatura_principal) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Linha '+(i+1)+': total maior que a Fatura Principal.'
                    });
    
                    return false;
                }

                arrayRenegociacao.push({
                    link: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'link',
                        line: i
                    }),
                    ver: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'ver',
                        line: i
                    }),
                    parcela: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'parcela',
                            line: i
                        })
                    },
                    tipoParcela: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'tipo_parcela',
                        line: i
                    }),
                    indice: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'indice',
                        line: i
                    }),
                    dataJuros: {
                        value: registroAtual.getSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        }),
                        text: registroAtual.getSublistText({
                            sublistId: resumoReparcelamento,
                            fieldId: custPage+'data_juros',
                            line: i
                        })
                    },
                    valorPrincipal: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'valor_principal',
                        line: i
                    }),
                    valorAmortizar: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'valor_amortizar',
                        line: i
                    }),
                    proRata: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'pro_rata',
                        line: i
                    }),
                    total: registroAtual.getSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: custPage+'total',
                        line: i
                    })
                });                
            }        
        break;
    }

    registroAtual.setValue({
        fieldId: custPage+'json_renegociacao',
        value: JSON.stringify(arrayRenegociacao)
    });
    
    return true;
}

function validateField(context) {}

function fieldChanged(context) {
    const registroAtual = context.currentRecord;

    const resumoReparcelamento = custPage+'sublista_resumo_reparcelamento';

    const listaParcelas = custPage+'sublista_lista_parcelas';

    const renegociacao = registroAtual.getValue({fieldId: custPage+'renegociacao'});

    const primeiroVencimento = registroAtual.getText({fieldId: custPage+'data_inicio'});

    const saldoContrato = registroAtual.getValue({fieldId: custPage+'saldo_contrato'});
    
    const atualizacao_monetaria = registroAtual.getValue({fieldId: custPage+'atualizacao_monetaria'});

    var linha = context.line;

    var campo = context.fieldId;

    var cd;

    if (campo == custPage+'observacoes') {
        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas),
                'recalc_atraso_antecipa': registroAtual.getLineCount(resumoReparcelamento),
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );  
    }

    if (campo == custPage+'data_inicio') {
        var dataInicio = registroAtual.getText({fieldId: campo});

        switch (renegociacao) {
            case 'Amortização':
                
            break;

            case 'Inadimplentes': 
                if (validarDataVencimento(dataInicio) == false) {        
                    registroAtual.setValue({
                        fieldId: campo,
                        value: ''
                    });
                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: '1º Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
            break;
        }
    }

    if (campo == custPage+'vencimento_entrada') {
        var vencimentoEntrada = registroAtual.getText({fieldId: campo});

        switch (renegociacao) {
            case 'Amortização':
                
            break;

            case 'Inadimplentes': 
                if (validarDataVencimento(vencimentoEntrada) == false) {        
                    registroAtual.setValue({
                        fieldId: campo,
                        value: ''
                    });
                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento entrada deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
            break;
        }
    }

    if (campo == custPage+'parcela') {
        switch (renegociacao) {
            case 'Amortização':
                var parcela = registroAtual.getSublistText({
                    sublistId: resumoReparcelamento,
                    fieldId: campo,
                    line: linha
                });

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento não pode estar vazio.'
                    });

                    return false;
                }
                
                if (validarDataVencimento(parcela) == false) {
                    registroAtual.selectLine({
                        sublistId: resumoReparcelamento,
                        line: linha
                    });
        
                    registroAtual.setCurrentSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: campo,
                        value: ''
                    });
                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                } else {
                    var vencimentoParcela = {
                        text: registroAtual.getText({fieldId: custPage+'vencimento_parcela'}),
                        value: new Date(registroAtual.getValue({fieldId: custPage+'vencimento_parcela'}))
                    };

                    if (compararDatas(parcela, vencimentoParcela.text) == true) {
                        registroAtual.selectLine({
                            sublistId: resumoReparcelamento,
                            line: linha
                        });
            
                        registroAtual.setCurrentSublistValue({
                            sublistId: resumoReparcelamento,
                            fieldId: campo,
                            value:''
                        });

                        dialog.alert({
                            title: 'Aviso!',
                            message: 'Vencimento igual/maior que o vencimento da parcela.'
                        });

                        return false;
                    } 

                    var splitData = parcela.split('/');
                    
                    vencimentoParcela.value.setDate(splitData[0]);                   

                    registroAtual.setValue({
                        fieldId: custPage+'novo_vencimento',
                        value: new Date(
                            vencimentoParcela.value.getFullYear(), 
                            vencimentoParcela.value.getMonth() >= 9 ? vencimentoParcela.value.getMonth() : '0'+vencimentoParcela.value.getMonth(),
                            vencimentoParcela.value.getDate() >= 9 ? vencimentoParcela.value.getDate() : '0'+vencimentoParcela.value.getDate()
                        )
                    });

                    var arrayParcelas = [];

                    for (i=0; i<registroAtual.getLineCount(resumoReparcelamento); i++) {
                        var id_financiamento_invoice = registroAtual.getSublistValue(resumoReparcelamento, custPage+'id_financiamento_invoice', i);
                        var loadFI = record.load({type: 'invoice', id: id_financiamento_invoice});

                        arrayParcelas.push({
                            id_financiamento_invoice: id_financiamento_invoice,
                            vencimento: {
                                // novo: new Date(registroAtual.getSublistValue(resumoReparcelamento, custPage+'parcela', i)),
                                novo: registroAtual.getSublistText(resumoReparcelamento, custPage+'parcela', i),
                                original: {text: loadFI.getText('duedate'), value: loadFI.getValue('duedate')},
                            },
                            // proRata: registroAtual.getSublistValue(resumoReparcelamento, custPage+'pro_rata', i),
                            total: registroAtual.getSublistValue(resumoReparcelamento, custPage+'total', i)
                        });
                    }
                    console.log('arrayParcelas', JSON.stringify(arrayParcelas));

                    var vp = arrayParcelas[0].vencimento.novo;
                    var splitPV = vp.split('/');
                    var formatVP = new Date(splitPV[2], splitPV[1], splitPV[0]);
                    console.log('formatVP', formatVP);

                    // calculoPR = calcularProRata(renegociacao, new Date(registroAtual.getValue({fieldId: custPage+'data_inicio'})), arrayParcelas, registroAtual);
                    calculoPR = calcularProRata(renegociacao, formatVP, arrayParcelas, registroAtual);
                    // Atualiza a coluna Pro Rata
                    registroAtual.selectLine(resumoReparcelamento, 0)
                    .setCurrentSublistValue(resumoReparcelamento, custPage+'pro_rata', calculoPR.proRata)
                    .commitLine(resumoReparcelamento);
                    // Atualiza o campo Pro Rata (Calculado)
                    registroAtual.setValue(custPage+'pro_rata_calculado', calculoPR.proRata);

                    var totalCalculado = (parseFloat(registroAtual.getValue({fieldId: custPage+'principal_calculado'})) + parseFloat(calculoPR.proRata)).toFixed(2);
                    console.log('totalCalculado', totalCalculado);

                    registroAtual.setValue({
                        fieldId: custPage+'pro_rata_calculado_2', 
                        value: calculoPR.proRata
                    });

                    registroAtual.setValue({
                        fieldId: custPage+'total_calculado', 
                        value: totalCalculado
                    });
                }
            break;

            case 'Inadimplentes': 
                var parcela = registroAtual.getSublistText({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento não pode estar vazio.'
                    });

                    return false;
                }
                
                if (validarDataVencimento(parcela) == false) {                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
            break;

            case 'Adimplentes': 
                var parcela = registroAtual.getSublistText({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });
                
                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento não pode estar vazio.'
                    });

                    return false;
                }
                
                if (validarDataVencimento(parcela) == false) {                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
            break;

            case 'Recálculo de atrasos':
                var parcela = registroAtual.getSublistText({
                    sublistId: resumoReparcelamento,
                    fieldId: campo,
                    line: linha
                });

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento não pode estar vazio.'
                    });

                    return false;
                }
                
                if (validarDataVencimento(parcela) == false) {
                    registroAtual.selectLine({
                        sublistId: resumoReparcelamento,
                        line: linha
                    });
        
                    registroAtual.setCurrentSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: campo,
                        value: ''
                    });
                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
            break;

            case 'Antecipação':
                var parcela = registroAtual.getSublistText({
                    sublistId: resumoReparcelamento,
                    fieldId: campo,
                    line: linha
                });

                if (!parcela) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento não pode estar vazio.'
                    });

                    return false;
                }
                
                if (validarDataVencimento(parcela) == false) {
                    registroAtual.selectLine({
                        sublistId: resumoReparcelamento,
                        line: linha
                    });
        
                    registroAtual.setCurrentSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: campo,
                        value: ''
                    });
                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Vencimento deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
            break;
        }
        
        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas),
                'recalc_atraso_antecipa': registroAtual.getLineCount(resumoReparcelamento),
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );   
    }

    if (campo == custPage+'tipo_parcela') {
        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas),
                'recalc_atraso_antecipa': registroAtual.getLineCount(resumoReparcelamento),
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );
    }

    if (campo == custPage+'indice') {
        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas),
                'recalc_atraso_antecipa': registroAtual.getLineCount(resumoReparcelamento),
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );
    }

    if (campo == custPage+'data_juros') {
        switch (renegociacao) {
            case 'Amortização':
                var dataJuros = registroAtual.getSublistText({
                    sublistId: resumoReparcelamento,
                    fieldId: campo,
                    line: linha
                });
                
                if (validarDataVencimento(dataJuros) == false) {
                    registroAtual.selectLine({
                        sublistId: resumoReparcelamento,
                        line: linha
                    });
        
                    registroAtual.setCurrentSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: campo,
                        value: ''
                    });
                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Data Juros deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
            break;

            case 'Inadimplentes': 
                var dataJuros = registroAtual.getSublistText({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });
                
                if (validarDataVencimento(dataJuros) == false) {                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Data Juros deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
            break;

            case 'Adimplentes': 
                var dataJuros = registroAtual.getSublistText({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });
                
                if (validarDataVencimento(dataJuros) == false) {                    
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Data Juros deve ser maior/igual a data de hoje.'
                    });
            
                    return false;
                }
            break;
        }
        
        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas)
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );   
    }

    if (campo == custPage+'valor_principal') {
        var valorPrincipal = registroAtual.getSublistValue({
            sublistId: resumoReparcelamento,
            fieldId: campo,
            line: linha
        });

        var proRata = registroAtual.getSublistValue({
            sublistId: resumoReparcelamento,
            fieldId: custPage+'pro_rata',
            line: linha
        });

        var total = valorPrincipal + proRata;

        registroAtual.selectLine({
            sublistId: resumoReparcelamento,
            line: linha
        });

        registroAtual.setCurrentSublistValue({
            sublistId: resumoReparcelamento,
            fieldId: custPage+'total',
            value: Number(total)
        });

        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas)
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );   
    }

    if (campo == custPage+'valor_original') {
        switch (renegociacao) {
            case 'Amortização': 
            break;

            case 'Inadimplentes': 
                var valorOriginal = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });

                var totalCalculado = registroAtual.getValue({fieldId: custPage+'total_calculado'});
                
                if (valorOriginal > totalCalculado) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Valor é maior que o Total Calculado.'
                    });

                    return false;
                }

                var multa = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'multa',
                    line: linha
                });

                var juros = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'juros',
                    line: linha
                });

                var proRata = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'pro_rata',
                    line: linha
                });

                var total = valorOriginal + multa + juros + proRata;
        
                registroAtual.selectLine({
                    sublistId: listaParcelas,
                    line: linha
                });
        
                registroAtual.setCurrentSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    value: Number(total)
                });
                
                var principalCalculado = registroAtual.getValue({fieldId: custPage+'principal_calculado'});

                var total_principal_informado = 0;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    total_principal_informado += registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: campo,
                        line: i
                    });
                }

                registroAtual.setValue({
                    fieldId: custPage+'principal_informado',
                    value: Number(total_principal_informado)
                });

                registroAtual.setValue({
                    fieldId: custPage+'principal_diferenca',
                    value: Number(principalCalculado - total_principal_informado).toFixed(2)
                });
            break;

            case 'Adimplentes':
                var valorOriginal = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });

                var totalCalculado = registroAtual.getValue({fieldId: custPage+'total_calculado'});
                
                if (valorOriginal > totalCalculado) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Valor é maior que o Total Calculado.'
                    });

                    return false;
                }

                // var multa = registroAtual.getSublistValue({
                //     sublistId: listaParcelas,
                //     fieldId: custPage+'multa',
                //     line: linha
                // });

                // var juros = registroAtual.getSublistValue({
                //     sublistId: listaParcelas,
                //     fieldId: custPage+'juros',
                //     line: linha
                // });

                var proRata = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'pro_rata',
                    line: linha
                });

                // var total = valorOriginal + multa + juros + proRata;

                var total = valorOriginal + proRata;
        
                registroAtual.selectLine({
                    sublistId: listaParcelas,
                    line: linha
                });
        
                registroAtual.setCurrentSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    value: Number(total)
                });

                var principalCalculado = registroAtual.getValue({fieldId: custPage+'principal_calculado'});

                var total_principal_informado = 0;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    total_principal_informado += registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: campo,
                        line: i
                    });
                }

                registroAtual.setValue({
                    fieldId: custPage+'principal_informado',
                    value: Number(total_principal_informado)
                });

                registroAtual.setValue({
                    fieldId: custPage+'principal_diferenca',
                    value: Number(principalCalculado - total_principal_informado).toFixed(2)
                });
            break;
        } 
        
        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas)
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );   
    }
    
    if (campo == custPage+'valor_atualizado') { 
        switch (renegociacao) {
            case 'Amortização': 
            break;

            case 'Inadimplentes': 
                var valorAtualizado = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });
        
                var total_fatura_principal = registroAtual.getValue({fieldId: custPage+'total_fatura_principal'});

                // if (valorAtualizado > total_fatura_principal) {
                //     dialog.alert({
                //         title: 'Aviso!',
                //         message: 'Linha: '+(linha+1)+': total maior que a Fatura Principal.'
                //     });

                //     return false;
                // }

                // registroAtual.setValue({
                //     fieldId: custPage+'parcelas_marcadas',
                //     value: valorAtualizado
                // });

                var total_novas_parcelas = 0;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    total_novas_parcelas += registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: campo,
                        line: i
                    });
                }

                registroAtual.setValue({
                    fieldId: custPage+'total_novas_parcelas',
                    value: Number(total_novas_parcelas).toFixed(2)
                });

                registroAtual.setValue({
                    fieldId: custPage+'custo_total',
                    value: (total_fatura_principal - valorAtualizado).toFixed(2)
                });

                var totalCalculado = registroAtual.getValue({fieldId: custPage+'total_calculado'});

                registroAtual.setValue({
                    fieldId: custPage+'total_informado',
                    value: Number(total_novas_parcelas).toFixed(2)
                    // value: total_novas_parcelas
                });

                registroAtual.setValue({
                    fieldId: custPage+'total_diferenca',
                    value: Number(totalCalculado - total_novas_parcelas).toFixed(2)
                });
            break;

            case 'Adimplentes': 
                var valorAtualizado = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });
        
                var total_fatura_principal = registroAtual.getValue({fieldId: custPage+'total_fatura_principal'});

                // if (valorAtualizado > total_fatura_principal) {
                //     dialog.alert({
                //         title: 'Aviso!',
                //         message: 'Linha: '+(linha+1)+': total maior que a Fatura Principal.'
                //     });

                //     return false;
                // }

                // registroAtual.setValue({
                //     fieldId: custPage+'parcelas_marcadas',
                //     value: valorAtualizado
                // });

                var total_novas_parcelas = 0;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    total_novas_parcelas += registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: campo,
                        line: i
                    });
                }

                registroAtual.setValue({
                    fieldId: custPage+'total_novas_parcelas',
                    value: Number(total_novas_parcelas).toFixed(2)
                });

                registroAtual.setValue({
                    fieldId: custPage+'custo_total',
                    value: (total_fatura_principal - valorAtualizado).toFixed(2)
                });

                var totalCalculado = registroAtual.getValue({fieldId: custPage+'total_calculado'});

                registroAtual.setValue({
                    fieldId: custPage+'total_informado',
                    value: Number(total_novas_parcelas).toFixed(2)
                    // value: total_novas_parcelas
                });

                registroAtual.setValue({
                    fieldId: custPage+'total_diferenca',
                    value: Number(totalCalculado - total_novas_parcelas).toFixed(2)
                });
            break;
        }

        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas)
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );     
    }

    arrayRenegociacao = [];

    if (campo == custPage+'valor_amortizar') {
        switch (renegociacao) {
            case 'Amortização': 
                var valorAmortizar = registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: campo,
                    line: linha
                });

                var totalCalculado = registroAtual.getValue({fieldId: custPage+'total_calculado'});
                
                if (valorAmortizar > totalCalculado) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Valor Amortizar é maior que o Total Calculado.'
                    });

                    return false;
                }

                // cd = campanhaDesconto(primeiroVencimento, valorAmortizar);

                // registroAtual.setValue({
                //     fieldId: custPage+'campanha_desconto',
                //     value: JSON.stringify(cd)
                // });

                var proRata = registroAtual.getValue({fieldId: custPage+'pro_rata_calculado'});

                if (!valorAmortizar) {
                    valorAmortizar = 0;
                }

                var valorSelecionado = registroAtual.getValue({fieldId: custPage+'parcelas_marcadas'});

                if (valorAmortizar >= valorSelecionado) {
                    registroAtual.selectLine({
                        sublistId: resumoReparcelamento,
                        line: linha
                    });

                    registroAtual.setCurrentSublistValue({
                        sublistId: resumoReparcelamento,
                        fieldId: campo,
                        value: Number('0').toFixed(2)
                    });

                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Não é possível amortizar o valor total.'
                    });

                    return false;
                }

                // var proRata = registroAtual.getSublistValue({
                //     sublistId: resumoReparcelamento,
                //     fieldId: custPage+'pro_rata',
                //     line: linha
                // });

                var totalAtualizado = (valorSelecionado - valorAmortizar);

                registroAtual.selectLine({
                    sublistId: resumoReparcelamento,
                    line: linha
                });

                // registroAtual.setCurrentSublistValue({
                //     sublistId: resumoReparcelamento,
                //     fieldId: custPage+'desconto',
                //     value: cd.desconto
                // });

                registroAtual.setCurrentSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'total',
                    // value: cd.valorDesconto
                    value: valorAmortizar
                });

                registroAtual.setValue({
                    fieldId: custPage+'novo_valor',
                    value: totalAtualizado
                });
                
                registroAtual.setValue({
                    fieldId: custPage+'principal_informado',
                    value: valorAmortizar
                });
                
                registroAtual.setValue({
                    fieldId: custPage+'principal_diferenca',
                    value: Number(totalAtualizado).toFixed(2)
                });

                registroAtual.setValue({
                    fieldId: custPage+'total_informado',
                    value: valorAmortizar
                });

                registroAtual.setValue({
                    fieldId: custPage+'total_diferenca',
                    value: Number(totalAtualizado + proRata + atualizacao_monetaria).toFixed(2)
                    // value: Number((totalAtualizado + proRata + atualizacao_monetaria) - cd.desconto).toFixed(2)
                });

                atualizaJSONRenegociacao(
                    registroAtual, {
                        amortizacao: 0, 
                        'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas)
                    },
                    renegociacao, 
                    {
                        resumoReparcelamento: resumoReparcelamento, 
                        listaParcelas: listaParcelas
                    }
                ); 
            break;

            case 'Inadimplentes': 
            break;

            case 'Adimplentes': 
            break;
        }
          
        // atualizaJSONRenegociacao(
        //     registroAtual, {
        //         amortizacao: 0, 
        //         'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas)
        //     },
        //     renegociacao, 
        //     {
        //         resumoReparcelamento: resumoReparcelamento, 
        //         listaParcelas: listaParcelas
        //     }
        // );   
    }

    if (campo == custPage+'multa') {
        switch (renegociacao) {
            case 'Amortização': 
            break;

            case 'Inadimplentes': 
                var multa = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });

                var valor = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_original',
                    line: linha
                });

                var juros = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'juros',
                    line: linha
                });

                var proRata = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'pro_rata',
                    line: linha
                });

                var totalAtualizado = multa + valor + juros + proRata;

                registroAtual.selectLine({
                    sublistId: listaParcelas,
                    line: linha
                });

                registroAtual.setCurrentSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    value: totalAtualizado
                });

                var multaCalculado = registroAtual.getValue({fieldId: custPage+'multa_calculado'});

                var total_multa_informado = 0;
                
                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    total_multa_informado += registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: campo,
                        line: i
                    });
                }

                registroAtual.setValue({
                    fieldId: custPage+'multa_informado',
                    value: total_multa_informado
                });

                registroAtual.setValue({
                    fieldId: custPage+'multa_diferenca',
                    value: Number(multaCalculado - total_multa_informado).toFixed(2)
                });
            break;

            case 'Adimplentes': 
                var multa = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });

                var valor = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_original',
                    line: linha
                });

                var juros = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'juros',
                    line: linha
                });

                var proRata = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'pro_rata',
                    line: linha
                });

                var totalAtualizado = multa + valor + juros + proRata;

                registroAtual.selectLine({
                    sublistId: listaParcelas,
                    line: linha
                });

                registroAtual.setCurrentSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'total',
                    value: totalAtualizado
                });
            break;
        } 

        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas)
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );   
    }

    if (campo == custPage+'juros') {
        switch (renegociacao) {
            case 'Amortização': 
            break;

            case 'Inadimplentes': 
                var juros = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });

                var valor = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_original',
                    line: linha
                });

                var multa = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'multa',
                    line: linha
                });

                var proRata = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'pro_rata',
                    line: linha
                });

                var totalAtualizado = juros + valor + multa + proRata;

                registroAtual.selectLine({
                    sublistId: listaParcelas,
                    line: linha
                });

                registroAtual.setCurrentSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    value: totalAtualizado
                });

                var jurosCalculado = registroAtual.getValue({fieldId: custPage+'juros_calculado'});

                var total_juros_informado = 0;                

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    total_juros_informado += registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: campo,
                        line: i
                    });
                }

                registroAtual.setValue({
                    fieldId: custPage+'juros_informado',
                    value: Number(total_juros_informado).toFixed(2)
                });

                registroAtual.setValue({
                    fieldId: custPage+'juros_diferenca',
                    value: Number(jurosCalculado - total_juros_informado).toFixed(2)
                });
            break;

            case 'Adimplentes': 
                var multa = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });

                var valor = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_original',
                    line: linha
                });

                var juros = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'juros',
                    line: linha
                });

                var proRata = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'pro_rata',
                    line: linha
                });

                var totalAtualizado = juros + valor + multa + proRata;

                registroAtual.selectLine({
                    sublistId: listaParcelas,
                    line: linha
                });

                registroAtual.setCurrentSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'total',
                    value: totalAtualizado
                });
            break;
        } 

        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas)
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );   
    }

    if (campo == custPage+'pro_rata') {
        switch (renegociacao) {
            case 'Amortização': 
                var proRata = registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: campo,
                    line: linha
                });

                var valorSelecionado = registroAtual.getValue({fieldId: custPage+'parcelas_marcadas'});

                var valorAmortizar = registroAtual.getSublistValue({
                    sublistId: resumoReparcelamento,
                    fieldId: custPage+'valor_amortizar',
                    line: linha
                });

                var totalAtualizado = Number((valorSelecionado - valorAmortizar) + proRata).toFixed(2);
                console.log('totalAtualizado: '+totalAtualizado);

                registroAtual.setValue({
                    fieldId: custPage+'novo_valor',
                    value: totalAtualizado
                });
            break;

            case 'Inadimplentes': 
                var proRata = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });

                var valor = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_original',
                    line: linha
                });

                var multa = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'multa',
                    line: linha
                });

                var juros = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'juros',
                    line: linha
                });

                var totalAtualizado = juros + valor + multa + proRata;

                registroAtual.selectLine({
                    sublistId: listaParcelas,
                    line: linha
                });

                registroAtual.setCurrentSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    value: totalAtualizado
                });

                var proRataCalculado2 = registroAtual.getValue({fieldId: custPage+'pro_rata_calculado_2'});
               
                var total_pro_rata_informado = 0;                

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    total_pro_rata_informado += registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: campo,
                        line: i
                    });
                }

                registroAtual.setValue({
                    fieldId: custPage+'pro_rata_informado',
                    value: Number(total_pro_rata_informado)
                });

                registroAtual.setValue({
                    fieldId: custPage+'pro_rata_diferenca',
                    value: Number(proRataCalculado2 - total_pro_rata_informado).toFixed(2)
                });
            break;

            case 'Adimplentes': 
                var proRata = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: campo,
                    line: linha
                });

                var valor = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_original',
                    line: linha
                });

                // var multa = registroAtual.getSublistValue({
                //     sublistId: listaParcelas,
                //     fieldId: custPage+'multa',
                //     line: linha
                // });

                // var juros = registroAtual.getSublistValue({
                //     sublistId: listaParcelas,
                //     fieldId: custPage+'juros',
                //     line: linha
                // });

                // var totalAtualizado = juros + valor + multa + proRata;

                var totalAtualizado = valor + proRata;

                registroAtual.selectLine({
                    sublistId: listaParcelas,
                    line: linha
                });

                registroAtual.setCurrentSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    value: totalAtualizado
                });

                var proRataCalculado2 = registroAtual.getValue({fieldId: custPage+'pro_rata_calculado_2'});
               
                var total_pro_rata_informado = 0;                

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    total_pro_rata_informado += registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: campo,
                        line: i
                    });
                }

                registroAtual.setValue({
                    fieldId: custPage+'pro_rata_informado',
                    value: Number(total_pro_rata_informado)
                });

                registroAtual.setValue({
                    fieldId: custPage+'pro_rata_diferenca',
                    value: Number(proRataCalculado2 - total_pro_rata_informado).toFixed(2)
                });
            break;
        } 

        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas),
                'recalc_atraso_antecipa': registroAtual.getLineCount(resumoReparcelamento),
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );   
    }

    if (campo == custPage+'total') {
        var total = registroAtual.getSublistValue({
            sublistId: resumoReparcelamento,
            fieldId: campo,
            line: linha
        }); 

        var valorAmortizar = registroAtual.getSublistValue({
            sublistId: resumoReparcelamento,
            fieldId: custPage+'valor_amortizar',
            line: linha
        }); 

        var proRata = registroAtual.getSublistValue({
            sublistId: resumoReparcelamento,
            fieldId: custPage+'pro_rata',
            line: linha
        }); 

        var total_fatura_principal = registroAtual.getValue({fieldId: custPage+'total_fatura_principal'});  

        var saldo = registroAtual.getValue({fieldId: custPage+'custo_total'});

        if (total > saldo) {
            dialog.alert({
                title: 'Aviso!',
                message: 'Linha '+(linha+1)+': total maior saldo do financiamento.'
            });

            return false;
        }

        if (proRata > 0) {
            registroAtual.setValue({
                fieldId: custPage+'custo_total',
                value: (saldoContrato - valorAmortizar).toFixed(2)
            });  
        } else {
            registroAtual.setValue({
                fieldId: custPage+'custo_total',
                value: total == 0 ? saldoContrato.toFixed(2) : (saldoContrato - total).toFixed(2)
            });
        }

        var total_novas_parcelas = 0;

        for (i=0; i<registroAtual.getLineCount({sublistId: resumoReparcelamento}); i++) {
            total_novas_parcelas += registroAtual.getSublistValue({
                sublistId: resumoReparcelamento,
                fieldId: campo,
                line: i
            });
        }

        registroAtual.setValue({
            fieldId: custPage+'total_novas_parcelas',
            value: total_novas_parcelas
        });

        atualizaJSONRenegociacao(
            registroAtual, {
                amortizacao: 0, 
                'inadimplentes/adimplentes': registroAtual.getLineCount(listaParcelas),
                'recalc_atraso_antecipa': registroAtual.getLineCount(resumoReparcelamento),
            },
            renegociacao, 
            {
                resumoReparcelamento: resumoReparcelamento, 
                listaParcelas: listaParcelas
            }
        );
        
        // switch (renegociacao) {
        //     case 'Amortização': 
        //         arrayRenegociacao.push({
        //             link: registroAtual.getSublistValue({
        //                 sublistId: resumoReparcelamento,
        //                 fieldId: custPage+'link',
        //                 line: linha
        //             }),
        //             ver: registroAtual.getSublistValue({
        //                 sublistId: resumoReparcelamento,
        //                 fieldId: custPage+'ver',
        //                 line: linha
        //             }),
        //             parcela: {
        //                 value: registroAtual.getSublistValue({
        //                     sublistId: resumoReparcelamento,
        //                     fieldId: custPage+'parcela',
        //                     line: linha
        //                 }),
        //                 text: registroAtual.getSublistText({
        //                     sublistId: resumoReparcelamento,
        //                     fieldId: custPage+'parcela',
        //                     line: linha
        //                 })
        //             },
        //             tipoParcela: registroAtual.getSublistValue({
        //                 sublistId: resumoReparcelamento,
        //                 fieldId: custPage+'tipo_parcela',
        //                 line: linha
        //             }),
        //             indice: registroAtual.getSublistText({
        //                 sublistId: resumoReparcelamento,
        //                 fieldId: custPage+'indice',
        //                 line: linha
        //             }),
        //             valorAmortizar: Number(registroAtual.getSublistValue({
        //                 sublistId: resumoReparcelamento,
        //                 fieldId: custPage+'valor_amortizar',
        //                 line: linha
        //             })),
        //             proRata: Number(registroAtual.getSublistValue({
        //                 sublistId: resumoReparcelamento,
        //                 fieldId: custPage+'pro_rata',
        //                 line: linha
        //             })),
        //             total: Number(total)
        //         });
        //     break;

        //     case 'Inadimplentes': 
        //         arrayRenegociacao.push({
        //             link: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'link',
        //                 line: linha
        //             }),
        //             ver: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'ver',
        //                 line: linha
        //             }),
        //             parcela: {
        //                 value: registroAtual.getSublistValue({
        //                     sublistId: listaParcelas,
        //                     fieldId: custPage+'parcela',
        //                     line: linha
        //                 }),
        //                 text: registroAtual.getSublistText({
        //                     sublistId: listaParcelas,
        //                     fieldId: custPage+'parcela',
        //                     line: linha
        //                 })
        //             },
        //             tipoParcela: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'tipo_parcela',
        //                 line: linha
        //             }),
        //             indice: registroAtual.getSublistText({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'indice',
        //                 line: linha
        //             }),
        //             dataJuros: {
        //                 value: registroAtual.getSublistValue({
        //                     sublistId: listaParcelas,
        //                     fieldId: custPage+'data_juros',
        //                     line: i
        //                 }),
        //                 text: registroAtual.getSublistText({
        //                     sublistId: listaParcelas,
        //                     fieldId: custPage+'data_juros',
        //                     line: i
        //                 })
        //             },
        //             valor: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'valor_original',
        //                 line: i
        //             }),
        //             multa: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'multa',
        //                 line: i
        //             }),
        //             juros: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'juros',
        //                 line: i
        //             }),
        //             proRata: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'pro_rata',
        //                 line: i
        //             }),
        //             valorAtualizado: Number(total),
        //             status: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'status',
        //                 line: i
        //             })
        //         });
        //     break;

        //     case 'Adimplentes': 
        //         arrayRenegociacao.push({
        //             link: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'link',
        //                 line: linha
        //             }),
        //             ver: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'ver',
        //                 line: linha
        //             }),
        //             parcela: {
        //                 value: registroAtual.getSublistValue({
        //                     sublistId: listaParcelas,
        //                     fieldId: custPage+'parcela',
        //                     line: linha
        //                 }),
        //                 text: registroAtual.getSublistText({
        //                     sublistId: listaParcelas,
        //                     fieldId: custPage+'parcela',
        //                     line: linha
        //                 })
        //             },
        //             tipoParcela: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'tipo_parcela',
        //                 line: linha
        //             }),
        //             indice: registroAtual.getSublistText({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'indice',
        //                 line: linha
        //             }),
        //             dataJuros: {
        //                 value: registroAtual.getSublistValue({
        //                     sublistId: listaParcelas,
        //                     fieldId: custPage+'data_juros',
        //                     line: i
        //                 }),
        //                 text: registroAtual.getSublistText({
        //                     sublistId: listaParcelas,
        //                     fieldId: custPage+'data_juros',
        //                     line: i
        //                 })
        //             },
        //             valor: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'valor_original',
        //                 line: i
        //             }),
        //             multa: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'multa',
        //                 line: i
        //             }),
        //             juros: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'juros',
        //                 line: i
        //             }),
        //             proRata: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'pro_rata',
        //                 line: i
        //             }),
        //             valorAtualizado: Number(total),
        //             status: registroAtual.getSublistValue({
        //                 sublistId: listaParcelas,
        //                 fieldId: custPage+'status',
        //                 line: i
        //             })
        //         });
        //     break;
        // }
        
        // registroAtual.setValue({
        //     fieldId: custPage+'json_renegociacao',
        //     value: JSON.stringify(arrayRenegociacao)
        // });
    }
}

function postSourcing(context) {}

function lineInit(context) {}

function validateDelete(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function sublistChanged(context) {}

return {
    checarStatus: checarStatus,
    submeter: submeter,
    completarGrid: completarGrid,
    voltar: voltar,
    pageInit: pageInit,
    saveRecord: saveRecord,
    // validateField: validateField,
    fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    // sublistChanged: sublistChanged
}
});
