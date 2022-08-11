/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @scriptName rsc-cnab-batch
 */
define([ 'N/search', 'N/runtime', './rsc-cnab-batch-dao', 'N/format', 'N/url', 'N/record', 'N/file', '../lib/rsc-cnab-constant' ],

    /**
     * @function
     * @param search
     * @param runtime
     * @param dao
     * @param format
     * @param url
     * @param Nrecord
     * @param file
     * @param _c
     * @return {{beforeLoad: beforeLoad}}
     */
    function( search, runtime, dao, format, url, Nrecord, file, _c )
    {
        /**
         * @function
         * @return {{generated: number, rejected: number, paid: number, title: string, confirmed: number}}
         */
        function label()
        {
            const language = runtime.getCurrentUser().getPreference({name: 'LANGUAGE'});
            return {
                title: ( language === 'pt_BR' ) ? 'Arquivo de Remessa - Contas à receber' : 'Batch File - Accounts Receivable',
                bankData: ( language === 'pt_BR' ) ? 'Dados Bancários' : 'Bank Data',
                inst: ( language === 'pt_BR' ) ? 'Parcelas' : 'Installments',
                installments: ( language === 'pt_BR' ) ? 'Seleção de Parcelas' : 'Installments Selection',
                generation: ( language === 'pt_BR' ) ? 'Geração' : 'Generation',
                subsidiary: ( language === 'pt_BR' ) ? 'Subsidiária' : 'Subsidiary',
                bankAccount: ( language === 'pt_BR' ) ? 'Conta Corrente' : 'Bank Account',
                select: ( language === 'pt_BR' ) ? 'Selecionar' : 'Select',
                startDate: ( language === 'pt_BR' ) ? 'Data de Vencimento Incial' : 'Start Due Date',
                endDate: ( language === 'pt_BR' ) ? 'Data de Vencimento Final' : 'End Due Date',
                filters: ( language === 'pt_BR' ) ? 'Filtros' : 'Filters',
                location: ( language === 'pt_BR' ) ? 'Localidade' : 'Location',
                vendor: ( language === 'pt_BR' ) ? 'Fornecedor' : 'Vendor',
                customer: ( language === 'pt_BR' ) ? 'Cliente' : 'Customer',
                batchData: ( language === 'pt_BR' ) ? 'Dados da Remessa' : 'Batch Data',
                paymentDate: ( language === 'pt_BR' ) ? 'Data do Pagamento' : 'Payment Date',
                tranId: ( language === 'pt_BR' ) ? 'Transação' : 'Transaction',
                instNu: ( language === 'pt_BR' ) ? 'Número Parcela' : 'Installment Number',
                entity: ( language === 'pt_BR' ) ? 'Entidade' : 'Entity',
                dueDate: ( language === 'pt_BR' ) ? 'Data de Vencimento' : 'Due Date',
                amount: ( language === 'pt_BR' ) ? 'Valor' : 'Amount',
                search: ( language === 'pt_BR' ) ? 'Buscar' : 'Search',
                alert: ( language === 'pt_BR' ) ? 'Alerta' : 'Alert',
                filtersMandatory: ( language === 'pt_BR' ) ? 'Por favor insira valor(es) para: Data de Vencimento Incial, Data de Vencimento Final, Status.' :
                    'Please enter value(s) for: Start Due Date, End Due Date, Status.',
                remove: ( language === 'pt_BR' ) ? 'Não é possível remover as parcelas.' : 'Can not remove installments.',
                interest: ( language === 'pt_BR' ) ? 'Juros' : 'Interest',
                fine: ( language === 'pt_BR' ) ? 'Multa' : 'Fine',
                rebate: ( language === 'pt_BR' ) ? 'Abatimento' : 'Rebate',
                discount: ( language === 'pt_BR' ) ? 'Desconto' : 'Discount',
                method: ( language === 'pt_BR' ) ? 'Forma de Pagamento' : 'Payment Method',
                selectAll: ( language === 'pt_BR' ) ? 'Selecionar Tudo' : 'Select All',
                unselectAll: ( language === 'pt_BR' ) ? 'Desmarcar Tudo' : 'Unselect All',
                noInstallments: ( language === 'pt_BR' ) ? 'Não há parcelas selecionadas!' : 'There are no installments selected!',
                message1: ( language === 'pt_BR' ) ? 'Remessa agendada com sucesso!' : 'Batch Scheduled Successfully!',
                message2: ( language === 'pt_BR' ) ? 'Clique no link abaixo para acompanhar o processamento.' :
                    'Click the link below to track the processing.',
                controller: ( language === 'pt_BR' ) ? 'Controlador' : 'Controller',
                cancelled: ( language === 'pt_BR' ) ? 'A remessa foi cancelada.' : 'Batch was cancelled.',
                statusDif: ( language === 'pt_BR' ) ? 'Há parcelas com status diferente de Disponível.' :
                    'There are installments with different status than Available.',
            };
        }

        /**
         * @function
         * @param recordId
         * @param text
         * @param recordType
         * @return {string}
         */
        function getLink( recordId, text, recordType )
        {
            const output = url.resolveRecord({
                recordType: recordType,
                recordId: recordId
            });
            return '<a href="' + output + '" target="_blank">'  + text + '</a>';
        }

        /**
         * @function
         * @param subsidiaryId
         * @param field
         */
        function insertJobOptions (field,subsidiaryId){
            if(Number (subsidiaryId)){
                var results = dao.getJobs( subsidiaryId );
                if( results.runPaged().count )
                {
                    results.run().each(function( result )
                    {
                        var name = result.getValue({name: 'companyname' });
                        field.insertSelectOption({ value: result.id, text: name });
                        return true;
                    });
                    return true;
                } else return false;
            } else return false;
        }

        // function insertJobOptions (field,subsidiaryId){
        //     if(Number (subsidiaryId)){
        //         var results = dao.getJobs( subsidiaryId );
        //         if( results.runPaged().count )
        //         {
        //             results.run().each(function( result )
        //             {
        //                 var name = result.getValue({name: 'name' });
        //                 field.insertSelectOption({ value: result.id, text: name });
        //                 return true;
        //             });
        //             return true;
        //         } else return false;
        //     } else return false;
        // }
        function getBankAccountJob(jobId, record){
            if( Number(jobId)){
                var results = dao.getBankAccountJob( jobId, record );
                if( results.runPaged().count ){
                    var resultados = results.run().getRange({
                        start:0,
                        end:1
                    })
                    console.log("resultados", resultados)
                    return resultados[0].id
                }else{
                    alert('Não existe uma conta corrente principal deste empreendimento')
                }
            }
        }
        
        function insertBankAccountOptions( subsidiaryId, field )
        {
            if( Number(subsidiaryId) )
            {
                var results = dao.getBankAccounts( subsidiaryId );
                if( results.runPaged().count )
                {
                    results.run().each(function( result )
                    {
                        var name = result.getValue({name: 'name' });
                        field.insertSelectOption({ value: result.id, text: name });
                        return true;
                    });
                    return true;
                } else return false;
            } else return false;
        }

        /**
         * @function
         * @param field
         */
        function clearFieldOptions( field )
        {
            field.removeSelectOption({ value: null });
            field.insertSelectOption({ value: ' ', text: ' ' });
        }

        /**
         * @function
         * @param bankAccountId
         * @param field
         */
        function insertLayoutOptions( bankAccountId, field )
        {
            if( Number(bankAccountId) )
            {
                var ba = dao.getBankAccountFields( bankAccountId );
                var results = dao.getLayouts( ba.bank, _c._operation.batch, ba._240, ba._400, _c._layout._240, _c._layout._400 );
                if( results.runPaged().count )
                {
                    results.run().each(function( result )
                    {
                        var name = result.getValue({name: 'name' });
                        field.insertSelectOption({ value: result.id, text: name });
                        return true;
                    });
                    return true;
                } else return false;
            } else return false;
        }

        /**
         * @function
         * @param startDate
         * @param endDate
         * @param status
         * @param bankAccount
         * @param vendor
         * @param customer
         * @param layoutId
         * @param record
         */
        function getInstallments( startDate, endDate,  bankAccount, vendor, customer, layoutId, record , subsidiary)
        {
            var layout = dao.getLayoutFields( layoutId );
            var tranType = 'invoice';
            startDate = format.format({ value: startDate, type: format.Type.DATE });
            endDate = format.format({ value: endDate, type: format.Type.DATE });

            const installmentColumns = {
				tranId: { name: 'tranid', join: 'custbody_lrc_fatura_principal' },
				entity: { name: 'entity' },
				method: { name: 'custbody_rsc_cnab_inst_paymentmetho_ls' },
				installment: { name: 'tranid' },
				dueDate: { name: 'duedate' },
				status: { name: 'custbody_rsc_cnab_inst_status_ls' },
				amount: { name: 'amount' },
				interest: { name: 'custbody_rsc_cnab_inst_interest_cu' },
				fine: { name: 'custbody_rsc_cnab_inst_fine_cu' },
				discount: { name: 'custbody_rsc_cnab_inst_discount_cu' }
			}

            var results = dao.getInstallments( startDate, endDate,  tranType, bankAccount, vendor || customer, installmentColumns , subsidiary);
            console.log('results', results)
            var arrayDuplic = [];
            var adc = true;
            var valida = results.run().getRange({
                start: 0,
                end: 1
            })
            if(!valida[0]){
                alert("Nenhum registro encontrado");
            }
			results.run().each(function( result )
			{
                console.log('arrayDuplic.lenght', result.getValue(installmentColumns.installment))
                for(var i = 0; i < arrayDuplic.length; i++){
                    if(arrayDuplic[i] == result.getValue(installmentColumns.installment)){
                        adc = false;
                    }else{
                        adc =true
                    }
                }
				record.selectNewLine({ sublistId: 'list' });

                if(adc){
                    arrayDuplic.push(result.getValue(installmentColumns.installment));
                    const fieldValues = {
                        select: true,
                        id: result.id,
                        tranid: result.getValue(installmentColumns.tranId),
                        entity: result.getValue(installmentColumns.entity),
                        entitytext: result.getText(installmentColumns.entity),
                        method: result.getValue(installmentColumns.method),
                        methodtext: result.getText(installmentColumns.method),
                        installment: result.getValue(installmentColumns.installment),
                        duedate: format.parse({ value: result.getValue(installmentColumns.dueDate), type: format.Type.DATE }),
                        statusins: result.getValue(installmentColumns.status),
                        amount: result.getValue(installmentColumns.amount),
                        delete: false,
                        origin: result.getValue(installmentColumns.amount),
                        transactionid: result.id,
                        interest: result.getValue(installmentColumns.interest),
                        fine: result.getValue(installmentColumns.fine),
                        discount: result.getValue(installmentColumns.discount)
                    };
                    var linhasAtuais = record.getLineCount({
						sublistId:'list'
					})
					var adicionar = true;
					for(var k = 0; k < linhasAtuais; k++){
						var installmentAtual = record.getSublistValue({
							sublistId: 'list',
							fieldId: 'installment',
							line: k
						})
						if(installmentAtual == result.getValue(installmentColumns.installment)){
							adicionar = false;
						}
					}
					if(adicionar){
                        Object.keys(fieldValues)
                        .forEach(function (fieldId) {
                            const fieldValue = fieldValues[fieldId];
                            if (!fieldValue) return;
                            record.setCurrentSublistValue({
                                sublistId: 'list',
                                fieldId: fieldId,
                                value: fieldValues[fieldId],
                                ignoreFieldChange: true
                            });
                        });
    
                        record.commitLine({ sublistId: 'list' });
                    }
                    
                }
			
				return true;
			});
        }

        /**
         * @function
         * @param record
         * @param numLines
         */
        function clearInstallments( record, numLines )
        {
            for( var i = numLines; i > 0; i-- )
            {
                record.selectLine({ sublistId: 'list', line: i-1 });
                record.setCurrentSublistValue({ sublistId: 'list', fieldId: 'delete', value: true, ignoreFieldChange: true });
                record.commitLine({ sublistId: 'list' });
                record.removeLine({ sublistId: 'list', line: i-1, ignoreRecalc: true });
            }
        }

        /**
         * @function
         * @param subsidiaryId
         * @param field
         */
        function addBankAccountOptions( subsidiaryId, field )
        {
            if( Number(subsidiaryId) )
            {
                var results = dao.getBankAccounts( subsidiaryId );
                if( results.runPaged().count )
                {
                    results.run().each(function( result )
                    {
                        var name = result.getValue({name: 'name' });
                        field.addSelectOption({ value: result.id, text: name });
                        return true;
                    });
                }
            }
        }

        /**
         * @function
         * @param bankAccountId
         * @param field
         */
        function addLayoutOptions( bankAccountId, field )
        {
            if( Number(bankAccountId) )
            {
                var ba = dao.getBankAccountFields( bankAccountId );
                var results = dao.getLayouts( ba.bank, _c._operation.batch, ba._240, ba._400, _c._layout._240, _c._layout._400 );
                if( results.runPaged().count )
                {
                    results.run().each(function( result )
                    {
                        var name = result.getValue({name: 'name' });
                        field.addSelectOption({ value: result.id, text: name });
                        return true;
                    });
                }
            }
        }

        /**
         * @function
         * @param record
         * @param select
         */
        function markAll( record, select )
        {
            var count = record.getLineCount({ sublistId: 'list' });

            for( var i = 0; i < count; i++ )
            {
                record.selectLine({ sublistId: 'list', line: i });
                record.setCurrentSublistValue({ sublistId: 'list', fieldId: 'select', value: select, ignoreFieldChange: true });
                record.commitLine({ sublistId: 'list' });
            }
        }

        /**
         * @function
         * @param layoutId
         * @return {{transaction: string, entity: string}}
         */
        function getRecordTypes( layoutId )
        {
            const layout = dao.getLayoutFields( layoutId );
            switch( Number(layout.cnabType) )
            {
                case _c._type.payment:
                    return {
                        transaction: 'custompurchase_rsc_financiamento_pag',
                        entity: 'vendor',
                        cnabType: _c._type.payment
                    };
                case _c._type.billing:
                    return {
                        transaction: 'customsale_rsc_financiamento',
                        entity: 'customer',
                        cnabType: _c._type.billing
                    };
            }
        }

        /**
         * @function
         * @param record
         * @param line
         */
        function setAmount( record, line )
        {
            record.selectLine({ sublistId: 'list', line: line });

            var interest = record.getCurrentSublistValue({ sublistId: 'list', fieldId: 'interest' });
            var fine = record.getCurrentSublistValue({ sublistId: 'list', fieldId: 'fine' });
            var rebate = record.getCurrentSublistValue({ sublistId: 'list', fieldId: 'rebate' });
            var discount = record.getCurrentSublistValue({ sublistId: 'list', fieldId: 'discount' });
            var origin = record.getCurrentSublistValue({ sublistId: 'list', fieldId: 'origin' });

            interest = ( interest ) ? parseFloat(interest) : 0;
            fine = ( fine ) ? parseFloat(fine) : 0;
            rebate = ( rebate ) ? parseFloat(rebate) : 0;
            discount = ( discount ) ? parseFloat(discount) : 0;
            var amount = parseFloat( origin ) + interest + fine - rebate - discount;

            record.setCurrentSublistValue({ sublistId: 'list', fieldId: 'amount', value: amount, ignoreFieldChange: true });
        }

        /**
         * @function
         * @param installments
         * @param layout
         */
        function createController( installments, layout )
        {
            var id = Object.keys( installments );
            var contr = Nrecord.create({ type: 'customrecord_rsc_cnab_controller' });
            contr.setValue({ fieldId: 'custrecord_rsc_cnab_cont_status_ls', value: _c._controller.processing });
            contr.setValue({ fieldId: 'custrecord_rsc_cnab_cont_cnabtype_ls', value: layout.cnabType });
            contr.setValue({ fieldId: 'custrecord_rsc_cnab_cont_operation_ls', value: _c._operation.batch });
            contr.setValue({ fieldId: 'custrecord_rsc_cnab_cont_installments_ds', value: id.toString() });
            return contr.save();
        }

        /**
         * @function
         * @param request
         * @return {boolean}
         */
        function getInstallmentsList( request )
        {
            var lines = request.getLineCount({ group: 'list' });
            var count = 0;
            var diferent = false;
            var installments = {};

            for( var i=0; i < lines; i++ )
            {
                if( request.getSublistValue({ group: 'list', name: 'select', line: i }) === 'T' )
                {
                    count++;
                    var id = request.getSublistValue({ group: 'list', name: 'id', line: i });
                    var _status = request.getSublistValue({ group: 'list', name: 'statusins', line: i });
                    var recordType = JSON.parse( request.parameters.recordtype );
                    installments[ id ] = {};
                    installments[ id ].paymentDate = request.parameters.paymentdate;
                    installments[ id ].bankAccount = request.parameters.custpage_bankaccount;
                    installments[ id ].layout = 2;
                    installments[ id ].transactionType = 'invoice';
                    installments[ id ].entityType = request.parameters.custpage_entitytype;
                    installments[ id ].cnabType = recordType.cnabType;
                    installments[ id ].interest = request.getSublistValue({ group: 'list', name: 'interest', line: i });
                    installments[ id ].fine = request.getSublistValue({ group: 'list', name: 'fine', line: i });
                    installments[ id ].rebate = request.getSublistValue({ group: 'list', name: 'rebate', line: i });
                    installments[ id ].discount = request.getSublistValue({ group: 'list', name: 'discount', line: i });
                    installments[ id ].amount = request.getSublistValue({ group: 'list', name: 'amount', line: i });
                    installments[ id ].transaction = request.getSublistValue({ group: 'list', name: 'transactionid', line: i });
                    if( Number(_status) !== _c._status.available ) {
                        diferent = true;
                    }
                }
            }
            return {
                hasInstallments: count !== 0,
                hasDiferent: diferent,
                installments: installments
            };
        }

        /**
         * @function Set transaction installments values
         * @param transaction
         * @param installment
         */
        function setInstallmentValue( transaction, installment )
        {
            var interest = ( installment.interest ) ? parseFloat( installment.interest ).toFixed(2) : 0;
            var fine = ( installment.fine ) ? parseFloat( installment.fine ) : 0;
            var rebate = ( installment.rebate ) ? parseFloat( installment.rebate ) : 0;
            var discount = ( installment.discount ) ? parseFloat( installment.discount ) : 0;
            var ourNumber = ( installment.ourNumber ) ? parseFloat( installment.ourNumber ) : 0;

			// transaction.setValue({
			// 	fieldId: '',
			// 	value: format.parse({ type: format.Type.DATE, value: installment.paymentDate })
			// });

			transaction.setValue({ fieldId: 'custbody_rsc_cnab_inst_interest_cu', value: interest });
			transaction.setValue({ fieldId: 'custbody_rsc_cnab_inst_fine_cu', value: fine });
			transaction.setValue({ fieldId: 'custbody_rsc_cnab_inst_discount_cu', value: rebate + discount });
			transaction.setValue({ fieldId: 'custbody_rsc_cnab_inst_status_ls', value: _c._status.generated });

            transaction.save({ ignoreMandatoryFields: true });
        }

        /**
         * @function
         * @param value
         * @param size
         * @return {string}
         */
        function padding( value, size )
        {
            var pad = '';
            for( var i = 0; i < size; i++ ) {
                pad += '0';
            }
            value = value.toString();
            return pad.substring( 0, pad.length - value.length ) + value;
        }

        /**
         * @function
         * @param number
         * @return {number}
         */
        function modulo10( number )
        {
            var total = 0;
            var factor = 2;
            for( var i = number.length - 1; i >= 0; i-- )
            {
                var temp = ( parseInt(number[i]) * factor ).toString();
                var sum = 0;
                for( var j = 0; j < temp.length; j++ ) {
                    sum += parseInt( temp[j] );
                }
                total += sum;
                factor = ( factor === 2 ) ? 1 : 2;
            }
            var rest = total % 10;
            return ( rest === 0 ) ? 0 : ( 10 - rest );
        }

        function getOurnumberdigit(account, ourNumber) {
            const portfolio = search.lookupFields
            ({
                type: 'customrecord_rsc_cnab_portfolio',
                id: account.getValue({fieldId: "custrecord_rsc_cnab_ba_portfolio_ls"}),
                columns: 'custrecord_rsc_cnab_portfolio_number_nu'
            }).custrecord_rsc_cnab_portfolio_number_nu
            const number = account.getValue({fieldId: "custrecord_rsc_cnab_ba_agencynumber_ls"}) + '' + account.getValue({fieldId: "custrecord_rsc_cnab_ba_number_ds"}) + '' + portfolio + '' + padding(ourNumber,8);
            const ournumberdigit = modulo10(number)
            return ournumberdigit
        }

        /**
         * @function
         * @param t - transaction object
         * @param line - installment line
         * @param installmentId
         * @param entityType
         * @param layoutId
         * @return {{installment fields}}
         */
        function getInstallmentValue( t, line, installmentId, entityType, layoutId , accountjob)
        {
            log.debug('entrou',' getinstallments');
        	const accountId = accountjob;
			const account = Nrecord.load({ type: 'customrecord_rsc_cnab_bankaccount', id: accountId, isDynamic: true });
            const lastNumberAccount = account.getValue({ fieldId: 'custrecord_rsc_cnab_ba_number_ds' });
            const complementolastNumberAccount = lastNumberAccount.substring(8,9).toString();
			const ourNumber = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_ournumber_nu' });
            const ournumberdigit = getOurnumberdigit(account, ourNumber)
			const layout = dao.getLayoutFields( layoutId )
            log.debug('entrou',' dps contas');
            var interest = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_interest_cu' });
            var fine = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_fine_cu' });
            var dueDate = t.getValue({ fieldId: 'duedate' });
            var period = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_calcperiod_dt' });
            var paymentDate = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_paymentdate_dt' });
            var amount = t.getValue({ fieldId: 'total' });
            var discount = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_discount_cu' });
            var paymentMethod = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_paymentmetho_ls' });
            var serviceType = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_servicetype_ls' });
            var ba = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_bankaccount_ls' });
            var barcode = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_barcode_ds' });
            var specie = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_specie_ls' });
            var instruction1 = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_1instruction_ls' });
            var instruction2 = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_2instruction_ls' });
          	var CnpjCpf = t.getValue({ fieldId: 'custbody_rsc_cnab_inst_typecpfcnpj_nu' });
            log.debug('entrou',' dps T');
            var setup = getSetup();
            var baLocation = {};
            getBankAccount( accountjob, entityType, baLocation, setup );
            log.debug('entrou',' dps getAccount');
            var paymentOption = getPaymentOption( t.getValue({ fieldId: 'custbody_rsc_cnab_inst_paymentoptio_ls'}) );
            paymentMethod = ( paymentMethod ) ? getPaymentMethod( dao.getPaymentMethodFields(paymentMethod)) : '';
            serviceType = ( serviceType ) ? dao.getSegmentTypeFields( serviceType ).code : '';
            log.debug('entrou',' dps getAccount 22');
            barcode = ( barcode ) ? getBarcodeValues( barcode, paymentMethod.segment.text, interest, fine, baLocation.custrecord_rsc_cnab_bank_code_ds ) : '';
            specie = ( specie ) ? dao.getSpecieFields( specie ) : '';
            instruction1 = ( instruction1 ) ? dao.getInstructionFields( instruction1 ) : 0 ;
            instruction2 = ( instruction2 ) ? dao.getInstructionFields( instruction2 ) : 0 ;
            log.debug('ba',ba);
            var bankAccount = {};
            if( ba ) {
                getBankAccount( ba, entityType, bankAccount, setup );
            } else {
                var entityId = t.getValue({ fieldId: 'entity' });
                getEntity( entityId, 'customer', bankAccount, setup );
            }
            
           if( Number(layout.cnabType) === _c._type.payment ){
                if( (paymentMethod.custrecord_rsc_cnab_pm_code_ds !== '03'
                    && paymentMethod.custrecord_rsc_cnab_pm_code_ds !== '43'
                    && paymentMethod.custrecord_rsc_cnab_pm_code_ds !== '41')
                    && paymentMethod.segment.text === 'A' )
                {
                    paymentMethod.custrecord_rsc_cnab_ba_dvagencynumber_ds = bankAccount.custrecord_rsc_cnab_ba_dvagencynumber_ds;
                } else if( paymentMethod.segment.text === 'A' )
                {
                    paymentMethod.custrecord_rsc_cnab_ba_dvagencynumber_ds = '';
                }
            }

            return {
                internalid: installmentId,
                amount: ( amount ) ? parseFloat( amount ).toFixed(2) : '',
                duedate: ( dueDate ) ? format.format({ value: dueDate, type: format.Type.DATE }) : '',
                installmentnumber: t.getValue({ fieldId: 'installmentnumber' }),
                custrecord_rsc_cnab_inst_status_ls: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_status_ls' }),
                custrecord_rsc_cnab_inst_bank_ls: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_bank_ls' }),
                custrecord_rsc_cnab_inst_paymentmetho_ls: paymentMethod,
                custrecord_rsc_cnab_inst_bankaccount_ls: bankAccount,
                custrecord_rsc_cnab_inst_servicetype_ls: serviceType,
                custrecord_rsc_cnab_inst_forecastacc_ls: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_forecastacc_ls' }),
                custrecord_rsc_cnab_inst_discount_cu: ( discount ) ? parseFloat( discount ).toFixed(2) : '',
                custrecord_rsc_cnab_inst_barcode_ds: barcode,
                custrecord_rsc_cnab_inst_paymentcode_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_paymentcode_nu' }),
                custrecord_rsc_cnab_inst_monthyearcom_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_monthyearcom_nu' }),
                custrecord_rsc_cnab_inst_taxpayeriden_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_taxpayeriden_nu' }),
                custrecord_rsc_cnab_inst_othervalue_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_othervalue_nu' }),
                custrecord_rsc_cnab_inst_monetaryupda_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_monetaryupda_nu' }),
                custrecord_rsc_cnab_inst_taxpayername_ds: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_taxpayername_ds' }),
                custrecord_rsc_cnab_inst_revenuecode_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_revenuecode_nu' }),
                // custrecord_rsc_cnab_inst_typecpfcnpj_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_typecpfcnpj_nu' }),
                custrecord_rsc_cnab_inst_typecpfcnpj_nu: CnpjCpf,
              	custrecord_rsc_cnab_inst_taxpayer_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_taxpayer_nu' }),
                custrecord_rsc_cnab_inst_calcperiod_dt: ( period ) ? format.format({ value: period, type: format.Type.DATE }) : '',
                custrecord_rsc_cnab_inst_interest_cu: ( interest ) ? parseFloat( interest ).toFixed(2) : '',
                custrecord_rsc_cnab_inst_fine_cu: ( fine ) ? parseFloat( fine ).toFixed(2) : '',
                custrecord_rsc_cnab_inst_grossrevenue_cu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_grossrevenue_cu' }),
                custrecord_rsc_cnab_inst_grossrevenue_pe: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_grossrevenue_pe' }),
                custrecord_rsc_cnab_inst_stateregistr_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_stateregistr_nu' }),
                custrecord_rsc_cnab_inst_docnumber_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_docnumber_nu' }),
                custrecord_rsc_cnab_inst_typecnpjcei_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_typecnpjcei_nu' }),
                custrecord_rsc_cnab_inst_actdebtlabel_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_actdebtlabel_nu' }),
                custrecord_rsc_cnab_inst_year_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_year_nu' }),
                custrecord_rsc_cnab_inst_renavam9_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_renavam9_nu' }),
                custrecord_rsc_cnab_inst_state_ls: t.getText({ fieldId: 'custbody_rsc_cnab_inst_state_ls' }),
                custrecord_rsc_cnab_inst_citycode_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_citycode_nu' }),
                custrecord_rsc_cnab_inst_platenumber_ds: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_platenumber_ds' }),
                custrecord_rsc_cnab_inst_paymentoptio_ls: paymentOption,
                custrecord_rsc_cnab_inst_renavam12_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_renavam12_nu' }),
                custrecord_rsc_cnab_inst_fgtsident_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_fgtsident_nu' }),
                custrecord_rsc_cnab_inst_seal_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_seal_nu' }),
                custrecord_rsc_cnab_inst_sealdv_nu: t.getValue({ fieldId: 'custbody_rsc_cnab_inst_sealdv_nu' }),
                custrecord_rsc_cnab_inst_paymentdate_dt: ( paymentDate ) ? format.format({ value: paymentDate, type: format.Type.DATE }) : '',
                custrecord_rsc_cnab_inst_locationba_ls: baLocation,
                custrecord_rsc_cnab_inst_specie_ls: specie,
                custrecord_rsc_cnab_inst_1instruction_ls: instruction1 ,
                custrecord_rsc_cnab_inst_2instruction_ls: instruction2 ,
                //custrecord_rsc_cnab_inst_1instruction_ls: instruction1,
                //custrecord_rsc_cnab_inst_2instruction_ls: instruction2,
                custrecord_rsc_cnab_inst_ournumber_nu: ourNumber,
                ournumberdigit: generateOurNumberDigit( ourNumber, baLocation.custrecord_rsc_cnab_portfolio_number_nu ),
                ournumberdigititau: ournumberdigit,
                complementoCC: complementolastNumberAccount
            }
        }

        /**
         * @function
         * @param pm
         * @return {*}
         */
        function getPaymentMethod( pm )
        {
            if( pm.custrecord_rsc_cnab_pm_code_ds === '03' && pm.segment.text === 'A' ) {
                pm.centralizingChamberCode = '700';
              	pm.PurposeDetail = 'CC';
              	pm.PurposeDetailDoc = '01';
            } else if( (pm.custrecord_rsc_cnab_pm_code_ds === '43' || pm.custrecord_rsc_cnab_pm_code_ds === '41') && pm.segment.text === 'A' ) {
                pm.centralizingChamberCode = '018';
              	pm.PurposeDetail = 'CC';
              	pm.PurposeDetailTed = '00005';
            }
            return pm;
        }

        /**
         * @function
         * @param bankAccountId
         * @param entityType
         * @param obj
         * @param setup
         */
        function getBankAccount( bankAccountId, entityType, obj, setup )
        {
            log.debug('inicio', 'getAccount');
            var results = dao.getBankAccountsById( bankAccountId, setup.cnpj, setup.cpf );

            var result = results.run().getRange({ start: 0, end: 1 });
            var locationId = result[0].getValue({name: 'custrecord_rsc_cnab_ba_location_ls' });
            var entityId = result[0].getValue({name: 'custrecord_rsc_cnab_ba_entity_ls' });
            //var complementoCC
            obj.custrecord_rsc_cnab_ba_number_ds = result[0].getValue({name: 'custrecord_rsc_cnab_ba_number_ds' });
            //**trecho para pegar o ultimo numero da conta corrente do Santander **//
            //var complementoCC = (obj.custrecord_rsc_cnab_ba_number_ds = result[0].getValue({name: 'custrecord_rsc_cnab_ba_number_ds' }).substring(8,9).toString());
            //*** Fim  **/
            //log.debug({title:'complementoCC',details:complementoCC});
            obj.custrecord_rsc_cnab_ba_dvnumber_ds = result[0].getValue({name: 'custrecord_rsc_cnab_ba_dvnumber_ds' });
            obj.custrecord_rsc_cnab_ba_agencynumber_ls = result[0].getValue({name: 'custrecord_rsc_cnab_ba_agencynumber_ls' });
            obj.custrecord_rsc_cnab_ba_dvagencynumber_ds = result[0].getValue({name: 'custrecord_rsc_cnab_ba_dvagencynumber_ds' });
            obj.custrecord_rsc_cnab_ba_agreement_ds = result[0].getValue({name: 'custrecord_rsc_cnab_ba_agreement_ds' });
            obj.custrecord_rsc_cnab_portfolio_code_ds = result[0].getValue({name: 'custrecord_rsc_cnab_portfolio_code_ds',
                join: 'custrecord_rsc_cnab_ba_portfolio_ls'});
            obj.custrecord_rsc_cnab_portfolio_number_nu = result[0].getValue({name: 'custrecord_rsc_cnab_portfolio_number_nu',
                join: 'custrecord_rsc_cnab_ba_portfolio_ls'});
            obj.custrecord_rsc_cnab_bank_code_ds = result[0].getValue({name: 'custrecord_rsc_cnab_bank_code_ds', join: 'custrecord_rsc_cnab_ba_bank_ls'});
            obj.custrecord_rsc_cnab_bank_sequecial_nu = result[0].getValue({name: 'custrecord_rsc_cnab_bank_sequecial_nu',
                join: 'custrecord_rsc_cnab_ba_bank_ls'});
            obj.bankId = result[0].getValue({name: 'internalid', join: 'custrecord_rsc_cnab_ba_bank_ls'});
            obj.bankName = result[0].getValue({name: 'name', join: 'custrecord_rsc_cnab_ba_bank_ls'});
            log.debug('antes', 'ifs');
            // if( entityType === 'vendor' ) {
            //     obj.folder = result[0].getValue({name: 'custrecord_rsc_cnab_bank_pbatchfolder_nu', join: 'custrecord_rsc_cnab_ba_bank_ls'});
            // } else {
            //     obj.folder = result[0].getValue({name: 'custrecord_rsc_cnab_bank_bbatchfolder_nu', join: 'custrecord_rsc_cnab_ba_bank_ls'});
            // }

            if( locationId ) {
                getLocation( locationId, obj, setup );
            }
            if( entityId ) {
                getEntity( entityId, entityType, obj, setup );
            }
        }

        /**
         * Calcula o dígito de auto-conferência do Nosso Número | Específico para o banco Bradesco
         *
         * Para o cálculo do dígito, acrescentar o número da carteira à esquerda antes do Nosso Número, e aplicar o módulo 11, com base 7.
         * A diferença entre o divisor menos o resto será o dígito de auto-conferência.
         * Se o resto da divisão for “1”, desprezar a diferença entre o divisor menos o resto que será “10” e considerar o dígito como “P”.
         * Se o resto da divisão for “0”, desprezar o cálculo de subtração entre divisor e resto, e considerar o “0” como dígito.
         *
         * @param ourNumber
         * @param portfolio
         * @return {string|number}
         */
        function generateOurNumberDigit( ourNumber, portfolio )
        {
            var number = padding(Number(portfolio), 2 )+''+padding( ourNumber, 11 );
            var base = 7;
            var sum = 0;
            var factor = 2;

            for( var i = number.length - 1; i >= 0; i-- )
            {
                var partial = parseInt( number[i] ) * factor;
                sum += partial;
                if( factor === base ) {
                    factor = 1;
                }
                factor++;
            }
            var digit = sum % 11;
            if( digit ===  1) {
                return 'P';
            } else if( digit === 0 ) {
                return 0;
            } else {
                return 11 - digit;
            }
        }

        /**
         * @function
         * @param bankId
         */
        function updateSequentialBank( bankId )
        {
            var bank = Nrecord.load({ type: 'customrecord_rsc_cnab_bank', id: bankId, isDynamic: true });
            var sequential = bank.getValue({ fieldId: 'custrecord_rsc_cnab_bank_sequecial_nu' });
            bank.setValue({ fieldId: 'custrecord_rsc_cnab_bank_sequecial_nu', value: sequential+1 });
            bank.save();
        }

        /**
         * @function
         * @param locationId
         * @param obj
         * @param setup
         * @return {{zip: string, number: string, city: string, street: string, state: string, complement: string}}
         */
        function getLocation( locationId, obj, setup )
        {
            var location = Nrecord.load({ type: 'location', id: locationId, isDynamic: true });

            obj.custrecord_rsc_cnab_location_cnpj_ds = ( setup.locationCnpj ) ? location.getValue({ fieldId: setup.locationCnpj }) : '';
            obj.name = ( setup.legalName ) ? location.getValue({ fieldId: setup.legalName }) : '';
            obj.custrecord_rsc_cnab_location_cnpj_ds = String(obj.custrecord_rsc_cnab_location_cnpj_ds).replace( /[.\-\/]/gi, '' );
			obj.registry_type = ( obj.custrecord_rsc_cnab_location_cnpj_ds.length === 14 ) ? 2 : 1;
            var mainAddress = location.getSubrecord({ fieldId: 'mainaddress' });
            getSubRecordAddress( mainAddress, obj, setup );
        }

        /**
         * @function
         * @param entityId
         * @param entityType
         * @param obj
         * @param setup
         * @return {}
         */
        function getEntity( entityId, entityType, obj, setup )
        {
            var entity = Nrecord.load({ type: entityType, id: entityId, isDynamic: true });
            var cnpj = entity.getValue({ fieldId: setup.cnpj });
            var cpf = entity.getValue({ fieldId: setup.cpf });

            obj.custrecord_rsc_cnab_ba_entity_ls = entity.getValue({ fieldId: 'entityid' });
            obj.custentity_psg_br_cpf = cnpj || cpf;
            obj.custentity_psg_br_cpf = String(obj.custentity_psg_br_cpf).replace( /[.\-\/]/gi, '' );
            //AJUSTADO PARA BUSCAR RAZÃO SOCIAL
            obj.custentity_enl_legalname = entity.getValue({ fieldId: 'custentity_enl_legalname' });
            //FIM
            obj.registry_type = ( obj.custentity_psg_br_cpf.length === 14 ) ? 2 : 1;

            var lines = entity.getLineCount({ sublistId: 'addressbook' });

            for( var i=0; i < lines; i++ )
            {
                entity.selectLine({ sublistId: 'addressbook', line: i });
                if( entity.getCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling' }) )
                {
                    var addressBook = entity.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
                    getSubRecordAddress( addressBook, obj, setup );
                    break;
                }
            }
        }

        /**
         * @function
         * @param address
         * @param obj
         * @param setup
         * @return {{zip: string, number: string, city: string, street: string, state: string, complement: string}}
         */
        function getSubRecordAddress( address, obj, setup )
        {
            log.audit('getSubRecordAddress', {address: address});
            log.audit('getSubRecordAddress', {obj: obj}); 
            log.audit('getSubRecordAddress', {setup: setup}); 
            // var zip = address.getValue({ fieldId: 'zip' });
            var zip = address.getValue({ fieldId: 'zip' }).replace(/\D/g, '');
			var state = address.getText({ fieldId: setup.state });
            var city = ( setup.city ) ? address.getText({ fieldId: setup.city }) : '';
            var addressType = ( setup.addressType ) ? address.getText({ fieldId: setup.addressType }) : '';
            var street = address.getValue({ fieldId: 'addr1' });
          	var districtnew  = address.getValue({ fieldId: 'addr3' });
            var number = ( setup.number ) ? address.getValue({ fieldId: setup.number }) : '';
            var complement = ( setup.complement ) ? address.getValue({ fieldId: setup.complement }) : '';
            var district = ( setup.district ) ? address.getValue({ fieldId: setup.district }) : '';
            addressType = ( addressType ) ? addressType : '';
            street = ( street ) ? street : '';

            if( city ) {
                if( city.indexOf('-') > -1 ) {
                    city = city.substr(0, city.indexOf('-')).trim();
                }
            } else {
                city = '';
            }

            obj.custrecord_rsc_cep = ( zip ) ? zip : '';
            obj.custrecord_rsc_estado = ( state ) ? state : '';
            obj.custrecord_rsc_municipio = city;
            obj.custrecord_rsc_rua = addressType + street + ' ' + number;
            //obj.custrecord_rsc_rua = addressType +' '+ street;
            obj.custrecord_rsc_numero = ( number ) ? number : '';
            obj.custrecord_rsc_complemento = ( complement ) ? complement : '';
            //obj.custrecord_sit_address_t_bairro = ( district ) ? district : '';
          	obj.custrecord_sit_address_t_bairro = ( districtnew ) ? districtnew : '';
            log.audit('getSubRecordAddress', {obj: obj});
        }

        /**
         * @function
         * @return {{number: string, city: string, addressType: string, district: string, cpf: string, cnpj: string, complement: string}}
         */
        function getSetup()
        {
            var result = dao.getFieldsSetup();
            var setup = result.run().getRange({ start: 0, end: 1 });
            return {
				state: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_state_ds' }),
                city: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_city_ds' }),
                district: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_district_ds' }),
                addressType: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_addresstype_ds' }),
                number: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_number_ds' }),
                complement: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_complement_ds' }),
                cnpj: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_entitycnpj_ds' }),
                cpf: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_entitycpf_ds' }),
                locationCnpj: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_locationcnpj_ds' }),
                legalName: setup[0].getValue({ name: 'custrecord_acs_cnab_fs_legalname_ds' })
            }
        }

        /**
         * @function
         * @param id
         * @return {{}|{custrecord_rsc_cnab_po_code_ds: *, custrecord_rsc_cnab_po_state_ls: *}}
         */
        function getPaymentOption( id )
        {
            if( id ) {
                return dao.getPaymentOptionFields( id );
            } else {
                return {};
            }
        }

        /**
         * @function
         * @param barcode
         * @param _segment
         * @param interest
         * @param fine
         * @return {}
         */
        function getBarcodeValues( barcode, _segment, interest, fine, bankCode )
        {
            var obj = {};
            if( barcode )
            {
                barcode = barcode.replace( /[^0-9]/g, '' );
                if( _segment === 'J' )
                {
                    obj = getBarcodeValuesBoleto( barcode );
                }
                else if( _segment === 'O' )
                {
                    obj = getBarcodeValuesConcessionaria( barcode, bankCode );
                }
                obj.increase = sumIncrease( interest, fine );
            }
            return obj;
        }

        /**
         * @function
         * @param barcode
         * @return {{bank: string, amount: string, due: string, currency: string, freeField: string, barcode: string, digit: string}}
         */
        function getBarcodeValuesBoleto( barcode )
        {
            if( barcode.length < 47 ) {
                barcode = barcode + '00000000000'.substr( 0, (47 - barcode.length) );
            }
            barcode = barcode.substr(0,4) + barcode.substr(32,15) + barcode.substr(4,5) +
                barcode.substr(10,10) + barcode.substr(21,10);
            return {
                bank: barcode.substr( 0, 3 ),
                currency: barcode.substr( 3, 1 ),
                digit: barcode.substr( 4, 1 ),
                due: barcode.substr( 5, 4 ),
                amount: barcode.substr( 9, 10 ),
                freeField: barcode.substr( 19, 25 ),
                barcode: barcode
            };
        }

        /**
         * @function
         * @param barcode
         * @param bankCode
         * @return {{bank: string, amount: string, due: string, currency: string, freeField: string, barcode: string, digit: string}}
         */
        function getBarcodeValuesConcessionaria( barcode, bankCode )
        {
            if( barcode.length < 48 ) {
                barcode = barcode + '00000000000'.substr( 0, (48 - barcode.length) );
            }
            var barcode44 = barcode.substr(0,11) + barcode.substr(12,11) + barcode.substr(24,11) +
                barcode.substr(36,11);
            if( bankCode !== _c._bank.itau ) {
                barcode = barcode44;
            }
            return {
                bank: barcode44.substr( 0, 3 ),
                currency: barcode44.substr( 3, 1 ),
                digit: barcode44.substr( 4, 1 ),
                due: barcode44.substr( 5, 4 ),
                amount: barcode44.substr( 4, 11 ),
                freeField: barcode44.substr( 19, 25 ),
                barcode: barcode
            };
        }

        /**
         * @function
         * @param interest
         * @param fine
         * @return {number}
         */
        function sumIncrease( interest, fine )
        {
            interest = ( interest ) ? interest : 0;
            fine = ( fine ) ? fine : 0;
            return parseFloat( interest ) + parseFloat( fine );
        }

        /**
         * @function
         * @param controllerId
         * @param errors
         * @param fileId
         */
        function updateController( controllerRecord, errors, fileId )
        {
            var values = {};

            if( errors.length > 0 ) {
                controllerRecord.setValue({
                    fieldId:'custrecord_rsc_cnab_cont_status_ls',
                    value: _c._controller.error
                })
                controllerRecord.setValue({
                    fieldId:'custrecord_rsc_cnab_cont_description_ds',
                    value: 'As seguintes parcelas tiveram erros e não foram incluídas no arquivo: '+errors.toString()
                })
                // values = {
                //     custrecord_rsc_cnab_cont_status_ls: _c._controller.error,
                //     custrecord_rsc_cnab_cont_description_ds: 'As seguintes parcelas tiveram erros e não foram incluídas no arquivo: '+errors.toString()
                // };
            } else {
                controllerRecord.setValue({
                    fieldId:'custrecord_rsc_cnab_cont_status_ls',
                    value: _c._controller.completed
                })
                // values = { custrecord_rsc_cnab_cont_status_ls: _c._controller.completed };
            }
            log.debug("fileId", fileId);
            if( fileId ) {
                // values.custrecord_rsc_cnab_cont_file_ls = fileId;
                // values = { custrecord_rsc_cnab_cont_file_ls: fileId}
                controllerRecord.setValue({
                    fieldId:'custrecord_rsc_cnab_cont_file_ls',
                    value: fileId
                })
            }
            controllerRecord.save({
                ignoreMandatoryFields: true
            })
            // Nrecord.submitFields({
            //     type: 'customrecord_rsc_cnab_controller',
            //     id: Number( controllerId ),
            //     values: values
            // });
        }

        /**
         * @function
         * @return {*}
         * @param segments
         */
        function filterSegmentType( segments )
        {
            log.debug('segments', segments);
            segments.push( _c._segment.header );
            segments.push( _c._segment.trailer );
            log.debug('segments', segments);
            return segments.filter( function( elem, index, segments ) {
                return segments.indexOf( elem ) === index;
            });
        }

        /**
         * @function
         * @param layout
         * @param _segments
         */
        function getSegments( layout, _segments )
        {
            var results = dao.getSegments( layout, _segments );
            var s = {};
            if( results.runPaged().count )
            {
                results.run().each(function( result )
                {
                    log.debug('result', result);
                    var id = result.getValue({name: 'custrecord_rsc_cnab_fs_segment_ls' });
                    if( !s[ id ] )
                    {
                        s[ id ] = {};
                        s[ id ].layout = result.getValue({name:'custrecord_rsc_cnab_segment_layout_ls',join:'custrecord_rsc_cnab_fs_segment_ls'});
                        s[ id ].container = result.getValue({name:'custrecord_rsc_cnab_segment_container_ls',join:'custrecord_rsc_cnab_fs_segment_ls'});
                        s[ id ].segmentType = result.getText({name: 'custrecord_rsc_cnab_segment_segment_ls',join:'custrecord_rsc_cnab_fs_segment_ls' });
                        s[ id ].segmentTypeId = result.getValue({name: 'custrecord_rsc_cnab_segment_segment_ls',join:'custrecord_rsc_cnab_fs_segment_ls' });
                        s[ id ].segmentTypeGroup = result.getText({name: 'custrecord_rsc_cnab_segment_group_ls',join:'custrecord_rsc_cnab_fs_segment_ls' });
                        s[ id ].sequence = result.getValue({name: 'custrecord_rsc_cnab_segment_sequence_nu',join:'custrecord_rsc_cnab_fs_segment_ls' });
                        s[ id ].fields = {};
                    }
                    var f = result.id;
                    s[ id ].fields[ f ] = {};
                    s[ id ].fields[ f ].fieldId = result.getValue({name: 'custrecord_rsc_cnab_fs_field_ls' });
                    s[ id ].fields[ f ].field = result.getText({name: 'custrecord_rsc_cnab_fs_field_ls' });
                    s[ id ].fields[ f ].init = result.getValue({name: 'custrecord_rsc_cnab_fs_initposition_nu' });
                    s[ id ].fields[ f ].final = result.getValue({name: 'custrecord_rsc_cnab_fs_finalposition_nu' });
                    s[ id ].fields[ f ].size = result.getValue({name: 'custrecord_rsc_cnab_fs_size_nu' });
                    s[ id ].fields[ f ].default = result.getValue({name: 'custrecord_rsc_cnab_fs_default_ds' });
                    s[ id ].fields[ f ].auto = result.getValue({name: 'custrecord_rsc_cnab_fs_autocomplete_ls' });
                    s[ id ].fields[ f ].internalid = result.getValue({name:'custrecord_rsc_cnab_tf_internalid_ds',join:'custrecord_rsc_cnab_fs_field_ls'});
                    s[ id ].fields[ f ].recordid = result.getValue({name:'custrecord_rsc_cnab_tf_recinternalid_ds',join:'CUSTRECORD_RSC_CNAB_FS_FIELD_LS'});
                    s[ id ].fields[ f ].mask = result.getValue({name: 'custrecord_rsc_cnab_tf_mask_ds', join: 'custrecord_rsc_cnab_fs_field_ls'});
                    s[ id ].fields[ f ].type = result.getValue({name: 'custrecord_rsc_cnab_tf_type_ls', join: 'custrecord_rsc_cnab_fs_field_ls'});
                    return true;
                });
            }
            log.debug('s', s);
            return s;
        }

        /**
         * @function
         * @param segments
         * @param _segment
         */
        function includeSegmentType( segments, _segment )
        {
            log.debug('segmentsINclud', segments);
            log.debug('_segmentsINclud', _segment);
            if( _segment ) {
                segments.push( _segment.id );
                if( _segment.text.length > 1 && _segment.text.substr(0,1) === 'N' ) {
                    segments.push( _c._segment.N );
                } else if( _segment.text === 'J' ) {
                    segments.push( _c._segment['J-52'] );
                } else if( _segment.text === 'A' ) {
                    segments.push( _c._segment.B );
                } else if( _segment.text === 'P' ) {
					segments.push( _c._segment.Q );
                    segments.push(_c._segment.R);
				}
            } else {
                segments.push( _c._segment.noSegment );
                segments.push( _c._segment['P'] );
                segments.push( _c._segment['Q'] );
            }
        }

        /**
         * @function
         * @param value
         * @param size
         * @return {string}
         */
        function padding( value, size )
        {
            var pad = '';
            for( var i = 0; i < size; i++ ) {
                pad += '0';
            }
            value = value.toString();
            return pad.substring( 0, pad.length - value.length ) + value;
        }

        /**
         * @function
         * @param content
         * @param folder
         */
        function createFile( content, folder )
        {
            var date = new Date();
            var name = padding(date.getDate(),2)+''+padding((date.getMonth()+1),2)+''+padding(date.getHours(),2)
                +''+padding(date.getMinutes(),2);

            var _file = file.create({
                name: name,
                fileType: file.Type.PLAINTEXT,
                contents: content,
                folder: 780
            });
            return _file.save();
        }
        /**
         * @function
         * @param layoutId
         * @return {{cnabType: *, operationType: *}}
         */
        function getLayout( layoutId )
        {
            return dao.getLayoutFields( layoutId );
        }

        return {
            label: label,
            getLink: getLink,
            insertBankAccountOptions: insertBankAccountOptions,
            insertLayoutOptions: insertLayoutOptions,
            clearFieldOptions: clearFieldOptions,
            getInstallments: getInstallments,
            clearInstallments: clearInstallments,
            addBankAccountOptions: addBankAccountOptions,
            addLayoutOptions: addLayoutOptions,
            markAll: markAll,
            getRecordTypes: getRecordTypes,
            setAmount: setAmount,
            getInstallmentsList: getInstallmentsList,
            createController: createController,
            setInstallmentValue: setInstallmentValue,
            getInstallmentValue: getInstallmentValue,
            updateController: updateController,
            filterSegmentType: filterSegmentType,
            includeSegmentType: includeSegmentType,
            getSegments: getSegments,
            createFile: createFile,
            insertJobOptions: insertJobOptions,
            //generateOurNumber: generateOurNumber,
            getBankAccountJob:getBankAccountJob,
            getLayout: getLayout,
            updateSequentialBank: updateSequentialBank
        }
    }
);
