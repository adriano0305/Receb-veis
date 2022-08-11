/**
 *@NApiVersion 2.1
*@NScriptType ClientScript
*/
const alerta = {
    WARNING: 'Aviso!',
    BOTH: 'Campos "Departamento" ou ("Nome do Projeto" e "Etapa de Projeto") obrigatórios!',
    DEPARTMENT: 'Campo "Departamento" obrigatório!',
    CUSTOMER: 'Campo "Nome do Projeto" obrigatório!',
    CLASS: 'Campo "Centro de Custo" obrigatório!',
    NAO_PREENCHIDO: ' obrigatório!',
    SUBLISTS: 'Somente uma das sublistas ("Item" ou "Despesas") é permitida!'
}

define(['N/currentRecord', 'N/log', 'N/runtime', 'N/ui/dialog'], (currentRecord, log, runtime, dialog) => {
var usuarioAtual = runtime.getCurrentUser();

function bloquearCampos(npc, cp) {
    var camposBloqueados = [];
    Object.keys(cp).forEach(function(fld) {
        cp[fld].isDisabled = true;
        camposBloqueados.push(fld);
    });
    log.audit('Nº Pedido Compra: '+npc, {camposBloqueados: camposBloqueados});
}

function obrigatoriedadeColunas(cln, crp) {
    if (cln.departamento && crp.departamento) {
        log.audit('Aqui 1', 'V');
        return 'V';     
    } else {
        if (!cln.cliente && !cln.centroCusto) {
            log.audit('Aqui 2', alerta.BOTH);
            dialog.alert({title: alerta.WARNING, message: alerta.BOTH}); 
            return 'F';
        } 
    }
    
    if (cln.cliente && crp.nomeProjeto) {        
        if (cln.centroCusto) {
            log.audit('Aqui 3', 'V');
            return 'V';
        } else {            
            log.audit('Aqui 4', alerta.BOTH);
            dialog.alert({title: alerta.WARNING, message: alerta.BOTH}); 
            return 'F';
        }
    }

    if (cln.centroCusto) {
        if (cln.cliente) {
            log.audit('Aqui 5', 'V');
            return 'V';
        } else {
            log.audit('Aqui 4', alerta.BOTH);
            dialog.alert({title: alerta.WARNING, message: alerta.BOTH}); 
            return 'F';
        }
    }
    
    return 'V';
}

const pageInit = (context) => {
    log.audit('pageInit', context);

    const registroAtual = context.currentRecord;
    const eNovo = registroAtual.isNew;

    if (registroAtual.type == 'purchaseorder') {
        var no_pedido_compra = registroAtual.getValue('tranid');

        var campos = {
            employee: registroAtual.getField({fieldId: 'employee'}),
            subsidiary: registroAtual.getField({fieldId: 'subsidiary'}),
            department: registroAtual.getField({fieldId: 'department'}),
            custbody_rsc_projeto_obra_gasto_compra: registroAtual.getField({fieldId: 'custbody_rsc_projeto_obra_gasto_compra'}),
            class: registroAtual.getField({fieldId: 'class'})      
        }
    
        var array_pedidos_vinculados = [];
    
        for (i=0; i<registroAtual.getLineCount('item'); i++) {
            var pedidoVinculado = registroAtual.getSublistValue('item', 'linkedorder', i);
    
            if (array_pedidos_vinculados.length > 0) { break; }
    
            if (pedidoVinculado) { array_pedidos_vinculados.push(pedidoVinculado); }
        }  
    
        if (eNovo == false) {   
            if (array_pedidos_vinculados.length > 0) {
                log.audit(no_pedido_compra, array_pedidos_vinculados);
                bloquearCampos(no_pedido_compra, campos);
            }        
        } 
    }    
}

const saveRecord = (context) => {
    log.audit('saveRecord', context);

    const registroAtual = context.currentRecord;
    log.audit('registroAtual', registroAtual);

    var corpo = {
        departamento: registroAtual.getValue('department'),
        nomeProjeto: registroAtual.getValue('custbody_rsc_projeto_obra_gasto_compra')
    }
    log.audit('corpo', corpo);

    var linhas = {
        itens: registroAtual.getLineCount('item'),
        despesas: registroAtual.getLineCount('expense')
    }
    log.audit('linhas', linhas);

    var camposPreenchidos = [];
    var sublista = linhas.itens > 0 ? 'item' : 'expense';

    if (corpo.departamento || corpo.nomeProjeto) {
        if (linhas.itens > 0 && linhas.despesas > 0) {
            dialog.alert({
                title: alerta.WARNING,
                message: alerta.SUBLISTS
            });

            return false;
        }

        if (linhas.itens > 0 || linhas.despesas > 0) {
            for (i=0; i<registroAtual.getLineCount({sublistId: sublista}); i++) {
                registroAtual.selectLine({sublistId: sublista, line: i});
                var departamentoLinha = registroAtual.getCurrentSublistValue({sublistId: sublista, fieldId: 'department'});
                var clienteLinha = registroAtual.getCurrentSublistValue({sublistId: sublista, fieldId: 'customer'});
                log.audit(i, {departamentoLinha: departamentoLinha, vazioDL: isEmpty(departamentoLinha), clienteLinha: clienteLinha, vazioCL: isEmpty(clienteLinha)});
        
                if (isEmpty(departamentoLinha) == false) { camposPreenchidos.push(departamentoLinha); }
                if (isEmpty(clienteLinha) == false) { camposPreenchidos.push(clienteLinha); }
            }

            // if (camposPreenchidos.length == 0) {
            //     log.audit('camposPreenchidos', camposPreenchidos);
            //     dialog.alert({
            //         title: alerta.WARNING,
            //         message: 'Campo ' + (corpo.departamento ? "Departamento" : "Nome do Projeto e Etapa de Projeto") + alerta.NAO_PREENCHIDO
            //     });
        
            //     return false;
            // }
        }        
    }

    return true;
}

const validateField = (context) => {}

const fieldChanged = (context) => {
    // log.audit('fieldChanged', context);

    const registroAtual = context.currentRecord;
    
    const sublista = context.sublistId;
    const campo = context.fieldId;
    const linha = context.line;

    var valor;

    if (sublista != null && (sublista == 'expense' || sublista == 'item')) {    
        if (campo == 'department') {
            registroAtual.selectLine({sublistId: sublista, line: linha})
            valor = registroAtual.getCurrentSublistValue({sublistId: sublista, fieldId: campo});            
            if (valor) {
                log.audit('fieldChanged', {sublista: sublista, campo: campo, linha: linha, status: 'Limpando campo "Cliente : Tarefa" e "Centro de Custo"...'});
                registroAtual.setCurrentSublistValue({sublistId: sublista, fieldId: 'customer', value: ''})
                .setCurrentSublistValue({sublistId: sublista, fieldId: 'class', value: ''});
            } 
        }

        if (campo == 'customer'  || campo == 'class') {            
            registroAtual.selectLine({sublistId: sublista, line: linha})
            valor = registroAtual.getCurrentSublistValue({sublistId: sublista, fieldId: campo});
            if (valor) {
                log.audit('fieldChanged', {sublista: sublista, campo: campo, linha: linha, status: 'Limpando campo "Departamento"...'});
                registroAtual.setCurrentSublistValue({sublistId: sublista, fieldId: 'department', value: ''});
            }
        }
    }
}

const postSourcing = (context) => {}

const lineInit = (context) => {}

const validateDelete = (context) => {}

const validateInsert = (context) => {}

const validateLine = (context) => {
    log.audit('validateLine', context);

    const registroAtual = context.currentRecord;
    const eNovo = registroAtual.isNew;

    const sublista = context.sublistId;

    var colunas = {};

    var corpo = {
        departamento: registroAtual.getValue('department'),
        nomeProjeto: registroAtual.getValue('custbody_rsc_projeto_obra_gasto_compra')
    }

    if (sublista == 'expense' || sublista == 'item') {
        colunas.departamento = registroAtual.getCurrentSublistValue({sublistId: sublista, fieldId: 'department'});
        colunas.cliente = registroAtual.getCurrentSublistValue({sublistId: sublista, fieldId: 'customer'}); // Nome do Projeto
        colunas.centroCusto = registroAtual.getCurrentSublistValue({sublistId: sublista, fieldId: 'class'}); // Etapa do Projeto
    } 
    
    log.audit(sublista, colunas);

    var campos_obrigatorios_colunas = obrigatoriedadeColunas(colunas, corpo, registroAtual);

    return campos_obrigatorios_colunas == 'F' ? false : true;    
}

const sublistChanged = (context) => {}

return {
    pageInit: pageInit,
    saveRecord: saveRecord,
    // validateField: validateField,
    fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    validateLine: validateLine,
    // sublistChanged: sublistChanged
}
});
