/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*
*
*
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/record", "N/search", "N/log"], function (require, exports, record_1, search_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCentena = exports.Extenso = exports.getMesAno = exports.getDataRodape = exports.onRequest = exports.beginMinuta = exports.endBody = exports.beginBody = exports.endHtml = exports.beginHtml = void 0;
    record_1 = __importDefault(record_1);
    search_1 = __importDefault(search_1);
    log_1 = __importDefault(log_1);
    var extenso = [];
    extenso[1] = 'um';
    extenso[2] = 'dois';
    extenso[3] = 'tres';
    extenso[4] = 'quatro';
    extenso[5] = 'cinco';
    extenso[6] = 'seis';
    extenso[7] = 'sete';
    extenso[8] = 'oito';
    extenso[9] = 'nove';
    extenso[10] = 'dez';
    extenso[11] = 'onze';
    extenso[12] = 'doze';
    extenso[13] = 'treze';
    extenso[14] = 'quatorze';
    extenso[15] = 'quinze';
    extenso[16] = 'dezesseis';
    extenso[17] = 'dezessete';
    extenso[18] = 'dezoito';
    extenso[19] = 'dezenove';
    extenso[20] = 'vinte';
    extenso[30] = 'trinta';
    extenso[40] = 'quarenta';
    extenso[50] = 'cinquenta';
    extenso[60] = 'sessenta';
    extenso[70] = 'setenta';
    extenso[80] = 'oitenta';
    extenso[90] = 'noventa';
    extenso[100] = 'cem';
    extenso[200] = 'duzentos';
    extenso[300] = 'trezentos';
    extenso[400] = 'quatrocentos';
    extenso[500] = 'quinhentos';
    extenso[600] = 'seiscentos';
    extenso[700] = 'setecentos';
    extenso[800] = 'oitocentos';
    extenso[900] = 'novecentos';
    var beginHtml = function () {
        return "\n        <!DOCTYPE html>\n        <html>\n            <head>\n                <meta charset=\"utf-8\">\n                <title>Minuta Distrato</title>\n            </head>\n    ";
    };
    exports.beginHtml = beginHtml;
    var endHtml = function () {
        return "</html>";
    };
    exports.endHtml = endHtml;
    var beginBody = function () {
        return "<body>";
    };
    exports.beginBody = beginBody;
    var endBody = function () {
        return "</body>";
    };
    exports.endBody = endBody;
    var beginMinuta = function (empreendimento, unidade, subsidiaria, enderecoSub, cnpjSub, nomeCliente, dataContratoRelatorio, valorVendaAtt, valorVendaAttExtenso, valorPagoAtt, valorPagoAttExtenso, valorAcordado, valorAcordadoExtenso, parcelas, valorParcelas, valorParcelasExtenso, nConta, infoBancarias, enderecoCliente, dataRodape, cidadeUF) {
        return "\n    <p><b style=\"border-bottom: 1px solid #000;\">" + empreendimento + " - SP - TORRE MIRANTE DISTRATO</b></p>\n        <p><b style=\"border-bottom: 1px solid #000;\">UNIDADE " + unidade + "</b></p>\n        <p style=\"text-align: center;\"><b style=\"border-bottom: 1px solid #000;\">INSTRUMENTO PARTICULAR DO DISTRATO</b></p><br>\n        <p>Pelo presente Instrumento Particular  de Distrato, de um lado, como PRIMEIRA DISTRATANTE, " + subsidiaria + "., com sede na " + enderecoSub + ", inscrita no CNPJ sob n\u00BA. " + cnpjSub + ", conforme Estatuto Social, registrado na JUCESP sob n\u00BA NIRE - 35225830255, neste ato, representada por seu procurador, doravante denominada apenas PRIMEIRA DISTRATANTE e, de outro lado, como SEGUNDO(A) DISTRATANTE, " + nomeCliente + ", residente e domiciliado(a) na Cidade de " + enderecoCliente + ", doravante denominado(a) apenas SEGUNDO DISTRATANTE, mediante as seguintes cl\u00E1usulas e condi\u00E7\u00F5es:</p>\t\n        <p>1.) - Atrav\u00E9s do INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA E\n        OUTRAS AVEN\u00C7AS, celebrado em " + dataContratoRelatorio + ", a PRIMEIRA DISTRATANTE prometeu\n        vender para o(a) SEGUNDO(A) DISTRATANTE que, por sua vez, se comprometeu a\n        comprar a unidade identificada como N\u00BA " + unidade + ", do empreendimento denominado\n        \"" + empreendimento + "\", na " + enderecoSub + ".</p>\n        <p>2.) - As condi\u00E7\u00F5es da venda compromissada, especialmente o pre\u00E7o ajustado\n        para a venda e a sua forma de pagamento, est\u00E3o discriminadas no Instrumento\n        mencionado no item \"1.\" anterior, nos itens \"D\" e \"E\" do Quadro Resumo.</p>\n        <p>3.) - Do pre\u00E7o certo e ajustado para a venda e compra compromissada, no total\n        nominal de R$ " + valorVendaAtt + ", o(a) SEGUNDO(A) DISTRATANTE,Cumpriu apenas parte\n        da sua obriga\u00E7\u00E3o,fazendo entrega \u00E0 PRIMEIRA DISTRATANTE de valores com\n        vencimentos at\u00E9 no total de R$ " + valorPagoAtt + " estando em aberto a obriga\u00E7\u00E3o de entrega\n        de valores vencidos desde aquela data at\u00E9 a data de hoje, sobre os quais j\u00E1\n        incidem, al\u00E9m da atualiza\u00E7\u00E3o monet\u00E1ria pactuada, juros de mora e multa\n        ajustados na promessa de compra e venda.</p>\n        <p>4.) - O(a)SEGUNDO(A) DISTRATANTE j\u00E1 manifestou e ora ratifica o seu\n        desinteresse na continua\u00E7\u00E3o do compromisso de adquirir da PRIMEIRA\n        DISTRATANTE,o im\u00F3vel inicialmente descrito e caracterizado, raz\u00E3o porque\n        resolvem,de comum acordo, por este Instrumento e na melhor forma de direito,\n        distratar, como distratado t\u00EAm, para todos os fins de direito, aquele\n        compromisso de compra e venda, retornando as partes ao estado anterior \u00E0 sua\n        celebra\u00E7\u00E3o.</p>\n        <p>5.) -Em raz\u00E3o do distrato e por transa\u00E7\u00E3o ora estabelecida, a PRIMEIRA\n        DISTRATANTE devolver\u00E1 ao SEGUNDO(A) DISTRATANTE parte dos valores por ele\n        entregues \u00E0 ela PRIMEIRA DISTRATANTE,no montante de R$ " + valorAcordado + ", em " + parcelas + "\n        parcelas, de R$ " + valorParcelas + " com primeiro vencimento para\n        60(SESSENTA dias), e os demais vencimentos para a cada 30 dias dos meses\n        subsequentes contados do recebimento do presente Instrumento; valor esse que\n        ser\u00E1 depositado na conta corrente n\u00BA " + nConta + ", que o(a) SEGUNDO(A)\n        DISTRATANTE possui junto ao " + infoBancarias + ", tendo como titular o(a)\n        SEGUNDO(A) DISTRATANTE.</p>\n        <p>\tPar\u00E1grafo \u00DAnico - Caso haja inconsist\u00EAncia nos dados banc\u00E1rios fornecidos\n        pelo(a) SEGUNDO(A) DISTRATANTE, a PRIMEIRA DISTRATANTE solicitar\u00E1 corre\u00E7\u00E3o,\n        suspendendo, portanto, o prazo para pagamento e retomando o mesmo prazo\n        ap\u00F3s o recebimento dos novos dados banc\u00E1rios.</p>\n        <p>6.) - Em face do distrato de que trata o item anterior, as partes declaram:\n        a) - nada mais ter a receber ou a reclamar, uma da outra, seja a que t\u00EDtulo\n        for, com base na promessa de compra e venda ora distratada, conferindo-se\n        mutuamente, a mais ampla e geral quita\u00E7\u00E3o; b) - que a posse da unidade\n        aut\u00F4noma volta a ser detida pela PRIMEIRA DISTRATANTE que, poder\u00E1\n        livremente dispor da mesma sem qualquer interfer\u00EAncia do(a) SEGUNDO(A)\n        DISTRATANTE.</p>\n        <p>7.) - Fica eleito o Foro da Comarca de OSASCO, Estado de S\u00E3o Paulo, para\n        dirimir quaisquer diverg\u00EAncias entre as partes.</p>\n        <p>8.) - As despesas decorrentes deste instrumento, tais como emolumentos e\n        custas dos servi\u00E7os notarial e registral, bem como despesas e obriga\u00E7\u00E3o de\n        averba\u00E7\u00E3o do referido instrumento perante o competente Registro de Im\u00F3veis\n        na hip\u00F3tese do Contrato de Promessa de Venda e Compra e Outras Avencas da\n        unidade ter sido registrado junto ao cart\u00F3rio, assim como os tributos\n        devidos sobre a opera\u00E7\u00E3o, s\u00E3o de inteira responsabilidade da PRIMEIRA\n        DISTRATANTE.</p>\n        <p>9.) - Ficam requeridos e autorizados todos os atos que se fizerem\n        necess\u00E1rios no servi\u00E7o de registro de im\u00F3veis competente.</p>\n        <p>E por estarem de comum acordo, assinam o presente em tr\u00EAs vias de igual\n        teor na presen\u00E7a de duas testemunhas;</p>\n        <p style=\"text-align:center;\">" + cidadeUF + ", " + dataRodape + ".</p>\n        <br>\n        <br>\n        <br>\n        <div style=\"border-bottom:1px solid #000; width: 300px; margin-left: 190px; margin-bottom: 0; padding-bottom: 0;\"></div>\n        <p style=\"text-align: center; margin-top: 0;\" ><b>" + subsidiaria + "</b><br>\n    <b>PRIMEIRA DISTRATANTE</b></p>\n    <br>\n        <br>\n        <br>\n    <div style=\"border-bottom:1px solid #000; width: 300px; margin-left: 190px; margin-bottom: 0; padding-bottom: 0;\"></div>\n        <p style=\"text-align: center; margin-top: 0;\" ><b>" + nomeCliente + "</b><br>\n    <b>PRIMEIRA DISTRATANTE</b></p>\n    <span style=\"margin-left: 20px;\">\n        <b>TESTEMUNHAS</b>\n    </span><br><br><br><br><br><br>\n    <table>\n        <tr>\n            <td>\n                <div style=\"border-bottom:1px solid #000; width: 200px; margin-left: 70px; margin-bottom: 0; padding-bottom: 0;\"></div>\n        <p style=\" margin-top: 0; margin-left: 70px;\" >Nome:<br>CPF:<br>RG:</p>\n            </td>\n            <td>\n                <div style=\"border-bottom:1px solid #000; width: 200px; margin-left: 90px; margin-bottom: 0; padding-bottom: 0;\"></div>\n        <p style=\" margin-top: 0; margin-left: 90px;\" >Nome:<br>CPF:<br>RG:</p>\n            </td>\n        </tr>\n    </table>\n    ";
    };
    exports.beginMinuta = beginMinuta;
    var onRequest = function (ctx) {
        var parametros = ctx.request.parameters;
        var distratoId = parametros.distratoId;
        var distratoRecord = record_1.default.load({
            type: 'customrecord_rsc_escritura_distrato',
            id: distratoId
        });
        var empreendimento = distratoRecord.getText('custrecord_rsc_empreedimento_distrato');
        var unidade = distratoRecord.getValue('custrecord_rsc_unidade_distrato');
        var parcelas = distratoRecord.getValue('custrecord_rsc_qtd_parcelas');
        var vencimentoInicial = distratoRecord.getValue('custrecord_rsc_vencimento_inicial');
        var contaSearch = search_1.default.create({
            type: 'customrecord_rsc_cnab_bankaccount',
            filters: [
                ['custrecord_rsc_cnab_ba_entity_ls', 'IS', distratoRecord.getValue('custrecord_rsc_cliente_distrato')]
            ]
        }).run().getRange({
            start: 0,
            end: 1
        });
        var contaLookup = search_1.default.lookupFields({
            type: 'customrecord_rsc_cnab_bankaccount',
            id: contaSearch[0].id,
            columns: [
                'custrecord_rsc_cnab_ba_number_ds',
                'custrecord_rsc_cnab_ba_bank_ls',
                'custrecord_rsc_cnab_ba_agencynumber_ls'
            ]
        });
        var nConta = contaLookup.custrecord_rsc_cnab_ba_number_ds;
        var subsidiaria = distratoRecord.getText('custrecord_rsc_subsidiaria_distrato');
        var zip;
        // let cnpjSub;
        // const subSearch = Search.create({
        //     type:'subsidiary',
        //     filters:[
        //         ['internalid', 'IS', distratoRecord.getValue('custrecord_rsc_subsidiaria_distrato')]
        //     ],
        //     columns:[
        //         Search.createColumn({
        //             name: "zip",
        //             join: "address",
        //             label: " Zip"
        //         })
        //     ]
        // })
        // var subrecord = nlapiViewSubrecord('returnaddress');
        // let AddressSubrecord = subRecord.getCurrentSublistSubrecord({
        //     sublistId: 'addressbook',
        //     fieldId: 'addressbookaddress'
        // });
        var subSearch = search_1.default.create({
            type: "subsidiary",
            filters: [
                ["internalid", "IS", distratoRecord.getValue('custrecord_rsc_subsidiaria_distrato')]
            ],
            columns: [
                search_1.default.createColumn({
                    name: "name",
                    sort: search_1.default.Sort.ASC,
                    label: "Nome"
                }),
                search_1.default.createColumn({ name: "city", label: "Cidade" }),
                search_1.default.createColumn({ name: "country", label: "País" }),
                search_1.default.createColumn({ name: "address1", label: "Rua/Avenida" }),
                search_1.default.createColumn({ name: "address2", label: "Complemento" }),
                search_1.default.createColumn({ name: "address3", label: "Bairro" }),
                search_1.default.createColumn({ name: "zip", label: "CEP" }),
                search_1.default.createColumn({
                    name: "state",
                    label: "Estado"
                }),
                //    Search.createColumn({name:'taxidnum', label:'Nº DE REGISTRO DE IVA'})
            ]
        }).run().getRange({
            start: 0,
            end: 1
        });
        var subRecord = search_1.default.lookupFields({
            type: 'subsidiary',
            id: distratoRecord.getValue('custrecord_rsc_subsidiaria_distrato'),
            columns: [
                'taxidnum'
            ]
        });
        var subRecord2 = record_1.default.load({
            type: 'subsidiary',
            id: distratoRecord.getValue('custrecord_rsc_subsidiaria_distrato')
        });
        var address = subRecord2.getSubrecord({
            fieldId: 'returnaddress'
        });
        // String(subLookup.mainaddress_text).split(String(subsidiaria)).join("");
        var enderecoSub = subSearch[0].getValue('address1') + ", " + subSearch[0].getValue('address3') + "" + subSearch[0].getValue('city') + " - " + subSearch[0].getValue('state') + ", CEP. " + subSearch[0].getValue('zip');
        var cnpjSub = subRecord.taxidnum;
        log_1.default.error('city', subSearch[0].getValue('city'));
        log_1.default.error('address', address);
        var nomeCliente;
        var clienteRecord = record_1.default.load({
            type: 'customer',
            id: distratoRecord.getValue('custrecord_rsc_cliente_distrato'),
        });
        if (clienteRecord.getValue('companyname')) {
            nomeCliente = clienteRecord.getValue('companyname');
        }
        else if (clienteRecord.getValue('salutation')) {
            nomeCliente = clienteRecord.getValue('salutation');
        }
        else {
            nomeCliente = clienteRecord.getValue('shipaddressee');
        }
        var qtLinhaEnd = clienteRecord.getLineCount({
            sublistId: 'addressbook'
        });
        var linhaPrincipal = 0;
        for (var i = 0; i < qtLinhaEnd; i++) {
            var defaultbilling = clienteRecord.getSublistValue({
                fieldId: 'defaultbilling',
                sublistId: 'addressbook',
                line: i
            });
            var defaultshipping = clienteRecord.getSublistValue({
                fieldId: 'defaultshipping',
                sublistId: 'addressbook',
                line: i
            });
            var isresidential = clienteRecord.getSublistValue({
                fieldId: 'isresidential',
                sublistId: 'addressbook',
                line: i
            });
            if (defaultbilling && defaultshipping && isresidential) {
                linhaPrincipal = i;
            }
        }
        var AddressSubrecord = clienteRecord.getSublistSubrecord({
            sublistId: 'addressbook',
            fieldId: 'addressbookaddress',
            line: linhaPrincipal
        });
        log_1.default.error('AddressSubrecord', AddressSubrecord);
        log_1.default.error('zip', AddressSubrecord.getValue('zip'));
        var enderecoCliente = AddressSubrecord.getValue('custrecord_enl_city') + " - " + AddressSubrecord.getValue('custrecord_enl_uf') + ", " + AddressSubrecord.getValue('addr1') + ", " + AddressSubrecord.getValue('custrecord_enl_numero') + ", " + AddressSubrecord.getValue('addr3') + ", CEP. " + AddressSubrecord.getValue('zip');
        var contratoRecord = record_1.default.load({
            type: 'invoice',
            id: distratoRecord.getValue('custrecord_rsc_contrato_distrato')
        });
        var dataContrato = contratoRecord.getValue('trandate');
        var dataContratoRelatorio = exports.getMesAno(new Date(dataContrato));
        var valorVendaAtt = String(distratoRecord.getValue('custrecord_rsc_valor_venda'));
        var valorVendaAttExtenso = exports.Extenso(Number(valorVendaAtt));
        var valorPagoAtt = String(distratoRecord.getValue('custrecord_rsc_valorpago'));
        var valorPagoAttExtenso = exports.Extenso(Number(valorPagoAtt));
        var valorAcordado = String(distratoRecord.getValue('custrecord_rsc_valor_acordado'));
        var valorParcelas = (Number(valorAcordado) / Number(parcelas)).toFixed(2);
        var valorAcordadoExtenso = exports.Extenso(Number(valorAcordado));
        var valorParcelasExtenso = exports.Extenso(Number(valorParcelas));
        var dataRodape = exports.getDataRodape();
        var cidadeUF = subSearch[0].getValue('city') + " - " + subSearch[0].getValue('state');
        var infoBancarias = contaLookup.custrecord_rsc_cnab_ba_bank_ls[0].text + " , Agência " + contaLookup.custrecord_rsc_cnab_ba_number_ds;
        var html = exports.beginHtml();
        html += exports.beginBody();
        html += exports.beginMinuta(empreendimento, unidade, subsidiaria, enderecoSub, cnpjSub, nomeCliente, dataContratoRelatorio, valorVendaAtt, valorVendaAttExtenso.toUpperCase(), valorPagoAtt, valorPagoAttExtenso.toUpperCase(), valorAcordado, valorAcordadoExtenso.toUpperCase(), parcelas, valorParcelas, valorParcelasExtenso.toUpperCase(), nConta, infoBancarias, enderecoCliente, dataRodape, cidadeUF);
        html += exports.endBody();
        html += exports.endHtml();
        ctx.response.write(html);
    };
    exports.onRequest = onRequest;
    var getDataRodape = function () {
        var final = "";
        var dataAtual = new Date();
        var dia = dataAtual.getDate();
        var mes = dataAtual.getMonth();
        var ano = dataAtual.getFullYear();
        switch (mes) {
            case 0:
                final = dia + " de Janeiro " + ano;
                break;
            case 1:
                final = dia + " de Fevereiro" + ano;
                break;
            case 2:
                final = dia + " de Março" + ano;
                break;
            case 3:
                final = dia + " de Abril" + ano;
                break;
            case 4:
                final = dia + " de Maio" + ano;
                break;
            case 5:
                final = dia + " de Junho" + ano;
                break;
            case 6:
                final = dia + " de Julho" + ano;
                break;
            case 7:
                final = dia + " de Agosto" + ano;
                break;
            case 8:
                final = dia + " de Setembro" + ano;
                break;
            case 9:
                final = dia + " de Outubro" + ano;
                break;
            case 10:
                final = dia + " de Novembro" + ano;
                break;
            case 11:
                final = dia + " de Dezembro" + ano;
                break;
        }
        return final;
    };
    exports.getDataRodape = getDataRodape;
    var getMesAno = function (dataContrato) {
        var final = "";
        var mes = dataContrato.getMonth();
        var ano = dataContrato.getFullYear();
        switch (mes) {
            case 0:
                final = "Janeiro de " + ano;
                break;
            case 1:
                final = "Fevereiro de " + ano;
                break;
            case 2:
                final = "Março de " + ano;
                break;
            case 3:
                final = "Abril de " + ano;
                break;
            case 4:
                final = "Maio de " + ano;
                break;
            case 5:
                final = "Junho de " + ano;
                break;
            case 6:
                final = "Julho de " + ano;
                break;
            case 7:
                final = "Agosto de " + ano;
                break;
            case 8:
                final = "Setembro de " + ano;
                break;
            case 9:
                final = "Outubro de " + ano;
                break;
            case 10:
                final = "Novembro de " + ano;
                break;
            case 11:
                final = "Dezembro de " + ano;
                break;
        }
        return final;
    };
    exports.getMesAno = getMesAno;
    var Extenso = function (valor) {
        var restante = valor;
        var retorno = '';
        var trilhao = 1000000000000, bilhao = 1000000000, milhao = 1000000;
        if (restante >= trilhao) {
            var trilhoes = Math.round(restante / trilhao);
            restante = restante - (trilhoes * trilhao);
            if (trilhoes > 1) {
                retorno += exports.getCentena(trilhoes) + ' trilhões';
            }
            else {
                retorno += extenso[trilhoes] + ' trilhão';
            }
            if (restante > 0) {
                retorno += ', ';
            }
        }
        if (restante >= bilhao) {
            var bilhoes = Math.round(restante / bilhao);
            restante = restante - (bilhoes * bilhao);
            if (bilhoes > 1) {
                retorno += exports.getCentena(bilhoes) + ' bilhões';
            }
            else {
                retorno += extenso[bilhoes] + ' bilhão';
            }
            if (restante > 0) {
                retorno += ', ';
            }
        }
        if (restante >= milhao) {
            var milhoes = Math.round(restante / milhao);
            restante = restante - (milhoes * milhao);
            if (milhoes > 1) {
                retorno += exports.getCentena(milhoes) + ' milhões';
            }
            else {
                retorno += extenso[milhoes] + ' milhão';
            }
            if (restante > 0) {
                retorno += ', ';
            }
        }
        if (restante >= 1000) {
            var milhas = Math.round(restante / 1000);
            restante = restante - (milhas * 1000);
            retorno += exports.getCentena(milhas) + ' mil';
            if (restante > 0) {
                retorno += ', ';
            }
        }
        retorno += exports.getCentena(restante);
        return retorno;
    };
    exports.Extenso = Extenso;
    var getCentena = function (restante) {
        var retorno = '';
        if (restante >= 100) {
            var milhas = Math.round(restante / 100);
            restante = restante - (milhas * 100);
            if (milhas === 1) {
                retorno += 'cento';
            }
            else {
                retorno += ' ' + extenso[milhas * 100];
            }
            if (restante > 0) {
                retorno += ' e';
            }
        }
        if (restante >= 10) {
            var milhas;
            if (restante <= 10) {
                milhas = Math.round(restante / 10);
            }
            else if (restante < 19) {
                milhas = restante;
            }
            restante = restante - (milhas * 10);
            retorno += ' ' + extenso[milhas];
            if (restante > 0) {
                retorno += ' e';
            }
        }
        if (restante >= 1) {
            var milhas = Math.round(restante / 1);
            restante = restante - milhas;
            retorno += ' ' + extenso[milhas];
            if (restante > 0) {
                retorno += ' e';
            }
        }
        return retorno;
    };
    exports.getCentena = getCentena;
});
