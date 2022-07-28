// Tell Node that we're in test "mode"
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;
let testIndustries;
beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('ms', 'Microsoft', 'I am a test company') RETURNING  code, name, description`
  );

  testCompany = result.rows[0];
  const addInvoice = await db.query(
    `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [testCompany.code, 300]
  );

  const invoiceResults = await db.query(
    "select * from invoices where comp_code=$1",
    [testCompany.code]
  );

  await db.query(
    `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`,
    ["tech", "Technology"]
  );

  await db.query(
    `INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2)RETURNING comp_code, industry_code`,
    [testCompany.code, "tech"]
  );

  const industryResults = await db.query(
    `SELECT c.code, c.name, c.description, i.industry
                 FROM companies AS c
                   LEFT JOIN companies_industries AS ci 
                     ON c.code = ci.comp_code
                   LEFT JOIN industries AS i ON ci.industry_code = i.code
                 WHERE c.code = $1;`,
    [testCompany.code]
  );
  testIndustries = industryResults.rows.map((r) => r.industry);

  testCompany["industries"] = testIndustries;
  testInvoice = invoiceResults;
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
  await db.query(`DELETE FROM industries`);
  await db.query(`DELETE FROM companies_industries`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list of companies", async () => {
    const res = await request(app).get("/companies");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      companies: [testCompany],
    });
  });
});

describe("GET /companies/:id", () => {
  test("Gets a single company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    testCompany["invoices"] = testInvoice.rows;
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(testCompany);
  });
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).get(`/companies/dfasdf`);
    expect(res.statusCode).toBe(404);
  });
});
