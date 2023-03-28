const admin = {
  // TODO better naming conventions here
  updateQuoteForFileUpload: `UPDATE cust_quote_request SET adm_quote=?, adm_quote_status=?, adm_expiry_date=? WHERE id=? AND cust_id=?`,
  updateFile: `UPDATE files SET status=?,type=?,name=?,url=?,password=?,updated_at=? WHERE id=? AND cust_id=?`,
  updateQuoteFileUpload: `UPDATE cust_quote_request SET adm_quote_status=?,quote_file_id=? WHERE id=? AND cust_id=?`,
  updateContractForFileUpload: `UPDATE cust_contract SET adm_contract_status=?, adm_con_start_date=?, adm_con_end_date=? WHERE id=?`,
  updateContractFileUploadAdmin: `UPDATE cust_contract SET admin_contract_file_id=? WHERE id=? AND cust_id=?`,
  updateContractFileUploadCustomer: `UPDATE cust_contract SET customer_contract_file_id=? WHERE id=? AND cust_id=?`,
  updateInvoiceWithNewFile: `UPDATE cust_invoice SET invoice_file_id=? WHERE id=? AND cust_id=?`,
  expirePendingContracts: `UPDATE cust_contract SET adm_contract_status='expired' WHERE adm_con_end_date < NOW() AND adm_contract_status='pending'`,
  flagOverdueInvoices: `UPDATE cust_invoice SET adm_invoice_status='overdue' WHERE adm_due_date < NOW() AND adm_invoice_status='invoiced'`,
  approveUserById: `UPDATE cust_user SET account_status='1' WHERE cust_id = ?`,
};

const blueBox = {
  updateSupplyDataFile:
    'UPDATE supply_data_bluebox SET user_file_id=? WHERE id=?',
  updateSupplyData:
    'UPDATE supply_data_bluebox SET supply_year=?, material_category=?, representation_agreement=? WHERE id=?',
  updateBlueBoxLine:
    'UPDATE supply_data_bluebox_line SET supply_weight=?, future_material_category=?, supply_weight_new=?, additional_weight=?, compostable_meterials_weight=?, total=?, material_id=? WHERE id=?',
  updateFile: `UPDATE files SET url=?, name=? WHERE id=?`,
  updateAgreement: `UPDATE files SET status=?, name =?, url=?, updated_at=?, password=? WHERE cust_id=? AND id = ?`,
};

const contracts = {
  updateContractFileUploadAdmin:
    'UPDATE cust_contract SET admin_contract_file_id=? WHERE id=?',
  invalidateContract: `UPDATE cust_contract SET adm_contract_status=?,admin_contract_file_id=?,customer_contract_file_id=? WHERE id=?`,
  updateById: `UPDATE cust_contract SET cust_id=?, quote_id=?, adm_contract_status=?, adm_con_start_date=?, adm_con_end_date=?, adm_contract_type=?, user_id_approved=?, contract_signed_att=?, contract_signed_date=?, adm_number_of_invoices=? WHERE id=?`,
  updateCustomerContractFileUpload: `UPDATE cust_contract SET customer_contract_file_id=? WHERE id= ?`,
  approveContractById: `UPDATE cust_contract SET adm_contract_status='active' WHERE id= ?`,
  updateFile: `UPDATE files SET status=?,type=?,name=?,url=? WHERE id=? AND cust_id=?`,
};

const customerSupply = {
  updateById:
    'UPDATE cust_supply SET cust_id=?, user_id=?, contract_id=?, material_master_id=?, amount=?, period_start=?, period_end=?, uom_id=? WHERE id=?',
};

const customers = {
  updateInfo:
    'UPDATE customer SET company_name=?, business_name=?, street=?, city=?, postal_code=?, province=?, country=?, p_first_name=?, p_last_name=?, country_code=?, office_phone=?, office_phone_extension=?, mobile_phone=?, p_email=?, p_street=?, p_city=?, p_postal_code=?, p_province=?, p_country=?, b_first_name=?, b_last_name=?, billing_phone_extension=?,b_phone=?, b_email=?, b_street=?, b_city=?, b_postal_code=?, b_province=?, b_county=?, website=?, rpra_id=?, account_type=?, account_sub_type=?, hst_number=?, materials=?, permission_id=? , rpra_confirmation_email=?, rpra_confirmation_file=? WHERE id=? ',
  selectiveUpdateInfo:
    'UPDATE customer SET rpra_id=?, account_type=? WHERE id=? ',
  invalidateCustomer: `UPDATE customer SET account_type='invalid' WHERE id=? `,
  deactivateUser: `UPDATE cust_user SET account_status='3' WHERE cust_id=? `,
};

const files = {
  updateByIdAndUserId: `UPDATE files SET status=?,name=?,url=?,updated_at=?,password =? WHERE cust_id=? AND id=?`,
  updateByIdAndUserWithCustomerId: `UPDATE files SET cust_id=?,status=?,type=?,name=?,url=?,updated_at=?,password =? WHERE cust_id=? AND id=?`,
};

const hsp = {
  updateCustomerById:
    'UPDATE customer SET hwin_number=?, hwin_number2=?, activity_type_hauler=?, hauler_category_a_notes=?, hauler_category_b_notes=?,activity_type_processor=?, processor_category_a_notes=?, processor_category_b_notes=?, eca_number=? WHERE id=?',
  updateFileById: `UPDATE files SET status=?, type=?, name=?, url=?, updated_at=?, password=? WHERE id=?`,
  updateCustomerDynamic: `UPDATE customer SET ??=? WHERE id=?`,
};

const quotes = {
  updateFileById: `UPDATE files SET status=?, type=?, name=?, url=?, updated_at=?, password=? WHERE id=? `,
  updateFileIdDynamicColumn: `UPDATE cust_quote_request SET ?= ? WHERE id= ?`,
  updateFileIdForQuote: `UPDATE cust_quote_request SET user_file_id=? WHERE id=?`,
  updateQuoteById:
    'UPDATE cust_quote_request SET cust_id=?, category=?, adm_quote=?, adm_quote_status=?, adm_expiry_date=?, cust_user_id=?, description=?, collection_from_location=?, governance_council=? WHERE id=?',
  updateQuoteRequestLineById:
    'UPDATE cust_quote_request_line SET line_number=?, amount=?, uom_id=?, material_id=?, year=? WHERE id=?',
  invalidateById: `UPDATE cust_quote_request SET adm_quote_status=?,user_file_id=?,quote_file_id=? WHERE id=?`,
  approveById: `UPDATE cust_quote_request SET adm_quote_status='signed' WHERE id=?`,
  deleteQuoteFile: `UPDATE cust_quote_request SET user_file_id=? WHERE cust_id=? AND id=?`,
  deleteBlueBoxQuoteFile: `UPDATE supply_data_bluebox SET user_file_id=? WHERE organization_id=? AND id=?`,
};

module.exports = {
  admin,
  blueBox,
  contracts,
  customers,
  customerSupply,
  files,
  hsp,
  quotes,
};
