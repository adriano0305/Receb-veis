/**
 *@NApiVersion 2.1
*@NScriptType Suitelet
*/
const custPage = 'custpage_rsc_';

var dataHJ = new Date();

var hoje = {
    dia: dataHJ.getDate() > 9 ? dataHJ.getDate() : '0'+dataHJ.getDate(),
    mes: dataHJ.getMonth() > 9 ? dataHJ.getMonth()+1 : '0'+(dataHJ.getMonth()+1),
    ano: dataHJ.getFullYear()
}

if (hoje.mes == 00) {
    hoje.mes = 12;
}

define(['./reparcelamento_cnab/gaf_selecao_parcelas_ar_lib.js', 'N/file', 'N/log', 'N/query', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url'], function(gspal, file, log, query, record, redirect, runtime, search, serverWidget, url) {
function onRequest(context) {
    log.audit('onRequest', context);
    /* ******************* FIELD TYPES ****************** *
    * ■ CHECKBOX ■ CURRENCY ■ DATE ■ DATETIMETZ ■ EMAIL   *
    * ■ FILE ■ FLOAT ■ HELP ■ INLINEHTML ■ INTEGER        *
    * ■ IMAGE ■ LABEL ■ LONGTEXT ■ MULTISELECT ■ PASSPORT *
    * ■ PERCENT ■ PHONE ■ SELECT ■ RADIO ■ RICHTEXT       *
    * ■ TEXT ■ TEXTAREA ■ TIMEOFDAY ■ URL                 *
    * *************************************************** */ 

    /* ****************** SUBLIST TYPES ***************** *
    * ■ INLINEEDITOR ■ EDITOR ■ LIST ■ STATICLIST         *
    * *************************************************** */ 

    const request = context.request;
    const method = request.method;
    const response = context.response;
    const parameters = request.parameters;

    if (method == 'GET') {
        log.audit(method, parameters);
        const idFatura = parameters.id ? parameters.id : parameters.recordid;

        var lkpFatura = search.lookupFields({
            type: 'salesorder',
            id: idFatura,
            columns: ['tranid', 'entity', 'createdfrom', 'total', 'custbody_rsc_tran_unidade', 'custbody_rsc_projeto_obra_gasto_compra', 'custbody_lrc_numero_contrato']
        });

        const form = serverWidget.createForm({
            title: 'Seleção de Parcelas'
        });

        var dadosGerais = form.addFieldGroup({
            id: custPage+'dados_gerais',
            label: 'Dados Gerais'
        });

        // Grupo: Dados Gerais
        var idFaturaPrincipal = form.addField({
            id: custPage+'id_fatura_principal',
            label: 'ID Fatura Principal',
            type: serverWidget.FieldType.TEXT,
            container: custPage+'dados_gerais'
        });

        idFaturaPrincipal.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        idFaturaPrincipal.defaultValue = idFatura;

        var cliente = form.addField({
            id: custPage+'cliente',
            label: 'Cliente',
            type: serverWidget.FieldType.SELECT,
            container: custPage+'dados_gerais',
            source: 'customer'
        });

        cliente.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        cliente.defaultValue = lkpFatura.entity[0].value;

        var empreendimento = form.addField({
            id: custPage+'empreendimento',
            label: 'Empreendimento',
            type: serverWidget.FieldType.SELECT,
            container: custPage+'dados_gerais',
            source: 'job'
        });

        empreendimento.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        empreendimento.defaultValue = lkpFatura.custbody_rsc_projeto_obra_gasto_compra[0] ? lkpFatura.custbody_rsc_projeto_obra_gasto_compra[0].value : '';

        var unidade = form.addField({
            id: custPage+'unidade',
            type: serverWidget.FieldType.SELECT,
            label: 'Unidade',
            container: custPage+'dados_gerais',
            source: 'customrecord_rsc_unidades_empreendimento'
        });

        unidade.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        unidade.defaultValue = lkpFatura.custbody_rsc_tran_unidade.length > 0 ? lkpFatura.custbody_rsc_tran_unidade[0].value : '';

        var contrato = form.addField({
            id: custPage+'contrato',
            label: 'Contrato',
            type: serverWidget.FieldType.TEXT,
            container: custPage+'dados_gerais'
        });

        contrato.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        
        contrato.defaultValue = lkpFatura.custbody_lrc_numero_contrato;

        var total_fatura_principal = form.addField({
            id: custPage+'total_fatura_principal',
            label: 'Total Contrato',
            type: serverWidget.FieldType.CURRENCY,
            container: custPage+'dados_gerais'
        });

        total_fatura_principal.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        
        total_fatura_principal.defaultValue = lkpFatura.total;

        var faturaPrincipal = form.addField({
            id: custPage+'fatura_principal',
            label: 'Fatura Principal',
            type: serverWidget.FieldType.SELECT,
            container: custPage+'dados_gerais',
            source: 'invoice'
        });

        faturaPrincipal.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        faturaPrincipal.defaultValue = idFatura;

        var urlFaturaPrincipal = url.resolveRecord({
            recordType: 'salesorder',
            recordId: idFatura
        });

        var linkFaturaPrincipal = form.addField({
            id: custPage+'link_fatura_principal',
            label: 'Link Fatura Principal',
            type: serverWidget.FieldType.URL,
            container: custPage+'dados_gerais'
        });
    
        linkFaturaPrincipal.defaultValue = urlFaturaPrincipal;

        linkFaturaPrincipal.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        linkFaturaPrincipal.linkText = 'Visualizar';

        var jurosEmpreendimento = form.addField({
            id: custPage+'juros_empreendimento',
            label: 'Juros Empreendimento',
            type: serverWidget.FieldType.PERCENT,
            container: custPage+'dados_gerais'
        });

        jurosEmpreendimento.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        var multaEmpreendimento = form.addField({
            id: custPage+'multa_empreendimento',
            label: 'Multa Empreendimento',
            type: serverWidget.FieldType.PERCENT,
            container: custPage+'dados_gerais'
        });

        multaEmpreendimento.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });   
        
        if (lkpFatura.custbody_rsc_projeto_obra_gasto_compra[0]) {
            const bscEmpreendimento = gspal.job(lkpFatura.custbody_rsc_projeto_obra_gasto_compra[0].value);
            jurosEmpreendimento.defaultValue = bscEmpreendimento[0].custentity_rsc_juros != null ? bscEmpreendimento[0].custentity_rsc_juros * 100 : ''; // a.a
            multaEmpreendimento.defaultValue = bscEmpreendimento[0].custentity_rsc_multa != null ? bscEmpreendimento[0].custentity_rsc_multa * 100 : '';  
        }

        // Grupo: Dados Financeiros
        var dadosFinanceiros = form.addFieldGroup({
            id: custPage+'dados_financeiros',
            label: 'Dados Financeiros'
        });
        
        var quantidadeParcelas = form.addField({
            id: custPage+'quantidade_parcelas',
            type: serverWidget.FieldType.INTEGER,
            label: 'Quantidade de parcelas',
            container: custPage+'dados_financeiros'
        });

        quantidadeParcelas.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        var sublistaReparcelamento = form.addSublist({
            id : custPage+'sublista_lista_parcelas',
            type : serverWidget.SublistType.LIST,
            label : 'Lista de Parcelas',
            container: custPage+'dados_financeiros'
        });

        // Grupo: Simulação
        var dadosSimulacao = form.addFieldGroup({
            id: custPage+'dados_simulacao',
            label: 'Dados para Simulação (Periodicidade das parcelas do contrato)'
        });

        var renegociacao = form.addField({
            id: custPage+'renegociacao',
            type: serverWidget.FieldType.SELECT,
            label: 'Renegociação',
            container: custPage+'dados_simulacao'
        });

        renegociacao.addSelectOption({
            value: '',
            text: ''
        });

        renegociacao.addSelectOption({
            value: 'Amortização',
            text: 'Amortização'
        });

        renegociacao.addSelectOption({
            value: 'Inadimplentes',
            text: 'Inadimplentes'
        });

        renegociacao.addSelectOption({
            value: 'Adimplentes',
            text: 'Adimplentes'
        });

        renegociacao.addSelectOption({
            value: 'Recálculo de atrasos',
            text: 'Recálculo de atrasos'
        });

        renegociacao.addSelectOption({
            value: 'Antecipação',
            text: 'Antecipação'
        });

        var vencimentoEntrada = form.addField({
            id: custPage+'vencimento_entrada',
            label: 'Vencimento Entrada',
            type: serverWidget.FieldType.DATE,
            container: custPage+'dados_simulacao'
        });

        var dataInicio = form.addField({
            id: custPage+'data_inicio',
            label: '1º Vencimento',
            type: serverWidget.FieldType.DATE,
            container: custPage+'dados_simulacao'
        });        

        var difDias = form.addField({
            id: custPage+'dif_dias',
            label: 'Dif Dias',
            type: serverWidget.FieldType.INTEGER,
            container: custPage+'dados_simulacao'
        });

        difDias.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var pro_rata_calculado = form.addField({
            id: custPage+'pro_rata_calculado',
            label: 'Pro rata (calculado)',
            type: serverWidget.FieldType.CURRENCY,
            container: custPage+'dados_simulacao'
        });

        pro_rata_calculado.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var reparcelarEm = form.addField({
            id: custPage+'reparcelar_em',
            type:  serverWidget.FieldType.INTEGER,
            label: 'Número de Parcelas',
            container: custPage+'dados_simulacao'
        });        

        var valorEntrada = form.addField({
            id: custPage+'valor_entrada',
            label: 'Valor da Entrada',
            type: serverWidget.FieldType.CURRENCY,
            container: custPage+'dados_simulacao'
        });

        var jurosMora = form.addField({
            id: custPage+'juros_mora',
            label: 'Juros de Mora',
            type: serverWidget.FieldType.CURRENCY,
            container: custPage+'dados_simulacao'
        });

        // if (runtime.getCurrentUser().id == 3588) {
            var jsonSP = form.addField({
                id: custPage+'json_sp',
                label: 'JSON SP',
                type: serverWidget.FieldType.TEXTAREA
            });

            jsonSP.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            var campo_jsonSP = form.getField({id: custPage+'json_sp'});
            // log.audit('campo_jsonSP', campo_jsonSP);

            campo_jsonSP.maxLength = 400000;
            // log.audit('maxLength', campo_jsonSP);
        // }

        var marcarTudo = sublistaReparcelamento.addButton({
            id: custPage+'marcar_tudo',
            label: 'Marcar tudo',
            functionName: 'marcarTudo'
        });

        var desmarcarTudo = sublistaReparcelamento.addButton({
            id: custPage+'desmarcar_tudo',
            label: 'Desmarcar tudo',
            functionName: 'desmarcarTudo'
        });

        var id_financiamento_invoice = sublistaReparcelamento.addField({
            id: custPage+'id_financiamento_invoice',
            type: serverWidget.FieldType.TEXT,
            label: 'ID Financiamento Invoice'
        });

        id_financiamento_invoice.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var link = sublistaReparcelamento.addField({
            id: custPage+'link',
            type: serverWidget.FieldType.URL,
            label: 'Link'
        });

        link.linkText = 'Visualizar';

        var ver = sublistaReparcelamento.addField({
            id: custPage+'ver',
            type: serverWidget.FieldType.TEXT,
            label: 'Ver'
        });

        var ano = sublistaReparcelamento.addField({
            id: custPage+'ano',
            type: serverWidget.FieldType.TEXT,
            label: 'Ano'
        });

        ano.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var parcela = sublistaReparcelamento.addField({
            id: custPage+'parcela',
            type: serverWidget.FieldType.DATE,
            label: 'Vencimento'
        });

        var reparcelamentoOrigem = sublistaReparcelamento.addField({
            id: custPage+'reparcelamento_origem',
            type: serverWidget.FieldType.INTEGER,
            label: 'Reparcelamento Origem'
        });

        reparcelamentoOrigem.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var reparcelamentoDestino = sublistaReparcelamento.addField({
            id: custPage+'reparcelamento_destino',
            type: serverWidget.FieldType.INTEGER,
            label: 'Reparcelamento Destino'
        });

        reparcelamentoDestino.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var tipoParcela = sublistaReparcelamento.addField({
            id: custPage+'tipo_parcela',
            type: serverWidget.FieldType.SELECT,
            label: 'Tipo Parcela',
            source: 'customrecord_rsc_tipo_parcela'
        });

        tipoParcela.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        var indice = sublistaReparcelamento.addField({
            id: custPage+'indice', 
            type: serverWidget.FieldType.SELECT,
            label: 'Índice',
            source: 'customrecord_rsc_correction_unit'
        });

        indice.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        var valorOriginal = sublistaReparcelamento.addField({
            id: custPage+'valor_original',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Valor'
        });

        var multa = sublistaReparcelamento.addField({
            id: custPage+'multa',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Multa'
        });

        var juros = sublistaReparcelamento.addField({
            id: custPage+'juros',
            type: serverWidget.FieldType.FLOAT,
            // type: serverWidget.FieldType.CURRENCY,
            label: 'Juros'
        });

        var valorAtualizado = sublistaReparcelamento.addField({
            id: custPage+'valor_atualizado',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Valor Atualizado'
        });
        
        var status = sublistaReparcelamento.addField({
            id: custPage+'status',
            type: serverWidget.FieldType.TEXT,
            label: 'Status'
        });

        var reparcelar = sublistaReparcelamento.addField({
            id: custPage+'reparcelar',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'Reparcelar'
        }); 

        var ultimaAtualizacao = sublistaReparcelamento.addField({
            id: custPage+'ultima_atualizacao',
            type: serverWidget.FieldType.DATE,
            label: 'Última Atualização'
        });

        ultimaAtualizacao.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var fator_correcao_2 = sublistaReparcelamento.addField({
            id: custPage+'fator_correcao_2',
            type: serverWidget.FieldType.FLOAT,
            label: 'Fator 2'
        });

        fator_correcao_2.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var fator_correcao_3 = sublistaReparcelamento.addField({
            id: custPage+'fator_correcao_3',
            type: serverWidget.FieldType.FLOAT,
            label: 'Fator 3'
        });

        fator_correcao_3.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var fator_correcao_atual = sublistaReparcelamento.addField({
            id: custPage+'fator_correcao_atual',
            type: serverWidget.FieldType.FLOAT,
            label: 'Fator Atual'
        });

        fator_correcao_atual.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var moratorios = sublistaReparcelamento.addField({
            id: custPage+'moratorios',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Moratórios'
        });

        moratorios.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        var prestacoes = localizarParcelas(idFatura);

        if (prestacoes.arrayParcelas.length > 0) {
            // form.addButton({
            //     id: custPage+'simulacao',
            //     label: 'Simulação',
            //     functionName: 'simulacao'
            // });

            form.addSubmitButton({
                label: 'Simulação'
            });
            
            for (i=0; i<prestacoes.arrayParcelas.length; i++) {
                // log.audit(prestacoes.arrayParcelas[i].ver, prestacoes.arrayParcelas[i].tipoParcela);
                sublistaReparcelamento.setSublistValue({
                    id: id_financiamento_invoice.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].ver
                });
                
                var urlFaturaParcela = url.resolveRecord({
                    recordType: 'invoice',
                    recordId: prestacoes.arrayParcelas[i].ver 
                });

                sublistaReparcelamento.setSublistValue({
                    id: link.id,
                    line: i,
                    value: urlFaturaParcela
                });

                sublistaReparcelamento.setSublistValue({
                    id: reparcelamentoOrigem.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].reparcelamentoOrigem
                });

                sublistaReparcelamento.setSublistValue({
                    id: reparcelamentoDestino.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].reparcelamentoDestino
                });

                sublistaReparcelamento.setSublistValue({
                    id: ver.id,
                    line: i,
                    value: 'Parcela Nº '+prestacoes.arrayParcelas[i].documento
                });

                sublistaReparcelamento.setSublistValue({
                    id: parcela.id, // Vencimento
                    line: i,
                    value: prestacoes.arrayParcelas[i].parcela
                });
                
                sublistaReparcelamento.setSublistValue({
                    id: tipoParcela.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].tipoParcela
                });

                sublistaReparcelamento.setSublistValue({
                    id: indice.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].indice
                });

                sublistaReparcelamento.setSublistValue({
                    id: valorOriginal.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].valorOriginal
                });

                sublistaReparcelamento.setSublistValue({
                    id: multa.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].multa
                });

                sublistaReparcelamento.setSublistValue({
                    id: juros.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].juros
                });

                sublistaReparcelamento.setSublistValue({
                    id: status.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].status
                });

                sublistaReparcelamento.setSublistValue({
                    id: valorAtualizado.id,
                    line: i,
                    value: (prestacoes.arrayParcelas[i].status == 'Aberto' || prestacoes.arrayParcelas[i].reparcelamentoDestino) ? Number(prestacoes.arrayParcelas[i].valorAtualizado).toFixed(2) : 0
                });

                sublistaReparcelamento.setSublistValue({
                    id: ultimaAtualizacao.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].ultimaAtualizacao
                });

                sublistaReparcelamento.setSublistValue({
                    id: fator_correcao_2.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].fator_correcao_2
                });

                sublistaReparcelamento.setSublistValue({
                    id: fator_correcao_3.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].fator_correcao_3
                });

                sublistaReparcelamento.setSublistValue({
                    id: fator_correcao_atual.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].fator_correcao_atual
                });

                sublistaReparcelamento.setSublistValue({
                    id: moratorios.id,
                    line: i,
                    value: prestacoes.arrayParcelas[i].moratorios
                });
            }

            quantidadeParcelas.defaultValue = prestacoes.arrayParcelas.length;
        }

        var totalFinanciado = form.addField({
            id : custPage+'total_financiado',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Total Financiado',
            container: custPage+'dados_financeiros'
        });

        totalFinanciado.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        totalFinanciado.defaultValue = prestacoes.totalFinanciado;

        var custoTotal = form.addField({
            id : custPage+'custo_total',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Saldo',
            container: custPage+'dados_financeiros'
        });
        
        custoTotal.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        var parcelasMarcadas = form.addField({
            id : custPage+'parcelas_marcadas',
            type : serverWidget.FieldType.CURRENCY,
            label : 'Valor Selecionado',
            container: custPage+'dados_financeiros'
        });

        parcelasMarcadas.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });        

        form.addButton({
            id: custPage+'voltar',
            label: 'Voltar',
            functionName: 'voltar'
        });

        form.clientScriptModulePath = "./reparcelamento_cnab/rsc_reparcelamento_2_ct.js";

        response.writePage({
            pageObject: form
        });
    } else {
        log.audit(method, parameters);

        var fileObj = file.create({
            name: 'parameters_selecao_parcelas.txt',
            fileType: file.Type.PLAINTEXT,
            folder: 704, // SuiteScripts > teste > Arquivos
            // contents: JSON.stringify(arrayParcelas)
            contents: JSON.stringify(parameters)
        });
    
        var fileObjId = fileObj.save(); 
        
        const form = construtor(method, parameters);

        form.clientScriptModulePath = "./reparcelamento_cnab/rsc_simulacao_2_ct.js";

        response.writePage({
            pageObject: form
        });
    }
}

function localizarPagamento(idFinanciamento, totalFinanciamento) {
    var bscPagamento = search.create({type: "customerpayment",
        filters: [
            ["type","anyof","CustPymt"], "AND", 
            ["appliedtotransaction.internalid","anyof",idFinanciamento]
        ],
        columns: [
            "datecreated","tranid","total"
        ]
    }).run().getRange(0,1);

    if (bscPagamento.length > 0) {
        var totalPagamento = bscPagamento[0].getValue('total');

        if (totalPagamento == totalFinanciamento) {
            return 'Pago';
        }

        if (totalPagamento < totalFinanciamento) {
            return 'Parcial';
        }
    } else {
        return 'Aberto';
    }
}

function localizarParcelas(idFatura) {
    var ambiente = runtime.envType;

    var arrayParcelas = [];

    const mes = Number ('30');
    const ZERO = Number('0').toFixed(2);

    var sql = 'SELECT t.id, t.custbody_rsc_projeto_obra_gasto_compra, t.duedate, t.tranid, t.custbodyrsc_tpparc, t.custbody_rsc_tran_unidade, t.custbody_rsc_reparcelamento_origem, '+
    't.custbody_rsc_reparcelamento_destino, t.foreigntotal, t.foreignamountpaid, t.foreignamountunpaid, t.custbody_rsc_amortizada, t.custbody_rsc_indice, t.status, t.custbody_rsc_ultima_atualizacao, '+
    'tl.item, tl.quantity, tl.rate '+
    'FROM transaction AS t '+
    'INNER JOIN transactionline AS tl ON (tl.transaction = t.id) '+
    "WHERE t.recordtype = 'invoice' "+
    "AND t.custbody_lrc_fatura_principal = ? "+
    "ORDER BY t.duedate ASC";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [idFatura]
    });

    var sqlResults = consulta.asMappedResults();

    var fileObj = file.create({
        name: 'arrayParcelas_st.txt',
        fileType: file.Type.PLAINTEXT,
        folder: 767,    // SuiteScripts > teste > Arquivos
        // contents: JSON.stringify(arrayParcelas)
        contents: JSON.stringify(sqlResults)
    });

    var fileObjId = fileObj.save(); 

    if (sqlResults.length > 0) {  
        var lookupEmpreendimento, jurosAA, multa;

        if (sqlResults[0].custbody_rsc_projeto_obra_gasto_compra) {
            lookupEmpreendimento = search.lookupFields({type: 'job',
                id: sqlResults[0].custbody_rsc_projeto_obra_gasto_compra,
                columns: ['custentity_rsc_perc_cessao_direito','custentity_rsc_juros','custentity_rsc_multa']
            });

            jurosAA = lookupEmpreendimento.custentity_rsc_juros.replace('%','') / 100; // a.a
            multa = lookupEmpreendimento.custentity_rsc_multa.replace('%','') / 100;  
        } else {
            jurosAA = 0; // a.a
            multa = 0;
        }               

        const calcJuros = (total, delay, fees) => {
            interestCalc = (fees / 360).toFixed(8);
            interestCalc = interestCalc * delay;
            interestCalc = interestCalc * total;
            return interestCalc;
        }

        const juros_e_acrescimos_moratorios = (id, sqlResults) => {
            // log.audit('juros_e_acrescimos_moratorios', {id: id, sqlResults: sqlResults});
            
            var ja = 0;
            var acrescimosMoratorios = 0;

            for (i=0; i<sqlResults.length; i++) { 
                if (sqlResults[i].id == id) {         
                    // Juros à incorrer e Acréscimos Moratórios
                    if (sqlResults[i].item == 28654 || sqlResults[i].item == 30694) {
                        // log.audit(sqlResults[i].id, {item: sqlResults[i].item, rate: sqlResults[i].rate});
                        ja = ja + sqlResults[i].rate;

                        if (sqlResults[i].item == 30694) {
                            acrescimosMoratorios = sqlResults[i].rate;
                        }                    
                    } 
                    // log.audit(sqlResults[i].id, {ja: ja, acrescimosMoratorios: acrescimosMoratorios});
                } 
            }

            return {ja: ja > 0 ? ja : 0, acrescimosMoratorios: acrescimosMoratorios > 0 ? acrescimosMoratorios : 0}
        }

        const ultimoDiaMes = (mes2, ano) => {
           log.audit('ultimoDiaMes', {mes2: mes2, ano: ano});
            var ultimoDia;
        
            var mes = mes2 > '9' ? mes2 : '0'+mes2;
        
            if (typeof(mes) == 'number') {
                mes = String(mes);
            }
        
            switch(mes) {
                case '01': ultimoDia = '31/'+mes+'/'+ano; break;
                case '02': ultimoDia = '28/'+mes+'/'+ano; break;
                case '03': ultimoDia = '31/'+mes+'/'+ano; break;
                case '04': ultimoDia = '30/'+mes+'/'+ano; break;
                case '05': ultimoDia = '31/'+mes+'/'+ano; break;
                case '06': ultimoDia = '30/'+mes+'/'+ano; break;
                case '07': ultimoDia = '31/'+mes+'/'+ano; break;
                case '08': ultimoDia = '31/'+mes+'/'+ano; break;
                case '09': ultimoDia = '30/'+mes+'/'+ano; break;
                case '10': ultimoDia = '31/'+mes+'/'+ano; break;
                case '11': ultimoDia = '30/'+mes+'/'+ano; break;
                case '12': ultimoDia = '31/'+mes+'/'+ano; break;
            }
         
            return ultimoDia;
        }

        var arrayFC = [];
        var quest;

        const fatorCorrecao = (mes, status, indice) => {
            log.audit('fatorCorrecao', {mes: mes, status: status, indice: indice});
            var bsc_UnidadeCorrecao;
        
            if (status == 'anterior2') {
                var mes2 = mes - 2;
                if (mes2 == -1) {
                    mes2 = 11;
                } else if (mes2 == 00 || mes2 == '00') {
                    mes2 = 12;
                }

                var ano;
        
                if (mes == 01 || mes == 02 || mes == 03) {
                    ano = new Date().getFullYear();
                } else {
                    ano = new Date().getFullYear();
                }
        
                var periodo =  {
                    inicio: "01/"+(mes2 > 9 ? mes2 : '0'+mes2)+"/"+ano,
                    fim: ultimoDiaMes(mes2, ano)
                }

                if (arrayFC.length == 0) {
                    bsc_UnidadeCorrecao = gspal.fatorCorrecao(status, indice, periodo.inicio, periodo.fim);
                    arrayFC.push(bsc_UnidadeCorrecao);
                } else {
                    quest = arrayFC.find(fc => (fc.id === indice && fc.status === status));

                    if (quest) {
                        bsc_UnidadeCorrecao = quest;
                    } else {
                        bsc_UnidadeCorrecao = gspal.fatorCorrecao(status, indice, periodo.inicio, periodo.fim);
                        arrayFC.push(bsc_UnidadeCorrecao);
                    }
                }

                if (Array.isArray(bsc_UnidadeCorrecao) == true) {
                    return Number('0');
                } else {
                    var fator_atualizado = Number(bsc_UnidadeCorrecao.custrecord_rsc_hif_factor_percent).toFixed(6);
                    var data_vigencia = bsc_UnidadeCorrecao.custrecord_rsc_hif_effective_date;
    
                    var split_dtV = data_vigencia.split('/');
                    log.audit('anterior2', {fator_atualizado: fator_atualizado, data_vigencia: data_vigencia, split_dtV: split_dtV});
                    
                    if (split_dtV[1] == mes2) {
                        return fator_atualizado;
                    }
                }
        
                // bsc_UnidadeCorrecao = gspal.fatorCorrecao(indice, periodo.inicio, periodo.fim);
        
                // if (bsc_UnidadeCorrecao.length > 0) {
                //     for (i=0; i<bsc_UnidadeCorrecao.length; i++) {
                //         var fator_atualizado = Number(bsc_UnidadeCorrecao[i].custrecord_rsc_hif_factor_percent).toFixed(6);
                //         var data_vigencia = bsc_UnidadeCorrecao[i].custrecord_rsc_hif_effective_date;
        
                //         var split_dtV = data_vigencia.split('/');
                //         log.audit('anterior2', {fator_atualizado: fator_atualizado, data_vigencia: data_vigencia, split_dtV: split_dtV});
                        
                //         if (split_dtV[1] == mes2) {
                //             return fator_atualizado;
                //         }
                //     }        
                // } else {
                //     return Number('0');
                // }
            } else if (status == 'anterior3') {
                var mes3 = mes - 3;
                if (mes3 == -2) {
                    mes3 = 10;
                } else if (mes3 == -1) {
                    mes3 = 11;
                } else if (mes3 == 00 || mes3 == '00') {
                    mes3 = 12;
                }
                
                var ANO;
        
                if (mes == 01 || mes == 02 || mes == 03) {
                    ANO = new Date().getFullYear() - 1;
                } else {
                    ANO = new Date().getFullYear();
                }
                        
                var periodo =  {
                    inicio: "01/"+(mes3 > 9 ? mes3 : '0'+mes3)+"/"+ANO,
                    fim: ultimoDiaMes(mes3, ANO)
                }

                if (arrayFC.length == 0) {
                    bsc_UnidadeCorrecao = gspal.fatorCorrecao(status, indice, periodo.inicio, periodo.fim);
                    arrayFC.push(bsc_UnidadeCorrecao);
                } else {
                    quest = arrayFC.find(fc => (fc.id === indice && fc.status === status));

                    if (quest) {
                        bsc_UnidadeCorrecao = quest;
                    } else {
                        bsc_UnidadeCorrecao = gspal.fatorCorrecao(status, indice, periodo.inicio, periodo.fim);
                        arrayFC.push(bsc_UnidadeCorrecao);
                    }
                }

                if (Array.isArray(bsc_UnidadeCorrecao) == true) {
                    if (bsc_UnidadeCorrecao.length > 0) {
                        return Number(bsc_UnidadeCorrecao[0].custrecord_rsc_hif_factor_percent).toFixed(6);
                    } else {
                        return 0;
                    }
                } else {
                    return Number(bsc_UnidadeCorrecao.custrecord_rsc_hif_factor_percent).toFixed(6);
                }
                                
                // bsc_UnidadeCorrecao = gspal.fatorCorrecao(indice, periodo.inicio, periodo.fim);
        
                // if (bsc_UnidadeCorrecao.length > 0) {
                //     return Number(bsc_UnidadeCorrecao[0].custrecord_rsc_hif_factor_percent).toFixed(6);
                // } else {
                //     return 0;
                // }
            } else {
                var date = new Date();
                var primeiroDia = new Date(date.getFullYear(), date.getMonth(), 1);
                var ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
                var objPD = {
                    dia: primeiroDia.getDate() <= '9' ? '0'+primeiroDia.getDate() : primeiroDia.getDate(),
                    mes: primeiroDia.getMonth()+1 <= '9' ? '0'+(primeiroDia.getMonth()+1) : primeiroDia.getMonth()+1,
                    ano: primeiroDia.getFullYear(),
                    hifen: '/'
                }
        
                var strPD = String(objPD.dia + objPD.hifen + objPD.mes + objPD.hifen + objPD.ano);
        
                var objUD = {
                    dia: ultimoDia.getDate() <= '9' ? '0'+ultimoDia.getDate() : ultimoDia.getDate(),
                    mes: ultimoDia.getMonth()+1 <= '9' ? '0'+(ultimoDia.getMonth()+1) : ultimoDia.getMonth()+1,
                    ano: ultimoDia.getFullYear(),
                    hifen: '/'
                }
        
                var strUD = String(objUD.dia + objUD.hifen + objUD.mes + objUD.hifen + objUD.ano);
                
                if (arrayFC.length == 0) {
                    bsc_UnidadeCorrecao = gspal.fatorCorrecao(status, indice, periodo.inicio, periodo.fim);
                    arrayFC.push(bsc_UnidadeCorrecao);
                } else {
                    quest = arrayFC.find(fc => (fc.id === indice && fc.status === status));

                    if (quest) {
                        bsc_UnidadeCorrecao = quest;
                    } else {
                        bsc_UnidadeCorrecao = gspal.fatorCorrecao(status, indice, strPD, strUD);
                        arrayFC.push(bsc_UnidadeCorrecao);
                    }
                }

                if (Array.isArray(bsc_UnidadeCorrecao) == true) {
                    if (bsc_UnidadeCorrecao.length > 0) {
                        log.audit('anterior', Number(bsc_UnidadeCorrecao[0].custrecord_rsc_hif_factor_percent).toFixed(6) || 0);
                        return Number(bsc_UnidadeCorrecao[0].custrecord_rsc_hif_factor_percent).toFixed(6) || 0;
                    } else {
                        return 0;
                    }
                } else {
                    return Number(bsc_UnidadeCorrecao.custrecord_rsc_hif_factor_percent).toFixed(6);
                }
                
                // bsc_UnidadeCorrecao = gspal.fatorCorrecao(indice, strPD, strUD);
        
                // if (bsc_UnidadeCorrecao.length > 0) {
                //     log.audit('anterior', Number(bsc_UnidadeCorrecao[0].custrecord_rsc_hif_factor_percent).toFixed(6) || 0);
                //     return Number(bsc_UnidadeCorrecao[0].custrecord_rsc_hif_factor_percent).toFixed(6) || 0;
                // } else {
                //     return 0;
                // }
            }
        }

        for (var prop in sqlResults) {
            if (sqlResults[prop].item != null || sqlResults[prop].item != 5) {
                if (sqlResults[prop].status === 'A' || sqlResults[prop].status === 'B' && sqlResults[prop].duedate) {
                    var parcelaVencida = validarVencimento(sqlResults[prop].duedate);

                    var mj;
                    if (parcelaVencida.status == true) {
                        mj = juros_e_acrescimos_moratorios(sqlResults[prop].id, sqlResults);
                    } else {
                        mj = juros_e_acrescimos_moratorios(sqlResults[prop].id, sqlResults);
                    } 

                    var juros;
                    if (sqlResults[prop].foreignamountpaid > 0) {
                        juros = parcelaVencida.status == true ? calcJuros((sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid), parcelaVencida.diasMora, jurosAA) : 0;
                    } else {
                        juros = parcelaVencida.status == true ? calcJuros(sqlResults[prop].foreigntotal - mj.ja, parcelaVencida.diasMora, jurosAA) : 0;
                    }

                    var status, vp, valorAtualizado;

                    if (parcelaVencida.status == true) {
                        valorAtualizado = sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid;
                        valorAtualizado = (valorAtualizado + ((sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid) * multa)).toFixed(2);
                        valorAtualizado = parseFloat(valorAtualizado) + parseFloat(juros);
                    }

                    if (sqlResults[prop].foreignamountpaid == sqlResults[prop].foreigntotal) {
                        status = 'Liquidado';
                    } else if (sqlResults[prop].foreignamountpaid != sqlResults[prop].foreigntotal) {
                        if ((sqlResults[prop].foreignamountpaid < sqlResults[prop].foreigntotal) || sqlResults[prop].foreignamountpaid == 0) {
                            if (sqlResults[prop].custbody_rsc_reparcelamento_destino && sqlResults[prop].custbody_rsc_amortizada != 'T') {
                                status = 'Reparcelado';
                                vp = sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid;
                            } else {
                                status = 'Aberto';
                                vp = sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid;
                            }
                        } 
                    }

                    var calcMulta = (sqlResults[prop].foreignamountpaid > 0 && parcelaVencida.status == true) ? (sqlResults[prop].foreigntotal - mj.ja - sqlResults[prop].foreignamountpaid) * multa : 
                    (parcelaVencida.status == true ? (sqlResults[prop].foreigntotal - mj.ja) * multa : 0);

                    if (status == 'Aberto') {
                        if (arrayParcelas.length == 0) {
                            arrayParcelas.push({
                                ver: sqlResults[prop].id,
                                reparcelamentoOrigem: sqlResults[prop].custbody_rsc_reparcelamento_origem,
                                reparcelamentoDestino: sqlResults[prop].custbody_rsc_reparcelamento_destino,
                                parcela: sqlResults[prop].duedate,
                                prestacao: sqlResults[prop].foreigntotal,
                                tipoParcela: sqlResults[prop].custbodyrsc_tpparc,
                                // valorOriginal: vp || sqlResults[prop].foreigntotal - mj.ja,
                                valorOriginal: sqlResults[prop].foreigntotal,
                                multa: calcMulta > 0 ? calcMulta : calcMulta,
                                juros: Number(juros).toFixed(2) || ZERO,
                                valorAtualizado: parcelaVencida.status == true ? vp + calcMulta + juros + mj.acrescimosMoratorios : vp + calcMulta + juros + mj.acrescimosMoratorios, 
                                documento: sqlResults[prop].tranid,
                                status: status,
                                amortizada: sqlResults[prop].custbody_rsc_amortizada,
                                indice: sqlResults[prop].custbody_rsc_indice,
                                ultimaAtualizacao: sqlResults[prop].custbody_rsc_ultima_atualizacao,
                                fator_correcao_2: fatorCorrecao(hoje.mes, 'anterior2', sqlResults[prop].custbody_rsc_indice),
                                fator_correcao_3: fatorCorrecao(hoje.mes, 'anterior3', sqlResults[prop].custbody_rsc_indice),
                                fator_correcao_atual: fatorCorrecao(hoje.mes, 'atual', sqlResults[prop].custbody_rsc_indice),
                                moratorios: mj.acrescimosMoratorios
                            });
                        } else {
                            const seek = arrayParcelas.find(parcela => parcela.ver === sqlResults[prop].id);

                            if (seek) {
                                // seek.valorOriginal = vp;
                                seek.valorOriginal = sqlResults[prop].foreigntotal
                                seek.multa = calcMulta;
                                seek.juros = Number(juros).toFixed(2) || ZERO;
                                seek.valorAtualizado = parcelaVencida.status == true ? vp + calcMulta + juros + mj.acrescimosMoratorios : vp + calcMulta + juros + mj.acrescimosMoratorios;
                            } else {
                                arrayParcelas.push({
                                    ver: sqlResults[prop].id,
                                    reparcelamentoOrigem: sqlResults[prop].custbody_rsc_reparcelamento_origem,
                                    reparcelamentoDestino: sqlResults[prop].custbody_rsc_reparcelamento_destino,
                                    parcela: sqlResults[prop].duedate,
                                    prestacao: sqlResults[prop].foreigntotal,
                                    tipoParcela: sqlResults[prop].custbodyrsc_tpparc,
                                    // valorOriginal: vp || sqlResults[prop].foreigntotal - mj.ja,
                                    valorOriginal: sqlResults[prop].foreigntotal,
                                    multa: calcMulta > 0 ? calcMulta : calcMulta,
                                    juros: Number(juros).toFixed(2) || ZERO,
                                    valorAtualizado: parcelaVencida.status == true ? vp + calcMulta + juros + mj.acrescimosMoratorios : vp + calcMulta + juros + mj.acrescimosMoratorios, 
                                    documento: sqlResults[prop].tranid,
                                    status: status,
                                    amortizada: sqlResults[prop].custbody_rsc_amortizada,
                                    indice: sqlResults[prop].custbody_rsc_indice,
                                    ultimaAtualizacao: sqlResults[prop].custbody_rsc_ultima_atualizacao,
                                    fator_correcao_2: fatorCorrecao(hoje.mes, 'anterior2', sqlResults[prop].custbody_rsc_indice),
                                    fator_correcao_3: fatorCorrecao(hoje.mes, 'anterior3', sqlResults[prop].custbody_rsc_indice),
                                    fator_correcao_atual: fatorCorrecao(hoje.mes, 'atual', sqlResults[prop].custbody_rsc_indice),
                                    moratorios: mj.acrescimosMoratorios
                                });
                            }
                        }
                    }                        
                }
            }
        }
    }

    arrayParcelas = arrayParcelas.filter(function (dados) {
        return !this[JSON.stringify(dados)] && (this[JSON.stringify(dados)] = true);
    }, Object.create(null));

    arrayParcelas = [...new Set(arrayParcelas)];

    var totalFinanciado = 0;

    arrayParcelas.forEach(function (dados) {
        totalFinanciado += Number(dados.prestacao);
    });

    // var fileObj = file.create({
    //     name: 'arrayParcelas_st.txt',
    //     fileType: file.Type.PLAINTEXT,
    //     folder: 767,    // SuiteScripts > teste > Arquivos
    //     contents: JSON.stringify(arrayParcelas)
    //     // contents: JSON.stringify(sqlResults)
    // });

    // var fileObjId = fileObj.save();    
    // log.audit('fileObjId: '+fileObjId, {totalFinanciado: totalFinanciado.toFixed(2), arrayParcelas: arrayParcelas});

    return {arrayParcelas: remold(arrayParcelas), totalFinanciado: totalFinanciado.toFixed(2)};
}

function remold(array) {
    var arrayParcelas = [];

    for (var prop in array) {
        if (arrayParcelas.length > 0) {
            const result = arrayParcelas.find(parcela => parcela.ver === array[prop].ver);

            if (result) {
                log.audit('Finded!', result);
            } else {
                arrayParcelas.push({
                    ver: array[prop].ver,
                    reparcelamentoOrigem: array[prop].reparcelamentoOrigem,
                    reparcelamentoDestino: array[prop].reparcelamentoDestino,
                    parcela: array[prop].parcela,
                    prestacao: array[prop].prestacao,
                    tipoParcela: array[prop].tipoParcela,
                    valorOriginal: array[prop].valorOriginal,
                    multa: array[prop].multa,
                    juros: array[prop].juros,                    
                    valorAtualizado: array[prop].valorAtualizado,
                    documento: array[prop].documento,
                    status: array[prop].status,
                    indice: array[prop].indice,
                    ultimaAtualizacao: array[prop].ultimaAtualizacao,
                    fator_correcao_2: array[prop].fator_correcao_2,
                    fator_correcao_3: array[prop].fator_correcao_3,
                    fator_correcao_atual: array[prop].fator_correcao_atual,
                    moratorios: array[prop].moratorios
                });
            }
        } else {
            arrayParcelas.push({
                ver: array[prop].ver,
                reparcelamentoOrigem: array[prop].reparcelamentoOrigem,
                reparcelamentoDestino: array[prop].reparcelamentoDestino,
                parcela: array[prop].parcela,
                prestacao: array[prop].prestacao,
                tipoParcela: array[prop].tipoParcela,
                valorOriginal: array[prop].valorOriginal,
                multa: array[prop].multa,
                juros: array[prop].juros,                    
                valorAtualizado: array[prop].valorAtualizado,
                documento: array[prop].documento,
                status: array[prop].status,
                indice: array[prop].indice,
                ultimaAtualizacao: array[prop].ultimaAtualizacao,
                fator_correcao_2: array[prop].fator_correcao_2,
                fator_correcao_3: array[prop].fator_correcao_3,
                fator_correcao_atual: array[prop].fator_correcao_atual,
                moratorios: array[prop].moratorios
            });
        }
    }

    return arrayParcelas;
}

function validarVencimento(duedate) {
    const hoje = new Date();

    var diaHoje = hoje.getDate();
    var mesHoje = hoje.getMonth()+1;
    var anoHoje = hoje.getFullYear();

    var partesData = duedate.split("/");

    var vencimento = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    var diaVencimento = vencimento.getDate();
    var mesVencimento = vencimento.getMonth()+1;
    var anoVencimento = vencimento.getFullYear();

    if (hoje > vencimento) {
        var tempo = Math.abs(hoje.getTime() - vencimento.getTime());

        var diasMora = Math.ceil(tempo / (1000 * 3600 * 24));

        if ((diasMora-1) >= 1) {
            return {
                status: true, 
                diasMora: diasMora-1
            }
        }   
        
        return {
            status: false
        }
    } else {
        return {
            status: false
        }
    }
}

const construtor = (method, parameters) => {
    log.audit('construtor', {method: method, parameters: parameters});

    var form = serverWidget.createForm({
        title: 'Simulação'
    });
    
    const dadosFaturaPrincipal = form.addFieldGroup({
        id: custPage+'dados_fatura_principal',
        label: 'Dados da Fatura Principal'
    });

    const dadosSimulacao = form.addFieldGroup({
        id: custPage+'dados_simulacao',
        label: 'Dados para Simulação'
    });

    // Grupo: Dados da Fatura Principal
    var cliente = form.addField({
        id: custPage+'cliente',
        type: serverWidget.FieldType.SELECT,
        label: 'Cliente',
        container: custPage+'dados_fatura_principal',
        source: 'customer'
    });

    cliente.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var total_fatura_principal = form.addField({
        id: custPage+'total_fatura_principal',
        label: 'Total Contrato',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'dados_fatura_principal'
    });

    total_fatura_principal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var empreendimento = form.addField({
        id: custPage+'empreendimento',
        label: 'Empreendimento',
        type: serverWidget.FieldType.SELECT,
        container: custPage+'dados_fatura_principal',
        source: 'job'
    });

    empreendimento.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var contrato = form.addField({
        id: custPage+'contrato',
        label: 'Contrato',
        type: serverWidget.FieldType.TEXT,
        container: custPage+'dados_fatura_principal'
    });

    contrato.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var unidade = form.addField({
        id: custPage+'unidade',
        type: serverWidget.FieldType.SELECT,
        label: 'Unidade',
        container: custPage+'dados_fatura_principal',
        source: 'customrecord_rsc_unidades_empreendimento'
    });

    unidade.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });
    
    var linkFaturaPrincipal = form.addField({
        id: custPage+'link_fatura_principal',
        type: serverWidget.FieldType.URL,
        label: 'Fatura Principal',
        container: custPage+'dados_fatura_principal'
    });

    linkFaturaPrincipal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var idFaturaPrincipal = form.addField({
        id: custPage+'id_fatura_principal',
        type: serverWidget.FieldType.TEXT,
        label: 'ID Fatura Principal',
        container: custPage+'dados_fatura_principal'
    });

    idFaturaPrincipal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var faturaPrincipal = form.addField({
        id: custPage+'fatura_principal',
        type: serverWidget.FieldType.SELECT,
        label: 'Fatura Principal',
        container: custPage+'dados_fatura_principal',
        source: 'invoice'
    });

    faturaPrincipal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var jsonReparcelamento = form.addField({
        id: custPage+'json_reparcelamento',
        type: serverWidget.FieldType.TEXTAREA,
        label: 'JSON Reparcelamento',
        container: custPage+'dados_fatura_principal'
    });

    jsonReparcelamento.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    // Grupo: Simulação
    var renegociacao = form.addField({
        id: custPage+'renegociacao',
        label: 'Renegociação',
        type: serverWidget.FieldType.TEXT,
        container: custPage+'dados_simulacao'
    });

    renegociacao.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var totalParcelasMarcadas = form.addField({
        id: custPage+'parcelas_marcadas',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Valor Selecionado',
        container: custPage+'dados_simulacao'
    });

    totalParcelasMarcadas.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var total_novas_parcelas = form.addField({
        id: custPage+'total_novas_parcelas',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total Novas Parcelas',
        container: custPage+'dados_simulacao'
    });

    total_novas_parcelas.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var novoValor = form.addField({
        id: custPage+'novo_valor',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Novo Valor',
        container: custPage+'dados_simulacao'
    });

    novoValor.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var vencimentoEntrada = form.addField({
        id: custPage+'vencimento_entrada',
        label: 'Vencimento Entrada',
        type: serverWidget.FieldType.DATE,
        container: custPage+'dados_simulacao'
    });

    vencimentoEntrada.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var dataInicio = form.addField({
        id: custPage+'data_inicio',
        label: '1º Vencimento',
        type: serverWidget.FieldType.DATE,
        container: custPage+'dados_simulacao'
    });
    
    dataInicio.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var vencimentoParcela = form.addField({
        id: custPage+'vencimento_parcela',
        type: serverWidget.FieldType.DATE,
        label: 'Vencimento Parcela',
        container: custPage+'dados_simulacao'
    });

    vencimentoParcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var difDias = form.addField({
        id: custPage+'dif_dias',
        label: 'Dias Pro Rata',
        type: serverWidget.FieldType.INTEGER,
        container: custPage+'dados_simulacao'
    });

    difDias.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var novoVencimento = form.addField({
        id: custPage+'novo_vencimento',
        type: serverWidget.FieldType.DATE,
        label: 'Novo Vencimento',
        container: custPage+'dados_simulacao'
    });

    novoVencimento.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    }); 

    var pro_rata_calculado = form.addField({
        id: custPage+'pro_rata_calculado',
        label: 'Pro rata (calculado)',
        type: serverWidget.FieldType.CURRENCY,
        container: custPage+'dados_simulacao'
    });

    pro_rata_calculado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var observacoes = form.addField({
        id: custPage+'observacoes',
        type: serverWidget.FieldType.TEXTAREA,
        label: 'Observações',
        container: custPage+'dados_simulacao'
    });

    var tabelaEfetivacao = form.addField({
        id: custPage+'tabela_efetivacao',
        type: serverWidget.FieldType.URL,
        label: 'Tabela de Efetivação',
        container: custPage+'dados_simulacao'
    });

    tabelaEfetivacao.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });  

    var saldoContrato = form.addField({
        id: custPage+'saldo_contrato',
        label: 'Saldo Contrato',
        type: serverWidget.FieldType.CURRENCY
    });

    saldoContrato.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var idTabelaEfetivacaoReparcelamento = form.addField({
        id: custPage+'id_tabela_efetivacao_reparcelamento',
        type: serverWidget.FieldType.INTEGER,
        label: 'ID Tabela Efetivação Reparcelamento',
    });

    idTabelaEfetivacaoReparcelamento.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var custoTotal = form.addField({
        id: custPage+'custo_total',
        label: 'Saldo',
        type: serverWidget.FieldType.CURRENCY
    });

    custoTotal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var valorEntrada = form.addField({
        id: custPage+'valor_entrada',
        label: 'Valor da Entrada',
        type: serverWidget.FieldType.CURRENCY
    });

    valorEntrada.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var reparcelarEm = form.addField({
        id: custPage+'reparcelar_em',
        type: serverWidget.FieldType.TEXT,
        label: 'Reparcelar em'
    });

    reparcelarEm.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });
    
    var jurosMora = form.addField({
        id: custPage+'juros_mora',
        label: 'Juros de Mora',
        type: serverWidget.FieldType.CURRENCY
    });

    jurosMora.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var jsonRenegociacao = form.addField({
        id: custPage+'json_renegociacao',
        type: serverWidget.FieldType.LONGTEXT,
        label: 'JSON Renegociacao'
    });

    jsonRenegociacao.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    }); 
    
    // if (runtime.getCurrentUser().id == 3588) {
        var atualizacaoMonetaria = form.addField({
            id: custPage+'atualizacao_monetaria',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Atualização Monetária'
        });
    
        atualizacaoMonetaria.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        }); 
    // }   
    
    // Grupo de campos: Resumo    
    const dadosResumo = form.addFieldGroup({
        id: custPage+'dados_resumo',
        label: 'Resumo'
    });

    // Valores Calculados
    var principalCalculado = form.addField({
        id: custPage+'principal_calculado',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Principal Calculado',
        container: custPage+'dados_resumo'
    });
    
    var multaCalculado = form.addField({
        id: custPage+'multa_calculado',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Multa Calculado',
        container: custPage+'dados_resumo'
    });

    var jurosCalculado = form.addField({
        id: custPage+'juros_calculado',
        type: serverWidget.FieldType.FLOAT,
        label: 'Juros Calculado',
        container: custPage+'dados_resumo'
    });

    var proRataCalculado2 = form.addField({
        id: custPage+'pro_rata_calculado_2',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Pro Rata Calculado',
        container: custPage+'dados_resumo'
    });

    var totalCalculado = form.addField({
        id: custPage+'total_calculado',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total Calculado',
        container: custPage+'dados_resumo'
    });

    // Valores Informadosdas Multas
    var principalInformado = form.addField({
        id: custPage+'principal_informado',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Principal Informado',
        container: custPage+'dados_resumo'
    });

    var multaInformado = form.addField({
        id: custPage+'multa_informado',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Multa Informado',
        container: custPage+'dados_resumo'
    });

    var jurosInformado = form.addField({
        id: custPage+'juros_informado',
        type: serverWidget.FieldType.FLOAT,
        label: 'Juros Informado',
        container: custPage+'dados_resumo'
    });

    var proRataInformado = form.addField({
        id: custPage+'pro_rata_informado',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Pro Rata Informado',
        container: custPage+'dados_resumo'
    });

    var totalInformado = form.addField({
        id: custPage+'total_informado',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total Informado',
        container: custPage+'dados_resumo'
    });

    // Valores Diferença
    var principalDiferenca = form.addField({
        id: custPage+'principal_diferenca',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Principal Diferenca',
        container: custPage+'dados_resumo'
    });

    var multaDiferenca = form.addField({
        id: custPage+'multa_diferenca',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Multa Diferenca',
        container: custPage+'dados_resumo'
    });

    var jurosDiferenca = form.addField({
        id: custPage+'juros_diferenca',
        type: serverWidget.FieldType.FLOAT,
        label: 'Juros Diferenca',
        container: custPage+'dados_resumo'
    });

    var proRataDiferenca = form.addField({
        id: custPage+'pro_rata_diferenca',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Pro Rata Diferença',
        container: custPage+'dados_resumo'
    });

    var totalDiferenca = form.addField({
        id: custPage+'total_diferenca',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total Diferenca',
        container: custPage+'dados_resumo'
    });
    
    // Display
    principalCalculado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    principalInformado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    principalDiferenca.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    multaCalculado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    multaInformado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    multaDiferenca.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });   

    jurosCalculado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    jurosInformado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    jurosDiferenca.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });   

    proRataCalculado2.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });
    
    proRataInformado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    proRataDiferenca.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    totalCalculado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    totalInformado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    totalDiferenca.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var parameters;

    var arrayParcelas;

    // Grupo: Dados da Fatura Principal
    var idFaturaPrincipal = form.getField({id: custPage+'id_fatura_principal'});
    var faturaPrincipal = form.getField({id: custPage+'fatura_principal'});
    var linkFaturaPrincipal = form.getField({id: custPage+'link_fatura_principal'});
    var total_fatura_principal = form.getField({id: custPage+'total_fatura_principal'});
    var cliente = form.getField({id: custPage+'cliente'});
    var empreendimento = form.getField({id: custPage+'empreendimento'});
    var unidade = form.getField({id: custPage+'unidade'});
    var contrato = form.getField({id: custPage+'contrato'});
    var jsonReparcelamento = form.getField({id: custPage+'json_reparcelamento'});
    log.audit('jsonReparcelamento', jsonReparcelamento);
    jsonReparcelamento.maxLength = 400000;
    log.audit('maxLength jsonReparcelamento', jsonReparcelamento);

    // Grupo: Simulação
    var renegociacao = form.getField({id: custPage+'renegociacao'});
    var parcelasMarcadas = form.getField({id: custPage+'parcelas_marcadas'});
    var total_novas_parcelas = form.getField({id: custPage+'total_novas_parcelas'});
    var custoTotal = form.getField({id: custPage+'custo_total'});
    var dataInicio = form.getField({id: custPage+'data_inicio'});
    var difDias = form.getField({id: custPage+'dif_dias'});
    var pro_rata_calculado = form.getField({id: custPage+'pro_rata_calculado'});
    var vencimentoParcela = form.getField({id: custPage+'vencimento_parcela'});
    var novoValor = form.getField({id: custPage+'novo_valor'});
    var novoVencimento = form.getField({id: custPage+'novo_vencimento'});
    var tabelaEfetivacao = form.getField({id: custPage+'tabela_efetivacao'});
    var observacoes = form.getField({id: custPage+'observacoes'});
    var saldoContrato = form.getField({id: custPage+'saldo_contrato'});
    var idTabelaEfetivacaoReparcelamento = form.getField({id: custPage+'id_tabela_efetivacao_reparcelamento'});
    var valorEntrada = form.getField({id: custPage+'valor_entrada'});
    var reparcelarEm = form.getField({id: custPage+'reparcelar_em'});
    var vencimentoEntrada = form.getField({id: custPage+'vencimento_entrada'});
    var jurosMora = form.getField({id: custPage+'juros_mora'});    
    var jsonRenegociacao = form.getField({id: custPage+'json_renegociacao'});

    // Grupo: Resumo
    var principalCalculado = form.getField({id: custPage+'principal_calculado'});
    var principalInformado = form.getField({id: custPage+'principal_informado'});
    var principalDiferenca = form.getField({id: custPage+'principal_diferenca'});
    var multaCalculado = form.getField({id: custPage+'multa_calculado'});
    var multaInformado = form.getField({id: custPage+'multa_informado'});
    var multaDiferenca = form.getField({id: custPage+'multa_diferenca'});
    var jurosCalculado = form.getField({id: custPage+'juros_calculado'});
    var jurosInformado = form.getField({id: custPage+'juros_informado'});
    var jurosDiferenca = form.getField({id: custPage+'juros_diferenca'});
    var proRataCalculado2 = form.getField({id: custPage+'pro_rata_calculado_2'});
    var proRataInformado = form.getField({id: custPage+'pro_rata_informado'});
    var proRataDiferenca = form.getField({id: custPage+'pro_rata_diferenca'});
    var totalCalculado = form.getField({id: custPage+'total_calculado'});
    var totalInformado = form.getField({id: custPage+'total_informado'});
    var totalDiferenca = form.getField({id: custPage+'total_diferenca'});

    // Sublista Resumo do Reparcelamento
    var sublistaResumoReparcelamento = form.getSublist({id: custPage+'sublista_resumo_reparcelamento'});
    // Sublista Lista de Parcelas
    var sublistaReparcelamento = form.getSublist({id: custPage+'sublista_resumo_reparcelamento'}); 

    if (method == 'POST' && parameters.custpage_rsc_json_sp) {
        var atencao = form.addField({
            id: custPage+'atencao',
            type: serverWidget.FieldType.INLINEHTML,
            label: ' ',
        });

        atencao.defaultValue = '<font size="2">Para completar o grid selecione os campos <B>"Índice"</B> e <B>"Data Juros"</B> na 1ª linha.</font><br><br>'

        atencao.updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
        });

        parameters = JSON.parse(parameters.custpage_rsc_json_sp);
        log.audit('parameters', parameters);

        var fileObj = file.create({
            name: 'parameters_simulacao.txt',
            fileType: file.Type.PLAINTEXT,
            folder: 767, // SuiteScripts > teste > Arquivos
            // contents: JSON.stringify(arrayParcelas)
            contents: JSON.stringify(parameters)
        });
    
        var fileObjId = fileObj.save();

        var somatorio = parameters.somatorioParcelas
        log.audit('somatorio', somatorio);

        var ZERO = Number('0').toFixed(2);

        if (parameters.renegociacao == 'Amortização') {
            principalCalculado.defaultValue = principalDiferenca.defaultValue = parseFloat(somatorio.valorOriginal) + parseFloat(somatorio.atualizacaoMonetaria);
            proRataCalculado2.defaultValue = proRataInformado.defaultValue = proRataDiferenca.defaultValue = somatorio.proRata;
            totalCalculado.defaultValue = totalDiferenca.defaultValue = parseFloat(somatorio.valorAtualizado) + parseFloat(somatorio.atualizacaoMonetaria);
            // ZEROS
            multaCalculado.defaultValue = jurosCalculado.defaultValue = principalInformado.defaultValue = totalInformado.defaultValue = multaInformado.defaultValue = jurosInformado.defaultValue = 
            multaDiferenca.defaultValue = jurosDiferenca.defaultValue = ZERO;
        }

        if (parameters.renegociacao == 'Inadimplentes' || parameters.renegociacao == 'Adimplentes' || parameters.renegociacao == 'Recálculo de atrasos' || parameters.renegociacao == 'Antecipação') {
            principalCalculado.defaultValue = principalDiferenca.defaultValue = parseFloat(somatorio.valorOriginal) + parseFloat(somatorio.atualizacaoMonetaria);
            multaCalculado.defaultValue = multaDiferenca.defaultValue = somatorio.multa;
            jurosCalculado.defaultValue = jurosDiferenca.defaultValue = Number(somatorio.juros).toFixed(2);
            proRataCalculado2.defaultValue = proRataDiferenca.defaultValue = somatorio.proRata;
            totalCalculado.defaultValue = totalDiferenca.defaultValue = parseFloat(somatorio.valorAtualizado) + parseFloat(somatorio.atualizacaoMonetaria);

            if (parameters.renegociacao == 'Recálculo de atrasos' || parameters.renegociacao == 'Antecipação') {
                principalInformado.defaultValue = parseFloat(somatorio.valorOriginal) + parseFloat(somatorio.atualizacaoMonetaria);
                multaInformado.defaultValue = somatorio.multa;
                jurosInformado.defaultValue = Number(somatorio.juros).toFixed(2);
                proRataInformado.defaultValue = somatorio.proRata;
                totalInformado.defaultValue = parseFloat(somatorio.valorAtualizado) + parseFloat(somatorio.atualizacaoMonetaria);

                principalDiferenca.defaultValue = multaDiferenca.defaultValue = jurosDiferenca.defaultValue = proRataDiferenca.defaultValue = totalDiferenca.defaultValue = ZERO;
            } else {
                // ZEROS
                principalInformado.defaultValue = multaInformado.defaultValue = jurosInformado.defaultValue = proRataInformado.defaultValue = totalInformado.defaultValue = ZERO;
            }
        }
        
        // if (parameters.renegociacao == 'Amortização' || parameters.renegociacao == 'Antecipação') {
        //     var campanhaDesconto = form.addField({
        //         id: custPage+'campanha_desconto',
        //         type: serverWidget.FieldType.TEXTAREA,
        //         label: 'Campanha Desconto'
        //     });
        
        //     campanhaDesconto.updateDisplayType({
        //         displayType: serverWidget.FieldDisplayType.INLINE
        //     });
            
        //     campanhaDesconto.defaultValue = JSON.stringify(parameters.campanhaDesconto);
        // }

        const idFatura = parameters.id ? parameters.id : parameters.recordid;

        var lkpFatura = search.lookupFields({
            type: 'salesorder',
            id: idFatura,
            columns: ['tranid', 'entity', 'createdfrom', 'total', 'custbody_rsc_tran_unidade', 'custbody_rsc_projeto_obra_gasto_compra', 'custbody_lrc_numero_contrato']
        });

        arrayParcelas = parameters.arrayParcelas;

        // Grupo: Dados da Fatura Principal
        idFaturaPrincipal.defaultValue = parameters.id;
        faturaPrincipal.defaultValue = parameters.faturaPrincipal;
        total_fatura_principal.defaultValue = parameters.total_fatura_principal;
        cliente.defaultValue = lkpFatura.entity[0].value;
        empreendimento.defaultValue = lkpFatura.custbody_rsc_projeto_obra_gasto_compra[0].value;
        unidade.defaultValue = lkpFatura.custbody_rsc_tran_unidade.length > 0 ? lkpFatura.custbody_rsc_tran_unidade[0].value : '';
        contrato.defaultValue = parameters.contrato;
        jsonReparcelamento.defaultValue = JSON.stringify(parameters.arrayParcelas);

        // Grupo: Simulação
        parcelasMarcadas.defaultValue = parameters.parcelasMarcadas;
        custoTotal.defaultValue = parameters.custoTotal;
        saldoContrato.defaultValue = parameters.custoTotal;

        // Atualização Monetária
        atualizacaoMonetaria.defaultValue = somatorio.atualizacaoMonetaria;

        if (parameters.renegociacao == 'Amortização' || parameters.renegociacao == 'Recálculo de atrasos' || parameters.renegociacao == 'Antecipação') {
            renegociacao.defaultValue = parameters.renegociacao;
            dataInicio.defaultValue = parameters.dataInicio;
            vencimentoEntrada.defaultValue = parameters.vencimentoEntrada;
            total_novas_parcelas.defaultValue = 0;
            vencimentoParcela.defaultValue = parameters.arrayParcelas[0].vencimento;
            novoValor.defaultValue = Number('0').toFixed(2);

            var split_di = parameters.dataInicio.split('/');
            var split_nv = parameters.arrayParcelas[0].vencimento.split('/');
            var split_ve = parameters.vencimentoEntrada.split('/');
            log.audit('splits', {
                split_di: split_di,
                split_nv: split_nv,
                split_ve: split_ve
            });

            if (parameters.dataInicio) {
                if (split_nv[1] == '02' && split_di[0] > '28') {
                    split_di[0] = '28';
                    novoVencimento.defaultValue = String(split_di[0]+'/'+split_nv[1]+'/'+split_nv[2]);
                } else if ((split_nv[1] == '04' || split_nv[1] == '06' || split_nv[1] == '09' || split_nv[1] == '11') &&  split_di[0] > '30') {
                    split_di[0] = '30';
                    novoVencimento.defaultValue = String(split_di[0]+'/'+split_nv[1]+'/'+split_nv[2]);
                } else {
                    novoVencimento.defaultValue = (split_di[0] < split_nv[0]) ? String(split_nv[0]+'/'+split_nv[1]+'/'+split_nv[2]) : String(split_di[0]+'/'+split_nv[1]+'/'+split_nv[2]);
                }
            } else {
                novoVencimento.defaultValue = String(split_ve[0]+'/'+split_ve[1]+'/'+split_ve[2]);
            } 

            difDias.defaultValue = parameters.calculoPR.difDias;
            pro_rata_calculado.defaultValue = parameters.calculoPR.proRata;
            
            if (parameters.renegociacao == 'Amortização') {
                gerarSublistaAmortizacao(form, 'sublista_resumo_reparcelamento', parameters.renegociacao, arrayParcelas, parameters.reparcelarEm, parameters.dataInicio, parameters.calculoPR, 'GET');
            } else if (parameters.renegociacao == 'Recálculo de atrasos') {
                gerarSublistaRecalculoAtrasos(form, 'sublista_resumo_reparcelamento', parameters.renegociacao, arrayParcelas, parameters.reparcelarEm, parameters.vencimentoEntrada, parameters.calculoPR, 'GET', 0, somatorio.atualizacaoMonetaria);
            } else {
                // gerarSublistaAntecipacao(form, 'sublista_resumo_reparcelamento', parameters.renegociacao, arrayParcelas, parameters.reparcelarEm, parameters.vencimentoEntrada, parameters.calculoPR, 'GET', 0, somatorio.atualizacaoMonetaria, parameters.campanhaDesconto);
                gerarSublistaAntecipacao(form, 'sublista_resumo_reparcelamento', parameters.renegociacao, arrayParcelas, parameters.reparcelarEm, parameters.vencimentoEntrada, parameters.calculoPR, 'GET', 0, somatorio.atualizacaoMonetaria);
            }
        }

        if (parameters.renegociacao == 'Inadimplentes' || parameters.renegociacao == 'Adimplentes') {            
            renegociacao.defaultValue = parameters.renegociacao;
            dataInicio.defaultValue = parameters.dataInicio;
            vencimentoEntrada.defaultValue = parameters.vencimentoEntrada;
            total_novas_parcelas.defaultValue = 0;
            reparcelarEm.defaultValue = parameters.reparcelarEm;

            var somatorioParcelas = parameters.somatorioParcelas;
            
            if (parameters.renegociacao == 'Inadimplentes') {
                gerarSublistaInadimplentes(form, 'sublista_lista_parcelas', parameters.renegociacao, somatorioParcelas, parameters.reparcelarEm, parameters.dataInicio, parameters.vencimentoEntrada, parameters.calculoPR, 'GET');
            } else {
                gerarSublistaAdimplentes(form, 'sublista_lista_parcelas', parameters.renegociacao, somatorioParcelas, parameters.reparcelarEm, parameters.dataInicio, parameters.vencimentoEntrada, parameters.calculoPR, 'GET');
            }
                

            form.addButton({
                id: custPage+'completar_grid',
                label: 'Completar grid',
                functionName: 'completarGrid'
            });
        }

        form.addSubmitButton({
            label: 'Salvar'
        });
    } else {
        log.audit(method, parameters);

        var fileObj = file.create({
            name: 'parameters.txt',
            fileType: file.Type.PLAINTEXT,
            folder: 704, // SuiteScripts > teste > Arquivos
            // contents: JSON.stringify(arrayParcelas)
            contents: JSON.stringify(parameters)
        });
    
        var fileObjId = fileObj.save();

        parameters = parameters;
        
        observacoes.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        // Grupo: Dados da Fatura Principal        
        idFaturaPrincipal.defaultValue = parameters.custpage_rsc_id_fatura_principal;
        empreendimento.defaultValue = parameters.custpage_rsc_empreendimento;
        contrato.defaultValue = parameters.custpage_rsc_contrato;
        faturaPrincipal.defaultValue = parameters.custpage_rsc_fatura_principal;
        linkFaturaPrincipal.defaultValue = parameters.custpage_rsc_link_fatura_principal;
        linkFaturaPrincipal.linkText = 'Visualizar';
        total_fatura_principal.defaultValue = parameters.custpage_rsc_total_fatura_principal;
        cliente.defaultValue = parameters.custpage_rsc_cliente;
        unidade.defaultValue = parameters.custpage_rsc_unidade;
        jsonReparcelamento.defaultValue = parameters.custpage_rsc_json_reparcelamento;

        var jsonTabelaEfetivacao = {
            idFaturaPrincipal: parameters.custpage_rsc_id_fatura_principal,
            faturaPrincipal: parameters.custpage_rsc_fatura_principal,
            linkFaturaPrincipal: parameters.custpage_rsc_link_fatura_principal,
            total_fatura_principal: parameters.custpage_rsc_total_fatura_principal,
            cliente: parameters.custpage_rsc_cliente,
            empreendimento: parameters.custpage_rsc_empreendimento,
            unidade: parameters.custpage_rsc_unidade,
            jsonReparcelamento: parameters.custpage_rsc_json_reparcelamento,
            renegociacao: parameters.custpage_rsc_renegociacao,
            jsonRenegociacao: parameters.custpage_rsc_json_renegociacao,
            atualizacaoMonetaria: parameters.custpage_rsc_atualizacao_monetaria
        }

        // Grupo: Simulação
        renegociacao.defaultValue = parameters.custpage_rsc_renegociacao;
        observacoes.defaultValue = parameters.custpage_rsc_observacoes;
        parcelasMarcadas.defaultValue = parameters.custpage_rsc_parcelas_marcadas;
        custoTotal.defaultValue = parameters.custpage_rsc_custo_total;
        saldoContrato.defaultValue = parameters.custpage_rsc_custo_total;
        
        // Atualização Monetária
        atualizacaoMonetaria.defaultValue = parameters.custpage_rsc_atualizacao_monetaria;

        // Grupo: Resumo
        principalCalculado.defaultValue = parameters.custpage_rsc_principal_calculado;
        principalInformado.defaultValue = parameters.custpage_rsc_principal_informado;
        principalDiferenca.defaultValue = parameters.custpage_rsc_principal_diferenca;
        multaCalculado.defaultValue = parameters.custpage_rsc_multa_calculado;
        multaInformado.defaultValue = parameters.custpage_rsc_multa_informado;
        multaDiferenca.defaultValue = parameters.custpage_rsc_multa_diferenca;
        jurosCalculado.defaultValue = parameters.custpage_rsc_juros_calculado;
        jurosInformado.defaultValue = parameters.custpage_rsc_juros_informado;
        jurosDiferenca.defaultValue = parameters.custpage_rsc_juros_diferenca;
        proRataCalculado2.defaultValue = parameters.custpage_rsc_pro_rata_calculado_2;
        proRataInformado.defaultValue = parameters.custpage_rsc_pro_rata_informado;
        proRataDiferenca.defaultValue = parameters.custpage_rsc_pro_rata_diferenca;
        totalCalculado.defaultValue = parameters.custpage_rsc_total_calculado;
        totalInformado.defaultValue = parameters.custpage_rsc_total_informado;
        totalDiferenca.defaultValue = parameters.custpage_rsc_total_diferenca;

        switch (parameters.custpage_rsc_renegociacao) {
            case 'Amortização': 
                dataInicio.defaultValue = parameters.custpage_rsc_data_inicio; 
                vencimentoEntrada.defaultValue = parameters.custpage_rsc_vencimento_entrada;                 
                vencimentoParcela.defaultValue = parameters.custpage_rsc_vencimento_parcela;
                total_novas_parcelas.defaultValue = parameters.custpage_rsc_total_novas_parcelas;
                novoValor.defaultValue = parameters.custpage_rsc_novo_valor;
                novoVencimento.defaultValue = parameters.custpage_rsc_novo_vencimento;
                difDias.defaultValue = parameters.custpage_rsc_dif_dias;
                pro_rata_calculado.defaultValue = parameters.custpage_rsc_pro_rata_calculado;
                
                jsonTabelaEfetivacao.observacoes = parameters.custpage_rsc_observacoes;                
                jsonTabelaEfetivacao.vencimentoEntrada = parameters.custpage_rsc_vencimento_entrada;
                jsonTabelaEfetivacao.dataInicio = parameters.custpage_rsc_data_inicio;
                jsonTabelaEfetivacao.total_novas_parcelas = parameters.custpage_rsc_total_novas_parcelas;
                jsonTabelaEfetivacao.novoVencimento = parameters.custpage_rsc_novo_vencimento;
                jsonTabelaEfetivacao.novoValor = parameters.custpage_rsc_novo_valor;
                jsonTabelaEfetivacao.vencimentoParcela = parameters.custpage_rsc_vencimento_parcela;
                jsonTabelaEfetivacao.proRata = parameters.custpage_rsc_pro_rata_calculado;

                arrayParcelas = JSON.parse(parameters.custpage_rsc_json_renegociacao);
                log.audit('arrayParcelas', arrayParcelas);

                gerarSublistaAmortizacao(
                    form, 
                    'sublista_resumo_reparcelamento', 
                    parameters.custpage_rsc_renegociacao, 
                    arrayParcelas, 
                    parameters.custpage_rsc_reparcelar_em, 
                    parameters.custpage_rsc_data_inicio, 
                    {
                        difDias: parameters.custpage_rsc_dif_dias,
                        proRata: parameters.custpage_rsc_pro_rata_calculado
                    },
                    method,
                    JSON.parse(parameters.custpage_rsc_json_reparcelamento)[0].id_financiamento_invoice
                );
            break;

            case 'Inadimplentes': 
                dataInicio.defaultValue = parameters.custpage_rsc_data_inicio;
                reparcelarEm.defaultValue = parameters.custpage_rsc_reparcelar_em;
                vencimentoEntrada.defaultValue = parameters.custpage_rsc_vencimento_entrada;
                total_novas_parcelas.defaultValue = parameters.custpage_rsc_total_novas_parcelas;

                jsonTabelaEfetivacao.observacoes = parameters.custpage_rsc_observacoes;
                jsonTabelaEfetivacao.dataInicio = parameters.custpage_rsc_data_inicio;
                jsonTabelaEfetivacao.reparcelarEm = parameters.custpage_rsc_reparcelar_em;
                jsonTabelaEfetivacao.vencimentoEntrada = parameters.custpage_rsc_vencimento_entrada;
                jsonTabelaEfetivacao.total_novas_parcelas = parameters.custpage_rsc_total_novas_parcelas;

                arrayParcelas = JSON.parse(parameters.custpage_rsc_json_renegociacao);

                jsonRenegociacao.defaultValue = arrayParcelas;

                gerarSublistaInadimplentes(
                    form, 
                    'sublista_resumo_reparcelamento', 
                    parameters.custpage_rsc_renegociacao,   
                    arrayParcelas, 
                    parameters.custpage_rsc_reparcelar_em, 
                    parameters.custpage_rsc_data_inicio, 
                    parameters.custpage_rsc_vencimento_entrada,
                    {
                        difDias: parameters.custpage_rsc_dif_dias || 0,
                        proRata: parameters.custpage_rsc_pro_rata_calculado || 0
                    },
                    method,
                    JSON.parse(parameters.custpage_rsc_json_reparcelamento)
                );
            break;

            case 'Adimplentes': 
                dataInicio.defaultValue = parameters.custpage_rsc_data_inicio;
                reparcelarEm.defaultValue = parameters.custpage_rsc_reparcelar_em;
                vencimentoEntrada.defaultValue = parameters.custpage_rsc_vencimento_entrada;
                total_novas_parcelas.defaultValue = parameters.custpage_rsc_total_novas_parcelas;
                
                jsonTabelaEfetivacao.observacoes = parameters.custpage_rsc_observacoes;
                jsonTabelaEfetivacao.dataInicio = parameters.custpage_rsc_data_inicio;
                jsonTabelaEfetivacao.reparcelarEm = parameters.custpage_rsc_reparcelar_em;
                jsonTabelaEfetivacao.vencimentoEntrada = parameters.custpage_rsc_vencimento_entrada;
                jsonTabelaEfetivacao.total_novas_parcelas = parameters.custpage_rsc_total_novas_parcelas;

                arrayParcelas = JSON.parse(parameters.custpage_rsc_json_renegociacao);

                jsonRenegociacao.defaultValue = arrayParcelas;

                gerarSublistaAdimplentes(
                    form, 
                    'sublista_resumo_reparcelamento', 
                    parameters.custpage_rsc_renegociacao,   
                    arrayParcelas, 
                    parameters.custpage_rsc_reparcelar_em, 
                    parameters.custpage_rsc_data_inicio, 
                    parameters.custpage_rsc_vencimento_entrada,
                    {
                        difDias: parameters.custpage_rsc_dif_dias || 0,
                        proRata: parameters.custpage_rsc_pro_rata_calculado || 0
                    },
                    method,
                    JSON.parse(parameters.custpage_rsc_json_reparcelamento)
                );
            break;

            case 'Recálculo de atrasos': 
                dataInicio.defaultValue = parameters.custpage_rsc_data_inicio;
                vencimentoEntrada.defaultValue = parameters.custpage_rsc_vencimento_entrada;             
                vencimentoParcela.defaultValue = parameters.custpage_rsc_vencimento_parcela;
                total_novas_parcelas.defaultValue = parameters.custpage_rsc_total_novas_parcelas;
                novoValor.defaultValue = parameters.custpage_rsc_novo_valor;
                novoVencimento.defaultValue = parameters.custpage_rsc_novo_vencimento;
                difDias.defaultValue = parameters.custpage_rsc_dif_dias;
                pro_rata_calculado.defaultValue = parameters.custpage_rsc_pro_rata_calculado;
                
                jsonTabelaEfetivacao.observacoes = parameters.custpage_rsc_observacoes;
                jsonTabelaEfetivacao.dataInicio = parameters.custpage_rsc_data_inicio;
                jsonTabelaEfetivacao.vencimentoEntrada = parameters.custpage_rsc_vencimento_entrada;
                jsonTabelaEfetivacao.total_novas_parcelas = parameters.custpage_rsc_total_novas_parcelas;
                jsonTabelaEfetivacao.novoVencimento = parameters.custpage_rsc_novo_vencimento;
                jsonTabelaEfetivacao.novoValor = parameters.custpage_rsc_novo_valor;
                jsonTabelaEfetivacao.vencimentoParcela = parameters.custpage_rsc_vencimento_parcela;

                arrayParcelas = JSON.parse(parameters.custpage_rsc_json_renegociacao);

                gerarSublistaRecalculoAtrasos(
                    form, 
                    'sublista_resumo_reparcelamento', 
                    parameters.custpage_rsc_renegociacao, 
                    arrayParcelas, 
                    parameters.custpage_rsc_reparcelar_em, 
                    parameters.custpage_rsc_data_inicio, 
                    {
                        difDias: parameters.custpage_rsc_dif_dias,
                        proRata: parameters.custpage_rsc_pro_rata_calculado
                    },
                    method,
                    JSON.parse(parameters.custpage_rsc_json_reparcelamento),
                    parameters.custpage_rsc_atualizacao_monetaria
                );
            break;

            case 'Antecipação': 
                dataInicio.defaultValue = parameters.custpage_rsc_data_inicio;
                vencimentoEntrada.defaultValue = parameters.custpage_rsc_vencimento_entrada;             
                vencimentoParcela.defaultValue = parameters.custpage_rsc_vencimento_parcela;
                total_novas_parcelas.defaultValue = parameters.custpage_rsc_total_novas_parcelas;
                novoValor.defaultValue = parameters.custpage_rsc_novo_valor;
                novoVencimento.defaultValue = parameters.custpage_rsc_novo_vencimento;
                difDias.defaultValue = parameters.custpage_rsc_dif_dias;
                pro_rata_calculado.defaultValue = parameters.custpage_rsc_pro_rata_calculado;
                
                jsonTabelaEfetivacao.observacoes = parameters.custpage_rsc_observacoes;
                jsonTabelaEfetivacao.dataInicio = parameters.custpage_rsc_data_inicio;
                jsonTabelaEfetivacao.vencimentoEntrada = parameters.custpage_rsc_vencimento_entrada;
                jsonTabelaEfetivacao.total_novas_parcelas = parameters.custpage_rsc_total_novas_parcelas;
                jsonTabelaEfetivacao.novoVencimento = parameters.custpage_rsc_novo_vencimento;
                jsonTabelaEfetivacao.novoValor = parameters.custpage_rsc_novo_valor;
                jsonTabelaEfetivacao.vencimentoParcela = parameters.custpage_rsc_vencimento_parcela;

                arrayParcelas = JSON.parse(parameters.custpage_rsc_json_renegociacao);

                gerarSublistaAntecipacao(
                    form, 
                    'sublista_resumo_reparcelamento', 
                    parameters.custpage_rsc_renegociacao, 
                    arrayParcelas, 
                    parameters.custpage_rsc_reparcelar_em, 
                    parameters.custpage_rsc_data_inicio, 
                    {
                        difDias: parameters.custpage_rsc_dif_dias,
                        proRata: parameters.custpage_rsc_pro_rata_calculado
                    },
                    method,
                    JSON.parse(parameters.custpage_rsc_json_reparcelamento), 
                    parameters.custpage_rsc_atualizacao_monetaria,
                    // JSON.parse(parameters.custpage_rsc_campanha_desconto)
                );
            break;
        }
        log.audit('jsonTabelaEfetivacao', jsonTabelaEfetivacao);        
        
        var gerarTabelaEfetivacao;
        if (parameters.custpage_rsc_renegociacao == 'Recálculo de atrasos' || parameters.custpage_rsc_renegociacao == 'Antecipação') {
            gerarTabelaEfetivacao = criarTabelaEfetivacaoReparcelamento(jsonTabelaEfetivacao);
        } else {
            gerarTabelaEfetivacao = criarTabelaEfetivacaoReparcelamento(jsonTabelaEfetivacao);
        }

        if (gerarTabelaEfetivacao.status == 'Sucesso') {
            idTabelaEfetivacaoReparcelamento.defaultValue = gerarTabelaEfetivacao.idTabelaEfetivacao;
            
            tabelaEfetivacao.defaultValue = gerarTabelaEfetivacao.urlTabelaEfetivacao;
            tabelaEfetivacao.linkText = 'Tabela de Efetivação Nº: '+gerarTabelaEfetivacao.idTabelaEfetivacao;

            form.addButton({
                id: custPage+'checar_status',
                label: 'Checar Status',
                functionName: 'checarStatus'
            });
        }
    } 
    
    form.addButton({
        id: custPage+'voltar',
        label: 'Voltar',
        functionName: 'voltar'
    });

    return form;
}

const gerarSublistaAmortizacao = (form, id, nome, arrayParcelas, numeroParcelas, primeiroVencimento, calculoPR, method, idFI) => {
    log.audit('gerarSublistaAmortizacao', {
        form: form, 
        id: id, 
        nome: nome, 
        arrayParcelas: arrayParcelas, 
        numeroParcelas: numeroParcelas, 
        primeiroVencimento: primeiroVencimento, 
        calculoPR: calculoPR,
        method: method,
        idFI: idFI
    });

    // Sublista Resumo do Reparcelamento
    var sublista = form.addSublist({
        id: custPage+id,
        type: serverWidget.SublistType.LIST,
        label: nome
    });

    var id_financiamento_invoice = sublista.addField({
        id: custPage+'id_financiamento_invoice',
        type: serverWidget.FieldType.TEXT,
        label: 'ID Financiamento Invoice'
    });

    id_financiamento_invoice.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var link = sublista.addField({
        id: custPage+'link',
        type: serverWidget.FieldType.URL,
        label: 'Link'
    });

    link.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });

    link.linkText = 'Visualizar';

    var ver = sublista.addField({
        id: custPage+'ver',
        type: serverWidget.FieldType.TEXT,
        label: 'Ver'
    });

    ver.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });

    var parcela = sublista.addField({
        id: custPage+'parcela',
        type: serverWidget.FieldType.DATE,
        label: 'Vencimento'
    });

    parcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var tipoParcela = sublista.addField({
        id: custPage+'tipo_parcela',
        type: serverWidget.FieldType.SELECT,
        label: 'Tipo Parcela',
        source: 'customrecord_rsc_tipo_parcela'
    });

    var indice = sublista.addField({
        id: custPage+'indice', 
        type: serverWidget.FieldType.SELECT,
        label: 'Índice',
        source: 'customrecord_rsc_correction_unit'
    });

    var valorAmortizar = sublista.addField({
        id: custPage+'valor_amortizar', 
        type: serverWidget.FieldType.CURRENCY,
        label: 'Valor Amortizar'
    });
    
    valorAmortizar.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var dataJuros = sublista.addField({
        id: custPage+'data_juros', 
        type: serverWidget.FieldType.DATE,
        label: 'Data Juros'
    });

    dataJuros.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var valorPrincipal = sublista.addField({
        id: custPage+'valor_principal',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Valor Principal'
    });

    valorPrincipal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    // var desconto = sublista.addField({
    //     id: custPage+'desconto',
    //     type: serverWidget.FieldType.CURRENCY,
    //     label: 'Desconto'
    // });

    // desconto.updateDisplayType({
    //     displayType: serverWidget.FieldDisplayType.ENTRY
    // });

    var proRata = sublista.addField({
        id: custPage+'pro_rata',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Pro Rata'
    });

    proRata.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var total = sublista.addField({
        id: custPage+'total',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total'
    });

    total.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    }); 

    if (method == 'GET') {        
        var ZERO = Number('0').toFixed(2);

        for (i=0; i<arrayParcelas.length; i++) {
            sublista.setSublistValue({
                id: id_financiamento_invoice.id,
                line: i,
                value: arrayParcelas[i].id_financiamento_invoice
            });      
    
            sublista.setSublistValue({
                id: link.id,
                line: i,
                value: urlTransacao({registro: 'invoice', id: arrayParcelas[i].id_financiamento_invoice})
            });
    
            sublista.setSublistValue({
                id: ver.id,
                line: i,
                value: arrayParcelas[i].ver
            });
    
            sublista.setSublistValue({
                id: parcela.id,
                line: i,
                value: primeiroVencimento
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: i,
                value: 17 // Renegociação
            });
    
            if (arrayParcelas[i].indice) {
                sublista.setSublistValue({
                    id: indice.id,
                    line: i,
                    value: arrayParcelas[i].indice
                });
            }
    
            sublista.setSublistValue({
                id: valorAmortizar.id,
                line: i,
                value: ZERO
            });
            
            sublista.setSublistValue({
                id: valorPrincipal.id,
                line: i,
                value: ZERO
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: i,
            //     value: ZERO
            // });
    
            sublista.setSublistValue({
                id: proRata.id,
                line: i,
                value: calculoPR.proRata
            });
            
            sublista.setSublistValue({
                id: total.id,
                line: i,
                value: ZERO
            });
        }
    } else {
        parcela.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        tipoParcela.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        indice.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        valorAmortizar.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        // desconto.updateDisplayType({
        //     displayType: serverWidget.FieldDisplayType.INLINE
        // });

        proRata.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        total.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        for (i=0; i<arrayParcelas.length; i++) {
            sublista.setSublistValue({
                id: id_financiamento_invoice.id,
                line: i,
                value: idFI
            });
                

            sublista.setSublistValue({
                id: link.id,
                line: i,
                value: urlTransacao({registro: 'invoice', id: idFI})
            });
    
            sublista.setSublistValue({
                id: ver.id,
                line: i,
                value: arrayParcelas[i].ver
            });
    
            sublista.setSublistValue({
                id: parcela.id,
                line: i,
                value: arrayParcelas[i].parcela.text
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: i,
                // value: 11
                value: arrayParcelas[i].tipoParcela
            });
    
            if (arrayParcelas[i].indice) {
                sublista.setSublistValue({
                    id: indice.id,
                    line: i,
                    value: arrayParcelas[i].indice
                });
            }
    
            sublista.setSublistValue({
                id: valorAmortizar.id,
                line: i,
                value: arrayParcelas[i].valorAmortizar ? Number(arrayParcelas[i].valorAmortizar).toFixed(2) : Number('0').toFixed(2)
            });
            
            sublista.setSublistValue({
                id: valorPrincipal.id,
                line: i,
                value: arrayParcelas[i].valor ? Number(arrayParcelas[i].valor) : Number(arrayParcelas[i].valorPrincipal)
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: i,
            //     value: Number(arrayParcelas[i].valorAmortizar - arrayParcelas[i].total).toFixed(2)
            //     // value: Number(arrayParcelas[i].desconto)
            // });
    
            sublista.setSublistValue({
                id: proRata.id,
                line: i,
                value: calculoPR.proRata
            });
            
            sublista.setSublistValue({
                id: total.id,
                line: i,
                value: arrayParcelas[i].valorAtualizado ? Number(arrayParcelas[i].valorAtualizado).toFixed(2) : Number(arrayParcelas[i].total).toFixed(2)
            });
        }
    }    
}

const gerarSublistaInadimplentes = (form, id, nome, arrayParcelas, numeroParcelas, primeiroVencimento, vencimentoEntrada, calculoPR, method, installmentsSelected) => {
    log.audit('gerarSublistaInadimplentes', {
        form: form, 
        id: id, 
        nome: nome, 
        arrayParcelas: arrayParcelas, 
        numeroParcelas: numeroParcelas, 
        primeiroVencimento: primeiroVencimento, 
        vencimentoEntrada: vencimentoEntrada,
        calculoPR: calculoPR,
        method: method,
        installmentsSelected: installmentsSelected
    });

    // Sublita Lista de Parcelas
    sublista = form.addSublist({
        id: custPage+id,
        type: serverWidget.SublistType.LIST,
        label: nome 
    });

    var id_financiamento_invoice = sublista.addField({
        id: custPage+'id_financiamento_invoice',
        type: serverWidget.FieldType.TEXT,
        label: 'ID Financiamento Invoice'
    });

    id_financiamento_invoice.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var link = sublista.addField({
        id: custPage+'link',
        type: serverWidget.FieldType.TEXT,
        label: 'Link'
    });

    link.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var ver = sublista.addField({
        id: custPage+'ver',
        type: serverWidget.FieldType.TEXT,
        label: 'Ver'
    });

    ver.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var ano = sublista.addField({
        id: custPage+'ano',
        type: serverWidget.FieldType.TEXT,
        label: 'Ano'
    });

    ano.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var parcela = sublista.addField({
        id: custPage+'parcela',
        type: serverWidget.FieldType.DATE,
        label: 'Vencimento'
    });

    parcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var reparcelamentoOrigem = sublista.addField({
        id: custPage+'reparcelamento_origem',
        type: serverWidget.FieldType.INTEGER,
        label: 'Reparcelamento Origem'
    });

    reparcelamentoOrigem.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var reparcelamentoDestino = sublista.addField({
        id: custPage+'reparcelamento_destino',
        type: serverWidget.FieldType.INTEGER,
        label: 'Reparcelamento Destino'
    });

    reparcelamentoDestino.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var tipoParcela = sublista.addField({
        id: custPage+'tipo_parcela',
        type: serverWidget.FieldType.SELECT,
        label: 'Tipo Parcela',
        source: 'customrecord_rsc_tipo_parcela'
    });

    tipoParcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var indice = sublista.addField({
        id: custPage+'indice', 
        type: serverWidget.FieldType.SELECT,
        label: 'Índice',
        source: 'customrecord_rsc_correction_unit'
    });

    var dataJuros = sublista.addField({
        id: custPage+'data_juros', 
        type: serverWidget.FieldType.DATE,
        label: 'Data Juros'
    });

    dataJuros.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var valorOriginal = sublista.addField({
        id: custPage+'valor_original',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Valor'
    });

    valorOriginal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var multa = sublista.addField({
        id: custPage+'multa',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Multa'
    });

    multa.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var juros = sublista.addField({
        id: custPage+'juros',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Juros'
    });

    juros.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var proRata = sublista.addField({
        id: custPage+'pro_rata',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Pro Rata'
    });

    proRata.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    // var desconto = sublista.addField({
    //     id: custPage+'desconto',
    //     type: serverWidget.FieldType.CURRENCY,
    //     label: 'Desconto'
    // });

    // desconto.updateDisplayType({
    //     displayType: serverWidget.FieldDisplayType.ENTRY
    // });

    var valorAtualizado = sublista.addField({
        id: custPage+'valor_atualizado',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total'
    });

    valorAtualizado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    if (method == 'GET') {
        var newInstallments = calculoPR.arrayParcelas;
        log.audit(method, newInstallments);

        var ZERO = Number('0').toFixed(2);

        var novoVencimento;

        if (numeroParcelas == 0) {
            sublista.setSublistValue({
                id: parcela.id, // Vencimento Entrada
                line: 0,
                value: vencimentoEntrada
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: 0,
                // value: 1
                value: 17 // Renegociação
            });
    
            if (primeiroVencimento) {
                var split_primeiroVencimento = primeiroVencimento.split('/');        
                novoVencimento = new Date(split_primeiroVencimento[2], split_primeiroVencimento[1]-1, split_primeiroVencimento[0]);    
                
                novoVencimento.setMonth(novoVencimento.getMonth()+0)
    
                sublista.setSublistValue({
                    id: parcela.id, // Primeiro Vencimento
                    line: 0,
                    value: stringData(novoVencimento, numeroParcelas)
                });
    
                sublista.setSublistValue({
                    id: dataJuros.id, // Primeiro Vencimento
                    line: 0,
                    value: stringData(novoVencimento, numeroParcelas)
                });
            } else {
                var split_vencimentoEntrada = vencimentoEntrada.split('/'); 
                novoVencimento = new Date(split_vencimentoEntrada[2], split_vencimentoEntrada[1]-1, split_vencimentoEntrada[0]);
                // Data Juros: d+1
                novoVencimento.setDate(novoVencimento.getDate()+1);

                sublista.setSublistValue({
                    id: dataJuros.id, // Vencimento Entrada
                    line: 0,
                    value: stringData(novoVencimento, numeroParcelas)
                });
            }
    
            if (arrayParcelas.indice) {
                sublista.setSublistValue({
                    id: indice.id,
                    line: 0,
                    value: arrayParcelas.indice
                });
            }            
    
            sublista.setSublistValue({
                id: valorOriginal.id,
                line: 0,
                value: ZERO
            });
    
            sublista.setSublistValue({
                id: multa.id,
                line: 0,
                value: ZERO
            });
    
            sublista.setSublistValue({
                id: juros.id,
                line: 0,
                value: ZERO
            });

            sublista.setSublistValue({
                id: proRata.id,
                line: 0,
                value: ZERO
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: 0,
            //     value: ZERO
            // });
    
            sublista.setSublistValue({
                id: valorAtualizado.id,
                line: 0,
                value: ZERO
            });    
            
        } else {
            for (i=0; i<numeroParcelas+1; i++) {
                if (i == 0) {
                    sublista.setSublistValue({
                        id: parcela.id, // Vencimento Entrada
                        line: i,
                        value: vencimentoEntrada
                    });
    
                    sublista.setSublistValue({
                        id: tipoParcela.id,
                        line: i,
                        // value: 1
                        value: 17 // Renegociação
                    });
                } else if (i == 1) {
                    log.audit(i, newInstallments);
                    sublista.setSublistValue({
                        id: parcela.id, // Primeiro Vencimento
                        line: i,
                        value: primeiroVencimento
                    });               
                    
                    sublista.setSublistValue({
                        id: tipoParcela.id,
                        line: i,
                        // value: 4
                        value: 17 // Renegociação
                    });
                } else {
                    let tipo = arrayParcelas.tipoParcela;
    
                    if (primeiroVencimento) {
                        var split_primeiroVencimento = primeiroVencimento.split('/');        
                        var novoVencimento = new Date(split_primeiroVencimento[2], split_primeiroVencimento[1] - 1, split_primeiroVencimento[0]);    
    
                        let date = vencimentosMensais({
                            'novoVencimento': novoVencimento,
                            'meses': i-1,
                            'anterior': i-2
                        });
                        
                        novoVencimento.setMonth(novoVencimento.getMonth()+i);
    
                        sublista.setSublistValue({
                            id: parcela.id, // Primeiro Vencimento
                            line: i,
                            value: date
                        });
                    } else {
                        sublista.setSublistValue({
                            id: parcela.id, // Primeiro Vencimento
                            line: i,
                            value: vencimentoEntrada
                        });
                    }
                    
                    sublista.setSublistValue({
                        id: tipoParcela.id,
                        line: i,
                        // value: 4
                        value: 17 // Renegociação
                    });
                }
    
                if (arrayParcelas.indice) {
                    sublista.setSublistValue({
                        id: indice.id,
                        line: i,
                        value: arrayParcelas.indice
                    });
                } 
                
                sublista.setSublistValue({
                    id: valorOriginal.id,
                    line: i,
                    value: ZERO
                });

                var split_vencimentoEntrada = vencimentoEntrada.split('/'); 
                novoVencimento = new Date(split_vencimentoEntrada[2], split_vencimentoEntrada[1]-1, split_vencimentoEntrada[0]);
                // Data Juros: d+1
                novoVencimento.setDate(novoVencimento.getDate()+1);

                var dia = novoVencimento.getDate() <= 9 ? '0'+novoVencimento.getDate() : novoVencimento.getDate();
                var mes = novoVencimento.getMonth()+1 <= 9 ? '0'+(novoVencimento.getMonth()+1) : novoVencimento.getMonth()+1;
                var ano = novoVencimento.getFullYear();

                var stringVE = String(dia+'/'+mes+'/'+ano);
    
                sublista.setSublistValue({
                    id: dataJuros.id,
                    line: i,
                    value: stringVE
                    // value: vencimentoEntrada
                });
    
                sublista.setSublistValue({
                    id: multa.id,
                    line: i,
                    value: ZERO
                });
    
                sublista.setSublistValue({
                    id: juros.id,
                    line: i,
                    value: ZERO
                });

                sublista.setSublistValue({
                    id: proRata.id,
                    line: i,
                    value: ZERO
                });

                // sublista.setSublistValue({
                //     id: desconto.id,
                //     line: i,
                //     value: ZERO
                // });
    
                sublista.setSublistValue({
                    id: valorAtualizado.id,
                    line: i,
                    value: ZERO
                });
            }
        }
    } else {
        parcela.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        tipoParcela.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        indice.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        dataJuros.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        valorOriginal.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        multa.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        juros.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        proRata.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        // desconto.updateDisplayType({
        //     displayType: serverWidget.FieldDisplayType.INLINE
        // });

        valorAtualizado.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        for (i=0; i<arrayParcelas.length; i++) {
            sublista.setSublistValue({
                id: parcela.id,
                line: i,
                value: arrayParcelas[i].parcela.text
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: i,
                value: arrayParcelas[i].tipoParcela
            });

            sublista.setSublistValue({
                id: indice.id,
                line: i,
                value: arrayParcelas[i].indice
            });

            if (arrayParcelas[i].dataJuros.text) {
                sublista.setSublistValue({
                    id: dataJuros.id,
                    line: i,
                    value: arrayParcelas[i].dataJuros.text
                }); 
            }             

            sublista.setSublistValue({
                id: valorOriginal.id,
                line: i,
                value: Number(arrayParcelas[i].valor).toFixed(2)
            });

            sublista.setSublistValue({
                id: multa.id,
                line: i,
                value: Number(arrayParcelas[i].multa).toFixed(2)
            });

            sublista.setSublistValue({
                id: juros.id,
                line: i,
                value: Number(arrayParcelas[i].juros).toFixed(2)
            });

            sublista.setSublistValue({
                id: proRata.id,
                line: i,
                value: Number(arrayParcelas[i].proRata).toFixed(2)
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: i,
            //     value: Number(arrayParcelas[i].valor - (arrayParcelas[i].valorAtualizado - arrayParcelas[i].proRata - arrayParcelas[i].juros - arrayParcelas[i].multa)).toFixed(2)
            // });

            sublista.setSublistValue({
                id: valorAtualizado.id,
                line: i,
                value: Number(arrayParcelas[i].valorAtualizado).toFixed(2)
            });
        }
    }
}

const gerarSublistaAdimplentes = (form, id, nome, arrayParcelas, numeroParcelas, primeiroVencimento, vencimentoEntrada, calculoPR, method, installmentsSelected) => {
    log.audit('gerarSublistaAdimplentes', {
        form: form, 
        id: id, 
        nome: nome, 
        arrayParcelas: arrayParcelas, 
        numeroParcelas: numeroParcelas, 
        primeiroVencimento: primeiroVencimento, 
        vencimentoEntrada: vencimentoEntrada,
        calculoPR: calculoPR,
        method: method, 
        installmentsSelected: installmentsSelected
    });

    // Sublita Lista de Parcelas
    var sublista = form.addSublist({
        id: custPage+id,
        type: serverWidget.SublistType.LIST,
        label: nome 
    });

    var id_financiamento_invoice = sublista.addField({
        id: custPage+'id_financiamento_invoice',
        type: serverWidget.FieldType.TEXT,
        label: 'ID Financiamento Invoice'
    });

    id_financiamento_invoice.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var link = sublista.addField({
        id: custPage+'link',
        type: serverWidget.FieldType.TEXT,
        label: 'Link'
    });

    link.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var ver = sublista.addField({
        id: custPage+'ver',
        type: serverWidget.FieldType.TEXT,
        label: 'Ver'
    });

    ver.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var ano = sublista.addField({
        id: custPage+'ano',
        type: serverWidget.FieldType.TEXT,
        label: 'Ano'
    });

    ano.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var parcela = sublista.addField({
        id: custPage+'parcela',
        type: serverWidget.FieldType.DATE,
        label: 'Vencimento'
    });

    parcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var reparcelamentoOrigem = sublista.addField({
        id: custPage+'reparcelamento_origem',
        type: serverWidget.FieldType.INTEGER,
        label: 'Reparcelamento Origem'
    });

    reparcelamentoOrigem.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var reparcelamentoDestino = sublista.addField({
        id: custPage+'reparcelamento_destino',
        type: serverWidget.FieldType.INTEGER,
        label: 'Reparcelamento Destino'
    });

    reparcelamentoDestino.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var tipoParcela = sublista.addField({
        id: custPage+'tipo_parcela',
        type: serverWidget.FieldType.SELECT,
        label: 'Tipo Parcela',
        source: 'customrecord_rsc_tipo_parcela'
    });

    tipoParcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var indice = sublista.addField({
        id: custPage+'indice', 
        type: serverWidget.FieldType.SELECT,
        label: 'Índice',
        source: 'customrecord_rsc_correction_unit'
    });

    var dataJuros = sublista.addField({
        id: custPage+'data_juros', 
        type: serverWidget.FieldType.DATE,
        label: 'Data Juros'
    });

    dataJuros.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var valorOriginal = sublista.addField({
        id: custPage+'valor_original',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Valor'
    });

    valorOriginal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    var proRata = sublista.addField({
        id: custPage+'pro_rata',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Pro Rata'
    });

    proRata.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    // var desconto = sublista.addField({
    //     id: custPage+'desconto',
    //     type: serverWidget.FieldType.CURRENCY,
    //     label: 'Desconto'
    // });

    // desconto.updateDisplayType({
    //     displayType: serverWidget.FieldDisplayType.ENTRY
    // });

    var valorAtualizado = sublista.addField({
        id: custPage+'valor_atualizado',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total'
    });

    valorAtualizado.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.ENTRY
    });

    if (method == 'GET') {
        var ZERO = Number('0').toFixed(2);

        var novoVencimento;

        if (numeroParcelas == 0) {
            sublista.setSublistValue({
                id: parcela.id, // Vencimento Entrada
                line: 0,
                value: vencimentoEntrada
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: 0,
                // value: 1
                value: 17 // Renegociação
            });
    
            if (primeiroVencimento) {
                var split_primeiroVencimento = primeiroVencimento.split('/');        
                novoVencimento = new Date(split_primeiroVencimento[2], split_primeiroVencimento[1]-1, split_primeiroVencimento[0]);    
                
                novoVencimento.setMonth(novoVencimento.getMonth()+0);
    
                sublista.setSublistValue({
                    id: parcela.id, // Primeiro Vencimento
                    line: 0,
                    value: stringData(novoVencimento, numeroParcelas)
                });
    
                sublista.setSublistValue({
                    id: dataJuros.id, // Primeiro Vencimento
                    line: 0,
                    value: stringData(novoVencimento, numeroParcelas)
                });
            } else {
                var split_vencimentoEntrada = vencimentoEntrada.split('/'); 
                novoVencimento = new Date(split_vencimentoEntrada[2], split_vencimentoEntrada[1]-1, split_vencimentoEntrada[0]);
                // Data Juros: d+1
                novoVencimento.setDate(novoVencimento.getDate()+1);

                sublista.setSublistValue({
                    id: dataJuros.id, // Vencimento Entrada
                    line: 0,
                    value: stringData(novoVencimento, numeroParcelas)
                });
            }
    
            if (arrayParcelas.indice) {
                sublista.setSublistValue({
                    id: indice.id,
                    line: 0,
                    value: arrayParcelas.indice
                });
            }            
    
            sublista.setSublistValue({
                id: valorOriginal.id,
                line: 0,
                value: ZERO
            });

            sublista.setSublistValue({
                id: proRata.id,
                line: 0,
                value: ZERO
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: 0,
            //     value: ZERO
            // });
    
            sublista.setSublistValue({
                id: valorAtualizado.id,
                line: 0,
                value: ZERO
            });
        } else {
            for (i=0; i<numeroParcelas+1; i++) {
                if (i == 0) {
                    sublista.setSublistValue({
                        id: parcela.id, // Vencimento Entrada
                        line: i,
                        value: vencimentoEntrada
                    });
    
                    sublista.setSublistValue({
                        id: tipoParcela.id,
                        line: i,
                        // value: 1
                        value: 17 // Renegociação
                    });
                } else if (i == 1) {
                    sublista.setSublistValue({
                        id: parcela.id, // Primeiro Vencimento
                        line: i,
                        value: primeiroVencimento
                    });
                    
                    sublista.setSublistValue({
                        id: tipoParcela.id,
                        line: i,
                        // value: 4
                        value: 17 // Renegociação
                    });
                } else {
                    let tipo = arrayParcelas.tipoParcela;
    
                    if (primeiroVencimento) {
                        var split_primeiroVencimento = primeiroVencimento.split('/');        
                        var novoVencimento = new Date(split_primeiroVencimento[2], split_primeiroVencimento[1] - 1, split_primeiroVencimento[0]);
    
                        let date = vencimentosMensais({
                            'novoVencimento': novoVencimento,
                            'meses': i-1,
                            'anterior': i-2
                        });
                        
                        novoVencimento.setMonth(novoVencimento.getMonth()+i);
    
                        sublista.setSublistValue({
                            id: parcela.id, // Primeiro Vencimento
                            line: i,
                            value: date
                        });
                    } else {
                        sublista.setSublistValue({
                            id: parcela.id, // Primeiro Vencimento
                            line: i,
                            value: vencimentoEntrada
                        });
                    }
                    
                    sublista.setSublistValue({
                        id: tipoParcela.id,
                        line: i,
                        // value: 4
                        value: 17 // Renegociação
                    });
                }
    
                if (arrayParcelas.indice) {
                    sublista.setSublistValue({
                        id: indice.id,
                        line: i,
                        value: arrayParcelas.indice
                    });
                } 
                
                sublista.setSublistValue({
                    id: valorOriginal.id,
                    line: i,
                    value: ZERO
                });

                var split_vencimentoEntrada = vencimentoEntrada.split('/'); 
                novoVencimento = new Date(split_vencimentoEntrada[2], split_vencimentoEntrada[1]-1, split_vencimentoEntrada[0]);
                // Data Juros: d+1
                novoVencimento.setDate(novoVencimento.getDate()+1);

                var dia = novoVencimento.getDate() <= 9 ? '0'+novoVencimento.getDate() : novoVencimento.getDate();
                var mes = novoVencimento.getMonth()+1 <= 9 ? '0'+(novoVencimento.getMonth()+1) : novoVencimento.getMonth()+1;
                var ano = novoVencimento.getFullYear();

                var stringVE = String(dia+'/'+mes+'/'+ano);
    
                sublista.setSublistValue({
                    id: dataJuros.id,
                    line: i,
                    value: stringVE
                    // value: vencimentoEntrada
                });

                sublista.setSublistValue({
                    id: proRata.id,
                    line: i,
                    value: ZERO
                });
    
                // sublista.setSublistValue({
                //     id: desconto.id,
                //     line: i,
                //     value: ZERO
                // });
    
                sublista.setSublistValue({
                    id: valorAtualizado.id,
                    line: i,
                    value: ZERO
                });
            }
        }
    } else {
        parcela.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        tipoParcela.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        indice.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        dataJuros.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        valorOriginal.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        proRata.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        // desconto.updateDisplayType({
        //     displayType: serverWidget.FieldDisplayType.INLINE
        // });

        valorAtualizado.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        for (i=0; i<arrayParcelas.length; i++) {
            sublista.setSublistValue({
                id: parcela.id,
                line: i,
                value: arrayParcelas[i].parcela.text
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: i,
                value: arrayParcelas[i].tipoParcela
            });

            sublista.setSublistValue({
                id: indice.id,
                line: i,
                value: arrayParcelas[i].indice
            });
            
            if (arrayParcelas[i].dataJuros.text) {
                sublista.setSublistValue({
                    id: dataJuros.id,
                    line: i,
                    value: arrayParcelas[i].dataJuros.text
                }); 
            }                       

            sublista.setSublistValue({
                id: valorOriginal.id,
                line: i,
                value: Number(arrayParcelas[i].valor).toFixed(2)
            });

            sublista.setSublistValue({
                id: proRata.id,
                line: i,
                value: Number(arrayParcelas[i].proRata).toFixed(2)
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: i,
            //     value: Number(arrayParcelas[i].valor - (arrayParcelas[i].valorAtualizado - arrayParcelas[i].proRata)).toFixed(2)
            // });

            sublista.setSublistValue({
                id: valorAtualizado.id,
                line: i,
                value: Number(arrayParcelas[i].valorAtualizado).toFixed(2)
            });
        }
    }
}

// const gerarSublistaAntecipacao = (form, id, nome, arrayParcelas, numeroParcelas, primeiroVencimento, calculoPR, method, installmentsSelected, AM, campanhaDesconto) => {
const gerarSublistaAntecipacao = (form, id, nome, arrayParcelas, numeroParcelas, primeiroVencimento, calculoPR, method, installmentsSelected, AM) => {
    log.audit('gerarSublistaAntecipacao', {
        form: form, 
        id: id, 
        nome: nome, 
        arrayParcelas: arrayParcelas, 
        numeroParcelas: numeroParcelas, 
        primeiroVencimento: primeiroVencimento, 
        calculoPR: calculoPR,
        method: method, 
        installmentsSelected: installmentsSelected,
        AM: AM
        // ,
        // campanhaDesconto: campanhaDesconto
    });

    // Sublista Resumo do Reparcelamento
    var sublista;sublista = form.addSublist({
        id: custPage+id,
        type: serverWidget.SublistType.LIST,
        label: nome
    });

    var id_financiamento_invoice = sublista.addField({
        id: custPage+'id_financiamento_invoice',
        type: serverWidget.FieldType.TEXT,
        label: 'ID Financiamento Invoice'
    });

    id_financiamento_invoice.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var link = sublista.addField({
        id: custPage+'link',
        type: serverWidget.FieldType.URL,
        label: 'Link'
    });

    link.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });

    link.linkText = 'Visualizar';

    var ver = sublista.addField({
        id: custPage+'ver',
        type: serverWidget.FieldType.TEXT,
        label: 'Ver'
    });

    ver.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });

    var parcela = sublista.addField({
        id: custPage+'parcela',
        type: serverWidget.FieldType.DATE,
        label: 'Vencimento'
    });

    var tipoParcela = sublista.addField({
        id: custPage+'tipo_parcela',
        type: serverWidget.FieldType.SELECT,
        label: 'Tipo Parcela',
        source: 'customrecord_rsc_tipo_parcela'
    });

    tipoParcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });    

    var indice = sublista.addField({
        id: custPage+'indice', 
        type: serverWidget.FieldType.SELECT,
        label: 'Índice',
        source: 'customrecord_rsc_correction_unit'
    });

    indice.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });     

    var dataJuros = sublista.addField({
        id: custPage+'data_juros', 
        type: serverWidget.FieldType.DATE,
        label: 'Data Juros'
    });

    dataJuros.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var valorPrincipal = sublista.addField({
        id: custPage+'valor_principal',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Valor Principal'
    });

    valorPrincipal.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var proRata = sublista.addField({
        id: custPage+'pro_rata',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Pro Rata'
    });

    // var desconto = sublista.addField({
    //     id: custPage+'desconto',
    //     type: serverWidget.FieldType.CURRENCY,
    //     label: 'Desconto'
    // });

    var total = sublista.addField({
        id: custPage+'total',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total'
    });
    
    // Desabilitando campos para edição.
    parcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    tipoParcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    indice.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    proRata.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    // desconto.updateDisplayType({
    //     displayType: serverWidget.FieldDisplayType.INLINE
    // });

    total.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var splitAM = AM / arrayParcelas.length;

    if (method == 'GET') {
        var ZERO = Number('0').toFixed(2);
        
        for (i=0; i<arrayParcelas.length; i++) {
            sublista.setSublistValue({
                id: id_financiamento_invoice.id,
                line: i,
                value: arrayParcelas[i].id_financiamento_invoice
            });
    
            sublista.setSublistValue({
                id: link.id,
                line: i,
                value: urlTransacao({registro: 'invoice', id: arrayParcelas[i].id_financiamento_invoice})
            });
    
            sublista.setSublistValue({
                id: ver.id,
                line: i,
                value: arrayParcelas[i].ver
            });
    
            sublista.setSublistValue({
                id: parcela.id,
                line: i,
                value: primeiroVencimento
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: i,
                value: 11
            });
    
            if (arrayParcelas[i].indice) {
                sublista.setSublistValue({
                    id: indice.id,
                    line: i,
                    value: arrayParcelas[i].indice
                });
            }
            
            sublista.setSublistValue({
                id: valorPrincipal.id,
                line: i,
                value: parseFloat(arrayParcelas[i].valor) + parseFloat(installmentsSelected)
            });
    
            sublista.setSublistValue({
                id: proRata.id,
                line: i,
                value: arrayParcelas[i].calculoPR.proRata
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: i,
            //     value: campanhaDesconto.desconto
            // });
            
            sublista.setSublistValue({
                id: total.id,
                line: i,
                value: parseFloat(arrayParcelas[i].valorAtualizado) + parseFloat(installmentsSelected) + parseFloat(splitAM)
                // value: parseFloat(arrayParcelas[i].valorAtualizado) + parseFloat(installmentsSelected) - parseFloat(campanhaDesconto.desconto)
            });
        }
    } else {
        for (i=0; i<arrayParcelas.length; i++) {
            sublista.setSublistValue({
                id: id_financiamento_invoice.id,
                line: i,
                value: installmentsSelected[i].id_financiamento_invoice
            });
    
            sublista.setSublistValue({
                id: link.id,
                line: i,
                value: urlTransacao({registro: 'invoice', id: installmentsSelected[i].id_financiamento_invoice})
            });
    
            sublista.setSublistValue({
                id: ver.id,
                line: i,
                value: arrayParcelas[i].ver
            });
    
            sublista.setSublistValue({
                id: parcela.id,
                line: i,
                value: arrayParcelas[i].parcela.text
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: i,
                value: 11
            });
    
            if (arrayParcelas[i].indice) {
                sublista.setSublistValue({
                    id: indice.id,
                    line: i,
                    value: arrayParcelas[i].indice
                });
            }
            
            sublista.setSublistValue({
                id: valorPrincipal.id,
                line: i,
                value: Number(arrayParcelas[i].valorPrincipal)
            });
    
            sublista.setSublistValue({
                id: proRata.id,
                line: i,
                value: arrayParcelas[i].proRata
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: i,
            //     value: campanhaDesconto.desconto
            // });
            
            sublista.setSublistValue({
                id: total.id,
                line: i,
                value: Number(arrayParcelas[i].total + splitAM).toFixed(2)
            });
        }
    }
}

const gerarSublistaRecalculoAtrasos = (form, id, nome, arrayParcelas, numeroParcelas, primeiroVencimento, calculoPR, method, installmentsSelected, AM) => {
    log.audit('gerarSublistaRecalculoAtrasos', {
        form: form, 
        id: id, 
        nome: nome, 
        arrayParcelas: arrayParcelas, 
        numeroParcelas: numeroParcelas, 
        primeiroVencimento: primeiroVencimento, 
        calculoPR: calculoPR,
        installmentsSelected: installmentsSelected,
        AM: AM
    });

    // Sublista Resumo do Reparcelamento
    var sublista = form.addSublist({
        id: custPage+id,
        type: serverWidget.SublistType.LIST,
        label: nome
    });

    var id_financiamento_invoice = sublista.addField({
        id: custPage+'id_financiamento_invoice',
        type: serverWidget.FieldType.TEXT,
        label: 'ID Financiamento Invoice'
    });

    id_financiamento_invoice.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var link = sublista.addField({
        id: custPage+'link',
        type: serverWidget.FieldType.URL,
        label: 'Link'
    });

    link.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });

    link.linkText = 'Visualizar';

    var ver = sublista.addField({
        id: custPage+'ver',
        type: serverWidget.FieldType.TEXT,
        label: 'Ver'
    });

    ver.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED
    });

    var parcela = sublista.addField({
        id: custPage+'parcela',
        type: serverWidget.FieldType.DATE,
        label: 'Vencimento'
    });

    var tipoParcela = sublista.addField({
        id: custPage+'tipo_parcela',
        type: serverWidget.FieldType.SELECT,
        label: 'Tipo Parcela',
        source: 'customrecord_rsc_tipo_parcela'
    });

    tipoParcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var indice = sublista.addField({
        id: custPage+'indice', 
        type: serverWidget.FieldType.SELECT,
        label: 'Índice',
        source: 'customrecord_rsc_correction_unit'
    });

    indice.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var dataJuros = sublista.addField({
        id: custPage+'data_juros', 
        type: serverWidget.FieldType.DATE,
        label: 'Data Juros'
    });

    dataJuros.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    var valorPrincipal = sublista.addField({
        id: custPage+'valor_principal',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Valor Principal'
    });

    var multa = sublista.addField({
        id: custPage+'multa',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Multa'
    });

    var juros = sublista.addField({
        id: custPage+'juros',
        type: serverWidget.FieldType.FLOAT,
        label: 'Juros'
    });

    var proRata = sublista.addField({
        id: custPage+'pro_rata',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Pro Rata'
    });

    // var desconto = sublista.addField({
    //     id: custPage+'desconto',
    //     type: serverWidget.FieldType.CURRENCY,
    //     label: 'Desconto'
    // });

    var total = sublista.addField({
        id: custPage+'total',
        type: serverWidget.FieldType.CURRENCY,
        label: 'Total'
    });

    // Desabilitando campos para edição.
    parcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    tipoParcela.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    indice.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    multa.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    juros.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    proRata.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });
    
    // desconto.updateDisplayType({
    //     displayType: serverWidget.FieldDisplayType.INLINE
    // });

    total.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var splitAM = AM / arrayParcelas.length;

    if (method == 'GET') {
        for (i=0; i<arrayParcelas.length; i++) {
            sublista.setSublistValue({
                id: id_financiamento_invoice.id,
                line: i,
                value: arrayParcelas[i].id_financiamento_invoice
            });
    
            sublista.setSublistValue({
                id: link.id,
                line: i,
                value: urlTransacao({registro: 'invoice', id: arrayParcelas[i].id_financiamento_invoice})
            });
    
            sublista.setSublistValue({
                id: ver.id,
                line: i,
                value: arrayParcelas[i].ver
            });
    
            sublista.setSublistValue({
                id: parcela.id,
                line: i,
                value: primeiroVencimento
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: i,
                value: 11
            });
    
            if (arrayParcelas[i].indice) {
                sublista.setSublistValue({
                    id: indice.id,
                    line: i,
                    value: arrayParcelas[i].indice
                });
            }
            
            sublista.setSublistValue({
                id: valorPrincipal.id,
                line: i,
                value: parseFloat(arrayParcelas[i].valor) + parseFloat(installmentsSelected)
            });

            sublista.setSublistValue({
                id: multa.id,
                line: i,
                value: arrayParcelas[i].multa
            });

            sublista.setSublistValue({
                id: juros.id,
                line: i,
                value: Number(arrayParcelas[i].juros).toFixed(2)
            });
    
            sublista.setSublistValue({
                id: proRata.id,
                line: i,
                value: arrayParcelas[i].calculoPR.proRata
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: i,
            //     value: campanhaDesconto.desconto
            // });
            
            sublista.setSublistValue({
                id: total.id,
                line: i,
                value: parseFloat(arrayParcelas[i].valorAtualizado) + parseFloat(installmentsSelected) + parseFloat(splitAM)
            });
        }
    } else {
        for (i=0; i<arrayParcelas.length; i++) {           
            sublista.setSublistValue({
                id: id_financiamento_invoice.id,
                line: i,
                value: installmentsSelected[i].id_financiamento_invoice
            });
    
            sublista.setSublistValue({
                id: link.id,
                line: i,
                value: urlTransacao({registro: 'invoice', id: installmentsSelected[i].id_financiamento_invoice})
            });
    
            sublista.setSublistValue({
                id: ver.id,
                line: i,
                value: arrayParcelas[i].ver
            });
    
            sublista.setSublistValue({
                id: parcela.id,
                line: i,
                value: arrayParcelas[i].parcela.text
            });
    
            sublista.setSublistValue({
                id: tipoParcela.id,
                line: i,
                value: 11
            });
    
            if (arrayParcelas[i].indice) {
                sublista.setSublistValue({
                    id: indice.id,
                    line: i,
                    value: arrayParcelas[i].indice
                });
            }
            
            sublista.setSublistValue({
                id: valorPrincipal.id,
                line: i,
                value: Number(arrayParcelas[i].valorPrincipal)
            });
           
            sublista.setSublistValue({
                id: multa.id,
                line: i,
                value: installmentsSelected[i].multa
            });                     
            
            sublista.setSublistValue({
                id: juros.id,
                line: i,
                value: Number(installmentsSelected[i].juros).toFixed(2)
            });

  
            sublista.setSublistValue({
                id: proRata.id,
                line: i,
                value: installmentsSelected[i].calculoPR.proRata
            });

            // sublista.setSublistValue({
            //     id: desconto.id,
            //     line: i,
            //     value: campanhaDesconto.desconto
            // });
            
            sublista.setSublistValue({
                id: total.id,
                line: i,
                value: Number(arrayParcelas[i].total + splitAM).toFixed(2)
            });
        }
    }
}

const urlTransacao = (dados) => {
    return url.resolveRecord({
        recordType: dados.registro,
        recordId: dados.id
    });
}

const stringData = (data, numeroParcelas) => {
    var dia = (data.getDate() <= 9) ? '0'+data.getDate() : data.getDate();

    var mes = data.getMonth()-1;

    var ano = data.getFullYear();

    switch (mes) {
        case 0: 
            mes = (numeroParcelas > 0) ? '01' : '02'; 
        break;
        case 1: 
            mes = (numeroParcelas > 0) ? '02' : '03'; 
        break;
        case 2: 
            mes = (numeroParcelas > 0) ? '03' : '04'; 
        break;
        case 3: 
            mes = (numeroParcelas > 0) ? '04' : '05'; 
        break;
        case 4: 
            mes = (numeroParcelas > 0) ? '05' : '06'; 
        break;
        case 5: 
            mes = (numeroParcelas > 0) ? '06' : '07'; 
        break;
        case 6: 
            mes = (numeroParcelas > 0) ? '07' : '08'; 
        break;
        case 7: 
            mes = (numeroParcelas > 0) ? '08' : '09'; 
        break;
        case 8: 
            mes = (numeroParcelas > 0) ? '09' : '10'; 
        break;
        case 9: 
            mes = (numeroParcelas > 0) ? '10' : '11'; 
        break;
        case 10: 
            mes = (numeroParcelas > 0) ? '11' : '12'; 
        break;
        case 11:
            mes = (numeroParcelas > 0) ? '12' : '01'; 
        break; 
        case -1:
            if (numeroParcelas > 0) {
                mes = '12';
                ano = ano-1;
            } else {
                mes = '01';
            }
        break;
    }

    return String(dia+'/'+mes+'/'+ano);
}

const vencimentosMensais = (data) => {
    var date, day, stringDate, splitDate, dia, mes, ano, stringAtual, previousDate, previousDay, string_previousDate, split_previousDate, diaAnterior, mesAnterior, anoAnterior, stringAnterior;

    date = new Date(data.novoVencimento);

    day = data.novoVencimento.getDate();
    date.setMonth(date.getMonth()+data.meses);

    if (date.getMonth() == 2) {
        if (day > 28) {
            day = '28';
            date.setDate(day);
            date.setMonth(1);
        }
    }

    stringDate = date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear();

    splitDate = stringDate.split('/');

    dia = splitDate[0];
    mes = splitDate[1] < 10 ? '0'+splitDate[1] : splitDate[1];
    ano = splitDate[2];

    stringAtual = dia+'/'+mes+'/'+ano;

    // DATA ANTERIOR
    previousDate = new Date(data.novoVencimento);

    previousDay = data.novoVencimento.getDate();
    previousDate.setMonth(previousDate.getMonth()+data.anterior);

    if (previousDate.getMonth() == 2) {
        if (previousDay > 28) {
            previousDay = '28';
            previousDate.setDate(previousDay);
            previousDate.setMonth(1);

        }
    }

    string_previousDate = previousDate.getDate()+'/'+(previousDate.getMonth()+1)+'/'+previousDate.getFullYear();

    split_previousDate = string_previousDate.split('/');

    diaAnterior = split_previousDate[0];
    mesAnterior = split_previousDate[1] < 10 ? '0'+split_previousDate[1] : split_previousDate[1];
    anoAnterior = split_previousDate[2];

    stringAnterior = diaAnterior+'/'+mesAnterior+'/'+anoAnterior;

    if (stringAtual == stringAnterior) {
        if (data.novoVencimento.getDate() == 29 || data.novoVencimento.getDate() == 30 || data.novoVencimento.getDate() == 31) {
            day = String(data.novoVencimento.getDate());
            date.setDate(day);
            date.setMonth(2);
        }

        stringDate = day+'/'+(date.getMonth()+1)+'/'+date.getFullYear();

        splitDate = stringDate.split('/');

        dia = splitDate[0];
        mes = splitDate[1] < 10 ? '0'+splitDate[1] : splitDate[1];
        ano = splitDate[2];

        stringAtual = dia+'/'+mes+'/'+ano;
    }

    return stringAtual;
}

const criarTabelaEfetivacaoReparcelamento = (dados) => {
    log.audit('criarTabelaEfetivacaoReparcelamento', dados);
    const tabelaEfetivacao = record.create({type: 'customrecord_rsc_tab_efetiva_reparcela', isDynamic: true});

    // Dados Gerais
    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_data_renegociacao',
        value: new Date()
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_status_aprovacao',
        value: 1
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_contrato_fatura_principal',
        value: dados.idFaturaPrincipal
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_cliente',
        value: dados.cliente
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_unidade',
        value: dados.unidade
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_total_fatura_principal',
        value: dados.total_fatura_principal
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_empreedimento',
        value: dados.empreendimento
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_observacao_memo',
        value: dados.renegociacao
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_criador_ter',
        value: runtime.getCurrentUser().id
    }); 

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_observacao_memo',
        value: dados.observacoes
    }); 

    if (dados.renegociacao == 'Amortização') {
        tabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_tipo_renegociacao',
            value: 1
        });
    } else if (dados.renegociacao == 'Inadimplentes') {
        tabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_tipo_renegociacao',
            value: 2
        });
    } else if (dados.renegociacao == 'Adimplentes') {
        tabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_tipo_renegociacao',
            value: 3
        });
    } else if (dados.renegociacao == 'Recálculo de atrasos') {
        tabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_data_implantacao_reneg',
            value: new Date()
        });

        tabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_tipo_renegociacao',
            value: 4
        });
    } else {
        tabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_data_implantacao_reneg',
            value: new Date()
        });

        tabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_tipo_renegociacao',
            value: 5 // Antecipação
        });
    }

    if (dados.dataInicio) {
        tabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_primeiro_vencimento',
            value: formatData(dados.dataInicio)
        }); 
    }

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_total_novas_parcelas',
        value: dados.total_novas_parcelas
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_novo_valor',
        value: dados.novoValor
    });

    if (dados.novoVencimento) {
        tabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_novo_vencimento',
            value: formatData(dados.novoVencimento)
        });
    }   

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_dados_renegociacao',
        value: JSON.stringify(dados)
    });

    // Sublista Parcelas
    var dadosRenegociacao = JSON.parse(dados.jsonRenegociacao);
    log.audit('dadosRenegociacao', dadosRenegociacao);
    // Sublista Resumo
    var dadosReparcelamento = JSON.parse(dados.jsonReparcelamento);
    log.audit('dadosReparcelamento', dadosReparcelamento);

    var total_prestacoes_marcadas = 0;

    var total_novas_parcelas = dados.total_novas_parcelas / dadosRenegociacao.length;

    var ZERO = Number('0').toFixed(2);

    const lookupFI = (id) => {
        var bscFI = search.lookupFields({type: 'invoice',
            id: id,
            columns: ['custbody_rsc_data_juros']
        });  
        log.audit('bscFI', bscFI); 
        
        return bscFI.custbody_rsc_data_juros;
    } 

    switch (dados.renegociacao) {
        case 'Amortização': 
            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_total_prestacoes_marcadas',
                value: Number(dadosRenegociacao[0].total)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_valor_total',
                value: Number(dados.total_fatura_principal - dadosRenegociacao[0].total)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_reparcelar_em',
                value: 'À vista'
            });

            for (i=0; i<dadosRenegociacao.length; i++) {
                tabelaEfetivacao.selectNewLine({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento'
                }); 
        
                var vencimento = formatData(dadosRenegociacao[i].parcela.text);
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_ano',
                    value: vencimento.getFullYear()
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_parcela',
                    value: vencimento
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_tipo_parcela',
                    value: dadosRenegociacao[i].tipoParcela
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_indice',
                    value: dadosRenegociacao[i].indice
                }); 

                if (dadosRenegociacao[i].dataJuros.text) {
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_data_juros',
                        value: formatData(dadosRenegociacao[i].dataJuros.text)
                    });
                }

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_juros_price',
                    value: ZERO
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_valor_amortizar',
                    value: dadosRenegociacao[i].valorAmortizar
                });

                total_prestacoes_marcadas = Number(dadosRenegociacao[i].total);  
                
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_multa_reneg',
                    value: ZERO
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_juros_reneg',
                    value: ZERO
                });                

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_pro_rata_am',
                    value: ZERO
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_prestacao',
                    value: parseFloat(dadosRenegociacao[0].valorAmortizar)
                });
        
                tabelaEfetivacao.commitLine({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                });
            }

            // Linha Espelho
            var vencimentoFI = formatData(dadosReparcelamento[0].vencimento);             

            var prestacao = dadosReparcelamento[0].valorAtualizado;
            var pro_rata_amortizacao = dadosRenegociacao[0].proRata;
            var valorAmortizar = dadosRenegociacao[0].valorAmortizar; 
            log.audit('result', {prestacao: prestacao, pro_rata_amortizacao: pro_rata_amortizacao, valorAmortizar: valorAmortizar});

            if (prestacao > valorAmortizar) { // Total da parcela for maior que o valor que está sendo pago
                log.audit('prestacao é maior valorAmortizar?', prestacao > valorAmortizar ? 'Sim' : 'Não');
                tabelaEfetivacao.selectNewLine({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento'
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_ano',
                    value: vencimentoFI.getFullYear()
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_parcela',
                    value: formatData(dados.novoVencimento)    
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_nova_parcela',
                    value: dadosReparcelamento[0].id_financiamento_invoice
                }); 

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_tipo_parcela',
                    value: dadosReparcelamento[0].tipoParcela
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_indice',
                    value: dadosReparcelamento[0].indice
                }); 

                var dtJuros = lookupFI(dadosReparcelamento[0].id_financiamento_invoice);

                if (dtJuros) {
                    var vencimento_dt_juros = formatData(dtJuros);
                
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_data_juros',
                        value: vencimento_dt_juros
                    });
                } 
                
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_juros_price',
                    value: ZERO
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_valor_amortizar',
                    value: ZERO
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_multa_reneg',
                    value: ZERO
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_juros_reneg',
                    value: ZERO
                });
                
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_pro_rata_am',
                    value: pro_rata_amortizacao
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_prestacao',
                    value: dados.atualizacaoMonetaria > 0 ? parseFloat(prestacao) + parseFloat(pro_rata_amortizacao) + parseFloat(dados.atualizacaoMonetaria) - parseFloat(valorAmortizar) : 
                    parseFloat(prestacao) + parseFloat(pro_rata_amortizacao) - parseFloat(valorAmortizar)
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_espelho',
                    value: true
                });
        
                tabelaEfetivacao.commitLine({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                }); 
            }
            // Fim Linha Espelho

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_total_prestacoes_marcadas',
                value: total_prestacoes_marcadas || Number(dadosRenegociacao[0].total)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_valor_total',
                value: dados.total_fatura_principal - total_prestacoes_marcadas
            });
        
            for (i=0; i<dadosReparcelamento.length; i++) {
                tabelaEfetivacao.selectNewLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_parcela_contrato',
                    value: dadosReparcelamento[i].id_financiamento_invoice
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_natureza',
                    value: dadosReparcelamento[i].tipoParcela
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_indice_atualizacao',
                    value: dadosReparcelamento[i].indice
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_vencimento_parcela',
                    value: formatData(dadosReparcelamento[i].vencimento)
                });

                var dtJuros = lookupFI(dadosReparcelamento[i].id_financiamento_invoice);

                if (dtJuros) {
                    var vencimento_dt_juros = formatData(dtJuros);
                
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo',
                        fieldId: 'custrecord_rsc_datajuros',
                        value: vencimento_dt_juros
                    });
                } 
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_parcela',
                    value: Number(dadosReparcelamento[i].valor)
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_multa_parcela',
                    value: Number(dadosReparcelamento[i].multa) || 0
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_juros_parcela',
                    value: Number(dadosReparcelamento[i].juros) || 0
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_prorata',
                    value: Number(dadosRenegociacao[0].proRata) || 0
                });

                var valor_atualizado_parcela = dadosReparcelamento[0].valorAtualizado > dadosRenegociacao[0].valorAmortizar ?
                (parseFloat(dadosReparcelamento[i].valorAtualizado) - parseFloat(dadosRenegociacao[i].valorAmortizar)) + parseFloat(dados.proRata) :
                parseFloat(dadosReparcelamento[i].valorAtualizado) + parseFloat(dados.proRata);                
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_atualizado_parcela',
                    value: parseFloat(dadosReparcelamento[i].valor) + parseFloat(dadosRenegociacao[i].proRata) + parseFloat(dados.atualizacaoMonetaria)
                });
        
                tabelaEfetivacao.commitLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
            }
        break;

        case 'Inadimplentes':
            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_reparcelar_em',
                value: (dados.reparcelarEm == 0 || dados.reparcelarEm == 1) ? 'À vista' : dados.reparcelarEm+'x'
            });
            
            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_vencimento_da_entrada',
                value: formatData(dados.vencimentoEntrada)
            });

            var pro_rata_inadimplente = 0;

            for (i=0; i<dadosRenegociacao.length; i++) {
                pro_rata_inadimplente = parseFloat(pro_rata_inadimplente) + parseFloat(dadosRenegociacao[i].proRata);
                tabelaEfetivacao.selectNewLine({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento'
                }); 
        
                var vencimento = formatData(dadosRenegociacao[i].parcela.text);
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_parcela',
                    value: vencimento
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_tipo_parcela',
                    value: dadosRenegociacao[i].tipoParcela
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_indice',
                    value: dadosRenegociacao[i].indice
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_data_juros',
                    value: dadosRenegociacao[i].dataJuros.text ? formatData(dadosRenegociacao[i].dataJuros.text) : ''
                });

                const loookupPrice1 = search.lookupFields({type: 'customrecord_rsc_correction_unit',
                    id: 5, // PRICE 1
                    columns: ['custrecord_rsc_ucr_add_sub_factor','custrecord_rsc_ucr_calc_base_item']
                });
                log.audit('loookupPrice1', loookupPrice1);

                const fator = (((Math.pow((1 + (loookupPrice1.custrecord_rsc_ucr_add_sub_factor / 100)), (1/360))) -1) * 100).toFixed(6);

                var jurosPrice = 0;
                var jurosCompostos = 0;
                var totalDias = 0;
                var valorAtualizado = 0;

                if (dadosRenegociacao[i].dataJuros.text) {
                    var validateExpirate = validarVencimento2(dadosRenegociacao[i].parcela.text, dadosRenegociacao[i].dataJuros.text);
                    log.audit('validateExpirate', validateExpirate);

                    if (validateExpirate.status == false) {
                        jurosPrice = 0;
                    } else {
                        jurosCompostos = (dadosRenegociacao[i].valorAtualizado * Math.pow((1 + fator/100), validateExpirate.diasMora)).toFixed(2);
                        log.audit('result', {
                            fator: fator,
                            valorAtualizado: dadosRenegociacao[i].valorAtualizado,
                            diasMora: validateExpirate.diasMora,
                            jurosCompostos: jurosCompostos,
                            diferenca: (jurosCompostos - dadosRenegociacao[i].valorAtualizado).toFixed(2)
                        });
                        // while (totalDias < validateExpirate.diasMora) {
                        //     if (totalDias == 0) {
                        //         jurosPrice = jurosPrice + (dadosRenegociacao[i].valorAtualizado * fator);
                        //         jurosCompostos = parseFloat(jurosCompostos) + parseFloat(jurosPrice.toFixed(6));
                        //         log.audit({totalDias: totalDias}, {valorParcela: dadosRenegociacao[i].valorAtualizado, fator: fator, jurosPrice: jurosPrice.toFixed(6)});
                        //         valorAtualizado = parseFloat(jurosPrice.toFixed(6)) + parseFloat(dadosRenegociacao[i].valorAtualizado);
                        //         log.audit('valorAtualizado', valorAtualizado.toFixed(2));
                        //     } else {
                        //         jurosPrice = valorAtualizado * fator;
                        //         jurosCompostos = parseFloat(jurosCompostos) + parseFloat(jurosPrice.toFixed(6));
                        //         log.audit({totalDias: totalDias}, {valorParcela: valorAtualizado.toFixed(2), fator: fator, jurosPrice: (valorAtualizado * fator).toFixed(6)});
                        //         valorAtualizado = parseFloat(jurosPrice.toFixed(6)) + parseFloat(valorAtualizado);
                        //         log.audit('valorAtualizado', valorAtualizado.toFixed(2));
                        //     }                           

                        //     totalDias++;
                        // }
                        // jurosPrice = dadosRenegociacao[i].valorAtualizado * fator;
                        // jurosPrice = jurosPrice * validateExpirate.diasMora;
                        // jurosPrice = (dadosRenegociacao[i].valorAtualizado + jurosPrice) - dadosRenegociacao[i].valorAtualizado;
                        // log.audit({jurosPrice: jurosPrice.toFixed(2)}, {
                        //     dataParcela: dadosRenegociacao[i].parcela.text,
                        //     dataJuros: dadosRenegociacao[i].dataJuros.text,
                        //     diasMora: validateExpirate.diasMora,
                        //     valorAtualizado: dadosRenegociacao[i].valorAtualizado,
                        //     fator: fator,
                        //     valorParcela: dadosRenegociacao[i].valorAtualizado 
                        // });
                    }
                }

                if (jurosCompostos) {
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_juros_price',
                        value: Math.abs((jurosCompostos - dadosRenegociacao[i].valorAtualizado)).toFixed(2)
                        // value: jurosPrice || ZERO
                    }); 

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_prestacao',
                        value: parseFloat(dadosRenegociacao[i].valorAtualizado) + parseFloat(jurosCompostos - dadosRenegociacao[i].valorAtualizado)
                    });
                } else {
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_juros_price',
                        value: ZERO
                        // value: jurosPrice || ZERO
                    }); 

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_prestacao',
                        value: parseFloat(dadosRenegociacao[i].valorAtualizado)
                    });
                }  
                
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_valor_amortizar',
                    value: ZERO
                });
        
                total_prestacoes_marcadas += Number(dadosRenegociacao[i].valorAtualizado);

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_pro_rata_am',
                    value: dadosRenegociacao[i].proRata
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_multa_reneg',
                    value: dadosRenegociacao[i].multa
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_juros_reneg',
                    value: dadosRenegociacao[i].juros || ZERO
                });
        
                tabelaEfetivacao.commitLine({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                });
            }

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_total_prestacoes_marcadas',
                value: total_prestacoes_marcadas
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_valor_total',
                value: dados.total_fatura_principal - total_prestacoes_marcadas
            });

            var proRataTotal = 0;
        
            for (i=0; i<dadosReparcelamento.length; i++) {
                proRataTotal = parseFloat(proRataTotal) + parseFloat(dadosReparcelamento[i].calculoPR.proRata);

                tabelaEfetivacao.selectNewLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_parcela_contrato',
                    value: dadosReparcelamento[i].id_financiamento_invoice
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_natureza',
                    value: dadosReparcelamento[i].tipoParcela
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_indice_atualizacao',
                    value: dadosReparcelamento[i].indice
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_vencimento_parcela',
                    value: formatData(dadosReparcelamento[i].vencimento)
                });

                var dtJuros = lookupFI(dadosReparcelamento[i].id_financiamento_invoice);

                if (dtJuros) {
                    var vencimento_dt_juros = formatData(dtJuros);
                
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo',
                        fieldId: 'custrecord_rsc_datajuros',
                        value: vencimento_dt_juros
                    });
                } 
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_parcela',
                    value: parseFloat(dadosReparcelamento[i].valor) + parseFloat(dados.atualizacaoMonetaria) 
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_multa_parcela',
                    value: Number(dadosReparcelamento[i].multaAntes) || 0
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_juros_parcela',
                    value: Number(dadosReparcelamento[i].jurosAntes) || 0
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_prorata',
                    value: dadosReparcelamento[i].calculoPR.proRata
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_atualizado_parcela',
                    value: parseFloat(dadosReparcelamento[i].valorAtualizadoAntes) + parseFloat(dadosReparcelamento[i].calculoPR.proRata) + parseFloat(dados.atualizacaoMonetaria)
                });
        
                tabelaEfetivacao.commitLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
            }
        break;

        case 'Adimplentes': 
            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_reparcelar_em',
                value: (dados.reparcelarEm == 0 || dados.reparcelarEm == 1) ? 'À vista' : dados.reparcelarEm+'x'
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_vencimento_da_entrada',
                value: formatData(dados.vencimentoEntrada)
            });

            var pro_rata_adimplente = 0;           

            for (i=0; i<dadosRenegociacao.length; i++) {
                pro_rata_adimplente = parseFloat(pro_rata_adimplente) + parseFloat(dadosRenegociacao[i].proRata);

                tabelaEfetivacao.selectNewLine({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento'
                }); 
        
                var vencimento = formatData(dadosRenegociacao[i].parcela.text);
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_parcela',
                    value: vencimento
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_tipo_parcela',
                    value: dadosRenegociacao[i].tipoParcela
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_indice',
                    value: dadosRenegociacao[i].indice
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_data_juros',
                    value: dadosRenegociacao[i].dataJuros.text ? formatData(dadosRenegociacao[i].dataJuros.text) : ''
                });

                const loookupPrice1 = search.lookupFields({type: 'customrecord_rsc_correction_unit',
                    id: 5, // PRICE 1
                    columns: ['custrecord_rsc_ucr_add_sub_factor','custrecord_rsc_ucr_calc_base_item']
                });
                log.audit('loookupPrice1', loookupPrice1);

                // const fator = (Math.pow(1 + (loookupPrice1.custrecord_rsc_ucr_add_sub_factor / 100), (1 / 360)) - 1).toFixed(8);
                const fator = (((Math.pow((1 + (loookupPrice1.custrecord_rsc_ucr_add_sub_factor / 100)), (1/360))) -1) * 100).toFixed(6);

                var jurosPrice = 0;
                var jurosCompostos = 0;
                var totalDias = 0;
                var valorAtualizado = 0;

                if (dadosRenegociacao[i].dataJuros.text) {
                    var validateExpirate = validarVencimento2(dadosRenegociacao[i].parcela.text, dadosRenegociacao[i].dataJuros.text);
                    log.audit('validateExpirate', validateExpirate);

                    if (validateExpirate.status == false) {
                        jurosPrice = 0;
                    } else {
                        jurosCompostos = (dadosRenegociacao[i].valorAtualizado * Math.pow((1 + fator/100), validateExpirate.diasMora)).toFixed(2);
                        log.audit('result', {
                            fator: fator,
                            valorAtualizado: dadosRenegociacao[i].valorAtualizado,
                            diasMora: validateExpirate.diasMora,
                            jurosCompostos: jurosCompostos,
                            diferenca: (jurosCompostos - dadosRenegociacao[i].valorAtualizado).toFixed(2)
                        });
                        // while (totalDias < validateExpirate.diasMora) {
                        //     if (totalDias == 0) {
                        //         jurosPrice = jurosPrice + (dadosRenegociacao[i].valorAtualizado * fator);
                        //         jurosCompostos = parseFloat(jurosCompostos) + parseFloat(jurosPrice.toFixed(6));
                        //         log.audit({totalDias: totalDias}, {valorParcela: dadosRenegociacao[i].valorAtualizado, fator: fator, jurosPrice: jurosPrice.toFixed(6)});
                        //         valorAtualizado = parseFloat(jurosPrice.toFixed(6)) + parseFloat(dadosRenegociacao[i].valorAtualizado);
                        //         log.audit('valorAtualizado', valorAtualizado.toFixed(2));
                        //     } else {
                        //         jurosPrice = valorAtualizado * fator;
                        //         jurosCompostos = parseFloat(jurosCompostos) + parseFloat(jurosPrice.toFixed(6));
                        //         log.audit({totalDias: totalDias}, {valorParcela: valorAtualizado.toFixed(2), fator: fator, jurosPrice: (valorAtualizado * fator).toFixed(6)});
                        //         valorAtualizado = parseFloat(jurosPrice.toFixed(6)) + parseFloat(valorAtualizado);
                        //         log.audit('valorAtualizado', valorAtualizado.toFixed(2));
                        //     }                           

                        //     totalDias++;
                        // }
                        // jurosPrice = dadosRenegociacao[i].valorAtualizado * fator;
                        // jurosPrice = jurosPrice * validateExpirate.diasMora;
                        // jurosPrice = (dadosRenegociacao[i].valorAtualizado + jurosPrice) - dadosRenegociacao[i].valorAtualizado;
                        // log.audit({jurosPrice: jurosPrice.toFixed(2)}, {
                        //     dataParcela: dadosRenegociacao[i].parcela.text,
                        //     dataJuros: dadosRenegociacao[i].dataJuros.text,
                        //     diasMora: validateExpirate.diasMora,
                        //     valorAtualizado: dadosRenegociacao[i].valorAtualizado,
                        //     fator: fator,
                        //     valorParcela: dadosRenegociacao[i].valorAtualizado 
                        // });
                    }
                }

                if (jurosCompostos) {
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_juros_price',
                        value: Math.abs((jurosCompostos - dadosRenegociacao[i].valorAtualizado)).toFixed(2)
                        // value: jurosPrice || ZERO
                    }); 

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_prestacao',
                        value: parseFloat(dadosRenegociacao[i].valorAtualizado) + parseFloat(jurosCompostos - dadosRenegociacao[i].valorAtualizado)
                    });
                } else {
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_juros_price',
                        value: ZERO
                        // value: jurosPrice || ZERO
                    }); 

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_prestacao',
                        value: parseFloat(dadosRenegociacao[i].valorAtualizado)
                    });
                }   
        
                total_prestacoes_marcadas += Number(dadosRenegociacao[i].valorAtualizado);

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_valor_amortizar',
                    value: ZERO
                });
                
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_pro_rata_am',
                    value: dadosRenegociacao[i].proRata
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_multa_reneg',
                    value: ZERO
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    fieldId: 'custrecord_rsc_juros_reneg',
                    value: dadosRenegociacao[i].juros || ZERO
                });
        
                tabelaEfetivacao.commitLine({
                    sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                });
            }

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_total_prestacoes_marcadas',
                value: total_prestacoes_marcadas
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_valor_total',
                value: dados.total_fatura_principal - total_prestacoes_marcadas
            });

            var proRataTotal = 0;
        
            for (i=0; i<dadosReparcelamento.length; i++) {
                proRataTotal = parseFloat(proRataTotal) + parseFloat(dadosReparcelamento[i].calculoPR.proRata);
                
                tabelaEfetivacao.selectNewLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_parcela_contrato',
                    value: dadosReparcelamento[i].id_financiamento_invoice
                });
                
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_natureza',
                    value: dadosReparcelamento[i].tipoParcela
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_indice_atualizacao',
                    value: dadosReparcelamento[i].indice
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_vencimento_parcela',
                    value: formatData(dadosReparcelamento[i].vencimento)
                });

                var dtJuros = lookupFI(dadosReparcelamento[i].id_financiamento_invoice);

                if (dtJuros) {
                    var vencimento_dt_juros = formatData(dtJuros);
                
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo',
                        fieldId: 'custrecord_rsc_datajuros',
                        value: vencimento_dt_juros
                    });
                } 
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_parcela',
                    value: parseFloat(dadosReparcelamento[i].valor) + parseFloat(dados.atualizacaoMonetaria) 
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_multa_parcela',
                    value: Number(dadosReparcelamento[i].multaAntes) || 0
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_juros_parcela',
                    value: Number(dadosReparcelamento[i].jurosAntes) || 0
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_prorata',
                    value: dadosReparcelamento[i].calculoPR.proRata
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_atualizado_parcela',
                    value: parseFloat(dadosReparcelamento[i].valorAtualizadoAntes) + parseFloat(dadosReparcelamento[i].calculoPR.proRata) + parseFloat(dados.atualizacaoMonetaria)
                });
                
                tabelaEfetivacao.commitLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
            }
        break;

        case 'Recálculo de atrasos': 
            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_reparcelar_em',
                value: (dados.reparcelarEm == 0 || dados.reparcelarEm == 1) ? 'À vista' : dados.reparcelarEm+'x'
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_vencimento_da_entrada',
                value: formatData(dados.vencimentoEntrada)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_total_prestacoes_marcadas',
                value: Number(dadosRenegociacao[0].total)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_valor_total',
                value: Number(dados.total_fatura_principal - dadosRenegociacao[0].total)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_reparcelar_em',
                value: 'À vista'
            });

            var multaTotal = 0;
            var jurosTotal = 0;

            for (i=0; i<dadosReparcelamento.length; i++) {
                multaTotal = parseFloat(multaTotal) + parseFloat(dadosReparcelamento[i].multa);
                jurosTotal = parseFloat(jurosTotal) + parseFloat(dadosReparcelamento[i].juros);
            } 

            var pro_rata_total = 0;
            var tnp = 0;
            
            for (i=0; i<dadosRenegociacao.length; i++) {
                pro_rata_total = parseFloat(pro_rata_total) + parseFloat(dadosRenegociacao[i].proRata);
                tnp = parseFloat(tnp) + parseFloat(dadosRenegociacao[i].total);
            }  

            for (i=0; i<dadosRenegociacao.length; i++) {
                if (i == 0) {
                    tabelaEfetivacao.selectNewLine({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento'
                    }); 
            
                    var vencimento = formatData(dadosRenegociacao[i].parcela.text);
            
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_ano',
                        value: vencimento.getFullYear()
                    });
            
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_parcela',
                        value: vencimento
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_tipo_parcela',
                        value: dadosRenegociacao[i].tipoParcela
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_indice',
                        value: dadosRenegociacao[i].indice
                    }); 

                    if (dadosRenegociacao[i].dataJuros.text) {
                        tabelaEfetivacao.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                            fieldId: 'custrecord_rsc_data_juros',
                            value: formatData(dadosRenegociacao[i].dataJuros.text)
                        });
                    }

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_juros_price',
                        value: ZERO
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_valor_amortizar',
                        value: ZERO
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_multa_reneg',
                        value: multaTotal
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_juros_reneg',
                        value: jurosTotal
                    });
                    
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_pro_rata_am',
                        value: pro_rata_total
                    });
                    
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_prestacao',
                        value: total_novas_parcelas > 0 ? total_novas_parcelas : tnp
                    });                  

                    total_prestacoes_marcadas = Number(tnp);              
            
                    tabelaEfetivacao.commitLine({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    });
                }
            }

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_total_prestacoes_marcadas',
                value: total_prestacoes_marcadas || Number(dadosRenegociacao[0].total)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_valor_total',
                value: dados.total_fatura_principal - total_prestacoes_marcadas
            });
        
            for (i=0; i<dadosReparcelamento.length; i++) {
                tabelaEfetivacao.selectNewLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_parcela_contrato',
                    value: dadosReparcelamento[i].id_financiamento_invoice
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_natureza',
                    value: dadosReparcelamento[i].tipoParcela
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_indice_atualizacao',
                    value: dadosReparcelamento[i].indice
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_vencimento_parcela',
                    value: formatData(dadosReparcelamento[i].vencimento)
                });

                var dtJuros = lookupFI(dadosReparcelamento[i].id_financiamento_invoice);

                if (dtJuros) {
                    var vencimento_dt_juros = formatData(dtJuros);
                
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo',
                        fieldId: 'custrecord_rsc_datajuros',
                        value: vencimento_dt_juros
                    });
                } 
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_parcela',
                    value: parseFloat(dadosReparcelamento[i].valor) + parseFloat(dados.atualizacaoMonetaria)
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_multa_parcela',
                    value: Number(dadosReparcelamento[i].multa) || 0
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_juros_parcela',
                    value: Number(dadosReparcelamento[i].juros) || 0
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_prorata',
                    value: dadosReparcelamento[i].calculoPR.proRata
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_atualizado_parcela',
                    value: parseFloat(dadosReparcelamento[i].valorAtualizado) + parseFloat(dados.atualizacaoMonetaria)
                });
        
                tabelaEfetivacao.commitLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
            }
        break;

        case 'Antecipação': 
            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_reparcelar_em',
                value: (dados.reparcelarEm == 0 || dados.reparcelarEm == 1) ? 'À vista' : dados.reparcelarEm+'x'
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_vencimento_da_entrada',
                value: formatData(dados.vencimentoEntrada)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_total_prestacoes_marcadas',
                value: Number(dadosRenegociacao[0].total)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_valor_total',
                value: Number(dados.total_fatura_principal - dadosRenegociacao[0].total)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_reparcelar_em',
                value: 'À vista'
            });

            var pro_rata_total = 0;
            var tnp = 0;
            
            for (i=0; i<dadosRenegociacao.length; i++) {
                pro_rata_total = parseFloat(pro_rata_total) + parseFloat(dadosRenegociacao[i].proRata);
                tnp = parseFloat(tnp) + parseFloat(dadosRenegociacao[i].total);
            }   

            for (i=0; i<dadosRenegociacao.length; i++) {
                if (i == 0) {
                    tabelaEfetivacao.selectNewLine({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento'
                    }); 
            
                    var vencimento = formatData(dadosRenegociacao[i].parcela.text);
            
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_ano',
                        value: vencimento.getFullYear()
                    });
            
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_parcela',
                        value: vencimento
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_tipo_parcela',
                        value: dadosRenegociacao[i].tipoParcela
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_indice',
                        value: dadosRenegociacao[i].indice
                    }); 

                    if (dadosRenegociacao[i].dataJuros.text) {
                        tabelaEfetivacao.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                            fieldId: 'custrecord_rsc_data_juros',
                            value: formatData(dadosRenegociacao[i].dataJuros.text)
                        });
                    }

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_juros_price',
                        value: ZERO
                    });
                    
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_valor_amortizar',
                        value: ZERO
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_multa_reneg',
                        value: ZERO
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_juros_reneg',
                        value: ZERO
                    });                              
                    
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_pro_rata_am',
                        value: pro_rata_total
                    });

                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                        fieldId: 'custrecord_rsc_prestacao',
                        value: total_novas_parcelas > 0 ? total_novas_parcelas : tnp
                    });

                    total_prestacoes_marcadas = Number(tnp);              
            
                    tabelaEfetivacao.commitLine({
                        sublistId: 'recmachcustrecord_rsc_resumo_reparcelamento',
                    });
                }
            }

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_total_prestacoes_marcadas',
                value: total_prestacoes_marcadas || Number(dadosRenegociacao[0].total)
            });

            tabelaEfetivacao.setValue({
                fieldId: 'custrecord_rsc_valor_total',
                value: dados.total_fatura_principal - total_prestacoes_marcadas
            });
        
            for (i=0; i<dadosReparcelamento.length; i++) {
                tabelaEfetivacao.selectNewLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_parcela_contrato',
                    value: dadosReparcelamento[i].id_financiamento_invoice
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_natureza',
                    value: dadosReparcelamento[i].tipoParcela
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_indice_atualizacao',
                    value: dadosReparcelamento[i].indice
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_vencimento_parcela',
                    value: formatData(dadosReparcelamento[i].vencimento)
                });

                var dtJuros = lookupFI(dadosReparcelamento[i].id_financiamento_invoice);

                if (dtJuros) {
                    var vencimento_dt_juros = formatData(dtJuros);
                
                    tabelaEfetivacao.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_rsc_resumo',
                        fieldId: 'custrecord_rsc_datajuros',
                        value: vencimento_dt_juros
                    });
                } 
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_parcela',
                    value: parseFloat(dadosReparcelamento[i].valor) + parseFloat(dados.atualizacaoMonetaria)
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_multa_parcela',
                    value: Number(dadosReparcelamento[i].multa) || 0
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_juros_parcela',
                    value: Number(dadosReparcelamento[i].juros) || 0
                });

                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_prorata',
                    value: dadosReparcelamento[i].calculoPR.proRata
                });
        
                tabelaEfetivacao.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsc_resumo',
                    fieldId: 'custrecord_rsc_valor_atualizado_parcela',
                    value: parseFloat(dadosReparcelamento[i].valorAtualizado) + parseFloat(dados.atualizacaoMonetaria)
                });
        
                tabelaEfetivacao.commitLine({
                    sublistId: 'recmachcustrecord_rsc_resumo'
                });
            }
        break;
    }

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_juros_de_mora',
        value: 0
    });

    tabelaEfetivacao.setValue({
        fieldId: 'custrecord_rsc_status_ter',
        value: 1
    });

    var idTabelaEfetivacao, erro;
    
    try {
        idTabelaEfetivacao = tabelaEfetivacao.save({ignoreMandatoryFields: true});
        log.audit('idTabelaEfetivacao', idTabelaEfetivacao);

        redirect.toRecord({
            type: 'customrecord_rsc_tab_efetiva_reparcela',
            id: idTabelaEfetivacao,
            parameters: {
                'custparam_test':'helloWorld'
            }
        });
    } catch (e) {
        log.error('Erro Tabela Efetivação', e);
        erro = e;
    }

    if (idTabelaEfetivacao) {
        const loadTabelaEfetivacao = record.load({
            type: 'customrecord_rsc_tab_efetiva_reparcela',
            id: idTabelaEfetivacao,
            isDynamic: true
        });        
        
        loadTabelaEfetivacao.setValue({
            fieldId: 'custrecord_rsc_status_ter',
            value: 3
        });

        loadTabelaEfetivacao.save({ignoreMandatoryFields: true});

        var urlTabelaEfetivacao = url.resolveRecord({
            recordType: 'customrecord_rsc_tab_efetiva_reparcela',
            recordId: idTabelaEfetivacao
        });

        return {
            status: 'Sucesso',
            idTabelaEfetivacao: idTabelaEfetivacao,
            urlTabelaEfetivacao: urlTabelaEfetivacao
        }
    } else {
        return {
            status: 'Erro',
            msg: error.create({
                name: 'Erro ao gravar tabela de efetivação.',
                message: erro.message
            })
        }
    }
}

const formatData = (data) => {
    var partesData = data.split("/");

    var novaData = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    return novaData;
}

const validarVencimento2 = (dataParcela, dataJuros) => {
    const partesDP = dataParcela.split("/");

    var vencimentoDP = new Date(partesDP[2], partesDP[1] - 1, partesDP[0]);

    var diaDP = vencimentoDP.getDate();
    var mesDP = vencimentoDP.getMonth()+1;
    var anoDP = vencimentoDP.getFullYear();

    const partesDJ = dataJuros.split("/");

    var vencimentoDJ = new Date(partesDJ[2], partesDJ[1] - 1, partesDJ[0]);

    var diaDJ = vencimentoDJ.getDate();
    var mesDJ = vencimentoDJ.getMonth()+1;
    var anoDJ = vencimentoDJ.getFullYear();    

    if (vencimentoDP > vencimentoDJ) {
        var tempo = Math.abs(vencimentoDP.getTime() - vencimentoDJ.getTime());

        var diasMora = Math.ceil(tempo / (1000 * 3600 * 24));

        return {
            status: true, 
            diasMora: diasMora
        }
    } else {
        return {
            status: false
        }
    }
}

return {
    onRequest: onRequest
}
});
