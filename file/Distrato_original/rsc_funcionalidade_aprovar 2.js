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
define(["require", "exports", "N/record", "N/search", "N/redirect", "N/task", "N/runtime", "N/https", "N/log"], function (require, exports, record_1, search_1, redirect_1, task_1, runtime_1, https_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    record_1 = __importDefault(record_1);
    search_1 = __importDefault(search_1);
    redirect_1 = __importDefault(redirect_1);
    task_1 = __importDefault(task_1);
    runtime_1 = __importDefault(runtime_1);
    https_1 = __importDefault(https_1);
    log_1 = __importDefault(log_1);
    var onRequest = function (ctx) {
        var params = ctx.request.parameters;
        var distratoRecord = record_1.default.load({
            type: 'customrecord_rsc_escritura_distrato',
            id: params.distratoId
        });
        var qtdParcelas = distratoRecord.getValue('custrecord_rsc_qtd_parcelas');
        var dataVencimento = distratoRecord.getValue('custrecord_rsc_vencimento_inicial');
        log_1.default.error("data", new Date(dataVencimento));
        dataVencimento = new Date(dataVencimento);
        var valorAcordado = distratoRecord.getValue('custrecord_rsc_valor_acordado');
        var trasnWorkflow = 8;
        var conta = runtime_1.default.getCurrentScript().getParameter({ name: 'custscript_rsc_distrato' });
        var valorParcelas = Number(valorAcordado) / Number(qtdParcelas);
        var vendorbillId;
        var idVendorbill = [];
        // var clienteLookup = search_1.default.lookupFields({
        //     type: 'customer',
        //     id: distratoRecord.getValue('custrecord_rsc_cliente_distrato'),
        //     columns: ['custentity_enl_cnpjcpf']
        // });
        // var searchFornecedor = search_1.default.create({
        //     type: 'vendor',
        //     filters: [
        //         ['custentity_enl_cnpjcpf', 'IS', clienteLookup.custentity_enl_cnpjcpf]
        //     ]
        // }).run().getRange({
        //     start: 0,
        //     end: 1
        // });
        // var idFornecedor = 0;
        // if (searchFornecedor[0]) {
        //     idFornecedor = Number(searchFornecedor[0].id);
        // }
        // else {
        //     idFornecedor = getIdnewFornecedor(distratoRecord.getValue('custrecord_rsc_cliente_distrato'));
        // }
        var loc = buscaLocalidade(distratoRecord.getValue('custrecord_rsc_cliente_distrato'));
        for (var i = 0; i < Number(qtdParcelas); i++) {
            var newVendorbill = record_1.default.create({
                type: 'vendorbill',
            });
            newVendorbill.setValue({
                fieldId: 'entity',
                value: distratoRecord.getValue('custrecord_rsc_cliente_distrato')
            });
            newVendorbill.setValue({
                fieldId: 'location',
                value: loc
            });
            newVendorbill.setValue({
                fieldId: 'custbody_enl_operationtypeid',
                value: 15
            });
            newVendorbill.setValue({
                fieldId: 'custbody_enl_order_documenttype',
                value: 1
            });
            newVendorbill.setValue({
                fieldId: 'duedate',
                value: dataVencimento
            });
            newVendorbill.setValue({
                fieldId: 'custbody_rsc_projeto_obra_gasto_compra',
                value: distratoRecord.getValue('custrecord_rsc_empreedimento_distrato')
            });
            newVendorbill.setValue({
                fieldId: 'custbody_rsc_tipo_transacao_workflow',
                value: trasnWorkflow
            });
            // newVendorbill.selectLine({
            //     line: 0,
            //     sublistId: 'expense'
            // })
            newVendorbill.setSublistValue({
                sublistId: 'expense',
                fieldId: 'account',
                value: conta,
                line: 0
            });
            newVendorbill.setSublistValue({
                sublistId: 'expense',
                fieldId: 'amount',
                value: valorParcelas,
                line: 0
            });
            var vendorID = newVendorbill.save({
                ignoreMandatoryFields: true
            });
            if (i == 0) {
                vendorbillId = vendorID;
            }
            dataVencimento.setMonth(dataVencimento.getMonth() + 1);
            idVendorbill.push(vendorID);
        }
        var unidade = distratoRecord.getValue('custrecord_rsc_unidade_distrato');
        var recordUnidade = record_1.default.load({
            id: unidade,
            type: 'customrecord_rsc_unidades_empreendimento'
        });
        recordUnidade.setValue({
            fieldId: 'custrecord_rsc_un_emp_status',
            value: 1
        });
        recordUnidade.setValue({
            fieldId: 'custrecord_rsc_un_emp_nr_contrato',
            value: ""
        });
        recordUnidade.save({
            ignoreMandatoryFields: true
        });
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_status_distrato',
            value: 5
        });
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_cnt_pagar',
            value: idVendorbill
        });
        distratoRecord.setValue({
            fieldId: 'custrecord_rsc_status_cancelamento',
            value: 'Em andamento'
        });
        distratoRecord.save({
            ignoreMandatoryFields: true
        });
        var taskReparcelamento = task_1.default.create({
            taskType: task_1.default.TaskType.MAP_REDUCE,
            scriptId: 'customscript_rsc_fila_cancelamento',
            deploymentId: 'customdeploy_rsc_fila_cancelamento',
        });
        taskReparcelamento.submit();
        redirect_1.default.toRecord({
            type: 'customrecord_rsc_escritura_distrato',
            id: distratoRecord.id
        });
    };
    exports.onRequest = onRequest;
    var buscaLocalidade = function (idCliente) {
        var RecordCustomer = record_1.default.load({
            type: 'vendor',
            id: idCliente
        });
        var qtLinhas = RecordCustomer.getLineCount({
            sublistId: 'submachine'
        });
        log_1.default.error('qtLinhas', qtLinhas);
        var sub = 0;
        for (var i = 0; i < qtLinhas; i++) {
            var principal = RecordCustomer.getSublistValue({
                sublistId: 'submachine',
                fieldId: 'isprimesub',
                line: i
            });
            log_1.default.error('principal', principal);
            if (principal) {
                sub = Number(RecordCustomer.getSublistValue({
                    sublistId: 'submachine',
                    fieldId: 'subsidiary',
                    line: i
                }));
                log_1.default.error('sub', sub);
            }
        }
        var searchLoc = search_1.default.create({
            type: 'location',
            filters: [
                ['subsidiary', 'IS', sub]
            ]
        }).run().getRange({
            start: 0,
            end: 1
        });
        log_1.default.error('searchLoc[0]', searchLoc[0]);
        return searchLoc[0].id;
    };
    var getIdnewFornecedor = function (idCliente) {
        // const clienteRecord = Record.load({
        //     type:'customer',
        //     id: idCliente
        // })
        // let AddressSubrecord = clienteRecord.getCurrentSublistSubrecord({
        //     sublistId: 'addressbook',
        //     fieldId: 'addressbookaddress'
        // });
        log_1.default.error('idCliente', idCliente);
        var url = 'https://5843489-sb1.app.netsuite.com/app/common/entity/company.nl?e=T&target=s_relation:otherrelationships&label=Other+Relationships&fromtype=custjob&id=' + idCliente + '&totype=vendor';
        https_1.default.request({
            method: https_1.default.Method.GET,
            url: url,
        });
        try {
            record_1.default.load({
                type: 'vendor',
                id: idCliente
            });
            return idCliente;
        }
        catch (e) {
            log_1.default.error('Não criou vendor', 'done');
            return 0;
        }
        // const objRecord = Record.transform({
        //     fromType: Record.Type.CUSTOMER,
        //     fromId: idCliente,
        //     toType: Record.Type.VENDOR,
        // })
        // const newFornecedor = Record.create({
        //     type:'vendor'
        // })
        // let nomeCliente;
        // if(clienteRecord.getValue('companyname')){
        //     nomeCliente = String(clienteRecord.getValue('companyname'))
        // }else if(clienteRecord.getValue('salutation')){
        //     nomeCliente = String(clienteRecord.getValue('salutation'))
        // }else if(clienteRecord.getValue('shipaddressee')){
        //     nomeCliente = String(clienteRecord.getValue('shipaddressee'));
        // }else{
        //     nomeCliente = String(clienteRecord.getValue('firstname')) + " " +String(clienteRecord.getValue('lastname'))
        // }
        // console.log('nomeCliente: ',nomeCliente )
        // const fieldsFornecedor: { [key: string]: string | Number | FieldValue } = {
        //     "companyname": nomeCliente,
        //     "email": clienteRecord.getValue('email'),
        //     "subsidiary": clienteRecord.getValue('subsidiary'),
        //     "custentity_enl_cnpjcpf": Number(clienteRecord.getValue('custentity_enl_cnpjcpf')),
        //     "defaultaddress": clienteRecord.getValue('defaultaddress')
        // }
        // console.log('CPF: ',clienteRecord.getValue('custentity_enl_cnpjcpf') )
        // Object.keys(fieldsFornecedor).forEach((key) => {
        //     newFornecedor.setValue({
        //         fieldId: key,
        //         value: fieldsFornecedor[key] || "",
        //     });
        // });
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
        // const idFornecedor = objRecord.save({
        //     ignoreMandatoryFields:true
        // })
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
    };
    // function Convert_Lead_To_Vendor() {
    //     var recid = nlapiGetRecordId();
    // 	//only act if we get a record ID
    //     if (!recid) return;
    // 	//ask the user if they really want to do this
    // 	if (!confirm("Are you sure you want to convert this lead to a vendor?"))return;
    //     // hitting this url will add the entity as a vendor
    //     var url = '/app/common/entity/company.nl?e=T&target=s_relation:otherrelationships&label=Other+Relationships&fromtype=custjob&id=' + recid + '&totype=vendor';
    //     nlapiRequestURL(url);
    //     // now try to load the vendor record to confirm we did the work
    //     var worked = false;
    //     try{
    //         nlapiLoadRecord('vendor', recid);
    //         worked = true;
    //     }catch(e){
    //         worked = false;
    //     }
    // 	//if it worked, redirect the user to the entity vendor view
    //     if (worked){
    //         var url = nlapiResolveURL('RECORD', 'lead', recid) + '&custparam_flag_lead='+CONST_CUSTSTATUS_APPROVED + '&custparam_next_entity=vendor';
    //         document.location = url;
    //         return;
    //     }
    // }
    var getAttMonetaria = function (dataVencimento, indiceID, valorPago) {
        var valor = 0;
        if (new Date("01/01/2022").getTime() > dataVencimento.getTime()) {
            dataVencimento.setDate(1);
            dataVencimento.setMonth(dataVencimento.getMonth() - 2);
            log_1.default.error('dataVencimento', dataVencimento);
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
                    log_1.default.error("entrou no if?", "sim");
                    fatorDatavencimento = indiceRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                        fieldId: 'custrecord_rsc_hif_factor_percent',
                        line: i
                    });
                    log_1.default.error('fatorDatavencimento', fatorDatavencimento);
                }
                if (String(dataAtual) == String(dataVigenciaLinha)) {
                    fatorDataAtual = indiceRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_rsc_hif_correction_unit',
                        fieldId: 'custrecord_rsc_hif_factor_percent',
                        line: i
                    });
                    log_1.default.error('fatorDataAtual', fatorDataAtual);
                }
            }
            valor = (Number(fatorDataAtual) / Number(fatorDatavencimento) - 1) * valorPago;
            valor = valor / 30 * Number(new Date("01/01/2022").getDate());
        }
        else {
            valor = 0;
        }
        // Log.debug('valorPago', valorPago)
        return valor;
    };
});
