/**
*@NApiVersion 2.x
*@NScriptType ClientScript
*
* ClientScript para definir as funções da criação de modelo de requisição das tarefas de modelo de projeto
*
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/record", "N/currentRecord", "N/url", "N/runtime", "N/search"], function (require, exports, record_1, currentRecord_1, url_1, runtime_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lancamentoAprop = exports.cancelar = exports.escriturar = exports.pageInit = void 0;
    record_1 = __importDefault(record_1);
    currentRecord_1 = __importDefault(currentRecord_1);
    url_1 = __importDefault(url_1);
    runtime_1 = __importDefault(runtime_1);
    search_1 = __importDefault(search_1);
    var pageInit = function (ctx) {
    };
    exports.pageInit = pageInit;
    var fieldChanged = function (ctx){
        var currRecord = ctx.currentRecord;
        var fieldId = ctx.fieldId;
        if(fieldId == 'custpage_percentual_devolver'){
            var percentual = currRecord.getValue('custpage_percentual_devolver');
            var valorPago = currRecord.getValue('custpage_valor_pago');
            var valorPagoAtt = currRecord.getValue('custpage_valor_pago_corrigido')
            currRecord.setValue({
                fieldId:'custpage_valor_devolver',
                value: (percentual / 100) * valorPago
            })
            currRecord.setValue({
                fieldId:'custpage_valor_devolver_att',
                value: (percentual / 100) * valorPagoAtt
            })
        }
    }
    exports.fieldChanged = fieldChanged;
    var escriturar = function () {
        var currentRecord = currentRecord_1.default.get();
        var feitoPor = runtime_1.default.getCurrentUser().name;
        var fieldsEscritura = {
            "custrecord_rsc_subsidiaria_distrato": currentRecord.getValue('custpage_subsidiaria'),
            "custrecord_rsc_cliente_distrato": currentRecord.getValue('custpage_cliente'),
            "custrecord_rsc_contrato_distrato": currentRecord.getValue('custpage_contrato'),
            "custrecord_rsc_empreedimento_distrato": currentRecord.getValue('custpage_empreendimento'),
            "custrecord_rsc_bloco_distrato": currentRecord.getValue('custpage_bloco'),
            "custrecord_rsc_unidade_distrato": currentRecord.getValue('custpage_unidade'),
            "custrecord_rsc_motivo_distrato": currentRecord.getValue('custpage_motivo'),
            "custrecord_rsc_data_calculo": currentRecord.getValue('custpage_data_calculo'),
            "custrecord_rsc_data_distrato": currentRecord.getValue('custpage_data_distrato'),
            "custrecord_rsc_status_distrato": 2,
            // "custrecord_rsc_indice_contrato": currentRecord.getValue('custpage_indice_contrato'),
            "custrecord_rsc_percentual_devolver": currentRecord.getValue('custpage_percentual_devolver'),
            "custrecord_rsc_valorpago": currentRecord.getValue('custpage_valor_pago'),
            "custrecord_rsc_valor_venda": currentRecord.getValue('custpage_valor_venda'),
            "custrecord_rsc_valorpago_att": currentRecord.getValue('custpage_valor_pago_corrigido'),
            "custrecord_rsc_valor_venda_att": currentRecord.getValue('custpage_valor_venda_corrigido'),
            "custrecord_rsc_receita_decoracao": currentRecord.getValue('custpage_receita_decoracao'),
            "custrecord_rsc_receita_decoracao_att": currentRecord.getValue('custpage_receita_decoracao_att'),
            "custrecord_rsc_despesa_cartorio": currentRecord.getValue('custpage_despesa_cartorio'),
            "custrecord_rsc_iptu": currentRecord.getValue('custpage_iptu'),
            "custrecord_rsc_condominio": currentRecord.getValue('custpage_condominio'),
            "custrecord_rsc_valor_devolver": currentRecord.getValue('custpage_valor_devolver'),
            "custrecord_rsc_valor_devolver_att": currentRecord.getValue('custpage_valor_devolver_att'),
            "custrecord_rsc_valor_acordado": currentRecord.getValue('custpage_valor_acordado'),
            "custrecord_rsc_qtd_parcelas": currentRecord.getValue('custpage_qtd_parcela'),
            "custrecord_rsc_vencimento_inicial": currentRecord.getValue('custpage_vencimento_inicial'),
            "custrecord_rsc_empreedimento_aproveit": currentRecord.getValue('custpage_empreendimento_dgt'),
            "custrecord_rsc_bloco_credito": currentRecord.getValue('custpage_bloco_dgt'),
            "custrecord_lrc_unidade_credito": currentRecord.getValue('custpage_unidade_dgt'),
            "custrecord_rsc_observacoes": currentRecord.getValue('custpage_observacoes'),
            "custrecord_rsc_feito_por": feitoPor,
            "custrecord_rsc_valor_vencido": currentRecord.getValue('custpage_rsc_valor_vencido'),
            "custrecord_rsc_valor_vencer": currentRecord.getValue('custpage_rsc_valor_vencer'),
            "custrecord_rsc_data_inicio_atraso": currentRecord.getValue('custpage_rsc_data_inicio_vencimento'),
            "custrecord_rsc_ult_parcela_paga": currentRecord.getValue('custpage_rsc_data_ult_pagamento')
        };
        var escrituraRecord = record_1.default.create({
            type: 'customrecord_rsc_escritura_distrato'
        });
        Object.keys(fieldsEscritura).forEach(function (key) {
            escrituraRecord.setValue({
                fieldId: key,
                value: fieldsEscritura[key]
            });
        });
        // const clienteLookup = search_1.default.lookupFields({
        //     type:'customer',
        //     id: currentRecord.getValue('custpage_cliente'),
        //     columns:['custentity_enl_cnpjcpf']
        // })
        // const searchFornecedor = search_1.default.create({
        //     type:'vendor',
        //     filters:[
        //         ['custentity_enl_cnpjcpf', 'IS', clienteLookup.custentity_enl_cnpjcpf]
        //     ]
        // }).run().getRange({
        //     start: 0,
        //     end: 1
        // })
        // if(!searchFornecedor[0]){
        //     const idFornecedor = getIdnewFornecedor(currentRecord.getValue('custpage_cliente'));
        // }
        var escrituraID = escrituraRecord.save({
            ignoreMandatoryFields: true
        });
        var url = url_1.default.resolveRecord({
            recordId: escrituraID,
            recordType: 'customrecord_rsc_escritura_distrato'
        });
        window.location.replace(url);
    };
    exports.escriturar = escriturar;
    var cancelar = function () {
        window.close();
    };
    exports.cancelar = cancelar;
    var getIdnewFornecedor = function (idCliente) {
        var clienteRecord = record_1.default.load({
            type: 'customer',
            id: idCliente
        });
        // let AddressSubrecord = clienteRecord.getCurrentSublistSubrecord({
        //     sublistId: 'addressbook',
        //     fieldId: 'addressbookaddress'
        // });
        var newFornecedor = record_1.default.create({
            type: 'vendor'
        });
        var nomeCliente;
        if (clienteRecord.getValue('companyname')) {
            nomeCliente = String(clienteRecord.getValue('companyname'));
        }
        else if (clienteRecord.getValue('salutation')) {
            nomeCliente = String(clienteRecord.getValue('salutation'));
        }
        else if (clienteRecord.getValue('shipaddressee')) {
            nomeCliente = String(clienteRecord.getValue('shipaddressee'));
        }
        else {
            nomeCliente = String(clienteRecord.getValue('firstname')) + " " + String(clienteRecord.getValue('lastname'));
        }
        console.log('nomeCliente: ', nomeCliente);
        var fieldsFornecedor = {
            "companyname": nomeCliente,
            "email": clienteRecord.getValue('email'),
            "subsidiary": clienteRecord.getValue('subsidiary'),
            "custentity_enl_cnpjcpf": clienteRecord.getValue('custentity_enl_cnpjcpf'),
            "phone": clienteRecord.getValue('phone'),
            "custentity_enl_ccmnum": 123,
            "custentity_enl_ienum": 123,
            "custentity_enl_legalname": nomeCliente,
            "defaultaddress": clienteRecord.getValue('defaultaddress')
        };
        console.log('fieldsFornecedor: ', fieldsFornecedor)
        console.log('CPF: ', clienteRecord.getValue('custentity_enl_cnpjcpf'));
        Object.keys(fieldsFornecedor).forEach(function (key) {
            newFornecedor.setValue({
                fieldId: key,
                value: fieldsFornecedor[key] || "",
            });
        });
        // let AddressSubrecordForncedor = newFornecedor.getCurrentSublistSubrecord({
        //     sublistId: 'addressbook',
        //     fieldId: 'addressbookaddress'
        // });
        // const fieldsAdress: { [key: string]: string | Number | FieldValue} = {
        //     "country": AddressSubrecord.getValue('country'),
        //     "state": AddressSubrecord.getValue('state'),
        //     "custrecord_o2g_address_l_mun": AddressSubrecord.getValue('custrecord_o2g_address_l_mun'),
        //     "addrphone": AddressSubrecord.getValue('addrphone'),
        //     "zip": AddressSubrecord.getValue('zip'),
        //     "custrecord_sit_address_i_numero": AddressSubrecord.getValue('custrecord_sit_address_i_numero'),
        //     "custrecord_sit_address_complemento": AddressSubrecord.getValue('custrecord_sit_address_complemento'),
        //     "custrecord_sit_address_t_bairro": AddressSubrecord.getValue('custrecord_sit_address_t_bairro'),
        //     "addr1": AddressSubrecord.getValue('addr1')
        // }
        // Object.keys(fieldsAdress).forEach((key) => {
        //     AddressSubrecordForncedor.setValue({
        //         fieldId: key,
        //         value: fieldsAdress[key] || "",
        //     });
        // });
        // newFornecedor.commitLine({
        //     sublistId: 'addressbook'
        // });
        var idFornecedor = newFornecedor.save({
            ignoreMandatoryFields: true
        });
        // const idFornecedor = Record.transform({
        //     fromType:'customer',
        //     fromId: idCliente,
        //     toType:'vendor'
        // })
        // console.log('idFornecedor: ', idFornecedor)
        // const teste = idFornecedor.save({
        //     ignoreMandatoryFields:true
        // })
        // console.log('teste: ', teste)
        return idFornecedor;
    };
    var getProRata = function (dataVencimento, indiceID, valorPago) {
        var valor = 0;
        dataVencimento.setDate(1);
        dataVencimento.setMonth(dataVencimento.getMonth() - 2);
        dataVencimento.setHours(0, 0, 0);
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
            // Log.debug('dataAtual', String(dataAtual))
            var dataVigenciaLinha = indiceRecord.getSublistValue({
                sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                fieldId: 'custrecord_rsc_hif_effective_date',
                line: i
            });
            // Log.debug('dataVigenciaLinha', String(dataVigenciaLinha))
            if (String(dataVigenciaLinha) == String(dataVencimento)) {
                fatorDatavencimento = indiceRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                    fieldId: 'custrecord_rsc_hif_factor_percent',
                    line: i
                });
            }
            if (String(dataAtual) == String(dataVigenciaLinha)) {
                fatorDataAtual = indiceRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                    fieldId: 'custrecord_rsc_hif_factor_percent',
                    line: i
                });
            }
        }
        console.log(fatorDataAtual);
        console.log(fatorDatavencimento);
        valor = (Number(fatorDataAtual) / Number(fatorDatavencimento) - 1) * valorPago;
        valor = valor / 30 * Number(new Date().getDate());
        // Log.debug('valorPago', valorPago)
        return valor;
    };
    var getAttMonetaria = function (dataVencimento, indiceID, valorPago) {
        var valor = 0;
        if (new Date().getTime() > dataVencimento.getTime()) {
            dataVencimento.setDate(1);
            dataVencimento.setMonth(dataVencimento.getMonth() - 2);
            var indiceRecord = record_1.default.load({
                type: 'customrecord_rsc_correction_unit',
                id: indiceID
            });
            var qtdLinhasIndice = indiceRecord.getLineCount({
                sublistId: 'recmachcustrecord_rsc_hif_correction_unit'
            });
            var fatorDataAtual = void 0;
            var fatorDatavencimento = void 0;
            for (var i = 0; i < qtdLinhasIndice; i++) {
                var dataAtual = new Date("01/01/2022");
                dataAtual.setMonth(dataAtual.getMonth() - 2);
                dataAtual.setHours(0, 0, 0);
                dataAtual.setDate(1);
                // Log.debug('dataAtual', String(dataAtual))
                var dataVigenciaLinha = indiceRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                    fieldId: 'custrecord_rsc_hif_effective_date',
                    line: i
                });
                // Log.debug('dataVigenciaLinha', String(dataVigenciaLinha))
                if (String(dataVigenciaLinha) == String(dataVencimento)) {
                    fatorDatavencimento = indiceRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                        fieldId: 'custrecord_rsc_hif_factor_percent',
                        line: i
                    });
                }
                if (String(dataAtual) == String(dataVigenciaLinha)) {
                    fatorDataAtual = indiceRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                        fieldId: 'custrecord_rsc_hif_factor_percent',
                        line: i
                    });
                }
            }
            valor = (Number(fatorDataAtual) / Number(fatorDatavencimento) - 1) * valorPago;
        }
        else {
            valor = 0;
        }
        // Log.debug('valorPago', valorPago)
        return valor;
    };
    var lancamentoAprop = function (distratoRecord) {
        var somaDebit = 0;
        var somaCredit = 0;
        var valorPago = Number(distratoRecord.getValue('custpage_valor_pago'));
        var valorDevolucao = Number(distratoRecord.getValue('custpage_valor_acordado'));
        var valorVenda = Number(distratoRecord.getValue('custpage_valor_venda'));
        var valorVendaAtt = Number(distratoRecord.getValue('custpage_valor_venda_corrigido'));
        var indice = Number(distratoRecord.getValue('custpage_indice_contrato'));
        // const contrato = distratoRecord.getValue('custrecord_rsc_contrato_distrato')
        var dataMesAnterior = new Date();
        dataMesAnterior.setMonth(dataMesAnterior.getMonth() - 1);
        var attMonetariaAcumulada = valorVendaAtt - valorVenda;
        var valorProRata = Number(getProRata(dataMesAnterior, indice, valorVenda).toFixed(2));
        var contabilizacaoAprop = record_1.default.create({
            type: 'journalentry'
        });
        contabilizacaoAprop.setValue({
            fieldId: 'subsidiary',
            value: distratoRecord.getValue('custpage_subsidiaria')
        });
        contabilizacaoAprop.setValue({
            fieldId: 'trandate',
            value: new Date()
        });
        contabilizacaoAprop.setValue({
            fieldId: 'custbody_rsc_projeto_obra_gasto_compra',
            value: distratoRecord.getValue('custpage_empreendimento')
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 0,
            value: 1212
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 0,
            value: (valorVenda + attMonetariaAcumulada + valorProRata) - valorPago
        });
        somaCredit += (valorVenda + attMonetariaAcumulada + valorProRata) - valorPago;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 1,
            value: 1486
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 1,
            value: valorDevolucao
        });
        somaCredit += valorDevolucao;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 2,
            value: 1212
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 2,
            value: valorDevolucao
        });
        somaCredit += valorDevolucao;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 3,
            value: 1484
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 3,
            value: valorDevolucao
        });
        somaDebit += valorDevolucao;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 4,
            value: 19810
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 4,
            value: valorVenda
        });
        somaDebit += valorVenda;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 5,
            value: 19811
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 5,
            value: attMonetariaAcumulada
        });
        somaDebit += attMonetariaAcumulada;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 6,
            value: 1391
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 6,
            value: valorPago
        });
        somaDebit += valorPago;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 7,
            value: 1389
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 7,
            value: valorPago
        });
        somaCredit += valorPago;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 8,
            value: 19811
        });
        // contabilizacaoAprop.setSublistValue({
        //     sublistId:'line',
        //     fieldId:'account',
        //     line: 9,
        //     value:19810
        // })
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 8,
            value: valorProRata
        });
        somaDebit += valorProRata;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 9,
            value: 19810
        });
        if ((valorPago - valorDevolucao) * -1 > 0) {
            contabilizacaoAprop.setSublistValue({
                sublistId: 'line',
                fieldId: 'debit',
                line: 9,
                value: valorPago - valorDevolucao
            });
            somaDebit += valorPago - valorDevolucao;
            // contabilizacaoAprop.setSublistValue({
            //     sublistId:'line',
            //     fieldId:'credit',
            //     line: 9,
            //     value:attMonetariaAcumulada
            // })
        }
        else {
            contabilizacaoAprop.setSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
                line: 9,
                value: valorPago - valorDevolucao
            });
            somaCredit += valorPago - valorDevolucao;
            // contabilizacaoAprop.setSublistValue({
            //     sublistId:'line',
            //     fieldId:'debit',
            //     line: 9,
            //     value:attMonetariaAcumulada
            // })
        }
        var contApropID = contabilizacaoAprop.save({
            ignoreMandatoryFields: true
        });
        return contApropID;
    };
    exports.lancamentoAprop = lancamentoAprop;
});
