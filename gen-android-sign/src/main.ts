import * as core from '@actions/core';
import path from "path";
import fs from "fs";

async function run() {
  try {
    if (process.env.DEBUG_ACTION === 'true') {
      core.debug("DEBUG FLAG DETECTED, SHORTCUTTING ACTION.")
      return;
    }

    const _storePath = core.getInput('path');
    const _signingKeyBase64 = core.getInput('signingKeyBase64');
    const _alias = core.getInput('alias');
    const _keyStorePassword = core.getInput('keyStorePassword');
    const _keyPassword = core.getInput('keyPassword');


    let _betterStorePath = _storePath;
    if (_storePath.indexOf('.properties') == -1) {
      _betterStorePath = path.join(_storePath, 'key.properties');
    }

    console.log(`The sign file will be write to ${_betterStorePath}`);

    // 1. Write jks file
    if (fs.existsSync(_betterStorePath)) {
      fs.rmSync(_betterStorePath, {force: true, recursive: true});
    }
    const parentDir = path.basename(path.dirname(_betterStorePath));
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, {recursive: true});
    }
    const pathSigningKey = path.join(parentDir, 'signingKey.jks');
    fs.writeFileSync(pathSigningKey, _signingKeyBase64, 'base64');

    // 2. write properties
    const propertiesValues = [
      `keyAlias=${_alias}`,
      `storePassword=${_keyStorePassword}`,
      `storeFile=${pathSigningKey}`
    ];
    if (_keyPassword != null && _keyPassword != '') {
      propertiesValues.push(`keyPassword=${_keyPassword}`)
    }
    let pvalue = propertiesValues.join('\n');
    fs.writeFileSync(_betterStorePath, pvalue);

    core.exportVariable(`ANDROID_KEY_PROPERTIES`, _betterStorePath);
    core.setOutput('path', _betterStorePath);

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
      return;
    }
    core.setFailed('Unknown error: ' + error);
  }
}

run();
