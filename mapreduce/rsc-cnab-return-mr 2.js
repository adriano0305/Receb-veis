/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @scriptName rsc-cnab-return-mr
 */
define([ 'N/record', 'N/log', 'N/runtime', 'N/error', 'N/file', './rsc-cnab-return' ],
    /**
     *
     * @param record
     * @param log
     * @param runtime
     * @param Nerror
     * @param _file
     * @param lib
     * @return {{getInputData: getInputData, summarize: summarize, map: map}}
     */
    function( record, log, runtime, Nerror, _file, lib )
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
                log.audit( 'getInputData', script.getParameter({name:'custscript_rsc_cnab_returndata_ds'}) );
                const data = JSON.parse( script.getParameter({name:'custscript_rsc_cnab_returndata_ds'}) );

                if( data.fileId )
                {
                    var lines = [];
                    var lastPosition = 0;
                    lib.checkExtension( data.fileId, data.bankId );
                    var file = _file.load({ id: data.fileId });
                    var content = file.getContents();
                    content = ( content.lastIndexOf('\n') === (content.length)-1 ) ? content : content+'\n';

                    while( content.indexOf('\n', lastPosition) !== -1 )
                    {
                        var breakPosition = content.indexOf( '\n', lastPosition );
                        var currentLine = content.substring( lastPosition, breakPosition - 1 );
                        lines.push({
                            processingId: data.processingId,
                            layoutId: data.layoutId,
                            bankId: data.bankId,
                            userId: data.userId,
                            line: currentLine
                        });
                        lastPosition = breakPosition + 1;
                    }
                    return lines;
                }

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
            var value = JSON.parse( context.value );
            var _installment = undefined;

            try
            {
                // Busca os segmentos (record type) do layout
                var segments = lib.getSegments( value.layoutId );
                var keys = Object.keys( segments );
                var completed = [];

                for( var i in keys )
                {
                    var segmentType = segments[keys[i]].segmentType;

                    // Separa os segmentos por tipo de segmento A, J, O, N e Sem segmento (cobrança)
                    var group = keys.filter( function( elem) {
                        return segmentType === segments[elem].segmentType && completed.indexOf( segmentType ) === -1;
                    });
                    if( group.length > 0 )
                    {
                        var fields =  segments[ group[0] ].fields;
                        var fieldsId = Object.keys( fields );

                        // Só processa as linhas do arquivo que são do tipo detalhe de lote
                        if( lib.isSameSegment(fields, fieldsId, value.line) )
                        {
                            // Pega os valores da linha do arquivo referente à parcela
                            var installment = lib.getInstallmentValuesByLine( fields, fieldsId, value.line );
                            _installment = installment;
                            log.audit( 'map', 'installment: '+JSON.stringify(installment) );

                            var layout = lib.getLayout( value.layoutId );
                            log.audit( 'map', 'layout: '+JSON.stringify(layout) );

                            var _occurrences = _installment.occurrences.trim();
                            var len = _occurrences.length;

                            for (var i = 0; i<len; i+=2) {
                                var occurrence = lib.getOccurrence( value.bankId, _occurrences.substring(i,i+2), layout );
                                log.audit( 'map', 'occurrence: '+JSON.stringify(occurrence) );
                             var obj = lib.update( installment, occurrence, layout );
                                if ( obj.processed )
                                {

                                    lib.createNote( _installment, value.processingId, value.userId, undefined, occurrence );
                                    context.write({ key: value.processingId, value: _installment });
                                }
                                else{
                                    log.audit( 'error', obj.error );
                                    throw obj.error;
                                }
                            }
                        }
                    }
                  	//comentei esse trecho do codigo e não deu mais erro:
                    //completed.push( segments[ keys[i] ].segmentType );
                }
            } catch( e ) {
                const _error = Nerror.create({ name: value.processingId, message: e });
                lib.createNote( _installment, value.processingId, value.userId, {error: JSON.stringify(_error), line: value.line} );
                throw _error;
            }
        }

        /**
         * @function
         * @param context
         */
        function summarize( context )
        {
            var processingId = 0;
            var _error = 0;

            /** Errors Iterator */
            context.mapSummary.errors.iterator().each( function( key, error )
            {
                //log.audit( 'summarize', error );
                var e = JSON.parse( error );
                processingId = e.name;
                _error++;
                return true;
            });

            /** Output Iterator */
            context.output.iterator().each( function( key, value )
            {
              //log.debug('Key', key);
              //log.debug('value', value);
              processingId = key;
                return true;
            });

            /** Update Return File Processing */
            lib.updateReturnProcessing( processingId, _error );
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    });