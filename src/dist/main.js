"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var path_1 = require("path");
var fs_1 = require("fs");
var core = require("@actions/core");
var exec = require("@actions/exec");
var glob_1 = require("glob");
var child_process_1 = require("child_process");
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var root, tag, author, email, version, regex, branch;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                core.info('Setting input and environment variables');
                root = process.env.GITHUB_WORKSPACE;
                tag = process.env.GITHUB_REF.replace('refs/tags/', '');
                author = process.env.GITHUB_ACTOR;
                email = author + "@users.noreply.github.com";
                version = child_process_1["default"].execSync('git rev-parse HEAD').toString().trim();
                regex = new RegExp(core.getInput('version-regexp'));
                branch = core.getInput('branch');
                core.info('Setting up git');
                return [4 /*yield*/, exec.exec('git', ['config', '--global', 'user.name', author])];
            case 1:
                _a.sent();
                return [4 /*yield*/, exec.exec('git', ['config', '--global', 'user.email', email])];
            case 2:
                _a.sent();
                core.info('Last commit hash is ' + version);
                // Go through every 'fxmanifest.lua' file in the repository and update the version number if the
                // author is "Asaayu" and the version number matches the regular expression.
                // Using glob to find all files in the repository
                glob_1["default"]("**/fxmanifest.lua", { cwd: root }, function (err, files) { return __awaiter(void 0, void 0, void 0, function () {
                    var _i, files_1, file, filePath, fileContent, authorMatch, versionMatch, newVersion, newFileContent;
                    return __generator(this, function (_a) {
                        if (err) {
                            throw err;
                        }
                        // Loop through all files
                        for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                            file = files_1[_i];
                            core.info("Checking '" + file + "'");
                            filePath = path_1["default"].join(root, file);
                            fileContent = fs_1["default"].readFileSync(filePath, 'utf8');
                            authorMatch = fileContent.match(/author\s*['"]\s*Asaayu\s*['"]/i);
                            if (!authorMatch) {
                                core.info('Author is not "Asaayu", skipping');
                                continue;
                            }
                            versionMatch = fileContent.match(regex);
                            if (!versionMatch) {
                                core.info('Version number does not match regular expression, skipping');
                                continue;
                            }
                            newVersion = tag.replace('v', '');
                            newFileContent = fileContent.replace(regex, newVersion);
                            fs_1["default"].writeFileSync(filePath, newFileContent);
                        }
                        return [2 /*return*/];
                    });
                }); });
                // Commit the changes
                core.info('Committing file changes');
                return [4 /*yield*/, exec.exec('git', ['config', '--global', 'user.name', author])];
            case 3:
                _a.sent();
                return [4 /*yield*/, exec.exec('git', ['config', '--global', 'user.email', email])];
            case 4:
                _a.sent();
                return [4 /*yield*/, exec.exec('git', ['commit', '-am', version])];
            case 5:
                _a.sent();
                return [4 /*yield*/, exec.exec('git', ['push', '-u', 'origin', "HEAD:" + branch])];
            case 6:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
run()
    .then(function () { return core.info('Updated fxmanifest.lua versions successfully'); })["catch"](function (error) { return core.setFailed(error.message); });
