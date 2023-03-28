const admin = {
  quoteById: `SELECT * FROM cust_quote_request WHERE id= ? AND cust_id= ?`,
  customerToEmailByQuoteId: `SELECT customer.p_email, customer.p_first_name,customer.p_last_name, cqr.user_file_id, cqr.quote_file_id, cust_quote_file.url as cust_quote_url, cust_quote_file.name as cust_quote_filename, admin_quote_file.url as admin_quote_url, admin_quote_file.name as admin_quote_filename FROM customer
          INNER JOIN cust_quote_request as cqr ON cqr.cust_id = customer.id
          LEFT JOIN files as cust_quote_file ON cust_quote_file.id = cqr.user_file_id
          LEFT JOIN files as admin_quote_file ON admin_quote_file.id = cqr.quote_file_id
          WHERE cqr.id = ?`,
  contractByIdAndCustomerId: `SELECT * FROM cust_contract WHERE id= ? AND cust_id= ?`,
  customerToEmailByContractId: `SELECT customer.p_email, customer.p_first_name,customer.p_last_name FROM customer
          INNER JOIN cust_contract as cc ON cc.cust_id = customer.id
          WHERE cc.id = ?`,
  invoiceByIdAndCustomerId: `SELECT * FROM cust_invoice WHERE id= ? AND cust_id= ?`,
  userFullnameById: `SELECT email, first_name, last_name FROM cust_user WHERE id = ?`,
  companyFullNameById: `SELECT p_email, p_first_name, p_last_name,company_name FROM customer WHERE id = ?`,
};

const blueBox = {
  materialByCategories:
    'SELECT id FROM material_master WHERE category=? AND sub_category_1=? AND sub_category_2=?',
  organizationByBlueBoxId: `SELECT organization_id FROM supply_data_bluebox WHERE id= ?`,
  organizationBySupplyId: `SELECT organization_id FROM supply_data_bluebox WHERE supply_data_bluebox.id= ?`,
  fileByBlueBoxId: `SELECT user_file_id FROM supply_data_bluebox WHERE id= ?`,
  adminFetchAll: `SELECT supply_data_bluebox.*,customer.company_name as customer_name,s1.cust_bluebox_url,s2.representation_agreement_url,s1.cust_bluebox_password,s2.representation_agreement_password FROM supply_data_bluebox
    LEFT JOIN (SELECT user_files.url as cust_bluebox_url,user_files.password as cust_bluebox_password,blue_box.user_file_id FROM supply_data_bluebox as blue_box
    INNER JOIN files as user_files ON user_files.id=blue_box.user_file_id) as s1 ON s1.user_file_id=supply_data_bluebox.user_file_id
    LEFT JOIN (SELECT rep_files.url as representation_agreement_url,rep_files.password as representation_agreement_password,blue_box.representation_agreement FROM supply_data_bluebox as blue_box
    INNER JOIN files as rep_files ON rep_files.id=blue_box.representation_agreement) as s2 ON s2.representation_agreement=supply_data_bluebox.representation_agreement
    LEFT JOIN customer ON customer.id = supply_data_bluebox.organization_id `,
  userFetchAll: `SELECT supply_data_bluebox.*,customer.company_name as customer_name,s1.cust_bluebox_url,s2.representation_agreement_url,s1.cust_bluebox_password,s2.representation_agreement_password FROM supply_data_bluebox
    LEFT JOIN (SELECT user_files.url as cust_bluebox_url,user_files.password as cust_bluebox_password,blue_box.user_file_id FROM supply_data_bluebox as blue_box
    INNER JOIN files as user_files ON user_files.id=blue_box.user_file_id) as s1 ON s1.user_file_id=supply_data_bluebox.user_file_id
    LEFT JOIN (SELECT rep_files.url as representation_agreement_url,rep_files.password as representation_agreement_password,blue_box.representation_agreement FROM supply_data_bluebox as blue_box
    INNER JOIN files as rep_files ON rep_files.id=blue_box.representation_agreement) as s2 ON s2.representation_agreement=supply_data_bluebox.representation_agreement
    LEFT JOIN customer ON customer.id = supply_data_bluebox.organization_id WHERE supply_data_bluebox.organization_id = ? `,
  adminCountRecords: `SELECT count(*) FROM supply_data_bluebox`,
  userCountRecords: `SELECT count(*) FROM supply_data_bluebox WHERE supply_data_bluebox.organization_id = ?`,
  byId: `SELECT supply_data_bluebox.*,customer.company_name as customer_name,s1.cust_bluebox_url,s2.representation_agreement_url,s1.cust_bluebox_password, s2.representation_agreement_password FROM supply_data_bluebox
    LEFT JOIN (SELECT user_files.url as cust_bluebox_url,user_files.password as cust_bluebox_password,blue_box.user_file_id FROM supply_data_bluebox as blue_box
    INNER JOIN files as user_files ON user_files.id=blue_box.user_file_id) as s1 ON s1.user_file_id=supply_data_bluebox.user_file_id
    LEFT JOIN (SELECT rep_files.url as representation_agreement_url,rep_files.password as representation_agreement_password,blue_box.representation_agreement FROM supply_data_bluebox as blue_box
    INNER JOIN files as rep_files ON rep_files.id=blue_box.representation_agreement) as s2 ON s2.representation_agreement=supply_data_bluebox.representation_agreement
    LEFT JOIN customer ON customer.id = supply_data_bluebox.organization_id
	  WHERE supply_data_bluebox.id= ?`,
  supplyDataByBlueBoxId: `SELECT sdbl.id,sdbl.supply_data_id,sdbl.supply_weight,sdbl.future_material_category,sdbl.supply_weight_new,sdbl.additional_weight,sdbl.compostable_meterials_weight,sdbl.total,mm.sub_category_1,mm.sub_category_2 FROM supply_data_bluebox_line as sdbl
          LEFT JOIN uom ON uom.id = sdbl.uom_id
          LEFT JOIN material_master as mm ON mm.id = sdbl.material_id
			WHERE sdbl.supply_data_id= ?`,
  filesByCustomerIdAndType: `SELECT * FROM files WHERE cust_id=? AND type=?`,
  representationAgreementForDeletion: `SELECT * FROM files WHERE cust_id= ? AND id= ?`,
};

const customers = {
  fetchUserInfo: `SELECT c.id,c.company_name,c.business_name,c.street,c.city,c.postal_code,c.province,c.country,c.p_first_name as primary_first_name,c.p_last_name as primary_last_name,c.country_code,c.office_phone as office_phone,c.office_phone_extension as office_phone_extension,c.mobile_phone as mobile_phone,c.p_email as primary_email,c.p_street as primary_street,c.p_city as primary_city,c.p_postal_code as primary_postal_code,c.p_province as primary_province,c.p_country as primary_country,
	  c.b_first_name as billing_first_name,c.b_last_name as billing_last_name,c.billing_phone_extension,c.b_phone as billing_phone,c.b_email as billing_email,c.b_street as billing_street,c.b_city as billing_city,c.b_postal_code as billing_postal_code,c.b_province as billing_province,c.b_county as billing_county,c.website,c.rpra_id,c.account_type,c.hst_number,c.materials,c.account_sub_type,c.permission_id,c.rpra_confirmation_email,c.rpra_confirmation_file FROM customer as c WHERE id=?`,
  fetchAll: `Select c.id,c.company_name,c.business_name,c.street,c.city,c.postal_code,c.province,c.country,c.p_first_name as primary_first_name,c.p_last_name as primary_last_name,c.country_code,c.office_phone as office_phone,c.office_phone_extension as office_phone_extension,c.mobile_phone as mobile_phone,c.p_email as primary_email,c.p_street as primary_street,c.p_city as primary_city,c.p_postal_code as primary_postal_code,c.p_province as primary_province,c.p_country as primary_country,
	c.b_first_name as billing_first_name,c.b_last_name as billing_last_name,c.billing_phone_extension,c.b_phone as billing_phone,c.b_email as billing_email,c.b_street as billing_street,c.b_city as billing_city,c.b_postal_code as billing_postal_code,c.b_province as billing_province,c.b_county as billing_county,c.website,c.rpra_id,c.account_type,c.account_sub_type,c.materials,c.permission_id,rpra_confirmation_email,rpra_confirmation_file from customer as c where account_type !='invalid' ORDER BY c.id asc limit ? OFFSET ?`,
};

const contracts = {
  byId: `SELECT * FROM cust_contract WHERE id= ?`,
  detailsById: `SELECT cust_contract.*,customer.company_name,cq.date,cq.category,cq.adm_quote,cq.adm_quote_status,cq.adm_expiry_date,cq.cust_user_id,cq.description as quote_description,cq.collection_from_location as collection_from_location,cq.updated_at as quote_updated_at,f1.url as ryse_contract_url,f1.password as ryse_contract_password,f2.url as customer_contract_url,f2.password as customer_contract_password FROM cust_contract
    LEFT JOIN files as f1 ON f1.id = cust_contract.admin_contract_file_id
    LEFT JOIN files as f2 ON f2.id = cust_contract.customer_contract_file_id
    LEFT JOIN cust_quote_request as cq ON cq.id = cust_contract.quote_id
    LEFT JOIN customer ON customer.id = cust_contract.cust_id
	WHERE cust_contract.id= ?`,
  quoteRequestLineByQuoteId: `SELECT cust_quote_request_line.*,uom.uom,material_master.* FROM cust_quote_request_line LEFT JOIN uom ON uom.id = cust_quote_request_line.uom_id LEFT JOIN material_master ON material_master.id = cust_quote_request_line.material_id WHERE cust_quote_request_line.quote_id= ?`,
  customerIdByContractId: `SELECT cust_id FROM cust_contract WHERE id=?`,
  adminFetchAll: `SELECT cust_contract.*,customer.company_name,cq.description as quote_description FROM cust_contract
    LEFT JOIN customer ON customer.id = cust_contract.cust_id
    LEFT JOIN cust_quote_request as cq ON cq.id = cust_contract.quote_id
    WHERE cust_contract.adm_contract_status !='invalid'
    ORDER BY cust_contract.id DESC limit ? OFFSET ?`,
  userFetchAll: `SELECT cust_contract.*,cq.description as quote_description FROM cust_contract
    LEFT JOIN cust_quote_request as cq ON cq.id = cust_contract.quote_id
    WHERE cust_contract.adm_contract_status !='invalid' AND cust_contract.cust_id = ?
    ORDER BY cust_contract.id DESC limit ? OFFSET ?`,
  adminExpiredContracts: `SELECT cust_contract.*,customer.company_name FROM cust_contract
		LEFT JOIN customer ON customer.id = cust_contract.cust_id
		WHERE cust_contract.adm_contract_status = 'expired' limit ? OFFSET ?`,
  userExpiredContracts: `SELECT cust_contract.*,customer.company_name FROM cust_contract
		LEFT JOIN customer ON customer.id = cust_contract.cust_id
		WHERE cust_contract.adm_contract_status = 'expired' and cust_contract.cust_id = ? limit ? OFFSET ?`,
  adminDownloadByContractId: `SELECT admin_contract_file_id as file_id,cust_id FROM cust_contract WHERE id= ?`,
  userDownloadByContractId: `SELECT customer_contract_file_id as file_id,cust_id FROM cust_contract WHERE id= ?`,
  urlByFileId: `SELECT url as contract_url,name FROM files WHERE id= ?`,
  approvedContractForEmail: `SELECT cc.id,c.company_name,c.p_email FROM cust_contract as cc LEFT JOIN customer as c ON c.id = cc.cust_id WHERE cc.id = ?`,
  adminContractsForInvoice: `SELECT COUNT(cust_invoice.id) as invoice_num,cust_contract.*,customer.company_name,attachments.cust_quote_url,attachments.admin_quote_url,attachments.ryse_contract_url,attachments.customer_contract_url,attachments.invoice_url FROM cust_contract

	  	LEFT JOIN cust_supply ON cust_supply.cust_contract = cust_contract.id
		LEFT JOIN attachments ON attachments.contract_id = cust_contract.id
		LEFT JOIN customer ON customer.id = cust_contract.cust_id
		LEFT JOIN cust_invoice ON cust_invoice.contract_id = cust_contract.id
		WHERE cust_contract.adm_contract_status !='invalid' AND
		CASE WHEN customer.account_type = 1 AND cust_supply.period_start between cust_contract.adm_con_start_date and cust_contract.adm_con_end_date THEN cust_contract.id WHEN customer.account_type != 1 AND 1 != CASE WHEN MONTH(cust_invoice.date) = MONTH(CURRENT_DATE()) THEN 1 ELSE 0 END OR COUNT(cust_invoice.id) < cust_contract.adm_number_of_invoices THEN cust_contract.id END`,
  userContractsForInvoice: `SELECT cust_contract.*,attachments.cust_quote_url,attachments.admin_quote_url,attachments.ryse_contract_url,attachments.customer_contract_url,attachments.invoice_url FROM cust_contract
		LEFT JOIN attachments ON attachments.contract_id = cust_contract.id AND cust_contract.cust_id = ?
		WHERE cust_contract.adm_contract_status !='invalid'
		ORDER BY cust_contract.id DESC limit ? OFFSET ?`,
};

const customerSupply = {
  adminFetchAll: `SELECT cust_supply.id,cust_contract.date_entered,cust_contract.id as contract,cust_contract.adm_contract_status,CONCAT('$', FORMAT(cust_supply.amount/100, 2)) as amount,CONCAT_WS(' - ',cust_supply.period_start, cust_supply.period_end ) as period FROM cust_supply
		LEFT JOIN cust_contract ON cust_contract.id = cust_supply.contract_id ORDER BY ? DESC LIMIT ? OFFSET ?`,
  customerFetchAll: `SELECT cust_supply.id,cust_contract.date_entered,cust_contract.id as contract,cust_contract.adm_contract_status,CONCAT('$', FORMAT(cust_supply.amount/100, 2)) as amount,CONCAT_WS(' - ',cust_supply.period_start, cust_supply.period_end ) as period FROM cust_supply
		LEFT JOIN cust_contract ON cust_contract.id = cust_supply.contract_id
		where cust_supply.cust_id = ? ORDER BY ? DESC LIMIT ? OFFSET ?`,
  byId: `SELECT cs.id,cs.cust_id,cs.user_id,cs.contract_id,cs.material_master_id,CONCAT('$', FORMAT(cs.amount/100, 2)) as amount,cs.period_start,cs.period_end,cs.uom_id,cust_contract.quote_id,cust_contract.date_entered,cust_contract.id as contract,cust_contract.adm_contract_status,CONCAT_WS(' - ',cs.period_start, cs.period_end ) as period,cust_quote_request.adm_quote,cust_quote_request.adm_quote_status,cust_quote_request.adm_expiry_date FROM cust_supply as cs
	  LEFT JOIN cust_contract ON cust_contract.id = cs.contract_id
	  LEFT JOIN cust_quote_request ON cust_quote_request.id = cust_contract.quote_id
	  WHERE cs.id= ?`,
  quoteRequestLineByQuoteId: `SELECT cqrl.id,cqrl.cust_id,cqrl.quote_id,cqrl.line_number,cqrl.material_id,CONCAT('$', FORMAT(cqrl.amount/100, 2)) as amount,cqrl.uom_id,cqrl.collection_from_location,material_master.*,uom.uom FROM cust_quote_request_line as cqrl
			LEFT JOIN material_master ON material_master.id = cqrl.material_id
			LEFT JOIN uom ON uom.id = cqrl.uom_id
			WHERE cqrl.quote_id= ?`,
  adminDownloadByContractId: `SELECT cs.id,cs.cust_id,cs.user_id,cs.contract_id,cs.material_master_id,CONCAT('$', FORMAT(cs.amount/100, 2)) as amount,cs.period_start,cs.period_end,cs.uom_id FROM cust_supply as cs WHERE cs.contract_id= ?`,
  adminDownload: `SELECT cs.id,cs.cust_id,cs.user_id,cs.contract_id,cs.material_master_id,CONCAT('$', FORMAT(cs.amount/100, 2)) as amount,cs.period_start,cs.period_end,cs.uom_id FROM cust_supply as cs`,
  userDownloadByUserId: `SELECT cs.id,cs.cust_id,cs.user_id,cs.contract_id,cs.material_master_id,CONCAT('$', FORMAT(cs.amount/100, 2)) as amount,cs.period_start,cs.period_end,cs.uom_id FROM cust_supply as cs
		INNER JOIN cust_contract ON cust_contract.id = cs.contract_id AND cust_contract.cust_id = ?`,
};

const files = {
  byCustomerIdAndId: `SELECT * FROM files WHERE cust_id= ? AND id= ?`,
};

const hsp = {
  customerById: 'SELECT * FROM customer WHERE id=?',
  customerInfo: `SELECT c.id,c.hwin_number,c.hwin_number2,c.activity_type_hauler,c.hauler_category_a_notes,c.hauler_category_b_notes,c.activity_type_processor,
    c.processor_category_a_notes,c.processor_category_b_notes,c.eca_number FROM customer as c WHERE id=?`,
};

const quotes = {
  materialByCategories:
    'SELECT id FROM material_master WHERE category=? AND sub_category_1=? AND sub_category_2=?',
  uomByMaterialId: 'SELECT id FROM uom WHERE uom = ? AND material_id = ?',
  fileIdForQuoteByQuoteId: `SELECT ? FROM cust_quote_request WHERE cust_quote_request.id= ?`,
  adminFetchAll: `SELECT cust_quote_request.*,customer.company_name as customer_name,CONCAT_WS(' ',cust_user.first_name,cust_user.last_name) as requestee_name FROM cust_quote_request
    LEFT JOIN customer ON customer.id = cust_quote_request.cust_id
    LEFT JOIN cust_user ON cust_user.id = cust_quote_request.cust_user_id
    WHERE cust_quote_request.adm_quote_status !='invalid' `,
  userFetchAll: `SELECT cust_quote_request.*,customer.company_name as customer_name,CONCAT_WS(' ',cust_user.first_name,cust_user.last_name) as requestee_name FROM cust_quote_request
    LEFT JOIN customer ON customer.id = cust_quote_request.cust_id
    LEFT JOIN cust_user ON cust_user.id = cust_quote_request.cust_user_id
    WHERE cust_quote_request.adm_quote_status !='invalid' and cust_quote_request.cust_id =? `,
  adminCountRecords: `SELECT count(*) FROM cust_quote_request WHERE cust_quote_request.adm_quote_status !='invalid'`,
  userCountRecords: `SELECT count(*) FROM cust_quote_request WHERE cust_quote_request.adm_quote_status !='invalid' and cust_quote_request.cust_id = ?`,
  byQuoteId: `SELECT cqr.*,customer.company_name,cust_user.first_name,f1.cust_quote_url,f1.cust_quote_password,f3.admin_quote_url,f3.admin_quote_password,f4.collection_target_file_url,f4.collection_target_file_password,CONCAT_WS(' - ',SUBSTRING(cqr.date, 1, 10), SUBSTRING(cqr.adm_expiry_date, 1, 10)) as period FROM cust_quote_request as cqr
    LEFT JOIN (SELECT quote_file.url as cust_quote_url,quote_file.password as cust_quote_password,quote_file.id as quote_file_id FROM cust_quote_request
    LEFT JOIN files as quote_file ON quote_file.id = cust_quote_request.user_file_id) as f1 ON f1.quote_file_id = cqr.user_file_id
    LEFT JOIN (SELECT quote_file.url as admin_quote_url,quote_file.password as admin_quote_password,quote_file.id as admin_quote_file_id FROM cust_quote_request
    LEFT JOIN files as quote_file ON quote_file.id = cust_quote_request.quote_file_id) as f3 ON f3.admin_quote_file_id = cqr.quote_file_id
    LEFT JOIN (SELECT quote_file.url as collection_target_file_url,quote_file.password as collection_target_file_password,quote_file.id as collection_target_file_id FROM cust_quote_request
    LEFT JOIN files as quote_file ON quote_file.id = cust_quote_request.file_collection_target) as f4 ON f4.collection_target_file_id = cqr.file_collection_target
    LEFT JOIN customer ON customer.id = cqr.cust_id
    LEFT JOIN cust_user ON cust_user.id = cqr.cust_user_id
	  WHERE cqr.id= ?`,
  quoteLinesByQuoteId: `SELECT cqrl.id,cqrl.cust_id,cqrl.quote_id,cqrl.line_number,cqrl.amount as volume,cqrl.uom_id,cqrl.material_id,uom.uom,mm.sub_category_1,mm.sub_category_2,cqrl.year FROM cust_quote_request_line as cqrl
			LEFT JOIN uom ON uom.id = cqrl.uom_id
	  	LEFT JOIN material_master as mm ON mm.id = cqrl.material_id
			WHERE cqrl.quote_id=?`,
  userByUserId: `SELECT * FROM cust_user WHERE id= ?`,
  customerByCustomerId: `SELECT * FROM customer WHERE id= ? `,
  customerIdByQuoteId: `SELECT cust_id FROM cust_quote_request WHERE cust_quote_request.id= ?`,
  forInvalidation: `SELECT cust_id,user_file_id,quote_file_id FROM cust_quote_request WHERE cust_quote_request.id=?`,
  adminExpiredQuotes: `SELECT cust_quote_request.*,customer.company_name as customer_name,CONCAT_WS(' ',cust_user.first_name,cust_user.last_name) as requestee_name, proposal_file.url as cust_quote_url, proposal_file.name as cust_quote_filename FROM cust_quote_request
		LEFT JOIN customer ON customer.id = cust_quote_request.cust_id
		LEFT JOIN cust_user ON cust_user.id = cust_quote_request.cust_user_id
                LEFT JOIN files as proposal_file ON proposal_file.id = cust_quote_request.user_file_id
		WHERE cust_quote_request.adm_expiry_date between DATE_SUB(NOW(),INTERVAL 5 DAY) and DATE_ADD(NOW(),INTERVAL 5 DAY) and cust_quote_request.adm_quote_status != 'signed' and cust_quote_request.adm_quote_status !='invalid' `,
  userExpiredQuotes: `SELECT cust_quote_request.*,customer.company_name as customer_name,CONCAT_WS(' ',cust_user.first_name,cust_user.last_name) as requestee_name, proposal_file.url as cust_quote_url, proposal_file.name as cust_quote_filename FROM cust_quote_request
		LEFT JOIN customer ON customer.id = cust_quote_request.cust_id
		LEFT JOIN cust_user ON cust_user.id = cust_quote_request.cust_user_id
                LEFT JOIN files as proposal_file ON proposal_file.id = cust_quote_request.user_file_id
		WHERE cust_quote_request.adm_expiry_date between DATE_SUB(NOW(),INTERVAL 5 DAY) and DATE_ADD(NOW(),INTERVAL 5 DAY) and cust_quote_request.adm_quote_status != 'signed' and cust_quote_request.adm_quote_status !='invalid' and cust_quote_request.cust_id =? `,
  adminCountExpiredRecords: `SELECT count(*) FROM cust_quote_request WHERE cust_quote_request.adm_expiry_date between DATE_SUB(NOW(),INTERVAL 5 DAY) and DATE_ADD(NOW(),INTERVAL 5 DAY) and cust_quote_request.adm_quote_status != 'signed' and cust_quote_request.adm_quote_status !='invalid'`,
  userCountExpiredRecords: `SELECT count(*) FROM cust_quote_request WHERE cust_quote_request.adm_expiry_date between DATE_SUB(NOW(),INTERVAL 5 DAY) and DATE_ADD(NOW(),INTERVAL 5 DAY) and cust_quote_request.adm_quote_status != 'signed' and cust_quote_request.adm_quote_status !='invalid' and cust_quote_request.cust_id = ?`,
  adminRequestedQuotes: `SELECT cust_quote_request.*,customer.company_name as customer_name,CONCAT_WS(' ',cust_user.first_name,cust_user.last_name) as requestee_name, proposal_file.url as cust_quote_url, proposal_file.name as cust_quote_filename FROM cust_quote_request
                LEFT JOIN customer ON customer.id = cust_quote_request.cust_id
                LEFT JOIN cust_user ON cust_user.id = cust_quote_request.cust_user_id
                LEFT JOIN files as proposal_file ON proposal_file.id = cust_quote_request.user_file_id
		WHERE cust_quote_request.adm_expiry_date > NOW() and cust_quote_request.adm_quote_status = 'pending' `,
  userRequestedQuotes: `SELECT cust_quote_request.*,customer.company_name as customer_name,CONCAT_WS(' ',cust_user.first_name,cust_user.last_name) as requestee_name, proposal_file.url as cust_quote_url, proposal_file.name as cust_quote_filename FROM cust_quote_request
		LEFT JOIN customer ON customer.id = cust_quote_request.cust_id
		LEFT JOIN cust_user ON cust_user.id = cust_quote_request.cust_user_id
                LEFT JOIN files as proposal_file ON proposal_file.id = cust_quote_request.user_file_id
		WHERE cust_quote_request.adm_expiry_date > NOW() and cust_quote_request.adm_quote_status = 'pending' and cust_quote_request.cust_id =? `,
  adminCountRequestedRecords: `SELECT count(*) FROM cust_quote_request WHERE cust_quote_request.adm_expiry_date > NOW() and cust_quote_request.adm_quote_status = 'pending'`,
  userCountRequestedRecords: `SELECT count(*) FROM cust_quote_request WHERE cust_quote_request.adm_expiry_date > NOW() and cust_quote_request.adm_quote_status = 'pending' and cust_quote_request.cust_id = ?`,
  adminApprovedQuotes: `SELECT cust_quote_request.*,customer.company_name as customer_name,CONCAT_WS(' ',cust_user.first_name,cust_user.last_name) as requestee_name, proposal_file.url as cust_quote_url, proposal_file.name as cust_quote_filename FROM cust_quote_request
		LEFT JOIN customer ON customer.id = cust_quote_request.cust_id
		LEFT JOIN cust_user ON cust_user.id = cust_quote_request.cust_user_id
                LEFT JOIN files as proposal_file ON proposal_file.id = cust_quote_request.user_file_id
		WHERE cust_quote_request.adm_quote_status = 'signed'`,
  userApprovedQuotes: `SELECT cust_quote_request.*,customer.company_name as customer_name,CONCAT_WS(' ',cust_user.first_name,cust_user.last_name) as requestee_name, proposal_file.url as cust_quote_url, proposal_file.name as cust_quote_filename  FROM cust_quote_request
		LEFT JOIN customer ON customer.id = cust_quote_request.cust_id
		LEFT JOIN cust_user ON cust_user.id = cust_quote_request.cust_user_id
                LEFT JOIN files as proposal_file ON proposal_file.id = cust_quote_request.user_file_id
		WHERE cust_quote_request.adm_quote_status = 'signed' and cust_quote_request.cust_id = ? `,
  adminCountApprovedRecords: `SELECT count(*) FROM cust_quote_request WHERE cust_quote_request.adm_quote_status = 'signed'`,
  userCountApprovedRecords: `SELECT count(*) FROM cust_quote_request WHERE cust_quote_request.adm_quote_status = 'signed' and cust_quote_request.cust_id = ?`,
  byQuoteIdAndCustomerId: `SELECT * FROM cust_quote_request WHERE id= ? AND cust_id= ?`,
  getFileIdForQuote: `SELECT user_file_id FROM cust_quote_request WHERE id= ?`,
  quoteForDeletion: `SELECT cust_id,user_file_id FROM cust_quote_request WHERE cust_quote_request.id=?`,
  quoteFileForDeletion: `SELECT url,cust_id FROM files WHERE id= ?`,
  blueBoxQuoteForDeletion: `SELECT organization_id,user_file_id FROM supply_data_bluebox WHERE supply_data_bluebox.id=?`,
};

const users = {
  adminFetchAll: `Select account_status, cust_user.country, cust_id, cust_user.email, cust_user.first_name,
  customer.id,last_login,cust_user.last_login, cust_user.phone,cust_user.province,cust_user.street,account_type,account_sub_type,company_name from cust_user
  inner join customer on cust_user.cust_id = customer.id
  where account_status != '3' and user_type ='company' ORDER BY cust_id DESC limit ? OFFSET ?`,
  userFetchAll: `Select account_status, cust_user.country, cust_id, cust_user.email, cust_user.first_name,
  customer.id,last_login,cust_user.last_login, cust_user.phone,cust_user.province,cust_user.street, company_name from cust_user
  inner join customer on cust_user.cust_id = customer.id
  where cust_id = ? AND account_status != '3' ORDER BY cust_id DESC limit ? OFFSET ?`,
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
  users,
};
