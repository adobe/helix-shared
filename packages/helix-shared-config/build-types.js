/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const { compileFromFile } = require('json-schema-to-typescript');
const fs = require('fs/promises');
const path = require('path');

/**
 * Directory containing all schemas
 */
const SCHEMA_ROOT = './src/schemas';

/**
 * Types root directory
 */
const TYPES_ROOT = './src/types';

/**
 * Resolver for $refs pointing to ns.adobe.com
 * but defined locally in the schemas.
 *
 * @example
 * `file = { url: https://ns.adobe.com/helix/shared/strains }`
 * returns data from `./src/schemas/strains.schema.json`
 */
const adobeNSresolver = {
  order: 1,

  canRead: (file) => file.url.startsWith('https://ns.adobe.com/helix/shared/'),

  read(file) {
    const { url } = file;
    const schemaName = url.split('https://ns.adobe.com/helix/shared/')[1];
    return fs.readFile(path.resolve(__dirname, SCHEMA_ROOT, `./${schemaName}.schema.json`));
  },
};

/**
 * json-schema-to-typescript options
 */
const opts = {
  $refOptions: {
    resolve: { adobeNS: adobeNSresolver },
  },
};

/**
 * Compile all schemas to types
 */
(async () => {
  const files = await fs.readdir(SCHEMA_ROOT);

  const p = files
    .filter((f) => f.endsWith('.schema.json'))
    .map(async (file) => {
      const schemaName = file.split('.schema.json')[0];
      const schemaPath = path.resolve(__dirname, SCHEMA_ROOT, file);
      const declPath = path.resolve(__dirname, TYPES_ROOT, `${schemaName}.d.ts`);

      try {
        const typeDecl = await compileFromFile(schemaPath, opts);
        await fs.writeFile(declPath, typeDecl);
      } catch (e) {
        console.error(`Failed to compile ${schemaName}: `, e.message);
      }
    });

  await Promise.all(p);
})(); // Wrap in parenthesis and call now
