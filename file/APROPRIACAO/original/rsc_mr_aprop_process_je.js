

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/query', 'N/runtime', './rsc_module_aprop_querys', '../Junix/rsc_finan_createproposta.js', 'N/task','N/url', 'N/email', 'N/search'],
    
    (record, query, runtime , apropQuery,proposta, task, url, email, search) => {


        function formatDate(date) {
                    var dateToFormat = date;
                    var arrayDateToFormat = dateToFormat.split('/');
                    var dateStringToFormat = arrayDateToFormat[2] + '/' + arrayDateToFormat[1] + '/' + arrayDateToFormat[0];
                    dateStringToFormat = dateStringToFormat.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3");
                    var returnDate = new Date(dateStringToFormat);
                    return returnDate;
            }

        function _getAccountBalance(account, period, subsidiary, job){
                    log.debug({title: 'Account', details: account});
                    log.debug({title: 'Period', details: period});
                    log.debug({title: 'Subsidiary', details: subsidiary});

                        var sql = 'select abs(sum(transactionaccountingline.amount)) amount, account.acctnumber, ' +
                                '               transactionline.subsidiary ' +
                                '       from transactionaccountingline, transaction, transactionline, account ' +
                                '       where transaction.id = transactionaccountingline.transaction ' +
                                '       and transaction.id = transactionline.transaction ' +
                                '       and account.id = transactionaccountingline.account ' +
                                '       and transaction.recordtype in (\'journalentry\', \'vendorbill\')' +
                                '       and transaction.custbody_rsc_projeto_obra_gasto_compra = ?' +
                                '       and transactionline.mainline = \'T\' ' +
                                '       and transaction.void = \'F\'' +
                                '       and (transactionline.custcol_rsc_neutralizacaoreceita = \'F\' or transactionline.custcol_rsc_neutralizacaoreceita is null) ' +
                                '       and transactionline.linesequencenumber = 0 and account.id in (?) ' +
                                '       and  transaction.postingperiod <= ? and transactionline.subsidiary = ?\n' +
                                '       group by account.acctnumber,  ' +
                                '       transactionline.subsidiary';


                    log.debug("--- GetAccountBalance ---", sql);
                    var results = query.runSuiteQL({query: sql, params: [job, account, period, subsidiary]}).asMappedResults();
                    if (results.length > 0){
                            var result = results[0];
                            return result['amount'];
                    } else {
                            return 0;
                    }
            }

        function _getRateioContaAndValue(componenteId, valor, period, subsidiary, job){
                   /* select * from customrecord_rsc_aprop_rateio_aprop*/
                    var sql = '   select custrecord_rsc_conta_destino, custrecord_rsc_conta_fator '+
                                ' from customrecord_rsc_aprop_rateio_aprop ' +
                                ' where custrecord_rsc_aprop_componente_aprop = ?';
                    var results = query.runSuiteQL({query: sql, params:[componenteId]}).asMappedResults();
                    if (results.length > 0){
                            var response = [];
                            /* Calcula Valor total. */
                            var valorTotal = 0;
                            for (var i = 0; i < results.length; i++){
                                    valorTotal += _getAccountBalance(results[i].custrecord_rsc_conta_fator,period,subsidiary, job);
                                    //log.error({title: "Valor Total ", details: valorTotal});
                            }

                            for (var i = 0; i < results.length; i++){
                                    /* Calcula Fator */
                                    var valorCalculado = _getAccountBalance(results[i].custrecord_rsc_conta_fator, period,subsidiary, job);
                                    //log.error({title:'Valor Calculado ', details: valorCalculado});
                                    //var valorConta = valor * (valorCalculado/ valorTotal);
                                    var valorFator = (valorCalculado/ valorTotal);
                                    var valorArr = {'conta': results[i].custrecord_rsc_conta_destino, 'valor': valorFator}
                                    var scriptObj = runtime.getCurrentScript();
                                    response.push(valorArr);
                            }
                            return response;
                    }
                    return null;
            }

        function getSPEObra(codEmpreend) {
                    var codEmpreendimento;
                    var codProjeto;
                    var codLocation;
                    log.debug('codEmpreend', codEmpreend);
                    var queryResults = query.runSuiteQL({
                            query: 'select id from subsidiary ' +
                                'where substr(name, 0, 4) = ?',
                            params: [codEmpreend]
                    });
                    var records = queryResults.asMappedResults();
                    log.debug('records', records);
                    if (records.length > 0) {
                            // Add the records to the sublist...
                            for (r = 0; r < records.length; r++) {
                                    dados = records[r];
                                    codEmpreendimento = dados['id'];
                            }

                            log.debug({title: 'CodEmpreendimento', details: codEmpreendimento});

                            //     queryResults = query.runSuiteQL({
                            //             query: 'select * from job ' +
                            //                 'where custentity_rsc_codigo_junix_obra = ?',
                            //             params: [codEmpreend]
                            //     });

                            //     records = queryResults.asMappedResults();
                            //     if (records.length > 0) {
                            //             // Add the records to the sublist...
                            //             for (r = 0; r < records.length; r++) {
                            //                     dados = records[r];
                            //                     codProjeto = dados['id'];
                            //             }
                            //     }
                            var searchJob = search.create({
                                    type: 'job',
                                    filters: [
                                            ['subsidiary', 'IS', codEmpreendimento]
                                    ]
                            }).run().getRange({
                                    start: 0,
                                    end: 1
                            })
                            if(searchJob[0]){
                                    codProjeto = searchJob[0].id
                            }
                            log.audit({title: 'CodProjeto', details: codProjeto});

                            queryResults = query.runSuiteQL({
                                    query: 'select location.id from location, locationsubsidiarymap, subsidiary\n' +
                                        'where \n' +
                                        'Location.id = LocationSubsidiaryMap.location\n' +
                                        'and LocationSubsidiaryMap.subsidiary = Subsidiary.id\n' +
                                        'and subsidiary.id = ?',
                                    params: [codEmpreendimento]
                            });
                            records = queryResults.asMappedResults();
                            if (records.length > 0) {
                                    // Add the records to the sublist...
                                    for (r = 0; r < records.length; r++) {
                                            dados = records[r];
                                            codLocation = dados['id'];
                                    }
                            }
                            return {codEmpreendimento: codEmpreendimento, codProjeto: codProjeto, codLocation: codLocation};
                    } else {
                            return {codEmpreendimento: null, codProjeto: null, codLocation: null};
                    }
            }

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */
        const getInputData = (inputContext) => {
            const script = runtime.getCurrentScript();
            const period = script.getParameter({name: 'custscript_rsc_aprop_periodop'});
            const trandate = script.getParameter({name: 'custscript_rsc_aprop_trandateop'});
            const idTipoRegistro = script.getParameter({name: 'custscript_rsc_tipooperacao'});
            return apropQuery.getCalculo(idTipoRegistro, period);
        }

        /**
        * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
        * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
        * context.
        * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
        *     is provided automatically based on the results of the getInputData stage.
        * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
        *     function on the current key-value pair
        * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
        *     pair
        * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
        *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
        * @param {string} mapContext.key - Key to be processed during the map stage
        * @param {string} mapContext.value - Value to be processed during the map stage
        * @since 2015.2
        */
        const map = (mapContext) => {
            try {
                    const script = runtime.getCurrentScript();
                    const period = script.getParameter({name: 'custscript_rsc_aprop_periodop'});
                    const trandate = script.getParameter({name: 'custscript_rsc_aprop_trandateop'});
                    var record = JSON.parse(mapContext.value);
                    /* Validar a cia está no perido de apropriação. */
                    if (record.inicioapropriacao == null){
                            log.debug({title: 'Validação Apropriaçaão', details: 'Fora do periodo da apropriação'});
                            return false;
                    }
                    var keyNames = Object.keys(record);
                    var headers = [];

                    for (var i = 0; i < keyNames.length; i++) {
                            if (i == 0){
                                    /* Obtem Subsidiary */
                                    //var pesqSub = record[keyNames[i]] + '_' + record[keyNames[i]];
                                    var pesqSub = record[keyNames[i]];
                                    var sub = getSPEObra(pesqSub).codEmpreendimento;
                                    var job = getSPEObra(pesqSub).codProjeto;
                                    var loc = getSPEObra(pesqSub).codLocation;
                            } else {
                                    if (i > 1){
                                            var contas = keyNames[i].split('_');
                                            var partida = contas[1];
                                            var contrapartida = contas[2];
                                            var componenteId = contas[3];
                                            var operacaoInvertida = contas[4];
                                            var lancarDiferenca = contas[5];
                                            var lancarMaiorZero = contas[6];
                                            var contaCredora = contas[7];
                                            var rateio = contas[8];
                                            log.debug({title: 'Contas', details: contas});
                                            var valor = (record[keyNames[i]] == null? 0:record[keyNames[i]]);
                                            var lines = [];
                                            if (valor !=  0){
                                                    var continuar = false;
                                                    if (lancarMaiorZero === 't'){
                                                            if (valor > 0 ){
                                                                    continuar = true;
                                                            }
                                                    } else {
                                                            continuar = true;
                                                    }
                                                    if (continuar){

                                                            if (rateio === 't'){
                                                                    log.error({title:'Contas', details: mapContext})
                                                                    var contas = _getRateioContaAndValue(componenteId, valor, period, sub,job);
                                                                    log.error({title:'Contas', details: contas})
                                                                    var typelancamento1 = '';
                                                                    var typelancamento2 = '';
                                                                    if (operacaoInvertida === 't'){
                                                                            typelancamento1 = 'credit';
                                                                            typelancamento2 = 'debit';
                                                                    } else {
                                                                            typelancamento1 = 'debit';
                                                                            typelancamento2 = 'credit';
                                                                    }
                                                                    lines.push({account: partida, type: typelancamento2, value: valor});
                                                                    var valorRestante = valor;

                                                                    for (var j = 0; j < contas.length; j++){
                                                                            lines.push({account: contas[j].conta, type: typelancamento1, value: contas[j].valor})
                                                                    }


                                                            } else {
                                                                    if (operacaoInvertida === 't'){
                                                                            log.debug({title:'Operacao Invertida', details: operacaoInvertida})
                                                                            log.debug({title:'Operacao Invertida', details: valor})
                                                                            lines.push({account: contrapartida, type: 'credit', value: valor});
                                                                            lines.push({account: partida, type: 'debit', value: valor});
                                                                    } else {
                                                                            lines.push({account: partida, type: 'credit', value: valor});
                                                                            lines.push({account: contrapartida, type: 'debit', value: valor});
                                                                    }
                                                            }

                                                            var header = [];
                                                            header.push({subsidiary: sub,
                                                                    postingperiod: period,
                                                                    project: job,
                                                                    trandate: trandate,
                                                                    memo: 'Apropriação Imobiliaria',
                                                                    componenteId: componenteId,
                                                                    operacaoInvertida: operacaoInvertida,
                                                                    naoLancarDiferenca: lancarDiferenca,
                                                                    contaCredora: contaCredora,
                                                                    valor: valor,
                                                                    line: lines,
                                                                    rateio: rateio
                                                            });
                                                            headers.push(header);
                                                    }
                                            }
                                    }
                            }
                    }
                    /* Inclui na lista de scripts a serem atualizados. */
                    log.debug({title: 'valores', details:headers});
                    for (var a = 0; a < headers.length; a++){
                            mapContext.write({
                                    key: headers[a],
                                    value: headers[a]
                            });

                    }
            } catch (e){
                    log.error({title: 'Error Processing', details: e})
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            try{
                    log.audit({title:'Reduce', details: reduceContext});
                    var context = JSON.parse(reduceContext.key);
                    log.audit({title: 'map context', details: context[0]});

                    if (context[0] != null){
                            log.audit({title: 'Data', details: formatDate(context[0].trandate)});
                            log.audit({title: 'Data', details: context[0].trandate});

                            /* Obtem o valor de saldo da conta, para calcular o valor a ser lançado */
                            var accountBalance = 0;
                            if (context[0].operacaoInvertida === 't'){
                                    accountBalance = _getAccountBalance(context[0].line[1].account, context[0].postingperiod,context[0].subsidiary, context[0].project);
                            } else {
                                    accountBalance = _getAccountBalance(context[0].line[0].account, context[0].postingperiod,context[0].subsidiary, context[0].project);
                            }

                            var journal = record.create({type: record.Type.JOURNAL_ENTRY, isDynamic: false});
                            journal.setValue({fieldId: 'subsidiary', value: context[0].subsidiary});
                            journal.setValue({ fieldId: 'custbody_rsc_projeto_obra_gasto_compra', value: context[0].project });
                            journal.setValue({fieldId: 'postingperiod', value: context[0].period});
                            journal.setValue({fieldId: 'trandate', value: formatDate(context[0].trandate) });
                            journal.setValue({fieldId: 'memo', value: 'Apropriação Imobiliaria'});
                            journal.setValue({fieldId: 'custbody_rsc_aprop_flag', value: true});
                            journal.setValue({fieldId: 'custbody_rsc_aprop_comp_aprop', value: context[0].componenteId});

                            // Gravar o valor calculado
                            journal.setValue({fieldId: 'custbody_rsc_aprop_valor_calc', value: context[0].valor})
                            for (var i = 0; i < context[0].line.length; i++){
                                    var linha = context[0].line[i];
                                    journal.setSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'account',
                                            value: linha.account.toString(),
                                            line: i
                                    });

                                    var balance = 0;
                                    if (context[0].naoLancarDiferenca === 't'){
                                        balance = context[0].valor
                                    } else {

                                        if (accountBalance < 0){
                                                balance = accountBalance - context[0].valor;
                                        } else {
                                                if (context[0].contaCredora === 't'){
                                                        var valorCalc = context[0].valor;
                                                        valorCalc *= -1;
                                                        balance =  valorCalc - accountBalance;
                                                        balance *=-1;
                                                } else {
                                                        balance = context[0].valor - accountBalance;
                                                }
                                        }
                                    }
                                    if (context[0].rateio === 't' && i > 0){
                                            balance = balance * linha.value;
                                            log.error({title: 'Account Balance', details:balance});
                                    }
                                    journal.setSublistValue({
                                            sublistId: 'line',
                                            fieldId: linha.type,
                                            value: balance,
                                            line: i
                                    });
                                    journal.setSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'custcol_rsc_fieldcliente',
                                            value: context[0].project,
                                            line: i
                                    });
                                    journal.setSublistValue({
                                            sublistId: 'line',
                                            fieldId:'custcol_rsc_devido_subsidiary',
                                            value: context[0].subsidiary,
                                            line:i
                                    })
                            }


                            var idJournal = journal.save({ignoreMandatoryFields: true});

                            log.audit({title: 'Journal Entry', details:idJournal});
                    }
            } catch (e){
                    log.error({title: 'Error ', details: e});
            }
        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
            const script = runtime.getCurrentScript();
            const period = script.getParameter({name: 'custscript_rsc_aprop_periodop'});
            const trandate = script.getParameter({name: 'custscript_rsc_aprop_trandateop'});
            const idTipoRegistro = script.getParameter({name: 'custscript_rsc_tipooperacao'});
            switch (idTipoRegistro) {
                    case 'CUSTOS':
                            var createJETask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_rsc_mr_aprop_process_je',
                                    deploymentId: 'customdeploy_rsc_aprop_createje_2',
                                    params: {
                                            custscript_rsc_aprop_periodop: period,
                                            custscript_rsc_aprop_trandateop: trandate
                                    }
                            });

                            var idCreateJETask = createJETask.submit();

                            break;
                    case 'REF':
                            var createJETask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_rsc_mr_aprop_process_je',
                                    deploymentId: 'customdeploy_rsc_aprop_createje_3',
                                    params: {
                                            custscript_rsc_aprop_periodop: period,
                                            custscript_rsc_aprop_trandateop: trandate
                                    }
                            });
                            var idCreateJETask = createJETask.submit();
                            break;
                    case 'DRE':
                            var createJETask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_rsc_mr_aprop_process_je',
                                    deploymentId: 'customdeploy_rsc_aprop_createje_4',
                                    params: {
                                            custscript_rsc_aprop_periodop: period,
                                            custscript_rsc_aprop_trandateop: trandate
                                    }
                            });

                            var idCreateJETask = createJETask.submit();
                            break;
                    case 'VAL_376584_5843489_SB1_393':
                            /* Send email with resume transaction */
                            var host = url.resolveDomain({hostType: url.HostType.APPLICATION});

                            var author = -5;
                            var recipients = runtime.getCurrentUser().email;
                            var subject = 'Arquivo Criado';
                            var body = 'O processamento dos registros foi concluido e segue o link para visualização dos registros. ';

                            email.send({
                                    author: author,
                                    recipients: recipients,
                                    subject: subject,
                                    body: body
                            });

                            break;
                    default:
                            break;
            }
        }


        return {getInputData, map, reduce, summarize}

    });
