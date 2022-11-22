function beforeLoad()
{
    var record = nlapiLoadRecord('purchaserequisition', 152181)
    record.setFieldValue('customform', 274);
    nlapiSubmitRecord(record, true);
}
