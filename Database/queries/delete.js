const contracts = {
  deleteFiles: `DELETE FROM files WHERE id IN (?, ?)`,
};

const customers = {};

const blueBox = {
  supplyDataByBlueBoxId: `DELETE FROM supply_data_bluebox_line WHERE supply_data_id= ?`,
  byId: `DELETE FROM supply_data_bluebox WHERE id= ?`,
  byIdAndCustomerId: 'DELETE FROM files WHERE cust_id=? AND id=?',
};

const customerSupply = {
  byId: `DELETE FROM cust_supply WHERE id= ?`,
};

const files = {
  byIdAndCustomerId: 'DELETE FROM files WHERE cust_id=? AND id=?',
};
const quotes = {
  deleteFiles: `DELETE FROM files WHERE id IN (?, ?)`,
  deleteFileById: `DELETE FROM files WHERE id=?`,
};

module.exports = {
  contracts,
  blueBox,
  customers,
  customerSupply,
  files,
  quotes,
};
