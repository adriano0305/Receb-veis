/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*
* SuiteLet_pdfPosicaoFinanceira.ts
*
* SL responsável pela renderização do HTML para geração
* do relatório de posiçao financeira via arquivo PDF
*
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/record", "N/query", "N/log", "N/runtime", "N/search"], function (require, exports, record_1, query_1, log_1, runtime_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.verificaMes = exports.onRequest = exports.rowEmptyTable = exports.row5columnsTable = exports.rowTable = exports.headerTableFluxo = exports.headerTableOpen = exports.headerTablePlano = exports.headerTable = exports.endTable = exports.beginTable = exports.rodape = exports.contentResumo = exports.tituloTabela = exports.styleInHead = exports.cabecalhoinfo = exports.cabecalhoimg = exports.endPage = exports.beginPage = exports.endBody = exports.beginBody = exports.endHtml = exports.beginHtml = void 0;
    record_1 = __importDefault(record_1);
    query_1 = __importDefault(query_1);
    log_1 = __importDefault(log_1);
    runtime_1 = __importDefault(runtime_1);
    search_1 = __importDefault(search_1);
    // --------- INICIO - MÉTODOS PARA MONTAGEM DO HTML ---------
    //     ----------- NÃO É NECESSÁRIO ALTERAR -----------
    var beginHtml = function () {
        return "\n    <!DOCTYPE html>\n        <html>\n        <head>\n            <meta charset=\"utf-8\">\n            <title></title>\n    ";
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
    var beginPage = function () {
        return "<div class='page'>";
    };
    exports.beginPage = beginPage;
    var endPage = function () {
        return "</div>";
    };
    exports.endPage = endPage;
    var cabecalhoimg = function () {
        return "\n        <div>\n            <div style=\"width: 10%; float: left; margin-left: ;\">\n                <img src=\"https://www.meioemensagem.com.br/wp-content/uploads/2017/05/Gafisa.jpg\" style=\"width: 150px; height: 110px;\">\n            </div>\n            <div style=\"width: 100%;border-bottom: 1px solid #000;display: inline-block; margin-top: 50px; margin-left: 40px;text-align: right;\">\n                <b><span style=\"\">GAFISA SA - SAO PAULO-SP</span></b>\n            </div>\n        </div>\n    ";
    };
    exports.cabecalhoimg = cabecalhoimg;
    var cabecalhoinfo = function (empreendimento, comprador, endereco, cpf, torre, ap) {
        return "\n    <table style=\"width:100%\">\n            <tr>\n                <td>\n                    <img src=\"https://www.meioemensagem.com.br/wp-content/uploads/2017/05/Gafisa.jpg\"  style=\"width: 130px; height: 90px;\">\n                </td>\n                <td>\n                    <div style=\"border-bottom: 1px solid #000;display: inline-block; text-align: center;\">\n                        <b><span >GAFISA SA - SAO PAULO-SP</span></b>\n                    </div>\n                    <div>\n                        <table>\n                        <tr>\n                        <td>EMPREENDIMENTO: ".concat(empreendimento, "</td>\n                        <td>TORRE: ").concat(torre, "</td>\n                        <td>APARTAMENTO: ").concat(ap, "</td>\n                        </tr>\n                        <tr>\n                        <td>COMPRADOR: ").concat(comprador, "</td>\n                        <td></td>\n                        <td>CPF: ").concat(cpf, "</td>\n                        </tr>\n                        <tr>\n                        <td colspan=\"3\">ENDERE\u00C7O: ").concat(endereco, "</td>\n                        </tr>\n                        </table>        \n                    </div>\n                </td>\n            </tr>\n        \n        </table>\n  <br>\n <br> \n  ");
    };
    exports.cabecalhoinfo = cabecalhoinfo;
    var styleInHead = function () {
        return "\n            <style type='text/css'>\n                *{\n                    margin: 0;\n                    padding: 0;\n   font-size: 12px; \n             }\n                .tabela-parcelas td{\n                    padding-left: 10px;\n                    padding-right: 10px;\n                    width: 120px;\n                    text-align: center;\n                }\n                .pagebreak{\n                \tpage-break-before: always;\n                }\n            </style>\n        </head>\n    ";
    };
    exports.styleInHead = styleInHead;
    var tituloTabela = function (titulo) {
        return "\n   <br> \n <br> <div>\n    <div style=\"text-align: center; \">\n        <b><span style=\"font-size: 14px;\">" + titulo + "</span></b>\n    </div>\n</div>\n<hr>\n    ";
    };
    exports.tituloTabela = tituloTabela;
    var contentResumo = function (valorPago, valorAntecipado, saldoDevedor, dataEscrituracao, DAF, caucao, unidadeHipotecada, ordemVenda) {
        return "\n  \n   <table style=\"width:100%\">\n        <tr>\n            <td><span>Total Pago: R$ ".concat(valorPago, "</span><br></td> \n            <td><span>DAF: ").concat(DAF, "</span><br></td>\n        </tr>\n        <tr>\n            <td><span>Total Antecipado: R$ ").concat(valorAntecipado, "</span><br></td> \n            <td><span>Cau\u00E7\u00E3o: ").concat(caucao, "</span><br></td>\n        </tr>\n        <tr>\n            <td><span>Saldo Devedor Corrigido: R$ ").concat(saldoDevedor, "</span><br></td> \n            <td><span>Unidade Hipotecada: ").concat(unidadeHipotecada, "</span><br></td>\n        </tr>\n        <tr>\n            <td><span>Data da Escritura: ").concat(dataEscrituracao, "</span><br></td> \n            <td><span>Ordem de venda: ").concat(ordemVenda, "</span><br></td>\n        </tr>\n    </table>\n    ");
    };
    exports.contentResumo = contentResumo;
    var rodape = function (mesBase, usuario) {
        return "\n    <table style=\"width:100%; height: 100px; align-text:center; margin-top: 20px; border:solid\">\n        <tr style=\"display: flex; justify-content: center; height: 80px\">\n            <td><span>M\u00EAs Base: ".concat(mesBase, "</span><br></td>\n        </tr>\n        <tr style=\"display: flex; justify-content: space-around\"> \n            <td><span></span>P\u00E1gina 1<br></td> \n            <td><span></span><br></td> \n            <td><span>Usu\u00E1rio: ").concat(usuario, "</span><br></td> \n        </tr>\n\n        </tr>\n    </table>\n    <br> \n <br> \n");
    };
    exports.rodape = rodape;
    var beginTable = function () {
        return "\n        <table style=\"width:100%;>\n    ";
    };
    exports.beginTable = beginTable;
    var endTable = function () {
        return "\n        </table>\n  <br> \n    ";
    };
    exports.endTable = endTable;
    var headerTable = function () {
        return "\n    <tr border-bottom: 1px solid #000; text-align: center;\">\n        <th>\n            <b>Tipo Parcela</b>\n        </th>\n               <th>\n            <b>\u00CDndice</b>\n        </th>\n        <th>\n            <b>Valor Parcela</b>\n        </th>\n        <th>\n            <b>Vencimento</b>\n        </th>\n        <th >\n            <b>Pagamento</b>\n        </th>\n        <th>\n            <b>Valor Pago</b>\n        </th>\n    </tr>\n    ";
    };
    exports.headerTable = headerTable;
    var headerTablePlano = function () {
        return "\n    <tr border-bottom: 1px solid #000; text-align: center;\">\n        <th>\n            <b>Tipo Parcela</b>\n        </th>\n               <th>\n            <b>Qtde.</b>\n        </th>\n        <th>\n            <b>Valor Parcela</b>\n        </th>\n        <th>\n            <b>Ind\u00EDce</b>\n        </th>\n        <th >\n            <b>1\u00BA Vencimento</b>\n        </th>\n        <th>\n            <b>Saldo Total</b>\n        </th>\n    </tr>\n    ";
    };
    exports.headerTablePlano = headerTablePlano;
    var headerTableOpen = function () {
        return "\n    <tr border-bottom: 1px solid #000; text-align: center;\">\n        <th>\n            <b>Tipo Parcela</b>\n        </th>\n               <th>\n            <b>Ind\u00EDce</b>\n        </th>\n        <th >\n            <b>Valor da Parcela</b>\n        </th>\n        <th>\n            <b>Vencimento</b>\n        </th>\n    </tr>\n    ";
    };
    exports.headerTableOpen = headerTableOpen;
    var headerTableFluxo = function () {
        return "\n    <tr border-bottom: 1px solid #000; text-align: center;\">\n        <th>\n            <b>Tipo Parcela</b>\n        </th>\n               <th>\n            <b>Quantidade</b>\n        </th>\n        <th>\n            <b>Valor Parcela Atualizado</b>\n        </th>\n        <th>\n            <b>Ind\u00EDce</b>\n        </th>\n        <th >\n            <b>Pr\u00F3ximo Vencimento</b>\n        </th>\n        <th>\n            <b>Saldo Atualizado</b>\n        </th>\n    </tr>\n    ";
    };
    exports.headerTableFluxo = headerTableFluxo;
    var rowTable = function (tipoParcela, indice, valorParcela, vencimento, pagamento, valorPago) {
        return "\n        <tr>\n            <td style=\"border-right: 1px solid #000; \">\n                <span>".concat(tipoParcela, "</span>\n            </td>\n                        <td style=\"border-right: 1px solid #000; \">\n                <span>").concat(indice, "</span>\n            </td>\n            <td style=\"border-right: 1px solid #000; \">\n                <span>R$ ").concat(valorParcela, "</span>\n            </td>\n            <td style=\"border-right: 1px solid #000; \">\n                <span>").concat(vencimento, "</span>\n            </td>\n            <td style=\"border-right: 1px solid #000;\">\n                <span>").concat(pagamento, "</span>\n            </td>\n            <td>\n                <span>R$ ").concat(valorPago, "</span>\n            </td>\n        </tr>\n    ");
    };
    exports.rowTable = rowTable;
    var row5columnsTable = function (tipoParcela, indice, valorParcela, vencimento) {
        return "\n        <tr>\n            <td style=\"border-right: 1px solid #000; \">\n                <span>".concat(tipoParcela, "</span>\n            </td>\n                        <td style=\"border-right: 1px solid #000; \">\n                <span>").concat(indice, "</span>\n            </td>\n            <td style=\"border-right: 1px solid #000; \">\n                <span>R$ ").concat(valorParcela, "</span>\n            </td>\n            <td >\n                <span>").concat(vencimento, "</span>\n            </td>\n        </tr>\n    ");
    };
    exports.row5columnsTable = row5columnsTable;
    var rowEmptyTable = function () {
        return "\n        <tr>\n            <td colspan=\"7\">\n                <span></span>\n            </td>\n        </tr>\n    ";
    };
    exports.rowEmptyTable = rowEmptyTable;
    // --------- FIM - MÉTODOS PARA MONTAGEM DO HTML ---------
    var onRequest = function (ctx) {
        try {
            // Recebimento dos parâmetros da chamada do clientscript
            var idFat = ctx.request.parameters.idFatura;
            log_1.default.error("Param", idFat);
            var faturarec = record_1.default.load({ type: 'salesorder', id: idFat }), qSql = "SELECT " +
                "t.status, " +
                "so.id, " +
                "t.custbody_rsc_tipo_renegociacao, " +
                "t.custbody_rsc_projeto_obra_gasto_compra, " +
                "t.duedate , " +
                "t.closedate, " +
                "t.tranid, " +
                "t.custbodyrsc_tpparc, " +
                "t.custbody_rsc_tran_unidade, " +
                // "t.custbody_rsc_natureza, " +
                "t.foreigntotal, " +
                "t.foreignamountpaid, " +
                "t.foreignamountunpaid," +
                "t.custbody_rsc_indice," +
                "t.custbody_rsc_boleto_criado," +
                "so.custbody_lrc_numero_contrato, " +
                "so.custbody_rsc_unidadehipotecada," +
                "so.custbody_rsc_planocontratual," +
                "so.custbody_rsc_daf," +
                "so.trandate," +
                "so.custbody_rsc_nr_proposta," +
                "FROM transaction as t " +
                "INNER JOIN transaction as so ON (so.recordtype='salesorder' and so.id = t.custbody_lrc_fatura_principal ) " +
                "WHERE t.custbody_lrc_fatura_principal = " + ctx.request.parameters.idFatura;
            /* "WHERE t.recordtype = 'invoice' " +
            "AND t.custbody_lrc_fatura_principal = " + ctx.request.parameters.idFatura; */
            log_1.default.error('result qSql', qSql);
            var qResult = query_1.default.runSuiteQL({
                query: qSql
            });
            var sqlResults = qResult.asMappedResults();
            log_1.default.audit('result sqlResults', sqlResults);
            //Log.error('result sqlResults', sqlResults);
            // Variáveis para montagem da lista de parcelas
            var tabelaBaixadas_1 = '', valorTotalBaixadas_1 = 0, tabelaFluxo = '', tabelaPagamento_1 = '', valorTotalFluxo_1 = 0, valorTotalAntecipado_1 = 0, valorTotalEmAberto_1 = 0, tabelaEmAberto_1 = '', daf_1 = "", dataEscrituracao_1 = "", caucao = "", unidadeHipotecada_1 = "", ordemVenda_1 = "", clienteRecord = record_1.default.load({
                type: 'customer',
                id: faturarec.getValue('entity'),
            }), endereco = clienteRecord.getText('defaultaddress');
            // Carrega as informações de cada parcela para inserir na lista
            var infos_1 = [];
            sqlResults.forEach(function (res) {
                log_1.default.error('res', res);
                if (!ordemVenda_1)
                    ordemVenda_1 = String(res.custbody_lrc_numero_contrato);
                var parcela = search_1.default.lookupFields({
                    type: 'customrecord_rsc_tipo_parcela',
                    id: Number(res.custbodyrsc_tpparc),
                    columns: 'name'
                }), indice = search_1.default.lookupFields({
                    type: 'customrecord_rsc_correction_unit',
                    id: Number(res.custbody_rsc_indice),
                    columns: 'name'
                }), 
                // natureza = search_1.default.lookupFields({
                //     type: 'customlist_rsc_natureza',
                //     id: Number(res.custbody_rsc_natureza),
                //     columns: 'name'
                // });
                dataEscrituracao_1 = res.trandate;
                if (Number(res.custbody_rsc_tipo_renegociacao) == 5) {
                    valorTotalAntecipado_1 += res.foreigntotal;
                }
                // Calculo do total e criação do HTML
                if (+res.foreignamountunpaid == 0) {
                    valorTotalBaixadas_1 += Number(res.foreigntotal) | 0;
                    if(res.foreignamountpaid && res.foreigntotal){
                        tabelaBaixadas_1 += (0, exports.rowTable)(String(parcela.name), String(indice.name), currencyMask(res.foreigntotal.toFixed(2)), String(res.duedate), String(res.closedate), currencyMask(res.foreignamountpaid.toFixed(2)));
                    }
                }
                else if (+res.foreignamountunpaid > 0 && res.custbody_rsc_boleto_criado == 'T') {
                    valorTotalEmAberto_1 += Number(res.foreigntotal);
                    if(res.foreigntotal){

                        tabelaEmAberto_1 += (0, exports.row5columnsTable)(String(parcela.name), String(indice.name), currencyMask(res.foreigntotal.toFixed(2)), String(res.duedate));
                    }
                }
                else if (+res.foreignamountunpaid > 0 && (!res.custbody_rsc_boleto_criado || res.custbody_rsc_boleto_criado == 'F') ) {
                    valorTotalFluxo_1 += Number(res.foreigntotal);
                    var obj = {
                        foreignamountunpaid: res.foreignamountunpaid,
                        foreigntotal: res.foreigntotal,
                        // custbody_rsc_natureza: (natureza.name ? String(natureza.name) : "S/N"),
                        parcelaName: parcela.name,
                        indice: String(indice.name),
                        duedate: res.duedate,
                        quantidade: 1
                    };
                    log_1.default.error("passando", obj);
                    var val = 0;
                    for (var i in infos_1) {
                        if (infos_1[i].parcelaName == obj.parcelaName) {
                            infos_1[i].foreigntotal += obj.foreigntotal;
                            infos_1[i].quantidade++;
                            val = 1;
                            break;
                        }
                        else {
                            val = 0;
                        }
                    }
                    if (!val)
                        infos_1.push(obj);
                    log_1.default.error("lista de parcelas unidadas", infos_1);
                }
                // Verificação caso exista um plano contratual
                if (res.custbody_rsc_planocontratual == 'T') {
                    daf_1 = res.custbody_rsc_daf == 'T' ? "Sim" : "Não";
                    dataEscrituracao_1 = String(res.trandate);
                    //caucao = String(res.custbody_lrc_valor_caucao); caução não está sendo utilizada
                    unidadeHipotecada_1 = res.custbody_rsc_unidadehipotecada == 'T' ? "Sim" : "Não";
                    ordemVenda_1 = String(res.custbody_lrc_numero_contrato);
                    tabelaPagamento_1 += (0, exports.rowTable)(String(parcela.name), String(natureza.name), String(indice.name), currencyMask(res.foreigntotal.toFixed(2)), String(res.dueDate), String(res.trandate), currencyMask(res.foreignamountunpaid.toFixed(2)));
                }
            });
            //AQUI TERMINA O FOR EACH
            // Verifica se terminou de contar as parcelas para criar a linha da TABELA DE FLUXO
            for (var i in infos_1) {
                // var lookupSales = search_1.default.lookupFields({
                //     type:'salesorder',
                //     id: infos_1[i].id,
                //     columns:[
                //         'amountpaid',
                //         'amountremaining'
                //     ]
                // })
                // var valorTotal= 0
                // if(lookupSales.amountpaid){
                //     valorTotal = Number(currencyMask((infos_1[i].foreigntotal).toFixed(2))) - Number(lookupSales.amountpaid)
                // }else{
                //     valorTotal = Number(currencyMask((infos_1[i].foreignamountunpaid).toFixed(2)))
                // }
                // log_1.default.error('valortotal', lookupSales.amountremainingtotalbox);
                tabelaFluxo += (0, exports.rowTable)(String(infos_1[i].parcelaName),  String(infos_1[i].quantidade), currencyMask((infos_1[i].foreignamountunpaid / infos_1[i].quantidade).toFixed(2)), infos_1[i].indice, String(infos_1[i].duedate), currencyMask((infos_1[i].foreignamountunpaid).toFixed(2)));
            }
            //AQUI COMEÇA A MOSTRAR A PAGINA
            var nome = "", unidade = record_1.default.load({ type: 'customrecord_rsc_unidades_empreendimento', id: faturarec.getValue('custbody_rsc_tran_unidade') }), torre = search_1.default.lookupFields({ type: 'customrecord_rsc_bl_emp', id: Number(unidade.getValue('custrecord_rsc_un_emp_bloco')), columns: 'name' });
            if (clienteRecord.getValue('companyname')) {
                nome = String(clienteRecord.getValue('companyname'));
            }
            else if (clienteRecord.getValue('salutation')) {
                nome = String(clienteRecord.getValue('salutation'));
            }
            else {
                nome = String(clienteRecord.getValue('shipaddressee'));
            }
            var dataAtual = new Date(), mes = (0, exports.verificaMes)(dataAtual.getMonth()), ano = dataAtual.getFullYear(), database = mes + "/" + ano, html = (0, exports.beginHtml)();
            html += (0, exports.styleInHead)();
            html += (0, exports.beginBody)();
            html += (0, exports.beginPage)();
            //html += cabecalhoimg();
            html += (0, exports.cabecalhoinfo)(faturarec.getText('custbody_rsc_projeto_obra_gasto_compra'), nome, String(endereco), String(clienteRecord.getValue('custentity_enl_cnpjcpf')), torre.name, unidade.getValue('custrecord_rsc_un_emp_unidade'));
            html += (0, exports.tituloTabela)('RESUMO DA RECEITA IMOBILIÁRIA');
            //html += beginTable();
            html += (0, exports.contentResumo)(currencyMask(valorTotalBaixadas_1.toFixed(2)), currencyMask(valorTotalAntecipado_1.toFixed(2)), currencyMask((valorTotalEmAberto_1 + valorTotalFluxo_1).toFixed(2)), dataEscrituracao_1, daf_1 ? daf_1 : "Não", caucao ? caucao : "Não", unidadeHipotecada_1 ? unidadeHipotecada_1 : "Não", ordemVenda_1);
            html += (0, exports.tituloTabela)('PARCELAS BAIXADAS');
            html += (0, exports.beginTable)();
            html += (0, exports.headerTable)();
            html += tabelaBaixadas_1.length > 0 ? tabelaBaixadas_1 : (0, exports.rowEmptyTable)();
            html += (0, exports.endTable)();
            html += (0, exports.tituloTabela)('PARCELAS EM ABERTO');
            html += (0, exports.beginTable)();
            html += (0, exports.headerTableOpen)();
            html += tabelaEmAberto_1.length > 0 ? tabelaEmAberto_1 : (0, exports.rowEmptyTable)();
            html += (0, exports.endTable)();
            html += (0, exports.tituloTabela)('FLUXO ATUAL DE PAGAMENTO (A VENCER)');
            html += (0, exports.beginTable)();
            html += (0, exports.headerTableFluxo)();
            html += tabelaFluxo.length > 0 ? tabelaFluxo : (0, exports.rowEmptyTable)();
            html += (0, exports.endTable)();
            html += (0, exports.endTable)();
            html += (0, exports.endPage)();
            html += (0, exports.rodape)(database, runtime_1.default.getCurrentUser().name);
            html += (0, exports.endBody)();
            html += (0, exports.endHtml)();
            // Renderização do HTML em PDF
            ctx.response.write(html);
        }
        catch (e) {
            log_1.default.error('Erro na geração do PDF', e);
        }
    };
    exports.onRequest = onRequest;
    // Metodo para retorno do mês em string
    var verificaMes = function (mes) {
        mes++;
        return mes > 10 ? String(mes) : 0 + String(mes);
    };
    exports.verificaMes = verificaMes;
    function currencyMask(x) {
        return x.toString().replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
});
