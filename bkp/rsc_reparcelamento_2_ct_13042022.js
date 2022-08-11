/**
 *@NApiVersion 2.x
*@NScriptType ClientScript
*/

const custPage = 'custpage_rsc_';
const ZERO = Number('0').toFixed(2);

define(['N/currentRecord', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/ui/dialog', 'N/url'], function(currentRecord, log, record, runtime, search, dialog, url) {
function validarDataVencimento3(vencimentoEntrada, vencimentoParcela) {
    const partesVE = vencimentoEntrada.split("/");

    const dataVE = new Date(partesVE[2], partesVE[1] - 1, partesVE[0]);

    var diaVE = dataVE.getDate();
    var mesVE = dataVE.getMonth()+1;
    var anoVE = dataVE.getFullYear();

    const partesVP = vencimentoParcela.split("/");

    const dataVP = new Date(partesVP[2], partesVP[1] - 1, partesVP[0]);    

    var diaVP = dataVP.getDate();
    var mesVP = dataVP.getMonth()+1;
    var anoVP = dataVP.getFullYear();

    if (anoVP < anoVE) {
        return false;
    }

    if (mesVP < mesVE) {
        if (anoVP <= anoVE) {
            return false;
        }
    } 

    if (diaVP < diaVE) {
        if (anoVP <= anoVE && mesVP <= mesVE) {
            return false;
        } 
    }

    return true;
} 

function calcJuros(total, delay, fees)  {
    // var interestCalc = (Math.pow((1 + fees), (1 / 360)) - 1).toFixed(8);    
    interestCalc = (fees / 360).toFixed(8);
    interestCalc = interestCalc * delay;
    interestCalc = interestCalc * total;
    return interestCalc;
    // return interestCalc.toFixed(2);
}

function validarVencimento(novoVencimento, vencimentoParcela) {
    var partesNV = novoVencimento.split('/');

    const nv = new Date(partesNV[2], partesNV[1] - 1, partesNV[0]);

    var diaNV = nv.getDate();
    var mesNV = nv.getMonth()+1;
    var anoNV = nv.getFullYear();

    var partesData = vencimentoParcela.split("/");

    var vp = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    var diaVencimento = vp.getDate();
    var mesVencimento = vp.getMonth()+1;
    var anoVencimento = vp.getFullYear();

    if (nv > vp) {
        var tempo = Math.abs(nv.getTime() - vp.getTime());

        var diasMora = Math.ceil(tempo / (1000 * 3600 * 24));
    
        if ((diasMora) > 1) {
            return {
                status: true, 
                diasMora: diasMora
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

function recalcJuros(novoVencimento, empreendimento, arrayParcelas) {
    console.log('recalcJuros', JSON.stringify({
        novoVencimento: novoVencimento,
        empreendimento: empreendimento,
        arrayParcelas: arrayParcelas
    }));

    const bscEmpreendimento = search.create({type: "job",
        filters: [
            ["internalid","is",empreendimento]
        //    ["entityid","is",empreendimento]        
        ],
        columns: [
            "entityid","altname","custentity_rsc_juros","custentity_rsc_multa"
        ]
    }).run().getRange(0,1);
    // console.log('bscEmpreendimento', JSON.stringify(bscEmpreendimento));

    const jurosAA = bscEmpreendimento[0].getValue('custentity_rsc_juros').replace('%','') / 100; // a.a
    const multa = bscEmpreendimento[0].getValue('custentity_rsc_multa').replace('%','') / 100;     

    arrayParcelas.forEach(function(parcela) {
        var parcelaVencida = validarVencimento(novoVencimento, parcela.vencimento);

        var juros, valorAtualizado;

        if (parcelaVencida.status == true) {
            juros = calcJuros(parcela.valor, parcelaVencida.diasMora, jurosAA);
            valorAtualizado = (parcela.valor + (parcela.valor * multa));
            valorAtualizado = (parseFloat(valorAtualizado) + parseFloat(juros) + (parcela.valor * multa) + parseFloat(parcela.calculoPR.proRata)).toFixed(2);
            console.log(parcela.ver, JSON.stringify({
                parcelaVencida: parcelaVencida,
                valor: parcela.valor,
                juros: juros,
                multa: (parcela.valor * multa).toFixed(2),
                proRata: parcela.calculoPR,
                valorAtualizado: valorAtualizado
            }));
            
            parcela.multa = (parcela.valor * multa).toFixed(2);
            parcela.juros = juros;
            parcela.valorAtualizado = valorAtualizado;
        } else {
            valorAtualizado = (parseFloat(parcela.valor) + parseFloat(parcela.calculoPR.proRata)).toFixed(2);
            parcela.valorAtualizado = valorAtualizado;
        }
    });
    // console.log('arrayParcelas Atualizado', JSON.stringify(arrayParcelas));

    return arrayParcelas;
}

function validarDataVencimento2(dataInicio) {
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

function jurosPriceIncorrer(idFI) {
    console.log('jurosPriceIncorrer', idFI);
    const loadReg = record.load({type: 'invoice', id: idFI});

    var linha_juros_price_incorrer = loadReg.findSublistLineWithValue('item', 'item', 19607); // JUROS PRICE A INCORRER
    console.log('linha_juros_price_incorrer', linha_juros_price_incorrer);

    var juros_price_incorrer;
    
    if (linha_juros_price_incorrer == -1) {        
        juros_price_incorrer = ZERO;
    } else {
        juros_price_incorrer = loadReg.getSublistValue('item', 'amount', linha_juros_price_incorrer);
    }
    console.log('jurosPriceIncorrer', {idFI: idFI, linha_juros_price_incorrer: linha_juros_price_incorrer, juros_price_incorrer: juros_price_incorrer});

    return juros_price_incorrer;
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

function voltar() {
    history.back();
}

function marcarTudo() {
    const registroAtual = currentRecord.get();

    const listaParcelas = custPage+'sublista_lista_parcelas';
    
    const linhasReparcelar = registroAtual.getLineCount({sublistId: listaParcelas});
    
    var i=0;

    while (i<linhasReparcelar) {
        var status = registroAtual.getSublistValue({
            sublistId: listaParcelas,
            fieldId: custPage+'status', 
            line: i
        });

        if (status ==  'Aberto') {
            registroAtual.selectLine({
                sublistId: listaParcelas,
                line: i
            })

            registroAtual.setCurrentSublistValue({
                sublistId: listaParcelas,
                fieldId: custPage+'reparcelar',
                value: true
            });
        }      
    
        i++;     
    }
}

function desmarcarTudo() {
    const registroAtual = currentRecord.get();

    const listaParcelas = custPage+'sublista_lista_parcelas';
    
    const linhasReparcelar = registroAtual.getLineCount({sublistId: listaParcelas});
    
    var i=0;

    while (i<linhasReparcelar) {
        var status = registroAtual.getSublistValue({
            sublistId: listaParcelas,
            fieldId: custPage+'status', 
            line: i
        });

        if (status ==  'Aberto') {
            registroAtual.selectLine({
                sublistId: listaParcelas,
                line: i
            })

            registroAtual.setCurrentSublistValue({
                sublistId: listaParcelas,
                fieldId: custPage+'reparcelar',
                value: false
            });
        }      
    
        i++;
    }
}

function simulacao(ordem) {
    const registroAtual = currentRecord.get();

    const listaParcelas = custPage+'sublista_lista_parcelas';

    const renegociacao = registroAtual.getValue({fieldId: custPage+'renegociacao'});

    const primeiroVencimento = registroAtual.getText({fieldId: custPage+'data_inicio'});

    const vencimentoEntrada = registroAtual.getText({fieldId: custPage+'vencimento_entrada'});

    const reparcelarEm = registroAtual.getValue({fieldId: custPage+'reparcelar_em'});

    if (!primeiroVencimento) {
        if (renegociacao == 'Amortização' || ((renegociacao == 'Adimplentes' || renegociacao == 'Inadimplentes') && reparcelarEm > 0)) {
            dialog.alert({
                title: 'Aviso!',
                message: 'Selecione o 1º Vencimento.'
            });
            
            return false;
        }
    } 

    if (validarDataVencimento(primeiroVencimento) == false) {
        dialog.alert({
            title: 'Aviso!',
            message: 'Primeiro vencimento deve ser maior/igual a data de hoje.'
        });

        return false;
    }    
    
    if (renegociacao == 'Adimplentes' || renegociacao == 'Inadimplentes' || renegociacao == 'Antecipação' || renegociacao == 'Recálculo de atrasos') {
        if (!vencimentoEntrada) {
            dialog.alert({
                title: 'Aviso!',
                message: 'Selecione Vencimento Entrada.'
            });
            
            return false;
        }

        if (validarDataVencimento(vencimentoEntrada) == false) {
            dialog.alert({
                title: 'Aviso!',
                message: 'Vencimento entrada deve ser maior/igual a data de hoje.'
            });
    
            return false;
        }
    }
    
    var indice;
    var tipoParcela;
    var total_valorOriginal = 0;
    var total_multa = 0;
    var total_juros = 0;
    var total_valorAtualizado = 0;
    var juros_incorrer = 0;   

    var arrayParcelas = [];

    if (!renegociacao) {
        dialog.alert({
            title: 'Aviso!',
            message: 'Selecione o Tipo de Renegociação.'
        });

        return false;
    } 

    for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
        var reparcelar = registroAtual.getSublistValue({
            sublistId: listaParcelas,
            fieldId: custPage+'reparcelar',
            line: i
        });

        if (reparcelar == true) {
            arrayParcelas.push({
                linha: i,
                id_financiamento_invoice: Number(registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'id_financiamento_invoice',
                    line: i
                })),
                ver: registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'ver',
                    line: i
                }),
                vencimento: registroAtual.getSublistText({
                    sublistId: listaParcelas,
                    fieldId: custPage+'parcela',
                    line: i
                }),
                tipoParcela: registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'tipo_parcela',
                    line: i
                }),
                reparcelamentoOrigem: registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'reparcelamento_origem',
                    line: i
                }),
                reparcelamentoDestino: registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'reparcelamento_destino',
                    line: i
                }),
                indice: registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'indice',
                    line: i
                }),
                valor: (registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_original',
                    line: i
                })).toFixed(2),
                // valor: (registroAtual.getSublistValue({
                //     sublistId: listaParcelas,
                //     fieldId: custPage+'valor_original',
                //     line: i
                // }) - jurosPriceIncorrer(registroAtual.getSublistValue({
                //     sublistId: listaParcelas,
                //     fieldId: custPage+'id_financiamento_invoice',
                //     line: i
                // }))).toFixed(2),
                multaAntes: Number(registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'multa',
                    line: i
                })),
                multa: Number(registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'multa',
                    line: i
                })),
                jurosAntes: Number(registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'juros',
                    line: i
                })),
                juros: Number(registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'juros',
                    line: i
                })).toFixed(6),
                valorAtualizadoAntes: Number(registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    line: i
                })),
                valorAtualizado: Number(registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    line: i
                })),
                // valorAtualizado: Number(registroAtual.getSublistValue({
                //     sublistId: listaParcelas,
                //     fieldId: custPage+'valor_atualizado',
                //     line: i
                // }) - jurosPriceIncorrer(registroAtual.getSublistValue({
                //     sublistId: listaParcelas,
                //     fieldId: custPage+'id_financiamento_invoice',
                //     line: i
                // }))),
                status: registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'status',
                    line: i
                })
            });

            indice = registroAtual.getSublistValue({sublistId: listaParcelas, fieldId: custPage+'indice', line: i});
            tipoParcela = registroAtual.getSublistValue({sublistId: listaParcelas, fieldId: custPage+'tipo_parcela', line: i});
            total_valorOriginal += registroAtual.getSublistValue({sublistId: listaParcelas, fieldId: custPage+'valor_original', line: i});
            total_multa += registroAtual.getSublistValue({sublistId: listaParcelas, fieldId: custPage+'multa', line: i});
            total_juros += registroAtual.getSublistValue({sublistId: listaParcelas, fieldId: custPage+'juros', line: i});
            total_valorAtualizado += registroAtual.getSublistValue({sublistId: listaParcelas, fieldId: custPage+'valor_atualizado', line: i});
        }
    }

    if (arrayParcelas.length == 0) {
        dialog.alert({
            title: 'Aviso!',
            message: 'Selecione ao menos uma parcela.'
        });

        return false;
    } else if (arrayParcelas.length > 1) {
        if ((renegociacao == 'Adimplentes' || renegociacao == 'Inadimplentes')) {
            if (!primeiroVencimento) {        
                dialog.alert({
                    title: 'Aviso!',
                    message: 'Selecione o 1º Vencimento.'
                });
                
                return false;
            }

            if (reparcelarEm == 0) {        
                dialog.alert({
                    title: 'Aviso!',
                    message: 'Número de Parcelas deve ser maior que zero.'
                });
                
                return false;
            }
        }
    }

    var json = {
        id: registroAtual.getValue({fieldId: custPage+'id_fatura_principal'}),
        faturaPrincipal: registroAtual.getValue({fieldId: custPage+'fatura_principal'}),
        empreendimento: registroAtual.getValue({fieldId: custPage+'empreendimento'}),
        contrato: registroAtual.getValue({fieldId: custPage+'contrato'}),
        cliente: registroAtual.getText({fieldId: custPage+'cliente'}),
        unidade: registroAtual.getValue({fieldId: custPage+'unidade'}),
        total_fatura_principal: (registroAtual.getValue({fieldId: custPage+'total_fatura_principal'})).toFixed(2),
        renegociacao: renegociacao,
        dataInicio: primeiroVencimento,   
        vencimentoEntrada: vencimentoEntrada,     
        quantidadeParcelas: registroAtual.getValue({fieldId: custPage+'quantidade_parcelas'}) || 1,
        totalFinanciado: registroAtual.getValue({fieldId: custPage+'total_financiado'}),
        parcelasMarcadas: registroAtual.getValue({fieldId: custPage+'parcelas_marcadas'}),
        custoTotal: registroAtual.getValue({fieldId: custPage+'custo_total'}) || 0,
        valorEntrada: registroAtual.getValue({fieldId: custPage+'valor_entrada'}) || 0,
        reparcelarEm: reparcelarEm,
        arrayParcelas: arrayParcelas
    }
    // console.log('simulacao', JSON.stringify(json));
    
    var calculoPR, calculoAM;
    var indiceRecalc;
    var tipo_parcela_recalc;
    var total_valorOriginal_recalc = 0;
    var total_multa_recalc = 0;
    var total_juros_recalc = 0;
    var total_valorAtualizado_recalc = 0; 
    var jurosIncorrer = 0;
    
    var lkpFI, ultimaAtualizacao;

    if (renegociacao == 'Amortização') {
        const split_pv = primeiroVencimento.split('/');

        lkpFI = search.lookupFields({type: 'invoice',
            id: arrayParcelas[0].id_financiamento_invoice,
            columns: ['custbody_rsc_ultima_atualizacao']
        });
        // console.log('lkpFI', JSON.stringify(lkpFI));

        ultimaAtualizacao = lkpFI.custbody_rsc_ultima_atualizacao ? lkpFI.custbody_rsc_ultima_atualizacao.split('/') : '';
        
        if (typeof(ultimaAtualizacao) == 'object' && ultimaAtualizacao[1] < split_pv[1]) {
            calculoAM = atualizacaoMonetaria(renegociacao, new Date(registroAtual.getValue({fieldId: custPage+'data_inicio'})), arrayParcelas);
        } 
        
        calculoPR = calcularProRata(renegociacao, new Date(registroAtual.getValue({fieldId: custPage+'data_inicio'})), arrayParcelas, registroAtual, new Date());    
        
        json.somatorioParcelas = {
            indice: indice,
            tipoParcela: tipoParcela,
            valorOriginal: Number(total_valorOriginal).toFixed(2),
            atualizacaoMonetaria: calculoAM || ZERO,
            proRata: Number(calculoPR.proRata).toFixed(2),
            valorAtualizado: (parseFloat(total_valorAtualizado) + parseFloat(calculoPR.proRata)).toFixed(2)
        }

        registroAtual.setValue({
            fieldId: custPage+'dif_dias',
            value: calculoPR.difDias
        });

        registroAtual.setValue({
            fieldId: custPage+'pro_rata_calculado',
            value: calculoPR.proRata
        });
    }
    
    if (renegociacao == 'Inadimplentes' || renegociacao == 'Adimplentes' || renegociacao == 'Recálculo de atrasos' || renegociacao == 'Antecipação') {
        const split_ve = vencimentoEntrada.split('/');

        var novo_array_parcelas = [];
        
        for (i=0; i<arrayParcelas.length; i++) {
            lkpFI = search.lookupFields({type: 'invoice',
                id: arrayParcelas[i].id_financiamento_invoice,
                columns: ['custbody_rsc_ultima_atualizacao']
            });
            // console.log('lkpFI', JSON.stringify(lkpFI));

            ultimaAtualizacao = lkpFI.custbody_rsc_ultima_atualizacao ? lkpFI.custbody_rsc_ultima_atualizacao.split('/') : '';
            
            if (typeof(ultimaAtualizacao) == 'object' && ultimaAtualizacao[1] < split_ve[1]) {
                novo_array_parcelas.push(arrayParcelas[i]);
            }
        }

        if (novo_array_parcelas.length > 0) {
            calculoAM = atualizacaoMonetaria(renegociacao, new Date(registroAtual.getValue({fieldId: custPage+'vencimento_entrada'})), novo_array_parcelas);
        }      
        
        calculoPR = calcularProRata2(renegociacao, new Date(registroAtual.getValue({fieldId: custPage+'vencimento_entrada'})), arrayParcelas, registroAtual, new Date());

        if (renegociacao == 'Recálculo de atrasos' || renegociacao == 'Antecipação' || renegociacao == 'Inadimplentes') {
            var recalcularJuros = recalcJuros(vencimentoEntrada, registroAtual.getValue({fieldId: custPage+'empreendimento'}), arrayParcelas);

            recalcularJuros.forEach(function(ap) {
                indiceRecalc = ap.indice;
                tipo_parcela_recalc = ap.tipoParcela;
                total_valorOriginal_recalc += (parseFloat(ap.valor));
                total_multa_recalc += parseFloat(ap.multa);
                total_juros_recalc += parseFloat(ap.juros);
                total_valorAtualizado_recalc += parseFloat(ap.valorAtualizado);
                // jurosIncorrer += parseFloat(jurosIncorrer + jurosPriceIncorrer(ap.id_financiamento_invoice));
            });
            // console.log({
            //     indiceRecalc: indiceRecalc,
            //     tipo_parcela_recalc: tipo_parcela_recalc,
            //     total_valorOriginal_recalc: total_valorOriginal_recalc,
            //     total_multa_recalc: total_multa_recalc,
            //     total_juros_recalc: total_juros_recalc,
            //     total_valorAtualizado_recalc: total_valorAtualizado_recalc
            // });

            json.somatorioParcelas = {
                indice: indiceRecalc,
                tipoParcela: tipo_parcela_recalc,
                valorOriginal: Number(total_valorOriginal_recalc).toFixed(2),
                // valorOriginal: Number(total_valorOriginal_recalc - jurosIncorrer).toFixed(2),
                multa: Number(total_multa_recalc).toFixed(2),
                juros: Number(total_juros_recalc).toFixed(6),
                atualizacaoMonetaria: calculoAM || ZERO,
                proRata: Number(calculoPR.proRata).toFixed(2),
                valorAtualizado: Number(total_valorAtualizado_recalc).toFixed(2),
                // valorAtualizado: Number(total_valorAtualizado_recalc - jurosIncorrer).toFixed(2),
                jurosIncorrer: Number(jurosIncorrer).toFixed(2)
            }

            // if (renegociacao == 'Antecipação') {
            //     json.campanhaDesconto = campanhaDesconto(vencimentoEntrada, total_valorOriginal_recalc); 
            // }             
        }

        registroAtual.setValue({
            fieldId: custPage+'dif_dias',
            value: calculoPR.difDias
        });

        registroAtual.setValue({
            fieldId: custPage+'pro_rata_calculado',
            value: calculoPR.proRata
        });
    }

    if (renegociacao == 'Adimplentes') {
        json.somatorioParcelas = {
            indice: indice,
            tipoParcela: tipoParcela,
            valorOriginal: Number(total_valorOriginal).toFixed(2),
            multa: Number(total_multa).toFixed(2),
            juros: Number(total_juros).toFixed(6),
            atualizacaoMonetaria: calculoAM || ZERO,
            proRata: calculoPR.proRata,
            valorAtualizado: (parseFloat(total_valorAtualizado) + parseFloat(calculoPR.proRata)).toFixed(2)
        }
    }
    console.log(JSON.stringify({json: json}));

    var usuarioAtual = runtime.getCurrentUser();
    console.log('usuarioAtual', JSON.stringify(usuarioAtual));

    // if (usuarioAtual.id != 3588) {
        if (ordem == 'servidor') {
            json.servidor = 'T';
            if (calculoPR) {
                json.calculoPR = calculoPR;
            }
            console.log(JSON.stringify({json: json}));
            return JSON.stringify(json);
        } else {
            if (calculoPR) {
                json.calculoPR = calculoPR;
                console.log(JSON.stringify({json: json}));
        
                urlSimulacaoSuitelet = url.resolveScript({
                    scriptId: 'customscript_rsc_fatura_simulacao_2_st',
                    deploymentId: 'customdeploy_rsc_fatura_simulacao_2_st',
                    params: {    
                        json: JSON.stringify(json)
                    }
                }); 
        
                // console.log('urlSimulacaoSuitelet: '+urlSimulacaoSuitelet);

                // document.location = urlSimulacaoSuitelet;
            }    

            urlSimulacaoSuitelet = url.resolveScript({
                scriptId: 'customscript_rsc_fatura_simulacao_2_st',
                deploymentId: 'customdeploy_rsc_fatura_simulacao_2_st',
                params: {    
                    json: JSON.stringify(json)
                }
            });
            
            document.location = urlSimulacaoSuitelet;
        }        
    // }
}

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

// Pro Rata Inadimplentes
function calcularProRata2(reneg, dt1, dt2, registroAtual, dt3) {    
    console.log('calcularProRata2', {dt1: dt1, dt2: dt2, registroAtual: registroAtual, dt3: dt3});
    const listaParcelas = custPage+'sublista_lista_parcelas';
    
    var vencimentoEntrada = {
        dia: dt1.getDate() > 9 ? dt1.getDate() : '0'+dt1.getDate(),
        mes: dt1.getMonth() > 9 ? dt1.getMonth()+1 : '0'+(dt1.getMonth()+1),
        ano: dt1.getFullYear()
    }
    // console.log('vencimentoEntrada', vencimentoEntrada);

    if (vencimentoEntrada.mes == 00) {
        vencimentoEntrada.mes = 12;
    } 
    // console.log('vencimentoEntrada.mes', vencimentoEntrada.mes);

    var dd = 0;
    var arrayPR = [];

    dt2.forEach(function(dt) {
        var splitDt2 = dt.vencimento.split('/');
        // console.log('splitDt2', splitDt2);
    
        var format_dt2 = new Date(splitDt2[2], splitDt2[1] - 1, splitDt2[0]);
        // console.log('format_dt2', format_dt2);
    
        var parcela = {
            dia: format_dt2.getDate() > 9 ? format_dt2.getDate() : '0'+format_dt2.getDate(),
            mes: format_dt2.getMonth() > 9 ? format_dt2.getMonth()+1 : '0'+(format_dt2.getMonth()+1),
            ano: format_dt2.getFullYear()
        }
        // console.log('parcela', parcela);
    
        if (parcela.mes == 00) {
            parcela.mes = 12;
        }
        // console.log('parcela.mes', parcela.mes);

        var hoje = {
            dia: dt3.getDate() > 9 ? dt3.getDate() : '0'+dt3.getDate(),
            mes: dt3.getMonth() > 9 ? dt3.getMonth()+1 : '0'+(dt3.getMonth()+1),
            ano: dt1.getFullYear()
        }
        // console.log('primeiroVencimento', primeiroVencimento);
    
        if (hoje.mes == 00) {
            hoje.mes = 12;
        } 
        // console.log('hoje.mes', hoje.mes);
    
        // var fator_anterior2 = fatorCorrecao(vencimentoEntrada.mes, 'anterior2', dt.indice);
        var fator_anterior2 = fatorCorrecao(hoje.mes, 'anterior2', dt.indice);
        // console.log('fator_anterior2: '+fator_anterior2, 'typeof: '+typeof(fator_anterior2));
        
        // var fator_anterior3 = fatorCorrecao(vencimentoEntrada.mes, 'anterior3', dt.indice);
        var fator_anterior3 = fatorCorrecao(hoje.mes, 'anterior3', dt.indice);
        // console.log('fator_anterior3: '+fator_anterior3, 'typeof: '+typeof(fator_anterior3));
        
        // var fator_atual = fatorCorrecao(parcela.mes, 'atual', dt.indice) || 0;
        var fator_atual = fatorCorrecao(hoje.mes, 'atual', dt.indice) || 0;
        // console.log('fator_atual', fator_atual);
        
        var linhaParcela = dt.linha;
        // console.log('linhaParcela', linhaParcela);
        
        var parcela_selecionada, parcela_atualizada, difDias, proRata;
    
        if (reneg == 'Inadimplentes' || reneg == 'Adimplentes' || reneg == 'Recálculo de atrasos' || reneg == 'Antecipação') {
            parcela_selecionada = registroAtual.getSublistValue({
                sublistId: listaParcelas,
                fieldId: custPage+'valor_original',
                line: linhaParcela
                // line: linhaParcela-1
            });
            console.log('parcela_selecionada: '+parcela_selecionada, 'typeof: '+typeof(parcela_selecionada));
            
            if (fator_anterior2 > 0 && fator_anterior3 > 0) {
                parcela_atualizada = reneg == 'Recálculo de atrasos' ? 
                Number((((fator_anterior2 / fator_anterior3) - 1) * parcela_selecionada) + parcela_selecionada).toFixed(6) : 
                Number((((fator_anterior2 / fator_anterior3) - 1) * parcela_selecionada) + parcela_selecionada).toFixed(6)
                // Number((fator_anterior2 / fator_anterior3) * parcela_selecionada).toFixed(2);               
            } else {
                parcela_atualizada = 0;
            }
            console.log('parcela_atualizada', parcela_atualizada);  
            
            if (vencimentoEntrada.dia > parcela.dia) {
                difDias = vencimentoEntrada.dia - parcela.dia; 
                if (parcela_atualizada > 0) {
                    proRata = Number(((parcela_atualizada - parcela_selecionada) / 30) * difDias).toFixed(2);                    
                } else {
                    proRata = 0; 
                }
                console.log('return 1', {linhaParcela: linhaParcela, difDias: difDias, proRata: Math.abs(proRata)}); 

                dt.calculoPR = {difDias: difDias, proRata: Math.abs(proRata)}
                
                dd = Number(dd + difDias);
                arrayPR.push(proRata);
                
                // return {linhaParcela: linhaParcela, difDias: difDias, proRata: proRata}
            } else {
                // console.log('return 2', {linhaParcela: linhaParcela, difDias: 0, proRata: 0});
                
                dt.calculoPR = {difDias: 0, proRata: 0}

                dd = Number(dd + 0);
                arrayPR.push(0);

                // return {linhaParcela: linhaParcela, difDias: 0, proRata: 0}
            }
        }
    });
    // console.log(JSON.stringify({difDias: dd, arrayPR: arrayPR}));
    
    var pr = 0;

    arrayPR.forEach(function(aPR) {
        pr = parseFloat(pr) + parseFloat(aPR);
    });

    console.log(JSON.stringify({
        difDias: dd, 
        proRata: Number(Math.abs(pr)).toFixed(2),
        arrayParcelas: dt2
    }));
    // /**
    //  * difDias: somatório (diferença total de dias entre o vencimento entrada e o vencimento de cada parcela selecionada)
    //  * proRata: somatório (pro rata de cada parcela selecionada)
    //  */
    return {difDias: dd, proRata: Number(Math.abs(pr)).toFixed(2), arrayParcelas: dt2};
}

function atualizacaoMonetaria(reneg, dt1, dt2) {
    console.log('atualizacaoMonetaria', {reneg: reneg, dt1: dt1, dt2: dt2});    
    var primeiroVencimento = {
        dia: dt1.getDate() > 9 ? dt1.getDate() : '0'+dt1.getDate(),
        mes: dt1.getMonth() > 9 ? dt1.getMonth()+1 : '0'+(dt1.getMonth()+1),
        ano: dt1.getFullYear()
    }
    // console.log('primeiroVencimento', primeiroVencimento);

    if (primeiroVencimento.mes == 00) {
        primeiroVencimento.mes = 12;
    } 
    // console.log('primeiroVencimento.mes', primeiroVencimento.mes);

    const splitDt2 = dt2[0].vencimento.split('/');
    // console.log('splitDt2', splitDt2);

    const format_dt2 = new Date(splitDt2[2], splitDt2[1], splitDt2[0]);
    // console.log('format_dt2', format_dt2);

    var parcela = {
        dia: format_dt2.getDate() > 9 ? format_dt2.getDate() : '0'+format_dt2.getDate(),
        mes: format_dt2.getMonth() > 9 ? format_dt2.getMonth() : '0'+format_dt2.getMonth(),
        ano: format_dt2.getFullYear()
    }
    // console.log('parcela', parcela);

    if (parcela.mes == 00) {
        parcela.mes = 12;
    }
    // console.log('parcela.mes', parcela.mes);

    var fator_anterior2, fator_anterior3;
    valor_atualizacao_monetaria = 0;

    if (reneg == 'Amortização') {
        fator_anterior2 = fatorCorrecao(primeiroVencimento.mes, 'anterior2', dt2[0].indice);
        fator_anterior3 = fatorCorrecao(primeiroVencimento.mes, 'anterior3', dt2[0].indice);    
        valor_atualizacao_monetaria = valor_atualizacao_monetaria + (((fator_anterior2 / fator_anterior3) - 1) * dt2[0].valorAtualizado);
        console.log('valor_atualizacao_monetaria', valor_atualizacao_monetaria);
    } else {
        for (i=0; i<dt2.length; i++) {
            fator_anterior2 = fatorCorrecao(primeiroVencimento.mes, 'anterior2', dt2[i].indice);
            fator_anterior3 = fatorCorrecao(primeiroVencimento.mes, 'anterior3', dt2[i].indice);    
            valor_atualizacao_monetaria = valor_atualizacao_monetaria + (((fator_anterior2 / fator_anterior3) - 1) * dt2[0].valorAtualizado);
            console.log('valor_atualizacao_monetaria', valor_atualizacao_monetaria);
        }
    }   

    return Number(valor_atualizacao_monetaria).toFixed(2);
}

// Pro Rata Amortização
function calcularProRata(reneg, dt1, dt2, registroAtual, dt3) {    
    console.log('calcularProRata', {dt1: dt1, dt2: dt2, registroAtual: registroAtual, dt3: dt3});
    const listaParcelas = custPage+'sublista_lista_parcelas';
    
    var primeiroVencimento = {
        dia: dt1.getDate() > 9 ? dt1.getDate() : '0'+dt1.getDate(),
        mes: dt1.getMonth() > 9 ? dt1.getMonth()+1 : '0'+(dt1.getMonth()+1),
        ano: dt1.getFullYear()
    }
    // console.log('primeiroVencimento', primeiroVencimento);

    if (primeiroVencimento.mes == 00) {
        primeiroVencimento.mes = 12;
    } 
    // console.log('primeiroVencimento.mes', primeiroVencimento.mes);

    const splitDt2 = dt2[0].vencimento.split('/');
    // console.log('splitDt2', splitDt2);

    const format_dt2 = new Date(splitDt2[2], splitDt2[1], splitDt2[0]);
    // console.log('format_dt2', format_dt2);

    var parcela = {
        dia: format_dt2.getDate() > 9 ? format_dt2.getDate() : '0'+format_dt2.getDate(),
        mes: format_dt2.getMonth() > 9 ? format_dt2.getMonth() : '0'+format_dt2.getMonth(),
        ano: format_dt2.getFullYear()
    }
    // console.log('parcela', parcela);

    if (parcela.mes == 00) {
        parcela.mes = 12;
    }
    // console.log('parcela.mes', parcela.mes);

    var hoje = {
        dia: dt3.getDate() > 9 ? dt3.getDate() : '0'+dt3.getDate(),
        mes: dt3.getMonth() > 9 ? dt3.getMonth()+1 : '0'+(dt3.getMonth()+1),
        ano: dt1.getFullYear()
    }
    // console.log('primeiroVencimento', primeiroVencimento);

    if (hoje.mes == 00) {
        hoje.mes = 12;
    } 
    // console.log('hoje.mes', hoje.mes);

    // const fator_anterior2 = fatorCorrecao(primeiroVencimento.mes, 'anterior2', dt2[0].indice);
    const fator_anterior2 = fatorCorrecao(hoje.mes, 'anterior2', dt2[0].indice);
    // console.log('fator_anterior2: '+fator_anterior2, 'typeof: '+typeof(fator_anterior2));
    
    // const fator_anterior3 = fatorCorrecao(primeiroVencimento.mes, 'anterior3', dt2[0].indice);
    const fator_anterior3 = fatorCorrecao(hoje.mes, 'anterior3', dt2[0].indice);
    // console.log('fator_anterior3: '+fator_anterior3, 'typeof: '+typeof(fator_anterior3));
    
    // const fator_atual = fatorCorrecao(parcela.mes, 'atual', dt2[0].indice) || 0;
    const fator_atual = fatorCorrecao(hoje.mes, 'atual', dt2[0].indice) || 0;
    // console.log('fator_atual', fator_atual);
    
    const linhaParcela = dt2[0].linha;
    // console.log('linhaParcela', linhaParcela);
    
    var parcela_selecionada, parcela_atualizada, difDias, proRata;

    if (reneg == 'Amortização') {
        parcela_selecionada = registroAtual.getSublistValue({
            sublistId: listaParcelas,
            fieldId: custPage+'valor_atualizado',
            line: linhaParcela
            // line: linhaParcela-1
        });
        // console.log('parcela_selecionada: '+parcela_selecionada, 'typeof: '+typeof(parcela_selecionada));
        
        if (fator_anterior2 > 0 && fator_anterior3 > 0) {
            // parcela_atualizada = Number((fator_anterior2 / fator_anterior3) * parcela_selecionada).toFixed(6);  
            // parcela_atualizada = Number(((fator_anterior2 / fator_anterior3) - 1) * parcela_selecionada).toFixed(6); 
            parcela_atualizada = Number((((fator_anterior2 / fator_anterior3) - 1) * parcela_selecionada) + parcela_selecionada).toFixed(6);          
        } else {
            parcela_atualizada = 0;
        }
        // console.log('parcela_atualizada', parcela_atualizada);        
        
        if (primeiroVencimento.dia > parcela.dia) {
            difDias = primeiroVencimento.dia - parcela.dia; 
            if (parcela_atualizada > 0) {
                proRata = Number(((parcela_atualizada - parcela_selecionada) / 30) * difDias).toFixed(2);                    
            } else {
                proRata = 0; 
            }
            // console.log('return 1', {difDias: difDias, proRata: Math.abs(proRata)});               
            
            return {difDias: difDias, proRata: Math.abs(proRata)}
        } else {
            // console.log('return 1', {difDias: 0, proRata: 0});    
            return {difDias: 0, proRata: 0}
        }
    }   
}

function ultimoDiaMes(mes2, ano) {
    console.log('ultimoDiaMes', {mes2: mes2, ano: ano});
    var ultimoDia;

    var mes = mes2 > '9' ? mes2 : '0'+mes2;
    // console.log('mes', mes);

    if (typeof(mes) == 'number') {
        mes = String(mes);
    }
    // console.log('typeof(mes)', typeof(mes));

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
    // console.log('ultimoDia(mes)', ultimoDia);
 
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
            ano = new Date().getFullYear();
            // ano = new Date().getFullYear() - 1;
        } else {
            ano = new Date().getFullYear();
        }
        // console.log('ano', ano);

        var periodo =  {
            inicio: "01/"+(mes2 > 9 ? mes2 : '0'+mes2)+"/"+ano,
            fim: ultimoDiaMes(mes2, ano)
        }
        // console.log('periodo', periodo);

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
        // console.log('bsc_UnidadeCorrecao', JSON.stringify(bsc_UnidadeCorrecao));

        if (bsc_UnidadeCorrecao.length > 0) {
            for (i=0; i<bsc_UnidadeCorrecao.length; i++) {
                var fator_atualizado = Number(bsc_UnidadeCorrecao[i].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(6);
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
        // console.log('ANO', ANO);

        var periodo =  {
            inicio: "01/"+(mes3 > 9 ? mes3 : '0'+mes3)+"/"+ANO,
            fim: ultimoDiaMes(mes3, ANO)
        }
        // console.log('periodo', periodo);

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
        // console.log('bsc_UnidadeCorrecao', JSON.stringify(bsc_UnidadeCorrecao));

        if (bsc_UnidadeCorrecao.length > 0) {
            console.log('anterior3', Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(6));
            return Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(6);
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
        // console.log('bsc_UnidadeCorrecao', JSON.stringify(bsc_UnidadeCorrecao));

        if (bsc_UnidadeCorrecao.length > 0) {
            console.log('anterior', Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(6) || 0);
            return Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(6) || 0;
        }
    }
}

function pageInit(context) {
    const registroAtual = context.currentRecord;

    const campo_valorEntrada = registroAtual.getField({fieldId: custPage+'valor_entrada'});
    const campo_reparcelarEm = registroAtual.getField({fieldId: custPage+'reparcelar_em'});
    const campo_vencimentoEntrada = registroAtual.getField({fieldId: custPage+'vencimento_entrada'});
    const campo_dataInicio = registroAtual.getField({fieldId: custPage+'data_inicio'});
    const campo_jurosMora = registroAtual.getField({fieldId: custPage+'juros_mora'});
    const campo_dif_dias = registroAtual.getField({fieldId: custPage+'dif_dias'});
    const campo_pro_rata_calculado = registroAtual.getField({fieldId: custPage+'pro_rata_calculado'});

    campo_valorEntrada.isVisible = campo_reparcelarEm.isVisible = campo_vencimentoEntrada.isVisible = campo_dataInicio.isVisible = campo_jurosMora.isVisible = campo_dif_dias.isVisible = campo_pro_rata_calculado.isVisible = false;
    campo_valorEntrada.isDisplay = campo_reparcelarEm.isDisplay = campo_vencimentoEntrada.isDisplay = campo_dataInicio.isDisplay = campo_jurosMora.isDisplay = campo_dif_dias.isDisplay = campo_pro_rata_calculado.isDisplay = false;

    const listaParcelas = custPage+'sublista_lista_parcelas';
}

function saveRecord(context) {
    const registroAtual = context.currentRecord;

    var usuarioAtual = runtime.getCurrentUser();
    console.log('usuarioAtual', JSON.stringify(usuarioAtual));

    // if (usuarioAtual.id != 3588) {
    //     dialog.alert({
    //         title: 'Aviso!',
    //         message: 'Simulação Servidor em testes.'
    //     });

    //     return false;
    // } else {
        var simula = simulacao('servidor');
        console.log('simula', simula);

        if (simula) {
            registroAtual.setValue(custPage+'json_sp', simula);

            return true;
        }       
    // }
}

function validateField(context) {}

function fieldChanged(context) {
    const registroAtual = context.currentRecord;

    const totalFinanciado = registroAtual.getValue({fieldId: custPage+'total_financiado'});

    var campo = context.fieldId;

    const listaParcelas = custPage+'sublista_lista_parcelas';

    if (campo == custPage+'vencimento_entrada') {
        var vencimentoEntrada = registroAtual.getText({fieldId: campo});

        if (validarDataVencimento(vencimentoEntrada) == false) {
            registroAtual.setValue({
                fieldId: custPage+'vencimento_entrada',
                value: ''
            });

            dialog.alert({
                title: 'Aviso!',
                message: 'Vencimento Entrada deve ser maior/igual a data de hoje.'
            });

            return false;
        }
    }

    if (campo == custPage+'data_inicio') {
        var primeiroVencimento = registroAtual.getText({fieldId: campo});

        if (validarDataVencimento(primeiroVencimento) == false) {
            registroAtual.setValue({
                fieldId: custPage+'data_inicio',
                value: ''
            });

            dialog.alert({
                title: 'Aviso!',
                message: 'Primeiro vencimento deve ser maior/igual a data de hoje.'
            });

            return false;
        }
    }

    if (campo == custPage+'reparcelar_em') {
        var reparcelarEm = registroAtual.getValue({fieldId: campo});

        if (reparcelarEm > 0 && reparcelarEm > 120) {
            registroAtual.setValue({
                fieldId: custPage+'reparcelar_em',
                value: 120
            });

            dialog.alert({
                title: 'Aviso!',
                message: 'Quantidade limitada a 120 parcelas.'
            });

            return false;
        }
    }

    if (campo == custPage+'renegociacao') {
        var renegociacao = registroAtual.getValue({fieldId: campo});

        switch (renegociacao) {
            case '':                
                // Desabilita os campos abaixo:
                var campo_primeiro_vencimento = registroAtual.getField({fieldId: custPage+'data_inicio'});
                var campo_vencimento_entrada = registroAtual.getField({fieldId: custPage+'vencimento_entrada'});                
                var campo_reparcelarEm = registroAtual.getField({fieldId: custPage+'reparcelar_em'});

                campo_reparcelarEm.isVisible = campo_reparcelarEm.isDisplay = false;                    
                campo_vencimento_entrada.isVisible = campo_vencimento_entrada.isDisplay = false;
                campo_primeiro_vencimento.isVisible = campo_primeiro_vencimento.isDisplay = false;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    var reparcelar = registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'reparcelar',
                        line: i
                    });

                    if (reparcelar == true) {
                        registroAtual.selectLine({
                            sublistId: listaParcelas,
                            line: i
                        });                    

                        registroAtual.setCurrentSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'reparcelar',
                            value: false
                        });

                        registroAtual.commitLine({
                            sublistId: listaParcelas
                        });
                    }
                }
            break;

            case 'Amortização':
                var campo_primeiro_vencimento = registroAtual.getField({fieldId: custPage+'data_inicio'});
                var campo_difDias = registroAtual.getField({fieldId: custPage+'dif_dias'});
                var campo_pro_rata_calculado = registroAtual.getField({fieldId: custPage+'pro_rata_calculado'});
                campo_primeiro_vencimento.isVisible = campo_primeiro_vencimento.isDisplay = true;
                campo_difDias.isVisible = campo_difDias.isDisplay = true;
                campo_pro_rata_calculado.isVisible = campo_pro_rata_calculado.isDisplay = true;

                // Desabilita os campos abaixo:
                var campo_vencimento_entrada = registroAtual.getField({fieldId: custPage+'vencimento_entrada'});                
                var campo_reparcelarEm = registroAtual.getField({fieldId: custPage+'reparcelar_em'});
                campo_reparcelarEm.isVisible = campo_reparcelarEm.isDisplay = false;                
                campo_vencimento_entrada.isVisible = campo_vencimento_entrada.isDisplay = false;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    var vencimento = registroAtual.getSublistText({
                        sublistId: listaParcelas,
                        fieldId: custPage+'parcela',
                        line: i
                    });

                    if (validarDataVencimento2(vencimento) == false) {
                        registroAtual.setValue({
                            fieldId: campo,
                            value: ''
                        });

                        dialog.alert({
                            title: 'Aviso!',
                            message: 'Renegociação não permitida. <br> Contrato com parcelas em atraso.'
                        });

                        return false;
                    }

                    var reparcelar = registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'reparcelar',
                        line: i
                    });

                    if (reparcelar == true) {
                        registroAtual.selectLine({
                            sublistId: listaParcelas,
                            line: i
                        });                    

                        registroAtual.setCurrentSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'reparcelar',
                            value: false
                        });

                        registroAtual.commitLine({
                            sublistId: listaParcelas
                        });
                    }
                }

                registroAtual.setValue({
                    fieldId: custPage+'data_inicio',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'vencimento_entrada',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'reparcelar_em',
                    value: ''
                });
            break;

            case 'Inadimplentes':
                var campo_primeiro_vencimento = registroAtual.getField({fieldId: custPage+'data_inicio'});
                var campo_vencimento_entrada = registroAtual.getField({fieldId: custPage+'vencimento_entrada'});                
                var campo_reparcelarEm = registroAtual.getField({fieldId: custPage+'reparcelar_em'});
                var campo_difDias = registroAtual.getField({fieldId: custPage+'dif_dias'});
                var campo_pro_rata_calculado = registroAtual.getField({fieldId: custPage+'pro_rata_calculado'});

                campo_reparcelarEm.isVisible = campo_reparcelarEm.isDisplay = true;                
                campo_vencimento_entrada.isVisible = campo_vencimento_entrada.isDisplay = true;
                campo_primeiro_vencimento.isVisible = campo_primeiro_vencimento.isDisplay = true;                
                campo_primeiro_vencimento.isVisible = campo_primeiro_vencimento.isDisplay = true;
                campo_difDias.isVisible = campo_difDias.isDisplay = true;
                campo_pro_rata_calculado.isVisible = campo_pro_rata_calculado.isDisplay = true;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    var reparcelar = registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'reparcelar',
                        line: i
                    });

                    if (reparcelar == true) {
                        registroAtual.selectLine({
                            sublistId: listaParcelas,
                            line: i
                        });                    

                        registroAtual.setCurrentSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'reparcelar',
                            value: false
                        });

                        registroAtual.commitLine({
                            sublistId: listaParcelas
                        });
                    }
                }

                registroAtual.setValue({
                    fieldId: custPage+'data_inicio',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'vencimento_entrada',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'reparcelar_em',
                    value: 0
                });
            break;

            case 'Adimplentes':
                // Desabilita os campos abaixo:
                var campo_primeiro_vencimento = registroAtual.getField({fieldId: custPage+'data_inicio'});
                var campo_vencimento_entrada = registroAtual.getField({fieldId: custPage+'vencimento_entrada'});                
                var campo_reparcelarEm = registroAtual.getField({fieldId: custPage+'reparcelar_em'});
                var campo_difDias = registroAtual.getField({fieldId: custPage+'dif_dias'});
                var campo_pro_rata_calculado = registroAtual.getField({fieldId: custPage+'pro_rata_calculado'});

                campo_reparcelarEm.isVisible = campo_reparcelarEm.isDisplay = true;                    
                campo_vencimento_entrada.isVisible = campo_vencimento_entrada.isDisplay = true;
                campo_primeiro_vencimento.isVisible = campo_primeiro_vencimento.isDisplay = true;
                campo_difDias.isVisible = campo_difDias.isDisplay = true;
                campo_pro_rata_calculado.isVisible = campo_pro_rata_calculado.isDisplay = true;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    var vencimento = registroAtual.getSublistText({
                        sublistId: listaParcelas,
                        fieldId: custPage+'parcela',
                        line: i
                    });

                    if (validarDataVencimento2(vencimento) == false) {
                        registroAtual.setValue({
                            fieldId: campo,
                            value: ''
                        });

                        dialog.alert({
                            title: 'Aviso!',
                            message: 'Renegociação não permitida. <br> Contrato com parcelas em atraso.'
                        });

                        return false;
                    }
                    var reparcelar = registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'reparcelar',
                        line: i
                    });

                    if (reparcelar == true) {
                        registroAtual.selectLine({
                            sublistId: listaParcelas,
                            line: i
                        });                    

                        registroAtual.setCurrentSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'reparcelar',
                            value: false
                        });

                        registroAtual.commitLine({
                            sublistId: listaParcelas
                        });
                    }
                }

                registroAtual.setValue({
                    fieldId: custPage+'data_inicio',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'vencimento_entrada',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'reparcelar_em',
                    value: 0
                });

                // alert('Aguardando regra...');
            break;

            case 'Recálculo de atrasos':
                var campo_primeiro_vencimento = registroAtual.getField({fieldId: custPage+'data_inicio'});
                var campo_vencimento_entrada = registroAtual.getField({fieldId: custPage+'vencimento_entrada'});                
                var campo_reparcelarEm = registroAtual.getField({fieldId: custPage+'reparcelar_em'});
                var campo_difDias = registroAtual.getField({fieldId: custPage+'dif_dias'});
                var campo_pro_rata_calculado = registroAtual.getField({fieldId: custPage+'pro_rata_calculado'});

                campo_reparcelarEm.isVisible = campo_reparcelarEm.isDisplay = false;                
                campo_vencimento_entrada.isVisible = campo_vencimento_entrada.isDisplay = true;
                campo_primeiro_vencimento.isVisible = campo_primeiro_vencimento.isDisplay = false;                
                campo_primeiro_vencimento.isVisible = campo_primeiro_vencimento.isDisplay = false;
                campo_difDias.isVisible = campo_difDias.isDisplay = false;
                campo_pro_rata_calculado.isVisible = campo_pro_rata_calculado.isDisplay = false;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    var reparcelar = registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'reparcelar',
                        line: i
                    });

                    if (reparcelar == true) {
                        registroAtual.selectLine({
                            sublistId: listaParcelas,
                            line: i
                        });                    

                        registroAtual.setCurrentSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'reparcelar',
                            value: false
                        });

                        registroAtual.commitLine({
                            sublistId: listaParcelas
                        });
                    }
                }

                registroAtual.setValue({
                    fieldId: custPage+'data_inicio',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'vencimento_entrada',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'reparcelar_em',
                    value: 0
                });
            break;

            case 'Antecipação':
                var campo_primeiro_vencimento = registroAtual.getField({fieldId: custPage+'data_inicio'});
                var campo_vencimento_entrada = registroAtual.getField({fieldId: custPage+'vencimento_entrada'});                
                var campo_reparcelarEm = registroAtual.getField({fieldId: custPage+'reparcelar_em'});
                var campo_difDias = registroAtual.getField({fieldId: custPage+'dif_dias'});
                var campo_pro_rata_calculado = registroAtual.getField({fieldId: custPage+'pro_rata_calculado'});

                campo_reparcelarEm.isVisible = campo_reparcelarEm.isDisplay = false;                
                campo_vencimento_entrada.isVisible = campo_vencimento_entrada.isDisplay = true;
                campo_primeiro_vencimento.isVisible = campo_primeiro_vencimento.isDisplay = false;                
                campo_primeiro_vencimento.isVisible = campo_primeiro_vencimento.isDisplay = false;
                campo_difDias.isVisible = campo_difDias.isDisplay = false;
                campo_pro_rata_calculado.isVisible = campo_pro_rata_calculado.isDisplay = false;

                for (i=0; i<registroAtual.getLineCount({sublistId: listaParcelas}); i++) {
                    var reparcelar = registroAtual.getSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'reparcelar',
                        line: i
                    });

                    if (reparcelar == true) {
                        registroAtual.selectLine({
                            sublistId: listaParcelas,
                            line: i
                        });                    

                        registroAtual.setCurrentSublistValue({
                            sublistId: listaParcelas,
                            fieldId: custPage+'reparcelar',
                            value: false
                        });

                        registroAtual.commitLine({
                            sublistId: listaParcelas
                        });
                    }
                }

                registroAtual.setValue({
                    fieldId: custPage+'data_inicio',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'vencimento_entrada',
                    value: ''
                });

                registroAtual.setValue({
                    fieldId: custPage+'reparcelar_em',
                    value: 0
                });
            break;
        }
    }

    if (campo == custPage+'reparcelar') {
        var parcelasMarcadas = 0;

        var linhasReparcelar = registroAtual.getLineCount({sublistId: listaParcelas});

        var renegociacao = registroAtual.getValue({fieldId: custPage+'renegociacao'});

        var linhasSelecionadas = 0;

        for (i=0; i < linhasReparcelar; i++) {
            var reparcelar = registroAtual.getSublistValue({
                sublistId: listaParcelas,
                fieldId: custPage+'reparcelar',
                line: i
            });

            if (reparcelar == true) {
                var prestacao = registroAtual.getSublistValue({
                    sublistId: listaParcelas,
                    fieldId: custPage+'valor_atualizado',
                    line: i
                });

                parcelasMarcadas += prestacao;                 

                linhasSelecionadas += 1;

                if (!renegociacao) {
                    registroAtual.selectLine({
                        sublistId: listaParcelas,
                        line: i
                    });

                    registroAtual.setCurrentSublistValue({
                        sublistId: listaParcelas,
                        fieldId: custPage+'reparcelar',
                        value: false
                    });

                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Renegociação não selecionado.'
                    });

                    return false;
                } else {
                    switch (renegociacao) {
                        case 'Amortização':
                            if (linhasSelecionadas > 1) {
                                registroAtual.selectLine({
                                    sublistId: listaParcelas,
                                    line: i
                                });
        
                                registroAtual.setCurrentSublistValue({
                                    sublistId: listaParcelas,
                                    fieldId: custPage+'reparcelar',
                                    value: false
                                });
        
                                dialog.alert({
                                    title: 'Aviso!',
                                    message: 'Selecione apenas uma parcela.'
                                });
            
                                return false;
                            }

                            var vencimento = registroAtual.getSublistText({
                                sublistId: listaParcelas,
                                fieldId: custPage+'parcela',
                                line: i
                            });
                            
                            if (validarDataVencimento2(vencimento) == false) {
                                registroAtual.setCurrentSublistValue({
                                    sublistId: listaParcelas,
                                    fieldId: custPage+'reparcelar',
                                    value: false
                                });

                                dialog.alert({
                                    title: 'Aviso!',
                                    message: 'Parcela vencida não permitido para este tipo de renegociação.'
                                });

                                return false;
                            }
                        break;

                        case 'Inadimplentes':
                            var vencimento = registroAtual.getSublistText({
                                sublistId: listaParcelas,
                                fieldId: custPage+'parcela',
                                line: i
                            });
                            
                            if (validarDataVencimento2(vencimento) == true) {
                                registroAtual.setCurrentSublistValue({
                                    sublistId: listaParcelas,
                                    fieldId: custPage+'reparcelar',
                                    value: false
                                });

                                dialog.alert({
                                    title: 'Aviso!',
                                    message: 'Parcela à vencer não permitida.'
                                });

                                return false;
                            }
                        break;

                        case 'Adimplentes':
                            var vencimento = registroAtual.getSublistText({
                                sublistId: listaParcelas,
                                fieldId: custPage+'parcela',
                                line: i
                            });
                            
                            if (validarDataVencimento2(vencimento) == false) {
                                registroAtual.setCurrentSublistValue({
                                    sublistId: listaParcelas,
                                    fieldId: custPage+'reparcelar',
                                    value: false
                                });

                                dialog.alert({
                                    title: 'Aviso!',
                                    message: 'Parcela à vencer não permitida.'
                                });

                                return false;
                            }
                        break;

                        case 'Recálculo de atrasos':
                            var vencimento = registroAtual.getSublistText({
                                sublistId: listaParcelas,
                                fieldId: custPage+'parcela',
                                line: i
                            });
                            
                            if (validarDataVencimento2(vencimento) == true) {
                                registroAtual.setCurrentSublistValue({
                                    sublistId: listaParcelas,
                                    fieldId: custPage+'reparcelar',
                                    value: false
                                });

                                dialog.alert({
                                    title: 'Aviso!',
                                    message: 'Parcela à vencer não permitida.'
                                });

                                return false;
                            }
                        break;

                        case 'Antecipação':
                            var vencimento = registroAtual.getSublistText({
                                sublistId: listaParcelas,
                                fieldId: custPage+'parcela',
                                line: i
                            });
                            
                            if (validarDataVencimento2(vencimento) == false) {
                                registroAtual.setCurrentSublistValue({
                                    sublistId: listaParcelas,
                                    fieldId: custPage+'reparcelar',
                                    value: false
                                });

                                dialog.alert({
                                    title: 'Aviso!',
                                    message: 'Parcela à vencer não permitida.'
                                });

                                return false;
                            }

                            var vencimentoEntrada = registroAtual.getText({fieldId: custPage+'vencimento_entrada'});

                            if (validarDataVencimento3(vencimentoEntrada, vencimento) == false) {
                                registroAtual.setCurrentSublistValue({
                                    sublistId: listaParcelas,
                                    fieldId: custPage+'reparcelar',
                                    value: false
                                });
                                
                                dialog.alert({
                                    title: 'Aviso!',
                                    message: 'Vencimento entrada não pode ser maior/igual ao vencimento da parcela.'
                                });

                                return false;
                            }
                        break;
                    }
                       
                }
            }
        }

        var custoTotal = totalFinanciado - parcelasMarcadas;

        registroAtual.setValue({
            fieldId: custPage+'parcelas_marcadas', 
            value: parcelasMarcadas.toFixed(2)
        });

        registroAtual.setValue({
            fieldId: custPage+'custo_total', 
            value: parcelasMarcadas > totalFinanciado ? 0 : custoTotal.toFixed(2)
        });
    }
}

function postSourcing(context) {}

function lineInit(context) {}

function validateDelete(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function sublistChanged(context) {}

return {
    voltar: voltar,
    marcarTudo: marcarTudo,
    desmarcarTudo: desmarcarTudo,  
    simulacao: simulacao,
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
