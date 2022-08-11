/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author Vitor Santos 
 */
 define(["N/record", "N/search", 'N/runtime', "./rsc_dimob_json",'N/file', "N/task", 'N/email', 'N/url'],
 function(record, search, runtime, model, file, task, email,url) {

    function getInputData() {
        
        var currentScript = runtime.getCurrentScript()
        var reportSelection = currentScript.getParameter({ name: 'custscript_rsc_report_selection' })
        var Subsidiary = currentScript.getParameter({ name: 'custscript_rsc_subsidiary_dimob' })
        var rectifyingStatement = currentScript.getParameter({ name: 'custscript_rsc_rectifying_statement' })
        var specialSituationCode = currentScript.getParameter({ name: 'custscript_rsc_special_situation_code' })
        var dateEvent = currentScript.getParameter({ name: 'custscript_rsc_date_event' })
        var responsibleCnpj = currentScript.getParameter({ name: 'custscript_rsc_responsible_cnpj' })
        var receiptNumber = currentScript.getParameter({ name: 'custscript_rsc_receipt_number' })
        var fileAddress = currentScript.getParameter({ name: 'custscript_rsc_file_address' })
        var dimobR01 = currentScript.getParameter({ name: 'custscript_rsc_dimob_automatico' })

        var suitlet = []
        suitlet.push({
            reportSelection: reportSelection,
            Subsidiary: Subsidiary,
            rectifyingStatement: rectifyingStatement,    
            specialSituationCode: specialSituationCode,
            dateEvent: dateEvent,
            responsibleCnpj: responsibleCnpj,
            receiptNumber: receiptNumber,
            fileAddress: fileAddress,
            dimobR01: dimobR01
        })

        return suitlet
    }

    function reduce(context) {

        const padZeros = function(str, size) {
            var adicionar = size - str.length;
            for (var i = 0; i < adicionar; i++) str = '0' + str;
            return str.slice(0, size);
        }

        var suitlet = context.values
        suitlet = JSON.parse(suitlet)
        var dimobR01 = JSON.parse(suitlet.dimobR01)
        log.debug('dimobR01', dimobR01)
        log.debug('suitlet', suitlet)

        var reportSelection = suitlet.reportSelection
        var Subsidiary = suitlet.Subsidiary
        var rectifyingStatement = suitlet.rectifyingStatement
        var specialSituationCode = suitlet.specialSituationCode
        var dateEvent = suitlet.dateEvent
        var responsibleCnpj = suitlet.responsibleCnpj
        var receiptNumber = suitlet.receiptNumber
        var fileAddress = suitlet.fileAddress
        

        var cnpj_declarante
        var ano_calendario
        var declaracao_retificadora
        var numero_recibo 
        var situacao_especial
        var data_situacao_especial
        var codigo_especial
        var nome_empresarial
        var responsavel
        var end_contribuinte
        var uf_contibuinte
        var cod_monicipio_contribuinte
        var reservado
        

        var FOLDER_ID
        if (dimobR01 != null){
            var folderCreate = record.create({type: 'folder'});
            var date = new Date();
            var folderName = 'Geração Automatica ' + date.getFullYear() + (date.getMonth() +1 ) + date.getMilliseconds()
            folderCreate.setValue('name', folderName);
            folderCreate.setValue('parent', 410);
            var folderCreateId = folderCreate.save(); 
            log.debug('folderCreateId', folderCreateId)
            FOLDER_ID = folderCreateId

            for (var i = 0; i< dimobR01.length; i++) {
                var objRecord = record.load({type: "customrecord_rsc_dimob_r01", id: i+2,})
                objRecord.setValue({
                    fieldId: 'custrecord_rsc_status_dimob',
                    value: 2,
                    ignoreFieldChange: true
                })
                objRecord.save()
            }

        
            log.debug('Geração Dimob automática Iniciada')
            var dimob = []
                        
            dimobR01.forEach(function (dimobR01){ 

                cnpj_declarante = dimobR01.cnpj_declarante
                ano_calendario = dimobR01.ano_calendario
                declaracao_retificadora = dimobR01.declaracao_retificadora
                numero_recibo = dimobR01.numero_recibo
                situacao_especial = dimobR01.situacao_especial
                data_situacao_especial = dimobR01.data_situacao_especial
                codigo_especial = dimobR01.codigo_especial
                nome_empresarial = dimobR01.nome_empresarial
                responsavel = dimobR01.responsavel
                end_contribuinte = dimobR01.end_contribuinte
                uf_contribuinte = dimobR01.uf_contribuinte
                cod_monicipio_contribuinte = dimobR01.cod_monicipio_contribuinte
                reservado = dimobR01.reservado

                log.debug('DIMOB', {
                    cnpj_declarante: cnpj_declarante,
                    ano_calendario: ano_calendario,
                    declaracao_retificadora: declaracao_retificadora,
                    numero_recibo: numero_recibo,
                    situacao_especial: situacao_especial,
                    data_situacao_especial: finalDate,
                    codigo_especial: codigo_especial,
                    nome_empresarial: nome_empresarial,
                    responsavel: responsavel,
                    end_contribuinte: end_contribuinte,
                    uf_contribuinte: uf_contribuinte,
                    cod_monicipio_contribuinte: cod_monicipio_contribuinte,
                    reservado: reservado,
                            
                })

                if(dateEvent != null) {
                    var Day = dateEvent.slice(0,2) 
                    var Month = dateEvent.slice(3,5)
                    var Year = dateEvent.slice(6) 
                    var finalDate = Day + Month + Year
                    log.debug('finalDate', finalDate)
                } else if(data_situacao_especial != null) {
                    var Day = data_situacao_especial.slice(0,2) 
                    var Month = data_situacao_especial.slice(3,5) 
                    var Year = data_situacao_especial.slice(6) 
                    var finalDate = Day + Month + Year
                    log.debug('finalDate', finalDate)
                }

                dimob.push({
                    reserved_header: '',
                    record_delimiter_header: '',

                    declaring_cnpj_r01: cnpj_declarante,
                    calendar_year_r01: ano_calendario,
                    rectifying_statement: declaracao_retificadora ,
                    receipt_number: numero_recibo,
                    special_situation: codigo_especial ==! '00' ? '1' : '0'  ,
                    date_event: finalDate,
                    special_situation_code: codigo_especial,
                    legalname: nome_empresarial,
                    responsible_cpf: responsavel,
                    mainaddress: end_contribuinte,
                    uf_r01: uf_contribuinte ,
                    taxpayer_municipality_code: cod_monicipio_contribuinte,
                    reserved1_r01: reservado,
                    reserved2_r01: '',
                    record_delimiter_r01: '',

                    declaring_cnpj_r03: '',
                    calendar_year_r03: ano_calendario ,
                    sequential_sale_r03: '',
                    cpf_cnpj_buyer_r03: '',
                    name_buyer_r03: '',
                    contract_number: '',
                    contract_date: '',
                    operation_value: '',
                    amount_year: '',
                    property_type_r03: '',
                    property_address_r03: '',
                    cep_r03: '',
                    property_code_r03: '',
                    reserved1_r03: '',
                    uf_r03: '',
                    reserved2_r03: '',
                    record_delimiter_r03: '',

                    declaring_cnpj_r04: '',
                    calendar_year_r04: ano_calendario ,
                    sequential_sale_r04: '',
                    cpf_cnpj_buyer_r04: '',
                    name_buyer_r04: '',
                    cpf_cnpj_seller: '',
                    name_seller: '',
                    contract_number: '',
                    contract_date: '',
                    sale_value: '',
                    commission_amount: '',
                    property_type_r04: '',
                    property_address_r04: '',
                    cep_r03: '',
                    property_code_r04: '',
                    reserved1_r04: '',
                    uf_r04: '',
                    reserved2_r04: '',
                    record_delimiter_r04: '',

                    reserved_t9: '',
                    record_delimiter_t9: '',
                
            })
            log.debug('DIMOB', dimob)
            var arr = dimob.length
            var dimobb = dimob
            

            if (dimob.length > 0){
                dimobb = dimob[arr-1]
                dimobb = [dimobb]
                log.debug('arr', dimob)
                
            }
            log.debug('arr2', dimobb)

            creat (dimobb)


        }) 
    } else {
        log.debug('Geração Dimob Iniciada')
        var dimob = []
        var Day = dateEvent.slice(0,2) 
        var Month = dateEvent.slice(3,5)
        var Year = dateEvent.slice(6) 
        var finalDate = Day + Month + Year
        log.debug('finalDate', finalDate)

        var receiptNumber = rectifyingStatement == '1' ? receiptNumber : receiptNumber = '0000000000'
        log.debug('receiptNumber', receiptNumber)

        dimob.push({
            reserved_header: '',
            record_delimiter_header: '',

            declaring_cnpj_r01: '',
            calendar_year_r01: Year,
            rectifying_statement: rectifyingStatement,
            receipt_number: receiptNumber,
            special_situation: '' ,
            date_event: finalDate,
            special_situation_code: specialSituationCode,
            legalname: '',
            responsible_cpf: '',
            mainaddress: '',
            uf_r01: '' ,
            taxpayer_municipality_code: '',
            reserved1_r01: '',
            reserved2_r01: '',
            record_delimiter_r01: '',

            declaring_cnpj_r03: '',
            calendar_year_r03: Year,
            sequential_sale_r03: '',
            cpf_cnpj_buyer_r03: '',
            name_buyer_r03: '',
            contract_number: '',
            contract_date: '',
            operation_value: '',
            amount_year: '',
            property_type_r03: '',
            property_address_r03: '',
            cep_r03: '',
            property_code_r03: '',
            reserved1_r03: '',
            uf_r03: '',
            reserved2_r03: '',
            record_delimiter_r03: '',

            declaring_cnpj_r04: '',
            calendar_year_r04: Year,
            sequential_sale_r04: '',
            cpf_cnpj_buyer_r04: '',
            name_buyer_r04: '',
            cpf_cnpj_seller: '',
            name_seller: '',
            contract_number: '',
            contract_date: '',
            sale_value: '',
            commission_amount: '',
            property_type_r04: '',
            property_address_r04: '',
            cep_r03: '',
            property_code_r04: '',
            reserved1_r04: '',
            uf_r04: '',
            reserved2_r04: '',
            record_delimiter_r04: '',

            reserved_t9: '',
            record_delimiter_t9: '',            
        })  

        log.debug('DIMOB', dimob)
        creat (dimob)
    }
    
      

        

        

        function validate(model) {
            const has = function(obj, prop) {
                return obj.hasOwnProperty(prop)
            }
            return function(data) { // Currying para permitir mapeamento dos dados
                const errors = [],
                    id = data.cod_fis_jur

                // Clona o objeto model para não ter problemas com ponteiros
                const retObj = JSON.parse(JSON.stringify(model))

                const line = Object.keys(model).map(function(k) { // Para cada chave no modelo
                        const isFloat = has(model[k], 'precision'),
                            hasData = has(data, k),
                            isHardcoded = has(model[k], 'hardcoded')

                        if (!hasData) { // Se não houver essa chave no objeto carregado 
                            if (isHardcoded) { // E se houver um dado chumbado no modelo
                                var value = model[k].hardcoded // Atribui o valor chumbado à value
                                while (value.length < model[k].length) // E enquanto o tamanho de value for menor que o valor
                                    value += ' ' // Cria um padding com espaço à direita
                                return value // E retorna esse valor já formatado
                            } else {
                                data[k] = '' // Ou usa '@' mesmo
                            }
                        }

                        // Força o cast de string
                        data[k] = String(data[k])
                        data[k] = data[k].replace('%', '')
                        const floats = []
                        if (floats.indexOf(k) != -1 && data[k] != '@' && hasData && isFloat) {
                            data[k] = padNumber(data[k], model[k])
                        }


                        const len = model[k].length

                        // Verifica se o tamanho do dado está de acordo com o modelo
                        const correctLength = (data[k].length <= len) || (isFloat && data[k].length <= model[k].precision + len)

                        // Verifica se existe dado em geral
                        const reallyHasData = data[k] !== '' && typeof data[k] !== 'undefined' && data[k] !== ' '

                        // Se o tamanho estiver incorreto adiciona a seguinte mensagem na array de erros
                        if (!correctLength) {
                            errors.push('Tamanho incorreto para o campo "' + k + '"')
                            return
                        }

                        // Se não houver dado em um campo obrigatório faz o mesmo
                        if (model[k].required && !reallyHasData) {
                            errors.push('Campo obrigatório "' + k + '"')
                            return
                        }

                        if (!reallyHasData)
                            data[k] = ''

                        // Padding à esquerda com espaços até o campo ter o tamanho previsto no modelo
                        while (data[k].length < model[k].length || (isFloat && data[k].length < model[k].precision + len))
                            data[k] += ' '


                        return data[k]
                    }).join('\t') // Concatena os campos com tab finalizando a edição da linha

                // Concatena os erros deixando o id interno do cliente no começo da linha
                const error_str = errors.length ? id + ' - ' + errors.join(' / ') : ''

                return {
                    data: line,
                    errors: error_str,
                }
            }
        }


        function formatData(data) {
            const res = { data: [], errors: [] }

            data.map(function(obj) {
                if (!obj.errors)
                    res.data.push(obj.data)
                else
                    res.errors.push(obj.errors)
            })

            res.data = res.data.join('\n')
            res.errors = res.errors.join('\n')

            return res
        }


        var link 
            function saveFile (opts) {
                const dataFile = file.create({
                    name: opts.name,
                    fileType: file.Type.PLAINTEXT,
                    contents: opts.data,
                    folder: opts.folder
                })
                link = file.load({ id: dataFile.save() }).url + '&_xd=T'
                
                return link
            }
            
            log.debug('download', link)
            

            
            
            function padding( value, size )
            {
                var pad = '';
                for( var i = 0; i < size; i++ ) {
                    pad += '0';
                }
                value = value.toString();
                return pad.substring( 0, pad.length - value.length ) + value;
            }

            

            function creat (dimob){
                if (dimobR01 == null) {
                    FOLDER_ID = 410
                }
               
                var date = new Date();
                const data = formatData(dimob.map(validate(model)))
                //log.debug('data', data.data)
                const url = { data: '', errors: '' }
                
            

                if (data.data) {
                    url.data = saveFile({
                        name: padding(date.getDate(),2)+''+padding((date.getMonth()+1),2)+''+padding(date.getHours(),2) + padding(date.getMilliseconds(),2)+'DIMOB.txt' ,
                        folder: FOLDER_ID,
                        data: data.data
                    })
                }
                if (data.errors) {
                    url.errors = saveFile({
                        name:  padding(date.getDate(),2)+''+padding((date.getMonth()+1),2)+''+padding(date.getHours(),2) + padding(date.getMilliseconds(),2)+ 'dados_invalidos.txt',
                        folder: FOLDER_ID,
                        data: data.errors
                    })
                } 
        }
        var usuario = runtime.getCurrentUser()
        var host = url.resolveDomain({hostType: url.HostType.APPLICATION});
        var emailUsuario = usuario.email

        var author = -5;
        var recipients  = emailUsuario
        log.audit('recipients', recipients);
        var subject = 'Arquivo Criado';
        var body


        if (dimobR01 != null) {
            body = 'O processamento do arquivo em massa selecionado foi encerrado com sucesso. Segue link para download: <a href="https://' + host + '/core/media/downloadfolder.nl?id=' +FOLDER_ID + '">Download</a>';
        } else {
            body = 'O processamento do arquivo selecionado foi encerrado com sucesso. Segue link para download: <a href="https://' + host + link + '">Download</a>';
        }

        email.send({
            author: author,
            recipients: recipients,
            subject: subject,
            body: body
        }); 

        if (dimobR01 != null){
            for (var i = 0; i< dimobR01.length; i++) {
                var objRecord = record.load({type: "customrecord_rsc_dimob_r01", id: i+2,})
                objRecord.setValue({
                    fieldId: 'custrecord_rsc_status_dimob',
                    value: 3,
                    ignoreFieldChange: true
                })
                objRecord.save()
            }
        }
        
    }


    function summarize(summary) {
        
    }

    return {
        getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    }
});
