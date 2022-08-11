/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @scriptName rsc-cnab-batch-file
 */
define([ 'N/file', 'N/format', '../lib/rsc-cnab-constant' ],

    /**
     * @function
     * @param file
     * @param format
     * @param _c
     * @return {{beforeLoad: beforeLoad}}
     */
    function( file, format, _c )
    {
        var batchTotal = 0;
        var sequential = 0;
        var recordTotal = 0;
        var valueBatchTotal =0;
        var recordBatchTotal = 0;
        var valuesBatchTotal = 0;
        var valuesBatch = 0;

        /**
         *
         * @type {string[]}
         */
        var reserved = [
            'record_total',
            'sequential',
            'batch_total',
            'batch_details_total',
            'batch_details_total_237',
            'record_batch_total'
        ];

        /**
         * @function
         * @param segments
         * @param installments
         */
        function buildFile( segments, installments )
        {
            const keys = Object.keys( segments );

            const fileHeader = keys.filter( function(elem) {
                return parseInt( segments[ elem ].container ) === _c._container.fileHeader;
            });
            log.debug('segments 27', segments[27])
            log.debug('segments 28', segments[28])
            // log.debug('segments 27 container', segments[27].container)   
            const fileBatch = keys.filter( function(elem) {
                return parseInt(segments[elem].container) !== _c._container.fileHeader && parseInt(segments[elem].container) !== _c._container.fileTrailer;
            });
            const fileTrailer = keys.filter( function(elem) {
                return parseInt( segments[ elem ].container ) === _c._container.fileTrailer;
            });
            log.debug('segments',segments);
            log.debug('installments', installments);
            log.debug('fileHeader[0]', fileHeader[0]);
            log.debug('fileBatch', fileBatch);
            log.debug('fileTrailer[0]', fileTrailer[0]);
            var content = buildFileHeader( segments, installments, fileHeader[0] );
            content += buildFileBatch( segments, installments, fileBatch );
            content += buildFileTrailer( segments, installments, fileTrailer[0] );

            log.audit( 'buildFile', content );
            return content;
        }

        /**
         * @function
         * @param segments
         * @param installments
         * @param key
         * @return {string|string}
         */
        function buildFileHeader( segments, installments, key )
        {
            var keys = Object.keys( installments );
          //log.audit( 'keys_FileHeader', keys );
          //log.audit('segments_FileHeader', segments );
          //log.audit( 'fields1_FileHeader', fields );
          //log.audit('key_FileHeader', key );
            var fields =  segments[ key ].fields;
          //log.audit( 'fields2_FileHeader', fields );
            var content = '';
            recordTotal++;
            var content = '';
            valueBatchTotal++;

            for( var id in fields )
            {
                var size = segments[ key ].fields[ id ].size;
                var _default = segments[ key ].fields[ id ].default;
                var auto = segments[ key ].fields[ id ].auto;
                var internalId = segments[ key ].fields[ id ].internalid;
                var recordId = segments[ key ].fields[ id ].recordid;
                var mask = segments[ key ].fields[ id ].mask;
                var type = segments[ key ].fields[ id ].type;

                var value = getValue( installments[ keys[0] ], internalId, recordId, _default, auto );

                if( value === 'record_total' ) {
                    value = recordTotal;
                }
                if(value ==='valueBatchTotal' ){
                    value = valueBatchTotal;
                }

                if( value === 'sequential' ) {
                    sequential++;
                    value = sequential;
                }

                value = applyMask( type, mask, value );
                value = validateSize( value, size, type );
                content += value;
            }

            content += '\r\n';
            return content;
        }

        /**
         * @function
         * @param segments
         * @param key
         * @return {string|string}
         */
        function buildFileTrailer( segments,installments, key )
        {
            var keys = Object.keys( installments );
            //log.audit('segments_FileTrailer', segments );
            //log.audit('key_FileTrailer', key );
            var fields = segments[ key ].fields;
            //log.audit( 'fields_FileTrailer', fields );
            var content = '';

            for( var id in fields )
            {
                log.debug('id', id)
                var size = segments[ key ].fields[ id ].size;
                var _default = segments[ key ].fields[ id ].default;
                var auto = segments[ key ].fields[ id ].auto;
                var internalId = segments[ key ].fields[ id ].internalid;
                log.audit( 'internalId_FileTrailer', internalId );
                var recordId = segments[ key ].fields[ id ].recordid;
                var mask = segments[ key ].fields[ id ].mask;
                var type = segments[ key ].fields[ id ].type;

                var value = getValue( installments[ keys[0] ], internalId, recordId, _default, auto );
                log.debug('value', value);
                if( value === 'batch_total' ) {
                    //***alterei aqui***///
                    //batchTotal++;
                    value = batchTotal;
                    log.audit( 'batch_total_FileTrailer', value );
                    //inclui esse trecho aqui para o banco Santander
                }else if( value === 'value_batch_total' ) {
                          valueBatchTotal++;
                          value = valueBatchTotal;
                          log.audit( 'value_batch_total_FileTrailer', value );
                }else if( value === 'record_total' ) {
                    recordTotal++;
                    value = recordTotal;
                }else if( value === 'sequential' ) {
                    sequential++;
                    value = sequential;
                }
                value = applyMask( type, mask, value );
                value = validateSize( value, size, type );
                content += value;
            }
            content += '\r\n';
            return content;
        }

        /**
         * @function
         * @param segments - record type RSC CNAB Segment
         * @param installments
         * @param keys - internalid record type RSC CNAB Segment
         * @return {string}
         */
        function buildFileBatch( segments, installments, keys )
        {
            var content = '';
            var completed = [];

            for( var ky in keys )
            {
                var segmentGroup = segments[ keys[ky] ].segmentTypeGroup;

                var batch = keys.filter( function( elem) {
                    return segmentGroup === segments[elem].segmentTypeGroup && completed.indexOf( segmentGroup ) === -1;
                });
                if( batch.length > 0 )
                {
                    var batchHeader = batch.filter( function(elem) {
                        return parseInt( segments[ elem ].container ) === _c._container.batchHeader;
                    });
                    var batchDetails = batch.filter( function(elem) {
                        return parseInt( segments[ elem ].container ) === _c._container.batchDetail;
                    });
                    var batchTrailer = batch.filter( function(elem) {
                        return parseInt( segments[ elem ].container ) === _c._container.batchTrailer;
                    });

                    var installmentsId = getInstallmentsByGroup( installments, segments, segmentGroup, batch );
                    log.audit( 'buildFileBatch', 'Group: '+segmentGroup );
                    log.audit( 'buildFileBatch', 'All installments by group '+segmentGroup+': '+installmentsId );
                    if( parseInt(installments[ installmentsId[0] ].cnabType) === _c._type.payment ) {
                        content += buildPayment( batchHeader, batchDetails, batchTrailer, segments, installments, installmentsId )
                    } else {
                        content += buildBilling( batchHeader, batchDetails, batchTrailer, segments, installments, installmentsId );
                    }

                    completed.push( segmentGroup );
                }
            }
            return content;
        }

        /**
         * @function
         * @param batchHeader
         * @param batchDetails
         * @param batchTrailer
         * @param segments
         * @param installments
         * @param installmentsId
         * @return {*}
         */
        function buildBilling( batchHeader, batchDetails, batchTrailer, segments, installments, installmentsId )
        {
            var content = '';
            recordBatchTotal = 0;
            valuesBatchTotal = 0;
            valuesBatch = 0;

            if( batchHeader.length > 0 ) {
                content += buildBatchHeader( segments, installments[ installmentsId[0] ], batchHeader[0] );
            }

            content += buildBatchDetails( segments, installments, batchDetails, installmentsId );

            if( batchTrailer.length > 0 ) {
                content += buildBatchTrailer( segments, installments, batchTrailer[0] );
            }

            return content;
        }

        /**
         * @function
         * @param batchHeader
         * @param batchDetails
         * @param batchTrailer
         * @param segments
         * @param installments
         * @param installmentsId
         * @return {*}
         */
        function buildPayment( batchHeader, batchDetails, batchTrailer, segments, installments, installmentsId )
        {
            var content = '';
            var completedInst = [];

            for( var y in installmentsId )
            {
                var code = installments[ installmentsId[y] ].custrecord_rsc_cnab_inst_paymentmetho_ls.custrecord_rsc_cnab_pm_code_ds;
                var ids = installmentsId.filter( function(elem)
                {
                    var elemCode = installments[ elem ].custrecord_rsc_cnab_inst_paymentmetho_ls.custrecord_rsc_cnab_pm_code_ds;
                    return code === elemCode && completedInst.indexOf(code) === -1;
                });
                if( ids.length > 0 )
                {
                    log.audit( 'buildPayment', 'Installments by payment code '+code+': '+ids );

                    recordBatchTotal = 0;
                    valuesBatchTotal = 0;
                    valuesBatch = 0;

                    content += buildBatchHeader( segments, installments[ ids[0] ], batchHeader[0] );
                    content += buildBatchDetails( segments, installments, batchDetails, ids );
                    content += buildBatchTrailer( segments, installments, batchTrailer[0] );

                    completedInst.push( code );
                }
            }
            return content;
        }

        /**
         * @function
         * @param segments - record type RSC CNAB Segment
         * @param installments
         * @param key - internalid record type RSC CNAB Segment
         * @return {string}
         */
        function buildBatchHeader( segments, installments, key )
        {
            var fields =  segments[ key ].fields;
            var content = '';

            for( var id in fields )
            {
                var size = segments[ key ].fields[ id ].size;
                var _default = segments[ key ].fields[ id ].default;
                var auto = segments[ key ].fields[ id ].auto;
                var internalId = segments[ key ].fields[ id ].internalid;
                var recordId = segments[ key ].fields[ id ].recordid;
                var mask = segments[ key ].fields[ id ].mask;
                var type = segments[ key ].fields[ id ].type;

                var value = getValue( installments, internalId, recordId, _default, auto );

                if( value === 'batch_total' ) {
                    batchTotal++;
                    value = batchTotal;
                }

                value = applyMask( type, mask, value );
                value = validateSize( value, size, type );
                content += value;
            }

            recordBatchTotal++;
            recordTotal++;
            valueBatchTotal++;
            content += '\r\n';
            return content;
        }

        /**
         *
         * @param segments - record type RSC CNAB Segment
         * @param installments
         * @param keys - internalids record type RSC CNAB Segment
         * @param installmentsId
         * @return {string}
         */
        function buildBatchDetails( segments, installments, keys, installmentsId )
        {
            var content = '';
            var detailsTotal = 1;
			var detailsTotal_237 = 1;
            keys = keys.sort(function(a, b) {
                a = (segments[a].sequence) ? segments[a].sequence : 0;
                b = (segments[b].sequence) ? segments[b].sequence : 0;
                return parseInt(a) - parseInt(b);
            });


            for( var i in installmentsId )
            {
                log.audit('buildBatchDetails', JSON.stringify(installments[ installmentsId[i] ]));
                    for( var k in keys )
                    {
                        var fields =  segments[ keys[k] ].fields;

                        for( var id in fields )
                        {
                        var size = segments[ keys[k] ].fields[ id ].size;
                        var _default = segments[ keys[k] ].fields[ id ].default;
                        var auto = segments[ keys[k] ].fields[ id ].auto;
                        var internalId = segments[ keys[k] ].fields[ id ].internalid;
                        var recordId = segments[ keys[k] ].fields[ id ].recordid;
                        var mask = segments[ keys[k] ].fields[ id ].mask;
                        var type = segments[ keys[k] ].fields[ id ].type;

                        var value = getValue( installments[ installmentsId[i] ], internalId, recordId, _default, auto );

                        if( value === 'batch_total' ) {
                            value = batchTotal;
                        } else if( value === 'batch_details_total' ) {
                            value = detailsTotal;
                        } else if(value ==='batch_details_total_237'){
                            value = detailsTotal_237++;
                        }
                        else if( value === 'record_total' ) {
                            value = recordTotal;
                        }else if( value ==='valueBatchTotal'){
                            value = valueBatchTotal++;
                        }
                        else if( value === 'sequential' ) {
                            sequential++;
                            value = sequential;
                        }
                        value = applyMask( type, mask, value );
                        value = validateSize( value, size, type );
                        content += value;
                    }
                    content += '\r\n';
                    recordBatchTotal++;
                    recordTotal++;
                    valueBatchTotal++;
                }
              	detailsTotal++;
            }
            return content;
        }

        /**
         * @function
         * @param segments
         * @param key
         * @return {string}
         */
        function buildBatchTrailer( segments,installments, key )
        {
            var keys = Object.keys( installments );
            var fields = segments[ key ].fields;
            log.audit( 'fields_BatchTrailer', fields );
            var content = '';

            for( var id in fields )
            {
                var size = segments[ key ].fields[ id ].size;
                var _default = segments[ key ].fields[ id ].default;
                var auto = segments[ key ].fields[ id ].auto;
                var internalId = segments[ key ].fields[ id ].internalid;
                log.audit( 'internalId_BatchTrailer', internalId );
                var recordId = segments[ key ].fields[ id ].recordid;
                var mask = segments[ key ].fields[ id ].mask;
                var type = segments[ key ].fields[ id ].type;

                var value = getValue( installments[ keys[0] ], internalId, recordId, _default, auto );
                log.audit( 'getValue_BatchTrailer', value );
                if( value === 'record_batch_total' ) {
                    recordBatchTotal++;
                    value = recordBatchTotal;
                } else if( value === 'batch_total' ) {
                    value = batchTotal;
                    //log.audit( 'batch_total_BatchTrailer', value );
                } else if( value === 'value_batch_total' ) {
                    value = parseFloat( valuesBatchTotal ).toFixed(2);
                    log.debug({title:'valuesBatchTotalBatchTrailer',details:value})
                }

                value = applyMask( type, mask, value );
                value = validateSize( value, size, type );
                content += value;
            }

            valueBatchTotal++;
            recordTotal++;
            content += '\r\n';
            return content;
        }

        /**
         * @function
         * @param installments
         * @param segments
         * @param group
         * @param segmentsKey
         * @return {string[]}
         */
        function getInstallmentsByGroup( installments, segments, group, segmentsKey )
        {
            var keys = Object.keys( installments );
            return keys.filter( function(elem) {

                if( installments[ elem ].custrecord_rsc_cnab_inst_paymentmetho_ls.segment )
                {
                    var id = installments[ elem ].custrecord_rsc_cnab_inst_paymentmetho_ls.segment.id;
                    var text = installments[ elem ].custrecord_rsc_cnab_inst_paymentmetho_ls.segment.text;
                    var k = segmentsKey.filter( function(elem) {
                        return segments[ elem ].segmentTypeId === id;
                    });
                    return text === group || k.length > 0;

                } else {
                    return keys;
                }
            });
        }

        /**
         * @function
         * @param type
         * @param mask
         * @param value
         * @return {string | Date | void}
         */
        function applyMask( type, mask, value )
        {
            if( mask )
            {
                if( value ) {
                    var fDate = value.split('/');
                    value = numericPadding(fDate[0], 2)+''+numericPadding(fDate[1], 2)+''+fDate[2];
                } else {
                    value = new Date();
                }
                if( mask === 'DDMMAAAA' )
                {
                    if( typeof value === 'object' )
                    {
                        var n = mask.replace( 'DD', numericPadding(value.getDate(), 2) );
                        n = n.replace( 'MM', numericPadding(value.getMonth()+1, 2) );
                        n = n.replace( 'AAAA', value.getFullYear() );
                        value = n;
                    }
                }
                else if( mask === 'DDMMAA' )
                {
                    if( typeof value === 'object' )
                    {
                        var year = value.getFullYear();
                        var v = mask.replace( 'DD', numericPadding(value.getDate(), 2) );
                        v = v.replace( 'MM', numericPadding(value.getMonth()+1, 2) );
                        v = v.replace( 'AA', year.toString().substr(2,2) );
                        value = v;
                    }
                    else {
                        var m = value.substr(0,4);
                        value = m+''+value.substr(6,2);
                    }
                }
                else if( mask === 'MMAAAA' )
                {
                    if( typeof value === 'object' )
                    {
                        var o = mask.replace( 'MM', numericPadding(value.getMonth()+1, 2) );
                        o = o.replace( 'AAAA', value.getFullYear() );
                        value = o;
                    }
                    else {
                        value = value.substr(2,6);
                    }
                }
                else if( mask === 'HHMMSS' )
                {
                    if( typeof value !== 'object' ) {
                        value = new Date();
                    }
                    var h = mask.replace( 'HH', numericPadding(value.getHours()+1,2) );
                    h = h.replace( 'MM', numericPadding(value.getMinutes()+1,2) );
                    h = h.replace( 'SS', numericPadding(value.getSeconds()+1,2) );
                    value = h;
                }
            }
            return value;
        }

        /**
         * @function
         * @param installment
         * @param internalId
         * @param recordId
         * @param _default
         * @param auto
         * @return {string}
         */
        function getValue( installment, internalId, recordId, _default, auto )
        {
            log.debug('installment', installment);
            log.debug('recordId', recordId);
            var value = '';
            if( _default )
            {
                value = _default;
            }
            else if( auto )
            {
                if( Number(auto) === _c._autoComplete.zeros ) {
                    value = 0;
                }
            }
            else if( internalId )
            {   
                if(internalId == "value_batch_total" || internalId == "record_batch_total" || internalId == "batch_total" || internalId == "sequential"){
                    value = internalId;
                }else{
                    if( installment )
                    {   
                        if( recordId ) {
                            value = installment[ recordId ][ internalId ];
                            log.audit('recordId',value);
                        }
                        else if( reserved.indexOf(internalId) > -1 ) {
                            value = internalId;
                            log.audit('internalId',value);
                        }
                        else {
                            value = installment[ internalId ];
                            log.audit('installment',value);
                        }
                        if( internalId === 'internalid' ) {
                            value = (parseInt(value)).toString(36) + '-' + (parseInt(installment.transaction)).toString(36);
                            log.audit('transação',value);
                        } else if( internalId === 'amount' && !recordId ) {
                            ((valuesBatchTotal += parseFloat( value )) || (valuesBatch = parseFloat(value)))
                            log.audit('valuesBatchTotal',valuesBatchTotal);
                            log.audit('valuesBatch',valuesBatch);
                            //valuesBatchTotal += parseFloat( value );
                        }
                    } else {
                        value = internalId;
                    }
                }
                
            }
            return (value) ? value : '';
        }

        /**
         * @function
         * @param value
         * @param size
         * @param type
         * @return {string}
         */
        function validateSize( value, size, type )
        {
            if( value !== undefined && value !== null )
            {
                value = value.toString().replace( /[`~!@#$%^&*()ºª•¶§∞¢£™¡_|+\=?;:'",.<>\{\}\[\]\\\/]/gi, '' );
                value = removeAccents( value );

                if( value.length > size ) {
                    value = value.substring(0,size);
                }
                else if( value.length < size )
                {
                    if( Number(type) === _c._fieldType.numeric ) {
                        value = numericPadding( value, size );
                    } else {
                        value = alphanumericPadding( value, size );
                    }
                }
            }
            return value;
        }

        /**
         * @function
         * @param value
         * @param size
         * @return {string}
         */
        function numericPadding( value, size )
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
         * @param value
         * @param size
         * @return {string}
         */
        function alphanumericPadding( value, size )
        {
            var pad = '';
            for( var i = 0; i < size; i++ ) {
                pad += ' ';
            }
            value = value.toString();
            return value + pad.substring( 0, pad.length - value.length );
        }

        /**
         * @function
         * @param sentence
         * @return {*|void|string}
         */
        function removeAccents( sentence )
        {
            var mapAccentsHex = {
                a : /[\xE0-\xE6]/g,
                A : /[\xC0-\xC6]/g,
                e : /[\xE8-\xEB]/g,
                E : /[\xC8-\xCB]/g,
                i : /[\xEC-\xEF]/g,
                I : /[\xCC-\xCF]/g,
                o : /[\xF2-\xF6]/g,
                O : /[\xD2-\xD6]/g,
                u : /[\xF9-\xFC]/g,
                U : /[\xD9-\xDC]/g,
                c : /\xE7/g,
                C : /\xC7/g,
                n : /\xF1/g,
                N : /\xD1/g
            };
            for ( var letter in mapAccentsHex )
            {
                var regularExpression = mapAccentsHex[ letter ];
                sentence = sentence.replace( regularExpression, letter );
            }
            return sentence;
        }

        return {
            buildFile: buildFile
        }
    }
);
