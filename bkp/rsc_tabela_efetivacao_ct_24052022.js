/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
const remetente = -5;
const destinatario = 3588;
const copia = [4550];
const ZERO = Number('0').toFixed(2);

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

define(['N/currentRecord', 'N/email', 'N/https', 'N/record', 'N/runtime', 'N/search', 'N/ui/dialog', 'N/transaction', 'N/url'], (currentRecord, email, https, record, runtime, search, dialog, transaction, url) => {
const urlTransacao = (dados) => {
    return url.resolveRecord({
        recordType: dados.registro,
        recordId: dados.id
    });
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

const contratoFI = (fi) => {
    const bscFI = search.lookupFields({type: 'invoice',
        id: fi.id,
        columns: [fi.campo]
    });

    if (fi.campo == 'tranid') {
        return bscFI[fi.campo];
    }

    return bscFI[fi.campo].length > 0 ? bscFI[fi.campo][0].text : '';
}

const hoje = (info) => {
    const data = new Date();

    var dia = data.getDate();

    var mes;

    var ano = data.getFullYear();
    
    switch (data.getMonth()) {
        case 0: mes = info == 'cabeçalho' ? 'Janeiro' : '01'; break;
        case 1: mes = info == 'cabeçalho' ? 'Feveireiro' : '02'; break;
        case 2: mes = info == 'cabeçalho' ? 'Março' : '03'; break;
        case 3: mes = info == 'cabeçalho' ? 'Abril' : '04'; break;
        case 4: mes = info == 'cabeçalho' ? 'Maio' : '05'; break;
        case 5: mes = info == 'cabeçalho' ? 'Junho' : '06'; break;
        case 6: mes = info == 'cabeçalho' ? 'Julho' : '07'; break;
        case 7: mes = info == 'cabeçalho' ? 'Agosto' : '08'; break;
        case 8: mes = info == 'cabeçalho' ? 'Setembro' : '09'; break;
        case 9: mes = info == 'cabeçalho' ? 'Outubro' : '10'; break;
        case 10: mes = info == 'cabeçalho' ? 'Novembro' : '11'; break;
        case 11: mes = info == 'cabeçalho' ? 'Dezembro' : '12'; break;
    }

    if (info == 'cabeçalho') {
        return 'São Paulo, '+dia+' de '+mes+' de '+ano;
    } else {
        return  mes+'/'+ano;
    }    
}

const baixarBoleto = (idBoleto, idReneg) => {
    console.log('baixarBoleto', {idBoleto: idBoleto, idReneg: idReneg});

    try {  
        console.log('Anulando boleto: '+idBoleto);
        voidTransaction = transaction.void({type: 'creditmemo', id: idBoleto});
        console.log('voidTransaction', voidTransaction);

        return {status: 'Void'}
    } catch(e) {
        console.log('Erro baixarBoleto', e);
        dialog.alert({
            title: 'Aviso!',
            message: 'Houve um erro no processamento da solicitação.'
        });
    }
}

const enviarMinutaBoleto = (ordem) => {
    const registroAtual = currentRecord.get();

    var ambiente = runtime.envType;

    const loadReg = record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: registroAtual.id});
    
    const contrato_fatura_principal = {
        text: loadReg.getText('custrecord_rsc_contrato_fatura_principal'),
        value: loadReg.getValue('custrecord_rsc_contrato_fatura_principal')
    }   
    
    const dataRenegociacao = loadReg.getValue('custrecord_rsc_data_renegociacao');
    const cliente = loadReg.getText('custrecord_rsc_cliente');
    const empreendimento = loadReg.getText('custrecord_rsc_empreedimento');
    const unidade = loadReg.getText('custrecord_rsc_unidade');
    const indice = search.lookupFields({type: 'salesorder', id: contrato_fatura_principal.value, columns: 'custbody_rsc_indice'}).custbody_rsc_indice;
    const total_fatura_principal = Number(loadReg.getValue('custrecord_rsc_total_fatura_principal')).toFixed(2);
    const primeiroVencimento = loadReg.getText('custrecord_rsc_primeiro_vencimento');
    const juros = loadReg.getValue('custrecord_rsc_juros_de_mora');
    const observacao = loadReg.getValue('custrecord_rsc_observacao_memo');

    // Dados para Efetivação (Reparcelamento)
    const tipoRenegociacao = loadReg.getValue('custrecord_rsc_tipo_renegociacao');
    const total_novas_parcelas = Number(loadReg.getValue('custrecord_rsc_total_novas_parcelas')).toFixed(2);

    // Parcelas
    var parcelas = [];
    
    for (i=0; i<loadReg.getLineCount('recmachcustrecord_rsc_resumo_reparcelamento'); i++) {
        var jurosPrice = loadReg.getSublistValue('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_juros_price', i);
        console.log('jurosPrice', jurosPrice);

        var novaParcela = loadReg.getSublistValue('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_nova_parcela', i);
        
        var numero_nova_parcela;
        if (novaParcela) {
            numero_nova_parcela = contratoFI({id: novaParcela, campo: 'tranid'});
            console.log('numero_nova_parcela', numero_nova_parcela);
        }        

        parcelas.push({
            'ID': novaParcela,
            'Nr. Parc.': numero_nova_parcela ? numero_nova_parcela : i+1,
            'Índice de Reajuste': loadReg.getSublistText('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_indice', i),
            'Period. Venc.': loadReg.getSublistText('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_tipo_parcela', i),
            'Valor Parc. (R$)': Number(loadReg.getSublistValue('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_prestacao', i)).toFixed(2),
            'Total Princ.': Number(jurosPrice) || Number(loadReg.getSublistValue('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_juros_price', i)).toFixed(2),
            '1º Vencimento': loadReg.getSublistText('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_parcela', i),
            'Juros': loadReg.getSublistText('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_data_juros', i) ? 'Sim' : 'Não',
            'Pro Rata': Number(loadReg.getSublistValue('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_pro_rata_am', i)).toFixed(2),
            'Multa': Number(loadReg.getSublistValue('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_multa_reneg', i)).toFixed(2),
            'Juros Reneg': Number(loadReg.getSublistValue('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_juros_reneg', i)).toFixed(2),
            'Data Juros': loadReg.getSublistText('recmachcustrecord_rsc_resumo_reparcelamento', 'custrecord_rsc_data_juros', i)
        });
    }
    console.log('parcelas', JSON.stringify(parcelas));

    var resumo = [];

    for (i=0; i<loadReg.getLineCount('recmachcustrecord_rsc_resumo'); i++) {
        var jurosMulta = parseFloat(loadReg.getSublistText('recmachcustrecord_rsc_resumo', 'custrecord_rsc_multa_parcela', i)) + 
        parseFloat(loadReg.getSublistText('recmachcustrecord_rsc_resumo', 'custrecord_rsc_juros_parcela', i));
        resumo.push({
            'ID': loadReg.getSublistValue('recmachcustrecord_rsc_resumo', 'custrecord_rsc_parcela_contrato', i),
            'Nr. Parc.': contratoFI({id: loadReg.getSublistValue('recmachcustrecord_rsc_resumo', 'custrecord_rsc_parcela_contrato', i), campo: 'tranid'}),
            'Índice de Reajuste': contratoFI({id: loadReg.getSublistValue('recmachcustrecord_rsc_resumo', 'custrecord_rsc_parcela_contrato', i), campo: 'custbody_rsc_indice'}),
            'Period. Venc.': contratoFI({id: loadReg.getSublistValue('recmachcustrecord_rsc_resumo', 'custrecord_rsc_parcela_contrato', i), campo: 'custbodyrsc_tpparc'}),
            'Valor Parc. (R$)': Number(loadReg.getSublistValue('recmachcustrecord_rsc_resumo', 'custrecord_rsc_valor_parcela', i)).toFixed(2),
            'Total Princ.': Number(loadReg.getSublistValue('recmachcustrecord_rsc_resumo', 'custrecord_rsc_valor_atualizado_parcela', i)).toFixed(2),
            'Pro Rata': Number(loadReg.getSublistValue('recmachcustrecord_rsc_resumo', 'custrecord_rsc_prorata', i)).toFixed(2),
            '1º Vencimento': loadReg.getSublistText('recmachcustrecord_rsc_resumo', 'custrecord_rsc_vencimento_parcela', i),
            // 'Juros': jurosMulta > 0 ? 'Sim' : 'Não',
            'Juros': loadReg.getSublistText('recmachcustrecord_rsc_resumo', 'custrecord_rsc_datajuros', i) ? 'Sim' : 'Não',
            'Dt Juros': loadReg.getSublistText('recmachcustrecord_rsc_resumo', 'custrecord_rsc_datajuros', i)
        });
    }
    console.log('resumo', JSON.stringify(resumo));

    var json = {
        tabelaEfetivacao: loadReg.id,
        dataRenegociacao: dataRenegociacao,
        contrato_fatura_principal: contrato_fatura_principal,
        cliente: cliente,
        empreendimento: empreendimento,
        unidade: unidade,
        indice: indice,
        total_fatura_principal: total_fatura_principal,
        primeiroVencimento: primeiroVencimento,
        juros: juros,
        observacao: observacao,
        tipoRenegociacao: tipoRenegociacao,
        total_novas_parcelas: total_novas_parcelas,
        parcelas: parcelas,
        resumo: resumo,
        ordem: ordem
    }
    console.log('json', JSON.stringify(json));
    
    try {
        var urlExterna = url.resolveScript({
            scriptId: 'customscript_rsc_tab_efetiv_reparcela_st',
            deploymentId: 'customdeploy_rsc_tab_efetiv_reparcela_st',
            returnExternalUrl: true
        });
        console.log(urlExterna, urlExterna);

        var response = https.post({// RSC Tabela Efetivação Reparcelamento ST
            url: urlExterna,
            body: JSON.stringify(json)
        });
        console.log('response', JSON.stringify(response));

        if (response.code == 200) {
            var body = JSON.parse(response.body);
            console.log('body', body);

            if (body.status == 'Sucesso') {
                if (!ordem) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Minuta/Boleto enviado com sucesso!'
                    });
                } else {
                    return body.pdf;
                }
            }            
        } else {
            dialog.alert({
                title: 'Aviso!',
                message: 'Erro no processamento da solicitação.'
            }); 
        }
    } catch (e) {
        console.log('Erro ao enviar minuta/boleto: '+e);
        dialog.alert({
            title: 'Aviso!',
            message: 'Erro ao enviar minuta/boleto: '+'\n'+e.message
        });
    }    
}

const imprimirMinutaBoleto = () => {
    const print = enviarMinutaBoleto('Imprimir');
    console.log('print', print);
    window.open(print);
}

const implantacao = () => {
    const registroAtual = currentRecord.get();

    var ambiente = runtime.envType;

    var bscTabelaEfetivacao = search.create({type: "customrecord_rsc_tab_efetiva_reparcela",
        filters: [
           ["internalid","anyof",registroAtual.id]
        ],
        columns: [
            "custrecord_rsc_data_renegociacao","custrecord_rsc_status_aprovacao","custrecord_rsc_contrato_fatura_principal","custrecord_rsc_cliente","custrecord_rsc_total_prestacoes_marcadas",
            "custrecord_rsc_unidade","custrecord_rsc_reparcelamento_2","custrecord_rsc_valor_financiado","custrecord_rsc_total_prestacoes_marcadas","custrecord_rsc_valor_total","custrecord_rsc_valor_da_entrada",
            "custrecord_rsc_vencimento_da_entrada","custrecord_rsc_tipo_renegociacao","custrecord_rsc_novo_valor","custrecord_rsc_novo_vencimento","custrecord_rsc_criador_ter","custrecord_rsc_boleto"
        ]
    }).run().getRange(0,1);
    console.log('bscTabelaEfetivacao: '+JSON.stringify(bscTabelaEfetivacao));

    if (bscTabelaEfetivacao[0].getValue('custrecord_rsc_status_aprovacao') == 1) {
        dialog.alert({
            title: 'Aviso!',
            message: 'Tabela Efetivação deve estar aprovada!'
        });

        return false;
    }

    // if (bscTabelaEfetivacao[0].getValue('custrecord_rsc_status_aprovacao') == 2 && bscTabelaEfetivacao[0].getValue('custrecord_rsc_criador_ter') == runtime.getCurrentUser().id) {
    //     dialog.alert({
    //         title: 'Aviso!',
    //         message: 'Aprovador deve ser diferente do criador da tabela. \n Verifique campo "Criador TER".'
    //     });

    //     return false;
    // }

    if (bscTabelaEfetivacao[0].getValue('custrecord_rsc_reparcelamento_2')) {
        var bscReparcelamento2 = search.create({type: "customrecord_rsc_reparcelamento_2",
            filters: [
               ["internalid","anyof",bscTabelaEfetivacao[0].getValue('custrecord_rsc_reparcelamento_2')]
            ],
            columns: [
                "custrecord_rsc_status"
            ]
        }).run().getRange(0,1);

        dialog.alert({
            title: 'Status',
            message: bscReparcelamento2[0].getText('custrecord_rsc_status')
        });

        return false;
    }

    var parcelas = [];
    var resumo = [];

    const bsc_linhas_parcelas = search.create({type: "customrecord_rsc_sublista_tab_efetivacao",
        filters: [
           ["custrecord_rsc_resumo_reparcelamento","anyof",registroAtual.id]
        ],
        columns: [
            "custrecord_rsc_tipo_parcela","custrecord_rsc_indice","custrecord_rsc_data_juros","custrecord_rsc_parcela","custrecord_rsc_prestacao","custrecord_rsc_juros_price","custrecord_rsc_valor_amortizar",
            "custrecord_rsc_pro_rata_am","custrecord_rsc_multa_reneg","custrecord_rsc_juros_reneg","custrecord_rsc_espelho"
        ]
    }).run().getRange(0,1000);

    if (bsc_linhas_parcelas.length > 0) {
        for (i=0; i<bsc_linhas_parcelas.length; i++) {
            if (validarVencimento(bsc_linhas_parcelas[i].getValue('custrecord_rsc_parcela'), new Date()).status == true) {
                dialog.alert({
                    title: 'Aviso!',
                    message: 'Implantação não permitida para parcelas vencidas.'
                });

                return false;
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
                espelho: bsc_linhas_parcelas[i].getValue('custrecord_rsc_espelho'),
                manual: true
            });
        }
    }
    
    const bsc_linhasResumo = search.create({type: "customrecord_rsc_sublista_resumo",
        filters: [
            ["custrecord_rsc_resumo","anyof",registroAtual.id]
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
        idBoleto: bscTabelaEfetivacao[0].getValue('custrecord_rsc_boleto'),
        // idBoleto: baixarBoleto(bscTabelaEfetivacao[0].getValue('custrecord_rsc_boleto'), registroAtual.id),
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
            custrecord_rsc_tipo_renegociacao: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_da_entrada'),
            custrecord_rsc_vencimento_entrada: bscTabelaEfetivacao[0].getValue('custrecord_rsc_vencimento_da_entrada') || parcelas[0].parcela,
            custrecord_rsc_fatura_principal: bscTabelaEfetivacao[0].getValue('custrecord_rsc_contrato_fatura_principal'),
            custrecord_rsc_enviado: true,
            custrecord_rsc_status: 1,
            resumo: resumo
        }),
        parcelas: parcelas,
        resumo: resumo        
    };
    console.log('json: '+JSON.stringify(json));

    var urlExterna = url.resolveScript({
        scriptId: 'customscript_rsc_fatura_novas_parc_2_st',
        deploymentId: 'customdeploy_rsc_fatura_novas_parc_2_st',
        returnExternalUrl: true
    });
    console.log(urlExterna, urlExterna);

    // Suitelet: RSC Fatura Novas Parcelas 2 ST
    response = https.post({
        url: urlExterna,
        body: JSON.stringify(json)
    });
    console.log('code: '+response.code+', body: '+response.body);

    if (response.code == 200) {
        var loadReg = record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: registroAtual.id});
        console.log('loadReg: '+JSON.stringify(loadReg));
        loadReg.setValue({fieldId: 'custrecord_rsc_reparcelamento_2', value: json.reparcelamento2Id})
        .save({ignoreMandatoryFields: true});
        // Recarrega a página
        document.location.reload(true);
    } else {
        dialog.alert({
            title: 'Erro',
            message: 'Houve um erro no envio da solicitação. Tente novamente.'
        });

        return false;
    }

    // if (bscTabelaEfetivacao[0].getValue('custrecord_rsc_tipo_renegociacao') == 4 || bscTabelaEfetivacao[0].getValue('custrecord_rsc_tipo_renegociacao') == 5) {
    //     json = {
    //         tarefa: 'boleto',
    //         tabelaEfetivacaoId: bscTabelaEfetivacao[0].id,
    //         idFaturaPrincipal: bscTabelaEfetivacao[0].getValue('custrecord_rsc_contrato_fatura_principal'),             
    //         linkFaturaPrincipal: urlTransacao({registro: 'salesorder', id: bscTabelaEfetivacao[0].getValue('custrecord_rsc_contrato_fatura_principal')}),
    //         total_fatura_principal: bscTabelaEfetivacao[0].getValue('custrecord_rsc_total_prestacoes_marcadas'),    
    //         cliente: bscTabelaEfetivacao[0].getValue('custrecord_rsc_cliente'),
    //         unidade: bscTabelaEfetivacao[0].getValue('custrecord_rsc_unidade'),
    //         jsonReparcelamento: resumo,
    //         renegociacao: bscTabelaEfetivacao[0].getValue('custrecord_rsc_tipo_renegociacao'),
    //         jsonRenegociacao: parcelas,
    //         observacoes: bscTabelaEfetivacao[0].getText('custrecord_rsc_observacao_memo'),
    //         dataInicio: bscTabelaEfetivacao[0].getText('custrecord_rsc_primeiro_vencimento'),
    //         vencimentoEntrada: bscTabelaEfetivacao[0].getValue('custrecord_rsc_vencimento_da_entrada'),
    //         total_novas_parcelas: bscTabelaEfetivacao[0].getValue('custrecord_rsc_total_prestacoes_marcadas'),
    //         novoVencimento: bscTabelaEfetivacao[0].getValue('custrecord_rsc_novo_vencimento'),
    //         novoValor: bscTabelaEfetivacao[0].getText('custrecord_rsc_novo_valor'),
    //         vencimentoParcela: resumo[0].vencimentoParcela,       
    //     };
    //     console.log('json: '+JSON.stringify(json));

    //     // Suitelet: RSC Fatura Novas Parcelas 2 ST
    //     response = https.post({
    //         url: 'https://5843489-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=995&deploy=1',
    //         body: JSON.stringify(json)
    //     });
    //     console.log('response', response);

    //     if (response.code == 200) {
    //         const boleto = JSON.parse(response.body);

    //         if (boleto.status == 'Sucesso') {
    //             // Recarrega a página
    //             document.location.reload(true);
    //         } else if (boleto.status == 'error_update_reneg') {
    //             dialog.alert({
    //                 title: 'Aviso!',
    //                 message: 'Boleto gerado: '+boleto.no_memo_credito+'<br>'+
    //                 'Porém, houve um erro na atualização da renegociação.'
    //             });
    //         } else {
    //             dialog.alert({
    //                 title: 'Aviso!',
    //                 message: 'Houve um erro no processamento da solicitação.'
    //             });
    //         }  
    //     }           
    // } else {
    //     json = {
    //         tabelaEfetivacaoId: bscTabelaEfetivacao[0].id,
    //         recalcIndex: validarVencimento(bscTabelaEfetivacao[0].getValue('custrecord_rsc_data_renegociacao'), new Date()),
    //         contrato_fatura_principal: bscTabelaEfetivacao[0].getValue('custrecord_rsc_contrato_fatura_principal'),
    //         custrecord_rsc_tipo_renegociacao: bscTabelaEfetivacao[0].getValue('custrecord_rsc_tipo_renegociacao'),    
    //         custrecord_rsc_novo_valor: bscTabelaEfetivacao[0].getValue('custrecord_rsc_novo_valor'),
    //         custrecord_rsc_novo_vencimento: bscTabelaEfetivacao[0].getValue('custrecord_rsc_novo_vencimento'),
    //         reparcelamento2Id: gerarReparcelamento2({
    //             custrecord_rsc_total_financiado: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_financiado') || 0,
    //             custrecord_rsc_total_parcelas_marcadas: bscTabelaEfetivacao[0].getValue('custrecord_rsc_total_prestacoes_marcadas') || 0,
    //             custrecord_custo_total: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_total') || 0,
    //             custrecord_rsc_valor_entrada: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_da_entrada') || 0,
    //             custrecord_rsc_vencimento_entrada: bscTabelaEfetivacao[0].getValue('custrecord_rsc_vencimento_da_entrada') || parcelas[0].parcela,
    //             custrecord_rsc_fatura_principal: bscTabelaEfetivacao[0].getValue('custrecord_rsc_contrato_fatura_principal'),
    //             custrecord_rsc_enviado: true,
    //             custrecord_rsc_status: 1,
    //             resumo: resumo
    //         }),
    //         parcelas: parcelas,
    //         resumo: resumo        
    //     };
    //     console.log('json: '+JSON.stringify(json));
    
    //     // Suitelet: RSC Fatura Novas Parcelas 2 ST
    //     response = https.post({
    //         url: 'https://5843489-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=995&deploy=1&compid=5843489_SB1&h=fc3cbe0ae05453aaef22',
    //         body: JSON.stringify(json)
    //     });
    //     console.log('code: '+response.code+', body: '+response.body);
    
    //     if (response.code == 200) {
    //         var loadReg = record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: registroAtual.id});
    //         console.log('loadReg: '+JSON.stringify(loadReg));
    //         loadReg.setValue({fieldId: 'custrecord_rsc_reparcelamento_2', value: json.reparcelamento2Id})
    //         .save({ignoreMandatoryFields: true});
    //         // Recarrega a página
    //         document.location.reload(true);
    //     } else {
    //         dialog.alert({
    //             title: 'Erro',
    //             message: 'Houve um erro no envio da solicitação. Tente novamente.'
    //         });
    
    //         return false;
    //     }   
    // }    
}

const gerarReparcelamento2 = (campos) => {
    console.log('gerarReparcelamento2: '+JSON.stringify(campos));

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
    console.log('reparcelamento2Id: '+reparcelamento2Id);

    if (reparcelamento2Id) {
        campos.resumo.forEach(function (parcela) {
            const loadFinanciamentoInvoice = record.load({type: 'invoice', id: parcela.parcela_contrato});
            console.log('Parcela Nº: '+loadFinanciamentoInvoice.getValue('tranid')+'. Atualizando reparcelamento destino...');

            loadFinanciamentoInvoice.setValue('custbody_rsc_reparcelamento_destino', reparcelamento2Id)
            // .setValue('custbody_rsc_tipo_renegociacao', campos.custrecord_rsc_tipo_renegociacao)
            .save({ignoreMandatoryFields: true});
        });

        return reparcelamento2Id;
    } else {
        return null;
    }
}

const formatData = (data) => {
    var partesData = data.split("/");

    var novaData = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    return novaData;
}

const pageInit = (context) => {}

const saveRecord = (context) => {
    console.log('saveRecord', context);

    const registroAtual = context.currentRecord;

    const criadorTer = registroAtual.getValue('custrecord_rsc_criador_ter');

    const statusAprovacao = registroAtual.getValue('custrecord_rsc_status_aprovacao');

    if (statusAprovacao == '2' && criadorTer == runtime.getCurrentUser().id) {        
        dialog.alert({
            title: 'Aviso!',
            message: 'Aprovador deve ser diferente do criador da tabela. \n Verifique campo "Criador TER".'
        });

        return false;
    }

    return true;
}

const validateField = (context) => {}

const fieldChanged = (context) => {}

const postSourcing = (context) => {}

const lineInit = (context) => {}

const validateDelete = (context) => {}

const validateInsert = (context) => {}

const validateLine = (context) => {}

const sublistChanged = (context) => {}

const rejeitar = () => {
    const registroAtual = currentRecord.get();

    try {
        record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: registroAtual.id})
        .setValue('custrecord_rsc_status_aprovacao', 3)
        .save({ignoreMandatoryFields: true});

        document.location.reload(true);        
    } catch(e) {
        console.log('Erro', e);
        dialog.alert({
            title: 'Aviso',
            message: 'Erro ao rejeitar renegociação.'
        });

        return false;
    }
}

const aprovar = () => {
    const registroAtual = currentRecord.get();

    var ambiente = runtime.envType;

    var urlExterna = url.resolveScript({
        scriptId: 'customscript_rsc_fatura_novas_parc_2_st',
        deploymentId: 'customdeploy_rsc_fatura_novas_parc_2_st',
        returnExternalUrl: true
    });
    console.log(urlExterna, urlExterna);

    // try {
        // Suitelet: RSC Fatura Novas Parcelas 2 ST
        var response = https.post({
            url: urlExterna,
            body: JSON.stringify({
                tarefa: 'boleto', 
                idRenegociacao: registroAtual.id
            })
        });
        console.log('code: '+response.code+', body: '+response.body);

        if (response.code == 200) {
            var retorno = JSON.parse(response.body);

            if (retorno.status == 'Sucesso') {
                // Recarrega a página
                document.location.reload(true);
            } else if (retorno.status == 'error_update_reneg') {
                record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: registroAtual.id})
                .setValue('custrecord_rsc_boleto', retorno.id)
                .setValue('custrecord_rsc_status_aprovacao', 2)
                .save({ignoreMandatoryFields: true});
                // Recarrega a página
                document.location.reload(true);
            } else {
                dialog.alert({
                    title: 'Aviso!',
                    message: 'Houve um erro no processamento da solicitação.'
                });
            }  
        } else {
            console.log('Erro', JSON.stringify({code: response.code, body: response.body}));
            dialog.alert({
                title: 'Aviso',
                message: 'Erro ao aprovar renegociação.'
            });
        }  

        // record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: registroAtual.id})
        // .setValue('custrecord_rsc_status_aprovacao', 2)
        // .save();

        // document.location.reload(true);        
    // } catch(e) {
    //     console.log('Erro', e);
    //     dialog.alert({
    //         title: 'Aviso',
    //         message: 'Erro ao aprovar renegociação.'
    //     });

    //     return false;
    // }
}

const baixaManual = () => {
    const registroAtual = currentRecord.get();

    var bscTabelaEfetivacao = search.create({type: "customrecord_rsc_tab_efetiva_reparcela",
        filters: [
            ["internalid","anyof",registroAtual.id]
        ],
        columns: [
            "custrecord_rsc_data_renegociacao","custrecord_rsc_status_aprovacao","custrecord_rsc_contrato_fatura_principal","custrecord_rsc_cliente","custrecord_rsc_total_prestacoes_marcadas",
            "custrecord_rsc_unidade","custrecord_rsc_reparcelamento_2","custrecord_rsc_valor_financiado","custrecord_rsc_total_prestacoes_marcadas","custrecord_rsc_valor_total","custrecord_rsc_valor_da_entrada",
            "custrecord_rsc_vencimento_da_entrada","custrecord_rsc_tipo_renegociacao","custrecord_rsc_novo_valor","custrecord_rsc_novo_vencimento","custrecord_rsc_criador_ter","custrecord_rsc_boleto"
        ]
    }).run().getRange(0,1);
    console.log('bscTabelaEfetivacao: '+JSON.stringify(bscTabelaEfetivacao));

    const bsc_linhasResumo = search.create({type: "customrecord_rsc_sublista_resumo",
        filters: [
            ["custrecord_rsc_resumo","anyof",registroAtual.id]
        ],
        columns: [
            "custrecord_rsc_parcela_contrato","custrecord_rsc_vencimento_parcela","custrecord_rsc_valor_parcela","custrecord_rsc_multa_parcela","custrecord_rsc_juros_parcela","custrecord_rsc_prorata",
            "custrecord_rsc_valor_atualizado_parcela"
        ]
    }).run().getRange(0,1000);
    console.log('bsc_linhasResumo', JSON.stringify(bsc_linhasResumo));
    
    var parcelasSelecionadas = bsc_linhasResumo.length;
    console.log('parcelasSelecionadas', JSON.stringify(parcelasSelecionadas));

    const bsc_linhas_parcelas = search.create({type: "customrecord_rsc_sublista_tab_efetivacao",
        filters: [
           ["custrecord_rsc_resumo_reparcelamento","anyof",registroAtual.id]
        ],
        columns: [
            "custrecord_rsc_tipo_parcela","custrecord_rsc_indice","custrecord_rsc_data_juros","custrecord_rsc_parcela","custrecord_rsc_prestacao","custrecord_rsc_juros_price","custrecord_rsc_valor_amortizar",
            "custrecord_rsc_multa_reneg","custrecord_rsc_juros_reneg","custrecord_rsc_pro_rata_am","custrecord_rsc_espelho"
        ]
    }).run().getRange(0,1000);
    console.log('bsc_linhas_parcelas', JSON.stringify(bsc_linhas_parcelas));

    var array_parcelas_selecionadas = [];    
    var resumo = [];
    var item;

    const unidadeCorrecao = (idUC) => {
        log.audit('unidadeCorrecao', idUC);
        
        var lkpUC = search.lookupFields({type: 'customrecord_rsc_correction_unit',
            id: idUC,
            columns: ['name','custrecord_rsc_ucr_calc_base_item']
        });
        log.audit('lkpUC', lkpUC);

        return lkpUC.custrecord_rsc_ucr_calc_base_item[0].value;
    }

    if (parcelasSelecionadas > 0) {
        for (i=0; i<parcelasSelecionadas; i++) {
            var loadParcela = record.load({type: 'invoice', id: bsc_linhasResumo[i].getValue('custrecord_rsc_parcela_contrato'), isDynamic: true});
            console.log('loadParcela', JSON.stringify(loadParcela));

            var duedate = bscTabelaEfetivacao[0].getValue('custrecord_rsc_vencimento_da_entrada') ? bscTabelaEfetivacao[0].getValue('custrecord_rsc_vencimento_da_entrada') :
            bscTabelaEfetivacao[0].getValue('custrecord_rsc_novo_vencimento');
            console.log('duedate', duedate);

            loadParcela.setValue('custbody_rsc_tipo_renegociacao', bscTabelaEfetivacao[0].getValue('custrecord_rsc_tipo_renegociacao'))
            .setValue('duedate', formatData(duedate));

            var jurosPrice = bsc_linhas_parcelas[0].getValue('custrecord_rsc_juros_price') / parcelasSelecionadas;
            var multa = bsc_linhasResumo[i].getValue('custrecord_rsc_multa_parcela');
            var juros = bsc_linhasResumo[i].getValue('custrecord_rsc_juros_parcela');
            var proRata = bsc_linhasResumo[i].getValue('custrecord_rsc_prorata');

            // JUROS PRICE
            if (jurosPrice > 0) {
                loadParcela.selectNewLine('item')
                .setCurrentSublistValue('item', 'item', itensAdicionais.item.JUROS_INCORRIDOS)
                .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                .setCurrentSublistValue('item', 'rate', Number(jurosPrice).toFixed(2))
                .setCurrentSublistValue('item', 'amount', Number(jurosPrice).toFixed(2))
                .commitLine('item');
            }

            // ACRÉSCIMO SOBRE FINANCIAMENTO
            if (multa > 0 || juros > 0) {
                var mj = parseFloat(multa) + parseFloat(juros);

                loadParcela.selectNewLine('item')
                .setCurrentSublistValue('item', 'item', itensAdicionais.item.ACRESCIMOS)
                .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                .setCurrentSublistValue('item', 'rate', Number(mj).toFixed(2))
                .setCurrentSublistValue('item', 'amount', Number(mj).toFixed(2))
                .commitLine('item');
            } 

            // PRO RATA
            if (proRata > 0) {
                var indice = loadParcela.getValue('custbody_rsc_indice');

                switch(indice) {
                    case '1': item = itensAdicionais.item.FRACAO_PRINCIPAL; break;
                    case '2': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCC); break;
                    case '3': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_M); break;
                    case '4': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
                    case '5': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IGP_P); break;
                    case '6': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.IPCA); break;
                    case '7': item = unidadeCorrecao(itensAdicionais.unidadeCorrecao.INCP); break;
                }
                console.log('item', item);

                loadParcela.selectNewLine('item')
                .setCurrentSublistValue('item', 'item', item)
                .setCurrentSublistValue('item', 'quantity', itensAdicionais.quantity)
                .setCurrentSublistValue('item', 'rate', Number(proRata).toFixed(2))
                .setCurrentSublistValue('item', 'amount', Number(proRata).toFixed(2))
                .commitLine('item');
            }
            
            try {
                loadParcela.save({ignoreMandatoryFields: true});
            } catch(e) {
                console.log('Erro 1', JSON.stringify(e));

                dialog.alert({
                    title: 'Aviso!',
                    message: 'Houve um erro no processamento da solicitação.'
                });
    
                return false;
            }
            
            array_parcelas_selecionadas.push(bsc_linhasResumo[i].getValue('custrecord_rsc_parcela_contrato'));

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
    console.log('array_parcelas_selecionadas', array_parcelas_selecionadas);

    var naoAplicado = [];
    
    try {
        var loadBoleto = record.load({type: 'creditmemo', id: bscTabelaEfetivacao[0].getValue('custrecord_rsc_boleto')});
        console.log('loadBoleto', loadBoleto);

        array_parcelas_selecionadas.forEach(function(idParcela) {
            var linhaAplicar = loadBoleto.findSublistLineWithValue('apply', 'internalid', idParcela);
            console.log({idparcela: idParcela, linhaAplicar: linhaAplicar});

            if (linhaAplicar != -1) {
                loadBoleto.setSublistValue('apply', 'apply', linhaAplicar, true);
            } else {
                naoAplicado.push(idParcela);
                
            }
        });
        
        console.log('naoAplicado', JSON.stringify(naoAplicado));

        if (naoAplicado.length > 0) {
            dialog.alert({
                title: 'Aviso!',
                message: 'Uma ou mais parcelas não foram localizadas para aplicação.'
            });

            return false;
        } else {
            loadBoleto.save({ignoreMandatoryFields: true});
        }       
    } catch(e) {
        console.log('Erro 2', JSON.stringify(e));

        dialog.alert({
            title: 'Aviso!',
            message: 'Houve um erro no processamento da solicitação.'
        });

        return false;
    }

    var idReparcelamento2 = gerarReparcelamento2({
        custrecord_rsc_total_financiado: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_financiado') || 0,
        custrecord_rsc_total_parcelas_marcadas: bscTabelaEfetivacao[0].getValue('custrecord_rsc_total_prestacoes_marcadas') || 0,
        custrecord_custo_total: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_total') || 0,
        custrecord_rsc_valor_entrada: bscTabelaEfetivacao[0].getValue('custrecord_rsc_valor_da_entrada') || 0,
        custrecord_rsc_vencimento_entrada: bscTabelaEfetivacao[0].getValue('custrecord_rsc_vencimento_da_entrada') || parcelas[0].parcela,
        custrecord_rsc_fatura_principal: bscTabelaEfetivacao[0].getValue('custrecord_rsc_contrato_fatura_principal'),
        custrecord_rsc_enviado: true,
        custrecord_rsc_status: 1,
        resumo: resumo
    });
    console.log('idReparcelamento2', idReparcelamento2);

    var loadReneg = record.load({type: 'customrecord_rsc_tab_efetiva_reparcela', id: registroAtual.id});
    console.log('loadReneg', loadReneg);

    try {
        loadReneg.setValue('custrecord_rsc_status_aprovacao', 4)
        .setValue('custrecord_rsc_reparcelamento_2', idReparcelamento2)
        .save({ignoreMandatoryFields: true});

        // Recarrega a página
        document.location.reload(true);
    } catch(e) {
        console.log('Erro 3', JSON.stringify(e));

        dialog.alert({
            title: 'Aviso!',
            message: 'Houve um erro no processamento da solicitação.'
        });

        return false;
    }
}

return {
    baixaManual: baixaManual,
    aprovar: aprovar,
    rejeitar: rejeitar,
    implantacao: implantacao,
    enviarMinutaBoleto: enviarMinutaBoleto,
    imprimirMinutaBoleto: imprimirMinutaBoleto,
    pageInit: pageInit,
    // saveRecord: saveRecord,
    // validateField: validateField,
    // fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    // sublistChanged: sublistChanged
}
});
