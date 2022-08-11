/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @scriptName rsc-cnab-batch-mr
 */
define([ 'N/record', 'N/log', 'N/runtime', './rsc-cnab-batch', 'N/error', './rsc-cnab-batch-file', 'N/file' ],
    /**
     *
     * @param record
     * @param log
     * @param runtime
     * @param lib
     * @param Nerror
     * @param file
     * @return {{getInputData: getInputData, summarize: summarize, map: map}}
     */
    function( record, log, runtime, lib, Nerror, file, nFile )
    {
        /**
         * @function getInputData - get the expense report list to be processed
         * @return {Object}
         */
        function getInputData()
        {
            try
            {
                const script = runtime.getCurrentScript();
                const installments = script.getParameter({ name:'custscript_rsc_cnab_batchdata_cr_ds' });
                log.debug( 'getInputData', installments );
                return JSON.parse( installments );

            } catch (e) {
                throw 'MR.getInputData: '+e;
            }
        }

        /**
         * @function
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         */
        function map( context )
        {
            var installment = JSON.parse( context.value );
            var id = context.key;

            try
            {
                var transaction = record.load({ type: installment.transactionType, id: installment.transaction, isDynamic: true });
				lib.setInstallmentValue( transaction, installment );
                log.debug('setInstallment', 'done');
				var values = lib.getInstallmentValue( transaction, null, id, installment.entityType, installment.layout, installment.bankAccount );
                log.debug('getInstallmentValue', 'done');
              	nFile.create({
                    name: 'installment_contas_a_receber.json',
                    fileType: nFile.Type.JSON,
                    contents: JSON.stringify(values, null, 2),
                    encoding: nFile.Encoding.UTF8,
                    folder: -15
                })
                  	.save()

				lib.updateSequentialBank( values.custrecord_rsc_cnab_inst_locationba_ls.bankId );
                log.debug('getInstallmentValue', 'done');
				values.controller = installment.controller;
				values.layout = installment.layout;
				values.transaction = installment.transaction;
				values.cnabType = installment.cnabType;
				context.write({ key: id, value: values });

            } catch( e ) {
                var fatura = record.load({
                    type:'invoice',
                    id: installment.transaction
                })
                fatura.setValue({
                    fieldId:'custbody_rsc_cnab_inst_status_ls',
                    value: 1
                })
                fatura.save()
                log.error( 'map', 'installment id: ' + id + ' -- error: ' + e );
                throw Nerror.create({ name: installment.controller, message: e });
            }
        }

        /**
         * @function
         * @param context
         */
        function summarize( context )
        {
            var errors = [];
            var controllerId = 0;
            var installments = {};
            var segments = [];
            var layout = 0;
            var folder = 0;
            var fileId = undefined;
            /** Errors Iterator */
            context.mapSummary.errors.iterator().each( function( key, error )
            {
                var e = JSON.parse( error );
                controllerId = e.name;
                errors.push( key );
                return true;
            });
            /** Output Iterator */
            context.output.iterator().each( function( key, value )
            {
                installments[ key ] = {};
                installments[ key ] = JSON.parse( value );
                log.debug('installments', installments[ key]);
                controllerId = installments[ key ].controller;
                layout = installments[ key ].layout;
                folder = installments[ key ].custrecord_rsc_cnab_inst_locationba_ls.folder;
                lib.includeSegmentType( segments, installments[ key ].custrecord_rsc_cnab_inst_paymentmetho_ls.segment );
                return true;
            });
            /** Create File */
            if( Object.getOwnPropertyNames(installments).length > 0 )
            {
                var _segments = lib.getSegments( layout, lib.filterSegmentType( segments ) );
                var fileContent = file.buildFile( _segments, installments );
                fileId = lib.createFile( fileContent, folder );
            }
            /** Update Controller */
            var controllerRecord = record.load({
                type: 'customrecord_rsc_cnab_controller',
                id: Number(controllerId)
            })
            lib.updateController( controllerRecord, errors, fileId );
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    });
