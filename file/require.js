require(['N/query'], function(query) {
    var mySubsidiaryQuery = query.create({type: 'subsidiary'});

    var condicao1 = mySubsidiaryQuery.createCondition({
        fieldId: 'name',
        operator: query.Operator.ANY_OF,
        values: 'GAFISA S/A.'
    });

    mySubsidiaryQuery.condition = mySubsidiaryQuery.and(
        condicao1
    );

    mySubsidiaryQuery.columns = [
        mySubsidiaryQuery.createColumn({
            fieldId: 'id'
        }),
        mySubsidiaryQuery.createColumn({
            fieldId: 'name'
        })
    ];

    var resultSet = mySubsidiaryQuery.run();
    console.log(JSON.stringify(resultSet));

    var results = resultSet.results;
    console.log(JSON.stringify(results));
});

require(['N/query'], function(query) {
    var myEscrirturaDistratoQuery = query.create({type: 'customrecord_rsc_escritura_distrato'});

    var condicao1 = myEscrirturaDistratoQuery.createCondition({
        fieldId: 'custrecord_rsc_contrato_distrato',
        operator: query.Operator.ANY_OF,
        values: 640778
    });

    myEscrirturaDistratoQuery.condition = myEscrirturaDistratoQuery.and(
        condicao1
    );

    myEscrirturaDistratoQuery.columns = [
        myEscrirturaDistratoQuery.createColumn({
            fieldId: 'custrecord_rsc_status_distrato'
        })
    ];

    var resultSet = myEscrirturaDistratoQuery.run();
    console.log(JSON.stringify(resultSet));

    var results = resultSet.results;
    console.log(JSON.stringify(results));
});