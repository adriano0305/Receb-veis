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
define(["require", "exports", "N/search", "N/record", "N/currentRecord", "N/runtime", "N/url", "N/log", "N/ui/dialog"], function (require, exports, search_1, record_1, currentRecord_1, runtime_1, url_1, log_1, dialog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lancamentoAprop = exports.cancelar_distrato = exports.gerar_minuta = exports.gerar_relatorio = exports.aprovar = exports.aprovarLanc = exports.pageInit = void 0;
    search_1 = __importDefault(search_1);
    record_1 = __importDefault(record_1);
    currentRecord_1 = __importDefault(currentRecord_1);
    runtime_1 = __importDefault(runtime_1);
    url_1 = __importDefault(url_1);
    log_1 = __importDefault(log_1);
    dialog_1 = __importDefault(dialog_1);
    var pageInit = function (ctx) {
        var record = ctx.currentRecord;
        var obs = record.getValue('custrecord_rsc_observacoes');
        console.log(obs);
        log_1.default.error('testando', obs);
    };
    exports.pageInit = pageInit;
    // export const gerar_Forn = () =>{
    //     const currRecord = CurrentRecord.get();
    //     const distratoRecord = Record.load({
    //         type:'customrecord_rsc_escritura_distrato',
    //         id: currRecord.id
    //     })
    //     distratoRecord.save()
    // }
    var aprovarLanc = function () {
        var currRecord = currentRecord_1.default.get();
        var contaIncorporacao = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_conta_dts_incorporacao' });
        var contaTrasitoria = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_conta_dts_transitoria' });
        var contaaPagar = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_conta_dts_apagar' });
        var distratoRecord = record_1.default.load({
            type: 'customrecord_rsc_escritura_distrato',
            id: currRecord.id
        });
        console.log(distratoRecord)
        var newContabilizacao = record_1.default.create({
            type: 'journalentry'
        });
        newContabilizacao.setValue({
            fieldId: 'subsidiary',
            value: distratoRecord.getValue('custrecord_rsc_subsidiaria_distrato')
        });
        newContabilizacao.setValue({
            fieldId: 'trandate',
            value: new Date()
        });
        newContabilizacao.setValue({
            fieldId: 'custbody_rsc_projeto_obra_gasto_compra',
            value: distratoRecord.getValue('custrecord_rsc_empreedimento_distrato')
        });
        console.log(contaIncorporacao)
        newContabilizacao.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 0,
            value: contaIncorporacao
        });
        // var contratoLookup = search_1.default.lookupFields({
        //     type: 'invoice',
        //     id: distratoRecord.getValue('custrecord_rsc_contrato_distrato'),
        //     columns: ['custbody_rsc_finan_dateativacontrato']
        // });
        var dataMesSubCorrente = new Date();
        dataMesSubCorrente.setMonth(new Date().getMonth() - 1);
        console.log(dataMesSubCorrente);
        // var resultado = Number(distratoRecord.getValue('custrecord_rsc_valor_venda')) - Number(distratoRecord.getValue('custrecord_rsc_valorpago'));
        // var proRataCorrente = Number(getProRata(new Date(dataMesSubCorrente), distratoRecord.getValue('custrecord_rsc_indice_contrato'), resultado)).toFixed(2);
        // var attMonetaria = Number(getAttMonetaria(new Date(contratoLookup.custbody_rsc_finan_dateativacontrato), distratoRecord.getValue('custrecord_rsc_indice_contrato'), resultado)).toFixed(2);
        // var soma = Number(proRataCorrente) + Number(attMonetaria);
        var valorPago = Number(distratoRecord.getValue('custrecord_rsc_valorpago'));
        // var valorDevolucao = Number(distratoRecord.getValue('custrecord_rsc_valor_acordado'));
        var valorVenda = Number(distratoRecord.getValue('custrecord_rsc_valor_venda'));
        var valorVendaAtt = Number(distratoRecord.getValue('custrecord_rsc_valor_venda_att'));
        var indice = Number(distratoRecord.getValue('custrecord_rsc_indice_contrato'));
        // const contrato = distratoRecord.getValue('custrecord_rsc_contrato_distrato')
        var dataMesAnterior = new Date();
        dataMesAnterior.setDate(1);
        dataMesAnterior.setMonth(dataMesAnterior.getMonth() - 1);
        var attMonetariaAcumulada = valorVendaAtt - valorVenda;
        var valorProRata = Number(getProRata(dataMesAnterior, distratoRecord.getValue('custrecord_rsc_contrato_distrato')).toFixed(2));
        // console.log('soma', soma);
        newContabilizacao.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 0,
            value: (valorVenda + attMonetariaAcumulada + valorProRata) - valorPago
        });
        newContabilizacao.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 0,
            value: 'Soma do pro rata corrente com a atualização monetaria acumulada.'
        });
        newContabilizacao.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 1,
            value: contaTrasitoria
        });
        newContabilizacao.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 1,
            value: (valorVenda + attMonetariaAcumulada + valorProRata) - valorPago
        });
        newContabilizacao.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 1,
            value: 'Soma do pro rata corrente com a atualização monetaria acumulada.'
        });
        console.log('antes 1 save');
        var recordContabilizacao = newContabilizacao.save({
            ignoreMandatoryFields: true
        });
        console.log('dps 1 save');
        var newProvisao = record_1.default.create({
            type: 'journalentry'
        });
        newProvisao.setValue({
            fieldId: 'subsidiary',
            value: distratoRecord.getValue('custrecord_rsc_subsidiaria_distrato')
        });
        newProvisao.setValue({
            fieldId: 'trandate',
            value: new Date()
        });
        newProvisao.setValue({
            fieldId: 'custbody_rsc_projeto_obra_gasto_compra',
            value: distratoRecord.getValue('custrecord_rsc_empreedimento_distrato')
        });
        newProvisao.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 0,
            value: contaaPagar
        });
        newProvisao.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 0,
            value: distratoRecord.getValue('custrecord_rsc_valor_acordado')
        });
        newProvisao.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 0,
            value: 'Valor acordado de devolução'
        });
        newProvisao.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 1,
            value: contaTrasitoria
        });
        newProvisao.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 1,
            value: distratoRecord.getValue('custrecord_rsc_valor_acordado')
        });
        newProvisao.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 1,
            value: 'Valor acordado de devolução'
        });
        var recordProvisao = newProvisao.save({
            ignoreMandatoryFields: true
        });
        var idAprop = exports.lancamentoAprop(distratoRecord);
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_ctbl_distrato',
            value: recordContabilizacao
        });
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_prov_devolucao',
            value: recordProvisao
        });
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_lanc_aprop',
            value: idAprop
        });
        
        // const clienteLookup = search_1.default.lookupFields({
        //     type:'customer',
        //     id: distratoRecord.getValue('custrecord_rsc_cliente_distrato'),
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
        // distratoRecord.setValue({
        //     fieldId:'custrecord_rsc_fornecedor_criado',
        //     value: searchFornecedor[0].id
        // })
        
        //     var urlDomain = 'https://5843489-sb1.app.netsuite.com/app/common/entity/company.nl?e=T&target=s_relation:otherrelationships&label=Other+Relationships&fromtype=custjob&id=' + distratoRecord.getValue('custrecord_rsc_cliente_distrato') + '&totype=vendor';
        //     var urlTransform = url_1.default.format({
        //         domain: urlDomain,
        //         params: []
        //     });
        // window.open(urlTransform, "_blank");
        
           
        
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_status_distrato',
            value: 3
        });
        record_1.default.submitFields({
            type: 'salesorder',
            id: distratoRecord.getValue('custrecord_rsc_contrato_distrato'),
            values: {
                'custbody_rsc_status_contrato': '3'
            }
        });
        distratoRecord.save();
        var urlEscritura = url_1.default.resolveRecord({
            recordType: 'customrecord_rsc_escritura_distrato',
            recordId: currRecord.id,
        })
        window.location.replace(urlEscritura)
    };
    exports.aprovarLanc = aprovarLanc;
    
    
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
            "custentity_enl_cnpjcpf": Number(clienteRecord.getValue('custentity_enl_cnpjcpf')),
            "defaultaddress": clienteRecord.getValue('defaultaddress')
        };
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
    var aprovar = function () {
        var currRecord = currentRecord_1.default.get();
        var distratoRecord = record_1.default.load({
            type: 'customrecord_rsc_escritura_distrato',
            id: currRecord.id
        });
        var searchContaCliente = search_1.default.create({
            type: 'customrecord_rsc_cnab_bankaccount',
            filters: [
                ['custrecord_rsc_cnab_ba_entity_ls', 'IS', distratoRecord.getValue('custrecord_rsc_cliente_distrato')]
            ]
        }).run().getRange({
            start: 0,
            end: 1
        });
        
        var searchVendor = search_1.default.create({
            type:"vendor",
            filters:[
                ['internalid','IS', distratoRecord.getValue('custrecord_rsc_cliente_distrato')]
            ]
        }).run().getRange({
            start:0,
            end:1
        })
        if(searchVendor[0]){

            record_1.default.load({
                type:'vendor',
                id: distratoRecord.getValue('custrecord_rsc_cliente_distrato')
            })
            if (searchContaCliente[0]) {
                var url = url_1.default.resolveScript({
                    scriptId: 'customscript_rsc_btt_aprovar',
                    deploymentId: 'customdeploy_rsc_btt_aprovar',
                    params: {
                        distratoId: currRecord.id
                    }
                });
                dialog_1.default.alert({
                    title: 'Aviso!',
                    message: 'Aguarde a geração da devolução.'
                });
                window.location.replace(url);
            }
            else {
                dialog_1.default.alert({
                    title: 'Aviso!',
                    message: 'Não existe conta bancaria registrada no nome desse cliente.'
                });
                return;
            }
        }else{

            dialog_1.default.alert({
                message: 'Não existe fornecedor correspondente a esse cliente.',
                title: 'Aviso!',
            });
        }
        
        
    };
    exports.aprovar = aprovar;
    var gerar_relatorio = function () {
        var currentRecord = currentRecord_1.default.get();
        var currRecord = record_1.default.load({
            type: 'customrecord_rsc_escritura_distrato',
            id: currentRecord.id
        });
        var obra = currRecord.getText('custrecord_rsc_empreedimento_distrato');
        var bloco = currRecord.getText('custrecord_rsc_bloco_distrato');
        obra = obra + "/" + bloco;
        var unidade = currRecord.getValue('custrecord_rsc_unidade_distrato');
        var comprador = currRecord.getText('custrecord_rsc_cliente_distrato');
        var vendedor = currRecord.getText('custrecord_rsc_subsidiaria_distrato');
        var receitaImobi = currRecord.getValue('custrecord_rsc_valorpago');
        var receitaServicos = currRecord.getValue('custrecord_rsc_receita_decoracao');
        var valorVendaAtt = currRecord.getValue('custrecord_rsc_valor_venda_att');
        var valorPagoAtt = currRecord.getValue('custrecord_rsc_valorpago_att');
        var receitaServicoPago = currRecord.getValue('custrecord_rsc_valor_devolver_att');
        var valorDevolucao = currRecord.getValue('custrecord_rsc_valor_acordado');
        var observacoes = currRecord.getValue('custrecord_rsc_observacoes');
        log_1.default.error('teste', observacoes);
        observacoes = observacoes.split('<br>').join('/');
        log_1.default.error('teste2', observacoes);
        var motivo = currRecord.getText('custrecord_rsc_motivo_distrato');
        var ultParcela = currRecord.getValue('custrecord_rsc_ult_parcela_paga');
        var feitoPor = currRecord.getValue('custrecord_rsc_feito_por');
        var cartorio;
        var condominio;
        var iptu;
        if (currRecord.getValue('custrecord_rsc_despesa_cartorio')) {
            cartorio = currRecord.getValue('custrecord_rsc_despesa_cartorio');
        }
        else {
            cartorio = "NADA CONSTA";
        }
        if (currRecord.getValue('custrecord_rsc_condominio')) {
            condominio = currRecord.getValue('custrecord_rsc_condominio');
        }
        else {
            condominio = "NADA CONSTA";
        }
        if (currRecord.getValue('custrecord_rsc_iptu')) {
            iptu = currRecord.getValue('custrecord_rsc_iptu');
        }
        else {
            iptu = "NADA CONSTA";
        }
        var dataAtraso = currRecord.getValue('custrecord_rsc_data_inicio_atraso');
        var valorVencido = currRecord.getValue('custrecord_rsc_valor_vencido');
        var valorVencer = currRecord.getValue('custrecord_rsc_valor_vencer');
        var url = url_1.default.resolveScript({
            scriptId: 'customscript_rsc_relatorio_distrato',
            deploymentId: 'customdeploy_rsc_relatorio_distrato',
            params: {
                obra: obra,
                unidade: unidade,
                comprador: comprador,
                vendedor: vendedor,
                receitaImobi: receitaImobi,
                receitaServicos: receitaServicos,
                valorVendaAtt: valorVendaAtt,
                valorPagoAtt: valorPagoAtt,
                receitaServicoPago: receitaServicoPago,
                valorDevolucao: valorDevolucao,
                observacoes: observacoes,
                motivo: motivo,
                ultParcela: ultParcela,
                feitoPor: feitoPor,
                cartorio: cartorio,
                condominio: condominio,
                iptu: iptu,
                dataAtraso: dataAtraso,
                valorVencido: valorVencido,
                valorVencer: valorVencer
            }
        });
        dialog_1.default.alert({
            title: 'Aviso!',
            message: 'Gerando relatório.'
        });
        window.location.replace(url);
    };
    exports.gerar_relatorio = gerar_relatorio;
    var gerar_minuta = function () {
        var currRecord = currentRecord_1.default.get();
        var escrituraLookup = search_1.default.lookupFields({
            type:'customrecord_rsc_escritura_distrato',
            id: currRecord.id,
            columns:[
                'custrecord_rsc_cliente_distrato'
            ]
        })
        var contaSearch = search_1.default.create({
            type: 'customrecord_rsc_cnab_bankaccount',
            filters: [
                ['custrecord_rsc_cnab_ba_entity_ls', 'IS', escrituraLookup.custrecord_rsc_cliente_distrato[0].value]
            ]
        }).run().getRange({
            start: 0,
            end: 1
        });
        if(contaSearch[0]){

            var url = url_1.default.resolveScript({
                scriptId: 'customscript_rsc_minuta_distrato',
                deploymentId: 'customdeploy2',
                params: {
                    distratoId: currRecord.id
                }
            });
            dialog_1.default.alert({
                title: 'Aviso!',
                message: 'Gerando minuta.'
            });
            window.location.replace(url);
        }else{
            dialog_1.default.alert({
                title: 'Aviso!',
                message: 'Não existe conta bancária para este cliente.'
            });
        }
    };
    exports.gerar_minuta = gerar_minuta;
    var cancelar_distrato = function () {
        var currRecord = currentRecord_1.default.get();
        var distratoRecord = record_1.default.load({
            type: 'customrecord_rsc_escritura_distrato',
            id: currRecord.id
        });
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_status_distrato',
            value: 4
        });
        // var ContDistrato = distratoRecord.getValue('custrecord_rsc_ctbl_distrato');
        // var ProvDistrato = distratoRecord.getValue('custrecord_rsc_prov_devolucao');
        // var lancAprop = distratoRecord.getValue('custrecord_rsc_lanc_aprop');
        distratoRecord.save({
            ignoreMandatoryFields: true
        });
        // record_1.default.delete({
        //     type: 'journalentry',
        //     id: Number(ContDistrato)
        // });
        // record_1.default.delete({
        //     type: 'journalentry',
        //     id: Number(ProvDistrato)
        // });
        // record_1.default.delete({
        //     type: 'journalentry',
        //     id: Number(lancAprop)
        // });
        window.close();
    };
    exports.cancelar_distrato = cancelar_distrato;
    var getProRataParcela = function (dataVencimento, indiceID, valorPago) {
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
        var fatorDataAtual = 0;
        var fatorDatavencimento = 0;
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
        if(fatorDataAtual ==0){
            dialog_1.default.alert({
                title: 'Aviso!',
                message: 'Verifiquei se existe fator do seu indice referente ao mês atual.'
            });
            return;
        }
        if(fatorDatavencimento == 0){
            dialog_1.default.alert({
                title: 'Aviso!',
                message: 'Verifiquei se existe fator do seu indice referente ao mês anterior.'
            });
            return;
        }
        console.log(fatorDataAtual);
        console.log(fatorDatavencimento);
        valor = (Number(fatorDataAtual) / Number(fatorDatavencimento) - 1) * valorPago;
        valor = valor / 30 * Number(new Date().getDate());
        // Log.debug('valorPago', valorPago)
        return valor;
    };
    var getProRata = function (dataVencimento, idPrincipal) {
        var soma = 0
        var repeteArray = []
        search_1.default.create({
            type:'invoice',
            filters:[
                ['custbody_lrc_fatura_principal', 'IS', idPrincipal],
                'AND',
                ['mainline', 'IS', 'T']
            ],
            columns:[
                'total'
            ]
        }).run().each(function (result) {
            if(repeteArray.indexOf(repeteArray) == -1){

                var invoiceRecord = record_1.default.load({
                    type:'invoice',
                    id: result.id
                })
                var qtLinhas = invoiceRecord.getLineCount({
                    sublistId:'item'
                })
                for(var i = 0; i< qtLinhas;i++){
                    var itemDisplay = invoiceRecord.getSublistValue({
                        sublistId:'item',
                        fieldId:'item_display',
                        line: i
                    })
                    var amount = invoiceRecord.getSublistValue({
                        sublistId:'item',
                        fieldId:'amount',
                        line: i
                    })
                    if(itemDisplay == 'Fração Principal'){
                        soma += getProRataParcela(dataVencimento,invoiceRecord.getValue('custbody_rsc_indice'), amount)
                    }
                }
                soma += Number(result.getValue('total'));
                log_1.default.error("soma", soma)
                repeteArray.push(result.id)
            }
            return true
        })
        return soma
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
            var fatorDataAtual = 0;
            var fatorDatavencimento = 0;
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
                console.log('dataVencimento', dataVencimento)
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
            if(fatorDataAtual == 0){
                dialog_1.default.alert({
                    title: 'Aviso!',
                    message: 'Verifiquei se existe fator do seu indice referente ao mês atual.'
                });
                return;
            }
            if(fatorDatavencimento == 0){
                dialog_1.default.alert({
                    title: 'Aviso!',
                    message: 'Verifiquei se existe fator do seu indice referente a data de referência do contrato.'
                });
                return;
            }
            console.log('fatorDataAtual', fatorDataAtual)
            console.log('fatorDatavencimento', fatorDatavencimento)
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
        var valorPago = Number(distratoRecord.getValue('custrecord_rsc_valorpago'));
        var valorDevolucao = Number(distratoRecord.getValue('custrecord_rsc_valor_acordado'));
        var valorVenda = Number(distratoRecord.getValue('custrecord_rsc_valor_venda'));
        var valorVendaAtt = Number(distratoRecord.getValue('custrecord_rsc_valor_venda_att'));
        var indice = Number(distratoRecord.getValue('custrecord_rsc_indice_contrato'));
        var contaTransitoria = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_conta_dts_transitoria' });
        var contaNeutralizada = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_conta_neutralizada' });
        var contaUnidadeDist = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_conta_unidade_distratada' });
        var contaReceitaVenda = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_conta_receita_venda' }); 
        var contaReceitaVendaCm = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_conta_receita_venda_cm' });
        var contaNeutralizacaoReceita = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_neut_receita' });
        var contaApropReceita = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_aprop_receita' });
        // const contrato = distratoRecord.getValue('custrecord_rsc_contrato_distrato')
        var dataMesAnterior = new Date();
        dataMesAnterior.setDate(1);
        dataMesAnterior.setMonth(dataMesAnterior.getMonth() - 1);
        
        var attMonetariaAcumulada = valorVendaAtt - valorVenda;
        var valorProRata = Number(getProRata(dataMesAnterior,distratoRecord.getValue('custrecord_rsc_contrato_distrato')).toFixed(2));
        var contabilizacaoAprop = record_1.default.create({
            type: 'journalentry'
        });
        contabilizacaoAprop.setValue({
            fieldId: 'subsidiary',
            value: distratoRecord.getValue('custrecord_rsc_subsidiaria_distrato')
        });
        contabilizacaoAprop.setValue({
            fieldId: 'trandate',
            value: new Date()
        });
        contabilizacaoAprop.setValue({
            fieldId: 'custbody_rsc_projeto_obra_gasto_compra',
            value: distratoRecord.getValue('custrecord_rsc_empreedimento_distrato')
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 0,
            value: contaTransitoria
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 0,
            value: (valorVenda + attMonetariaAcumulada + valorProRata) - valorPago
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 0,
            value: 'Soma dos valores valor da venda, atualização monetária acumulada e pro rata corrente, subtraidos do valor pago.'
        });
        somaCredit += (valorVenda + attMonetariaAcumulada + valorProRata) - valorPago;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 1,
            value: contaNeutralizada
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 1,
            value: valorDevolucao
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 1,
            value: 'Valor acordado para devolução'
        });
        somaCredit += valorDevolucao;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 2,
            value: contaTransitoria
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 2,
            value: valorDevolucao
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 2,
            value: 'Valor acordado para devolução'
        });
        somaCredit += valorDevolucao;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 3,
            value: contaUnidadeDist
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 3,
            value: valorDevolucao
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 3,
            value: 'Valor acordado para devolução'
        });
        somaDebit += valorDevolucao;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 4,
            value: contaReceitaVenda
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 4,
            value: valorVenda
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 4,
            value: 'Valor da venda'
        });
        somaDebit += valorVenda;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 5,
            value: contaReceitaVendaCm
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 5,
            value: attMonetariaAcumulada
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 5,
            value: 'Atualização monetária acumulada'
        });
        somaDebit += attMonetariaAcumulada;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 6,
            value: contaNeutralizacaoReceita
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'debit',
            line: 6,
            value: valorPago
        });
         contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 6,
            value: 'Valor Pago'
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'custcol_rsc_neutralizacaoreceita',
            line: 6,
            value: true
        });
        somaDebit += valorPago;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 7,
            value: contaApropReceita
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'credit',
            line: 7,
            value: valorPago
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 7,
            value: 'Valor Pago'
        });
        somaCredit += valorPago;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 8,
            value: contaReceitaVendaCm
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
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 8,
            value: 'Valor do pro rata do mês corrente'
        });
        somaDebit += valorProRata;
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            line: 9,
            value: contaReceitaVenda
        });
        contabilizacaoAprop.setSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            line: 9,
            value: 'Subtração do valor pago pelo valor acordado para a devolução'
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
        console.log('Soma Debito', somaDebit)
        console.log('Soma Credito', somaCredit)
        var contApropID = contabilizacaoAprop.save({
            ignoreMandatoryFields: true
        });
        return contApropID;
    };
    exports.lancamentoAprop = lancamentoAprop;
});
