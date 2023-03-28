const admin = {
  fileWithOptionalPassword: `INSERT INTO files (cust_id,status,type,name,url,password,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`, // TODO very similar to quotes.createNewFile
  addQuoteToCustomer:
    'INSERT INTO cust_quote_request (cust_id, date, category, adm_quote, adm_quote_status, adm_expiry_date, cust_user_id, description) VALUES (?,?,?,?,?,?,?,?)',
};

const blueBox = {
  create:
    'INSERT INTO supply_data_bluebox (supply_year, organization_id, material_category, created_at) VALUES (?,?,?,?)',
  createSupplyData:
    'INSERT INTO supply_data_bluebox_line (supply_data_id, supply_weight, future_material_category, supply_weight_new, additional_weight, compostable_meterials_weight, total, material_id) VALUES (?,?,?,?,?,?,?,?)',
  createNewFile: `INSERT INTO files (cust_id, status, type, name, url, created_at, updated_at, password) VALUES (?,?,?,?,?,?,?,?)`,
};

const contracts = {
  create:
    'INSERT INTO cust_contract (cust_id, quote_id, date_entered, adm_contract_status, adm_con_start_date, adm_con_end_date, adm_contract_type, user_id_approved, contract_signed_att, contract_signed_date, adm_number_of_invoices) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
  createNewFile:
    'INSERT INTO files (cust_id, status, type, name, url, created_at, updated_at, password) VALUES (?,?,?,?,?,?,?,?)',
};

const customerSupply = {
  create:
    'INSERT INTO cust_supply (cust_id, user_id, contract_id, material_master_id, amount, period_start, period_end, uom_id) VALUES (?,?,?,?,?,?,?,?)',
};

const files = {
  create: `INSERT INTO files (cust_id, status, type, name, url, created_at, updated_at, password) VALUES (?,?,?,?,?,?,?,?)`,
};

const hsp = {
  createNewFile:
    'INSERT INTO files (cust_id, status, type, name, url, created_at, updated_at, password) VALUES (?,?,?,?,?,?,?,?)',
};

const quotes = {
  createQuote:
    'INSERT INTO cust_quote_request (cust_id, date, category, adm_quote, adm_quote_status, adm_expiry_date, cust_user_id, description,collection_from_location,governance_council) VALUES (?,?,?,?,?,?,?,?,?,?)',
  createQuoteRequestLine:
    'INSERT INTO cust_quote_request_line (cust_id, quote_id, line_number, amount, uom_id, material_id, year) VALUES (?,?,?,?,?,?,?)',
  createNewFile: `INSERT INTO files (cust_id, status, type, name, url, created_at, updated_at, password) VALUES (?,?,?,?,?,?,?,?)`,
};

module.exports = {
  admin,
  blueBox,
  contracts,
  customerSupply,
  files,
  hsp,
  quotes,
};
