const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM industries`);
    companies = [];
    for (let row of results.rows) {
      const industry = await db.query(
        `SELECT i.code, i.industry, c.name
                       FROM industries AS i
                         LEFT JOIN companies_industries AS ci 
                           ON i.code = ci.industry_code
                         LEFT JOIN companies AS c ON ci.comp_code = c.code
                       WHERE i.code = $1;`,
        [row.code]
      );
      companies.push(industry.rows);
    }
    for (company of companies) {
      console.log(typeof company);
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

module.exports = router;
