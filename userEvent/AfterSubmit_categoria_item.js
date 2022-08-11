/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
 define(['N/record', 'N/error'], function(record, error) {

   function beforeSubmit(context) {
      var new_record = context.newRecord;

      

      

      var field_name = new_record.getValue({
         fieldId: 'itemid'
      })

      var field_categ_item = new_record.getValue({
         fieldId: 'custitem_rsc_categ_item'
      })
      var field_class = new_record.getValue({
         fieldId: 'class'
      })

      var all_page = record.load({
         type: 'customrecord_rsc_rec_categ_item',
         id: field_categ_item,
      })

      var class_item_categ = all_page.getValue('custrecord_rsc_class_categ_item')
      log.debug('ALL PAGE', all_page)


      if (field_class !== class_item_categ) {
         throw error.create({
            message: 'É diferente esaasdaisndioasndio esqueci',
            name: 'Ocerreu um erro',
            // notifyOff: false
         })
      }

      log.debug('Nome: ', field_name)
      log.debug('Categoria item: ', field_categ_item)
      log.debug('Classe: ', field_class)  
   }

   return {
      beforeSubmit: beforeSubmit,
   }
});
