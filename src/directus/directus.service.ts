import { Injectable, ServiceUnavailableException } from '@nestjs/common';

type Primitive = string | number | boolean;
type QueryValue = Primitive | Primitive[];

type QueryParams = Record<string, QueryValue | undefined>;

type DirectusResponse<T> = {
  data: T;
};

@Injectable()
export class DirectusService {
  private readonly directusUrl = process.env.DIRECTUS_URL?.trim();
  private readonly directusToken = process.env.DIRECTUS_TOKEN?.trim();

  construirUrlAsset(fileId: string): string {
    if (!this.directusUrl) {
      throw new ServiceUnavailableException(
        'DIRECTUS_URL no configurada en el backend',
      );
    }

    const base = this.directusUrl.endsWith('/')
      ? this.directusUrl.slice(0, -1)
      : this.directusUrl;

    return `${base}/assets/${fileId}`;
  }

  async listItems<T>(
    collection: string,
    params: QueryParams = {},
  ): Promise<T[]> {
    return this.request<T[]>(`/items/${collection}`, {
      method: 'GET',
      query: params,
    });
  }

  async createItem<TInput extends object, TOutput>(
    collection: string,
    payload: TInput,
  ): Promise<TOutput> {
    return this.request<TOutput>(`/items/${collection}`, {
      method: 'POST',
      body: payload,
    });
  }

  async listCollections(): Promise<Array<{ collection: string }>> {
    return this.request<Array<{ collection: string }>>('/collections', {
      method: 'GET',
    });
  }

  async createCollection(collection: {
    collection: string;
    fields: Array<{
      field: string;
      type: string;
      meta?: Record<string, unknown>;
      schema?: Record<string, unknown>;
    }>;
    meta?: Record<string, unknown>;
  }): Promise<{ collection: string }> {
    return this.request<{ collection: string }>('/collections', {
      method: 'POST',
      body: collection,
    });
  }

  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST';
      query?: QueryParams;
      body?: object;
    },
  ): Promise<T> {
    if (!this.directusUrl) {
      throw new ServiceUnavailableException(
        'DIRECTUS_URL no configurada en el backend',
      );
    }

    const url = new URL(path, this.directusUrl.endsWith('/') ? this.directusUrl : `${this.directusUrl}/`);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (typeof value === 'undefined') {
          continue;
        }

        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
          continue;
        }

        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.directusToken
          ? { Authorization: `Bearer ${this.directusToken}` }
          : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      let detalle = '';

      try {
        const errorBody = (await response.json()) as {
          errors?: Array<{ message?: string }>;
        };
        detalle = errorBody.errors?.[0]?.message || '';
      } catch {
        detalle = '';
      }

      throw new ServiceUnavailableException(
        `Error consultando Directus (${response.status})${
          detalle ? `: ${detalle}` : ''
        }`,
      );
    }

    const json = (await response.json()) as DirectusResponse<T>;
    return json.data;
  }
}
