/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @scriptName rsc-cnab-return
 */
define([ 'N/search', 'N/runtime', './rsc-cnab-return-dao', 'N/format', 'N/url', 'N/record', 'N/file', '../lib/rsc-cnab-constant', 'N/query' ],

    /**
     * @function
     * @param search
     * @param runtime
     * @param dao
     * @param format
     * @param url
     * @param record
     * @param file
     * @param _c
     * @return {{beforeLoad: beforeLoad}}
     */
    function( search, runtime, dao, format, url, record, file, _c, query )
    {
        /**
         * @function
         * @param layout
         */
        function getSegments( layout )
        {
            var results = dao.getSegments( layout, _c._container.batchDetail );
            //log.debug('results',results)
            var s = {};
            if( results.runPaged().count )
            {
                results.run().each(function( result )
                {
                    var id = result.getValue({name: 'custrecord_rsc_cnab_fs_segment_ls' });
                    //log.debug('getSegments id',id)
                    if( !s[ id ] )
                    {
                        s[ id ] = {};
                        s[ id ].layout = result.getValue({name:'custrecord_rsc_cnab_segment_layout_ls',join:'custrecord_rsc_cnab_fs_segment_ls'});
                        s[ id ].segmentType = result.getText({name: 'custrecord_rsc_cnab_segment_segment_ls',join:'custrecord_rsc_cnab_fs_segment_ls' });
                        s[ id ].fields = {};
                    }
                    var f = result.id;
                    s[ id ].fields[ f ] = {};
                    s[ id ].fields[ f ].init = result.getValue({name: 'custrecord_rsc_cnab_fs_initposition_nu' });
                    s[ id ].fields[ f ].final = result.getValue({name: 'custrecord_rsc_cnab_fs_finalposition_nu' });
                    s[ id ].fields[ f ].size = result.getValue({name: 'custrecord_rsc_cnab_fs_size_nu' });
                    s[ id ].fields[ f ].default = result.getValue({name: 'custrecord_rsc_cnab_fs_default_ds' });
                    s[ id ].fields[ f ].returnid = result.getValue({name:'custrecord_rsc_cnab_tf_returnid_ds',join:'custrecord_rsc_cnab_fs_field_ls'});
                    s[ id ].fields[ f ].mask = result.getValue({name: 'custrecord_rsc_cnab_tf_mask_ds', join: 'custrecord_rsc_cnab_fs_field_ls'});
                    // s[ id ].fields[ f ].dosum = result.getValue({name: 'custrecord_dosum', join: 'custrecord_rsc_cnab_fs_field_ls'});
                    return true;
                });
            }
            // log.debug('getSegments s',s)
            return s;
        }

        /**
         * @function
         * @param fields
         * @param fieldsId
         * @param line
         * @return {boolean}
         */
        function isSameSegment( fields, fieldsId, line )
        {
            var segment = fieldsId.filter( function( elem) {
                return fields[ elem ].returnid === 'segment';
            });
            // log.debug('isSameSegment segment',segment)
            if( segment.length > 0 )
            {
                var field = fields[ segment ];
                // log.debug('isSameSegment field',field)
                var segmentLine = line.substr((field.init)-1, field.size );
                // log.debug('isSameSegment segmentLine',segmentLine)

                if( segmentLine === fields[ segment ].default )
                {
                    if( segmentLine === 'N' )
                    {
                        var tax = fieldsId.filter( function( elem) {
                            return fields[ elem ].returnid === 'tax';
                        });
                        var taxField = fields[ tax ];
                        var taxLine = line.substr((taxField.init)-1, taxField.size );
                        return taxLine === fields[ tax ].default;

                    } else {
                        return true;
                    }
                } else {
                    return false;
                }
            }
            else
            {
                var type = fieldsId.filter( function( elem) {
                    return fields[ elem ].returnid === 'type';
                });
                var field = fields[ type ];
                var typeLine = line.substr((field.init)-1, field.size );
                return typeLine === fields[ type ].default;
            }
        }

        /**
         * @function
         * @param bank
         * @param code
         * @param layout
         * @return {{code: string, name: string, status: string}}
         */
        function getOccurrence( bank, code, layout )
        {
            log.debug('getOccurrence bank',bank)
            log.debug('getOccurrence code',code)
            log.debug('getOccurrence code',layout)
            var _240 = ( Number(layout.layoutType) === _c._layout._240 );
            var _400 = ( Number(layout.layoutType) === _c._layout._400 );
            var results = dao.getOccurrence( bank, code, _400, _240 );
            log.debug('results',results)
            if( results.runPaged().count )
            {
                var result = results.run().getRange({ start: 0, end: 1 });
                return {
                    id: result[0].id,
                    name: result[0].getValue({name: 'name' }),
                    code: result[0].getValue({name: 'custrecord_rsc_cnab_ro_code_ds' }),
                    status: result[0].getValue({name: 'custrecord_rsc_cnab_ro_statuscnab_ls' })
                };
            }
        }

        /**
         * @function
         * @param layoutId
         * @return {{cnabType: *, operationType: *}}
         */
        function getLayout( layoutId )
        {
            log.debug('getLayout layoutId',layoutId)
            var layout = dao.getLayoutFields( layoutId );
            log.debug('getLayout layout',layout)
            log.debug('getLayout _c._type.payment',_c._type.payment)

            if( Number(layout.cnabType) === Number(_c._type.payment) ) {
                log.debug('getLayout if')                
                layout.transactionType = 'vendorbill';
                layout.transform = 'vendorpayment';

            } else {
                log.debug('getLayout else')                
                layout.transactionType = 'invoice';
                layout.transform = 'customerpayment';
            }
            return layout;
        }

        /**
         * @function
         * @param fields
         * @param fieldsId
         * @param line
         */
        function getInstallmentValuesByLine( fields, fieldsId, line )
        {
            var installment = {};
            for( var f in fieldsId )
            {
                var index = fields[ fieldsId[f] ].returnid;
                var value = line.substr((fields[ fieldsId[f] ].init)-1, fields[ fieldsId[f] ].size );

                // log.debug('getInstallmentValuesByLine index', index)
                // log.debug('getInstallmentValuesByLine value', value)

                if( index === 'id' )
                {
                    var v = value.split('-');
                    installment.id = parseInt(v[0],36);
                    installment.transaction = parseInt(v[1],36);
                    // log.debug('getInstallmentValuesByLine id', installment.id)
                    // log.debug('getInstallmentValuesByLine transaction', installment.transaction)


                }
                else if( index === 'date' ) {
                    installment.date = formatDate(fields[fieldsId[f]].mask, value);
                } else if( index === 'amount' ) {
                    installment.amount = parseFloat( value.substr(0,value.length-2)+'.'+value.substr(value.length-2,value.length) );
                } else {
                    installment[ index ] = value;
                }
            }
            return installment;
        }

        /**
         * @function
         * @param installment
         * @param occurrence
         * @param layout
         */
        function update( installment, occurrence, layout )
        {
            var date = '';

            if( Number(occurrence.status) === _c._status.liquidated )
            {
                getInstallmentValues( installment, layout );
                var obj = createPayment( installment, occurrence, layout );

                // if( obj.processed )
                // {
                //     date = installment.date;
                //     return updateInstallment( installment, occurrence, layout, date );
                // }
                // else return obj;
            }

            else
            {
                return updateInstallment( installment, occurrence, layout, date );
            }
        }

        /**
         * @param installment
         * @param occurrence
         * @param layout
         * @param date
         * @return {{processed: boolean}}
         */
        function updateInstallment( installment, occurrence, layout, date )        
        {
            log.debug('updateInstallment',{
                installment:installment,
                occurrence:occurrence,
                layout:layout,
                date:date
            })           
            try{

                 if (Number(occurrence.status) == 4)
                 {
                    log.error('revertendo o pagamento')
                    log.error('revertendo o pagamento installment.id',installment.id)
                    log.debug('transactionType',layout.transactionType)
                    log.error('occurrence.status',occurrence.status)
                    log.error('installmentinstallmentinstallment',installment)

                    var queryStr = ''
                    queryStr += 'select custrecord_rsc_cnab_transpay from '
                    queryStr += 'customrecord_rsc_cnab_pay_trans where custrecord_rsc_cnab_id_parc = '
                    queryStr += installment.id

                    log.error('queryStr',queryStr)
                     var queryResult = query.runSuiteQL(queryStr).asMappedResults()
                     log.error('queryResult',queryResult)
                    
                   
                    if(queryResult.length > 0 ){
                         var paymentTrans = queryResult[0].custrecord_rsc_cnab_transpay
                         log.error('paymentTrans',paymentTrans)

                    var x = record.delete({
                           type: record.Type.VENDOR_PAYMENT,
                           id: paymentTrans,
                        });

                    log.error('revertendo o pagamentoxxxxxx',x)
                    } else {
                        log.error('nao achou transacao')
                    }

                     if(installment.transaction == installment.id){


                     try{
                     var otherId = record.submitFields({
                            type: record.Type.EXPENSE_REPORT,
                            id: installment.transaction,
                            values: {
                                'custbody_rsc_cnab_inst_status_ls': occurrence.status
                            }
                        });
                return { processed: true };
                } catch(e){
                    log.debug('e',e)
                }


                 } else {
                    var transaction = record.load({ type: layout.transactionType, id: Number(installment.transaction), isDynamic: true });
                    log.debug('transaction',transaction)
                    var line = transaction.findSublistLineWithValue({ sublistId: 'installment', fieldId: 'id', value: Number(installment.id) });
                    
                    log.debug('line',line)
                    if( line > -1 ){
                try{
                    transaction.selectLine({ sublistId: 'installment', line: line });
                transaction.setCurrentSublistValue({
                    sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_occurrence_ls', value: occurrence.id, ignoreFieldChange: true
                });
                transaction.setCurrentSublistValue({
                    sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_status_ls', value: Number(occurrence.status), ignoreFieldChange: true
                });
                transaction.setCurrentSublistValue({
                    sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_compensadate_dt', value: date, ignoreFieldChange: true
                });
                transaction.commitLine({ sublistId: 'installment' });
                transaction.save();
                log.audit( 'updateInstallment', 'Updated installmentId: '+Number(installment.id) );
                return { processed: true };
                } catch(e){
                    log.debug('e',e)
                }
                
            }              

            else return { processed: false, error: 'Parcela não encontrada.' };
                 }
                   

                 }

            } catch(err){
                log.debug('err POG',err) 
                 return { processed: true };
            }
           

                

            

            
        }

        /**
         * @function
         * @param installment
         * @param occurrence
         * @param layout
         */
        function createPayment( installment, occurrence, layout )
        {
            var transactionId = Number( installment.transaction );
            var transaction = record.load({ type: layout.transactionType, id: transactionId, isDynamic: true });
            var linecount = transaction.getLineCount("installment")
             log.error("XXXXXXXXXXXX linecount",linecount)
            for (i=0;i<linecount;i++){
                 var curLine = transaction.selectLine({ sublistId: 'installment', line: i })
                 log.error("XXXXXXXXXXXX curLine",curLine)
                 var curId = curLine.getCurrentSublistValue({ sublistId: 'installment',fieldId: 'id' })
                 log.error("XXXXXXXXXXXX installment.id",installment.id)
                 if(curId == installment.id){
                    curLine.setCurrentSublistValue({ sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_status_ls', value: 5, ignoreFieldChange: true });
                    transaction.commitLine({ sublistId: 'installment' });
                    var y = transaction.save()
                    log.error("XXXXXXXXXXXX y",y)

                    
                } 

            }


            // installment.number
            log.error("XXXXXXXXXXXX",transactionId)
            log.error("XXXXXXXXXXXX installment",installment)
            return { processed: true }

           /* Ajuste apos contabilizacao
            var transaction = record.load({ type: layout.transactionType, id: transactionId, isDynamic: true });
            var department = transaction.getValue({ fieldId: 'department' });
            var _class = transaction.getValue({ fieldId: 'class' });
            //<CNAB Aterei aqui Dev.:Rafael Mossolin Data:29/05/2020 -->
            var forecast_account = transaction.getValue({ fieldId: 'custbody_rsc_cnab_forecastaccount_ls' });
            //log.debug({title:"forecast_account", details:forecast_account});
            //<CNAB Fim Dev.:Rafael Mossolin Data:29/05/2020-->
            /* Ajuste para a conta correta - Bdalmazo 03/04/2022*/
            /*var conta_pagamento = transaction.getValue({ fieldId: 'custbody_rsc_cnab_bankaccountloc_ls' });
            log.debug('conta_pagamento',conta_pagamento)
            //a conta contábil está dentro do registro
            var conta_pag_cont = search.lookupFields({
                type: "customrecord_rsc_cnab_bankaccount",
                id: conta_pagamento,
                columns: [
                    "custrecord_rsc_cnab_ba_accounting_ls", //* value                   
                ]
            }).custrecord_rsc_cnab_ba_accounting_ls[0].value

            var payment = record.transform({ fromType: layout.transactionType, fromId: transactionId, toType: layout.transform, isDynamic: true });
            //log.debug({title:"payment", details:payment});
            payment.setValue({ fieldId: 'trandate', value: installment.date, ignoreFieldChange: true });
            //<CNAB Aterei aqui Dev.:Rafael Mossolin Data:29/05/2020 -->
            var undepfunds =  payment.setValue({fieldId:'undepfunds',value:'F', ignoreFieldChange: true});
            //log.debug({title:"undepfunds", details:undepfunds});
            payment.setValue({fieldId: 'account', value: conta_pag_cont, ignoreFieldChange: true })
            //<CNAB Fim Dev.:Rafael Mossolin Data:29/05/2020-->
            if( department ) {
                payment.setValue({ fieldId: 'department', value: department, ignoreFieldChange: true });
            }
            if( _class ) {
                payment.setValue({ fieldId: 'class', value: _class, ignoreFieldChange: true });
            }
            var line = payment.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'internalid', value: transactionId });

            var lineCount = payment.getLineCount({
                sublistId: 'apply'
            })

            var instalmentNumber = installment.number
            log.debug("instalmentNumber", instalmentNumber)
            var trans = false

            try {

                for(var lineNum = 0; lineNum < lineCount ; lineNum++){
                
                    payment.selectLine({ sublistId: 'apply', line: lineNum });
                    var curTransId = payment.getCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid'
                    });
                    var curIntallId = payment.getCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'installmentnumber'
                    });
    
                    log.debug("payData", {
                        curTransId : curTransId,
                        curIntallId : curIntallId,
                        transactionId : transactionId,
                        parcela : instalmentNumber
                    })
                    
                    if(curTransId == transactionId && curIntallId == instalmentNumber){
                        payment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true, ignoreFieldChange: true });
                        payment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: installment.amount, ignoreFieldChange: true });
                        const paymentId = payment.save();
                        trans = true
                        // return { processed: true };
                    }
    
                }
                if(trans == true){
                    return { processed: true };
                } else {
                    return { processed: false, error: 'Transação não encontrada.' };
                }
               

            } catch(e){
                log.debug("e",e)
            }

           
            // if( line > -1 )
            // {
            //     payment.selectLine({ sublistId: 'apply', line: line });
            //     payment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true, ignoreFieldChange: true });
            //     payment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: installment.amount, ignoreFieldChange: true });
            //     payment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'installmentnumber', value: installment.number, ignoreFieldChange: true });
            //     payment.commitLine({ sublistId: 'apply' });
            //     const paymentId = payment.save();
            //     log.audit( 'createPayment', 'PaymentId: '+paymentId );
            //     return { processed: true };
            // }
            // else return { processed: false, error: 'Transação não encontrada.' };


            */
        }

        /**
         * @function
         * @param installment
         * @param layout
         */
        function getInstallmentValues( installment, layout )
        {
            log.error("lydjhflsdhfldsfh",Number(installment.transaction))
            var transaction = record.load({ type: layout.transactionType, id: Number(installment.transaction), isDynamic: true });
            var line = transaction.findSublistLineWithValue({ sublistId: 'installment', fieldId: 'id', value: installment.id });

            if( line > -1 )
            {
                transaction.selectLine({ sublistId: 'installment', line: line });
                installment.number = transaction.getCurrentSublistValue({ sublistId: 'installment', fieldId: 'seqnum' });
            }
        }

        /**
         * @function
         * @param mask
         * @param value
         * @return {Date}
         */
        function formatDate( mask, value )
        {
            if( mask === 'DDMMAAAA' )
            {
                return new Date( value.substr(4,4), Number(value.substr(2,2))-1, value.substr(0,2) );
            }
            else if( mask === 'DDMMAA' )
            {
                const date = new Date();
                date.setDate( value.substr(0,2) );
                date.setMonth( Number(value.substr(2,2))-1 );
                return date;
            }
        }

        /**
         * @function
         * @param installment
         * @param recordId
         * @param userId
         * @param error
         * @param occurrence
         */
        function createNote( installment, recordId, userId, error, occurrence )
        {
            var title = '';
            var memo = '';

            if( error ) {
                if (installment) {
                    title = 'Parcela ' + installment.id;
                    memo = 'Parcela ' + installment.id + ' - Transação ' + installment.transaction + ' - Erro: ' + error.error;
                    log.debug("error",memo)
                } else {
                    title = 'Parcela não identificada';
                    memo = 'Erro antes de identificar a parcela - Linha do arquivo: ' + error.line + ' - Erro: ' + error.error;
                    log.debug("error",memo)
                }
            } else {
                title = 'Parcela '+installment.id;
                memo = 'Parcela '+installment.id+' - Transação '+installment.transaction+' - Parcela processada com sucesso - Ocorrência '+occurrence.name;
                log.debug("error",memo)
            }

            var note = record.create({ type: 'note', isDynamic: true });
            note.setValue({ fieldId: 'recordtype', value: 1529, ignoreFieldChange: true });
            note.setValue({ fieldId: 'record', value: recordId, ignoreFieldChange: true });
            note.setValue({ fieldId: 'title', value: title, ignoreFieldChange: true });
            note.setValue({ fieldId: 'note', value: memo, ignoreFieldChange: true });
            note.setValue({ fieldId: 'author', value: userId, ignoreFieldChange: true });
            note.save();
        }

        /**
         * @function
         * @param processingId
         * @param _error
         */
        function updateReturnProcessing( processingId, _error )
        {
            var status = ( _error > 0 ) ? _c._controller.error : _c._controller.completed;
            log.debug({title: "status", details:status});
            var processing = record.load({ type: 'customrecord_rsc_cnab_returnfileprocess', id: Number(processingId), isDynamic: true });
            log.debug({title: "processing", details:processing});
            processing.setValue({ fieldId: 'custrecord_rsc_cnab_rfp_status_ls', value: status });
            processing.save();
         }

        /**
         * @function
         * @return {number}
         */
        function getRecordTypeId()
        {
            var result = dao.getSetupRecordTypeId();
            var setup = result.run().getRange({ start: 0, end: 1 });
            return parseInt( setup[0].getValue({ name: 'custrecord_acs_cnab_fs_recordtypeid_ds' }) );
        }

        /**
         * @function
         * @param fileId
         * @param bankId
         */
        function checkExtension( fileId, bankId )
        {
            var bank = dao.getBankFields( bankId );
            var _file = file.load({ id: fileId });
            var name = _file.name;
            _file.folder = bank.folderPaymentReturn;

            if( name.lastIndexOf('.') > -1 ) {
                _file.name = name.substring( 0, name.lastIndexOf('.') ) + '.txt';
            } else {
                _file.name = name + '.txt';
            }

            _file.save();
        }

        return {
            getSegments: getSegments,
            isSameSegment: isSameSegment,
            getOccurrence: getOccurrence,
            getLayout: getLayout,
            getInstallmentValuesByLine: getInstallmentValuesByLine,
            update: update,
            createNote: createNote,
            updateReturnProcessing: updateReturnProcessing,
            checkExtension: checkExtension
        }
    }
);