/**
*@NApiVersion 2.1
*@NScriptType Suitelet
*/

var dat = new Date();
var mes = dat.getMonth();
var year = dat.getFullYear();

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

define(['N/ui/serverWidget', 'N/record', 'N/log', 'N/url', 'N/search', 'N/file', 'N/ui/message', 'N/redirect', 'N/task'], function(ui, record, log, url, search, file, message, redirect, task) {
function onRequest(ctx) {
    const request = ctx.request;
    const method = request.method;
    const response = ctx.response;
    const parameters = request.parameters;

    var form = ui.createForm({title: "Segregação de curto e longo prazo"});

    var dataSegregacao = form.addField({label: "Data de Segregação", type: ui.FieldType.DATE, id: "custpage_data_segregacao"});
    dataSegregacao.updateDisplayType({displayType: ui.FieldDisplayType.INLINE});

    var mesCorrente = form.addField({label: "Mês Corrente", type: ui.FieldType.TEXT, id: "custpage_me_correntes"});
    mesCorrente.updateDisplayType({displayType: ui.FieldDisplayType.INLINE});
    
    var idBusca = form.addField({label: "ID da Busca", type: ui.FieldType.TEXT, id: "custpage_id_busca"});
    idBusca.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
    
    var processado = form.addField({label: "Processado com Sucesso", type: ui.FieldType.CHECKBOX, id: "custpage_process"});
    processado.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
    
    var parcialProcess = form.addField({label: "Processado Parcialmente", type: ui.FieldType.CHECKBOX, id: "custpage_processa_parc"});
    parcialProcess.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
    
    var naoProcess = form.addField({label: "Processado Parcialmente", type: ui.FieldType.CHECKBOX, id: "custpage_nao_process"});
    naoProcess.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});

    var textArea = form.addField({label: "Texto JSON", type: ui.FieldType.TEXTAREA, id: "custpage_json_holder"});
    textArea.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});

    var campo_jsonSP = form.getField({id:"custpage_json_holder"});
    campo_jsonSP.maxLength = 400000;

    var sublist = form.addSublist({id: 'custpage_sublist', label: 'Faturas', type: ui.SublistType.LIST});
    //sublist.addMarkAllButtons();
    var marcaTudo = sublist.addButton({id: 'custpage_marar_all_parcela', label: 'Marcar Tudo', functionName: 'selecionar'});
    var desmarcaTudo = sublist.addButton({id: 'custpage_desmarcar_all_parcela', label: 'Desamarcar Tudo', functionName: 'desmarcar'});

    var checkBox = sublist.addField({id: 'custpage_pegar_parcela', type: ui.FieldType.CHECKBOX, label: 'Selecionar'});

    var idFatura = sublist.addField({id: 'custpage_id_fatura', type: ui.FieldType.TEXT, label: 'Id fatura'});
    idFatura.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
    
    var Idcriado = sublist.addField({id: 'custpage_id_criado', type: ui.FieldType.TEXT, label: 'Id fatura'});
    Idcriado.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});

    var date = sublist.addField({id: 'custpage_data', type: ui.FieldType.DATE, label: 'Data'});
    date.updateDisplayType({displayType: ui.FieldDisplayType.DISABLED});
    
    var numFaturaFornece = sublist.addField({id: 'custpage_num_fatura', label: 'Número da fatura', type: ui.FieldType.TEXT});
    numFaturaFornece.updateDisplayType({displayType: ui.FieldDisplayType.DISABLED});
    
    var numPrestacoes = sublist.addField({id: 'custpage_prestacoes', type: ui.FieldType.INTEGER, label: 'Número de Prestações'});
    numPrestacoes.updateDisplayType({displayType: ui.FieldDisplayType.DISABLED});
    
    var dateVenci = sublist.addField({id: 'custpage_data_venci',
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

    var statusFatura = sublist.addField({id: 'custpage_status', type: ui.FieldType.TEXT, label: 'Status'});
    statusFatura.updateDisplayType({displayType: ui.FieldDisplayType.DISABLED});
    
    var segregTipo = sublist.addField({id: 'custpage_tipo', type: ui.FieldType.TEXT, label: 'Tipo de Segregação'})
    segregTipo.updateDisplayType({displayType: ui.FieldDisplayType.DISABLED});
    
    // ALTERADO PARA NÃO APARECER
    var valorCurto = sublist.addField({id: 'custpage_valor_curto', type: ui.FieldType.CURRENCY, label: 'Valor a Curto Prazo'});
    valorCurto.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
    
    // ALTERADO PARA NÃO APARECER 
    var valorLongo = sublist.addField({id: 'custpage_valor_longo', type: ui.FieldType.CURRENCY, label: 'Valor a Longo Prazo'});
    valorLongo.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
    
    var valorCompra = sublist.addField({id: 'custpage_valor', type: ui.FieldType.CURRENCY, label: 'Valor Total'});
    valorCompra.updateDisplayType({displayType: ui.FieldDisplayType.DISABLED});

    form.addSubmitButton({id: 'custpage_criar_lancamento', label: 'Criar Lançamento Contábil', functionName: 'criar'});
    form.clientScriptModulePath = './gaf_segreg_funcbotoes_gp_cs.js';

    ctx.response.writePage(form);   

    if (method == 'GET') {
        var totalCurto = 0;
        var totalLongo = 0;

        // try {
            var resultados = [];
            var data = new Date();
            var mes = data.getMonth() + 1;
            var ano = data.getFullYear();
            var anoPosterior = ano + 1;

            var dataVigencia, pos365, month, inicioSegregacao;

            switch(mes) {
                case 1: 
                    inicioSegregacao = "01/12/"+ (ano).toString();
                    dataVigencia = "31/12/"+ ano.toString();
                    pos365 = "01/01/" + anoPosterior.toString();
                    month = periodo.jan;
                break;

                case 2:
                    inicioSegregacao = "01/01/"+ (ano).toString();
                    dataVigencia = "31/01/" + ano.toString();
                    pos365 = "01/02/" + anoPosterior.toString();
                    month = periodo.fev;
                break;

                case 3:
                    inicioSegregacao = "01/02/"+ (ano).toString();
                    month = periodo.mar;

                    if ((ano % 4 == 0 && ano % 100 != 0) || ano % 400 == 0) {
                        dataVigencia = "29/02/" + ano.toString();                        
                    } else {
                        dataVigencia = "28/02/" + ano.toString();
                    }
                    pos365 = "01/03/" + anoPosterior.toString();
                break;

                case 4:
                    inicioSegregacao = "01/03/"+ (ano).toString();
                    dataVigencia = "31/03/" + ano.toString();
                    pos365 = "01/04/" + anoPosterior.toString();
                    month = periodo.abr;
                break;

                case 5:
                    inicioSegregacao = "01/04/"+ (ano).toString();
                    dataVigencia = "30/04/" + ano.toString();
                    pos365 = "01/05/" + anoPosterior.toString();
                    month = periodo.mai;
                break;

                case 6:
                    inicioSegregacao = "01/05/"+ (ano).toString();
                    dataVigencia = "31/05/" + ano.toString();
                    pos365 = "01/06/" + anoPosterior.toString();
                    month = periodo.jun;
                break;

                case 7:
                    inicioSegregacao = "01/06/"+ (ano).toString();
                    dataVigencia = "30/06/" + ano.toString();
                    pos365 = "01/07/" + anoPosterior.toString();
                    month = periodo.jul;
                break;

                case 8:
                    inicioSegregacao = "01/07/"+ (ano).toString();
                    dataVigencia = "31/07/" + ano.toString();
                    pos365 = "01/08/" + anoPosterior.toString();
                    month = periodo.ago;
                break;

                case 9:
                    inicioSegregacao = "01/08/"+ (ano).toString();
                    dataVigencia = "31/08/" + ano.toString();
                    pos365 = "01/09/" + anoPosterior.toString();
                    month = periodo.set;
                break;

                case 10:
                    inicioSegregacao = "01/09/"+ (ano).toString();
                    dataVigencia = "30/09/" + ano.toString();
                    pos365 = "01/10/" + ano.toString();
                    month = periodo.out;
                break;

                case 11:
                    inicioSegregacao = "01/10/"+ (ano).toString();
                    dataVigencia = "31/10/" + ano.toString();
                    pos365 = "01/11/" + anoPosterior.toString();
                    month = periodo.nov;
                break;

                case 12:
                    inicioSegregacao = "01/11/"+ (ano).toString();
                    dataVigencia = "30/11/" + ano.toString();
                    pos365 = "01/12/" + anoPosterior.toString();
                    month = periodo.dez;
                break;
            }

            mesCorrente.defaultValue = month;
            dataSegregacao.defaultValue = dataVigencia;
            
            log.audit('Segregação/Vigência', {inicioSegregacao: inicioSegregacao, dataVigencia: dataVigencia, pos365: pos365});

            var busca = search.create({type: "vendorbill",
                filters: [
                    ["type","anyof","VendBill"], "AND", 
                    ["status","anyof","VendBill:A"], 'AND', 
                    ["trandate","onorbefore",dataVigencia], 'AND',   
                    ["account","anyof","28406"], "AND", // 2231010100 FORNECEDORES. (SANDBOX QA)                        
                    ["installment.duedate","onorafter",pos365]
                    // ["account","anyof","914"], // 2231010100 Fornecedores*_old (SANDBOX 1)                                   
                    // ["trandate","within", '29/03/2022'], 'AND',
                    // ['internalid', 'IS', 225110], "AND",
                    // ["trandate","within",inicioSegregacao,dataVigencia], "AND",           
                ],
                columns: [
                    "datecreated","ordertype","class","custbody_rsc_projeto_obra_gasto_compra","department","location","tranid","subsidiary","custbody_rsc_projeto_obra_gasto_compra",
                    search.createColumn({name: "trandate", sort: search.Sort.ASC, label: "Data"}),
                    search.createColumn({name: "entity", sort: search.Sort.ASC, label: "Nome"}),
                    search.createColumn({name: "installmentnumber", join: "installment", sort: search.Sort.ASC, label: "Número de prestações"}),
                    search.createColumn({name: "duedate", join: "installment", label: "Data de vencimento"}),
                    search.createColumn({name: "status", join: "installment", label: "Status"}),
                    search.createColumn({name: "amount", join: "installment", label: "Valor"}),
                    search.createColumn({name: "custrecord_rsc_cnab_inst_interest_cu_2", join: "installment", label: "Valor de Juros/Encargos"}),
                    search.createColumn({name: "custrecord_rsc_cnab_inst_fine_cu_2", join: "installment", label: "Valor da Multa"}),
                    search.createColumn({name: "custrecord_rsc_cnab_inst_othervalue_nu_2", join: "installment", label: "Valor de Outras Entidades"}),
                    search.createColumn({name: "custrecord_rsc_cnab_inst_discount_cu_2", join: "installment", label: "Valor do Desconto"}),
                    search.createColumn({name: "amountpaid", join: "installment", label: "Valor pago"}),
                    search.createColumn({name: "custrecord_rsc_cnab_inst_paymentdate_dt_2", join: "installment", label: "Data do Pagamento"}),
                    search.createColumn({name: "amountremaining", join: "installment", label: "Valor restante"}),
                    search.createColumn({name: "formulacurrency", formula: "{installment.amountremaining}", label: "Fórmula (moeda)"})
                ]
            });
            log.audit('busca', busca);

            var dadosBusca = busca.runPaged({pageSize: 50});
            var resultadosBusca = busca.runPaged({pageSize: 50}).count;
            log.audit('dadosBusca', dadosBusca);
            log.audit('resultadosBusca', resultadosBusca);       
            
            busca.run().each(function(result) {
                var statusInstallment = result.getValue({name: "status", join: "installment"});      

                var dataSegreg = dataVigencia.split('/');
                var dataSeg = new Date(Number(dataSegreg[2]), dataSegreg[1] - 1, dataSegreg[0]);
                var dataVencimento = result.getValue({name: "duedate", join: "installment"}).split('/');
                var dataApuracao = new Date(dataVencimento[2], dataVencimento[1], dataVencimento[0]);
                var tranid = result.getValue("tranid");
                log.audit('datas', {id: result.id, tranid: tranid, statusInstallment: statusInstallment, dataApuracao: dataApuracao, dataVencimento: dataVencimento, dataSeg: dataSeg, dataSegreg: dataSegreg}); 

                const diferencaDatasDia = (data1, data2) => {
                    const dia = 24 * 60 * 60 * 1000;
                    var data1Mls = data1.getTime();
                    var data2Mls = data2.getTime();
                    return Math.abs(parseInt((data1Mls - data2Mls) / dia));
                }

                var difDataSeg_DataVencInst = diferencaDatasDia(dataSeg, dataApuracao);

                /**SOMENTE FATURAS DE FORNECEDORES:
                 * Status das parcelas: 'Não pago',
                 * Tipo de Segregação: 'Longo Prazo' (diferença entre a data de segregação e o vencimento da parcela deve ser superior a 365 dias).
                 */
                if (statusInstallment == 'Não pago' && difDataSeg_DataVencInst > 365) {
                    log.audit('result', result);                 

                    var objResultados = {
                        tipoSegreg: 'Longo Prazo',
                        data: result.getValue("trandate"),
                        subsidiary: result.getValue("subsidiary"),
                        vendor: result.getValue("entity"),
                        numeroParcelas: result.getValue({ name: "installmentnumber", join: "installment"}),
                        dataVenci: result.getValue({name: "duedate", join: "installment"}),
                        status: statusInstallment,
                        valor: result.getValue({name: "amount", join: "installment"}), // Valor da parcela
                        fatura: result.getValue("tranid"),
                        etapaProjeto: result.getValue('class'),
                        nomeProeto: result.getValue('custbody_rsc_projeto_obra_gasto_compra'),
                        departamento: result.getValue('department'),
                        location: result.getValue('location'),
                        checkbox: false,
                        idFatura: result.id,
                        dataSegregacao: dataVigencia
                    }
                    
                    // if (resultados.length == 0) {
                    resultados.push(objResultados);
                    log.audit({resultados: resultados.length}, resultados);
                    // }
                }
                
                return true;
            })
            log.audit('resultados', resultados);
            
            for (i=0; i < resultados.length; i++){
                sublist.setSublistValue({id: "custpage_data", line: i, value: resultados[i].data});
                sublist.setSublistValue({id: "custpage_subsidiary", line: i, value: resultados[i].subsidiary});
                sublist.setSublistValue({id: "custpage_status", line: i, value: resultados[i].status});
                sublist.setSublistValue({id: "custpage_fornecedor", line: i, value: resultados[i].vendor});
                sublist.setSublistValue({id: "custpage_valor", line: i, value: resultados[i].valor});                
                sublist.setSublistValue({id: "custpage_tipo", line: i, value: resultados[i].tipoSegreg});
                sublist.setSublistValue({id: "custpage_prestacoes", line: i, value: resultados[i].numeroParcelas});                
                sublist.setSublistValue({id: "custpage_data_venci", line: i, value: resultados[i].dataVenci});
                sublist.setSublistValue({id: "custpage_id_fatura", line: i, value: resultados[i].idFatura});
                
                if (resultados[i].fatura) {
                    sublist.setSublistValue({id: "custpage_num_fatura", line: i, value: resultados[i].fatura});
                }
            }
            
            textArea.defaultValue = JSON.stringify(resultados);
        // } catch(e) {
        //     log.error('error', e);
        // }
    } else {
        log.audit(method, parameters);

        // log.audit('custpage_json_holder', parameters.custpage_json_holder);

        var taskSegregacao = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: 'customscript_gaf_cria_lancamento_gp_mr',
            params: {
                custscript_rsc_json_lancamentos_segreg: parameters.custpage_json_holder,
            }
        });

        var id_task_segregacao = taskSegregacao.submit();
        log.audit('id_task_segregacao', id_task_segregacao);
        
        var idBusca = parameters.custpage_id_busca;
        log.audit('idBusca', idBusca);
        redirect.toSavedSearchResult({id: idBusca});
    }
}

return {
    onRequest: onRequest
}
});
