/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @scriptName rsc-cnab-return-dao
 */
define([ 'N/search' ],

    /**
     * @function
     * @param search
     * @return {}
     */
    function( search )
    {
        /**
         * @function
         * @param layout
         * @param container
         * @return {{search.Search}}
         */
        function getSegments( layout, container )
        {
            return search.create
            ({
                type: 'customrecord_rsc_cnab_fieldsegment',
                columns: [
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_segment_ls' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_initposition_nu', sort: search.Sort.ASC }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_finalposition_nu' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_size_nu' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_default_ds' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_segment_layout_ls', join: 'custrecord_rsc_cnab_fs_segment_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_segment_segment_ls', join: 'custrecord_rsc_cnab_fs_segment_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_tf_mask_ds', join: 'custrecord_rsc_cnab_fs_field_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_tf_returnid_ds', join: 'custrecord_rsc_cnab_fs_field_ls'}),
                    //search.createColumn({name: 'custrecord_dosum', join: 'custrecord_rsc_cnab_fs_field_ls'}),
                ],
                filters: [
                    search.createFilter({ name: 'custrecord_rsc_cnab_segment_layout_ls', join: 'custrecord_rsc_cnab_fs_segment_ls',
                        operator: search.Operator.ANYOF, values: layout }),
                    search.createFilter({ name: 'custrecord_rsc_cnab_segment_container_ls', join: 'custrecord_rsc_cnab_fs_segment_ls',
                        operator: search.Operator.ANYOF, values: container }),
                    search.createFilter({ name: 'custrecord_rsc_cnab_fs_usedinreturn_fl', operator: search.Operator.IS, values: true })
                ]
            });
        }

        /**
         * @function
         * @param bank
         * @param code
         * @param layout400
         * @param layout240
         * @return {{search.Search}}
         */
        function getOccurrence( bank, code, layout400, layout240 )
        {
                log.debug('bank',bank)
                log.debug('code',code)
                log.debug('layout400',layout400)
                log.debug('layout240',layout240)
            try {
                 return search.create
            ({
                type: 'customrecord_rsc_cnab_returnoccurrence',
                columns: [
                    search.createColumn({name: 'name' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_ro_code_ds' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_ro_statuscnab_ls' })
                ],
                filters: [
                    search.createFilter({ name: 'custrecord_rsc_cnab_ro_bank_ms', operator: search.Operator.ANYOF, values: bank }),
                    search.createFilter({ name: 'custrecord_rsc_cnab_ro_code_ds', operator: search.Operator.IS, values: code }),
                    // search.createFilter({ name: 'custrecord_rsc_cnab_ro_layout400_fl', operator: search.Operator.IS, values: layout400 }),
                    search.createFilter({ name: 'custrecord_rsc_cnab_ro_layout240_fl', operator: search.Operator.IS, values: layout240 })
                ]
            });
            } catch(e) {

                    log.debug('dao',e)
            }
            
        }

        /**
         * @function
         * @param layoutId
         * @return {{cnabType: *, operationType: *}}
         */
        function getLayoutFields( layoutId )
        {        
            try{
                var fields = search.lookupFields
                ({
                    type: 'customrecord_rsc_cnab_layout',
                    id: layoutId,
                    columns: [ 'custrecord_rsc_cnab_layout_operation_ls', 'custrecord_rsc_cnab_layout_cnabtype_ls', 'custrecord_rsc_cnab_layout_type_ls' ]
                });
                return {
                    operationType: fields[ 'custrecord_rsc_cnab_layout_operation_ls' ][0].value,
                    cnabType: fields[ 'custrecord_rsc_cnab_layout_cnabtype_ls' ][0].value,
                    layoutType: fields[ 'custrecord_rsc_cnab_layout_type_ls' ][0].value
                }    
            } catch(e){
                log.debug('erro getLayoutFields',e)
            }
            
        }

        /**
         * @function
         * @return {Search}
         */
        function getSetupRecordTypeId()
        {
            return search.create
            ({
                type: 'customrecord_rsc_cnab_fieldssetup',
                columns: [ 'custrecord_acs_cnab_fs_recordtypeid_ds' ],
                filters: []
            });
        }

        /**
         * @param bankId
         * @return {{folderPaymentReturn: *}}
         */
        function getBankFields( bankId )
        {
            var fields = search.lookupFields
            ({
                type: 'customrecord_rsc_cnab_bank',
                id: bankId,
                columns: [ 'custrecord_rsc_cnab_bank_preturnfolde_nu' ]
            });
            return {
                folderPaymentReturn: fields[ 'custrecord_rsc_cnab_bank_preturnfolde_nu' ]
            }
        }

        return {
            getSegments: getSegments,
            getOccurrence: getOccurrence,
            getLayoutFields: getLayoutFields,
            getSetupRecordTypeId: getSetupRecordTypeId,
            getBankFields: getBankFields
        }
    }
);