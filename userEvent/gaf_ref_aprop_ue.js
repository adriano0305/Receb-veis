/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/format', 'N/log', 'N/query', 'N/record', 'N/search'],
    /**
 * @param{format} format
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{search} search
 */
    (format, log, query, record, search) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            if (scriptContext.type == scriptContext.UserEventType.VIEW || scriptContext.type == scriptContext.UserEventType.EDIT ){
                var form = scriptContext.form;
                form.addButton({
                    id:'custpage_gerar_csv',
                    label: 'Gerar CSV',
                    functionName: 'gerarRef'
                })
                form.clientScriptModulePath = './gaf_relatorios_aprop_cl.js';  
            } 
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        function getAccounts(){
            var contas = [];
            contas.push(1142510100)
            contas.push(1142530100)
            contas.push(1142570100)
            contas.push(1144010100)
            contas.push(2811010100)
            contas.push(2811010200)
            contas.push(2811050100)
            contas.push(2812010100)
            contas.push(2812010300)
            contas.push(2812010400)
            contas.push(2812010500)
            contas.push(2812020100)
            contas.push(2812030100)
            contas.push(2812060100)
            contas.push(2813040300)
            contas.push(2813050100)
            contas.push(2813060300)
            contas.push(2811020100)
            contas.push(2811030100)
            contas.push(2811030200)
            contas.push(2811040100)
            contas.push(2812040100)
            contas.push(2812050100)

            return contas
        }
        function getPoc(conta1poc,conta2poc, conta3poc,conta4poc, job) {
            var somaContas = conta1poc + conta2poc + conta3poc + conta4poc;
            var jobLookup = search.lookupFields({
                type:'job',
                id: job,
                columns:[
                    'custentity_rsc_aprop_custo_a_incorrer'
                ]
            })
            var custoIncorrer = Number(jobLookup.custentity_rsc_aprop_custo_a_incorrer)
            var total = somaContas + custoIncorrer
            return ((somaContas/total)*100).toFixed(2);
        }
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type == scriptContext.UserEventType.CREATE) {
                // var sqlPocAccounts = 'select acctnumber, id from account where acctnumber in (\'1142510100\', \'1142530100\', \'1142570100\', \'1144010100\')';
                // log.debug('sqlPocAccounts', sqlPocAccounts)
                // var resultsPocAccounts = query.runSuiteQL({ query: sqlPocAccounts }).asMappedResults();
                var contas = "";
                var arrayContas = getAccounts();
                log.debug('arrayContas',arrayContas)

                if (arrayContas.length > 0) {
                    for(var i= 0; i< arrayContas.length;i++){
                        if (i + 1 == arrayContas.length) {
                            contas += '\''+ arrayContas[i] + '\''
                        } else {
                            contas += '\''+ arrayContas[i] + '\'' + ', '
                        }
                    }
                }
                log.debug('contas',contas);
                var periodo = scriptContext.newRecord.getValue('custrecord_rsc_periodo_data');
                var projetos = scriptContext.newRecord.getValue('custrecord_rsc_projetos_ref');
                log.debug('periodo', periodo);
                log.debug('projetos', projetos);
                if (periodo) {
                    // var data = new Date(periodo) 
                    // var data = data.setDate(1);
                    var data = format.format({ value: periodo, type: format.Type.DATE });
                    log.debug('data', data)
                    var dataSplited = data.split('/')
                    log.debug('dataSplited', dataSplited)
                    data = '01' + '/' + dataSplited[1] + '/' + dataSplited[2]
                    log.debug('data', data)
                    var idperiodo = 0;
                    var periodos = "";
                    var filters = []
                    filters.push( search.createFilter({name: 'startdate', operator: search.Operator.WITHIN, values: [data, data]}) );
                    filters.push( search.createFilter({name: 'isquarter', operator: search.Operator.IS, values: false}) );
                    filters.push( search.createFilter({name: 'isyear', operator: search.Operator.IS, values: false}))
                    var periodoSearch = search.create({
                        type: 'accountingperiod',
                        filters: filters,
                        columns: [
                            'startdate'
                        ]
                    }).run().getRange({
                        start:0,
                        end: 1
                    })
                    // for (var i = 0; i < idperiodo.length; i++) {
                    //     if (i + 1 == idperiodo.length) {
                    //         periodos += idperiodo[i]
                    //     } else {
                    //         periodos += idperiodo[i] + ", "
                    //     }
                    // }
                }
                var matrix = {};
                // var array = [];
                var sql = "";
                if (periodo && projetos.length == 0) {
                    sql = 'select b.subsidiary,  sum(a.amount), e.acctnumber, c.custbody_rsc_projeto_obra_gasto_compra \n' +
                        'from  transactionaccountingline a join transactionline b on a.transaction = b.transaction join transaction c on a.transaction = c.id  join subsidiary d on b.subsidiary = d.id join account e on a.account = e.id \n' +
                        'where c.postingperiod <= ' + periodoSearch[0].id + ' and d.isinactive = \'F\' and e.acctnumber in (' + contas + ') and b.id = 0 and c.recordtype in (\'journalentry\', \'vendorbill\') group by b.subsidiary, e.acctnumber,  c.custbody_rsc_projeto_obra_gasto_compra \n'
                } else if (projetos.length > 0 && !periodo) {
                    var string = ""
                    for (var i = 0; i < projetos.length; i++) {
                        if (i + 1 == projetos.length) {
                            string += projetos[i]
                        } else {
                            string += projetos[i] + ", "
                        }
                    }
                    sql = 'select b.subsidiary,  sum(a.amount), e.acctnumber, c.custbody_rsc_projeto_obra_gasto_compra \n' +
                        'from  transactionaccountingline a join transactionline b on a.transaction = b.transaction join transaction c on a.transaction = c.id  join subsidiary d on b.subsidiary = d.id join account e on a.account = e.id \n' +
                        'where d.isinactive = \'F\' and c.custbody_rsc_projeto_obra_gasto_compra in (' + string + ') and e.acctnumber in (' + contas + ') and b.id = 0 and c.recordtype in (\'journalentry\', \'vendorbill\') group by b.subsidiary, e.acctnumber,  c.custbody_rsc_projeto_obra_gasto_compra \n'
                } else if (projetos.length > 0 && periodo) {
                    var string = ""
                    for (var i = 0; i < projetos.length; i++) {
                        if (i + 1 == projetos.length) {
                            string += projetos[i]
                        } else {
                            string += projetos[i] + ", "
                        }
                    }
                    sql = 'select b.subsidiary,  sum(a.amount), e.acctnumber, c.custbody_rsc_projeto_obra_gasto_compra \n' +
                        'from  transactionaccountingline a join transactionline b on a.transaction = b.transaction join transaction c on a.transaction = c.id  join subsidiary d on b.subsidiary = d.id join account e on a.account = e.id \n' +
                        'where d.isinactive = \'F\' and c.postingperiod <= ' + periodoSearch[0].id + ' and c.custbody_rsc_projeto_obra_gasto_compra in (' + string + ') and e.acctnumber in (' + contas + ') and b.id = 0 and c.recordtype in (\'journalentry\', \'vendorbill\') group by b.subsidiary, e.acctnumber,  c.custbody_rsc_projeto_obra_gasto_compra \n'
                } else {
                    sql = 'select b.subsidiary,  sum(a.amount), e.acctnumber, c.custbody_rsc_projeto_obra_gasto_compra \n' +
                        'from  transactionaccountingline a join transactionline b on a.transaction = b.transaction join transaction c on a.transaction = c.id  join subsidiary d on b.subsidiary = d.id join account e on a.account = e.id \n' +
                        'where d.isinactive = \'F\' and e.acctnumber in (' + contas + ') and b.id = 0 and c.recordtype in (\'journalentry\', \'vendorbill\') group by b.subsidiary, e.acctnumber,  c.custbody_rsc_projeto_obra_gasto_compra \n'
                }
                log.debug('sql', sql)
                var results = query.runSuiteQL({ query: sql }).asMappedResults();
                if (results.length > 0) {
                    log.debug('results', results)
                    // results.forEach()
                    results.forEach(function (result) {
                        if (!(result.subsidiary in matrix)) {
                            matrix[result.subsidiary] = {};
                        } else {
                            if (result.custbody_rsc_projeto_obra_gasto_compra) {
                                if (!(result.custbody_rsc_projeto_obra_gasto_compra in matrix[result.subsidiary])) {
                                    matrix[result.subsidiary][result.custbody_rsc_projeto_obra_gasto_compra] = [];
                                }
                                matrix[result.subsidiary][result.custbody_rsc_projeto_obra_gasto_compra].push({
                                    amount: result.expr1,
                                    account: result.acctnumber
                                })
                            }
                        }
                    })
                    Object.keys(matrix).forEach(function (sub) {
                        Object.keys(matrix[sub]).forEach(function (job) {
                            var linhaRecord = record.create({
                                type: 'customrecord_rsc_detalhes_ref_aprop'
                            })
                            // linhaRecord.selectLine({
                            //     sublistId:'custpage_baixa_estoque',
                            //     line: cont
                            // })
                            linhaRecord.setValue({
                                fieldId: 'custrecord_rsc_empresa_ref',
                                value: sub
                            })
                            linhaRecord.setValue({
                                fieldId: 'custrecord_rsc_divisao_ref',
                                value: job
                            })
                            var conta1poc = 0;
                            var conta2poc = 0;
                            var conta3poc = 0;
                            var conta4poc = 0;
                            var conta3a = 0;
                            var conta3b = 0;
                            var conta3c = 0;
                            var conta5a = 0;
                            var conta5b = 0;
                            var conta5c = 0;
                            var conta5d = 0;
                            var conta5e = 0;
                            var conta5f = 0;
                            var conta5g = 0;
                            var conta7a = 0;
                            var conta7b = 0;
                            var conta9a = 0;
                            var conta9b = 0
                            if (matrix[sub][job].length > 0) {
                                matrix[sub][job].forEach(function (account) {
                                    switch(account.account){
                                        case '1142510100':
                                            conta1poc = Number(account.amount)
                                        break;
                                        case '1142530100':
                                            conta2poc = Number(account.amount)
                                        break;
                                        case '1142570100':
                                            conta3poc = Number(account.amount)
                                        break;
                                        case '1144010100':
                                            conta4poc = Number(account.amount)
                                        break;
                                        case '2811010100': 
                                            conta3a = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta3a',
                                                value: conta3a
                                            })
                                        break;
                                        case '2811010200':
                                            conta3b = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta3b',
                                                value: conta3b
                                            })
                                        break;
                                        case '2811050100':
                                            conta3c = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta3c',
                                                value: conta3c
                                            })
                                        break;
                                        case '2812010100':
                                            conta5a = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta5a',
                                                value: conta5a
                                            })
                                        break;
                                        case '2812010300':
                                            conta5b = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta5b',
                                                value: conta5b
                                            })
                                        break;
                                        case '2812010400':
                                            conta5c = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta5c',
                                                value: conta5c
                                            })
                                        break;
                                        case '2812010500':
                                            conta5d = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta5d',
                                                value: conta5d
                                            })
                                        break;
                                        case '2812020100':
                                            conta5e = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta5e',
                                                value: conta5e
                                            })
                                        break;
                                        case '2812030100':
                                            conta5f = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta5f',
                                                value: conta5f
                                            })
                                        break;
                                        case '2812060100':
                                            conta5g = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta5g',
                                                value: conta5g
                                            })
                                        break;
                                        case '2813030100':
                                            conta7a = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta7a',
                                                value: conta7a
                                            })
                                        break;
                                        case '2813040300':
                                            conta7b = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta7b',
                                                value: conta7b
                                            })
                                        break;
                                        case '2813050100':
                                            conta9a = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta9a',
                                                value: conta9a
                                            })
                                        break;
                                        case '2813060300':
                                            conta9b = Number(account.amount)
                                            linhaRecord.setValue({
                                                fieldId:'custrecord_rsc_conta9b',
                                                value: conta9b
                                            })
                                        break;
                                    }
                                })
                                var poc = getPoc(conta1poc,conta2poc, conta3poc,conta4poc, job)
                                log.debug('POC',poc)
                                linhaRecord.setValue({
                                    fieldId: 'custrecord_rsc_poc_ref',
                                    value: poc
                                })
                                var apropReceitaSocietaria =  conta3c - ((conta3a + conta3b) * poc)
                                linhaRecord.setValue({
                                    fieldId: 'custrecord_rsc_aprop_receita_societaria',
                                    value: apropReceitaSocietaria
                                })
                                var apropRefCusto = conta5g - ((conta5a + conta5b + conta5c + conta5d + conta5e + conta5f) * poc);
                                linhaRecord.setValue({
                                    fieldId: 'custrecord_rsc_aprop_ref_custo',
                                    value: apropRefCusto
                                })
                                var custoIncorporacao = conta7b - (conta7b * poc)
                                linhaRecord.setValue({
                                    fieldId: 'custrecord_rsc_custo_incorporacao',
                                    value: custoIncorporacao
                                })
                                var corretagemRef = conta9b - (conta9a * poc)
                                linhaRecord.setValue({
                                    fieldId: 'custrecord_rsc_corretagem_ref',
                                    value: corretagemRef
                                })
                                linhaRecord.setValue({
                                    fieldId: 'custrecord_rsc_ref_aprop',
                                    value: scriptContext.newRecord.id
                                })
                                linhaRecord.save({
                                    ignoreMandatoryFields: true
                                })
                            }
                        })
                    })
                }
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
