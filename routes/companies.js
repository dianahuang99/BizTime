const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    for (let row of results.rows) {
      const industries = await db.query(
        `SELECT i.industry
                         FROM companies_industries AS ci
                           LEFT JOIN industries AS i
                             ON i.code = ci.industry_code
                         WHERE ci.comp_code = $1;`,
        [row.code]
      );
      row["industries"] = industries.rows.map((r) => {
        return r.industry;
      });
    }
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

    const industryResults = await db.query(
      `SELECT c.code, c.name, c.description, i.industry
                   FROM companies AS c
                     LEFT JOIN companies_industries AS ci 
                       ON c.code = ci.comp_code
                     LEFT JOIN industries AS i ON ci.industry_code = i.code
                   WHERE c.code = $1;`,
      [companyCode]
    );
    let { code, name, description } = industryResults.rows[0];
    let industries = industryResults.rows.map((r) => r.industry);

    return res.json({
      code,
      name,
      description,
      industries,
      invoices: invoiceResults.rows,
    });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;

    const slugifiedCode = slugify(code, {
      remove: /[*+~.()#'"!:@]/g,
      lower: true,
    });
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)RETURNING code, name, description`,
      [slugifiedCode, name, description]
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
