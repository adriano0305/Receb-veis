/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *
 * beforeLoad aplicado à Controle de Escrituração para realizar as funcionaliades
 * do fluxo do Controle de Escrituração
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/ui/serverWidget", "N/record", "N/search", "N/log", "N/runtime", "N/ui/message", "./ClientScript_fluxoEscritura"], function (require, exports, serverWidget_1, record_1, search_1, log_1, runtime_1, message, ClientScript_fluxoEscritura_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = void 0;
    serverWidget_1 = __importDefault(serverWidget_1);
    record_1 = __importDefault(record_1);
    search_1 = __importDefault(search_1);
    log_1 = __importDefault(log_1);
    runtime_1 = __importDefault(runtime_1);
    // message = __importDefault(message);
    var beforeLoad = function (ctx) {
        var x = search_1.default.create({
            type: 'salesorder',
            filters: [
                // ['custbody_rsc_projeto_obra_gasto_compra.parent', 'IS', 19],
                // 'AND',
                ['custbody_lrc_fat_controle_escrituracao.custrecord_lrc_status_escrituracao', 'IS', 2]
            ],
            columns: ['custbody_lrc_fat_controle_escrituracao']
        }).run().getRange({ start: 0, end: 1 });
        // log_1.default.debug('x', x);
        var newControleRecord = ctx.newRecord;
        var faturaForm = ctx.form;
        faturaForm.clientScriptModulePath = './ClientScript_fluxoEscritura.js';
        var faturaId = newControleRecord.getValue('custrecord_lrc_fatura_de_venda');
        if (faturaId) {
            var faturaRecord = record_1.default.load({
                type: 'salesorder',
                id: faturaId
            });
            var subsidiariaFaturaId = faturaRecord.getValue('subsidiary');
            var controleEscrituracaoId = faturaRecord.getValue('custbody_lrc_fat_controle_escrituracao');
            // log.debug('controleEscrituracaoId', controleEscrituracaoId);
            var recordParametrizacoes = ClientScript_fluxoEscritura_1.getRecordParametrizacoes(Number(subsidiariaFaturaId));
            // log.debug('recordParametrizacoes', recordParametrizacoes);
            // if (controleEscrituracaoId && recordParametrizacoes && ctx.type === ctx.UserEventType.VIEW) {
                if (controleEscrituracaoId && ctx.type === ctx.UserEventType.VIEW) {
                var controleEscrituracao = record_1.default.load({
                    type: 'customrecord_lrc_controle_escrituracao',
                    id: controleEscrituracaoId
                });
                var statusAtualEscrituracaoId = controleEscrituracao.getValue('custrecord_lrc_status_escrituracao') || 0;
                var faturaDadosfield = faturaForm.addField({
                    label: 'Dados Fluxo',
                    id: 'custpage_dados_fluxo',
                    type: 'longtext'
                });
                faturaDadosfield.updateDisplayType({
                    displayType: serverWidget_1.default.FieldDisplayType.HIDDEN
                });
                var jsonFaturaDados = {
                    tipoEscrituracao: 0,
                    novaDataInicio: 0,
                    novaDataPlanejadaEntrega: 0,
                    statusAtualEscrituracaoId: statusAtualEscrituracaoId,
                    controleEscrituracaoId: controleEscrituracaoId,
                    newStatusId: 0,
                    escrituraEncerrada: false,
                    subsidiaria: subsidiariaFaturaId,
                    baixaAlienacao: 0
                };
                // var allowedRoles = recordParametrizacoes.getValue('custrecord_lrc_funcao');
                // var currentUser = runtime_1.default.getCurrentUser();
                // // O botão "Reinicio Processo" deve aparecer somente para os usuarios parametrizados no registro
                // if (allowedRoles.indexOf(currentUser.role.toString()) >= 0) {
                //     var tipoEscrituracao = controleEscrituracao.getValue('custrecord_lrc_tipo_escrituracao');
                //     jsonFaturaDados.tipoEscrituracao = 0;
                //     jsonFaturaDados.statusAtualEscrituracaoId = statusAtualEscrituracaoId;
                //     jsonFaturaDados.controleEscrituracaoId = controleEscrituracaoId;
                //     var newStatusId = 0;
                //     if (tipoEscrituracao == 1) {
                //         newStatusId = 1;
                //     }
                //     else if (tipoEscrituracao == 2) {
                //         newStatusId = 14;
                //     }
                //     faturaForm.addButton({
                //         label: 'Reinicio Processo',
                //         id: 'custpage_btn_reinicio_processo',
                //         functionName: 'callChangeDeedControlStatus( ' + newStatusId + ', ' + 'true' + ')'
                //     });
                // }
                var allowedRoles = recordParametrizacoes;
                log_1.default.debug('allowedRoles', allowedRoles);
                var currentUser = runtime_1.default.getCurrentUser();
                // O botão "Reinicio Processo" deve aparecer somente para os usuarios parametrizados no registro
                if (allowedRoles != false) {
                    var funcao = allowedRoles.getValue('custrecord_lrc_funcao');
                    if (funcao.indexOf(currentUser.role.toString()) >= 0) {
                        var tipoEscrituracao = controleEscrituracao.getValue('custrecord_lrc_tipo_escrituracao');
                        jsonFaturaDados.tipoEscrituracao = 0;
                        jsonFaturaDados.statusAtualEscrituracaoId = statusAtualEscrituracaoId;
                        jsonFaturaDados.controleEscrituracaoId = controleEscrituracaoId;
                        var newStatusId = 0;
                        if (tipoEscrituracao == 1) {
                            newStatusId = 1;
                        }
                        else if (tipoEscrituracao == 2) {
                            newStatusId = 14;
                        }
                        faturaForm.addButton({
                            label: 'Reinicio Processo',
                            id: 'custpage_btn_reinicio_processo',
                            functionName: 'callChangeDeedControlStatus( ' + newStatusId + ', ' + 'true' + ')'
                        });
                    }
                } else {
                    log_1.default.debug('message_1', 'message_1');
                    var aviso = message.create({
                        type: message.Type.ERROR,
                        title: 'Controle de Escrituração',
                        message: 'Não foram encontradas parametrizações para a subsidiária: ' + faturaRecord.getText('subsidiary') + '. <br>'+
                        'Para incluir os parâmetros <a href="https://5843489-sb2.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=270">clique aqui.</a>',
                        duration: 15000
                    });
                    // Instancia o mensagem criada para o formulário.
                    faturaForm.addPageInitMessage({message: aviso});

                    var botaoEditar = faturaForm.getButton({id: 'edit'});
                    botaoEditar.isDisabled = true;
                }          
                // 1.01 ou 1.03 - Aguardando Individualização de Matrícula
                if (statusAtualEscrituracaoId === '1' || statusAtualEscrituracaoId === '3') {
                    var projetoObraId = faturaRecord.getValue('custbody_rsc_projeto_obra_gasto_compra');
                    var faturaEmpreendimento = record_1.default.load({
                        type: 'job',
                        id: projetoObraId
                    });
                    var matriculaEmpreedimentoId = faturaEmpreendimento.getValue('custentity_rsc_matric_arq');
                    // Verifica se há uma matricula no empreendimento
                    if (matriculaEmpreedimentoId) {
                        jsonFaturaDados.matriculaId = matriculaEmpreedimentoId;
                        jsonFaturaDados.newStatusId = 2;
                        faturaForm.addButton({
                            label: 'Imóvel Pronto',
                            id: 'custpage_btn_imovel_pronto',
                            functionName: 'callChangeDeedControlStatus'
                        });
                    }
                }
                // 1.02 - Imóvel Pronto
                else if (statusAtualEscrituracaoId === '2') {
                    // Caso unico saldo devedor seja o saldo de repasse
                    if (faturaRecord.getValue('custbody_lrc_saldo_repasse')) {
                        jsonFaturaDados.newStatusId = 4;
                        faturaForm.addButton({
                            label: 'Apto para outorga',
                            id: 'custpage_btn_apto_outorga',
                            functionName: 'callChangeDeedAndSendEmail'
                        });
                    }
                }
                // 1.04 - Apto para Outorga de Escritura Definitiva
                else if (statusAtualEscrituracaoId >= '4' && statusAtualEscrituracaoId <= '8') {
                    jsonFaturaDados.newStatusId = 9;
                    faturaForm.addButton({
                        label: 'Em análise de documentos',
                        id: 'custpage_btn_em_analise',
                        functionName: 'callChangeDeedControlStatus'
                    });
                    // 1.04.4 - Criar notificação Extra Judicial
                    if (statusAtualEscrituracaoId === '7') {
                        jsonFaturaDados.newStatusId = 8;
                        faturaForm.addButton({
                            label: 'Notificado Extrajudicialmente',
                            id: 'custpage_btn_notificado_extrajudicialmente',
                            functionName: 'callChangeDeedControlStatus'
                        });
                    }
                }
                // 1.05 - Em Análise de Documentos
                else if (statusAtualEscrituracaoId === '9') {
                    jsonFaturaDados.newStatusId = 10;
                    faturaForm.addButton({
                        label: 'Minuta Aprovada',
                        id: 'custpage_btn_minuta_aprovada',
                        functionName: 'callChangeDeedControlStatus'
                    });
                }
                // 1.06 - Minuta Aprovada
                else if (statusAtualEscrituracaoId === '10') {
                    // verificar se existe uma data no campo 'Data planejada para assinatura procurador'
                    var dataProcurador = controleEscrituracao.getValue('custrecord_lrc_data_procurador');
                    if (dataProcurador) {
                        jsonFaturaDados.newStatusId = 11;
                        faturaForm.addButton({
                            label: 'Assinatura Gafisa Agendada',
                            id: 'custpage_btn_assinatura_gafisa_agendada',
                            functionName: 'callChangeDeedControlStatus'
                        });
                    }
                }
                // 1.07 - Assinatura Gafisa Agendada
                else if (statusAtualEscrituracaoId === '11') {
                    jsonFaturaDados.newStatusId = 12;
                    faturaForm.addButton({
                        label: 'Escritura Definitiva Lavrada',
                        id: 'custpage_btn_escritura_lavrada',
                        functionName: 'callChangeDeedAndSendEmail'
                    });
                }
                // 1.08 - Escritura Definitiva Lavrada
                else if (statusAtualEscrituracaoId === '12') {
                    // Verifica se há uma escritura no controle de escrituração
                    if (controleEscrituracao.getValue('custrecord_lrc_escritura')) {
                        jsonFaturaDados.newStatusId = 13;
                        jsonFaturaDados.escrituraEncerrada = true;
                        faturaForm.addButton({
                            label: 'Escritura Definitiva Registrada',
                            id: 'custpage_btn_escritura_registrada',
                            functionName: 'callChangeDeedControlStatus'
                        });
                    }
                }
                // 2.01 - Iniciar Outorga
                else if (statusAtualEscrituracaoId === '14') {
                    jsonFaturaDados.newStatusId = 17;
                    faturaForm.addButton({
                        label: 'PF Enviada',
                        id: 'custpage_btn_pf_enviada',
                        functionName: 'callChangeDeedControlStatus'
                    });
                }
                // 2.02 - Iniciar Outorga – Contato Telefônico
                else if (statusAtualEscrituracaoId === '15') {
                    faturaForm.addButton({
                        label: 'Reverter fluxo de AF',
                        id: 'custpage_btn_fluxo_af',
                        functionName: 'callChangeDeedControlStatus(' + 16 + ')'
                    });
                    faturaForm.addButton({
                        label: 'PF Enviada',
                        id: 'custpage_btn_pf_enviada',
                        functionName: 'callChangeDeedControlStatus(' + 17 + ')'
                    });
                }
                // 2.04 - PF Enviada
                else if (statusAtualEscrituracaoId === '17') {
                    jsonFaturaDados.newStatusId = 18;
                    faturaForm.addButton({
                        label: 'Em Análise de Documentos',
                        id: 'custpage_btn_analise_documento',
                        functionName: 'callChangeDeedControlStatus'
                    });
                }
                // 2.05 - Em Análise de Documentos
                else if (statusAtualEscrituracaoId === '18') {
                    // verificar se anexou um doc
                    var minutaDoc = controleEscrituracao.getValue('custrecord_lrc_minuta_contrato');
                    log_1.default.debug('minutadoc', minutaDoc);
                    if (minutaDoc) {
                        jsonFaturaDados.newStatusId = 19;
                        faturaForm.addButton({
                            label: 'Minuta Aprovada',
                            id: 'custpage_btn_minuta_aprovada',
                            functionName: 'callChangeDeedControlStatus'
                        });
                    }
                }
                // 2.06 - Minuta Aprovada
                else if (statusAtualEscrituracaoId === '19') {
                    jsonFaturaDados.newStatusId = 20;
                    faturaForm.addButton({
                        label: 'Assinatura Gafisa Agendada',
                        id: 'custpage_btn_assinatura_gafisa_agendad',
                        functionName: 'callChangeDeedControlStatus'
                    });
                }
                // 2.07 - Assinatura Gafisa Agendada
                else if (statusAtualEscrituracaoId === '20') {
                    jsonFaturaDados.newStatusId = 21;
                    faturaForm.addButton({
                        label: 'Escritura de Alienação Fiduciária Lavrada',
                        id: 'custpage_btn_escritura_alienacao_lavrada',
                        functionName: 'callChangeDeedAndSendEmail'
                    });
                }
                // 2.08 - Escritura de Alienação
                else if (statusAtualEscrituracaoId === '21') {
                    // Verificar se existe um documento de escritura anexado
                    var escritura = controleEscrituracao.getValue('custrecord_lrc_escritura');
                    if (escritura) {
                        jsonFaturaDados.newStatusId = 22;
                        faturaForm.addButton({
                            label: 'Escritura de Alienação Fiduciária Registrada',
                            id: 'custpage_btn_escritura_alienacao_registrada',
                            functionName: 'callChangeDeedControlStatus'
                        });
                    }
                    ;
                }
                // 2.10 - Declaração de Baixa de Alienação
                else if (statusAtualEscrituracaoId === '23') {
                    var baixaAlienacao = controleEscrituracao.getValue('custrecord_lrc_baixa_alienacao');
                    if (baixaAlienacao) {
                        jsonFaturaDados.newStatusId = 24;
                        jsonFaturaDados.escrituraEncerrada = true;
                        faturaForm.addButton({
                            label: 'Enviar Baixa de Alienação',
                            id: 'custpage_btn_baixa_de_alienacao',
                            functionName: 'callChangeDeedAndSendEmail'
                        });
                    }
                }
                faturaDadosfield.defaultValue = JSON.stringify(jsonFaturaDados);
            }
        }
    };
    exports.beforeLoad = beforeLoad;
});
