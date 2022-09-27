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
define(["require", "exports", "N/log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = exports.assinatura = exports.thirdTable = exports.gerarObservacoes = exports.secondTable = exports.firstTable = exports.tituloRelatorio = exports.endBody = exports.beginBody = exports.styleInHead = exports.endHtml = exports.beginHtml = void 0;
    log_1 = __importDefault(log_1);
    var beginHtml = function () {
        return "\n    <!DOCTYPE html>\n        <html>\n        <head>\n            <meta charset=\"utf-8\">\n            <title></title>\n    ";
    };
    exports.beginHtml = beginHtml;
    var endHtml = function () {
        return "</html>";
    };
    exports.endHtml = endHtml;
    var styleInHead = function () {
        return "\n            <style type=\"text/css\">\n            *{\n                padding: 0;\n                margin: 0;\n            }\n            </style>\n        </head>\n    ";
    };
    exports.styleInHead = styleInHead;
    var beginBody = function () {
        return "<body>";
    };
    exports.beginBody = beginBody;
    var endBody = function () {
        return "</body>";
    };
    exports.endBody = endBody;
    var tituloRelatorio = function () {
        return " \n        <h1 style=\"text-align: center;\">POSI\u00C7\u00C3O PARA DISTRATO</h1>\n    ";
    };
    exports.tituloRelatorio = tituloRelatorio;
    var firstTable = function (obra, unidade, comprador, vendedor) {
        return "\n    <div style=\"margin-left: 250px;\">\n        <table>\n            <tr>\n                <td><span><b>Obra/Bloco:</b></span></td>\n                <td><span> " + obra + "</span></td><br>\n            </tr>\n            <tr>\n                <td><span><b>Unidade:</b></span></td>\n                <td><span> " + unidade + "</span></td><br>\n            </tr>\n            <tr>\n                <td><span><b>Promitente Comprador:</b></span></td>\n                <td><span> " + comprador + "</span></td><br>\n            </tr>\n            <tr>\n                <td><span><b>Promitente Vendedor:</b></span></td>\n                <td><span> " + vendedor + "</span></td><br>\n            </tr>\n        </table>\n    </div>\n    <br>\n   ";
    };
    exports.firstTable = firstTable;
    var secondTable = function (receitaImobi, receitaServicos, total, valorvendaAtt, valorPagoAtt, receitaServicoPago, valorDevolucao) {
        return "\n    <div>\n\t\t\n        <table style=\"border: 1px solid #000; width: 700px; margin-left: 30px;\">\n            <tr style=\"height: 10px;\">\n                <td style=\"border-bottom: 1px solid #000;\">\n                    <p style=\"margin-left: 220px;\"><b>VALORES PAGOS HIST\u00D3RICOS (R$)</b></p>\n                </td>\n                <td style=\"border-bottom: 1px solid #000;\"></td>\n            </tr>\n            <tr>\n                <td>\n                    <span><b>Receita Imobili\u00E1ria:</b></span>\n                </td>\n                <td style=\"\ttext-align: right;\">\n                    <span>" + receitaImobi + "</span><br>\n                </td>\n            </tr>\n            <tr>\t\n                <td>\t\n                    <span ><b>Receita de Servi\u00E7os:</b></span>\n                </td>\n                <td style=\"text-align:right;\" >\t\n                    <span>" + receitaServicos + "</span><br>\n                </td>\n                    \n            </tr>\n            <tr>\t\n                <td style=\"border-bottom: 1px solid #000; \">\t\n                    <span ><b>Total:</b></span>\n                </td>\n                <td style=\"text-align:right;border-bottom: 1px solid #000;\" >\t\n                    <span>" + total + "</span><br>\n                </td>\t\n            </tr>\n            <tr>\n                <td style=\"border-bottom: 1px solid #000; \">\n                    <p style=\"margin-left: 250px;\"><b>VALORES ATUALIZADOS</b></p>\n                </td>\n                <td style=\"border-bottom: 1px solid #000;\"></td>\n            </tr>\n            <tr>\n                <td>\n                    <span><b>Valor Atualizado de Venda:</b></span>\n                </td>\n                <td style=\"\ttext-align: right;\">\n                    <span>" + valorvendaAtt + "</span><br>\n                </td>\n            </tr>\n            <tr>\t\n                <td>\t\n                    <span ><b>Valor Pago Atualizado:</b></span>\n                </td>\n                <td style=\"text-align:right;\" >\t\n                    <span >" + valorPagoAtt + "</span><br>\n                </td>\n                    \n            </tr>\n            <tr>\t\n                <td >\t\n                    <span ><b>Valor Pago de Receita de Servi\u00E7os:</b></span>\n                </td>\n                <td style=\"text-align:right;\" >\t\n                    <span>" + receitaServicoPago + "</span><br>\n                </td>\t\n            </tr>\n            <tr>\t\n                <td >\t\n                    <span ><b>Valor da Devolu\u00E7\u00E3o:</b></span>\n                </td>\n                <td style=\"text-align:right;\" >\t\n                    <span >" + valorDevolucao + "</span><br>\n                </td>\t\n            </tr>\t\t\t\n        </table>\n    </div>\n    <br>\n    ";
    };
    exports.secondTable = secondTable;
    var gerarObservacoes = function (observacoes) {
        return " \n    <p style=\"text-align: center;\"><b>OBSERVA\u00C7\u00D5ES</b></p>\n\t<br>\n\t<div style=\"margin-left: 50px;\">\t\n\t\t<span>\t\n\t\t\t" + observacoes + "\n\t\t</span><br>\t\n\t\t<br>\t\n\t\t<br>\n    ";
    };
    exports.gerarObservacoes = gerarObservacoes;
    var thirdTable = function (motivo, ultParcela, feitaPor, cartorio, condominio, iptu, dataAtraso, valorVencido, valorVencer) {
        return "\n    <table>\n        <tr>\n            <td><span><b>Motivo do Distrato:</b> " + motivo + "</span><br></td>\n        </tr>\n        <tr>\n            <td><span><b>\u00DAltima parcela paga:</b> " + ultParcela + "</span><br></td>\n        </tr>\n        <tr>\n            <td><span><b>Escritura feita por:</b> " + feitaPor + "</span><br></td>\n        </tr>\n        <tr>\n            <td><span><span><b>Pagamento ao Cliente</b></span><br></td>\n        </tr>\n        <tr>\n            <td><span><b>Despesas de cart\u00F3rio:</b> " + cartorio + "</span><br></td>\n        </tr>\n        <tr>\n            <td><span><b>Condominio Vencido:</b> " + condominio + "</span><br></td>\n        </tr>\n        <tr>\n            <td><span><b>IPTU:</b> " + iptu + "</span><br></td>\n        </tr>\n        <tr>\n            <td><span><b>Data de inicio de atraso:</b> " + dataAtraso + "</span><br></td>\n        </tr>\n        <tr>\n            <td><span><b>Valores vencidos:</b> " + valorVencido + "</span><br></td>\n        </tr>\n        <tr>\n            <td><span><b>Valores a vencer:</b> " + valorVencer + "</span><br></td>\n        </tr>\n    </table>\t\n    </div>\n    <br>\t\n    <br>\t\n    <br>\t\n    <br>\n    ";
    };
    exports.thirdTable = thirdTable;
    var assinatura = function () {
        return "\n    <div style=\"text-align:center;border-top:1px solid #000;width: 250px; margin-left: 250px\"><p style=\"text-align: center;\"><b>DE ACORDO</b></p></div>\n    ";
    };
    exports.assinatura = assinatura;
    var onRequest = function (ctx) {
        var parametros = ctx.request.parameters;
        var obra = parametros.obra;
        var unidade = parametros.unidade;
        var comprador = parametros.comprador;
        var vendedor = parametros.vendedor;
        var receitaImobi = parametros.receitaImobi;
        var receitaServicos = parametros.receitaServicos;
        var total = String(Number(receitaImobi) + Number(receitaImobi));
        var valorVendaAtt = parametros.valorVendaAtt;
        var valorPagoAtt = parametros.valorPagoAtt;
        var receitaServicoPago = parametros.receitaServicoPago;
        var valorDevolucao = parametros.valorDevolucao;
        var observacoes = parametros.observacoes;
        log_1.default.error('observações', observacoes);
        var motivo = parametros.motivo;
        var ultParcela = parametros.ultParcela;
        var feitoPor = parametros.feitoPor;
        var cartorio = parametros.cartorio;
        var condominio = parametros.condominio;
        var iptu = parametros.iptu;
        var dataAtraso = parametros.dataAtraso;
        var valorVencido = parametros.valorVencido;
        var valorVencer = parametros.valorVencer;
        var html = exports.beginHtml();
        html += exports.styleInHead();
        html += exports.beginBody();
        html += exports.tituloRelatorio();
        html += exports.firstTable(obra, unidade, comprador, vendedor);
        html += exports.secondTable(receitaImobi, receitaServicos, total, valorVendaAtt, valorPagoAtt, receitaServicoPago, valorDevolucao);
        html += exports.gerarObservacoes(observacoes);
        html += exports.thirdTable(motivo, ultParcela, feitoPor, cartorio, condominio, iptu, dataAtraso, valorVencido, valorVencer);
        html += exports.assinatura();
        html += exports.endBody();
        html += exports.endHtml();
        ctx.response.write(html);
    };
    exports.onRequest = onRequest;
});
