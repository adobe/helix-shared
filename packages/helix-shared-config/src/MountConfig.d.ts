/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
export interface MountConfig {
  /**
   * Defines a mapping between mount points and source URLs.
   * Mount points **must** start with a slash (`/`) but may not end with one.
   */
  mountpoints: {
    [k: string]: string|MountPoint;
  };

  /**
   * Mapping from subtrees to single sources for catch-all folder support.
   */
  folders?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^/.*[^/]$".
     */
    [k: string]: string;
  };

  /**
   * Matches the given resource path against the mount points and returns the mount point if found.
   * The mount point will also include a `relPath` property, which denotes the relative path
   * from the mount points root.
   *
   * @param {string} resourcePath The resource path
   * @returns {MountPoint|null} The matched mount point or {@code null}.
   */
  match(resourcePath): MatchResult|null;
}

export interface MatchResult extends MountPoint {
  relPath:string;
}

export interface MountPoint extends OnedriveMountPoint, GoogleMountPoint, MarkupMountPoint {}

/**
 * Defines the target URL where content should be retrieved from.
 */
export interface BaseMountPoint {
  path: string;

  url: string;

  /**
   * mountpoint type
   */
  type?: 'onedrive' | 'google' | 'markup';

  /**
   * encrypted credentials.
   */
  credentials?: string[];

  /**
   * computed content-bus id.
   */
  contentBusId?: string;
}

/**
 * Mountpoint to a sharepoint/onedrive root.
 */
export interface OnedriveMountPoint extends BaseMountPoint {
  /**
   * suffix for markup type
   */
  suffix?: string;
  /**
   * Onedrive tenant id. If missing, it is computed from url.
   */
  tenantId?: string;
  /**
   * drive item id for google type
   */
  id?: string;
}

/**
 * Mountpoint to a googledrive root.
 */
export interface GoogleMountPoint extends BaseMountPoint {
  /**
   * drive item id
   */
  id?: string;
}

/**
 * Mountpoint to a markup source root.
 */
export interface MarkupMountPoint extends BaseMountPoint {
  /**
   * suffix
   * @example '.raw.html'
   */
  suffix?: string;
}
