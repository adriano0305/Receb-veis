/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*
*
*
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/ui/serverWidget", "N/record", "N/search", "N/log"], function (require, exports, UI, record_1, search_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    UI = __importStar(UI);
    record_1 = __importDefault(record_1);
    search_1 = __importDefault(search_1);
    log_1 = __importDefault(log_1);
    var onRequest = function (ctx) {
        if (ctx.request.method == 'GET') {
            var valor = 2;
            var dtHoje = new Date();
            dtHoje.setMonth(dtHoje.getMonth() + valor);
            log_1.default.error('dtHoje', dtHoje);
            var newForm = UI.createForm({
                title: 'Simulação de Distrato'
            });
            var params = ctx.request.parameters;
            var faturaId = params.recordid;
            var faturaRecord = record_1.default.load({
                type: 'invoice',
                id: faturaId
            });
            var unidadeLookup = search_1.default.lookupFields({
                type: 'customrecord_rsc_unidades_empreendimento',
                id: faturaRecord.getValue('custbody_rsc_tran_unidade'),
                columns: [
                    'custrecord_rsc_un_emp_bloco',
                    'custrecord_rsc_un_emp_unidade'
                ]
            });
            log_1.default.error('unidadeLookup', unidadeLookup);
            var subsidiariaLookup = search_1.default.lookupFields({
                type: 'subsidiary',
                id: faturaRecord.getValue('subsidiary'),
                columns: [
                    'custrecord_rsc_patrimonio_afetacao'
                ]
            });
            var percentual = 0;
            var vencimentoInicial = void 0;
            var jobLookup = search_1.default.lookupFields({
                type: 'job',
                id: faturaRecord.getValue('custbody_rsc_projeto_obra_gasto_compra'),
                columns: [
                    'enddate',
                ]
            });
            var endDate = jobLookup.enddate;
            // let dateHabite = jobLookup["custentity_rsc_project_date_habite "]
            if (subsidiariaLookup.custrecord_rsc_patrimonio_afetacao) {
                percentual = 50;
                if (endDate) {
                    endDate = new Date(endDate);
                    endDate.setMonth(endDate.getMonth() + 1);
                    vencimentoInicial = endDate;
                }
                // }else if(dateHabite){
                //     dateHabite = new Date(dateHabite);
                //     dateHabite.setMonth(dateHabite.getMonth() + 1)
                //     vencimentoInicial = dateHabite;
                // }
            }
            else {
                percentual = 75;
                var dataAtual = new Date();
                dataAtual.setDate(dataAtual.getDate() + 180);
                vencimentoInicial = dataAtual;
            }
            var qtLinhasPagas = faturaRecord.getLineCount({
                sublistId: 'custpage_rsc_parcelas'
            });
            var somaLinhasPagas = 0;
            var somaLinhasPagasAtt = 0;
            var somaVencido = 0;
            var somaVencer = 0;
            var dataAuxiliar = new Date();
            var dataUltPag = new Date("01/01/2000");
            for (var i = 0; i < qtLinhasPagas; i++) {
                var statusLinhaPaga = faturaRecord.getSublistValue({
                    sublistId: 'custpage_rsc_parcelas',
                    fieldId: 'custpage_rsc_status',
                    line: i
                });
                if (statusLinhaPaga == "Pago") {
                    var valorPagoLinha = faturaRecord.getSublistValue({
                        sublistId: 'custpage_rsc_parcelas',
                        fieldId: 'custpage_rsc_valor_pago',
                        line: i
                    });
                    somaLinhasPagas += Number(valorPagoLinha);
                    var dataPagamentoLinha = faturaRecord.getSublistValue({
                        sublistId: 'custpage_rsc_parcelas',
                        fieldId: 'custpage_rsc_data_pagamento',
                        line: i
                    });
                    if (new Date(dataPagamentoLinha).getTime() > dataUltPag) {
                        dataUltPag = new Date(dataPagamentoLinha);
                    }
                    var valorPagoAttLinha = getValorPagoAtt(new Date(dataPagamentoLinha), faturaRecord.getValue('custbody_rsc_indice'), valorPagoLinha);
                    somaLinhasPagasAtt += Number(valorPagoAttLinha);
                    log_1.default.error('somaLinhasPagasAtt', somaLinhasPagasAtt);
                }
                else if (statusLinhaPaga == "Aberto") {
                    var vencimento = faturaRecord.getSublistValue({
                        sublistId: 'custpage_rsc_parcelas',
                        fieldId: 'custpage_rsc_vencimento',
                        line: i
                    });
                    var dataAtual = new Date();
                    if (dataAtual.getTime() > new Date(vencimento).getTime()) {
                        var valorLinha = faturaRecord.getSublistValue({
                            sublistId: 'custpage_rsc_parcelas',
                            fieldId: 'custpage_rsc_valor_original',
                            line: i
                        });
                        somaVencido += Number(valorLinha);
                        if (dataAuxiliar.getTime() > new Date(vencimento).getTime()) {
                            dataAuxiliar = new Date(vencimento);
                        }
                    }
                    else {
                        var valorLinha = faturaRecord.getSublistValue({
                            sublistId: 'custpage_rsc_parcelas',
                            fieldId: 'custpage_rsc_valor_original',
                            line: i
                        });
                        somaVencer += Number(valorLinha);
                    }
                }
            }
            var valorVendaAtt = getValorVendaAtt(faturaRecord.getValue('custbody_rsc_finan_indice_base_cont'), faturaRecord.getValue('custbody_rsc_indice'), faturaRecord.getValue('custbody_rsc_vlr_venda'));
            var valorDevolver = (percentual / 100) * somaLinhasPagas;
            var valorDevolverAtt = (percentual / 100) * somaLinhasPagasAtt;
            var dadosGerais = {
                subsidiaria: faturaRecord.getValue('subsidiary'),
                cliente: faturaRecord.getValue('entity'),
                contrato: faturaId,
                empreendimento: faturaRecord.getValue('custbody_rsc_projeto_obra_gasto_compra'),
                bloco: unidadeLookup.custrecord_rsc_un_emp_bloco[0].value,
                unidade: faturaRecord.getValue('custbody_rsc_tran_unidade'),
                dataCalculo: new Date(),
            };
            var dadosIndice = {
                indice: faturaRecord.getValue('custbody_rsc_indice'),
                percentual: percentual
            };
            var dadosDemosntrativo = {
                valorPago: somaLinhasPagas.toFixed(2),
                valorVenda: Number(faturaRecord.getValue('custbody_rsc_vlr_venda')).toFixed(2),
                valorPagoAtt: somaLinhasPagasAtt.toFixed(2),
                valorVendaAtt: valorVendaAtt.toFixed(2)
            };
            var dadosCalculo = {
                valorDevolver: valorDevolver.toFixed(2),
                valorDevolverAtt: valorDevolverAtt.toFixed(2),
                vencimentoInicial: vencimentoInicial
            };
            newForm = groupFields(newForm);
            newForm = createFieldsDadosGeral(newForm, dadosGerais);
            newForm = createFieldsIndice(newForm, dadosIndice);
            newForm = createFieldsDemonstrativo(newForm, dadosDemosntrativo);
            newForm = createFieldsDeducao(newForm);
            newForm = createFieldsCalculo(newForm, dadosCalculo);
            newForm = createFieldsAproveitamento(newForm);
            newForm = createFieldsObservacoes(newForm);
            newForm.addField({
                id: 'custpage_rsc_valor_vencido',
                label: 'Valor Vencido',
                type: UI.FieldType.TEXT
            }).updateDisplayType({ displayType: UI.FieldDisplayType.HIDDEN }).defaultValue = String(somaVencido.toFixed(2));
            newForm.addField({
                id: 'custpage_rsc_valor_vencer',
                label: 'Valor Vencer',
                type: UI.FieldType.TEXT
            }).updateDisplayType({ displayType: UI.FieldDisplayType.HIDDEN }).defaultValue = String(somaVencer.toFixed(2));
            newForm.addField({
                id: 'custpage_rsc_data_inicio_vencimento',
                label: 'Data inicio atraso',
                type: UI.FieldType.TEXT
            }).updateDisplayType({ displayType: UI.FieldDisplayType.HIDDEN }).defaultValue = dataAuxiliar;
            if (dataUltPag.getTime() == new Date("01/01/2000").getTime()) {
                dataUltPag = "NÃO CONSTA PAGAMENTOS";
            }
            newForm.addField({
                id: 'custpage_rsc_data_ult_pagamento',
                label: 'Data ultimo pagamento',
                type: UI.FieldType.TEXT
            }).updateDisplayType({ displayType: UI.FieldDisplayType.HIDDEN }).defaultValue = dataUltPag;
            newForm.addButton({
                label: 'Escriturar',
                functionName: 'escriturar',
                id: 'custpage_btt_enviar'
            });
            newForm.addButton({
                label: 'Cancelar',
                functionName: 'cancelar',
                id: 'custpage_btt_cancelar'
            });
            newForm.clientScriptModulePath = './rsc_funcionalidade_simu_distrato.js';
            ctx.response.writePage(newForm);
        }
    };
    exports.onRequest = onRequest;
    var groupFields = function (newForm) {
        newForm.addFieldGroup({
            id: 'custpage_dados_gerais',
            label: 'Dados Gerais',
        });
        newForm.addFieldGroup({
            id: 'custpage_indice',
            label: 'Índice',
        });
        newForm.addFieldGroup({
            id: 'custpage_demonstrativo',
            label: 'Demonstrativo',
        });
        newForm.addFieldGroup({
            id: 'custpage_deducoes',
            label: 'Deduções',
        });
        newForm.addFieldGroup({
            id: 'custpage_calculo',
            label: 'Cálculo',
        });
        newForm.addFieldGroup({
            id: 'custpage_aproveitamento_creditos',
            label: 'Aproveitamento de Créditos',
        });
        newForm.addFieldGroup({
            id: 'custpage_observacoes',
            label: 'Observações',
        });
        // newForm.addFieldGroup({
        //     id: 'custpage_dados_gerais',
        //     label: 'Dados Gerais',
        // });
        return newForm;
    };
    var createFieldsDadosGeral = function (newForm, dadosGerais) {
        newForm.addField({
            id: 'custpage_subsidiaria',
            label: 'Subsidiária',
            type: UI.FieldType.SELECT,
            source: 'subsidiary',
            container: 'custpage_dados_gerais'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosGerais.subsidiaria;
        newForm.addField({
            id: 'custpage_cliente',
            label: 'Cliente',
            type: UI.FieldType.SELECT,
            source: 'customer',
            container: 'custpage_dados_gerais'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosGerais.cliente;
        newForm.addField({
            id: 'custpage_contrato',
            label: 'Contrato',
            type: UI.FieldType.SELECT,
            source: 'invoice',
            container: 'custpage_dados_gerais'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosGerais.contrato;
        newForm.addField({
            id: 'custpage_empreendimento',
            label: 'Empreendimento',
            type: UI.FieldType.SELECT,
            source: 'job',
            container: 'custpage_dados_gerais'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosGerais.empreendimento;
        newForm.addField({
            id: 'custpage_bloco',
            label: 'Bloco',
            type: UI.FieldType.SELECT,
            source: 'customrecord_rsc_bl_emp',
            container: 'custpage_dados_gerais'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosGerais.bloco;
        newForm.addField({
            id: 'custpage_unidade',
            label: 'Unidade',
            type: UI.FieldType.INTEGER,
            // source: 'customrecord_rsc_unidades_empreendimento',
            container: 'custpage_dados_gerais'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosGerais.unidade;
        newForm.addField({
            id: 'custpage_motivo',
            label: 'Motivo Distrato',
            type: UI.FieldType.SELECT,
            source: 'customlist_rsc_motivo_distrato',
            container: 'custpage_dados_gerais'
        }).isMandatory = true;
        newForm.addField({
            id: 'custpage_data_calculo',
            label: 'Data Cálculo',
            type: UI.FieldType.DATE,
            container: 'custpage_dados_gerais'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosGerais.dataCalculo;
        newForm.addField({
            id: 'custpage_data_distrato',
            label: 'Data Distrato',
            type: UI.FieldType.DATE,
            container: 'custpage_dados_gerais'
        }).isMandatory = true;
        newForm.addField({
            id: 'custpage_status_distrato',
            label: 'Status Distrato',
            type: UI.FieldType.SELECT,
            source: 'customlist_rsc_status_distrato',
            container: 'custpage_dados_gerais'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = "1";
        return newForm;
    };
    var createFieldsIndice = function (newForm, dadosIndice) {
        newForm.addField({
            id: 'custpage_indice_contrato',
            label: 'Índice Contrato',
            type: UI.FieldType.SELECT,
            source: 'customrecord_rsc_correction_unit',
            container: 'custpage_indice'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosIndice.indice;
        newForm.addField({
            id: 'custpage_percentual_devolver',
            label: 'Percentual a devolver',
            type: UI.FieldType.PERCENT,
            container: 'custpage_indice'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosIndice.percentual;
        return newForm;
    };
    var createFieldsDemonstrativo = function (newForm, dadosDemosntrativo) {
        newForm.addField({
            id: 'custpage_valor_pago',
            label: 'Valor Pago',
            type: UI.FieldType.FLOAT,
            container: 'custpage_demonstrativo'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosDemosntrativo.valorPago;
        newForm.addField({
            id: 'custpage_valor_venda',
            label: 'Valor da venda',
            type: UI.FieldType.FLOAT,
            container: 'custpage_demonstrativo'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosDemosntrativo.valorVenda;
        newForm.addField({
            id: 'custpage_valor_pago_corrigido',
            label: 'Valor Pago Atualizado',
            type: UI.FieldType.FLOAT,
            container: 'custpage_demonstrativo'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosDemosntrativo.valorPagoAtt;
        newForm.addField({
            id: 'custpage_valor_venda_corrigido',
            label: 'Valor Venda Atualizado',
            type: UI.FieldType.FLOAT,
            container: 'custpage_demonstrativo'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosDemosntrativo.valorVendaAtt;
        return newForm;
    };
    var createFieldsDeducao = function (newForm) {
        newForm.addField({
            id: 'custpage_receita_decoracao',
            label: 'Receita Decoração',
            type: UI.FieldType.FLOAT,
            container: 'custpage_deducoes'
        });
        newForm.addField({
            id: 'custpage_receita_decoracao_att',
            label: 'Receita Decoração Atualizado',
            type: UI.FieldType.FLOAT,
            container: 'custpage_deducoes'
        });
        newForm.addField({
            id: 'custpage_despesa_cartorio',
            label: 'Despesa Cartório',
            type: UI.FieldType.FLOAT,
            container: 'custpage_deducoes'
        });
        newForm.addField({
            id: 'custpage_iptu',
            label: 'IPTU',
            type: UI.FieldType.FLOAT,
            container: 'custpage_deducoes'
        });
        newForm.addField({
            id: 'custpage_condominio',
            label: 'Condomínio',
            type: UI.FieldType.FLOAT,
            container: 'custpage_deducoes'
        });
        return newForm;
    };
    var createFieldsCalculo = function (newForm, dadosCalculo) {
        newForm.addField({
            id: 'custpage_valor_devolver',
            label: 'Valor Devolver',
            type: UI.FieldType.FLOAT,
            container: 'custpage_calculo'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosCalculo.valorDevolver;
        newForm.addField({
            id: 'custpage_valor_devolver_att',
            label: 'Valor Devolver Atualizado',
            type: UI.FieldType.FLOAT,
            container: 'custpage_calculo'
        }).updateDisplayType({ displayType: UI.FieldDisplayType.DISABLED }).defaultValue = dadosCalculo.valorDevolverAtt;
        newForm.addField({
            id: 'custpage_valor_acordado',
            label: 'Valor Acordado',
            type: UI.FieldType.FLOAT,
            container: 'custpage_calculo'
        }).isMandatory = true;
        newForm.addField({
            id: 'custpage_qtd_parcela',
            label: 'Quantidade Parcelas',
            type: UI.FieldType.INTEGER,
            container: 'custpage_calculo'
        }).isMandatory = true;
        newForm.addField({
            id: 'custpage_vencimento_inicial',
            label: 'Vencimento Inicial',
            type: UI.FieldType.DATE,
            container: 'custpage_calculo'
        }).defaultValue = dadosCalculo.vencimentoInicial;
        return newForm;
    };
    var createFieldsAproveitamento = function (newForm) {
        newForm.addField({
            id: 'custpage_empreendimento_dgt',
            label: 'Empreendimento',
            type: UI.FieldType.SELECT,
            source: 'job',
            container: 'custpage_aproveitamento_creditos'
        });
        newForm.addField({
            id: 'custpage_bloco_dgt',
            label: 'Bloco',
            type: UI.FieldType.SELECT,
            source: 'customrecord_rsc_bl_emp',
            container: 'custpage_aproveitamento_creditos'
        });
        newForm.addField({
            id: 'custpage_unidade_dgt',
            label: 'Unidade',
            type: UI.FieldType.SELECT,
            source: 'customrecord_rsc_unidades_empreendimento',
            container: 'custpage_aproveitamento_creditos'
        });
        return newForm;
    };
    var createFieldsObservacoes = function (newForm) {
        newForm.addField({
            id: 'custpage_observacoes',
            label: 'Observações',
            type: UI.FieldType.TEXTAREA,
            container: 'custpage_observacoes'
        });
        return newForm;
    };
    var getValorPagoAtt = function (dataVencimento, indiceID, valorPago) {
        dataVencimento.setDate(1);
        dataVencimento.setMonth(dataVencimento.getMonth() - 2);
        // Log.error('dataVencimento', dataVencimento)
        var indiceRecord = record_1.default.load({
            type: 'customrecord_rsc_correction_unit',
            id: indiceID
        });
        var qtdLinhasIndice = indiceRecord.getLineCount({
            sublistId: 'recmachcustrecord_rsc_hif_correction_unit'
        });
        var fatorDataAtual;
        var fatorDatavencimento;
        for (var i = 0; i < qtdLinhasIndice; i++) {
            var dataAtual = new Date();
            dataAtual.setMonth(dataAtual.getMonth() - 2);
            dataAtual.setHours(0, 0, 0);
            dataAtual.setDate(1);
            var dataVigenciaLinha = indiceRecord.getSublistValue({
                sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                fieldId: 'custrecord_rsc_hif_effective_date',
                line: i
            });
            // Log.error('dataVigenciaLinha', dataVigenciaLinha)
            if (String(dataVigenciaLinha) == String(dataVencimento)) {
                // Log.error("entrou no if?", "sim")
                fatorDatavencimento = indiceRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                    fieldId: 'custrecord_rsc_hif_factor_percent',
                    line: i
                });
                // Log.error('fatorDatavencimento', fatorDatavencimento)
            }
            if (String(dataAtual) == String(dataVigenciaLinha)) {
                fatorDataAtual = indiceRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                    fieldId: 'custrecord_rsc_hif_factor_percent',
                    line: i
                });
                // Log.error('fatorDataAtual', fatorDataAtual)
            }
        }
        // Log.error('valorPago', valorPago)
        return Number(fatorDataAtual) / Number(fatorDatavencimento) * valorPago;
    };
    var getValorVendaAtt = function (fatorBase, indiceID, valorVenda) {
        var dataAtual = new Date();
        dataAtual.setMonth(dataAtual.getMonth() - 2);
        dataAtual.setHours(0, 0, 0);
        dataAtual.setDate(1);
        log_1.default.error('indiceID', indiceID);
        var indiceRecord = record_1.default.load({
            type: 'customrecord_rsc_correction_unit',
            id: indiceID
        });
        var qtdLinhasIndice = indiceRecord.getLineCount({
            sublistId: 'recmachcustrecord_rsc_hif_correction_unit'
        });
        var fatorDataAtual;
        log_1.default.error('dataAtual', dataAtual);
        log_1.default.error('qtdLinhasIndice', qtdLinhasIndice);
        for (var i = 0; i < qtdLinhasIndice; i++) {
            var dataVigenciaLinha = indiceRecord.getSublistValue({
                sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                fieldId: 'custrecord_rsc_hif_effective_date',
                line: i
            });
            log_1.default.error('dataVigenciaLinha', dataVigenciaLinha);
            if (String(dataAtual) == String(dataVigenciaLinha)) {
                fatorDataAtual = indiceRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                    fieldId: 'custrecord_rsc_hif_factor_percent',
                    line: i
                });
            }
        }
        log_1.default.error('fatorDataAtual', fatorDataAtual);
        log_1.default.error("fatorBase", fatorBase);
        return Number(fatorDataAtual) / Number(fatorBase) * valorVenda;
    };
});
