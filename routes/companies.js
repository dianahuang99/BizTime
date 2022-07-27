const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const companyCode = req.params.code;
    const companyResults = await db.query(
      `SELECT * FROM companies WHERE code=$1`,
      [companyCode]
    );
    if (companyResults.rows.length === 0) {
      throw new ExpressError(
        `Can't find company with code of ${companyCode}`,
        404
      );
    }

    const invoiceResults = await db.query(
      "select * from invoices where comp_code=$1",
      [companyCode]
    );

    return res.json({
      company: companyResults.rows[0],
      invoices: invoiceResults.rows,
    });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)RETURNING code, name, description`,
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:code", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const companyCode = req.params.code;
    const results = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
      [name, description, companyCode]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(
        `Can't find company with code of ${companyCode}`,
        404
      );
    }
    return res.json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const companyCode = req.params.code;

    const selectResults = await db.query(
      `SELECT * FROM companies WHERE code=$1`,
      [companyCode]
    );
    if (selectResults.rows.length === 0) {
      throw new ExpressError(
        `Can't find company with code of ${companyCode}`,
        404
      );
    }
    const del = await db.query(`DELETE FROM companies WHERE code=$1`, [
      companyCode,
    ]);

    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
