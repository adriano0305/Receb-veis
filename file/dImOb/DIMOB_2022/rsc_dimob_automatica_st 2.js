/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Vitor Santos
 */
define(["N/record", "N/search", "N/ui/serverWidget", "N/task", 'N/config', 'N/runtime', 'N/file' ],
    function (record, search, serverWidget, task, config, runtime, file) {

        function onRequest(context) {

            if (context.request.method === 'GET') {
                const form = serverWidget.createForm({
                    title: 'Geração DIMOB - Automatica'
                })
                const ano_geracao = form.addField({
                    id: 'custpage_ano_geracao',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Ano Geração',
                })
                const button = form.addSubmitButton({label: 'Processar DIMOB',})
                context.response.writePage(form);

            } else {
                var request = context.request;


                /* Recuperar Lista com todas as subsidiarias que serão processadas. */
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters:
                        [
                            ["custrecord_rsc_dimob_gerar_automatico", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            })
                        ]
                });
                var resultados = _getAllResults(subsidiarySearchObj);
                var listOfSubsidiary = [];
                resultados.forEach(function (result) { listOfSubsidiary.push(result.id)});
                log.debug({title: "Lista de subsidiarias", details: listOfSubsidiary});
                /* Montar consulta
                /* Recuperar todas as subsidiarias com campo dimob. */
                var locationSearchObj = search.create({
                    type: "location",
                    filters:
                        [
                            ["subsidiary","anyof",listOfSubsidiary]
                        ],
                    columns:
                        [
                            search.createColumn({name: "custrecord_avlr_tco_estab_legalname", label: "Razão Social"}),
                            search.createColumn({name: "custrecord_enl_locationcnpj", label: "CNPJ"}),
                            search.createColumn({name: "custrecord_avlr_tco_estab_code", label: "Código do Contribuinte"}),
                            search.createColumn({name: "custrecord_enl_locationienum", label: "Inscrição Estadual"}),
                            search.createColumn({name: "custrecord_enl_locationccmnum", label: "Inscrição Municipal"}),
                            search.createColumn({name: "custrecordrsc_cpf_representantelegal", label: "CPF do Representante"}),
                            search.createColumn({name: "address1", label: "Endereço"}),
                            search.createColumn({name: "address2", label: "Complemento"}),
                            search.createColumn({name: "city", label: "City"}),
                            search.createColumn({name: "state", label: "State/Province"}),
                            search.createColumn({name: "country", label: "Country"})
                        ]
                });
                var resultados = _getAllResults(locationSearchObj);
                log.audit({title: "locations", details: resultados.length});
                resultados.forEach(function (result) {
                    // Create a contact record
                    let objRecord = record.create({
                        type: 'customrecord_rsc_dimob_r01',
                        isDynamic: true
                    });
                    objRecord.setValue({
                        fieldId: 'name',
                        value: result.getValue('custrecord_enl_locationcnpj') + request.parameters.custpage_ano_geracao
                    });

                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_cnpj_do_declarante',
                        value: result.getValue('custrecord_enl_locationcnpj')
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_ano_calendario',
                        value: request.parameters.custpage_ano_geracao
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_declaracao_retificadora',
                        value: '2'
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_numero_do_recibo',
                        value: '0'
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_situacao_especial',
                        value: '2'
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_codigo_da_situacao',
                        value: '1'
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_nome_empresarial',
                        value: result.getValue('custrecord_avlr_tco_estab_legalname')
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_cpf_do_responsavel_rfb',
                        value: result.getValue('custrecordrsc_cpf_representantelegal')
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_endereco_contribuinte',
                        value: result.getValue('address1')
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_uf_do_contribuinte',
                        value: result.getValue('state')
                    });

                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_codigo_do_municipio',
                        value: result.getValue('custrecord_enl_locationcnpj')
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_rsc_status_dimob',
                        value: '1'
                    });


                    objRecord.save({ignoreMandatoryFields: true});
                    log.debug({title: "Inserido", details: result.id})
                });


                var scriptTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_rsc_dimob_mr',
                    deploymentId: 'customdeploy_rsc_dimob_mr'
                });


                scriptTask.submit();

                var form = serverWidget.createForm({
                    title: 'Processo de geração de Arquivo iniciado'
                });

                var message = form.addField({
                    id: 'custpage_message',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Mensagem'
                });

                message.defaultValue = "O Script está preparando os arquivos. Assim que finalizar, você receberá um email.";

                message.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                context.response.writePage(form);
            }
        }


        function _getAllResults(s) {
            var results = s.run();
            var searchResults = [];
            var searchid = 0;
            do {
                var resultslice = results.getRange({ start: searchid, end: searchid + 1000 });
                resultslice.forEach(function(slice) {
                    searchResults.push(slice);
                    searchid++;
                });
            } while (resultslice.length >= 1000);
            return searchResults;
        }

        return {
            onRequest: onRequest
        }
    });
