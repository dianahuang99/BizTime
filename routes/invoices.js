const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoiceResults = await db.query(
      `SELECT * FROM invoices WHERE id=$1`,
      [id]
    );

    if (invoiceResults.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }

    const companyCode = await db.query(
      `SELECT comp_code FROM invoices where id=$1`,
      [id]
    );

    const companyResults = await db.query(
      `SELECT * FROM companies WHERE code=$1`,
      [companyCode.rows[0].comp_code]
    );

    return res.json({
      invoice: invoiceResults.rows[0],
      company: companyResults.rows[0],
    });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;

    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2)RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    let { amt, paid } = req.body;
    let id = req.params.id;
    let paidDate = null;

    const currResult = await db.query(
      `SELECT paid
             FROM invoices
             WHERE id = $1`,
      [id]
    );

    if (currResult.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }

    const currPaidDate = currResult.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currPaidDate;
    }

    const result = await db.query(
      `UPDATE invoices
             SET amt=$1, paid=$2, paid_date=$3
             WHERE id=$4
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );

    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }
    const del = await db.query(`DELETE FROM invoices WHERE id=$1`, [id]);

    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
