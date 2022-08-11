/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @author Wilson
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/log", "N/query"], function (require, exports, log_1, query_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeSubmit = void 0;
    log_1 = __importDefault(log_1);
    query_1 = __importDefault(query_1);
    var QueryRes = function (params, type_transaction) {
        var filters = Array();
        log_1.default.debug('Valot Total', typeof (params[0].total));
        params.forEach(function (value) {
            if (value.department) {
                filters.push("custrecord_rsc_departamento=" + value.department + " AND ");
            }
            else {
                filters.push("custrecord_rsc_departamento IS NULL AND ");
            }
            if (value.project_name) {
                filters.push("custrecord_rsc_nome_projeto=" + value.project_name + " AND ");
            }
            else {
                filters.push("custrecord_rsc_nome_projeto IS NULL AND ");
            }
            if (value.stage_of_project) {
                filters.push("custrecord_rsc_etapa_projeto=" + value.stage_of_project);
            }
            else {
                filters.push("custrecord_rsc_etapa_projeto IS NULL");
            }
            //if (typeof(value.total) == 'number') {filters.push(`${value.total} < custrecord_rsc_valor_maximo`)} else {filters.push(`custrecord_rsc_valor_maximo IS NULL`)}
        });
        // var sql = "SELECT id, custrecord_rsc_aprovador_n1, custrecord_rsc_transacoes_aprovacao, custrecord_nivel_aprovador, custrecord_rsc_valor_maximo FROM customrecord_rsc_aprovadores_workflow  WHERE custrecord_rsc_transacoes_aprovacao=" + type_transaction + " AND ";
        var sql = "SELECT id, custrecord_rsc_aprovador_n1, custrecord_rsc_transacoes_aprovacao, custrecord_nivel_aprovador, custrecord_rsc_valor_maximo "+
        "FROM customrecord_rsc_aprovadores_workflow "+
        "WHERE isinactive = 'F' "+
        "AND custrecord_rsc_transacoes_aprovacao=" + type_transaction + 
        " AND ";
        for (var i = 0; i < filters.length; i++) {
            sql += filters[i];
        }
        log_1.default.debug('SQL', sql);
        var queryResult = query_1.default.runSuiteQL({
            query: sql
        }).asMappedResults();
        return queryResult;
    };
    var Verification = function (queryResult, total_value, currentRecod) {
        for (var x = 0; x < 4; x++) {
            currentRecod.setValue({
                fieldId: "custbody_rsc_aprovador_n" + (x + 1),
                value: ''
            });
        }
        var count_one = 0;
        var count_two = 0;
        var count_tree = 0;
        var count_four = 0;
        if (queryResult.length > 0) {
            var newApprovesFilters_1 = Array();
            var Aprrovers_max_1 = Array();
            queryResult.forEach(function (value) {
                if (value.custrecord_rsc_valor_maximo <= total_value) {
                    newApprovesFilters_1.push(value);
                }
                else {
                    Aprrovers_max_1.push(value);
                }
            });
            if (newApprovesFilters_1.length == 0) {
                //newApprovesFilters.push(queryResult[0])
                var max_1 = Array();
                Aprrovers_max_1.map(function (value) {
                    max_1.push(value.custrecord_rsc_valor_maximo);
                });
                var m = Math.min.apply(Math, max_1);
                for (var i = 0; i < Aprrovers_max_1.length; i++) {
                    var value = Aprrovers_max_1[i];
                    if (value.custrecord_rsc_valor_maximo == m) {
                        newApprovesFilters_1.push(value);
                    }
                }
            }
            else if (newApprovesFilters_1.length == queryResult.length) {
                newApprovesFilters_1 = queryResult;
            }
            else {
                var max_2 = Array();
                Aprrovers_max_1.map(function (value) {
                    max_2.push(value.custrecord_rsc_valor_maximo);
                });
                var m = Math.min.apply(Math, max_2);
                for (var i = 0; i < Aprrovers_max_1.length; i++) {
                    var value = Aprrovers_max_1[i];
                    if (value.custrecord_rsc_valor_maximo == m) {
                        newApprovesFilters_1.push(value);
                    }
                }
            }
            log_1.default.debug('newApprovesFilters', newApprovesFilters_1);
            log_1.default.debug('New QueryResult', Aprrovers_max_1);
            for (var i = 0; i < newApprovesFilters_1.length; i++) {
                var data = newApprovesFilters_1[i];
                if (data.custrecord_nivel_aprovador == 1) {
                    count_one++;
                    currentRecod.setValue({
                        fieldId: 'custbody_rsc_aprovador_n1',
                        value: data.custrecord_rsc_aprovador_n1
                    });
                }
                else if (data.custrecord_nivel_aprovador == 2) {
                    count_two++;
                    currentRecod.setValue({
                        fieldId: 'custbody_rsc_aprovador_n2',
                        value: data.custrecord_rsc_aprovador_n1
                    });
                }
                else if (data.custrecord_nivel_aprovador == 3) {
                    count_tree++;
                    currentRecod.setValue({
                        fieldId: 'custbody_rsc_aprovador_n3',
                        value: data.custrecord_rsc_aprovador_n1
                    });
                }
                else {
                    count_four++;
                    currentRecod.setValue({
                        fieldId: 'custbody_rsc_aprovador_n4',
                        value: data.custrecord_rsc_aprovador_n1
                    });
                }
            }
            if (count_one > 1)
                throw new Error('Existe mais de um aprovador para o campo Aprovador nível 1, entre em contato com administrador do sistema para alterar o "Controle de aprovadores de Workflow"');
            if (count_two > 1)
                throw new Error('Existe mais de um aprovador para o campo Aprovador nível 2, entre em contato com administrador do sistema para alterar o "Controle de aprovadores de Workflow"');
            if (count_tree > 1)
                throw new Error('Existe mais de um aprovador para o campo Aprovador nível 3, entre em contato com administrador do sistema para alterar o "Controle de aprovadores de Workflow"');
            if (count_four > 1)
                throw new Error('Existe mais de um aprovador para o campo Aprovador nível 4, entre em contato com administrador do sistema para alterar o "Controle de aprovadores de Workflow"');
        }
    };
    var beforeSubmit = function (ctx) {
        var currentRecod = ctx.newRecord;
        var currentTypeRecord = currentRecod.type;
        log_1.default.debug('Current Record Type', currentTypeRecord);
        var type_transaction = currentRecod.getValue('custbody_rsc_tipo_transacao_workflow') ? currentRecod.getValue('custbody_rsc_tipo_transacao_workflow') : 'IS NULL';
        log_1.default.debug('type', type_transaction);
        if (currentTypeRecord == 'purchasecontract') {
            var total_value_1 = Number(currentRecod.getValue('custbody_lrc_valor_contrato'));
            // var sql = "SELECT id, custrecord_rsc_aprovador_n1, custrecord_rsc_transacoes_aprovacao, custrecord_nivel_aprovador, custrecord_rsc_valor_maximo FROM customrecord_rsc_aprovadores_workflow  WHERE custrecord_rsc_transacoes_aprovacao=" + type_transaction + " AND custrecord_rsc_valor_maximo IS NOT NULL";
            var sql = "SELECT id, custrecord_rsc_aprovador_n1, custrecord_rsc_transacoes_aprovacao, custrecord_nivel_aprovador, custrecord_rsc_valor_maximo "+
            "FROM customrecord_rsc_aprovadores_workflow "+
            "WHERE isinactive = 'F' "+
            "AND custrecord_rsc_transacoes_aprovacao=" + type_transaction + 
            " AND custrecord_rsc_valor_maximo IS NOT NULL";
            var queryResult = query_1.default.runSuiteQL({
                query: sql
            }).asMappedResults();
            log_1.default.debug('Query Result', queryResult);
            var count_one = 0;
            var count_two = 0;
            var count_tree = 0;
            var count_four = 0;
            var newApprovesFilters_2 = Array();
            var Aprrovers_max_2 = Array();
            queryResult.forEach(function (value) {
                if (value.custrecord_rsc_valor_maximo <= total_value_1) {
                    newApprovesFilters_2.push(value);
                }
                else {
                    Aprrovers_max_2.push(value);
                }
            });
            var max_3 = Array();
            Aprrovers_max_2.map(function (value) {
                max_3.push(value.custrecord_rsc_valor_maximo);
            });
            var m = Math.min.apply(Math, max_3);
            for (var i = 0; i < Aprrovers_max_2.length; i++) {
                var value = Aprrovers_max_2[i];
                if (value.custrecord_rsc_valor_maximo == m) {
                    newApprovesFilters_2.push(value);
                }
            }
            log_1.default.debug('newApprovesFilters', newApprovesFilters_2);
            log_1.default.debug('New QueryResult', Aprrovers_max_2);
            for (var i = 0; i < newApprovesFilters_2.length; i++) {
                var data = newApprovesFilters_2[i];
                if (data.custrecord_nivel_aprovador == 1) {
                    count_one++;
                    currentRecod.setValue({
                        fieldId: 'custbody_rsc_aprovador_n1',
                        value: data.custrecord_rsc_aprovador_n1
                    });
                }
                else if (data.custrecord_nivel_aprovador == 2) {
                    count_two++;
                    currentRecod.setValue({
                        fieldId: 'custbody_rsc_aprovador_n2',
                        value: data.custrecord_rsc_aprovador_n1
                    });
                }
                else if (data.custrecord_nivel_aprovador == 3) {
                    count_tree++;
                    currentRecod.setValue({
                        fieldId: 'custbody_rsc_aprovador_n3',
                        value: data.custrecord_rsc_aprovador_n1
                    });
                }
                else {
                    count_four++;
                    currentRecod.setValue({
                        fieldId: 'custbody_rsc_aprovador_n4',
                        value: data.custrecord_rsc_aprovador_n1
                    });
                }
            }
            if (count_one > 1)
                throw new Error('Existe mais de um aprovador para o campo Aprovador nível 1, entre em contato com administrador do sistema para alterar o "Controle de aprovadores de Workflow"');
            if (count_two > 1)
                throw new Error('Existe mais de um aprovador para o campo Aprovador nível 2, entre em contato com administrador do sistema para alterar o "Controle de aprovadores de Workflow"');
            if (count_tree > 1)
                throw new Error('Existe mais de um aprovador para o campo Aprovador nível 3, entre em contato com administrador do sistema para alterar o "Controle de aprovadores de Workflow"');
            if (count_four > 1)
                throw new Error('Existe mais de um aprovador para o campo Aprovador nível 4, entre em contato com administrador do sistema para alterar o "Controle de aprovadores de Workflow"');
            // const id_current_record = currentRecod.save({
            // ignoreMandatoryFields: true
            // })
            // Log.debug('Id Current', id_current_record)
            // currentRecod.setValue({
            // fieldId: 'custbody_rsc_aprovador_n1',
            // value:'' 
            // })
        }
        if (currentTypeRecord == 'purchaserequisition') {
            var params = [{
                    department: currentRecod.getValue('department') ? currentRecod.getValue('department') : null,
                    project_name: currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') ? currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') : null,
                    stage_of_project: currentRecod.getValue('class') ? currentRecod.getValue('class') : null,
                    total: currentRecod.getValue('estimatedtotal')
                }];
            var queryResult = QueryRes(params, type_transaction);
            log_1.default.debug('Query Result', queryResult);
            Verification(queryResult, params[0].total, currentRecod);
        }
        if (currentTypeRecord == 'purchaseorder') {
            log_1.default.debug('Chegou', 'sim');
            var params = [{
                    department: currentRecod.getValue('department') ? currentRecod.getValue('department') : null,
                    project_name: currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') ? currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') : null,
                    stage_of_project: currentRecod.getValue('class') ? currentRecod.getValue('class') : null,
                    total: currentRecod.getValue('subtotal')
                }];
            var queryResult = QueryRes(params, type_transaction);
            log_1.default.debug('Query Result', queryResult);
            Verification(queryResult, params[0].total, currentRecod);
        }
        if (currentTypeRecord == 'vendorpayment') {
            var params = [{
                    department: currentRecod.getValue('department') ? currentRecod.getValue('department') : null,
                    project_name: currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') ? currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') : null,
                    stage_of_project: currentRecod.getValue('class') ? currentRecod.getValue('class') : null,
                    total: currentRecod.getValue('total')
                }];
            var queryResult = QueryRes(params, type_transaction);
            log_1.default.debug('Query Result', queryResult);
            Verification(queryResult, params[0].total, currentRecod);
        }
        if (currentTypeRecord == 'vendorprepayment') {
            var params = [{
                    department: currentRecod.getValue('department') ? currentRecod.getValue('department') : null,
                    project_name: currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') ? currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') : null,
                    stage_of_project: currentRecod.getValue('class') ? currentRecod.getValue('class') : null,
                    total: currentRecod.getValue('payment')
                }];
            var queryResult = QueryRes(params, type_transaction);
            log_1.default.debug('Query Result', queryResult);
            Verification(queryResult, params[0].total, currentRecod);
        }
        if (currentTypeRecord == 'expensereport') {
            var params = [{
                    department: currentRecod.getValue('department') ? currentRecod.getValue('department') : null,
                    project_name: currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') ? currentRecod.getValue('custbody_rsc_projeto_obra_gasto_compra') : null,
                    stage_of_project: currentRecod.getValue('class') ? currentRecod.getValue('class') : null,
                    total: currentRecod.getValue('total')
                }];
            var queryResult = QueryRes(params, type_transaction);
            log_1.default.debug('Query Result', queryResult);
            Verification(queryResult, params[0].total, currentRecod);
        }
    };
    exports.beforeSubmit = beforeSubmit;
});
