/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/query', 'N/record', 'N/task', 'N/ui/message', 'N/ui/dialog', 'N/format', 'N/runtime', './rsc_module_aprop_querys'],

    (widget, query, record, task, message, dialog, format, runtime, apropQuery) => {
        var joinsAll = [];
        var dividendoAll = [];
        var divisorAll = [];

        function _loadAllValues(){
            joinsAll = query.runSuiteQL({query: 'select dataset.id, dataset.custrecord_rsc_table, ' +
                    'apropjoin.custrecord_rsc_aprop_origem, apropjoin.custrecord_rsc_aprop_operacao, ' +
                    'apropjoin.custrecord_rsc_aprop_destino , * from customrecord_rsc_aprop_join apropjoin ' +
                    'join customrecord_rsc_aprop_data_set dataset on dataset.id = apropjoin.custrecord_rsc_aprop_data_set\n' +
                    '                    where dataset.isinactive = \'F\''}).asMappedResults();

            headersAll = query.runSuiteQL({
                query: 'select custrecord_rsc_fatores_operacao, id from customrecord_rsc_param_fatores where isinactive = \'F\''
            }).asMappedResults();

            dividendoAll = query.runSuiteQL({query: 'select ' +
                    '   custrecord_rsc_sublist_cp_info amount, ' +
                    '   custrecord_rsc_sublist_originfo origin, ' +
                    '   custrecord_rsc_sublist_cp_filtro filter, ' +
                    '   custrecord_rsc_sublist_vl_filtro resultFilters, ' +
                    '       custrecord_rsc_vinc_param id ' +
                    ' from customrecord_rsc_rec_dividendo where isinactive = \'F\''}).asMappedResults();

            divisorAll = query.runSuiteQL(
                {query: 'select ' +
                        '   custrecord_rsc_sublist2_cp_info amount, ' +
                        '   custrecord_rsc_sublist2_originfo origin, ' +
                        '   custrecord_rsc_sublist2_cp_filtro filter, ' +
                        '   custrecord_rsc_sublist2_vl_filtro resultFilters,' +
                        '   custrecord_rsc_vinc_param2 id, ' +
                        '   custrecord_rsc_aprop_base_custo id2 ' +
                        ' from customrecord_rsc_rec_divisor where isinactive = \'F\''}).asMappedResults();
        }

        function _getJoin(alias, scriptContext){
            var period = scriptContext.request.parameters.period;
            var joins = joinsAll.filter(word => word.id === alias);
            if (joins.length > 0 ){
                var stringJoin = 'from ';
                stringJoin += joins[0]['custrecord_rsc_table'];
                stringJoin += ' where ';
                for (var i = 0; i < joins.length; i++ ){
                    if (i > 0 ){
                        stringJoin += ' AND ';
                    }
                    var join = joins[i];
                    //log.debug({title:'Join valores', details: join});
                    stringJoin += ' ' + join['custrecord_rsc_aprop_origem'] ;
                    switch (join['custrecord_rsc_aprop_operacao']){
                        case 1 : stringJoin += ' = ';
                        break;
                        case 2 : stringJoin += ' != ';
                            break;
                        case 3 : stringJoin += ' > ';
                            break;
                        case 4 : stringJoin += ' <>> ';
                            break;
                        case 5 : stringJoin += ' <= ';
                            break;
                        case 6 : stringJoin += ' >= ';
                            break;
                    }
                    switch (join['custrecord_rsc_aprop_destino']){
                        case '#period':
                            stringJoin += ' ' + period;
                            break;
                        default:
                            stringJoin += ' ' + join['custrecord_rsc_aprop_destino'];
                    }

                }
                //log.audit({title: 'Join ', details: stringJoin});
                return stringJoin;
            }

            return null;

        }

        function formatDate(date) {
            var dateToFormat = date;
            var arrayDateToFormat = dateToFormat.split('/');
            var dateStringToFormat = arrayDateToFormat[2] + '/' + arrayDateToFormat[1] + '/' + arrayDateToFormat[0];
            dateStringToFormat = dateStringToFormat.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3");
            var returnDate = new Date(dateStringToFormat);
            return returnDate;
        }

        function createList(assistant , records, name, precision){
            // Create a sublist for the results.
            var resultsSublist = assistant.addSublist(
                {
                    id : 'results_sublist'+ name,
                    label : 'Calculo Apropriação',
                    type : widget.SublistType.INLINEEDITOR
                }
            );

            // Get the column names.
            var columnNames = Object.keys( records[0] );

            // Loop over the column names...
            for ( i = 0; i < columnNames.length; i++ ) {

                // Add the column to the sublist as a field.
                resultsSublist.addField(
                    {
                        id: 'custpage_results_sublist_col_' + i,
                        type: widget.FieldType.TEXT,
                        label: columnNames[i],
                    }
                ).updateDisplayType({ displayType : widget.FieldDisplayType.DISABLED });

            }
            // Add the records to the sublist...
            for ( r = 0; r < records.length; r++ ) {

                // Get the record.
                var record = records[r];

                // Loop over the columns...
                for ( c = 0; c < columnNames.length; c++ ) {

                    // Get the column name.
                    var column = columnNames[c];

                    // Get the column value.
                    var value = record[column];
                    if ( value != null ) {
                        if (isNaN(value)){
                            value = value.toString();
                        } else {
                            if (precision == 3){
                                value = format.format({value: value, type: format.Type.PERCENT});
                            } else {
                                value = format.format({value: value, type: format.Type.CURRENCY});
                            }
                        }
                    }
                    // Add the column value.
                    resultsSublist.setSublistValue(
                        {
                            id : 'custpage_results_sublist_col_' + c,
                            line : r,
                            value : value
                        }
                    );
                }
            }
        }

        function writePeriodo(assistant){
            var period = assistant.addField({id: 'period', label: 'Selecione o periodo para execução', type: 'select', source:'AccountingPeriod'});
            var dateJournal = assistant.addField({id: 'datejournal', label: 'Informe a data do Lançamento contabil', type: 'date'});
            dateJournal.isMandatory = true;
        }

        function writeFinish(assistant){
            var period = assistant.addField({id: 'period', label: 'Selecione o periodo para execução', type: 'select', source:'AccountingPeriod'});
            var dateJournal = assistant.addField({id: 'datejournal', label: 'Informe a data do Lançamento contabil', type: 'date'});
            dateJournal.isMandatory = true;
        }

        function getFatores(assistant, scriptContext){
            _loadAllValues();
            var headers = query.runSuiteQL({
                query: 'select custrecord_rsc_fatores_operacao, id from customrecord_rsc_param_fatores where isinactive = \'F\''
            }).asMappedResults();

            var sql = 'select substr(subsidiary.name,1,4) subsidiary, ' +
                'job.custentity_rsc_term_cl_suspensiva inicioApropriacao  ' ;
            if (headers.length > 0 )
                for (let i = 0; i < headers.length; i++) {
                    var header = headers[i];
                    /* Preparar SQL dos Fatores. */
                    var dividendo = dividendoAll.filter(word => word.id === header['id']);
                    var sqlValores = '';
                    if (dividendo.length > 0){
                        var sqlDividendo = '(';
                        for (let j = 0; j < dividendo.length; j++ ){
                            if (j > 0 ){
                                sqlDividendo += ' + (';
                            }
                            var div = dividendo[j];
                            sqlDividendo += 'select sum(';
                            sqlDividendo += div['amount'];
                            sqlDividendo += ') valor ' + _getJoin(div['origin'], scriptContext);
                            if (div['filter'] != null){
                                sqlDividendo += ' and ' + div['filter'];
                                sqlDividendo += ' in (' + div['resultfilters'] + ') ';
                            }
                            if (dividendo.length >1){
                                sqlDividendo += ')';
                            }
                        }
                        if (dividendo.length == 1){
                            sqlDividendo += ')';
                        }
                    }

                    var divisor = divisorAll.filter(word => word.id === header['id']);
                    if (divisor.length > 0){
                        var sqlDivisor = '(';
                        for (let j = 0; j < divisor.length; j++ ){
                            if (j > 0 ){
                                sqlDivisor += ' + (';
                            }
                            var div = divisor[j];
                            sqlDivisor += 'select sum(';
                            sqlDivisor += div['amount'];
                            sqlDivisor += ') valor ' + _getJoin(div['origin'], scriptContext);
                            if (div['filter'] != null){
                                sqlDivisor += ' and ' + div['filter'];
                                sqlDivisor += ' in (' + div['resultfilters'] + ') ';
                            }
                            if (divisor.length > 1){
                                sqlDivisor += ')';
                            }
                        }
                        if (divisor.length == 1){
                            sqlDivisor += ')';
                        }
                    }

                    sqlValores = 'Round((((abs(' + sqlDividendo + ')) / (abs(' + sqlDivisor + ')) )*100), 3)';
                    sql += ' , ' + sqlValores  + header['custrecord_rsc_fatores_operacao'] + ' ';
                }
            sql += 'from subsidiary, job  ' +
                '                    where 1 = subsidiary.custrecordtpemp and job.custentity_rsc_aprop_subsidiaria = subsidiary.id order by 1';
            log.debug({title: 'Sql completo ', details : sql});
            var queryResults = query.runSuiteQL({
                query:  sql
            });
            var records = queryResults.asMappedResults();
            createList(assistant, records,'fatores', 3);
        }

/*
        function _createJournal(scriptContext, assistant){
            if (scriptContext.request.parameters.results_sublistcalculodata != null){
                var auxCalculoData = scriptContext.request.parameters.results_sublistcalculodata.split('\u0002');
                var auxLabels = scriptContext.request.parameters.results_sublistcalculolabels.split('\u0001');
                var period = scriptContext.request.parameters.period;
                var trandate = new Date(formatDate(scriptContext.request.parameters.datejournal));//
                var dadosCalculo = [];

                auxCalculoData.forEach(value => {
                    var dado = value.split('\u0001');
                    dadosCalculo.push(dado);
                });

                var createJETask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_rsc_aprop_createje',
                    params: { custscript_rsc_aprop_dadosCalculo: JSON.stringify(dadosCalculo),
                        custscript_rsc_aprop_label: JSON.stringify(auxLabels),
                        custscript_rsc_aprop_period: period,
                        custscript_rsc_aprop_trandate: trandate}
                });

                var idCreateJETask = createJETask.submit();
                var taskStatus = null;
                do {
                    sleep(5000);
                    taskStatus = task.checkStatus({
                        taskId: idCreateJETask
                    });
                } while (taskStatus.status != task.TaskStatus.COMPLETE && taskStatus.status != task.TaskStatus.FAILED)
            }
        }

        function _createAuditFile(scriptContext, assistant){
            return true;
        }
*/

        function writeResult(assistant, scriptContext){
            var period = scriptContext.request.parameters.period;
            var trandate = new Date(formatDate(scriptContext.request.parameters.datejournal));
            var createJETask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_rsc_mr_aprop_process_je',
                deploymentId: 'customdeploy_rsc_aprop_createje_1',
                params: {custscript_rsc_aprop_periodop: period,
                    custscript_rsc_aprop_trandateop: trandate}
            });

            var idCreateJETask = createJETask.submit();
            assistant.finishedHtml = 'A geração dos lançamentos foi iniciada, ao final da execução \n será enviado um email informando os resultados. \n ' + idCreateJETask;
        }
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            /* Create all steps */
            var assistant = widget.createAssistant({title: "Apropriação Imobiliaria", hideNavBar: false});
            assistant.addStep({id: 'periodo', label: 'Selecione o periodo'});
            assistant.addStep({id: 'fatores', label: 'Conferencia dos fatores'});
//            assistant.addStep({id: 'Finished', label: 'Registration Completed'});

            assistant.errorHtml = null;


            log.debug({title: 'Script Context', details: scriptContext.request.parameters.datejournal});

            /* If first Execution */
            if ((scriptContext.request.method === 'GET')) {

                writePeriodo(assistant);
                assistant.currentStep = 'periodo';
                scriptContext.response.writePage(assistant);

            } else {
                var period = assistant.addField({id: 'period', type: 'text', label: 'Periodo'});
                period.defaultValue = scriptContext.request.parameters.period;
                period.updateDisplayType({displayType: widget.FieldDisplayType.HIDDEN});
                var dateJournal = assistant.addField({
                    id: 'datejournal',
                    label: 'Label',
                    type: 'date'
                });
                dateJournal.defaultValue = scriptContext.request.parameters.datejournal;
                dateJournal.updateDisplayType({displayType: widget.FieldDisplayType.HIDDEN});
                if (scriptContext.request.parameters.datejournal != null){
                    var trandate = new Date(formatDate(scriptContext.request.parameters.datejournal));//
                    log.audit({title:'Create date', details:trandate});
                }
                if ((scriptContext.request.parameters.next === 'Finish') || (scriptContext.request.parameters.next === 'Concluir') ){
                    writeResult(assistant, scriptContext);
                    scriptContext.response.writePage(assistant);
                } else if (scriptContext.request.parameters.cancel){
                    assistant.finishedHtml = 'Assistant was cancelled';
                    scriptContext.response.writePage(assistant);
                } else if (assistant.currentStep.stepNumber === 1){ //Fatores
                    getFatores(assistant, scriptContext);
                    assistant.currentStep = assistant.getNextStep();
                    scriptContext.response.writePage(assistant);
                }
                /*else if ((assistant.getNextStep() != null) && (assistant.getNextStep().id === 'periodo')) {
                    writePeriodo(assistant);
                } else {
                    var period = assistant.addField({id: 'period', type: 'text', label: 'Periodo'});
                    period.defaultValue = scriptContext.request.parameters.period;
                    period.updateDisplayType({displayType: widget.FieldDisplayType.HIDDEN});
                    var dateJournal = assistant.addField({
                        id: 'datejournal',
                        label: 'Label',
                        type: 'date'
                    });
                    dateJournal.defaultValue = scriptContext.request.parameters.datejournal;
                    dateJournal.updateDisplayType({displayType: widget.FieldDisplayType.HIDDEN});
                    if (scriptContext.request.parameters.datejournal != null){
                        var trandate = new Date(formatDate(scriptContext.request.parameters.datejournal));//
                        log.audit({title:'Create date', details:trandate});
                    }

                    if ((scriptContext.request.parameters.next === 'Finish') || (scriptContext.request.parameters.next === 'Concluir')) {
                        writeFinish(assistant, scriptContext);
                        assistant.finishedHtml = "Os lançamentos foram efetuados, você pode retirar os relatorios contabeis para validação";
                        log.debug({title: 'Finish IF', details: assistant.currentStep});
                        scriptContext.response.writePage(assistant);
                    }  else if (assistant.getNextStep().id === 'fatores') {

                    } else if (assistant.getNextStep().id === 'execucao') {

                        var final = assistant.addField({id: 'final', label: 'Selecione o periodo para execução', type: 'text', source:'AccountingPeriod'});
                    }
                    assistant.currentStep = assistant.getNextStep();
                    scriptContext.response.writePage(assistant);
                }*/
            }
                var scriptObj = runtime.getCurrentScript();
                log.debug({
                    title: "Remaining usage units: ",
                    details: scriptObj.getRemainingUsage()
                });

        }

        return {onRequest}

    });
