/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *
 * MapReduce_fluxoEscritura.js
 *
 * Esse script é responsável por enviar e-mails aos clientes relacionados à Fatura do Controle de Escrituração
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/search", "N/log", "N/file", "./ClientScript_fluxoEscritura"], function (require, exports, search_1, log_1, file_1, ClientScript_fluxoEscritura_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.map = exports.getInputData = void 0;
    search_1 = __importDefault(search_1);
    log_1 = __importDefault(log_1);
    file_1 = __importDefault(file_1);
    var getInputData = function () {
        // Buscar controles de escriturações com status diferente de
        // 2.11 - Declaração de Baixa de Alienação Enviada
        try {
            return search_1.default.create({type: "customrecord_lrc_controle_escrituracao",
                filters: [
                    ["custrecord_lrc_status_escrituracao","noneof","24"], "AND", 
                    ["internalid","anyof","660"]
                ],
                columns: [
                    "custrecord_lrc_fatura_de_venda","custrecord_lrc_status_escrituracao","custrecord_lrc_data_escrituracao"
                ]
            });
        }
        catch (error) {
            log_1.default.error('getInputData error', error);
            return [];
        }
    };
    exports.getInputData = getInputData;
    var map = function (ctx) {
        var req = JSON.parse(ctx.value);
        var controleEscrituracaoId = req.id;
        var controleEscrituracao = req.values;
        var faturaDoControleId = controleEscrituracao.custrecord_lrc_fatura_de_venda.value;
        var statusAtualControle = controleEscrituracao.custrecord_lrc_status_escrituracao.value;
        log_1.default.error('status', statusAtualControle);
        var dataInicioEscrituracao = controleEscrituracao.custrecord_lrc_data_escrituracao;
        var nomeControle = controleEscrituracao.name;
        log_1.default.debug('faturaID', faturaDoControleId);
        try {
            var faturaDoControle = search_1.default.lookupFields({
                type: 'salesorder',
                id: faturaDoControleId,
                columns: [
                    'status',
                    'entity',
                    'trandate',
                    'subsidiary',
                    'custbody_lrc_parcela_alienacao',
                    'custbody_rsc_projeto_obra_gasto_compra'
                ]
            });
            log_1.default.debug('faturaDoControle', faturaDoControle);
            // Dados da fatura relacionada ao controle de escrituração
            var statusFatura = faturaDoControle.status[0].value;
            var diferencaDias = calculateDaysDiff(controleEscrituracaoId);
            log_1.default.debug('diferenca dias', diferencaDias);
            // Buscando as parametrizações de escrituração da subsidiária da fatura
            var recordParametrizacoes = ClientScript_fluxoEscritura_1.getRecordParametrizacoes(faturaDoControle.subsidiary[0].value);
            log_1.default.debug('recordParametrização result', recordParametrizacoes);
            log_1.default.debug('fatura do cotrole', faturaDoControle);
            // Setar os dados do email
            var clienteDoControle = search_1.default.lookupFields({
                type: 'customer',
                id: faturaDoControle.entity[0].value,
                columns: [
                    'email',
                    'altemail'
                ]
            });
            var dadosEmail = {
                author: 0,
                recipient: clienteDoControle.email ? clienteDoControle.email : clienteDoControle.altemail,
                faturaId: Number(faturaDoControleId),
                modeloId: 0
            };
            log_1.default.debug('JSONemail', clienteDoControle.email);
            log_1.default.debug('altemail', clienteDoControle.altemail);
            var jsonFaturaDados = {
                tipoEscrituracao: 0,
                novaDataInicio: 0,
                novaDataPlanejadaEntrega: 0,
                statusAtualEscrituracaoId: statusAtualControle,
                controleEscrituracaoId: controleEscrituracaoId,
                newStatusId: 0,
                escrituraEncerrada: false,
                subsidiaria: faturaDoControle.subsidiary[0].value,
                baixaAlienacao: 0,
            };
            // Status 1.04.x
            if (statusAtualControle >= 4 && statusAtualControle <= 6) {
                var dataLimite_1_04 = Number(recordParametrizacoes.getValue('custrecord_lrc_prazo_alt_status_1_4'));
                var dataLimite_1_04_2 = Number(recordParametrizacoes.getValue('custrecord_lrc_prazo_alt_status_1_4_2'));
                var dataLimite_1_04_3 = Number(recordParametrizacoes.getValue('custrecord_lrc_prazo_alt_status_1_4_3'));
                dadosEmail.author = Number(recordParametrizacoes.getValue('custrecord_lrc_autor_email_1_4'));
                dadosEmail.modeloId = Number(recordParametrizacoes.getValue('custrecord_lrc_modelo_email_1_4'));
                // 1.04 Apto para Outorga de Escritura Definitiva
                if (statusAtualControle === '4' && diferencaDias >= dataLimite_1_04) {
                    jsonFaturaDados.newStatusId = 5;
                    dadosEmail.author = Number(recordParametrizacoes.getValue('custrecord_lrc_autor_email_1_04_2'));
                    dadosEmail.modeloId = Number(recordParametrizacoes.getValue('custrecord_lrc_modelo_email_1_04_2'));
                    ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
                    ClientScript_fluxoEscritura_1.requestSendEmail(dadosEmail);
                    log_1.default.debug('apto outorga', 'done');
                }
                // 1.04.2 - Comunicado por E-mail1;
                else if (statusAtualControle === '5' && diferencaDias >= dataLimite_1_04_2) {
                    jsonFaturaDados.newStatusId = 6;
                    dadosEmail.author = Number(recordParametrizacoes.getValue('custrecord_lrc_autor_email_1_04_3'));
                    dadosEmail.modeloId = Number(recordParametrizacoes.getValue('custrecord_lrc_modelo_email_1_04_3'));
                    ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
                    ClientScript_fluxoEscritura_1.requestSendEmail(dadosEmail);
                    log_1.default.debug('comunicado por email1 1.04.2', 'done');
                }
                // 1.04.3 - Comunicado por E-mail2
                else if (statusAtualControle === '6' && diferencaDias >= dataLimite_1_04_3) {
                    jsonFaturaDados.newStatusId = 7;
                    ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
                    log_1.default.debug('comunicado por email2 1.04.3', 'done');
                }
            }
            // Checa se há alguma parcela de alienação na fatura
            // if (faturaDoControle.custbody_lrc_parcela_alienacao) {
            if (parcelasAlienacao(faturaDoControleId) == true) {
                var diferencaDiasIniciarOutorga = calculateDaysDiffIniciarOutorga(dataInicioEscrituracao);
                var dataAlteracao_2_01 = Number(recordParametrizacoes.getValue('custrecord_lrc_prazo_alt_status_2_1'));
                log_1.default.debug('dataAlteracao_2_01', dataAlteracao_2_01);
                // Verifica se a fatura ainda esta em algum estado anterior ao 2.x
                if (statusAtualControle < 14) {
                    jsonFaturaDados.newStatusId = 14;
                    jsonFaturaDados.tipoEscrituracao = 2;
                    jsonFaturaDados.novaDataInicio = new Date();
                    ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
                }
                // Estado 2.01 - Iniciar Outorga 
                else if (statusAtualControle === '17' && diferencaDiasIniciarOutorga >= dataAlteracao_2_01) {
                    dadosEmail.author = Number(recordParametrizacoes.getValue('custrecord_lrc_autor_email_2_02'));
                    dadosEmail.modeloId = Number(recordParametrizacoes.getValue('custrecord_lrc_modelo_email_2_02'));
                    log_1.default.debug('dados email', dadosEmail);
                    ClientScript_fluxoEscritura_1.requestSendEmail(dadosEmail);
                    log_1.default.debug("Dias Status 2.04", diferencaDiasIniciarOutorga);
                    jsonFaturaDados.newStatusId = 15;
                    ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
                }
                // 2.09 - Escritura de Alienação Fiduciária Registrada
                else if (statusAtualControle === '22' && statusFatura === 'paidInFull') {
                    log_1.default.debug('status 2.09', 'done');
                    // Dados do documento
                    var docBody = recordParametrizacoes.getValue('custrecord_lrc_corpo_documento');
                    var docFolder = recordParametrizacoes.getValue('custrecord_lrc_pasta_documento');
                    // Cria um arquivo de baixa de alienação baseado na parametrizacao de escritura
                    var baixaAlienacaoFileObj = file_1.default.create({
                        name: 'Baixa alienacao do ' + nomeControle,
                        fileType: file_1.default.Type.PLAINTEXT,
                        contents: docBody,
                        folder: docFolder,
                        isOnline: false
                    });
                    var baixaAlienacaoFileObjId = baixaAlienacaoFileObj.save();
                    jsonFaturaDados.newStatusId = 23;
                    jsonFaturaDados.baixaAlienacao = baixaAlienacaoFileObjId;
                    ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
                }
            }
            else {
                // Caso a parcela de alienação seja removida da fatura enquanto estiver em algum status 2.x
                if (statusAtualControle >= 14) {
                    var empreedimentoDaFatura = search_1.default.lookupFields({
                        type: 'job',
                        id: faturaDoControle.custbody_rsc_projeto_obra_gasto_compra[0].value,
                        columns: [
                            'calculatedenddate',
                            'startdate'
                        ]
                    });
                    jsonFaturaDados.novaDataInicio = stringToDate(empreedimentoDaFatura.startdate);
                    jsonFaturaDados.novaDataPlanejadaEntrega = stringToDate(empreedimentoDaFatura.calculatedenddate);
                    jsonFaturaDados.newStatusId = 1,
                        jsonFaturaDados.tipoEscrituracao = 1;
                    log_1.default.debug('jsonFaturaDados', jsonFaturaDados);
                    log_1.default.debug('empreedimentoDaFatura', empreedimentoDaFatura);
                    ClientScript_fluxoEscritura_1.changeDeedControlStatus(jsonFaturaDados);
                }
            }
        }
        catch (error) {
            log_1.default.error('map geral error', error);
        }
    };
    exports.map = map;
    var calculateDaysDiff = function (controleEscrituracaoId) {
        var lastOrdemTabelaAndamentoStatus = search_1.default.create({
            type: 'customrecord_lrc_tab_andamento_status',
            filters: [
                ['custrecord_lrc_controle_escrituracao', 'IS', controleEscrituracaoId],
            ],
            columns: [
                search_1.default.createColumn({
                    name: 'custrecord_lrc_ordem_criacao_tabela',
                    summary: search_1.default.Summary.MAX
                }),
            ]
        }).run().getRange({
            start: 0,
            end: 1
        })[0];
        var lastTabelaAndamentoStatus = search_1.default.create({
            type: 'customrecord_lrc_tab_andamento_status',
            filters: [
                ['custrecord_lrc_controle_escrituracao', 'IS', controleEscrituracaoId],
                'AND',
                [
                    'custrecord_lrc_ordem_criacao_tabela',
                    search_1.default.Operator.EQUALTO,
                    Number(lastOrdemTabelaAndamentoStatus.getAllValues()['MAX(custrecord_lrc_ordem_criacao_tabela)'])
                ]
            ],
            columns: ['custrecord_lrc_hora_data_status_final']
        }).run().getRange({
            start: 0,
            end: 1
        })[0];
        var dataHoraFinalLastTabela = lastTabelaAndamentoStatus.getValue('custrecord_lrc_hora_data_status_final');
        var _a = dataHoraFinalLastTabela.split(' '), data = _a[0], hora = _a[1];
        // Criando objeto de data com regex
        data = data.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3");
        var dataFinalObj = new Date(data + ' ' + hora);
        var diffInMiliseconds = Math.abs(new Date().getTime() - dataFinalObj.getTime());
        return Math.round(diffInMiliseconds / (1000 * 60 * 60 * 24));
    };
    var calculateDaysDiffIniciarOutorga = function (dataInicioEscrituracao) {
        var dataInicioEscrituracaoObj = stringToDate(dataInicioEscrituracao);
        var diffInMiliseconds = Math.abs(new Date().getTime() - dataInicioEscrituracaoObj.getTime());
        return Math.floor(diffInMiliseconds / (1000 * 60 * 60 * 24));
    };
    var stringToDate = function (date) {
        return new Date(date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"));
    };
    function parcelasAlienacao(idInterno) {
        log_1.default.error('parcelasAlienacao', idInterno);

        var ret = false;

        search_1.default.create({type: "invoice",
            filters: [
               ["mainline","is","T"], "AND", 
               ["type","anyof","CustInvc"], "AND", 
               ["custbody_lrc_fatura_principal","anyof",idInterno], "AND", 
               ["custbody_lrc_parcela_alienacao","is","T"]
            ],
            columns: [
                "trandate","entity","statusref","subsidiary","custbody_lrc_parcela_alienacao","custbody_rsc_projeto_obra_gasto_compra"
            ]
        }).run().each(function (result) {
            log_1.default.error('result', result);
            if (result.getValue('custbody_lrc_parcela_alienacao') == true) {
                ret = true;
            }            
            return true;
        });

        return ret;
    }
});
