/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *
 * fluxoEscritura.ts
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/record", "N/currentRecord", "N/search", "N/log", "N/https", "N/url"], function (require, exports, record_1, currentRecord_1, search_1, log_1, https_1, url_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    record_1 = __importDefault(record_1);
    currentRecord_1 = __importDefault(currentRecord_1);
    search_1 = __importDefault(search_1);
    log_1 = __importDefault(log_1);
    https_1 = __importDefault(https_1);
    url_1 = __importDefault(url_1);
    exports.pageInit = function () {
    };
    // Função a ser chamada por meio dos botões
    exports.callChangeDeedControlStatus = function (newStatusId, reinicioProcesso) {
        var controleRecord = currentRecord_1.default.get();
        var jsonFaturaDados = JSON.parse(controleRecord.getValue('custpage_dados_fluxo'));
        // Verifica se o botão 'Reinício Processo" foi acionado 
        if (reinicioProcesso)
            jsonFaturaDados['reinicioProcesso'] = true;
        // Caso seja passado por parâmetro, preencher newStatusId com tal valor
        if (newStatusId)
            jsonFaturaDados.newStatusId = parseInt(newStatusId);
        exports.changeDeedControlStatus(jsonFaturaDados);
        document.location.reload();
    };
    exports.changeDeedControlStatus = function (jsonFaturaDados) {
        log_1.default.debug("changeDeedControlStatus", jsonFaturaDados);
        var controleEscrituracao = record_1.default.load({
            type: 'customrecord_lrc_controle_escrituracao',
            id: jsonFaturaDados.controleEscrituracaoId
        });
        try {
            controleEscrituracao.setValue({
                fieldId: 'custrecord_lrc_status_escrituracao',
                value: jsonFaturaDados.newStatusId
            });
            // Preenche a matrícula somente se ela for enviada no JSON
            if (jsonFaturaDados.hasOwnProperty('matriculaId')) {
                controleEscrituracao.setValue({
                    fieldId: 'custrecord_lrc_matricula',
                    value: jsonFaturaDados.matriculaId
                });
            }
            // Insere uma nova data planejada caso tenha sido passada alguma pelo JSON
            if (jsonFaturaDados.novaDataInicio != 0) {
                controleEscrituracao.setValue({
                    fieldId: 'custrecord_lrc_data_escrituracao',
                    value: new Date(jsonFaturaDados.novaDataInicio)
                });
            }
            if (jsonFaturaDados.novaDataPlanejadaEntrega != 0) {
                controleEscrituracao.setValue({
                    fieldId: 'custrecord_lrc_data_entrega_construcao',
                    value: new Date(jsonFaturaDados.novaDataPlanejadaEntrega)
                });
            }
            // Insere a baixa de alienação caso tenha sido passado algum valor pelo JSON
            if (jsonFaturaDados.baixaAlienacao != 0) {
                controleEscrituracao.setValue({
                    fieldId: 'custrecord_lrc_baixa_alienacao',
                    value: jsonFaturaDados.baixaAlienacao
                });
            }
            // Altera o tipo de escrituração caso tenha sido passado por JSON
            if (jsonFaturaDados.tipoEscrituracao != 0) {
                controleEscrituracao.setValue({
                    fieldId: 'custrecord_lrc_tipo_escrituracao',
                    value: jsonFaturaDados.tipoEscrituracao
                });
            }
            var isAjusteProcessoAssociado = false;
            // Insere uma nova data ao Data de Reinicio Processo no caso do botão "Reinicio Processo"
            if (jsonFaturaDados.reinicioProcesso) {
                isAjusteProcessoAssociado = true;
                controleEscrituracao.setValue({
                    fieldId: 'custrecord_lrc_reinicio_processo',
                    value: new Date()
                });
                // Armazena o status que foi feito o reinício do processo
                controleEscrituracao.setValue({
                    fieldId: 'custrecord_lrc_status_reinicio_processo',
                    value: jsonFaturaDados.statusAtualEscrituracaoId
                });
            }
            else {
                var dataReinicioProcesso = controleEscrituracao.getValue('custrecord_lrc_reinicio_processo');
                var statusReinicioProcesso = controleEscrituracao.getValue('custrecord_lrc_status_reinicio_processo');
                log_1.default.debug('statusReinicioProcesso', statusReinicioProcesso);
                // Verifica se há um reinício de processo em aberto
                if (statusReinicioProcesso) {
                    isAjusteProcessoAssociado = true;
                    // Se o status atual do Controle for igual ao do reinício processo, significa que o Reinicio Processo foi finalizado
                    if (jsonFaturaDados.statusAtualEscrituracaoId == statusReinicioProcesso) {
                        isAjusteProcessoAssociado = false;
                    }
                    // Verifica se o tempo limite de reinício de processo foi ultrapassado
                    else if (isAjusteProcessoAssociado) {
                        var recordParametrizacoes = exports.getRecordParametrizacoes(jsonFaturaDados.subsidiaria);
                        var prazoReiniciarProcesso = recordParametrizacoes.getValue('custrecord_lrc_prazo_reiniciar');
                        isAjusteProcessoAssociado = checkPrazoReinicioProcesso(dataReinicioProcesso, Number(prazoReiniciarProcesso));
                    }
                    // Remove o status de reinicío de processo caso tenha sido verificado que o ajuste de processo foi finalizado
                    if (!isAjusteProcessoAssociado) {
                        log_1.default.debug('statusReinicioProcesso2', statusReinicioProcesso);
                        controleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_status_reinicio_processo',
                            value: ''
                        });
                    }
                }
            }
            controleEscrituracao.save();
            var tabelaAndamentoDados = {
                controleEscrituracaoId: jsonFaturaDados.controleEscrituracaoId,
                faturaId: controleEscrituracao.getValue('custrecord_lrc_fatura_de_venda'),
                clienteReferente: controleEscrituracao.getValue('custrecord_lrc_cliente_ce'),
                statusAtualId: jsonFaturaDados.statusAtualEscrituracaoId,
                novoStatusId: jsonFaturaDados.newStatusId,
                horaDataInicial: searchHoraDataStatusAnterior(jsonFaturaDados.controleEscrituracaoId),
                horaDataFinal: new Date(),
                escrituraEncerrada: jsonFaturaDados.escrituraEncerrada,
                ajusteProcessoAssociado: isAjusteProcessoAssociado
            };
            exports.createTabelaAndamentoStatus(tabelaAndamentoDados);
        }
        catch (error) {
            log_1.default.error("changeDeedControlStatus erro", error);
        }
    };
    var checkPrazoReinicioProcesso = function (dataReinicioProcesso, prazoReiniciarProcesso) {
        var diffInMiliseconds = (prazoReiniciarProcesso * 60 * 60 * 1000) - dataReinicioProcesso.getTime();
        if (Math.ceil(diffInMiliseconds / (1000 * 60 * 60)) < prazoReiniciarProcesso)
            return true;
        return false;
    };
    exports.createTabelaAndamentoStatus = function (tabelaAndamentoDados) {
        log_1.default.debug('tabela andamento', tabelaAndamentoDados);
        try {
            var newTabelaAndamentoStatus = record_1.default.create({
                type: 'customrecord_lrc_tab_andamento_status'
            });
            // Setando os valores de uma nova Tabela de Andamentos de Status
            if (tabelaAndamentoDados.statusAtualId) {
                newTabelaAndamentoStatus.setValue({
                    fieldId: 'name',
                    value: 'Tabela Andamento Status (' + getStatusName(tabelaAndamentoDados.statusAtualId) +
                        ' -> ' + getStatusName(tabelaAndamentoDados.novoStatusId) + ')'
                });
            }
            else {
                newTabelaAndamentoStatus.setValue({
                    fieldId: 'name',
                    value: 'Tabela Andamento Status (' + getStatusName(tabelaAndamentoDados.novoStatusId) + ')'
                });
            }
            newTabelaAndamentoStatus.setValue({
                fieldId: 'custrecord_lrc_controle_escrituracao',
                value: tabelaAndamentoDados.controleEscrituracaoId
            });
            newTabelaAndamentoStatus.setValue({
                fieldId: 'custrecord_lrc_referente_faturamento',
                value: tabelaAndamentoDados.faturaId
            });
            const lookupSO = search_1.default.lookupFields({type: 'salesorder',
                id: tabelaAndamentoDados.faturaId,
                columns: ['entity','custbody_rsc_status_contrato']
            });
            log_1.default.audit('lookupSO', lookupSO);
            // Transferido (Cessão de Direito)
            if (lookupSO.custbody_rsc_status_contrato[0].value == 4) {
                newTabelaAndamentoStatus.setValue({
                    fieldId: 'custrecord_lrc_referente_cliente',
                    value: lookupSO.entity[0].value
                });
            } else {
                newTabelaAndamentoStatus.setValue({
                    fieldId: 'custrecord_lrc_referente_cliente',
                    value: tabelaAndamentoDados.clienteReferente
                });
            }            
            newTabelaAndamentoStatus.setValue({
                fieldId: 'custrecord_lrc_status_alterado',
                value: tabelaAndamentoDados.statusAtualId
            });
            newTabelaAndamentoStatus.setValue({
                fieldId: 'custrecord_lrc_alterado_para_status',
                value: tabelaAndamentoDados.novoStatusId
            });
            if (tabelaAndamentoDados.horaDataInicial && tabelaAndamentoDados.horaDataInicial != null) {
                newTabelaAndamentoStatus.setValue({
                    fieldId: 'custrecord_lrc_hora_data_status_inicial',
                    value: tabelaAndamentoDados.horaDataInicial
                });
                newTabelaAndamentoStatus.setValue({
                    fieldId: 'custrecord_lrc_tempo_total',
                    value: getTempoTotal(tabelaAndamentoDados.horaDataInicial, tabelaAndamentoDados.horaDataFinal)
                });
            } else {
                tabelaAndamentoDados.horaDataInicial = dataCriacaoCtrlEsc(tabelaAndamentoDados.controleEscrituracaoId);
                newTabelaAndamentoStatus.setValue('custrecord_lrc_hora_data_status_inicial', tabelaAndamentoDados.horaDataInicial)
                .setValue('custrecord_lrc_tempo_total', getTempoTotal(tabelaAndamentoDados.horaDataInicial, tabelaAndamentoDados.horaDataFinal));
            }
            newTabelaAndamentoStatus.setValue({
                fieldId: 'custrecord_lrc_hora_data_status_final',
                value: tabelaAndamentoDados.horaDataFinal
            });
            newTabelaAndamentoStatus.setValue({
                fieldId: 'custrecord_lrc_ajuste_processo_associado',
                value: tabelaAndamentoDados.ajusteProcessoAssociado
            });
            newTabelaAndamentoStatus.setValue({
                fieldId: 'custrecord_lrc_escritura_encerrada',
                value: tabelaAndamentoDados.escrituraEncerrada
            });
            var tabelaAndamentoCount = Number(getTabelaAndamentoCount(tabelaAndamentoDados.controleEscrituracaoId)) + 1;
            newTabelaAndamentoStatus.setValue({
                fieldId: 'custrecord_lrc_ordem_criacao_tabela',
                value: tabelaAndamentoCount
            });
            newTabelaAndamentoStatus.save();
        }
        catch (error) {
            log_1.default.error('create tabela andamento erro', error);
        }
    };
    var searchHoraDataStatusAnterior = function (controleEscrituracaoId) {
        log_1.default.debug('searchHoraDataStatusAnterior', controleEscrituracaoId);
        // Buscar o Status anterior do Controle de Escrituracao
        var tabelaAndamentoSearchResult = search_1.default.create({
            type: 'customrecord_lrc_tab_andamento_status',
            filters: [
                ['custrecord_lrc_controle_escrituracao', 'IS', controleEscrituracaoId],
            ],
            columns: [
                search_1.default.createColumn({
                    name: 'custrecord_lrc_hora_data_status_final',
                    summary: search_1.default.Summary.MAX
                })
            ]
        }).run().getRange({
            start: 0,
            end: 1
        })[0];
        log_1.default.debug('tabelaAndamentoSearchResult', tabelaAndamentoSearchResult);
        var horaDataStatusAnterior; 
        var _a; 
        var data; 
        var hora;
        if (!!tabelaAndamentoSearchResult) {
            horaDataStatusAnterior = dataCriacaoCtrlEsc(controleEscrituracaoId);
            _a = horaDataStatusAnterior.split(' ');
            data = _a[0];
            hora = _a[1];
            data = data.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3");
        } else {
            horaDataStatusAnterior = tabelaAndamentoSearchResult.getAllValues()['MAX(custrecord_lrc_hora_data_status_final)'];
            _a = horaDataStatusAnterior.split(' ');
            data = _a[0];
            hora = _a[1];
            data = data.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3");
        }
        return getCompanyDate(new Date(data + ' ' + hora));
    };
    var getTabelaAndamentoCount = function (controleEscrituracaoId) {
        log.audit('getTabelaAndamentoCount', {controleEscrituracaoId: controleEscrituracaoId});
        // Buscar a quantidade de tabelas de andamento de uma escrituracao
        var tabelaAndamentoSearchResult = search_1.default.create({
            type: 'customrecord_lrc_tab_andamento_status',
            filters: [
                ['custrecord_lrc_controle_escrituracao', 'IS', controleEscrituracaoId],
            ],
            columns: [
                search_1.default.createColumn({
                    name: 'internalid',
                    summary: search_1.default.Summary.COUNT
                })
            ]
        }).run().getRange({
            start: 0,
            end: 1
        })[0];
        log_1.default.debug('count tabela', tabelaAndamentoSearchResult);
        return tabelaAndamentoSearchResult.getAllValues()['COUNT(internalid)'];
    };
    var getTempoTotal = function (dataInicial, dataFinal) {
        log.audit('getTempoTotal', {dataInicial: dataInicial, dataFinal: dataFinal});
        var diffInMinutes = (dataFinal.getTime() - dataInicial.getTime()) / (1000 * 60);
        var hours = Math.floor(diffInMinutes / 60);
        var min = String(Math.round(diffInMinutes % 60));
        log.audit('getTempoTotal', {diffInMinutes: diffInMinutes, hours: hours, min: min});
        if (min.length < 2) {
            return (hours + ':0' + min);
        }
        else {
            return (hours + ':' + min);
        }
    };
    exports.requestSendEmail = function (dadosEmail) {
        try {
            var stringfiedDadosEmail = JSON.stringify(dadosEmail);
            var output = url_1.default.resolveScript({
                scriptId: 'customscript_lrc_suitelet_send_email',
                deploymentId: 'customdeploy_lrc_suitelet_send_email',
                returnExternalUrl: true
            });
            var requestOptions = {
                url: output,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': stringfiedDadosEmail.length
                },
                body: stringfiedDadosEmail,
            };
            https_1.default.request(requestOptions);
        }
        catch (error) {
            log_1.default.error('requestSendEmail error', error);
        }
    };
    exports.callChangeDeedAndSendEmail = function () {
        var controleCurrentRecord = currentRecord_1.default.get();
        var jsonFaturaDados = JSON.parse(controleCurrentRecord.getValue('custpage_dados_fluxo'));
        log.audit('jsonFaturaDados', jsonFaturaDados);
        var recordParametrizacoes = exports.getRecordParametrizacoes(jsonFaturaDados.subsidiaria);
        log.audit('recordParametrizacoes', recordParametrizacoes);
        var controleRecord = record_1.default.load({
            type: controleCurrentRecord.type,
            id: controleCurrentRecord.id
        });
        var faturaId = controleRecord.getValue('custrecord_lrc_fatura_de_venda');
        var loadedFatura = search_1.default.lookupFields({
            type: 'salesorder',
            id: faturaId,
            columns: [
                'entity'
            ]
        });
        var clienteDoControle = search_1.default.lookupFields({
            type: 'customer',
            id: loadedFatura.entity[0].value,
            columns: [
                'email',
                'altemail'
            ]
        });
        log.audit('clienteDoControle', clienteDoControle);
        var dadosEmail = {
            author: 0,
            recipient: clienteDoControle.email ? clienteDoControle.email : clienteDoControle.altemail,
            faturaId: Number(faturaId),
            modeloId: 0
        };
        // 1.02 - Imóvel Pronto
        if (jsonFaturaDados.statusAtualEscrituracaoId === '2') {
            dadosEmail.author = Number(recordParametrizacoes.getValue('custrecord_lrc_autor_email_1_4'));
            dadosEmail.modeloId = Number(recordParametrizacoes.getValue('custrecord_lrc_modelo_email_1_4'));
        }
        // 1.08 - Escritura Definitiva Lavrada
        if (jsonFaturaDados.statusAtualEscrituracaoId === '11') {
            log.audit('jsonFaturaDados.statusAtualEscrituracaoId', jsonFaturaDados.statusAtualEscrituracaoId);
            dadosEmail.author = Number(recordParametrizacoes.getValue('custrecord_lrc_autor_email_1_8'));
            dadosEmail.modeloId = Number(recordParametrizacoes.getValue('custrecord_lrc_modelo_email_1_8'));
        }
        // 2.07 - Assinatura Gafisa Agendada
        else if (jsonFaturaDados.statusAtualEscrituracaoId === '20') {
            dadosEmail.author = Number(recordParametrizacoes.getValue('custrecord_lrc_autor_email_2_8'));
            dadosEmail.modeloId = Number(recordParametrizacoes.getValue('custrecord_lrc_modelo_email_2_8'));
        }
        // 2.10 - Declaração de Baixa de Alienação
        else if (jsonFaturaDados.statusAtualEscrituracaoId === '23') {
            var controleEscrituracao = record_1.default.load({
                type: 'customrecord_lrc_controle_escrituracao',
                id: jsonFaturaDados.controleEscrituracaoId
            });
            dadosEmail.author = Number(recordParametrizacoes.getValue('custrecord_lrc_autor_email_2_11'));
            dadosEmail.modeloId = Number(recordParametrizacoes.getValue('custrecord_lrc_modelo_email_2_11'));
            dadosEmail['baixaAlienacaoId'] = Number(controleEscrituracao.getValue('custrecord_lrc_baixa_alienacao'));
        }
        log_1.default.debug('callChangeDeedAndSendEmail', dadosEmail);
        exports.requestSendEmail(dadosEmail);
        exports.changeDeedControlStatus(jsonFaturaDados);
        document.location.reload();
    };
    exports.getRecordParametrizacoes = function (subsidiariaId) {
        var parametrizacoes = search_1.default.create({
            type: 'customrecord_lrc_parametrizacao_escritur',
            filters: [
                'custrecord_lrc_subsidiaria_parametri', 'IS', subsidiariaId
            ],
        }).run().getRange({
            start: 0,
            end: 1
        });
        log_1.default.debug("getRecordParametrizacoes", parametrizacoes);
        if (parametrizacoes.length > 0) {
            return record_1.default.load({
                type: 'customrecord_lrc_parametrizacao_escritur',
                id: parametrizacoes[0].id
            });
        }
        return false;
    };
    var getStatusName = function (statusId) {
        log.audit('getStatusName', statusId);
        var recordRefParaStatus = record_1.default.load({
            type: 'customrecord_lrc_ref_statusescrituracao',
            id: statusId
        });
        log.audit('recordRefParaStatus', recordRefParaStatus);
        return recordRefParaStatus.getText('custrecord_lrc_campo_controleescritura');
    };
    function getCompanyDate(date) {
        // Faz uma requisição ao suitelet que retorna o fuso horário do NetSuite
        var output = url_1.default.resolveScript({
            scriptId: 'customscript_lrc_suitelet_get_company_zo',
            deploymentId: 'customdeploy_lrc_get_company_zone',
            returnExternalUrl: true
        });
        var requestOptions = {
            url: output,
            method: 'GET',
        };
        var response = JSON.parse(https_1.default.request(requestOptions).body);
        // Remove o TimeZone da data recebida e adiciona a diferença em tempo do fuso do NetSuite
        date.setTime(date.getTime() - (date.getTimezoneOffset() * (60 * 1000)) - (response[0] * 60 * 60 * 1000 + (response[1] * 60 * 1000)));
        log_1.default.debug('date', date);
        return date;
    }
    function dataCriacaoCtrlEsc(idInterno) {
        log_1.default.debug('dataCriacaoCtrlEsc', idInterno);
        var bsc_ctrl_esc = search_1.default.create({type: "customrecord_lrc_controle_escrituracao",
            filters: [
                ["internalid","anyof",idInterno]
            ],
            columns: [
                "created","custrecord_lrc_fatura_de_venda","custrecord_lrc_cliente_ce","custrecord_lrc_empreendimento_fatura"
            ]
        }).run().getRange(0,1);
        log_1.default.debug('bsc_ctrl_esc', bsc_ctrl_esc);

        return bsc_ctrl_esc[0].getValue('created');

    }
});
