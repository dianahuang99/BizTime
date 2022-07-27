DROP DATABASE IF EXISTS biztime;

CREATE DATABASE biztime;

\ c biztime;

DROP TABLE IF EXISTS companies CASCADE;

DROP TABLE IF EXISTS industries CASCADE;

DROP TABLE IF EXISTS companies_industries CASCADE;

DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE companies (
  code text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text
);

CREATE TABLE invoices (
  id serial PRIMARY KEY,
  comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
  amt float NOT NULL,
  paid boolean DEFAULT false NOT NULL,
  add_date date DEFAULT CURRENT_DATE NOT NULL,
  paid_date date,
  CONSTRAINT invoices_amt_check CHECK ((amt > (0) :: double precision))
);

INSERT INTO
  companies
VALUES
  ('apple', 'Apple Computer', 'Maker of OSX.'),
  ('ibm', 'IBM', 'Big blue.'),
  (
    'jj',
    'Johnson & Johnson',
    'Pharmaceutical industry company'
  ),
  ('del', 'Deloitte', 'one of the big four');

INSERT INTO
  invoices (comp_Code, amt, paid, paid_date)
VALUES
  ('apple', 100, false, null),
  ('apple', 200, false, null),
  ('apple', 300, true, '2018-01-01'),
  ('ibm', 400, false, null);

CREATE TABLE industries (code TEXT PRIMARY KEY, industry TEXT UNIQUE);

CREATE TABLE companies_industries (
  comp_code TEXT NOT NULL REFERENCES companies,
  industry_code TEXT NOT NULL REFERENCES industries,
  PRIMARY KEY(comp_code, industry_code)
);

INSERT INTO
  industries
VALUES
  ('acc', 'Accounting'),
  ('tech', 'Technology'),
  ('med', 'Medical');

INSERT INTO
  companies_industries
VALUES
  ('del', 'acc'),
  ('del', 'tech'),
  ('jj', 'med'),
  ('jj', 'tech'),
  ('apple', 'tech'),
  ('ibm', 'tech')