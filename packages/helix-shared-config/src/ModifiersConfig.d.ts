/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Structure that groups name value pairs by url, used as modifier sheet, for example
 * in metadata.json or headers.json
 *
 * @example
 *
 * | url   | key | value | Title   | Description    |
 * |-------|-----|-------|---------|----------------|
 * | "/*"  | "A" | "B"   | ""      | ""             |
 * | "/*"  | "C" | "D"   | ""      | ""             |
 * | "/f"  | ""  | ""    | "Hero"  | "Once upon..." |
 *
 * becomes:
 *
 * {
 *   "/*": [
 *     { "key": "A", "value": "B" },
 *     { "key": "C", "value": "D" },
 *   ],
 *   "/f": [
 *     { "key": "title", "value": "Hero" },
 *     { "key": "description", "value": "Once upon..." },
 *   ]
 * }
 */
export declare interface ModifierMap {
  [ModifierUrl:string]: Modifier[];
}

export declare interface Modifier {
  key: string;
  value: string;
}

export type ModifierKeyFilter = (key:string) => boolean;

/**
 * The modifiers class help manage the metadata and headers modifiers.
 */
export declare class ModifiersConfig {
  /**
   * Converts all non-valid characters to `-`.
   * @param {string} text input text
   * @returns {string} the meta name
   */
  static toMetaName(text: string): string;

  /**
   * Converts a globbing expression to regexp. Note that only `*` and `**` are supported yet.
   * @param {string} glob
   * @returns {RegExp}
   */
  static globToRegExp(glob:string): RegExp;

  /**
   * Empty modifiers
   */
  static EMPTY: ModifiersConfig;

  /**
   * Parses a sheet that is in a modifier format into a list of key/value pairs
   *
   * @example
   *
   * | url   | key | value | Title   | Description    |
   * |-------|-----|-------|---------|----------------|
   * | "/*"  | "A" | "B"   | ""      | ""             |
   * | "/*"  | "C" | "D"   | ""      | ""             |
   * | "/f"  | ""  | ""    | "Hero"  | "Once upon..." |
   *
   * becomes:
   *
   * {
   *   "/*": [
   *     { "key": "A", "value": "B" },
   *     { "key": "C", "value": "D" },
   *   ],
   *   "/f": [
   *     { "key": "title", "value": "Hero" },
   *     { "key": "description", "value": "Once upon..." },
   *   ]
   * }
   *
   *
   * @param {object[]} sheet The sheet to parse
   * @param {ModifierKeyFilter} keyFilter filter to apply on keys
   * @returns {ModifierMap} An object containing an array of key/value pairs for every glob
   */
  static parseModifierSheet(sheet:object[], keyFilter: ModifierKeyFilter): ModifierMap;

  /**
   * Creates a ModifierConfig from the given data
   * @param sheet
   * @param keyFilter
   */
  static fromModifierSheet(sheet:object[], keyFilter: ModifierKeyFilter): ModifiersConfig;

  /**
   * Creates a new ModifiersConfig
   * @param {ModifierMap} config
   * @param {ModifierKeyFilter} keyFilter filter to apply on modifier keys
   */
  constructor(config:ModifierMap, keyFilter: ModifierKeyFilter);

  /**
   * Returns the modifier object for the given path, respecting the glob patterns in the urls.
   * @param {string} path
   * @return {object} the modifiers
   */
  getModifiers(path: string): object;
}
