    /**
    *@NApiVersion 2.1
    *@NScriptType Suitelet
    */

    var dat = new Date()
    var mes = dat.getMonth()
    var year = dat.getFullYear()
    const periodo = {
        jan:'JAN/'+ year,
        fev:'FEV/'+ year,
        mar:'MAR/'+ year,
        abr:'ABR/'+ year,
        mai:'MAI/'+ year,
        jun:'JUN/'+ year,
        jul:'JUL/'+ year,
        ago:'AGO/'+ year,
        set:'SET/'+ year,
        out:'OUT/'+ year,
        nov:'NOV/'+ year,
        dez:'DEZ/'+ year
    }

    define(['N/ui/serverWidget', 'N/record', 'N/log', 'N/url', 'N/search', 'N/file', 'N/ui/message', 'N/redirect', 'N/task'], 
    function(ui, record, log, url, search, file, message, redirect, task) {

    function onRequest(ctx) {
        const request = ctx.request;
        const method = request.method;
        const response = ctx.response;
        const parameters = request.parameters;
        var form = ui.createForm({
            title: "Segregação de curto e longo prazo"
        })
            var dataSegregacao = form.addField({
                label: "Data de Segregação",
                type: ui.FieldType.DATE,
                id: "custpage_data_segregacao",
            }).updateDisplayType({displayType: ui.FieldDisplayType.INLINE});

            var mesCorrente = form.addField({
                label: "Mês Corrente",
                type: ui.FieldType.TEXT,
                id: "custpage_me_correntes",
            }).updateDisplayType({displayType: ui.FieldDisplayType.INLINE})
            
            var idBusca = form.addField({
                label: "ID da Busca",
                type: ui.FieldType.TEXT,
                id: "custpage_id_busca",
            }).updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN})
            
            var processado = form.addField({
                label: "Processado com Sucesso",
                type: ui.FieldType.CHECKBOX,
                id: "custpage_process",
            }).updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN})
            
            var parcialProcess = form.addField({
                label: "Processado Parcialmente",
                type: ui.FieldType.CHECKBOX,
                id: "custpage_processa_parc",
            }).updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN})
            
            var naoProcess = form.addField({
                label: "Processado Parcialmente",
                type: ui.FieldType.CHECKBOX,
                id: "custpage_nao_process",
            }).updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN})

            var textArea = form.addField({
                label: "Texto JSON",
                type: ui.FieldType.TEXTAREA,
                id: "custpage_json_holder",
            }).updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN})

            var campo_jsonSP = form.getField({id:"custpage_json_holder"});
                campo_jsonSP.maxLength = 400000;

            var sublist = form.addSublist({
                id: 'custpage_sublist',
                label: 'Faturas',
                type: ui.SublistType.LIST
            });

            //sublist.addMarkAllButtons();

            var marcaTudo = sublist.addButton({
                id: 'custpage_marar_all_parcela',
                label: 'Marcar Tudo',
                functionName: 'selecionar'
            })
            var desmarcaTudo = sublist.addButton({
                id: 'custpage_desmarcar_all_parcela',
                label: 'Desamarcar Tudo',
                functionName: 'desmarcar'
            })

            var checkBox = sublist.addField({
                id: 'custpage_pegar_parcela',
                type: ui.FieldType.CHECKBOX,
                label: 'Selecionar'
            });

            var idFatura = sublist.addField({
                id: 'custpage_id_fatura',
                type: ui.FieldType.TEXT,
                label: 'Id fatura'
            }).updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN})
            
            var Idcriado = sublist.addField({
                id: 'custpage_id_criado',
                type: ui.FieldType.TEXT,
                label: 'Id fatura'
            }).updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN})

            
            var date = sublist.addField({
                id: 'custpage_data',
                type: ui.FieldType.DATE,
                label: 'Data'
            }).updateDisplayType({displayType: ui.FieldDisplayType.DISABLED})
            
            var numFaturaFornece = sublist.addField({
                id: 'custpage_num_fatura',
                label: 'Número da fatura',
                type: ui.FieldType.TEXT
            }).updateDisplayType({displayType: ui.FieldDisplayType.DISABLED})
            
            var numPrestacoes = sublist.addField({
                id: 'custpage_prestacoes',
                type: ui.FieldType.INTEGER,
                label: 'Número de Prestações'
            }).updateDisplayType({displayType: ui.FieldDisplayType.DISABLED})
            
            var dateVenci = sublist.addField({
                id: 'custpage_data_venci',
                type: ui.FieldType.DATE,
                label: 'Data de Vencimento'
            }).updateDisplayType({displayType: ui.FieldDisplayType.DISABLED})

            var sub = sublist.addField({
                id: 'custpage_subsidiary',
                type: ui.FieldType.SELECT,
                source: 'subsidiary',
                label: 'Subsidiária'
            }).updateDisplayType({displayType: ui.FieldDisplayType.INLINE})

            var fornece = sublist.addField({
                id: 'custpage_fornecedor',
                type: ui.FieldType.SELECT,
                source: 'vendor',
                label: 'Fornecedor'
            }).updateDisplayType({displayType: ui.FieldDisplayType.INLINE})

            var statusFatura = sublist.addField({
                id: 'custpage_status',
                type: ui.FieldType.TEXT,
                label: 'Status'
            }).updateDisplayType({displayType: ui.FieldDisplayType.DISABLED})
            
            var segregTipo = sublist.addField({
                id: 'custpage_tipo',
                type: ui.FieldType.TEXT,
                label: 'Tipo de Segregação \n(curto ou longo prazo)'
            }).updateDisplayType({displayType: ui.FieldDisplayType.DISABLED})

            var valorCurto = sublist.addField({ // ALTERADO PARA NÃO APARECER
                id: 'custpage_valor_curto',
                type: ui.FieldType.CURRENCY,
                label: 'Valor a Curto Prazo'
            }).updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN})
            
            var valorLongo = sublist.addField({ // ALTERADO PARA NÃO APARECER 
                id: 'custpage_valor_longo',
                type: ui.FieldType.CURRENCY,
                label: 'Valor a Longo Prazo'
            }).updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN})
            
            var valorCompra = sublist.addField({
                id: 'custpage_valor',
                type: ui.FieldType.CURRENCY,
                label: 'Valor Total'
            }).updateDisplayType({displayType: ui.FieldDisplayType.DISABLED})

            form.addSubmitButton({
                id: 'custpage_criar_lancamento',
                label: 'Criar Lançamento Contábil',
                functionName: 'criar'
            })

            form.clientScriptModulePath = './gaf_segreg_funcbotoes_gp_cs.js'
            ctx.response.writePage(form)

        

        if (method == 'GET'){
            var totalCurto = 0
            var totalLongo = 0

            // try{
                var resultados = []
                var data = new Date()
                var mes = data.getMonth() + 1 
                var ano = data.getFullYear()
                var dataVigencia, month
                switch(mes){
                    case 1: 
                        dataVigencia = "31/12/"+ (ano - 1).toString()
                        month = periodo.jan
                        break
                    case 2:
                        dataVigencia = "31/01/" + ano.toString()
                        month = periodo.fev
                        break
                    case 3:
                        month = periodo.mar
                        if((ano % 4 == 0 && ano % 100 != 0) || ano % 400 == 0){
                            dataVigencia = "29/02/" + ano.toString()
                            break 
                        }else{
                            dataVigencia = "28/02/" + ano.toString()
                            break}
                    case 4:
                        dataVigencia = "31/03/" + ano.toString()
                        month = periodo.abr
                        break
                    case 5:
                        dataVigencia = "30/04/" + ano.toString()
                        month = periodo.mai
                        break
                    case 6:
                        dataVigencia = "31/05/" + ano.toString()
                        month = periodo.jun
                        break
                    case 7:
                        dataVigencia = "30/06/" + ano.toString()
                        month = periodo.jul
                        break
                    case 8:
                        dataVigencia = "31/07/" + ano.toString()
                        month = periodo.ago
                        break
                    case 9:
                        dataVigencia = "31/08/" + ano.toString()
                        month = periodo.set
                        break
                    case 10:
                        dataVigencia = "30/09/" + ano.toString()
                        month = periodo.out
                        break
                    case 11:
                        dataVigencia = "31/10/" + ano.toString()
                        month = periodo.nov
                        break
                    case 12:
                        dataVigencia = "30/11/" + (ano - 1).toString()
                        month = periodo.dez
                        break
                    }
                    mesCorrente.defaultValue = month 
                    dataSegregacao.defaultValue = dataVigencia


                var busca = search.create({
                    type: "vendorbill",
                    filters:
                    [
                    ["type","anyof","VendBill"], 
                    "AND", 
                    ["account","anyof","914"], 
                    "AND",  
                    // ["trandate","within", '29/03/2022'],
                    // 'AND',
                    // ['internalid', 'IS', 225110],
                    // "AND", 
                    ["status","anyof","VendBill:A"]
                    ],
                    columns:
                    [
                        search.createColumn({name: "ordertype", label: "Tipo de pedido"}),
                        search.createColumn({name: "class", label: "Etapa do projeto"}),
                        search.createColumn({name: "custbody_rsc_projeto_obra_gasto_compra", label: "Nome do projeto"}),
                        search.createColumn({name: "department", label: "Departamento"}),
                        search.createColumn({name: "location", label: "Localidade"}),
                        search.createColumn({name: "tranid", label: "Algo aqui"}),
                        search.createColumn({
                            name: "trandate",
                            sort: search.Sort.ASC,
                            label: "Data"
                        }),
                        search.createColumn({name: "subsidiary", label: "Subsidiária"}),
                        search.createColumn({name: "custbody_rsc_projeto_obra_gasto_compra", label: "Nome do projeto"}),

                        search.createColumn({
                            name: "entity",
                            sort: search.Sort.ASC,
                            label: "Nome"
                        }),
                        search.createColumn({name: "datecreated", label: "Data de criação"}),

                        search.createColumn({
                            name: "installmentnumber",
                            join: "installment",
                            sort: search.Sort.ASC,
                            label: "Número de prestações"
                        }),
                        search.createColumn({
                            name: "duedate",
                            join: "installment",
                            label: "Data de vencimento"
                        }),
                        search.createColumn({
                            name: "status",
                            join: "installment",
                            label: "Status"
                        }),
                        search.createColumn({
                            name: "amount",
                            join: "installment",
                            label: "Valor"
                        }),
                        search.createColumn({
                            name: "custrecord_rsc_cnab_inst_interest_cu_2",
                            join: "installment",
                            label: "Valor de Juros/Encargos"
                        }),
                        search.createColumn({
                            name: "custrecord_rsc_cnab_inst_fine_cu_2",
                            join: "installment",
                            label: "Valor da Multa"
                        }),
                        search.createColumn({
                            name: "custrecord_rsc_cnab_inst_othervalue_nu_2",
                            join: "installment",
                            label: "Valor de Outras Entidades"
                        }),
                        search.createColumn({
                            name: "custrecord_rsc_cnab_inst_discount_cu_2",
                            join: "installment",
                            label: "Valor do Desconto"
                        }),
                        search.createColumn({
                            name: "amountpaid",
                            join: "installment",
                            label: "Valor pago"
                        }),
                        search.createColumn({
                            name: "custrecord_rsc_cnab_inst_paymentdate_dt_2",
                            join: "installment",
                            label: "Data do Pagamento"
                        }),
                        search.createColumn({
                            name: "amountremaining",
                            join: "installment",
                            label: "Valor restante"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "{installment.amountremaining}",
                            label: "Fórmula (moeda)"
                        })
                    ]
                }).run().each(function(result){
                    log.audit('result', result)
                    var dataSegreg = dataVigencia.split('/')
                    var dataSeg = new Date(Number(dataSegreg[2]) + 1,dataSegreg[1] - 1,dataSegreg[0])                        
                    log.audit('valor de corte', dataSeg)

                    var dataVencimento = result.getValue({name: "duedate", join: "installment"}).split('/');
                    log.audit('dataVencimento', dataVencimento);
                    var dataApuracao = new Date(dataVencimento[2], dataVencimento[1], dataVencimento[0])
                    

                    if(result.getValue({name: "status", join: "installment"}) == 'Não pago' ) {
                        var objResultados = {
                            data: result.getValue("trandate"),
                            subsidiary: result.getValue("subsidiary"),
                            vendor: result.getValue("entity"),
                            numeroParcelas: result.getValue({ name: "installmentnumber", join: "installment"}),
                            dataVenci: result.getValue({name: "duedate", join: "installment"}),
                            status: result.getValue({name: "status", join: "installment"}),
                            valor: result.getValue({name: "amount", join: "installment"}), // Valor da parcela
                            fatura: result.getValue("tranid"),
                            etapaProjeto: result.getValue('class'),
                            nomeProeto: result.getValue('custbody_rsc_projeto_obra_gasto_compra'),
                            departamento: result.getValue('department'),
                            location: result.getValue('location'),
                            checkbox: false,
                            idFatura: result.id,
                            tipoSegreg: '',
                            dataSegregacao: dataVigencia
                        }

                        if (dataApuracao < dataSeg){
                            objResultados.tipoSegreg = 'Curto Prazo'
                        }else{
                            objResultados.tipoSegreg = 'Longo Prazo'
                        }

                        resultados.push(objResultados)
                        log.audit('quantidade de fatura', resultados.length)

                        // if (resultados.length == 0) { // Primeiro indice da lista resutlados
                        //     resultados.push(objResultados);
                        // } else {
                        //     // Busca na lista pelo id da fatura do fornecedor
                        //     var localiza = resultados.find(element => element.idFatura === result.id);
                        //     if (localiza) {
                        //         if (dataApuracao < dataSeg){
                        //             localiza.curtoPrazo += Number(result.getValue({name: "amount", join: "installment"}));
                        //         }else{
                        //             localiza.longoPrazo += Number(result.getValue({name: "amount", join: "installment"}));
                        //         }
                        //         // Incrementando os valores de curto e longo prazo
                        //         localiza.curtoPrazo += totalCurto;
                        //         localiza.longoPrazo += totalLongo;
                        //     } else {
                        //         // Novo índice na lista
                        //         log.audit('Não encotrado', 'Incluir nova fatura na lista...');
                        //         resultados.push(objResultados)
                        //         log.audit('Demais índices', resultados);
                        //     }
                        // }

                        return true
                    }
                })
                // log.audit('resultados', resultados)
                
                for (var i = 0; i < resultados.length; i++){
                    sublist.setSublistValue({
                        id: "custpage_data",
                        line: i,
                        value: resultados[i].data
                    })

                    sublist.setSublistValue({
                        id: "custpage_subsidiary",
                        line: i,
                        value: resultados[i].subsidiary
                    })

                    sublist.setSublistValue({
                        id: "custpage_status",
                        line: i,
                        value: resultados[i].status
                    })

                    sublist.setSublistValue({
                        id: "custpage_fornecedor",
                        line: i,
                        value: resultados[i].vendor
                    })

                    sublist.setSublistValue({
                        id: "custpage_valor",
                        line: i,
                        value: resultados[i].valor
                    })
                    
                    sublist.setSublistValue({
                        id: "custpage_tipo",
                        line: i,
                        value: resultados[i].tipoSegreg
                    })

                    sublist.setSublistValue({
                        id: "custpage_prestacoes",
                        line: i,
                        value: resultados[i].numeroParcelas
                    })
                    
                    sublist.setSublistValue({
                        id: "custpage_data_venci",
                        line: i,
                        value: resultados[i].dataVenci
                    })

                    sublist.setSublistValue({
                        id: "custpage_id_fatura",
                        line: i,
                        value: resultados[i].idFatura
                    })

                    if(resultados[i].fatura){
                        sublist.setSublistValue({
                            id: "custpage_num_fatura",
                            line: i,
                            value: resultados[i].fatura
                        })
                    }
                }
                
                textArea.defaultValue = JSON.stringify(resultados)
            // }catch(e){
            //     log.error('error', e)
            // }
        } else {
            log.audit(method, parameters);

            var taskSegregacao = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_gaf_cria_lancamento_gp_mr',
                deploymentId: 'customdeploy_gaf_cria_lancamento_gp_mr_i',
                params: {
                    custscript_rsc_json_lancamentos_segreg: parameters.custpage_json_holder,
                }
            });

            var id_task_segregacao = taskSegregacao.submit();
            log.audit('id_task_segregacao', id_task_segregacao);
            
            var idBusca = parameters.custpage_id_busca
            log.audit('id da busca', idBusca)
            redirect.toSavedSearchResult({
                id: idBusca
            })
            
            // var json = JSON.parse(parameters.custpage_json_holder)
            // var idBusca = parameters.custpage_id_busca
            // var dataSegreg = parameters.custpage_data_segregacao.split('/')
            // var dataSeg = new Date(Number(dataSegreg[2]) + 1,dataSegreg[1],dataSegreg[0])
            // // log.audit('valor da data segregação', dataSegreg)
            // // log.audit('valor da data', dataSeg)
            // // log.audit('valor do listaJSON', json)
            //     for(var i = 0; i<json.length; i++){
            //         // try{
            //             var lancamento = record.create({
            //                 type: 'journalentry',
            //                 isDynamic: true
            //             })
            //             lancamento.setValue('custbody_gaf_vendor', json[i].vendor)
            //             lancamento.setValue('subsidiary', json[i].subsidiary)
            //             lancamento.setValue('custbodysegregacao_curt_long', true)
            //             lancamento.setValue('custbody_ref_parcela_2',json[i].idFatura)
                        
            //             if (json[i].curtoPrazo > 0 && json[i].longoPrazo > 0) {
            //                 lancamento.setValue('memo', 'Segregação de Curto Prazo')
            //                 lancamento.selectNewLine('line')
            //                 lancamento.setCurrentSublistValue('line','debit', json[i].curtoPrazo)
            //                 lancamento.setCurrentSublistValue('line','memo',"Segregação de Curto e Longo Prazo")
            //                 lancamento.setCurrentSublistValue('line','department',json[0].departamento)
            //                 lancamento.setCurrentSublistValue('line','class',json[0].etapaProjeto)
            //                 lancamento.setCurrentSublistValue('line','custcol_rsc_fieldcliente',json[0].nomeProeto)
            //                 lancamento.setCurrentSublistValue('line','entity',json[0].vendor)
            //                 lancamento.setCurrentSublistValue('line','location',json[0].location)
            //                 lancamento.setCurrentSublistValue('line',"account", 924) // (DÉBITO) Curto Prazo
            //                 lancamento.commitLine('line')

            //                 lancamento.setValue('memo', 'Segregação de Longo Prazo')
            //                 lancamento.selectNewLine('line')
            //                 lancamento.setCurrentSublistValue('line','debit', json[i].longoPrazo)
            //                 lancamento.setCurrentSublistValue('line','memo',"Segregação de Longo Prazo")
            //                 lancamento.setCurrentSublistValue('line','department',json[0].departamento)
            //                 lancamento.setCurrentSublistValue('line','class',json[0].etapaProjeto)
            //                 lancamento.setCurrentSublistValue('line','custcol_rsc_fieldcliente',json[0].nomeProeto)
            //                 lancamento.setCurrentSublistValue('line','entity',json[0].vendor)
            //                 lancamento.setCurrentSublistValue('line','location',json[0].location)
            //                 lancamento.setCurrentSublistValue('line',"account", 1331) // (DÉBITO) Longo Prazo
            //                 lancamento.commitLine('line')
            //             } else if (json[i].longoPrazo == 0){
            //                 lancamento.setValue('memo', 'Segregação de Curto Prazo')
            //                 lancamento.selectNewLine('line')
            //                 lancamento.setCurrentSublistValue('line','debit', json[i].curtoPrazo)
            //                 lancamento.setCurrentSublistValue('line','memo',"Segregação de Curto Prazo")
            //                 lancamento.setCurrentSublistValue('line','department',json[0].departamento)
            //                 lancamento.setCurrentSublistValue('line','class',json[0].etapaProjeto)
            //                 lancamento.setCurrentSublistValue('line','custcol_rsc_fieldcliente',json[0].nomeProeto)
            //                 lancamento.setCurrentSublistValue('line','entity',json[0].vendor)
            //                 lancamento.setCurrentSublistValue('line','location',json[0].location)
            //                 lancamento.setCurrentSublistValue('line',"account", 924) // (DÉBITO) Curto Prazo 
            //                 lancamento.commitLine('line')
            //             } else {
            //                 lancamento.setValue('memo', 'Segregação de Longo Prazo')
            //                 lancamento.selectNewLine('line')
            //                 lancamento.setCurrentSublistValue('line','debit', json[i].longoPrazo)
            //                 lancamento.setCurrentSublistValue('line','memo',"Segregação de Longo Prazo")
            //                 lancamento.setCurrentSublistValue('line','department',json[0].departamento)
            //                 lancamento.setCurrentSublistValue('line','class',json[0].etapaProjeto)
            //                 lancamento.setCurrentSublistValue('line','custcol_rsc_fieldcliente',json[0].nomeProeto)
            //                 lancamento.setCurrentSublistValue('line','entity',json[0].vendor)
            //                 lancamento.setCurrentSublistValue('line','location',json[0].location)
            //                 lancamento.setCurrentSublistValue('line',"account", 1331) // (DÉBITO) Longo Prazo
            //                 lancamento.commitLine('line')
            //             }
            //             lancamento.selectNewLine('line')
            //             lancamento.setCurrentSublistValue('line','credit', json[i].valor)
            //             lancamento.setCurrentSublistValue('line','memo',"Segregação de Fornecedores")
            //             lancamento.setCurrentSublistValue('line','department',json[0].departamento)
            //             lancamento.setCurrentSublistValue('line','class',json[0].etapaProjeto)
            //             lancamento.setCurrentSublistValue('line','custcol_rsc_fieldcliente',json[0].nomeProeto)
            //             lancamento.setCurrentSublistValue('line','entity',json[0].vendor)
            //             lancamento.setCurrentSublistValue('line','location',json[0].location)
            //             lancamento.setCurrentSublistValue('line','account', 914) // (CRÉDITO) Segregação de Fornecedores
            //             lancamento.commitLine('line')
            //             var saved = lancamento.save()    
            //             //process++
            //             var fat = record.load({
            //                 type: 'vendorbill',
            //                 id: json[i].idFatura,
            //                 isDynamic: true,
            //             })
            //             fat.setValue('custbody_lanc_cont', saved)
            //             fat.save()
            //             log.audit('ids criados', saved)
            //         // }catch(e){
            //         //     log.error('Error', e)
            //         //     //noProcess++
            //         // }
            //         redirect.toSavedSearchResult({
            //             id: idBusca
            //         })
            //     }
                // if(noProcess == 0){
                //     processado.defaultValue = "T"
                //     redirect.toSavedSearchResult({
                //         id: 1852
                //     })
                // }else if (noProcess > 0 && process > 0){
                //     parcialProcess.defaultValue = "T"
                //     redirect.toSavedSearchResult({
                //         id: 1852
                //     })
                // }else{
                //     naoProcess.defaultValue = "T"
                //     redirect.toSavedSearchResult({
                //         id: 1852
                //     })
                // }
            }
    }

    return {
        onRequest: onRequest
    }
    });
