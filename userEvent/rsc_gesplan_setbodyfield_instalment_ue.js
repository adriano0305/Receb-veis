/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
* Script User event responsavel por gravar a representacao json dos items,  intalments(parcelas)
* e expenses report quando um registro de transacao e gravado.
*
*/
const ZERO = Number('0').toFixed(2);

define(['N/log', 'N/record', "N/search",
    "../tools/rsc_gesplan_tools", "../tools/rsc_gesplan_retorno_api",
    "../tools/rsc_gesplan_retorno",
    "N/query"],

    (log, nsRecord, nsSearch,
        gesplanTools,
        gesplanRetornoApi,
        gesplanRetorno,
        nsQuery) => {


        const beforeLoad = (context) => { }

        const beforeSubmit = (context) => {
            let ctx = context;
            //Contas a receber
            switch (ctx.newRecord.type) {
                case 'vendorbill':
                    //Contas a pagar
                    VendorBillUserEvent.beforeSubmit(context);
                    break;

                // case 'vendorpayment' : 
                //     VendorPaymentUserEvent.afterSubmit(context);
                //     break;

                 case 'salesorder' : 
                     SalesOrderUserEvent.beforeSubmit(context);
                     break;

                // case 'customerpayment' : 
                //     CustomerPaymentUserEvent.afterSubmit(context);
                //     break;

                default:
                    break;

            }


        }
        const afterSubmit = (context) => {
            let ctx = context;
            log.debug("Running aftersubmit ", " ****** "+ctx.type+"  " + context.newRecord.type + " - " + context.type + " ******* ");

            //run only on Create and edit and line edition
            if (ctx.type == ctx.UserEventType.CREATE || ctx.type == ctx.UserEventType.EDIT || ctx.type == ctx.UserEventType.XEDIT || ctx.type == ctx.UserEventType.DELETE) {
                let newRecord = ctx.newRecord;
                
                //seta data da ultima atualizacao para todas as transacoes
                newRecord.setValue({
                    fieldId: 'custbody_rsc_gesplan_lastmodifdate_dt',
                    value: new Date()
                });

                switch (newRecord.type) {
                    case 'vendorbill':
                        //Contas a pagar
                        VendorBillUserEvent.afterSubmit(context);
                        break;
                    case 'purchaseorder':
                        VendorBillUserEvent.afterSubmit(context);
                        break;
                    case 'vendorpayment':
                        VendorPaymentUserEvent.afterSubmit(context);
                        break;

                    case 'salesorder':
                        SalesOrderUserEvent.afterSubmit(context);
                        break;

                    case 'customerpayment':
                        CustomerPaymentUserEvent.afterSubmit(context);
                        break;

                    default:
                        break;

                }
            }
        }






        /**
         * Classe responsavel por seleionar as invoices (parcelas) das sales orders (pedidos).
         * 
         */
        class SalesOrderInstalmentSublistBuilder extends gesplanTools.DefaultInstalmentSublistBuilder {
            constructor(transactionRecord) {
                super(transactionRecord);
                this.logMsg = "InvoiceInstalmentSublistBuilder.build(" + this.record.type + " - " + this.record.id + ")"
            }

            loadinvoiceList = (salesOrderId) => {
                //sql that search all invoices of a sales order by id.
                //the field that connects a sales order with invoices is 'fatural_pricipal_id'
                let sql =
                    ` SELECT
                        so.recordtype         as so_recordtype,
                        so.type               as so_type,
                        so.id                 as so_id,
                        so.terms              as so_terms,
                        BUILTIN.DF(so.terms) as so_terms_display,
                        so.status             as so_status,
                        BUILTIN.DF(so.status) as so_status_display,
                        so.trandisplayname    as so_trandisplayname,
                        so.foreigntotal       as so_foreigntotal,
                        inv.trandisplayname   as inv_trandisplayname,
                        inv.foreigntotal      as inv_foreigntotal,
                        inv.recordtype,
                        inv.type,
                        inv.id AS inv_id,
                        inv.trandate,
                        inv.lastmodifieddate,
                        inv.duedate AS inv_duedate,
                        inv.approvalstatus,
                        inv.status AS inv_status,
                        BUILTIN.DF(inv.status) AS status_parcela,
                        inv.createdby,
                        inv.custbody_lrc_fatura_principal,
                        inv.entity,
                        inv.entitystatus,
                        BUILTIN.DF(inv.postingperiod) as inv_postingperiod
                        
                    FROM
                        transaction as so,
                        transaction as inv
                    WHERE
                        so.id = inv.custbody_lrc_fatura_principal
                        AND so.voided != 'T'
                        AND inv.voided != 'T'
                        AND so.type = 'SalesOrd'
                        AND inv.type = 'CustInvc' 
                        AND so.id = ${salesOrderId}
                    ORDER BY
                        so.id,
                        inv.duedate ASC `;


                return nsQuery.runSuiteQL(sql).asMappedResults(); // Please search https://system.netsuite.com/app/help/helpcenter.nl?search=ResultSet.asMappedResults() for more information.
            }
            /**
             * 
             * @returns lista de instalmnts para salvar no campo json do corpo da transacao(salesorder)
             */
            build = () => {

                let invInstalments = this.loadinvoiceList(this.record.id);
                let _instalmentList = new Array();


                invInstalments.forEach(invoice => {
                    let _instalment = {
                        seq: invoice.inv_id,
                        valordevido: invoice.inv_foreigntotal,
                        valor: invoice.inv_foreigntotal,
                        valorpago: "",
                        dtvcto: invoice.inv_duedate,
                        dtpgto: "",
                        pagto_aplicado: (invoice.inv_status == 'B') ? true : false,
                        status: invoice.inv_status + ") " + invoice.status_parcela,
                        idpgto: ""
                    }

                    _instalmentList.push(_instalment);

                });
                return _instalmentList;
            }

        }


        class SalesOrderUserEvent {

            static beforeSubmit = (context) => {
                log.debug("SalesOrderUserEvent.beforeSubmit", " context :" + JSON.stringify(context));

                const salesOrder = context.newRecord;

                const soItemListReader = new gesplanTools.SublistReader(gesplanTools.SUBLISTNAME.item, salesOrder);
                let soItemList = soItemListReader.read();

                const soInstalmentSublistReader = new gesplanTools.InstalmentSublistReader(salesOrder);
                //const soInstalmentSublistReader = new gesplanTools.SublistReader(gesplanTools.SUBLISTNAME.instalment, salesOrder);
                let soInstalmentList = soInstalmentSublistReader.read();

                log.audit("Qtde Parcelas (default reader): " + soInstalmentList.length);

                if (!soInstalmentList || soInstalmentList.length == 0) {
                    soInstalmentSublistReader.setBuilder(new SalesOrderInstalmentSublistBuilder(salesOrder));
                    soInstalmentList = soInstalmentSublistReader.read();
                    log.audit("Qtde Parcelas (Invoice): " + soInstalmentList.length);
                }
                //let vbInstalmentList = vbInstalmentSublistReader.read();

                //***** LE OS REGISTROS DAS SUBLISTAS * END * *******

                log.audit("Qtde Parcelas: " + soInstalmentList.length);
                //log.audit("lista links " + JSON.stringify({linksList}));

                //Implementar uma factory para definir qual o instalmentBuilder vai usar.


                //Usado quando o script executa no pagamento, ai chama se esse metodo para cada
                //invoice da lista apply no customer payment.
                if (context.hasOwnProperty('rsc_paymentDate')) {
                    log.audit("Context contem data de pagamento. paymentDate: ", context.rsc_paymentDate);
                    soInstalmentList.forEach((instalment, index, _vbInstalmentList) => {
                        //log.debug('encontrou pagto aplicado? ', instalment.pagto_aplicado);
                        if (instalment.pagto_aplicado == 'true') {
                            //  log.debug('- ---- -- ', 'YESYESYES');
                            instalment.dtpgto = context.rsc_paymentDate;
                            //_vbInstalmentList[index] = instalment;
                        }
                    });
                }

                //PREENCHE OS CAMPOS DE CORPO DA TRANSACAO COM O JSON. * START *    
                const jsonWriter = new gesplanTools.TranBodyJsonWriter(salesOrder);
                jsonWriter.setItems(soItemList);
                jsonWriter.setInstalments(soInstalmentList);
                // PREENCHE OS CAMPOS DE CORPO DA TRANSACAO COM O JSON. * END *    

            }
            static afterSubmit = (context) => {
                log.debug("SalesOrderUserEvent.afterSubmit", " context :" + JSON.stringify(context));

            }



        }




        class VendorPaymentUserEvent {

            static beforeSubmit(context) {
                //ler as vendorbills para compor o json de intalments e items

                // let itemList = [];
                // let instalmentList = [];

                // //carrega o vendor payment
                // const vendPymtRecord = context.newRecord;
                // log.debug("beforesbmt", "vendorpayment id: " + vendPymtRecord.id + " - " + vendPymtRecord.getValue('transactionnumber'));

                // /*
                // if (vendPymtRecord.type == 'customerpayment' || vendPymtRecord.type == 'vendorpayment' || vendPymtRecord.type == 'vendorpayment' || vendPymtRecord.type == 'invoice' || vendPymtRecord.type == 'vendorbill') {
                //     vendPymtRecord.setValue({
                //         fieldId: 'custbody_rsc_gesplan_lastmodifdate_dt',
                //         value: new Date()
                //     });
                // }
                // */

                // //instancia o leitor da sublista apply
                // const applySublistReader = new gesplanTools.ApplySubListReader(vendPymtRecord);
                // //filtra as linhas que estão aplicadas    
                // let applyedList = applySublistReader.readApplied();
                // //corre as linhas apply aplicadas
                // applyedList.forEach((applyLine) => {

                //     log.debug("vpaymt applied sublist " + applyLine.trantype, applyLine.applydate + " - " + applyLine.due + " - " + applyLine.total);

                //     //BUSCAR ITMS NO VENDORBILL
                //     //carrega a vendor bill que foi selecionada (aplicada)
                //     const vendorBill = record.load({ type: 'vendorbill', id: applyLine.internalid, isDynamic: true });
                //     //log.debug("applied transaction load: ", vendorBill.id + " - " + vendorBill.getValue('transactionnumber'));
                //     //log.debug("loaded applied vendorbill" + applyLine.trantype, applyLine.applydate + " - " + applyLine.due + " - " + applyLine.total);
                //     VendorBillUserEvent.runBeforeSubmit(vendorBill);
                //     log.debug("gravando vendorbill","verificar se os script UE sao carregados");
                //     vendorBill.save();

                //     //instancia o leitor de da sublista item
                //     const vbItemListReader = new ItemSublistReader(vendorBill);
                //     //instancia o leitor da sublista installment
                //     const vbInstalmentReader = new InstalmentSublistReader(vendorBill);
                //     vbInstalmentReader.setBuilder(new PaidInstalmentsFromApplyListBuilder(vendPymtRecord));


                //     //adiciona os itens da vendor bill aplicada no array itemList
                //     // para ser adicionado no campo custbody_rsc_gesplan_items_json do vendor payment

                //     let vbItemList = vbItemListReader.read();
                //     log.debug("vendorbill item list", JSON.stringify(vbItemList));

                //     let vbInstalmentList = vbInstalmentReader.read();
                //     log.debug("vendorbill instalment list", JSON.stringify(vbInstalmentList));

                //     log.audit("Qtde Parcelas: " + vbInstalmentList.length);


                //     //Implementar uma factory para definir qual o instalmentBuilder vai usar.
                //     if (vbInstalmentList && vbInstalmentList.length == 0) {

                //         log.audit("Nenhuma instalment encontrada ", " Criando JSON com parcela unica para salvar no corpo da transacao afim de otimizar a Coleta de daddos para Gesplan");

                //         log.audit("criando parcela paga ", " ---- ");

                //         vbInstalmentReader.setBuilder(new SinglePaidInstalmentSublistBuilder(vendorBill));
                //         vbInstalmentList = vbInstalmentReader.read();
                //         log.audit("Parcela paga criada", JSON.stringify(vbInstalmentList));

                //     }

                //     itemList.push(
                //         {
                //             transactionid: vendorBill.id,
                //             transactiontype: vendorBill.type,
                //             items: vbItemList
                //         }
                //     );
                //     instalmentList.push(
                //         {
                //             transactionid: vendorBill.id,
                //             transactiontype: vendorBill.type,
                //             instalments: vbInstalmentList
                //         }

                //     );
                // });

                // //seta os campos json intalemnts e items.
                // const jsonWriter2 = new TranBodyJsonWriter(vendPymtRecord);
                // jsonWriter2.setItems(itemList);
                // jsonWriter2.setInstalments(instalmentList);

            }
            //Busca as bill que foram pagas e atualiza o json no corpo delas.
            static afterSubmit(context) {

                //if type equals delete, load the 
                //vendor bill record and update the installment json field to the state
                //before the vendor payment was deleted
                if(context.type == 'delete'){

                    const deleteApplySublistReader = new gesplanTools.ApplySubListReader(context.oldRecord);
                    //filtra as linhas que estão aplicadas
                    let deleteApplyedList = deleteApplySublistReader.readApplied();
                    //corre as linhas apply aplicadas
                    deleteApplyedList.forEach((applyLine) => {
                        //carrega a vendor bill que foi selecionada (aplicada)
                        log.debug("vendorpayment applied bill", JSON.stringify(applyLine));
                        let vendorBillRecord = nsRecord.load({type: 'vendorbill', id: applyLine.internalid, isDynamic: true});
                        VendorBillUserEvent.beforeSubmit(
                        {
                            newRecord: vendorBillRecord,
                            
                        });
                        vendorBillRecord.save({ ignoreMandatoryFields: true });
                    });
                        return true;
                }

                let itemList = [];
                let instalmentList = [];

                //carrega o vendor payment
                const vendPymtRecord = context.newRecord;
                const paymentDate = vendPymtRecord.getValue('trandate');

                log.debug("VendorPaymentUserEvent.afterSubmit", "vendorpayment id: " + vendPymtRecord.id + " - " + vendPymtRecord.getValue('transactionnumber'));


                // //instancia o leitor da sublista apply
                const applySublistReader = new gesplanTools.ApplySubListReader(vendPymtRecord);
                // //filtra as linhas que estão aplicadas    
                let applyedList = applySublistReader.readApplied();
                // //corre as linhas apply aplicadas
                let lastInternalId = -1;
                applyedList.forEach((applyLine) => {
                    //esse if serve para evitar salvar a mesma vendorbill mais de uma vez quando 
                    // a mesma vendorbill está repetindo da sublista apply do vendorpayment.
                    if (lastInternalId != applyLine.internalid) {
                        const vendorBill = nsRecord.load({ type: 'vendorbill', id: applyLine.internalid, isDynamic: true });
                        log.debug("atualizando vendorbill", vendorBill.recordType+' '+vendorBill.id +" vendorPaymentID "+vendPymtRecord.id+" paymentDate"+paymentDate);
                        //Chama o metodo beforeSubmit do vendorBill
                        //para setar os valores  nos campos json 
                        VendorBillUserEvent.beforeSubmit(
                            {
                                newRecord: vendorBill,
                                rsc_paymentId: vendPymtRecord.id,
                                rsc_paymentDate: paymentDate

                            });
                        vendorBill.save({ ignoreMandatoryFields: true });
                        lastInternalId = applyLine.internalid;
                    }

                });

            }

        }

        class VendorBillUserEvent {

            //Relaciona todos os items, instalments e despesas, monta um json para cada
            //e seta os valores nos campos JSON da transacao antes de salvar.
            static beforeSubmit(context) {
                try {

                    log.debug("VendorBillUserEvent.beforeSubmit", ` *** start *** `);
                    log.debug("VendorBillUserEvent.beforeSubmit", `context ${JSON.stringify(context)}`);
                    log.debug("beforesubmit", "vendorbill id: " + context.newRecord.id + " - " + context.newRecord.getValue('transactionnumber'));
                    //carrega o vendor payment
                    const vendorBill = context.newRecord;

                    //*****INSTANCIA OS SUBLIST READERS * START * *******
                    //instancia o leitor da sublista item
                    //const vbItemListReader =  new gesplanTools.ItemSublistReader(vendorBill);
                    const vbItemListReader = new gesplanTools.SublistReader(gesplanTools.SUBLISTNAME.item, vendorBill);
                    //instancia o leitor da sublista installment
                    const vbInstalmentSublistReader = new gesplanTools.InstalmentSublistReader(vendorBill);
                    //vbInstalmentSublistReader.getUiSublistFields()
                    //instancia o leitor da sublista expensereport
                    //const expenseSublistReader = new gesplanTools.ExpenseSublistReader(vendorBill);
                    const expenseSublistReader = new gesplanTools.SublistReader(gesplanTools.SUBLISTNAME.expense, vendorBill);
                    //const newInstalmentSublistReader = new gesplanTools.SublistReader(gesplanTools.SUBLISTNAME.instalment, vendorBill);
                    //const instalmentSublistReader = gesplanTools.sublistReader(gesplanTools.SUBLISTNAME.instalment, vendorBill);

                    //*****INSTANCIA OS SUBLIST READERS * END * *******

                    //***** LE OS REGISTROS DAS SUBLISTAS * START * *******            
                    let vbExpenseList = expenseSublistReader.read();
                    let vbItemList = vbItemListReader.read();
                    //let vbInstalmentList = newInstalmentSublistReader.read();
                    let vbInstalmentList = vbInstalmentSublistReader.read();
                    //let vbInstalmentList = vbInstalmentSublistReader.read();

                    //***** LE OS REGISTROS DAS SUBLISTAS * END * *******

                    log.audit("Qtde Parcelas: " + vbInstalmentList.length);
                    //Implementar uma factory para definir qual o instalmentBuilder vai usar.

                    //SE É UMA VENDORBILL SEM INSTALMENTS REGISTRADA. (A VISTA)
                    // PARA A ENGINE DE RETORNO DA GESPLAN FUNCIONAR TEM QUE CONSIDERAR QUE A VENDA FOI PAGA EM UMA PARCELA.
                    if (vbInstalmentList && vbInstalmentList.length == 0 && (context.type === 'create' || context.type === 'edit')) {
                        //DEFINE QUE A CLASSE QUE VAI GERAR O JSON DE RETORNO É A CLASSE QUE GERA O JSON PARA  PARCELA ÚNICA EM ABERTO.(SingleOpenInstalmentSublistBuilder)
                        vbInstalmentSublistReader.setBuilder(new gesplanTools.SingleOpenInstalmentSublistBuilder(vendorBill));
                        vbInstalmentList = vbInstalmentSublistReader.read();
                    }

                    if (context.hasOwnProperty('rsc_paymentDate')) {
                        log.audit("Context contem data de pagamento. paymentDate: ", context.rsc_paymentDate);
                        vbInstalmentList.forEach((instalment, index, _vbInstalmentList) => {
                            log.debug('encontrou pagto aplicado? ', instalment.pagto_aplicado);
                            //if (instalment.pagto_aplicado == 'true') {
                                //  log.debug('- ---- -- ', 'YESYESYES');
                                instalment.dtpgto = context.rsc_paymentDate;
                                instalment.idpgto = context.rsc_paymentId;
                                //_vbInstalmentList[index] = instalment;
                            //}
                        });
                    }

                    //PREENCHE OS CAMPOS DE CORPO DA TRANSACAO COM O JSON. * START *    
                    const jsonWriter = new gesplanTools.TranBodyJsonWriter(vendorBill);
                    jsonWriter.setItems(vbItemList);
                    jsonWriter.setInstalments(vbInstalmentList);
                    jsonWriter.setExpenses(vbExpenseList);
                    // PREENCHE OS CAMPOS DE CORPO DA TRANSACAO COM O JSON. * END *    

                } catch (e) {
                    log.error('Erro ao executar VendorBillUserEvent.beforeSubmit', e);
                }
                log.debug("VendorBillUserEvent.beforeSubmit", ` *** end *** `);
                    
            }
            static afterSubmit(context) {
            
            }

        }

        class InvoiceUserEvent {

            static beforeSubmit = (context) => {

            }

            static afterSubmit = (context) => {

            }
        }


        class CustomerPaymentUserEvent {
            constructor(paymentRecord) {
                this.record = paymentRecord;

            }

            static beforeSubmit(context) {
                // //ler as vendorbills para compor o json de intalments e items
                // //this.record = context.newRecord;

                // //lista de itens que vao no corpo da customer payment
                // let _itemList = [];
                // //lista de parcelas que vao no corpo da customer payment
                // let _instalmentList = [];
                // //carrega o vendor payment
                // const paymentRecord = context.newRecord;
                // log.debug("beforesbmt", "customerpayment id: " + paymentRecord.id + " - " + paymentRecord.getValue('transactionnumber'));

                // //instancia o leitor da sublista apply
                // const applySublistReader = new ApplySubListReader(paymentRecord);

                // //filtra as linhas que estão aplicadas    
                // let applyedList = applySublistReader.readApplied();

                // //corre as linhas apply aplicadas e seleciona o id das invoices (contrato).
                // //quando o pagamento aplica muitas "parcelas" nao dá pra dá load em todos os registros.
                // let _allInvoices = [];
                // let _uniqueInvIds = new Set();
                // let invoiceRecords = [];
                // let contratoIdX = {};


                // //varre a lista apllyed e faz o lookup no FinanciamentoInvoice
                // //para saber quem é a invoice principal ou que gerou a parcela(FinanciamentoInvoice) 
                // applyedList.forEach((applyLine) => {
                //     if (applyLine.trantype === 'CuTrSale') {

                //         contratoIdX = search.lookupFields({
                //             type: 'customsale_rsc_financiamento',
                //             id: applyLine.internalid,
                //             columns: ['custbody_lrc_fatura_principal']
                //         }).custbody_lrc_fatura_principal[0].value;

                //         _allInvoices.push(contratoIdX);
                //         _uniqueInvIds.add(contratoIdX);
                //     }
                // });

                // _uniqueInvIds.forEach((invId) => {


                //     log.debug("invoice id", invId);

                //     const contratoInvoiceRecord = record.load({ type: "invoice", id: invId, isDynamic: false });

                //     //instancia o leitor de da sublista item
                //     const itemListReader = new ItemSublistReader(contratoInvoiceRecord);
                //     let itemList = itemListReader.read();
                //     log.debug(itemList + " item list", JSON.stringify(itemList));

                //     //instancia o leitor da sublista installment
                //     const instalmentReader = new InstalmentSublistReader(paymentRecord);
                //     log.debug("item da lista apply", 'item da lista aplicada foi um Financiamento Invoice. Chamando o builder');
                //     //instalmentReader.setBuilder(new FinanciamentoInvoiceInstalmentSublistBuilder(contratoInvoiceRecord));
                //     instalmentReader.setBuilder(new PaidInstalmentsFromApplyListBuilder(paymentRecord));
                //     let instalmentList = instalmentReader.read();
                //     log.debug(" instalment list", JSON.stringify(instalmentList));


                //     //Implementar uma factory para definir qual o instalmentBuilder vai usar.
                //     if (instalmentList && instalmentList.length == 0) {
                //         log.audit("Qtde Parcelas: " + instalmentList.length);
                //         log.audit("Nenhuma instalment encontrada ", " Criando JSON com parcela unica para salvar no corpo da transacao afim de otimizar a Coleta de daddos para Gesplan");

                //         //no caso de customer payment mostar a sublist de instalments da sublista de apply
                //         log.audit("criando parcela paga ", " ---- ");

                //         instalmentReader.setBuilder(new SinglePaidInstalmentSublistBuilder(contratoInvoiceRecord));
                //         instalmentList = instalmentReader.read();
                //         log.audit("Parcela paga criada", JSON.stringify(instalmentList));

                //     }


                //     _itemList.push(
                //         {
                //             transactionid: contratoInvoiceRecord.id,
                //             transactiontype: contratoInvoiceRecord.type,
                //             items: itemList
                //         }
                //     );

                //     _instalmentList.push(
                //         {
                //             transactionid: contratoInvoiceRecord.id,
                //             transactiontype: contratoInvoiceRecord.type,
                //             instalments: instalmentList
                //         }

                //     );


                // });

                // //seta os campos json intalemnts e items.
                // const jsonWriter2 = new TranBodyJsonWriter(paymentRecord);
                // jsonWriter2.setItems(_itemList);
                // jsonWriter2.setInstalments(_instalmentList);



            }

            //atualiza parcelas pagas
            static afterSubmit(context) {
                // ler os campos JSON das customer payment  e verificar se estao preenchidos
                //senao estiverem entao seta os campos
                //tentar settar com submitfields que consome menos recursos
                let itemList = [];
                let instalmentList = [];

                //carrega o vendor payment
                const pymtRecord = context.newRecord;
                const paymentDate = pymtRecord.getValue('trandate');

                log.debug("CustomerPaymentUserEvent.afterSubmit", "customerpayment id: " + pymtRecord.id + " - " + pymtRecord.getValue('transactionnumber'));


                // //instancia o leitor da sublista apply
                const applySublistReader = new gesplanTools.ApplySubListReader(pymtRecord);
                // //filtra as linhas que estão aplicadas    
                let applyedList = applySublistReader.readApplied();
                // //corre as linhas apply aplicadas
                let _uniqueSalesOrderIds = new Set();
                let paymentData = [];


                //selecionar as invoices que foram aplicadas no pagamento,
                //secionar as salesorders de cada invoice sem repetir (pode haver 2 ou mais invoices relacionadas ao mesmo salesorder)
                //atualizar o campo instalment json, atualizar as parcelas com dtpgto, valor_pago e pagto_aplicado = true

                applyedList.forEach((invoice, index, list) => {
                    log.debug("CustomerPaymentUserEvent applied list", JSON.stringyfy(invoice));

                    // //pega o id da salesorder(contrato) que gerou a invoice(parcela/instalment).
                    // let soId = nsSearch.lookupFields({
                    //     type: 'invoice',
                    //     id: invoice.internalid,
                    //     columns: ['custbody_lrc_fatura_principal']
                    // }).custbody_lrc_fatura_principal[0].value;

                    // log.debug("CustomerPaymentUserEvent aftersubmit", `Atualizar parcela (${invoice.internalid}) do pedido id: ${soId}`);
                    // _uniqueSalesOrderIds.add(soId);


                    /*
                    
                    if(paymentData[soId] == null) {
                        paymentData[soId] = new Array();
                    }
                    paymentData[soId].push({
                        seq : invoice.internalid,
                        paymentId : pymtRecord.id,
                        dtpgto : paymentDate,
                        valor_pago : -1

                    });
                    */
                });
                log.debug("lendo a lista de sales orders selecionadas para update", `****** Atualizando ${_uniqueSalesOrderIds.size}  sales orders. *********`);

                _uniqueSalesOrderIds.forEach((soId) => {
                    log.debug("sales order id: ", soId);

                    // let salesOrder = nsSearch.load({
                    //     type: 'salesorder',
                    //     id: soId
                    // })   


                    //}


                    //esse if serve para evitar salvar a mesma vendorbill mais de uma vez quando 
                    // a mesma vendorbill está repetindo da sublista apply do vendorpayment.
                    //if (lastInternalId != applyLine.internalid) {
                    //const invoice = nsRecord.load({ type: 'invoice', id: applyLine.internalid, isDynamic: true });
                    // //Chama o endpoing beforeSubmit realizado no vendorBill
                    // //para atualizar os campo instalments
                    // SalesOrderUserEvent.beforeSubmit(
                    //     {
                    //         newRecord: invoice,
                    //         rsc_paymentDate: paymentDate

                    //     });
                    // invoice.save({ ignoreMandatoryFields: true });
                    //    lastInternalId = applyLine.internalid;
                    //}

                });
            }
        }
        return {
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }
    });
