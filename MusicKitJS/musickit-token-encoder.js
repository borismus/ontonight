"use strict";

const fs      = require("fs");
const jwt     = require("jsonwebtoken");

const privateKey = fs.readFileSync("AuthKey.p8").toString();
const teamId     = "PBNX5VFV2R";
const keyId      = "HTMLA3MDYN";

const jwtToken = jwt.sign({}, privateKey, {
  algorithm: "ES256",
  expiresIn: "180d",
  issuer: teamId,
  header: {
    alg: "ES256",
    kid: keyId
  }
});

console.log(jwtToken);

