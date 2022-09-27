/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
*/
const remetente = -5;
const destinatario = 3588;
const copia = [4550];

const itens = {
    'Fração Principal': 28650,
    'Juros à incorrer': 28654
}

define(['N/email', 'N/file', 'N/format', 'N/log', 'N/record', 'N/render', 'N/runtime', 'N/search'], (email, file, format, log, record, render, runtime, search) => {
const localidade = (id) => {
    var lookupContrato = search.lookupFields({type: 'salesorder',
        id: id,
        columns: ['location']
    }).location;
    log.audit('lookupContrato', lookupContrato);

    return lookupContrato[0].text;
}

const moedaBR = (valor) => {
    var formatoBR = format.format({value: valor, type: format.Type.CURRENCY});
    return formatoBR;
}

const inv = (id, campo) => {
    log.audit('fi', {id: id, campo: campo});

    var loadInv = record.load({type: 'invoice', id: id});

   if (campo == 'Fração Principal + Juros à incorrer') {
        linhaFP = loadInv.findSublistLineWithValue('item', 'item', itens['Fração Principal']);
        linhaJI = loadInv.findSublistLineWithValue('item', 'item', itens['Juros à incorrer']);
        var somaLinhas = loadInv.getSublistValue('item', 'amount', linhaFP) + (loadInv.getSublistValue('item', 'amount', linhaJI) || 0);
        return somaLinhas;
    }
}

const fi = (id, campo) => {
    log.audit('fi', {id: id, campo: campo});

    var loadInv = record.load({type: 'invoice', id: id});

    var linhaFP, linhaJI;

    if (campo == 'Fração Principal') {
        linhaFP = loadInv.findSublistLineWithValue('item', 'item', itens['Fração Principal']);
        return moedaBR(parseFloat(loadInv.getSublistValue('item', 'amount', linhaFP)));
    } else if (campo == 'Fração Principal + Juros à incorrer') {
        linhaFP = loadInv.findSublistLineWithValue('item', 'item', itens['Fração Principal']);
        linhaJI = loadInv.findSublistLineWithValue('item', 'item', itens['Juros à incorrer']);
        var somaLinhas = parseFloat(loadInv.getSublistValue('item', 'amount', linhaFP) + (loadInv.getSublistValue('item', 'amount', linhaJI) || 0));
        return moedaBR(somaLinhas);
    } else {
        return loadInv.getText(campo);
    }
    
    // return record.load({type: 'invoice', id: id}).getText(campo);
}

const fatorCorrecao = (nome) => {
    log.audit('fatorCorrecao', nome);
    
    var bscIndice = search.create({type: "customrecord_rsc_correction_unit",
        filters: [
           ["name","is",nome]
        ],
        columns: [
            "internalid","name"
        ]
    }).run().getRange(0,1);
    log.audit('bscIndice', bscIndice);

    var bsc_UnidadeCorrecao = search.create({type: "customrecord_rsc_correction_unit",
        filters: [
            ["internalid","anyof",bscIndice[0].id], "AND",
            // ["custrecord_rsc_hif_correction_unit.custrecord_rsc_hif_effective_date","within","thismonth"]
            ["custrecord_rsc_hif_correction_unit.custrecord_rsc_hif_effective_date","within","monthbeforelast"]
        ],
        columns: [
            "internalid","name",
            search.createColumn({name: "custrecord_rsc_hif_factor_percent", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", label: "Fator atualizado data"}),
            search.createColumn({name: "custrecord_rsc_hif_effective_date", join: "CUSTRECORD_RSC_HIF_CORRECTION_UNIT", sort: search.Sort.ASC, label: "Data de vigência"})
        ]
    }).run().getRange(0,1);
    log.audit('bsc_UnidadeCorrecao', bsc_UnidadeCorrecao);

    if (bsc_UnidadeCorrecao.length > 0) {
        return Number(bsc_UnidadeCorrecao[0].getValue({name: 'custrecord_rsc_hif_factor_percent', join: 'CUSTRECORD_RSC_HIF_CORRECTION_UNIT'})).toFixed(2) || 0;
    } else {
        return Number('0');
    }
}

const dataAtual = (data, detalhe) => {
    const dia = data.getDate() > 9 ? data.getDate()+1 : '0'+(data.getDate()+1);
    var mes = data.getMonth()+1 > 9 ? data.getMonth()+1 : data.getMonth()+1;
    const ano = data.getFullYear();
    
    if (detalhe == 'baseContrato') {
        return mes+'/'+ano;
    } else {
        switch (mes) {
            case 01: mes = 'Janeiro'; break;
            case 02: mes = 'Fevereiro'; break;
            case 03: mes = 'Março'; break;
            case 04: mes = 'Abril'; break;
            case 05: mes = 'Maio'; break;
            case 06: mes = 'Junho'; break;
            case 07: mes = 'Julho'; break;
            case 08: mes = 'Agosto'; break;
            case 09: mes = 'Setembro'; break;
            case 10: mes = 'Outubro'; break;
            case 11: mes = 'Novembro'; break;
            case 12: mes = 'Dezembro'; break;
        }

        return dia+' de '+mes+' de '+ano;
    }
}

const onRequest = (context) => {
    log.audit('context', context);

    const metodo = context.request.method;
    log.audit('metodo', metodo);

    const body = JSON.parse(context.request.body);
    log.audit('body', body);

    const response = context.response;
    log.audit('response', response);

    const link = runtime.envType == 'PRODUCTION' ? 'https://5843489.app.netsuite.com' : 'https://5843489-sb1.app.netsuite.com';

    var totalParcelas = 0;
    var totalResumo = 0;
    var arrayResumo = [];
    var arrayParcela = [];

    if (metodo == 'POST') {
        var renderer = render.create();

        var template = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
        template += '<pdf><head>';
        template += '<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />';
        template += '<#if .locale == "zh_CN">';
        template += '<link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}" src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />';
        template += '<#elseif .locale == "zh_TW">';
        template += '<link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}" src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />';
        template += '<#elseif .locale == "ja_JP">';
        template += '<link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />';
        template += '<#elseif .locale == "ko_KR">';
        template += '<link name="NotoSansCJKkr" type="font" subtype="opentype" src="${nsfont.NotoSansCJKkr_Regular}" src-bold="${nsfont.NotoSansCJKkr_Bold}" bytes="2" />';
        template += '<#elseif .locale == "th_TH">';
        template += '<link name="NotoSansThai" type="font" subtype="opentype" src="${nsfont.NotoSansThai_Regular}" src-bold="${nsfont.NotoSansThai_Bold}" bytes="2" />';
        template += '</#if>';
        template += '<macrolist>';
        template += '<macro id="nlfooter">';
        template += '<table class="footer" style="width: 100%;"><tr>';
        template += '<td><#if record.tranid != ""><barcode codetype="code128" showtext="true" value="${record.tranid}"/></#if></td>';
        template += '<td align="right"><pagenumber/> of <totalpages/></td>';
        template += '</tr></table>';
        template += '</macro>';
        template += '</macrolist>';
        template += '<style type="text/css">* {';
        template += '<#if .locale == "zh_CN">';
        template += 'font-family: NotoSans, NotoSansCJKsc, sans-serif;';
        template += '<#elseif .locale == "zh_TW">';
        template += 'font-family: NotoSans, NotoSansCJKtc, sans-serif;';
        template += '<#elseif .locale == "ja_JP">';
        template += 'font-family: NotoSans, NotoSansCJKjp, sans-serif;';
        template += '<#elseif .locale == "ko_KR">';
        template += 'font-family: NotoSans, NotoSansCJKkr, sans-serif;';
        template += '<#elseif .locale == "th_TH">';
        template += 'font-family: NotoSans, NotoSansThai, sans-serif;';
        template += '<#else>';
        template += 'font-family: NotoSans, sans-serif;';
        template += '</#if>';
        template += '}';
        template += 'p.deacordo { margin: 0; text-indent: 50px; }'; // Aqui começa a parametrização do pdf
        template += 'p.asdemais { margin: 0; text-indent: 50px; }';
        template += 'p.caso { margin: 0; text-indent: 50px; }';        
        template += '.retificacao { border-collapse: collapse; }';
        template += '.retificacao td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.resumo { border-collapse: collapse; }';
        template += '.resumo td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.parcelas { border-collapse: collapse; }';
        template += '.parcelas td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.assintura td { border-spacing: 15px 0px; text-align: center; vertical-align: middle; padding: 5px }';
        template += '</style>';
        template += '</head>';
        template += '<body footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter" font-size="8">';
        template += '<br />S&atilde;o Paulo, '+dataAtual(new Date(body.dataRenegociacao))+',<br /><br />&Agrave;<br />';
        // template += '<br />S&atilde;o Paulo, '+dataAtual(new Date)+',<br /><br />&Agrave;<br />';
        template += body.cliente; // cliente : tarefa
        template += '<br />Nesta<br /><br /><p align="center">Ref.: Obra:&nbsp;';
        template += body.empreendimento; // unidade
        template += '<br />Unidade:&nbsp;'+body.unidade; // unidade
        template += '<br />RETIFICA&Ccedil;&Atilde;O DA FORMA DE PAGAMENTO</p><br />Prezados Senhores:<br /><p class="deacordo">De acordo com os entendimentos mantidos com V.Sas., ';
        template += 'venho(vimos) propor-lhes expressamente a retifica&ccedil;&atilde;o parcial do contrato pelo qual prometi adquirir a(s) unidade(s) acima referida(s),';
        template += ' no que respeita t&atilde;o somente ao pagamento da(s) parcela(s) adiante especificada(s), integrante(s) do saldo do(s) pre&ccedil;o(s) da venda';
        template += ' daquela(s) unidade(s). A retifica&ccedil;&atilde;o ora proposta &eacute; assim resumida: </p><br />';
        template += '<table class="retificacao" align="center"><tr>';
        template += '<td><b>Base do Contrato</b></td>';
        template += '<td><b>&Iacute;ndice</b></td>';
        template += '<td><b>Fator</b></td>';
        template += '</tr>';
        template += '<tr>';
        template += '<td>';
        template += dataAtual(new Date(), 'baseContrato'); // mês/ano
        template += '</td>';
        template += '<td>';
        // template += body.indice.length > 0 ? body.indice[0].text : 'BRL'; // Unidade de Correção
        template += body.resumo[0]['Índice de Reajuste']; // Unidade de Correção
        template += '</td>';
        template += '<td>';
        template += fatorCorrecao(body.resumo[0]['Índice de Reajuste']);
        // template += moedaBR(body.total_fatura_principal); // Total de Prestações Marcadas
        template += '</td>';
        template += '</tr></table>';
        
        template += '<span style="text-align: justify;"><br />a) Valores contratuais originais das parcelas devidas e seus respectivos vencimentos, atualizados at&eacute; a data acima:</span><br /><br />';

        // Sublista: Resumo
        template += '<table class="resumo" align="center"><tr>';
        template += '<td><b>Nr. Parc.</b></td>';
        template += '<td><b>&Iacute;ndice de Reajuste</b></td>';
        // template += '<td><b>Per&iacute;od. Venc.</b></td>';
        template += '<td><b>Valor Parc. (R$)</b></td>';
        template += '<td><b>Total Atualizado</b></td>';
        template += '<td><b>Vencimento</b></td>';
        template += '<td><b>Juros</b></td>';        
        template += '<td><b>Data Juros</b></td>';
        template += '</tr>';        

        var total_parcelas_selecionadas = 0;

        body.resumo.forEach(function(sumario, index) {
            log.audit('sumario '+index, sumario);

            total_parcelas_selecionadas = parseFloat(total_parcelas_selecionadas) + parseFloat(sumario['Total Princ.']);

            // Amortização
            if (body.tipoRenegociacao == 1) {
                template += '<tr>';

                template += '<td>';
                template += sumario['Nr. Parc.'];
                template += '</td>';
    
                template += '<td>';
                template += sumario['Índice de Reajuste'];
                template += '</td>';
    
                // template += '<td>';
                // template += sumario['Period. Venc.'];
                // template += '</td>';
    
                template += '<td>';
                // template += moedaBR(sumario['Valor Parc. (R$)']);
                template += fi(sumario['ID'], 'Fração Principal');
                template += '</td>';
                
                // arrayResumo.push(parseFloat(sumario['Total Princ.']));
                arrayResumo.push(inv(sumario['ID'], 'Fração Principal + Juros à incorrer'));
    
                template += '<td>';
                // template += moedaBR(parseFloat(sumario['Total Princ.']));
                template += fi(sumario['ID'], 'Fração Principal + Juros à incorrer');
                template += '</td>';
    
                template += '<td>';
                template += sumario['1º Vencimento'];
                template += '</td>';
    
                template += '<td>';
                template += sumario['Juros'];
                template += '</td>';

                template += '<td>';
                template += sumario['ID'] ? fi(sumario['ID'], 'custbody_rsc_data_juros') : '';
                template += '</td>';
    
                template += '</tr>';
            }

            // Inadimplentes
            if (body.tipoRenegociacao == 2) {
                template += '<tr>';

                template += '<td>';
                template += sumario['Nr. Parc.'];
                template += '</td>';

                template += '<td>';
                template += sumario['Índice de Reajuste'];
                template += '</td>';

                // template += '<td>';
                // template += sumario['Period. Venc.'];
                // template += '</td>';

                template += '<td>';
                template += moedaBR(sumario['Valor Parc. (R$)']);
                // template += fi(sumario['ID'], 'Fração Principal');
                template += '</td>';

                // arrayResumo.push(parseFloat(sumario['Total Princ.']));
                // arrayResumo.push(inv(sumario['ID'], 'Fração Principal + Juros à incorrer'));
                arrayResumo.push(parseFloat(sumario['Valor Parc. (R$)']));

                template += '<td>';
                // template += moedaBR(parseFloat(sumario['Total Princ.']));
                // template += fi(sumario['ID'], 'Fração Principal + Juros à incorrer');
                template += moedaBR(sumario['Valor Parc. (R$)']);
                template += '</td>';

                template += '<td>';
                template += sumario['1º Vencimento'];
                template += '</td>';

                template += '<td>';
                template += sumario['Juros'];
                template += '</td>';

                template += '<td>';
                template += sumario['Dt Juros'];
                template += '</td>';

                template += '</tr>';
            }

            // Adimplentes
            if (body.tipoRenegociacao == 3) {
                template += '<tr>';

                template += '<td>';
                template += sumario['Nr. Parc.'];
                template += '</td>';

                template += '<td>';
                template += sumario['Índice de Reajuste'];
                template += '</td>';

                // template += '<td>';
                // template += sumario['Period. Venc.'];
                // template += '</td>';

                template += '<td>';
                // template += moedaBR(sumario['Valor Parc. (R$)']);                
                template += fi(sumario['ID'], 'Fração Principal');
                template += '</td>';

                // arrayResumo.push(parseFloat(sumario['Total Princ.']));
                arrayResumo.push(inv(sumario['ID'], 'Fração Principal + Juros à incorrer'));
                
                template += '<td>';
                // template += moedaBR(parseFloat(sumario['Total Princ.']));
                template += fi(sumario['ID'], 'Fração Principal + Juros à incorrer');
                template += '</td>';

                template += '<td>';
                template += sumario['1º Vencimento'];
                template += '</td>';

                template += '<td>';
                template += sumario['Juros'];
                template += '</td>';

                template += '<td>';
                template += sumario['Dt Juros'];
                template += '</td>';

                template += '</tr>';
            }
        });

        template += '</table>';
        
        for (i=0; i<arrayResumo.length; i++) {
            totalResumo += Number(arrayResumo[i]);
        }     

        if (body.tipoRenegociacao == 1) {
            template += '<p align="center"><b>Total:</b> '+moedaBR(totalResumo)+'</p><br />';
        } else {
            template += '<p align="center"><b>Total:</b> '+moedaBR(totalResumo)+'</p><br />';
        }

        template += 'b) Retifica&ccedil;&otilde;es propostas, atualizados at&eacute; a data acima:<br /><br />';

        // Sublista: Parcelas
        template += '<table class="parcelas" align="center"><tr>';
        template += '<td><b>Nr. Parc.</b></td>';
        template += '<td><b>&Iacute;ndice de Reajuste</b></td>';
        // template += '<td><b>Per&iacute;od. Venc.</b></td>';
        template += '<td><b>Valor Parc. (R$)</b></td>';
        template += '<td><b>Total Atualizado</b></td>';
        template += '<td><b>Vencimento</b></td>';
        template += '<td><b>Juros</b></td>';
        template += '<td><b>Data Juros</b></td>';
        template += '</tr>';

        total_parcelas_selecionadas = moedaBR(parseFloat(total_parcelas_selecionadas / body.parcelas.length));

        body.parcelas.forEach(function(parcela, index) {
            log.audit('parcela: '+index, parcela);
            // Amortização
            if (body.tipoRenegociacao == 1) {
                template += '<tr>';

                template += '<td>';
                template += parcela['Nr. Parc.'];
                template += '</td>';
    
                template += '<td>';
                template += parcela['Índice de Reajuste'];
                template += '</td>';
    
                // template += '<td>';
                // template += parcela['Period. Venc.'];
                // template += '</td>';
    
                template += '<td>';
                template += moedaBR(parcela['Valor Parc. (R$)']);
                template += '</td>';

                totalParcelas = (parseFloat(totalParcelas) + parseFloat(parcela['Valor Parc. (R$)']) +  + parseFloat(parcela['Total Princ.'])).toFixed(2);

                var tp = index == 0 ? (parseFloat(parcela['Valor Parc. (R$)']) + parseFloat(parcela['Total Princ.'])).toFixed(2) :
                parseFloat(parcela['Valor Parc. (R$)']);
    
                template += '<td>';
                template += moedaBR(tp);
                template += '</td>';
    
                template += '<td>';
                template += parcela['1º Vencimento'];
                template += '</td>';
    
                template += '<td>';
                template += parcela['Juros'];
                template += '</td>';

                template += '<td>';
                template += parcela['ID'] ? fi(parcela['ID'], 'custbody_rsc_data_juros') : '';
                template += '</td>';
                
    
                template += '</tr>';                             
            }

            // Inadimplentes
            if (body.tipoRenegociacao == 2) {
                template += '<tr>';

                template += '<td>';
                template += parcela['Nr. Parc.'];
                template += '</td>';

                template += '<td>';
                template += parcela['Índice de Reajuste'];
                template += '</td>';

                // template += '<td>';
                // template += parcela['Period. Venc.'];
                // template += '</td>';
                
                template += '<td>';
                // template += moedaBR(parseFloat(parcela['Valor Parc. (R$)']) - parseFloat(parcela['Total Princ.']) - parseFloat(parcela['Pro Rata']) - parseFloat(parcela['Multa']) - parseFloat(parcela['Juros Reneg']));
                template += total_parcelas_selecionadas;
                template += '</td>';
                
                arrayParcela.push(parseFloat(parcela['Valor Parc. (R$)']));

                template += '<td>'; 
                template += moedaBR(parseFloat(parcela['Valor Parc. (R$)']));
                template += '</td>';

                template += '<td>';
                template += parcela['1º Vencimento'];
                template += '</td>';

                template += '<td>';
                template += parcela['Juros'];
                template += '</td>';

                template += '<td>';
                template += parcela['Data Juros'];
                template += '</td>';

                template += '</tr>';
            }

            // Adimplentes
            if (body.tipoRenegociacao == 3) {
                template += '<tr>';

                template += '<td>';
                template += parcela['Nr. Parc.'];
                template += '</td>';

                template += '<td>';
                template += parcela['Índice de Reajuste'];
                template += '</td>';

                // template += '<td>';
                // template += parcela['Period. Venc.'];
                // template += '</td>';

                template += '<td>';
                template += moedaBR(parseFloat(parcela['Valor Parc. (R$)']) - parseFloat(parcela['Total Princ.']) - parseFloat(parcela['Pro Rata']) - parseFloat(parcela['Multa']) - parseFloat(parcela['Juros Reneg']));
                template += '</td>';

                arrayParcela.push(parseFloat(parcela['Valor Parc. (R$)']));

                template += '<td>'; 
                template += moedaBR(parseFloat(parcela['Valor Parc. (R$)']));
                template += '</td>';

                template += '<td>';
                template += parcela['1º Vencimento'];
                template += '</td>';

                template += '<td>';
                template += parcela['Juros'];
                template += '</td>';

                template += '<td>';
                template += parcela['Data Juros'];
                template += '</td>';

                template += '</tr>';
            }
        });

        template += '</table>';

        for (i=0; i<arrayParcela.length; i++) {
            totalParcelas += Number(arrayParcela[i]);
        }     

        if (body.tipoRenegociacao == 1) {
            template += '<p align="center"><b>Total:</b> '+moedaBR(totalParcelas)+'</p><br />';
        } else {
            template += '<p align="center"><b>Total:</b> '+moedaBR(totalParcelas)+'</p><br />';
        }

        template += '<p class="asdemais">As demais cl&aacute;usulas e condi&ccedil;&otilde;es do instrumento acima citado permanecem inalteradas, especialmente quanto &agrave;';
        template += ' periodicidade da atualiza&ccedil;&atilde;o monet&aacute;ria das obriga&ccedil;&otilde;es de pagamento de acordo com a varia&ccedil;&atilde;o do';
        template += ' &iacute;ndice eleito.</p><p class="caso">Caso V.Sas. estejam de acordo com os termos desta proposta, solicito(amos) que aponham sua concord&acirc;ncia aos mesmos,';
        template += ' passando ent&atilde;o este instrumento a ter car&aacute;ter para todos os fins de direito.</p><br />';

        template += '<p align="center">Atenciosamente,</p>';
        template += '<p align="center">De acordo,</p><br /><br />';

        template += '<table class="assinatura" align="center" width="75%">';
        template += '<tr>';
        template += '<td><b>__________________________________________________</b></td>';
        template += '<td></td><td></td><td></td><td></td><td></td>';
        template += '<td><b>__________________________________________________</b></td>';
        template += '</tr>';
        template += '<tr>';
        // template += '<td><b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+body.cliente+'</b></td>';
        template += '<td><b>'+body.cliente+'</b></td>';
        template += '<td></td><td></td><td></td><td></td><td></td>';
        template += '<td><b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+localidade(body.contrato_fatura_principal.value)+'</b></td>';
        template += '</tr>';
        template += '</table>';

        template += '<br /><p align="center"><b>Observações</b></p>';
        template += '<p align="center">'+body.observacao+'</p><br /><br />';

        template += '</body>';
        template += '</pdf>';

        log.audit('template', template);
        renderer.templateContent = template;

        var minuta = renderer.renderAsPdf();
        minuta.folder = 704;
        minuta.name = 'minuta_'+body.tabelaEfetivacao+'_'+body.cliente+'.pdf';

        var idMinuta, erro;       
        try {
            idMinuta = minuta.save();
            log.audit('idMinuta', idMinuta); 
            
        } catch(e) {
            log.error('Erro', e);
            erro = e;
        }

        if (!body.ordem) {
            email.send({
                author: remetente,
                recipients: destinatario,
                cc: copia,
                subject: 'Minuta/Boleto: #renegociacao#'+body.tabelaEfetivacao+'_'+body.cliente,
                body: 'Olá '+body.cliente+',<br /><br />'+
                'Segue a minuta solicitada.<br /><br />'+
                '<b>Atenciosamente</b>,<br />'+
                '<b>Amilton Everaldo da Silva</b>',
                attachments: [file.load(idMinuta)]
            });

            response.write(idMinuta ? JSON.stringify({status: 'Sucesso'}) : JSON.stringify({status: 'Erro', msg: erro}));
        } else {
            response.write(idMinuta ? JSON.stringify({status: 'Sucesso', pdf: file.load(idMinuta).url}) : JSON.stringify({status: 'Erro', msg: erro}));
        } 
    }
}

return {onRequest}
});
