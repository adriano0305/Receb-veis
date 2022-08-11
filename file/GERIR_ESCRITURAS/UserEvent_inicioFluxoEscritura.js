/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *
 * afterSubmit aplicado à fatura para realizar a criação do registro de Controle de Escrituração
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/record", "N/search", "N/log", "./ClientScript_fluxoEscritura"], function (require, exports, record_1, search_1, log_1, ClientScript_fluxoEscritura_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = void 0;
    record_1 = __importDefault(record_1);
    // search_1 = __importDefault(search_1);
    log_1 = __importDefault(log_1);
    var afterSubmit = function (ctx) {
        var newFaturaRecord = ctx.newRecord;
        var oldFaturaRecord = ctx.oldRecord;
        var parcelaAlienacao2 = (function() { var pa = 0;
            search_1.create({type: "invoice",
                filters: [
                    ["cogs","is","F"], "AND", 
                    ["shipping","is","F"], "AND", 
                    ["taxline","is","F"], "AND", 
                    ["mainline","is","T"], "AND", 
                    ["type","anyof","CustInvc"], "AND", 
                    ["custbody_lrc_fatura_principal","anyof",newFaturaRecord.id], "AND", 
                    ["custbody_lrc_parcela_alienacao","is","T"]
                ],
                columns: [
                    search_1.createColumn({name: "datecreated", sort: search_1.Sort.ASC, label: "Data de criação"}),
                    "tranid","custbody_lrc_parcela_alienacao"
                ]
            }).run().each(function (result) {
                // log_1.default.error('result', result);
                if (result.getValue('custbody_lrc_parcela_alienacao') == true) {
                    pa += 1;
                }
                return true;
            });
            return pa;
        })();
        log_1.default.error('parcelaAlienacao2', parcelaAlienacao2);
        var parcelaAlienacao = newFaturaRecord.getValue('custbody_lrc_parcela_alienacao');
        var projetoObraId = newFaturaRecord.getValue('custbody_rsc_projeto_obra_gasto_compra');
        var verificacao = newFaturaRecord.getValue('custbody_rsc_status_contrato');
        if (ctx.type === ctx.UserEventType.CREATE) {
            if (verificacao == 2) {
                if (projetoObraId) {
                    var faturaEmpreendimento = record_1.default.load({
                        type: 'job',
                        id: projetoObraId
                    });
                    var newControleEscrituracao = record_1.default.create({
                        type: 'customrecord_lrc_controle_escrituracao'
                    });
                    var matriculaFaturaEmpreendimento = faturaEmpreendimento.getValue('custentity_rsc_matric_arq');
                    var newStatus = 0;
                    var tipoEscrituracao = 0;
                    // Verifica se NÃO há parcelas de alienação na criação da fatura
                    // if (!parcelaAlienacao) {
                    if (parcelaAlienacao2 == 0) {
                        log_1.default.error('Sem parcela alienacao', 'done');
                        tipoEscrituracao = 1;
                        // Verifica se o campo "Matrícula" de empreedimento esta preenchido
                        if (matriculaFaturaEmpreendimento) {
                            log_1.default.error('Matricula preenchida', matriculaFaturaEmpreendimento);
                            // Status para 1.02 - Imóvel Pronto
                            newStatus = 2;
                            newControleEscrituracao.setValue({
                                fieldId: 'custrecord_lrc_matricula',
                                value: matriculaFaturaEmpreendimento
                            });
                        }
                        else {
                            log_1.default.error('Matricula não preenchida', 'done');
                            // Status para 1.01 - Aguardando Individualização de Matrícula
                            newStatus = 1;
                        }
                        newControleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_data_escrituracao',
                            value: faturaEmpreendimento.getValue('startdate')
                        });
                    }
                    else {
                        log_1.default.error('Com parcela alienacao', 'done');
                        tipoEscrituracao = 2;
                        // Status para 2.01- Iniciar Outorga
                        newStatus = 14;
                        newControleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_data_escrituracao',
                            value: new Date()
                        });
                    }
                    try {
                        var newCreatedFaturaRecord = record_1.default.load({
                            type: 'salesorder',
                            id: newFaturaRecord.id
                        });
                        newControleEscrituracao.setValue({
                            fieldId: 'name',
                            value: 'Controle Escritura da Fatura #' + newCreatedFaturaRecord.getValue('tranid')
                        });
                        newControleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_fatura_de_venda',
                            value: newFaturaRecord.id
                        });
                        newControleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_cliente_ce',
                            value: newFaturaRecord.getValue('entity')
                        });
                        // Pegar as descrições dos itens da fatura e separá-los por "; "
                        var allItemsDescriptions = '';
                        var totalItems = newFaturaRecord.getLineCount('item');
                        for (var i = 0; i < totalItems; i++) {
                            var itemDescription = newFaturaRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'description',
                                line: i
                            });
                            allItemsDescriptions += itemDescription + '; ';
                        }
                        newControleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_unidade_vendida',
                            value: allItemsDescriptions
                        });
                        log_1.default.error('allItemsDescriptions', allItemsDescriptions);
                        newControleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_empreendimento_fatura',
                            value: newFaturaRecord.getValue('custbody_rsc_projeto_obra_gasto_compra')
                        });
                        newControleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_status_escrituracao',
                            value: newStatus
                        });
                        newControleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_tipo_escrituracao',
                            value: tipoEscrituracao
                        });
                        // Pegar a última data de término de tarefa da sublista de tarefas do projeto da fatura
                        // const searchedLastDate = Search.create({
                        //   type: 'projecttask',
                        //   filters: [
                        //     ['company', Search.Operator.IS, Number(faturaEmpreendimento.id)],
                        //     'AND',
                        //     ['custevent_rsc_tipo_tarefa', Search.Operator.IS, 1],
                        //   ],
                        //   columns: [
                        //     Search.createColumn({
                        //       name: 'enddate',
                        //       summary: Search.Summary.MAX
                        //     })
                        //   ]
                        // }).run().getRange({
                        //   start: 0,
                        //   end: 1
                        // })[0];
                        // if(!searchedLastDate){
                        //   throw Error('Projeto selecionado não possui uma tarefa do projeto correspondente');
                        // };
                        var lastDate = String(faturaEmpreendimento.getValue('calculatedenddate'));
                        // let lastDate = searchedLastDate.getAllValues()['MAX(enddate)'] as string;
                        lastDate = lastDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3");
                        log_1.default.error('lastdate', lastDate);
                        newControleEscrituracao.setValue({
                            fieldId: 'custrecord_lrc_data_entrega_construcao',
                            value: new Date(lastDate)
                        });
                        var newControleEscrituracaoId = 0;
                        try {
                            newControleEscrituracaoId = newControleEscrituracao.save();
                        }
                        catch (error) {
                            log_1.default.error('save new Controle Escrituração error', error);
                        }
                        newCreatedFaturaRecord.setValue({
                            fieldId: 'custbody_lrc_fat_controle_escrituracao',
                            value: newControleEscrituracaoId
                        });
                        newCreatedFaturaRecord.save({
                            ignoreMandatoryFields: true
                        });
                        var tabelaAndamentoDados = {
                            controleEscrituracaoId: newControleEscrituracaoId,
                            faturaId: newFaturaRecord.getValue('id'),
                            clienteReferente: newControleEscrituracao.getValue('custrecord_lrc_cliente_ce'),
                            statusAtualId: '',
                            novoStatusId: newStatus,
                            horaDataInicial: '',
                            horaDataFinal: new Date(),
                            ajusteProcessoAssociado: false,
                            escrituraEncerrada: false,
                        };
                        ClientScript_fluxoEscritura_1.createTabelaAndamentoStatus(tabelaAndamentoDados);
                    }
                    catch (error) {
                        log_1.default.error('Erro criacao controle escritura', error);
                    }
                }
            }
        }
        else if (ctx.type === ctx.UserEventType.EDIT) {
            var verificacaoOld = oldFaturaRecord.getValue('custbody_rsc_status_contrato');
            var verificacaoControle = newFaturaRecord.getValue('custbody_lrc_fat_controle_escrituracao');
            if (verificacaoOld != verificacao) {
                if (verificacao == 2) {
                    if (!verificacaoControle) {
                        if (projetoObraId) {
                            var faturaEmpreendimento = record_1.default.load({
                                type: 'job',
                                id: projetoObraId
                            });
                            var newControleEscrituracao = record_1.default.create({
                                type: 'customrecord_lrc_controle_escrituracao'
                            });
                            var matriculaFaturaEmpreendimento = faturaEmpreendimento.getValue('custentity_rsc_matric_arq');
                            var newStatus = 0;
                            var tipoEscrituracao = 0;
                            // Verifica se NÃO há parcelas de alienação na criação da fatura
                            // if (!parcelaAlienacao) {
                            if (parcelaAlienacao2 == 0) {
                                log_1.default.error('Sem parcela alienacao', 'done');
                                tipoEscrituracao = 1;
                                // Verifica se o campo "Matrícula" de empreedimento esta preenchido
                                if (matriculaFaturaEmpreendimento) {
                                    log_1.default.error('Matricula preenchida', matriculaFaturaEmpreendimento);
                                    // Status para 1.02 - Imóvel Pronto
                                    newStatus = 2;
                                    newControleEscrituracao.setValue({
                                        fieldId: 'custrecord_lrc_matricula',
                                        value: matriculaFaturaEmpreendimento
                                    });
                                }
                                else {
                                    log_1.default.error('Matricula não preenchida', 'done');
                                    // Status para 1.01 - Aguardando Individualização de Matrícula
                                    newStatus = 1;
                                }
                                newControleEscrituracao.setValue({
                                    fieldId: 'custrecord_lrc_data_escrituracao',
                                    value: faturaEmpreendimento.getValue('startdate')
                                });
                            }
                            else {
                                log_1.default.error('Com parcela alienacao', 'done');
                                tipoEscrituracao = 2;
                                // Status para 2.01- Iniciar Outorga
                                newStatus = 14;
                                newControleEscrituracao.setValue({
                                    fieldId: 'custrecord_lrc_data_escrituracao',
                                    value: new Date()
                                });
                            }
                            try {
                                var newCreatedFaturaRecord = record_1.default.load({
                                    type: 'salesorder',
                                    id: newFaturaRecord.id
                                });
                                newControleEscrituracao.setValue({
                                    fieldId: 'name',
                                    value: 'Controle Escritura da Fatura #' + newCreatedFaturaRecord.getValue('tranid')
                                });
                                newControleEscrituracao.setValue({
                                    fieldId: 'custrecord_lrc_fatura_de_venda',
                                    value: newFaturaRecord.id
                                });
                                newControleEscrituracao.setValue({
                                    fieldId: 'custrecord_lrc_cliente_ce',
                                    value: newFaturaRecord.getValue('entity')
                                });
                                // Pegar as descrições dos itens da fatura e separá-los por "; "
                                var allItemsDescriptions = '';
                                var totalItems = newFaturaRecord.getLineCount('item');
                                for (var i = 0; i < totalItems; i++) {
                                    var itemDescription = newFaturaRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'description',
                                        line: i
                                    });
                                    allItemsDescriptions += itemDescription + '; ';
                                }
                                newControleEscrituracao.setValue({
                                    fieldId: 'custrecord_lrc_unidade_vendida',
                                    value: allItemsDescriptions
                                });
                                log_1.default.error('allItemsDescriptions', allItemsDescriptions);
                                newControleEscrituracao.setValue({
                                    fieldId: 'custrecord_lrc_empreendimento_fatura',
                                    value: newFaturaRecord.getValue('custbody_rsc_projeto_obra_gasto_compra')
                                });
                                newControleEscrituracao.setValue({
                                    fieldId: 'custrecord_lrc_status_escrituracao',
                                    value: newStatus
                                });
                                newControleEscrituracao.setValue({
                                    fieldId: 'custrecord_lrc_tipo_escrituracao',
                                    value: tipoEscrituracao
                                });
                                // Pegar a última data de término de tarefa da sublista de tarefas do projeto da fatura
                                // const searchedLastDate = Search.create({
                                //   type: 'projecttask',
                                //   filters: [
                                //     ['company', Search.Operator.IS, Number(faturaEmpreendimento.id)],
                                //     'AND',
                                //     ['custevent_rsc_tipo_tarefa', Search.Operator.IS, 1],
                                //   ],
                                //   columns: [
                                //     Search.createColumn({
                                //       name: 'enddate',
                                //       summary: Search.Summary.MAX
                                //     })
                                //   ]
                                // }).run().getRange({
                                //   start: 0,
                                //   end: 1
                                // })[0];
                                // if(!searchedLastDate){
                                //   throw Error('Projeto selecionado não possui uma tarefa do projeto correspondente');
                                // };
                                var lastDate = String(faturaEmpreendimento.getValue('calculatedenddate'));
                                // let lastDate = searchedLastDate.getAllValues()['MAX(enddate)'] as string;
                                lastDate = lastDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3");
                                log_1.default.error('lastdate', lastDate);
                                newControleEscrituracao.setValue({
                                    fieldId: 'custrecord_lrc_data_entrega_construcao',
                                    value: new Date(lastDate)
                                });
                                var newControleEscrituracaoId = 0;
                                try {
                                    newControleEscrituracaoId = newControleEscrituracao.save();
                                }
                                catch (error) {
                                    log_1.default.error('save new Controle Escrituração error', error);
                                }
                                newCreatedFaturaRecord.setValue({
                                    fieldId: 'custbody_lrc_fat_controle_escrituracao',
                                    value: newControleEscrituracaoId
                                });
                                newCreatedFaturaRecord.save({
                                    ignoreMandatoryFields: true
                                });
                                var tabelaAndamentoDados = {
                                    controleEscrituracaoId: newControleEscrituracaoId,
                                    faturaId: newFaturaRecord.getValue('id'),
                                    clienteReferente: newControleEscrituracao.getValue('custrecord_lrc_cliente_ce'),
                                    statusAtualId: '',
                                    novoStatusId: newStatus,
                                    horaDataInicial: '',
                                    horaDataFinal: new Date(),
                                    ajusteProcessoAssociado: false,
                                    escrituraEncerrada: false,
                                };
                                ClientScript_fluxoEscritura_1.createTabelaAndamentoStatus(tabelaAndamentoDados);
                            }
                            catch (error) {
                                log_1.default.error('Erro criacao controle escritura', error);
                            }
                        }
                    }
                }
            }
        }
    };
    exports.afterSubmit = afterSubmit;

    function localizar_parcelas_alienacao(internalid) {
        log_1.audit('localizar_parcelas_alienacao', internalid);

        var pa = 0;

        search_1.create({type: "invoice",
            filters: [
               ["cogs","is","F"], "AND", 
               ["shipping","is","F"], "AND", 
               ["taxline","is","F"], "AND", 
               ["mainline","is","T"], "AND", 
               ["type","anyof","CustInvc"], "AND", 
               ["custbody_lrc_fatura_principal","anyof",internalid]
            ],
            columns: [
                search.createColumn({name: "datecreated", sort: search.Sort.ASC, label: "Data de criação"}),
                "tranid","custbody_lrc_parcela_alienacao"
            ]
        }).run.each(function (result) {
            log_1.audit('result', result);
            if (result.getValue('custbody_lrc_parcela_alienacao') == true) {
                pa += 1;
            }
            return true;
        });

        return pa;
    }
});
