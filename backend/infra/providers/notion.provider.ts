import axios from 'axios';

import type { Job } from '@models/types';

const NOTION_API_BASE = 'https://www.notion.so/api/v3';
const NOTION_PAGE_ID = process.env.NOTION_PAGE_ID || null;

type NotionSchema = Record<string, { type: string; name: string }>;

interface NotionMeta {
  collectionId: string;
  collectionViewId: string;
  spaceId: string;
  schema: NotionSchema;
}

function toUUID(rawId: string) {
  if (rawId.includes('-')) return rawId;
  return `${rawId.slice(0, 8)}-${rawId.slice(8, 12)}-${rawId.slice(12, 16)}-${rawId.slice(16, 20)}-${rawId.slice(20)}`;
}

function _extractText(prop: any) {
  if (!prop) return '';
  return prop.map((segment: any) => segment[0]).join('');
}

function _extractSelect(prop: any) {
  if (!prop) return null;
  return prop[0][0] ?? null;
}

function _extractMultiSelect(prop: any) {
  if (!prop) return [];
  const raw = prop[0][0];
  return raw ? raw.split(',').map((s: string) => s.trim()) : [];
}

function _extractUrl(prop: any) {
  if (!prop) return null;
  return prop[0][0] ?? null;
}

function _extractDate(prop: any) {
  if (!prop) return null;
  try {
    return prop[0][1][0][1].start_date ?? null;
  } catch {
    return null;
  }
}

class NotionProvider {
  static PAGE_ID = NOTION_PAGE_ID;

  static _cachedMeta: NotionMeta | null = null;

  /* ----------------------------- API Endpoints ----------------------------- */

  /**
   * @param {string} pageId
   * @returns {Promise<Object>}
   */
  static async _loadPageChunk(pageId: string) {
    const response = await axios.post(
      `${NOTION_API_BASE}/loadPageChunk`,
      {
        pageId: toUUID(pageId),
        limit: 50,
        chunkNumber: 0,
        cursor: { stack: [] },
        verticalColumns: false,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  /**
   * @param {string} collectionId
   * @param {string} collectionViewId
   * @param {string} spaceId
   * @param {number} [limit=999]
   * @returns {Promise<Object>}
   */
  static async _queryCollection(
    collectionId: string,
    collectionViewId: string,
    spaceId: string,
    limit = 999
  ) {
    const response = await axios.post(
      `${NOTION_API_BASE}/queryCollection`,
      {
        collection: { id: collectionId, spaceId },
        collectionView: { id: collectionViewId, spaceId },
        loader: {
          type: 'reducer',
          reducers: {
            collection_group_results: {
              type: 'results',
              limit,
            },
          },
          searchQuery: '',
          userTimeZone: 'UTC',
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  /* ----------------------------- Metadata Cache ---------------------------- */

  /**
   * @param {string} pageId
   * @returns {Promise<{ collectionId: string, collectionViewId: string, spaceId: string, schema: Object }>}
   */
  static async _getOrLoadMeta(pageId: string): Promise<NotionMeta> {
    if (this._cachedMeta) return this._cachedMeta;

    const pageData = await this._loadPageChunk(pageId);
    const { block, collection } = pageData.recordMap;

    const cvBlock = Object.values(block).find(
      (b: any) => b.value?.type === 'collection_view'
    ) as any;

    if (!cvBlock) {
      throw new Error('No collection_view block found on this Notion page');
    }

    const collectionId = cvBlock.value.collection_id;
    const collectionViewId = cvBlock.value.view_ids[0];
    const spaceId = cvBlock.value.space_id;
    const schema = collection[collectionId].value.schema;

    this._cachedMeta = { collectionId, collectionViewId, spaceId, schema };
    return this._cachedMeta;
  }

  /* ------------------------------ Row Parsing ------------------------------ */

  /**
   * @param {Object} block
   * @param {Object} schema
   * @returns {Object}
   */
  static _parseRow(block: any, schema: NotionSchema): Job {
    const props = block.value?.value?.properties ?? block.value?.properties ?? {};
    const notionId = block.value?.value?.id ?? block.value?.id;

    const row = { notionId } as Job;

    for (const [key, def] of Object.entries(schema)) {
      const raw = props[key];

      switch (def.type) {
        case 'title':
        case 'text':
          row[def.name] = _extractText(raw);
          break;
        case 'status':
        case 'select':
          row[def.name] = _extractSelect(raw);
          break;
        case 'multi_select':
          row[def.name] = _extractMultiSelect(raw);
          break;
        case 'url':
          row[def.name] = _extractUrl(raw);
          break;
        case 'date':
          row[def.name] = _extractDate(raw);
          break;
        default:
          row[def.name] = _extractText(raw);
      }
    }

    return row;
  }

  /* ------------------------------- Public API ------------------------------ */

  /**
   * Fetch all rows from the Notion database page
   * @param {string} [pageId]
   * @returns {Promise<Array<Object>>}
   */
  static async fetchDatabase(
    pageId: string | null = this.PAGE_ID
  ): Promise<Job[]> {
    if (!pageId) {
      console.warn('NOTION_PAGE_ID not configured, skipping Notion fetch');
      return [];
    }

    const { collectionId, collectionViewId, spaceId, schema } =
      await this._getOrLoadMeta(pageId);

    const queryData = await this._queryCollection(
      collectionId,
      collectionViewId,
      spaceId
    );

    const { blockIds } =
      queryData.result.reducerResults.collection_group_results;
    const blocks = queryData.recordMap.block;

    return blockIds.map((blockId: string) =>
      this._parseRow(blocks[blockId], schema)
    );
  }

  /**
   * Clear the cached metadata
   */
  static clearMetaCache() {
    this._cachedMeta = null;
  }
}

export = NotionProvider;
