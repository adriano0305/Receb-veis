/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
*/
const remetente = -5;
const destinatario = 3588;
const copia = [4550];

define(['N/email', 'N/file', 'N/format', 'N/log', 'N/query', 'N/record', 'N/render', 'N/runtime', 'N/search'], (email, file, format, log, query, record, render, runtime, search) => {
const moedaBR = (valor) => {
    var formatoBR = format.format({value: valor, type: format.Type.FLOAT});
    return formatoBR;
}

const cliente = (entitytitle, doc) => {
    var sql = "SELECT custentity_enl_cnpjcpf, custentity_lrc_rg "+
    "FROM customer "+
    "WHERE entitytitle = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [entitytitle]
    });

    var sqlResults = consulta.asMappedResults();

    return doc == 'cpf' ? sqlResults[0].custentity_enl_cnpjcpf : sqlResults[0].custentity_lrc_rg;  
}

const contrato = (id, field, relation) => {
    var lookupContrato = search.lookupFields({type: 'salesorder',
        id: id,
        columns: ['custbody_rsc_tran_unidade']
    });

    if (relation == 'bloco') {
        var lookupBU = search.lookupFields({type: 'customrecord_rsc_unidades_empreendimento',
            id: lookupContrato.custbody_rsc_tran_unidade[0].value,
            columns: ['custrecord_rsc_un_emp_bloco']
        });

        return lookupBU.custrecord_rsc_un_emp_bloco.length > 0 ? lookupBU.custrecord_rsc_un_emp_bloco[0].text : ''; 
    }

    return lookupContrato.custbody_rsc_tran_unidade[0].text;
}

const dataAtual = (data, detalhe) => {
    const dia = data.getDate() > 9 ? data.getDate() : '0'+(data.getDate()+1);
    var mes = data.getMonth()+1 > 9 ? data.getMonth()+1 : '0'+(data.getMonth()+1);
    const ano = data.getFullYear();
    
    if (detalhe == 'baseContrato') {
        return mes+'/'+ano;
    } else if (detalhe == 'barra') {
        switch (mes) {
            case 01: mes = '.01.'; break;
            case 02: mes = '.02.'; break;
            case 03: mes = '.03.'; break;
            case 04: mes = '.04.'; break;
            case 05: mes = '.05.'; break;
            case 06: mes = '.06.'; break;
            case 07: mes = '.07.'; break;
            case 08: mes = '.08.'; break;
            case 09: mes = '.09.'; break;
            case 10: mes = '.10.'; break;
            case 11: mes = '.11.'; break;
            case 12: mes = '.12.'; break;
        }

        return dia + '.' + mes + '.' + ano;
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
        template += '.posicao { border-collapse: collapse; }';
        template += '.posicao td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.proprietario { border-collapse: collapse; }';
        template += '.proprietario td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.cedentes { border-collapse: collapse; }';
        template += '.cedentes td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.saldoVencido { border-collapse: collapse; }';
        template += '.saldoVencido td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.saldoVencendo { border-collapse: collapse; }';
        template += '.saldoVencendo td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.cessao { border-collapse: collapse; }';
        template += '.cessao td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.cessionarios { border-collapse: collapse; }';
        template += '.cessionarios td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '.feitoPor { border-collapse: collapse; }';
        template += '.feitoPor td { border: thin solid black; text-align: center; vertical-align: middle; padding: 5px }';
        template += '</style>';
        template += '</head>';
        template += '<body footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter" font-size="8">';

        // Tabela Posição
        template += '<table class="posicao" align="center" width="90%"><tr>';
        template += '<td><b>Posi&ccedil;&atilde;o em</b></td>';
        template += '<td><b>V&aacute;lido at&eacute;</b></td>';
        template += '<td><b>Base Contrato</b></td>';
        template += '<td><b>Base de Refer&ecirc;ncia</b></td>';
        template += '</tr><tr>';
        template += '<td>'+dataAtual(new Date(body.dataCD), 'barra')+'</td>';
        template += '<td>'+''+'</td>';
        template += '<td>'+dataAtual(new Date(), 'baseContrato')+'</td>';
        template += '<td>'+''+'</td></tr>';
        template += '</table><br />';

        // Tabela Proprietário
        template += '<table class="proprietario" align="center" width="90%"><tr>';
        template += '<td><b>Propriet&aacute;rio</b></td>';
        template += '<td><b>Obra/Bloco</b></td>';
        template += '<td><b>Unidade</b></td>';
        template += '</tr><tr>';
        template += '<td>'+body.clienteAtual.text+'</td>';
        template += '<td>'+contrato(body.contrato.value, 'custbody_rsc_tran_unidade', 'bloco')+'</td>';
        template += '<td>'+contrato(body.contrato.value, 'custbody_rsc_tran_unidade')+'</td></tr>';
        template += '</table><br />';

        // Tabela Cedentes
        template += '<table class="cedentes" align="center" width="90%"><tr>';
        template += '<td colspan="5"><b>CEDENTES</b></td></tr>';
        template += '<tr><td><b>CPF</b></td>';
        template += '<td><b>Nome</b></td>';
        template += '<td><b>Tipo Doc.</b></td>';
        template += '<td><b>Num. Doc.</b></td>';
        template += '<td><b>Particip.</b></td></tr>';

        body.proponentes.forEach(function (bidder) {
            template += '<tr>';

            template += '<td>';
            template += cliente(bidder.nome, 'cpf');
            template += '</td>';

            template += '<td>';
            template += bidder.nome;
            template += '</td>';

            template += '<td>';
            template += 'CPF';
            template += '</td>';

            template += '<td>';
            template += cliente(bidder.nome, 'rg');
            template += '</td>';

            template += '<td>';
            template += bidder.participacao;
            template += '</td>';

            template += '</tr>';
        });
         
         template += '</table><br />';

        // Valores Pagos
        template += '<p align="center"><b>VALORES PAGOS (R$): </b>'+moedaBR(body.totalParcelas)+'</p>';
        template += '<p align="center"></p><br />';
        
        // // Tabela Saldo Devedor Vencido
        // template += '<table class="saldoVencido" align="center" width="90%"><tr>';
        // template += '<td colspan="8"><b>SALDO DEVEDOR VENCIDO</b></td></tr>';
        // template += '<tr><td><b>Nr. Parc.</b></td>';
        // template += '<td><b>Nat.</b></td>';
        // template += '<td><b>&Iacute;ndice de Reajuste</b></td>';
        // template += '<td><b>Per&iacute;od. Venc.</b></td>';
        // template += '<td><b>Valor Parc. (R$)</b></td>';
        // template += '<td><b>Total Princ. (R$)</b></td>';
        // template += '<td><b>1&ordm; Venc.</b></td>';
        // template += '<td><b>Juros</b></td></tr>';

        // body.parcelas.forEach(function (sumario) {
        //     template += '<tr>';

        //     template += '<td>';
        //     template += sumario['Nr. Parc.'];
        //     template += '</td>';

        //     template += '<td>';
        //     template += sumario['Nat'];
        //     template += '</td>';

        //     template += '<td>';
        //     template += sumario['Índice de Reajuste'];
        //     template += '</td>';

        //     template += '<td>';
        //     template += sumario['Period. Venc.'];
        //     template += '</td>';

        //     template += '<td>';
        //     template += moedaBR(sumario['Valor Parc. (R$)']);
        //     template += '</td>';

        //     template += '<td>';
        //     template += moedaBR(sumario['Total Princ. (R$)']);
        //     template += '</td>';

        //     template += '<td>';
        //     template += sumario['1º Venc.'];
        //     template += '</td>';

        //     template += '<td>';
        //     template += sumario['Juros'];
        //     template += '</td>';

        //     template += '</tr>';
        // });
        
        // template += '</table><br />';

        // Tabela Saldo Devedor Vencendo
        template += '<table class="saldoVencendo" align="center" width="90%"><tr>';
        template += '<td colspan="8"><b>SALDO DEVEDOR VENCENDO</b></td></tr>';
        template += '<tr><td><b>Nr. Parc.</b></td>';
        template += '<td><b>Nat.</b></td>';
        template += '<td><b>&Iacute;ndice de Reajuste</b></td>';
        template += '<td><b>Per&iacute;od. Venc.</b></td>';
        template += '<td><b>Valor Parc. (R$)</b></td>';
        template += '<td><b>Total Princ. (R$)</b></td>';
        template += '<td><b>1&ordm; Venc.</b></td>';
        template += '<td><b>Juros</b></td></tr>';

        body.parcelas.forEach(function (sumario) {
            template += '<tr>';

            template += '<td>';
            template += sumario['Nr. Parc.'];
            template += '</td>';

            template += '<td>';
            template += sumario['Nat'];
            template += '</td>';

            template += '<td>';
            template += sumario['Índice de Reajuste'];
            template += '</td>';

            template += '<td>';
            template += sumario['Period. Venc.'];
            template += '</td>';

            template += '<td>';
            template += moedaBR(sumario['Valor Parc. (R$)']);
            template += '</td>';

            template += '<td>';
            template += moedaBR(sumario['Total Princ. (R$)']);
            template += '</td>';

            template += '<td>';
            template += sumario['1º Venc.'];
            template += '</td>';

            template += '<td>';
            template += sumario['Juros'];
            template += '</td>';

            template += '</tr>';
        });
        
        template += '</table><br />';

        // Tabela Cessão
        template += '<table class="cessao" align="center" width="90%"><tr>';
        template += '<td colspan="8"><b>CESSÃO</b></td></tr>';
        template += '<tr><td><b>Nr. Parc.</b></td>';
        template += '<td><b>Nat.</b></td>';
        template += '<td><b>&Iacute;ndice de Reajuste</b></td>';
        template += '<td><b>Per&iacute;od. Venc.</b></td>';
        template += '<td><b>Valor Parc. (R$)</b></td>';
        template += '<td><b>Total Princ. (R$)</b></td>';
        template += '<td><b>1&ordm; Venc.</b></td>';
        template += '<td><b>Juros</b></td></tr>';

        body.parcelas.forEach(function (sumario) {
            template += '<tr>';

            template += '<td>';
            template += sumario['Nr. Parc.'];
            template += '</td>';

            template += '<td>';
            template += sumario['Nat'];
            template += '</td>';

            template += '<td>';
            template += sumario['Índice de Reajuste'];
            template += '</td>';

            template += '<td>';
            template += sumario['Period. Venc.'];
            template += '</td>';

            template += '<td>';
            template += moedaBR(sumario['Valor Parc. (R$)']);
            template += '</td>';

            template += '<td>';
            template += moedaBR(sumario['Total Princ. (R$)']);
            template += '</td>';

            template += '<td>';
            template += sumario['1º Venc.'];
            template += '</td>';

            template += '<td>';
            template += sumario['Juros'];
            template += '</td>';

            template += '</tr>';
        });
        
        template += '</table><br />';

        // Taxa de Cessão
        template += '<p align="center"><b>TAXA DE CESSÃO</b></p>';
        template += '<p align="center"><b>2% do Saldo Devedor R$: </b>'+moedaBR(body.calculo)+'</p><br /><br />';

        // Tabela Cliente
        template += '<table class="cessionarios" align="center" width="90%"><tr>';
        template += '<td colspan="5"><b>CESSIONÁRIOS</b></td></tr>';
        template += '<tr><td><b>CPF</b></td>';
        template += '<td><b>Nome</b></td>';
        template += '<td><b>Tipo Doc.</b></td>';
        template += '<td><b>Num. Doc.</b></td>';
        template += '<td><b>Particip.</b></td></tr>';

        body.novosProponentes.forEach(function (newBidder) {
            template += '<tr>';

            template += '<td>';
            template += newBidder.cpf;
            template += '</td>';

            template += '<td>';
            template += newBidder.nome;
            template += '</td>';

            template += '<td>';
            template += 'CPF';
            template += '</td>';

            template += '<td>';
            template += newBidder.rg;
            template += '</td>';

            template += '<td>';
            template += newBidder.participacao;
            template += '</td>';

            template += '</tr>';
        });
        
        template += '</table><br />';

        // Tabela Feito Por
        template += '<table class="feitoPor" align="center" width="90%"><tr>';
        template += '<td><b>Feito por: </b>'+body.criadorCD+'</td>';
        template += '<td><b>Aprovado: </b>'+body.statusCessao+'</td>';
        template += '</tr></table>';
        template += '<br /><br />';

        template += '<p align="center"><b>Observações</b></p>';
        
        template += '<p align="center">'+body.observacao+'</p><br /><br />';

        template += '</body>';
        template += '</pdf>';

        log.audit('template', template);
        renderer.templateContent = template;

        var cessao = renderer.renderAsPdf();
        cessao.folder = 704;
        cessao.name = 'cessao_'+body.recordId+'_'+body.clienteAtual.text+'.pdf';

        var idcessao, erro;       
        try {
            idcessao = cessao.save();
            log.audit('idcessao', idcessao); 
            
        } catch(e) {
            log.error('Erro', e);
            erro = e;
        }

        if (!body.ordem) {
            email.send({
                author: remetente,
                recipients: destinatario,
                cc: copia,
                subject: 'Cessão de Direito: '+body.recordId,
                body: 'Olá '+body.clienteAtual.text+' ,<br /><br />'+
                'Segue a cessão de direito solicitada.<br /><br />'+
                '<b>Atenciosamente</b>,<br />'+
                '',
                attachments: [file.load(idcessao)]
            });

            response.write(idcessao ? JSON.stringify({status: 'Sucesso'}) : JSON.stringify({status: 'Erro', msg: erro}));
        } else {
            response.write(idcessao ? JSON.stringify({status: 'Sucesso', pdf: file.load(idcessao).url}) : JSON.stringify({status: 'Erro', msg: erro}));
        }
    }
}

return {onRequest}
});
