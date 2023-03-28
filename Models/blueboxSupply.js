const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const md5 = require('md5');
require('dotenv').config();
const mysql2Client = require('../Database/client');
const { select, insert, update, remove } = require('../Database/queries');
const util = require('util');
const { recordLog, formattedTimestamp } = require('../lib/db-utils');

const createNewBluebox = async (req) => {
  const con = req.app.locals.connection;
  let supply_year = req.body.supply_year;
  let organization_id = req.body.organization_id;
  let material_category = req.body.material_category;
  let representation_agreement = null;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let createdDate = formattedTimestamp();
  let user_type,
    customer_id,
    token_user_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
    token_user_id = decoded.id;
  });

  if (user_type != 'admin' && organization_id != customer_id) {
    return { message: 'Permission Denied', status: 500 };
  }

  let blueBoxSupplyData = await mysql2Client.dbQuery(insert.blueBox.create, [
    supply_year,
    organization_id,
    material_category,
    createdDate,
  ]);

  recordLog('Created the Bluebox Data :' + blueBoxSupplyData.insertId, req);

  let blueBoxId = blueBoxSupplyData.insertId;

  if (typeof req.body.bluebox_request_line != 'undefined') {
    let blueBoxLines = JSON.parse(
      JSON.stringify(req.body.bluebox_request_line),
    );
    blueBoxLines = JSON.parse(blueBoxLines);
    for (let property in blueBoxLines) {
      let supply_weight = blueBoxLines[property]['supply_weight'];
      let future_material_category =
        blueBoxLines[property]['future_material_category'];
      let supply_weight_new = blueBoxLines[property]['supply_weight_new'];
      let additional_weight = blueBoxLines[property]['additional_weight'];
      let compostable_meterials_weight =
        blueBoxLines[property]['compostable_materials_weight'];
      let total = blueBoxLines[property]['total'];
      let sub_category_1 = blueBoxLines[property]['sub_category_1'];
      let sub_category_2 = blueBoxLines[property]['sub_category_2'];

      let material = await mysql2Client.dbQuery(
        select.blueBox.materialByCategories,
        [material_category, sub_category_1, sub_category_2],
      );

      await mysql2Client.dbQuery(insert.blueBox.createSupplyData, [
        blueBoxId,
        supply_weight,
        future_material_category,
        supply_weight_new,
        additional_weight,
        compostable_meterials_weight,
        total,
        material[0].id,
      ]);
    }
  }

  if (typeof req.files.bluebox_quote_file != 'undefined') {
    let datetime = new Date().toISOString();
    let date_time = datetime.slice(0, 9) + ' ' + datetime.slice(11, 18);
    let user_type = null;
    let cust_id = null;
    let user_id = null;
    let customer_id = req.body.organization_id;

    let status = typeof req.body.status != 'undefined' ? req.body.status : 1;
    let type = req.body.type;
    let file_name = req.files.bluebox_quote_file[0].originalname;
    let created_at = formattedTimestamp();
    let updated_at = formattedTimestamp();
    let password =
      req.body.password != undefined &&
      req.body.password != '' &&
      req.body.password != 'undefined'
        ? req.body.password
        : null;

    const newFileName =
      datetime + '-' + req.files.bluebox_quote_file[0].originalname;

    const bucket = req.app.locals.bucket;

    let file = bucket.file('customer_bluebox/' + newFileName);

    //TODO: Bluebox shouldn't save if the file fails.
    file.save(req.files.bluebox_quote_file[0].buffer).then(function () {});

    let publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;

    let newFile = await mysql2Client.dbQuery(insert.blueBox.createNewFile, [
      customer_id,
      status,
      type,
      file_name,
      publicUrl,
      created_at,
      updated_at,
      password,
    ]);
    await mysql2Client.dbQuery(update.blueBox.updateSupplyDataFile, [
      newFile.insertId,
      blueBoxId,
    ]);
  }

  return null != blueBoxSupplyData
    ? {
        message: 'Bluebox data created successfully',
        status: 200,
        data: blueBoxSupplyData.insertId,
      }
    : {
        message: 'Failed to create Bluebox data !',
        status: 500,
      };
};

const updateNewBluebox = async (req) => {
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let bluebox_id = req.params.id;

  let supply_year = req.body.supply_year;
  let organization_id = req.body.organization_id;
  let material_category = req.body.material_category;
  let representation_agreement = null;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    customer_id = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
  });

  let organization = await mysql2Client.dbQuery(
    select.blueBox.organizationByBlueBoxId,
    [bluebox_id],
  );
  // TODO RBAC should handle this
  if (
    organization_id != organization[0].organization_id ||
    (user_type != 'admin' &&
      (customer_id != organization[0].organization_id ||
        customer_id != organization_id))
  ) {
    return { message: 'Invalid operation to BlueBox data.', status: 500 };
  }

  if (user_type == 'admin') {
    if (typeof req.files.representation_agreement != 'undefined') {
      let datetime = new Date().toISOString();
      const newFileName =
        datetime + '-' + req.files.representation_agreement[0].originalname;

      // TODO is this the right location??
      let file = bucket.file('customer_bluebox/' + newFileName);

      await file.save(req.files.representation_agreement[0], function (error) {
        return error
          ? {
              message: 'File failed to upload !',
              status: 500,
            }
          : true;
      });

      // TODO this is never used ?
      // representation_agreement = `${req.app.locals.bucketLocation}/${blob.name}`;
    }
  }

  let blueBoxSupplyData = await mysql2Client.dbQuery(
    update.blueBox.updateSupplyData,
    [supply_year, material_category, representation_agreement, bluebox_id],
  );

  recordLog('Updated the Bluebox :' + bluebox_id, req);

  if (typeof req.body.bluebox_request_line != 'undefined') {
    let blueBoxLines = JSON.parse(
      JSON.stringify(req.body.bluebox_request_line),
    );
    blueBoxLines = JSON.parse(blueBoxLines);
    for (let property in blueBoxLines) {
      let id = blueBoxLines[property]['id'];
      let supply_weight = blueBoxLines[property]['supply_weight'];
      let future_material_category =
        blueBoxLines[property]['future_material_category'];
      let supply_weight_new = blueBoxLines[property]['supply_weight_new'];
      let additional_weight = blueBoxLines[property]['additional_weight'];
      let compostable_meterials_weight =
        blueBoxLines[property]['compostable_meterials_weight'];
      let total = blueBoxLines[property]['total'];
      let sub_category_1 = blueBoxLines[property]['sub_category_1'];
      let sub_category_2 = blueBoxLines[property]['sub_category_2'];

      let material = await mysql2Client.dbQuery(
        select.blueBox.materialByCategories,
        [material_category, sub_category_1, sub_category_2],
      );

      let blueBoxLine = await mysql2Client.dbQuery(
        update.blueBox.updateBlueBoxLine,
        [
          supply_weight,
          future_material_category,
          supply_weight_new,
          additional_weight,
          compostable_meterials_weight,
          total,
          material[0].id,
          id,
        ],
      );

      if (blueBoxLine.affectedRows == 0) {
        await mysql2Client.dbQuery(insert.blueBox.createSupplyData, [
          bluebox_id,
          supply_weight,
          future_material_category,
          supply_weight_new,
          additional_weight,
          compostable_meterials_weight,
          total,
          material[0].id,
        ]);
      }
    }
  }

  let blueBoxFile = await mysql2Client.dbQuery(select.blueBox.fileByBlueBoxId, [
    bluebox_id,
  ]);

  if (typeof req.files.bluebox_quote_file != 'undefined') {
    let datetime = new Date().toISOString();
    let file_id = blueBoxFile[0].user_file_id;
    let status = req.body.status != undefined ? req.body.status : 1;
    let type = req.body.type != undefined ? req.body.type : 'bluebox';
    let created_at = formattedTimestamp();
    let updated_at = formattedTimestamp();
    let password =
      req.body.password != undefined &&
      req.body.password != '' &&
      req.body.password != 'undefined'
        ? req.body.password
        : null;
    let file_name = req.files.bluebox_quote_file[0].originalname;
    let user_type = null;
    let cust_id = null;
    let user_id = null;

    const newFileName =
      datetime + '-' + req.files.bluebox_quote_file[0].originalname;

    let file = bucket.file('customer_bluebox/' + newFileName);

    let upload = await file.save(
      req.files.bluebox_quote_file[0].buffer,
      function (error) {
        return error
          ? {
              message: 'File failed to upload !',
              status: 500,
            }
          : true;
      },
    );
    let publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;

    // upsert
    let updatedFile = await mysql2Client.dbQuery(update.blueBox.updateFile, [
      publicUrl,
      file_name,
      file_id,
    ]);

    if (updatedFile.changedRows == 0) {
      let newFile = await mysql2Client.dbQuery(insert.blueBox.createNewFile, [
        cust_id,
        status,
        type,
        file_name,
        publicUrl,
        created_at,
        updated_at,
        password,
      ]);

      let user_file_id = result.insertId;
      await mysql2Client.dbQuery(update.blueBox.updateSupplyDataFile, [
        newFile.insertId,
        bluebox_id,
      ]);
    }
  }

  return null != blueBoxSupplyData
    ? {
        message: 'Bluebox data updated successfully',
        status: 200,
        data: blueBoxSupplyData,
      }
    : {
        message: 'Failed to updated Bluebox data !',
        status: 500,
      };
};

const fetchAllBluebox = async (req, callback) => {
  const con = req.app.locals.connection;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type = null;
  let cust_id = null;
  let blueBox = {};
  let isImpersonating = false;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
    isImpersonating = decoded.isImpersonating;
  });
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const orderBy = req.query.order_by || 'id';
  const order = req.query.order || 'DESC';
  const offset = (page - 1) * limit;
  let query,
    params,
    countQuery,
    countParams = null;
  let suffix = `ORDER BY ${orderBy} ${order} limit ? OFFSET ?`;

  if (isImpersonating) {
    user_type = 'company';
  }
  if (user_type == 'admin') {
    query = select.blueBox.adminFetchAll + suffix;
    params = [limit, offset];
    countQuery = select.blueBox.adminCountRecords;
  } else if (user_type == 'company' || user_type == 'user') {
    query = select.blueBox.userFetchAll + suffix;
    params = [cust_id, limit, offset];
    countParams = [cust_id];
    countQuery = select.blueBox.userCountRecords;
  } else {
    return { message: 'Permission denied.', status: 500 };
  }

  let blueBoxSupplyData = await mysql2Client.dbQuery(query, params);

  for (let property in blueBoxSupplyData) {
    if (blueBoxSupplyData[property].representation_agreement != null) {
      if (blueBoxSupplyData[property].representation_agreement_url != '')
        blueBoxSupplyData[property].representation_agreement_name = new URL(
          blueBoxSupplyData[property].representation_agreement_url,
        ).pathname
          .split('/')
          .pop();
    }
    if (blueBoxSupplyData[property].cust_bluebox_url != null) {
      if (blueBoxSupplyData[property].cust_bluebox_url != '')
        blueBoxSupplyData[property].cust_bluebox_filename = new URL(
          blueBoxSupplyData[property].cust_bluebox_url,
        ).pathname
          .split('/')
          .pop();
    }
  }

  let totalRecords = await mysql2Client.dbGetSingleRow(countQuery, countParams);

  blueBox.totalRecords = totalRecords['count(*)'];
  blueBox.data = blueBoxSupplyData;

  return null != blueBoxSupplyData
    ? {
        message: 'Fetched All BlueBox',
        status: 200,
        data: blueBox,
      }
    : {
        message: 'Failed to get BlueBox !',
        status: 500,
      };
};

const fetchSingleBluebox = async (req) => {
  const con = req.app.locals.connection;
  let bluebox_id = req.params.id;
  let result_lines = null;

  let blueBoxSupplyData = await mysql2Client.dbQuery(select.blueBox.byId, [
    bluebox_id,
  ]);

  if (blueBoxSupplyData[0].representation_agreement != null)
    blueBoxSupplyData[0].representation_agreement_filename = new URL(
      blueBoxSupplyData[0].representation_agreement_url,
    ).pathname
      .split('/')
      .pop();
  if (blueBoxSupplyData[0].cust_bluebox_url != null)
    blueBoxSupplyData[0].cust_bluebox_filename = new URL(
      blueBoxSupplyData[0].cust_bluebox_url,
    ).pathname
      .split('/')
      .pop();
  if (blueBoxSupplyData[0].ryse_contract_url != null)
    blueBoxSupplyData[0].ryse_contract_filename = new URL(
      blueBoxSupplyData[0].ryse_contract_url,
    ).pathname
      .split('/')
      .pop();
  if (blueBoxSupplyData[0].customer_contract_url != null)
    blueBoxSupplyData[0].customer_contract_filename = new URL(
      blueBoxSupplyData[0].customer_contract_url,
    ).pathname
      .split('/')
      .pop();
  if (blueBoxSupplyData[0].invoice_url != null)
    blueBoxSupplyData[0].invoice_filename = new URL(
      blueBoxSupplyData[0].invoice_url,
    ).pathname
      .split('/')
      .pop();
  for (let property in blueBoxSupplyData[0]) {
    if (blueBoxSupplyData[0][property] == null) {
      blueBoxSupplyData[0][property] = '';
    }
  }

  let supplyData = await mysql2Client.dbQuery(
    select.blueBox.supplyDataByBlueBoxId,
    [bluebox_id],
  );

  blueBoxSupplyData[0].bluebox_request_line = supplyData;

  return null != blueBoxSupplyData
    ? {
        message: 'Fetched BlueBox',
        status: 200,
        data: blueBoxSupplyData,
      }
    : {
        message: 'Failed to get BlueBox !',
        status: 500,
      };
};

const deleteSingleBluebox = async (req, callback) => {
  const con = req.app.locals.connection;
  let bluebox_id = req.params.id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let bluebox = null;
  let user_type,
    customer_id,
    user_id = null;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    customer_id = decoded.cust_id;
    user_id = decoded.id;
  });

  let organization = await mysql2Client.dbQuery(
    select.blueBox.organizationBySupplyId,
    [bluebox_id],
  );

  // TODO handle via RBAC
  if (user_type != 'admin' && customer_id != organization[0].organization_id) {
    return { message: 'Invalid operation to BlueBox data.', status: 500 };
  } else {
    await mysql2Client.dbQuery(remove.blueBox.supplyDataByBlueBoxId, [
      bluebox_id,
    ]);
    bluebox = await mysql2Client.dbQuery(remove.blueBox.byId, [bluebox_id]);
    recordLog('Deleted the Bluebox :' + bluebox_id, req);
  }

  return null != bluebox
    ? {
        message: 'Deleted BlueBox',
        status: 200,
        data: bluebox,
      }
    : {
        message: 'Failed to delete BlueBox !',
        status: 500,
      };
};

const fetchRepresentationAgreement = async (req, callback) => {
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let customer_id =
    req.params.id == undefined ? req.body.cust_id : req.params.id;
  // let blue_box_id = req.body.blue_box_id;
  // let file_id = req.params.id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    cust_id,
    user_id = null,
    isImpersonating = false;

  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
    user_id = decoded.id;
    isImpersonating = decoded.isImpersonating;
  });

  // TODO handle via RBAC
  if (customer_id.length == 0) {
    return {
      status: 400,
      message: 'Please provide customer id',
    };
  }

  let agreement = await mysql2Client.dbQuery(
    select.blueBox.filesByCustomerIdAndType,
    [customer_id, 'representation-agreement'],
  );

  return null != agreement
    ? {
        message: 'Fetched agreement',
        status: 200,
        data: agreement,
      }
    : {
        message: 'No agreement found !!',
        status: 500,
      };
};

const updateRepresentationAgreement = async (req, callback) => {
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  // let bluebox_id = req.params.id;
  let user_type = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
  });

  // TODO handle via RBAC
  if (typeof req.body.cust_id == 'undefined') {
    return {
      status: 400,
      message: 'No customer ID provided',
    };
  } else if (user_type != 'admin') {
    return {
      status: 400,
      message: 'Permission denied.',
    };
  }

  let publicUrl = '';
  let customer_id = req.body.cust_id;
  let status =
    req.body.status != undefined && req.body.status != '' ? req.body.status : 1;
  let password =
    req.body.password != undefined &&
    req.body.password != '' &&
    req.body.password != 'undefined'
      ? req.body.password
      : null;
  let type = 'representation-agreement';
  let file_name = '';
  let created_at = formattedTimestamp();
  let updated_at = formattedTimestamp();

  let agreement = await mysql2Client.dbQuery(
    select.blueBox.filesByCustomerIdAndType,
    [customer_id, 'representation-agreement'],
  );

  if (typeof req.file != 'undefined' && null != agreement) {
    let datetime = new Date().toISOString();
    const newFileName = datetime + '-' + req.file.originalname;
    file_name = req.file.originalname;

    let file = bucket.file('admin_representation_agreement/' + newFileName);

    let upload = await file.save(req.file.buffer, function (error) {
      return error
        ? {
            message: 'File failed to upload !',
            status: 500,
          }
        : true;
    });

    let publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;

    let updatedFile = await mysql2Client.dbQuery(update.blueBox.updateFile, [
      publicUrl,
      file_name,
      agreement[0].id,
    ]);

    let file_id = agreement[0].id;

    let updatedAgreement = await mysql2Client.dbQuery(
      update.blueBox.updateAgreement,
      [
        status,
        file_name,
        publicUrl,
        updated_at,
        password,
        customer_id,
        file_id,
      ],
    );

    // TODO add an 'update' method to client which throws an error if no changed rows
    if (updatedAgreement.changedRows == 0) {
      // TODO set agreement file to updatedAgreement
      return {
        status: 400,
        message: 'Failed to update',
      };
    }
  }

  return null != agreement
    ? {
        message: 'Updated agreement',
        status: 200,
        data: agreement[0].id,
      }
    : {
        message: 'Failed to update agreement !',
        status: 500,
      };
};
const createRepresentationAgreement = async (req, callback) => {
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  // let bluebox_id = req.params.id;
  let newFile = null;
  let user_type = null;
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
  });

  // TODO handle via RBAC
  if (typeof req.body.cust_id == 'undefined') {
    return {
      status: 400,
      message: 'No customer ID provided',
    };
  } else if (user_type != 'admin') {
    return {
      status: 400,
      message: 'Permission denied.',
    };
  }

  let publicUrl = '';
  let customer_id = req.body.cust_id;
  let status =
    req.body.status != undefined && req.body.status != '' ? req.body.status : 1;
  let password =
    req.body.password != undefined &&
    req.body.password != '' &&
    req.body.password != 'undefined'
      ? req.body.password
      : null;
  let type = 'representation-agreement';
  let file_name = '';
  let created_at = formattedTimestamp();
  let updated_at = formattedTimestamp();

  if (typeof req.file != 'undefined') {
    let datetime = new Date().toISOString();
    const newFileName = datetime + '-' + req.file.originalname;
    file_name = req.file.originalname;

    let file = bucket.file('admin_representation_agreement/' + newFileName);

    let upload = await file.save(req.file.buffer, function (error) {
      return error
        ? {
            message: 'File failed to upload !',
            status: 500,
          }
        : true;
    });

    let publicUrl = `${req.app.locals.bucketLocation}/${file.name}`;

    newFile = await mysql2Client.dbQuery(insert.blueBox.createNewFile, [
      customer_id,
      status,
      type,
      file_name,
      publicUrl,
      created_at,
      updated_at,
      password,
    ]);
  }

  return null != newFile
    ? {
        message: 'Created representation agreement',
        status: 200,
        data: newFile.insertId,
      }
    : {
        message: 'Failed created representation agreement !',
        status: 500,
      };
};
const deleteRepresentationAgreement = async (req, callback) => {
  const con = req.app.locals.connection;
  const bucket = req.app.locals.bucket;
  let customer_id = req.body.cust_id;
  let file_id = req.params.id;
  let authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  let user_type,
    cust_id,
    user_id = null;

  // TODO handle via RBAC
  jwt.verify(token, 'secret', function (err, decoded) {
    user_type = decoded.user_type;
    cust_id = decoded.cust_id;
    user_id = decoded.id;
  });

  if (user_type != 'admin') {
    return {
      status: 401,
      message: 'Invalid Operation',
    };
  }

  if (customer_id.length == 0) {
    return {
      status: 400,
      message: 'No customer ID provided',
    };
  }

  let agreementFile = await mysql2Client.dbQuery(
    select.blueBox.representationAgreementForDeletion,
    [customer_id, file_id],
  );

  if (agreementFile.length != 0) {
    let file_name = agreementFile[0].url.split(
      'admin_representation_agreement/',
    )[1];

    const file = bucket.file('admin_representation_agreement/' + file_name);

    await file.delete().catch(() => {
      return {
        status: 400,
        message: 'Failed to delete from GCP',
      };
    });

    agreementFile = await mysql2Client.dbQuery(
      remove.blueBox.byIdAndCustomerId,
      [customer_id, file_id],
    );

    return {
      status: 200,
      message: 'Successfully deleted',
      data: agreementFile,
    };
  }
  return {
    status: 500,
    message: 'No agreement found !!',
    data: agreementFile,
  };
};

module.exports = {
  createNewBluebox,
  updateNewBluebox,
  fetchAllBluebox,
  fetchSingleBluebox,
  deleteSingleBluebox,
  updateRepresentationAgreement,
  fetchRepresentationAgreement,
  deleteRepresentationAgreement,
  createRepresentationAgreement,
};
