/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
 define(['N/search', 'N/runtime', 'N/record', './rsc_junix_call_api.js', 'N/query', 'N/file', 'N/encode'],
    
 (search, runtime, record, api, query, file, encode) => {
    var getInputData = function () {
        return search.create({
            type: 'creditmemo',
            filters: [
                // ['custbody_rsc_pago', 'IS', '1'],
                // 'AND',
                ['custbody_rsc_boleto_criado', 'IS', 'F'],
                'AND',
                ['mainline', 'IS', 'T'],
            //    'AND',
            //    ['internalid', 'is', 159001]          
            ],
        });
    };
    var map = function (ctx) {
        var req = JSON.parse(ctx.value);
        log.debug('req',req);
        try{
        var lookupMemCred = search.lookupFields({
            type:'creditmemo',
            id:req.id,
            columns:['custbody_lrc_numero_contrato', 'trandate', 'total', 'custbody_rsc_cnab_inst_bank_ls', 'entity', 'subsidiary', 'custbody_rsc_projeto_obra_gasto_compra', 'custbody_rsc_ref_contrato']
        })
        log.debug('lookupMemCred', lookupMemCred)
        var resultado = sendContract(lookupMemCred.custbody_rsc_ref_contrato[0].value, req.id);
        
        if(resultado == 1){
            var salesLookup = record.load({
                type:'salesorder',
                id: lookupMemCred.custbody_rsc_ref_contrato[0].value,
            })
            log.debug("lookupMemCred", lookupMemCred);
            // var nBoleto = ""
            // if(lookupMemCred.custbody_lrc_numero_contrato){
            //     nBoleto = lookupMemCred.custbody_lrc_numero_contrato;
            // }
            var date = lookupMemCred.trandate;
            var total = lookupMemCred.total;
            var banco = "";
            var codBanco = "";
            var contaSearch = search.create({
                type: 'customrecord_rsc_cnab_bankaccount',
                filters: [
                    ['custrecord_rsc_cnab_ba_entity_ls', 'IS', salesLookup.getValue('custbody_rsc_projeto_obra_gasto_compra')]
                ]
            }).run().getRange({
                start: 0,
                end: 1
            })
            log.debug("contaSearch", contaSearch);

            var recordConta = record.load({
                type: 'customrecord_rsc_cnab_bankaccount',
                id: contaSearch[0].id
            })
            if(recordConta.getValue('custrecord_rsc_cnab_ba_bank_ls')){
                banco = recordConta.getValue('custrecord_rsc_cnab_ba_bank_ls')
                var bancoLookup = search.lookupFields({
                    type: 'customrecord_rsc_cnab_bank',
                    id: recordConta.getValue('custrecord_rsc_cnab_ba_bank_ls'),
                    columns: ['custrecord_rsc_cnab_bank_code_ds']
                })
                log.debug("bancoLookup", bancoLookup);

                if(bancoLookup.custrecord_rsc_cnab_bank_code_ds){
                    codBanco = bancoLookup.custrecord_rsc_cnab_bank_code_ds
                }
            }
            var clienteLookup = search.lookupFields({
                type: 'customer',
                id: lookupMemCred.entity[0].value,
                columns:['custentity_enl_cnpjcpf', 'companyname', 'salutation', 'shipaddressee']
            })
            log.debug("clienteLookup", clienteLookup);

            var nome = "";
            if (clienteLookup.companyname) {
                nome = String(clienteLookup.companyname);
            }
            else if (clienteLookup.salutation) {
                nome = String(clienteLookup.salutation);
            }
            else {
                nome = String(clienteLookup.shipaddressee);
            }
            log.debug("nome", nome);
            
            
            
            var searchSub = search.lookupFields({
                type: 'subsidiary',
                id: lookupMemCred.subsidiary[0].value,
                columns:[
                    'taxidnum'
                ]
            })
            log.debug("searchSub", searchSub);
            log.debug("portfolio", recordConta.getValue('custrecord_rsc_cnab_ba_portfolio_ls'))

            var portLookup = record.load({
                type: 'customrecord_rsc_cnab_portfolio',
                id: recordConta.getValue('custrecord_rsc_cnab_ba_portfolio_ls'),
            })
            
            date = new Date(date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"))

            // portLookup.getValue('custrecord_rsc_nosso_numero');
            log.debug("salesLookup", salesLookup)
            log.debug("nContrato",salesLookup.getValue('custbody_lrc_numero_contrato'))
            var obj = {
                "numeroDocumento": salesLookup.getValue('custbody_lrc_numero_contrato'),
                "codigoBanco": codBanco,
                "dataVencimento": date,
                "dataBaixa": date,
                "numeroContrato": salesLookup.getValue('custbody_lrc_numero_contrato'),
                "nossoDocumento": portLookup.getValue('custrecord_rsc_numero_doc') || 1,
                "nossoNumero": portLookup.getValue('custrecord_rsc_nosso_numero') || 1,
                "Valor": (total * -1),
                "cedenteCodigo": lookupMemCred.entity[0].value,
                "cedenteCPFCNPJ": clienteLookup.custentity_enl_cnpjcpf,
                "cedenteNome": nome,
                "cedenteAgencia": recordConta.getValue("custrecord_rsc_cnab_ba_agencynumber_ls"),
                "cedenteConta": recordConta.getValue("custrecord_rsc_cnab_ba_number_ds"),
                "cedenteContaDigito": recordConta.getValue("custrecord_rsc_cnab_ba_dvnumber_ds"),
                "sacadoCPFCNPJ": searchSub.taxidnum,
                "codigoCarteira": portLookup.getValue("custrecord_rsc_cnab_portfolio_code_ds"),
                "linhaDigitavel": ""
            }
            // var body = {
            //     "dados": obj,
            //     "ok": true,
            //     "mensagem": "Baixa Realizada"
            // }
            log.debug( 'obj', obj);
            var retorno = JSON.parse(api.sendRequest(obj, 'INCLUSAO_BOLETO_JUNIX/1.0/'));
            log.debug({title: 'Resultado', details: retorno});
            if(retorno.OK){
                var retornoBoleto = JSON.parse(api.getBoleto('OBTER_BOLETO_PDF_JUNIX/1.0?nossoNumero=' + portLookup.getValue('custrecord_rsc_nosso_numero')));
                log.debug('ResultadoBoleto', retornoBoleto)
                // var newFile = atob(JSON.stringify(retornoBoleto.fileContent));
                // var newFile = encode.convert({
                //     string: retornoBoleto.fileContent,
                //     inputEncoding: encode.Encoding.BASE_64,
                //     outputEncoding: encode.Encoding.UTF_8
                // })
                // log.debug('newFile', newFile)
                var boletoGerado = file.create({
					name: 'boleto_' + portLookup.getValue('custrecord_rsc_nosso_numero')+'.pdf',
					fileType: file.Type.PDF,
					contents: retornoBoleto.fileContent,
					// encoding: file.Encoding.UTF8,
					folder: 789
				}).save()
                log.debug('boletoGerado', boletoGerado)
                var creditMemoRecord = record.load({
                    type:'creditmemo',
                    id: req.id
                })
                creditMemoRecord.setValue({
                    fieldId:'custbody_rsc_boleto_criado',
                    value: true
                })
                creditMemoRecord.setValue({
                    fieldId:'custbody_rsc_boleto_gerado',
                    value: boletoGerado
                })
                creditMemoRecord.save({
                    ignoreMandatoryFields: true
                })
                portLookup.setValue({
                    fieldId: 'custrecord_rsc_nosso_numero',
                    value: Number(portLookup.getValue("custrecord_rsc_nosso_numero")) + 1
                })
                portLookup.save({
                    ignoreMandatoryFields: true
                })
            }
        }
    }catch(e){
        log.debug('Error', e)
    }
    };
    const summarize = (summaryContext) => {

    }
    function sendContract(contract, memo) {
        log.debug('contract', contract);
        log.debug('memo', memo)
        var salesRecord = record.load({
            type:'salesorder',
            id: contract
        })
        var querySeries = query.runSuiteQL(
            {query:'select b.recordid codigoSerie, b.name tipoParcela, TO_CHAR(min(a.duedate),\'YYYY-MM-DD\') dataReferencia, 0 taxaJuros, sum(foreigntotal), 0 prazo, max(foreigntotal) valorParcela,  TO_CHAR(min(a.duedate),\'YYYY-MM-DD\') dataPrimeiroVencimento, count(*) quantidade, count(*) quantidademeses, \'A VISTA\' tipoReceita\n' +
                        'from transaction a\n' +
                        'join customlist_rsc_tipo_parcela b on a.custbodyrsc_tpparc = b.recordid\n' +
                        'where custbody_lrc_fatura_principal = ?\n' +
                        'group by b.recordid, b.name', params: [contract]});
        var resultadoSeries = querySeries.asMappedResults();
        var series = [];
        var serieArray = [];
        if (resultadoSeries.length > 0){
                for (let i = 0; i < resultadoSeries.length; i++) {
                        var serie = resultadoSeries[i];
                        var dataRef = serie['datareferencia'];
                        dataRef
                        var serieArr = {
                                "codigoSerie": serie['codigoserie'],
                                "codigoSerieExterno": serie['codigoserieexterno'],
                                "tipoParcela": serie['tipoparcela'],
                                "numeroSerie": serie['codigoserie'],
                                "aplicaCorrecao": serie['aplicacorrecao'],
                                "dataReferencia": serie['datareferencia'],
                                "taxaJuros": serie['taxajuros'],
                                "valor": serie['valor'],
                                "prazo": serie['prazo'],
                                "ativo": true,
                                "valorParcela": serie['valorparcela'],
                                "dataPrimeiroVencimento": serie['dataprimeirovencimento'],
                                "quantidade": serie['quantidade'],
                                "quantidademeses": serie['quantidademeses'],
                                "tipoReceita": serie['tipoReceita']
                        }
                        series.push(serieArr);
                        serieArray.push({"tipoParcela": serie['tipoparcela'], "codigoSerie": serie['codigoserie']})
                }
        }
        var parcelas = [];

        var sql = 'select t.id codigo, \n' +
            '\tcustbodyrsc_tpparc numeroSerie,\n' +
            '\tcustbodyrsc_tpparc tpparc,\n' +
            '\tt.duedate data, \n' +
            '\t\' \' dataPagamento,\n' +
            '\tt.foreigntotal\tvalorParcela,\n' +
            '\tt.foreignamountpaid valorPago,\n' +
            '\tt.foreignamountunpaid valorEmAberto, \n' +
            '\t(select b.foreignamount from transactionline b where b.transaction = t.id and linesequencenumber = 0)\tvalorParcelaPrincipal,\n' +
            '\t0 valordesconto,\n' +
            '\t0 juros,\n' +
            '        0 multa,\n' +
            '        0 mora,\n' +
            '        0 prorata,\n' +
            '        0 igpm,\n' +
            '\t(select b.foreignamount from transactionline b where b.transaction = t.id and linesequencenumber = 2) incc,\n' +
            '\t\'\' tipoJuros,\n' +
            '\tstatus status,\n' +
            '\tt.foreigntotal valorAtualizado,\n' +
            '        \' \' codigoParcelaExterno,\n' +
            '        0 codigoContrato,\n' +
            '        \' \' codigoContratoExterno,\n' +
            '        t.entity codigoClientePrincipal,\n' +
            '        \' \' codigoClienteExterno,\n' +
            '        \' \' codigoUnidadeExterno,\n' +
            '        \' \' dataEmissaoBoleto,\n' +
            '        t.duedate dataVencimento\n' +
            'from transaction as t \n' +
            ' where t.custbody_lrc_fatura_principal = '+ contract +' and t.type = \'CustInvc\'  order by t.duedate asc';

        log.debug({title: 'Sql ', details: sql})
        var queryParcelas = query.runSuiteQL({
                query: sql
        });
        var resultadoParcelas = queryParcelas.asMappedResults();
        log.debug({title: 'Parcela', details: resultadoParcelas});
        if (resultadoParcelas.length > 0){
                for (var i = 0; i < resultadoParcelas.length; i++){
                        var parcel = resultadoParcelas[i];
                        log.debug({title: 'Parcela', details: parcel});
                        log.debug({title: 'Tipo Parcela', details: parcel['tpparc']});
                        log.debug({title: 'Lista Tipos Parcela', details: serieArray});
                        var tipoParcela = serieArray.filter(word => word.codigoSerie == parcel['tpparc']);
                        var parcela = {
                                codigo: parcel['codigo'],
                                numeroSerie: parcel['numeroserie'],
                                numeroParcela: parcel['numeroparcela'],
                                tipoParcela: tipoParcela[0].tipoParcela,
                                data: parcel['data'],
                                dataPagamento: parcel['datapagamento'],
                                valorParcela: parcel['valorparcela'],
                                valorPago: parcel['valorpago'],
                                valorEmAberto: parcel['valoremaberto'],
                                valorParcelaPrincipal: parcel['valorparcelaprincipal'],
                                valorDesconto: parcel['valordesconto'],
                                juros: parcel['juros'],
                                multa: parcel['multa'],
                                mora: parcel['mora'],
                                prorata: parcel['prorata'],
                                igpm: parcel['igpm'],
                                incc: parcel['incc'],
                                tipoJuros: parcel['tipojuros'],
                                status: parcel['status'],
                                valorAtualizado: parcel['valoratualizado'],
                                codigoParcelaExterno: parcel['codigoparcelaexterno'],
                                codigoContrato: parcel['codigocontrato'],
                                codigoContratoExterno: parcel['codigocontratoexterno'],
                                codigoClientePrincipal: parcel['codigoclienteprincipal'],
                                codigoClienteExterno: parcel['codigoclienteexterno'],
                                codigoUnidadeExterno: parcel['codigounidadeexterno'],
                                dataEmissaoBoleto: parcel['dataemissaoboleto'],
                                dataVencimento: parcel['datavencimento']
                        }
                        parcelas.push(parcela);
                }
        }

        var queryCliente = query.runSuiteQL({
                query:'select b.altname nome, custentity_enl_cnpjcpf cpF_CNPJ, b.email email, custentity_lrc_data_nascimento dataNascimento, d.zip cep, d.addr1 endereco, \n' +
                    'd. custrecord_enl_numero enderecoNumero, d.addr2 enderecoComplemento, d.addr3 bairro, city cidade, state uf,  a.custrecord_rsc_principal principal, \n' +
                    'custentity_lrc_nacionalidade nacionalidade,  custentity_lrc_naturalidade naturalidade, custentity_lrc_estado_civil estadoCivil, custentity_lrc_rg rg, \n' +
                    'custentity_lrc_orgao_expedidor orgaoExpedidor, custentityprof profissao, c.homephone telefoneComercial, c.mobilephone celular, custentity_lrc_tipo_pessoa tipo from customrecord_rsc_finan_client_contrato a \n' +
                    'join entity b on b.id = a.custrecord_rsc_clientes_contratos\n' +
                    'join customer c on b.customer = c.id \n' +
                    'join entityaddress d on c.defaultbillingaddress = d.nkey ' +
                    'where custrecord_rsc_fat_contrato = ?'
        , params: [contract]});
        log.debug('sqlClinete', 'select b.altname nome, custentity_enl_cnpjcpf cpF_CNPJ, b.email email, custentity_lrc_data_nascimento dataNascimento, d.zip cep, d.addr1 endereco, \n' +
        'd. custrecord_enl_numero enderecoNumero, d.addr2 enderecoComplemento, d.addr3 bairro, city cidade, state uf,  a.custrecord_rsc_principal principal, \n' +
        'custentity_lrc_nacionalidade nacionalidade,  custentity_lrc_naturalidade naturalidade, custentity_lrc_estado_civil estadoCivil, custentity_lrc_rg rg, \n' +
        'custentity_lrc_orgao_expedidor orgaoExpedidor, custentityprof profissao, c.homephone telefoneComercial, c.mobilephone celular, custentity_lrc_tipo_pessoa tipo from customrecord_rsc_finan_client_contrato a \n' +
        'join entity b on b.id = a.custrecord_rsc_clientes_contratos\n' +
        'join customer c on b.customer = c.id \n' +
        'join entityaddress d on c.defaultbillingaddress = d.nkey ' +
        'where custrecord_rsc_fat_contrato = ?')
        var results = queryCliente.asMappedResults();
        var compradores = [];
        if (results.length > 0){
                for (var i = 0; i< results.length; i++) {
                        var cliente = results[i];
                        var informacoesProfissionais = {
                                tipo: "string",
                                cargoFuncao: "string",
                                dataAdmissao: "2021-09-11T17:09:36.892Z",
                                telefone: "string",
                                empresa: "string",
                                cnpj: "string",
                                cep: "string",
                                endereco: "string",
                                enderecoNumero: "string",
                                enderecoComplemento: "string",
                                bairro: "string",
                                cidade: "string",
                                uf: "string",
                                valorRenda: 0,
                                valorRendaLiquido: 0
                        }
                        var fgts = {
                                cpF_CNPJ: "string",
                                valorFGTS: 0,
                                numeroContaFGTS: "string",
                                codigoEmpregador: "string",
                                valor: 0,
                                possuiTresAnos: true
                        }
                        var informacoesBancarias = {
                                cpF_CNPJ: "string",
                                codigoBanco: "string",
                                agencia: 0,
                                conta: 0,
                                valorLimite: 0,
                                tipoConta: "string"
                        }

                        var comprador = {
                                nome: cliente['nome'],
                                cpF_CNPJ: cliente['cpf_cnpj'],
                                email: cliente['email'],
                                dataNascimento: cliente['dataNascimento'],
                                cep: cliente['cep'],
                                endereco: cliente['endereco'],
                                enderecoNumero: cliente['enderecoNumero'],
                                enderecoComplemento: cliente['enderecoComplemento'],
                                bairro: cliente['bairro'],
                                cidade: cliente['cidade'],
                                uf: cliente['uf'],
                                principal: (cliente['principal'] == 'T'? true: false),
                                nacionalidade: cliente['nacionalidade'],
                                naturalidade: cliente['naturalidade'],
                                estadoCivil: cliente['estadoCivil'],
                                rg: cliente['rg'],
                                orgaoExpedidor: cliente['orgaoExpedidor'],
                                profissao: cliente['profissao'],
                                telefoneComercial: cliente['telefoneComercial'],
                                celular: cliente['celular'],
                                //celularComercial: "string",
                                //telefoneResidencial: "string",
                                tipo: cliente['tipo'],
                                //cpF_CNPJ_Conjuge: "string",
                                sexo: "M",
                                //informacoesProfissionais: informacoesProfissionais,
                                //fgts: fgts,
                                //informacoesBancarias: informacoesBancarias
                        }
                        compradores.push(comprador);

                }
        }
        var unidade ="";
        var bloco = 0;
        if(salesRecord.getValue('custbody_rsc_tran_unidade')){
                var searchUnidade = search.lookupFields({
                        type: 'customrecord_rsc_unidades_empreendimento',
                        id: salesRecord.getValue('custbody_rsc_tran_unidade'),
                        columns:[
                                'custrecord_rsc_un_emp_bloco',
                                'custrecord_rsc_un_emp_unidade'
                        ]
                })
                unidade = searchUnidade.custrecord_rsc_un_emp_unidade
                if(searchUnidade.custrecord_rsc_un_emp_bloco.length > 0){
                        bloco= searchUnidade.custrecord_rsc_un_emp_bloco[0].value
                }
        }
        // var invoiceRecord = record.load({
        //         type:'salesorder',
        //         id: resultado.id
        // })
        var projeto = record.load({
                type: record.Type.JOB,
                id: salesRecord.getValue('custbody_rsc_projeto_obra_gasto_compra'),
                isDynamic: false,
        });
        var subsidiary = salesRecord.getValue('subsidiary');
        var entityid = String(projeto.getValue('entityid')).split(" ");
        /* recuperar os dados */
        var subsidiary = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiary,
                isDynamic: false,
        });
        var codProject = entityid[0];
       
        var memLookup = search.lookupFields({
                type:'creditmemo',
                id: memo,
                columns:[
                        'trandate',
                        'total',
                        'entity'
                ]
        })
        var date = memLookup.trandate
        date = date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3");
        log.debug("date", date);
        date = new Date(date);
        var newSerie = {
                "codigoSerie": 6,
                "codigoSerieExterno": "",
                "tipoParcela": 'Unica',
                "numeroSerie": 6,
                "aplicaCorrecao": "",
                "dataReferencia": date,
                "taxaJuros": 0,
                "valor": (memLookup.total)*-1,
                "prazo": 0,
                "ativo":false,
                "valorParcela": (memLookup.total)*-1,
                "dataPrimeiroVencimento": date,
                "quantidade": 1,
                "quantidademeses":1,
                "tipoReceita": 'A VISTA'
        }
        series.push(newSerie);
    
        var newParcela = {
            codigo: "",
            numeroSerie: "6",
            // numeroParcela: parcel['numeroparcela'],
            tipoParcela: 'Unica',
            data: date,
            dataPagamento: date,
            valorParcela: (memLookup.total)*-1,
            valorPago: 0,
            valorEmAberto: (memLookup.total)*-1,
            valorParcelaPrincipal: (memLookup.total)*-1,
            valorDesconto: 0,
            juros: 0,
            multa: 0,
            mora: 0,
            prorata: 0,
            igpm: 0,
            incc: 0,
            tipoJuros: null,
            status: "D",
            valorAtualizado: (memLookup.total)*-1,
            codigoParcelaExterno: "",
            codigoContrato: 0,
            codigoContratoExterno: "",
            codigoClientePrincipal: memLookup.entity[0].value,
            codigoClienteExterno: "",
            codigoUnidadeExterno: "",
            dataEmissaoBoleto: "",
            dataVencimento: date
        }
        
        parcelas.push(newParcela);
        log.debug('CodigoEmpreendimento', subsidiary.getValue('name').substr(0,4))
        
        var objInvoice = {
                codigoEmpreendimento: codProject,
                codigoBloco: bloco,
                unidade: unidade,
                numeroProposta: salesRecord.getValue('custbody_rsc_nr_proposta'),
                numeroContrato: salesRecord.getValue('custbody_lrc_numero_contrato'),
                dataVenda: salesRecord.getValue('custbody_rsc_data_venda'),
                valorVenda: salesRecord.getValue('custbody_rsc_vlr_venda'),
                ativo: true,
                tipoContrato: salesRecord.getValue('custbody_lrc_tipo_contrato'),
                //itbiGratis: true,
                //registroGratis: true,
                dataEmissao: salesRecord.getValue('custbody_rsc_data_venda'),
                valorVendaAtualizada: salesRecord.getValue('total'),
                valorSaldoDevedor: salesRecord.getValue('total'),
                //banco: "string",
                //tipoOperacao: "string",
                //dataRepasseFuturo: "2021-09-11T17:09:36.892Z",
                //modalidadeFinanciamento: "string",
                //sistemaAmortizacao: "string",
                //valorFGTS: 0,
                //valorSubsidio: 0,
                //valorInterveniencia: 0,
                //valorRecursosProprios: 0,
                //taxaJuros: 0,
                //dataLiberacaoChave: "string",
                //tipoBloqueio: "string",
                //dataBloqueio: "2021-09-11T17:09:36.892Z",
                //status : 'Contrato',
                compradores: compradores,
                series: series,
                parcelas: parcelas
        };
        var body = objInvoice;
        log.debug({title: 'objInvoice', details: objInvoice});
        log.debug({title: 'Body', details: body});
        var retorno = api.sendRequest(body, 'CONTRATO_SALVAR_JUNIX/1.0/');
        log.debug({title: 'Retorno', details: retorno});
        log.debug({title: 'OK', details: JSON.parse(retorno).OK});
        if(JSON.parse(retorno).OK){
            return 1
        }else{
            return 2
        }
        retorno = JSON.parse(retorno)

        // if(retorno.OK == true){
        //         log.debug({title: 'OK', details: retorno.Dados});
        //         var nContrato = retorno.Dados;
        //         var nContratoSplited = String(nContrato).split(" ");
        //         log.debug('nContratoSplited', nContratoSplited)
        //         invoiceRecord.setValue({
        //                 fieldId:'custbody_lrc_numero_contrato',
        //                 value:  nContratoSplited[3]
        //         })
        //         log.debug('nContratoSplited[3]', nContratoSplited[3])
        //         invoiceRecord.save({
        //                 ignoreMandatoryFields: true
        //         });
        // }
        /*invoiceRecord.setValue({
                fieldId: 'custbody_lrc_enviado_para_junix',
                value: true
        });*/

    }
    return {getInputData, map, summarize}
});
