/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {

        function handleErrorAndLog(e, stage)
        {
            log.error('Stage: ' + stage + ' failed', e);

        }

        function handleErrorIfAny(summary)
        {
            var inputSummary = summary.inputSummary;
            var mapSummary = summary.mapSummary;
            var reduceSummary = summary.reduceSummary;

            if (inputSummary.error)
            {
                var e = error.create({
                    name: 'INPUT_STAGE_FAILED',
                    message: inputSummary.error
                });
                handleErrorAndLog(e, 'getInputData');
            }

            handleErrorInStage('map', mapSummary);
            handleErrorInStage('reduce', reduceSummary);
        }

        function handleErrorInStage(stage, summary)
        {
            var errorMsg = [];
            summary.errors.iterator().each(function(key, value){
                var msg = 'Failure to generate the file: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
                errorMsg.push(msg);
                return true;
            });
            if (errorMsg.length > 0)
            {
                var e = error.create({
                    name: 'RECORD_TRANSFORM_FAILED',
                    message: JSON.stringify(errorMsg)
                });
                handleErrorAndLog(e, stage);
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
            return search.create({
                type: "customrecord_rsc_dimob_r01",
                filters:
                    [
                        ["custrecord_rsc_status_dimob","anyof","1"],
                    ] ,
                columns:
                    [
                        search.createColumn({name: "name", sort: search.Sort.ASC, label: "Nome"}),
                        search.createColumn({name: "custrecord_rsc_cnpj_do_declarante", label: "CNPJ do declarante"}),
                        search.createColumn({name: "custrecord_rsc_ano_calendario", label: "Ano-calendário"}),
                        search.createColumn({name: "custrecord_rsc_declaracao_retificadora", label: "Declaração Retificadora"}),
                        search.createColumn({name: "custrecord_rsc_numero_do_recibo", label: "Número do Recibo "}),
                        search.createColumn({name: "custrecord_rsc_situacao_especial", label: "Situação Especial"}),
                        search.createColumn({name: "custrecord_rsc_data_do_evento", label: "Data do evento situação especial"}),
                        search.createColumn({name: "custrecord_rsc_codigo_da_situacao", label: "Código da situação especial"}),
                        search.createColumn({name: "custrecord_rsc_nome_empresarial", label: "Nome Empresarial"}),
                        search.createColumn({name: "custrecord_rsc_cpf_do_responsavel_rfb", label: "CPF do Responsável pela pessoa jurídica perante à RFB"}),
                        search.createColumn({name: "custrecord_rsc_endereco_contribuinte", label: "Endereço completo do contribuinte"}),
                        search.createColumn({name: "custrecord_rsc_uf_do_contribuinte", label: "UF do Contribuinte"}),
                        search.createColumn({name: "custrecord_rsc_codigo_do_municipio", label: "Código do Município do Contribuinte"}),
                        search.createColumn({name: "custrecord_rsc_reservado", label: "Reservado"}),
                        search.createColumn({name: "custrecord_rsc_status_dimob", label: "Status"})
                    ]
            });
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
            var recordSearch = null;

            try {

                var records = [];

                records.push(processHeader());

                records.push(processR01(context.value()));

                // Incluir busca salva para registros dos processR03
                records.push(processR03());

                // Incluir busca salva para registros do process R04
                records.push(processR04());


                records.push(processT09());

                context.write(context.value, records);

            }
            catch(e)
            {
                log.error('Map error', (e instanceof nlobjError ? 'Code: ' + e.getCode() + ' - Details: ' + e.getDetails() : 'Details: ' + e) + ' ' + e.stack);
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
            try
            {
                var currentScript = runtime.getCurrentScript();

                var folder = currentScript.getParameter({
                    name : "custscript_rsc_folderid"
                });

                var records = JSON.parse(context.values[0]);

                //log.debug("Records", records);

                var newfile = file.create({ name: createFileName(context.key),
                    folder: folder,
                    fileType: file.Type.PLAINTEXT});

                for(var i = 0; records && i < records.length; i++)
                {
                    newfile.appendLine({value: records[i].join("")});
                }

                newfile.save();

                context.write({
                    key: newfile.id
                });

                log.debug("File", newfile.getContents());

            }
            catch(e)
            {
                //TODO Log Error
                log.error('Map error', (e instanceof nlobjError ? 'Code: ' + e.getCode() + ' - Details: ' + e.getDetails() : 'Details: ' + e) + ' ' + e.stack);
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
            handleErrorIfAny(context);

            var currentScript = runtime.getCurrentScript();

            var folder = currentScript.getParameter({
                name : "custscript_rsc_folderid"
            });

            var host = url.resolveDomain({hostType: url.HostType.APPLICATION});

            var author = -5;
            var recipients = 'thiago.silva@runsmart.cloud' //'luiz.morais@enl8.com.br';
            var subject = 'Arquivo Criado';
            var body = 'O processamento do arquivo selecionado foi encerrado com sucesso. Segue link para download: <a href="https://' + host + '/core/media/downloadfolder.nl?id=' +folder + '">Download</a>';

            https://debugger.na0.netsuite.com/core/media/downloadfolder.nl?id=505&_xt=&_xd=T&fcts=20200213122958
                // https://5125610-sb1.app.netsuite.com/core/media/downloadfolder.nl?id=607

                log.debug("data", {
                    host: host,
                    folder: folder
                })
            email.send({
                author: author,
                recipients: recipients,
                subject: subject,
                body: body
            });
        }

        function processHeader(result){
            var ret = ""
            var record = [];
            record[0] = "DIMOB";
            record[1] = formatText(" ", 369);
            record[2] = '\r';

            return record;
        }
        //Process Record
        function processR01(result)
        {
            var record = [];

            record[0] = "R01";
            record[1] = formatText(result.cnpj_declarante, 14);
            record[2] = formatText(result.ano_calendario, 4);
            record[3] = formatNumber(result.declaracao_retificadora, 1);
            record[4] = formatNumber(result.numero_recibo, 10);
            record[5] = formatNumber(result.codigo_especial ==! '00' ? '1' : '0', 1);
            record[6] = formatDate(result.finalDate);
            record[7] = formatNumber(result.codigo_especial, 2);
            record[8] = formatText(result.nome_empresarial, 60);
            record[9] = formatText(result.responsavel, 11);
            record[10] = formatText(result.end_contribuinte, 100);
            record[11] = formatText(result.uf_contribuinte, 2);
            record[12] = formatNumber(result.cod_monicipio_contribuinte, 4);
            record[13] = formatText(" ", 20);
            record[14] = formatText(" ", 10);
            record[15] = '\r';

            return record;
        }

        //Process Record
        function processR03(result)
        {

            var record = [];

            record[0] = "R03";

            record[17] = '\r';
            return record;
        }

        //Process Record
        function processR04(result)
        {
            var record = [];

            record[0] = "R04";

            record[19] = '\r';
            return record;
        }

        //Process Record
        function processT09(result)
        {
            var ret = "";

            var record = [];

            record[0] = 'T9';
            record[1] = formatText(" ", 100);
            record[2] = '\r';

            return record;
        }

        function formatDate(dateStr)
        {
            if(dateStr)
            {
                var date = format.parse(dateStr, format.Type.DATE);

                return date.getFullYear() +
                    (date.getMonth() < 9 ? "0" + parseInt(date.getMonth() + 1) : parseInt(date.getMonth() + 1)) +
                    (date.getDate() < 10 ? "0" + date.getDate() : date.getDate());
            }
            else
            {
                return "00000000"
            }
        }

        function formatNumber(value, size, decimals)
        {

            if (isNaN(value)|| value === ''){
                value = 0;
            }
            var number = parseFloat(value).toFixed(decimals);

            var numberStr = number.toString().replace(/[^0-9]/,'');

            while(numberStr.length < size)
            {
                numberStr = "0" + numberStr;
            }

            return numberStr.substr(0,size);
        }

        function formatText(value, size)
        {
            var text = "" + value;

            while(text.length < size)
            {
                text += " ";
            }

            return text.substr(0,size);
        }

        function formatPeriod(dateStr)
        {
            if(dateStr) {
                var date = format.parse(dateStr, format.Type.DATE);

                return date.getFullYear() +
                    (date.getMonth() < 9 ? "0" + parseInt(date.getMonth() + 1) : parseInt(date.getMonth() + 1));
            }
            else
            {
                return "000000";
            }
        }

        function createFileName(filetype)
        {

            ret = uf.concat(cnpj, modelo,serie, anomes,status, tipo, '.', volume);
            return ret;
        }

        return {getInputData, map, reduce, summarize}

    });
