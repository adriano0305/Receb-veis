/**
 * @NScriptType ClientScript
 * @NApiVersion 2.0
 * @scriptName rsc-cnab-bill-cl
 */
define([ 'N/ui/dialog', 'N/runtime', 'N/currentRecord', './rsc-cnab-bill', '../lib/rsc-cnab-constant' ],

    /**
     *
     * @param dialog
     * @param runtime
     * @param currentRecord
     * @param lib
     * @param _c
     * @return {{saveRecord: (function(*): boolean)}}
     */
    function( dialog, runtime, currentRecord, lib, _c )
    {
        /**
         *
         * @param context
         * @return {boolean}
         */
        function pageInit( context )
        {
            var record = context.currentRecord;
            if( record.id )
            {
                var paymentMethodId = record.getValue({ fieldId: 'custbody_rsc_cnab_paymentmethod_ls' });

                if( paymentMethodId ) {
                    var segment = lib.getSegment( paymentMethodId );
                    lib.manageFields( record, segment );
                } else {
                    lib.disableFields( record, lib.fieldsDisable(),true );
                }
            }
        }

        /**
         * @function
         * @param context
         * @return {boolean}
         */
        function saveRecord( context )
        {
            var record = context.currentRecord;
            if( record.id )
            {
                var lines = record.getLineCount({ sublistId: 'installment' });
                var bank            = record.getValue({ fieldId: 'custbody_rsc_cnab_bank_ls' });
                var paymentMethod   = record.getValue({ fieldId: 'custbody_rsc_cnab_paymentmethod_ls' });
                var forecastAccount = record.getValue({ fieldId: 'custbody_rsc_cnab_forecastaccount_ls' });
                var bankAccount     = record.getValue({ fieldId: 'custbody_rsc_cnab_bankaccount_ls' });
                var serviceType     = record.getValue({ fieldId: 'custbody_rsc_cnab_servicetype_ls' });
                var bankAccountLoc  = record.getValue({ fieldId: 'custbody_rsc_cnab_bankaccountloc_ls' });

                for( var i=0; i < lines; i++ )
                {
                    record.selectLine({ sublistId: 'installment', line: i });
                    var status = record.getCurrentSublistValue({ sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_status_ls' });

                    if( status && Number(status) !== _c._status.available && Number(status) !== _c._status.rejected )
                    {
                        dialog.alert({ title: lib.label.alert, message: lib.label.block });
                        return false;
                    } else {
                        setLineValues( record, bank, paymentMethod, forecastAccount, bankAccount, serviceType, bankAccountLoc );
                    }
                }
            } else {
                updateInstallments();
            }
            return true;
        }

        /**
         * @function
         */
        function updateInstallments()
        {
            var record = currentRecord.get();
            var lines = record.getLineCount({ sublistId: 'installment' });

            var bank            = record.getValue({ fieldId: 'custbody_rsc_cnab_bank_ls' });
            var paymentMethod   = record.getValue({ fieldId: 'custbody_rsc_cnab_paymentmethod_ls' });
            var forecastAccount = record.getValue({ fieldId: 'custbody_rsc_cnab_forecastaccount_ls' });
            var bankAccount     = record.getValue({ fieldId: 'custbody_rsc_cnab_bankaccount_ls' });
            var serviceType     = record.getValue({ fieldId: 'custbody_rsc_cnab_servicetype_ls' });
            var bankAccountLoc  = record.getValue({ fieldId: 'custbody_rsc_cnab_bankaccountloc_ls' });

            for( var i=0; i < lines; i++ )
            {
                record.selectLine({ sublistId: 'installment', line: i });
                setLineValues( record, bank, paymentMethod, forecastAccount, bankAccount, serviceType, bankAccountLoc );
            }
        }

        /**
         *
         * @param record
         * @param bank
         * @param paymentMethod
         * @param forecastAccount
         * @param bankAccount
         * @param serviceType
         * @param bankAccountLoc
         */
        function setLineValues( record, bank, paymentMethod, forecastAccount, bankAccount, serviceType, bankAccountLoc )
        {
            log.audit('setLineValues', record);
            log.audit('setLineValues', {
                bank: bank,
                paymentMethod: paymentMethod,
                forecastAccount: forecastAccount,
                bankAccount: bankAccount,
                serviceType: serviceType,
                bankAccountLoc: bankAccountLoc
            });

            record.setCurrentSublistValue({
                sublistId: 'installment',
                fieldId: 'custrecord_rsc_cnab_inst_status_ls',
                value: _c._status.available,
                ignoreFieldChange: true
            });
            record.setCurrentSublistValue({
                sublistId: 'installment',
                fieldId: 'custrecord_rsc_cnab_inst_bank_ls',
                value: bank,
                ignoreFieldChange: true
            });
            record.setCurrentSublistValue({
                sublistId: 'installment',
                fieldId: 'custrecord_rsc_cnab_inst_paymentmetho_ls',
                value: paymentMethod,
                ignoreFieldChange: true
            });
            record.setCurrentSublistValue({
                sublistId: 'installment',
                fieldId: 'custrecord_rsc_cnab_inst_forecastacc_ls',
                value: forecastAccount,
                ignoreFieldChange: true
            });
            record.setCurrentSublistValue({
                sublistId: 'installment',
                fieldId: 'custrecord_rsc_cnab_inst_bankaccount_ls',
                value: bankAccount,
                ignoreFieldChange: true
            });
            record.setCurrentSublistValue({
                sublistId: 'installment',
                fieldId: 'custrecord_rsc_cnab_inst_servicetype_ls',
                value: serviceType,
                ignoreFieldChange: true
            });
            record.setCurrentSublistValue({
                sublistId: 'installment',
                fieldId: 'custrecord_rsc_cnab_inst_locationba_ls',
                value: bankAccountLoc,
                ignoreFieldChange: true
            });
            record.commitLine({ sublistId: 'installment' });
        }

        /**
         * @function
         * @param context
         */
        function fieldChanged( context )
        {
            var record = currentRecord.get();

            if( context.fieldId === 'custbody_rsc_cnab_paymentmethod_ls' )
            {
                var paymentMethodId = record.getValue({ fieldId: 'custbody_rsc_cnab_paymentmethod_ls' });
                if( paymentMethodId )
                {
                    var segment = lib.getSegment( paymentMethodId );
                    lib.manageFields( record, segment );
                } else {
                    lib.disableFields( record, lib.fieldsDisable(),true );
                }
            }
            else if( context.fieldId === 'custrecord_rsc_cnab_inst_barcode_ds' )
            {
                record.selectLine({ sublistId: 'installment', line: context.line });
                var barcode = record.getCurrentSublistValue({ sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_barcode_ds' });

                if( barcode )
                {
                    var payMethodId = record.getValue({ fieldId: 'custbody_rsc_cnab_paymentmethod_ls' });
                    var segmentt = lib.getSegment( payMethodId );

                    if( segmentt === 'J' )
                    {
                        if( !lib.validateBarcode(barcode) ) {
                            dialog.alert({ title: lib.label.alert, message: lib.label.barcode });
                        }
                    }
                    else if( segmentt === 'O' )
                    {
                        if( !lib.validateDealershipBarcode(barcode) ) {
                            dialog.alert({ title: lib.label.alert, message: lib.label.barcode });
                        }
                    }
                }
            }
            else if( context.fieldId === 'terms' )
            {
                var terms = record.getValue({ fieldId: 'terms' });
                if( terms )
                {
                    var paymentMethodId = record.getValue({ fieldId: 'custbody_rsc_cnab_paymentmethod_ls' });
                    if( paymentMethodId )
                    {
                        var segment = lib.getSegment( paymentMethodId );
                        lib.manageFields( record, segment );
                    } else {
                        lib.disableFields( record, lib.fieldsDisable(),true );
                    }
                } else {
                    lib.disableFields( record, lib.fieldsDisable(),true );
                }
            }
        }

        return {
            saveRecord: saveRecord,
            pageInit: pageInit,
            updateInstallments: updateInstallments,
            fieldChanged: fieldChanged
        }
    });