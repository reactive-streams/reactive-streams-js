"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rule = function (ruleNumber, fn) { return describe("Rule" + ruleNumber, fn); };
var optional = function (ruleNumber, fn) { return describe("Rule" + ruleNumber, fn); };
var required = function (ruleNumber, fn) { return describe("Rule" + ruleNumber, fn); };
var unverified = function (ruleNumber, fn) { return describe("Rule" + ruleNumber, fn); };
var verifyPublisher = function (publisher) {
    expect(publisher).toContain;
};
function publisherVerification(fn) {
    describe("Publisher Verification Suite", function () {
        rule("1.01", function () {
        });
    });
}
exports.publisherVerification = publisherVerification;
