const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM industries`);
    for (let row of results.rows) {
      const companies = await db.query(
        `SELECT c.code
                       FROM companies_industries AS ci
                         LEFT JOIN companies AS c
                           ON c.code = ci.comp_code
                       WHERE ci.industry_code = $1;`,
        [row.code]
      );
      row["companies"] = companies.rows.map((r) => {
        return r.code;
      });
    }
    return res.json({ industries: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT i.code, i.industry, c.name
                 FROM industries AS i
                   LEFT JOIN companies_industries AS ci 
                     ON i.code = ci.industry_code
                   LEFT JOIN companies AS c ON ci.comp_code = c.code
                 WHERE i.code = $1;`,
      [req.params.code]
    );
    let { code, industry } = result.rows[0];
    let companies = result.rows.map((r) => r.name);

    return res.json({ code, industry, companies });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;

    const slugifiedCode = slugify(code, {
      remove: /[*+~.()#'"!:@]/g,
      lower: true,
    });
    const results = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`,
      [slugifiedCode, industry]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/associatecompany", async (req, res, next) => {
  try {
    const companyCode = req.body.company_code;
    const industryCode = req.body.industry_code;

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

    const industryResults = await db.query(
      `SELECT * FROM industries WHERE code=$1`,
      [industryCode]
    );
    if (industryResults.rows.length === 0) {
      throw new ExpressError(
        `Can't find industry with code of ${industryCode}`,
        404
      );
    }

    const results = await db.query(
      `INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2)RETURNING comp_code, industry_code`,
      [companyCode, industryCode]
    );
    return res.status(201).json({ companies_industries: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
