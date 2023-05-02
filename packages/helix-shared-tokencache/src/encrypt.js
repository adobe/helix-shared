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
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const SALT_SIZE = 8;
const IV_SIZE = 12;
const AUTH_TAG_SIZE = 16;

function deriveKey(key, salt) {
  return crypto.pbkdf2Sync(key, salt, 10000, 32, 'sha512');
}

/**
 * Provides an AES-GCM symmetric encryption using a key derivation from a generic password.
 * The resulting string is a base64 encoded buffer of the salt, iv, auth and encrypted text.
 * Using GCM has the advantage over plain AES, that the validity of the key can be verified.
 * (similar to a AES + HMAC approach).
 *
 * result = base64( salt | iv | auth | enc )
 *
 * @param {string} key encryption key / password
 * @param {Buffer} plain Plain text to encrypt
 * @return {Buffer} digest.
 */
export function encrypt(key, plain) {
  const salt = crypto.randomBytes(SALT_SIZE);
  const iv = crypto.randomBytes(IV_SIZE);
  const derivedKey = deriveKey(key, salt);
  const cipher = crypto.createCipheriv(ALGO, derivedKey, iv);

  const data = [salt, iv, null];
  data.push(cipher.update(plain));
  data.push(cipher.final());
  data[2] = cipher.getAuthTag();
  return Buffer.concat(data);
}

/**
 * Decrypts a AES-GCM encrypted digest.
 * @param {string} key encryption key / password
 * @param {Buffer} data the encrypted data
 * @returns {Buffer} the plain text
 * @throws an error if the given key cannot decrypt the digest.
 */
export function decrypt(key, data) {
  const salt = data.slice(0, SALT_SIZE);
  const iv = data.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
  const authTag = data.slice(SALT_SIZE + IV_SIZE, SALT_SIZE + IV_SIZE + AUTH_TAG_SIZE);
  const enc = data.slice(SALT_SIZE + IV_SIZE + AUTH_TAG_SIZE);

  const derivedKey = deriveKey(key, salt);
  const decipher = crypto.createDecipheriv(ALGO, derivedKey, iv);
  decipher.setAuthTag(authTag);

  const ret = [
    decipher.update(enc),
    decipher.final(),
  ];
  return Buffer.concat(ret);
}
