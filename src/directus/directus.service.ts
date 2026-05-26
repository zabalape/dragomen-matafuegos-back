import { Injectable, ServiceUnavailableException } from '@nestjs/common';

type Primitive = string | number | boolean;
type QueryValue =
  | Primitive
  | Primitive[]
  | QueryValue[]
  | { [key: string]: QueryValue | undefined };

type QueryParams = Record<string, QueryValue | undefined>;

type DirectusResponse<T> = {
  data: T;
  meta?: {
    filter_count?: number;
    total_count?: number;
    [key: string]: unknown;
  };
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

  /**
   * NUEVO MÉTODO: Obtiene el stream binario de un asset desde Directus
   */
  async obtenerStreamAsset(fileId: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string }> {
    if (!this.directusUrl) {
      throw new ServiceUnavailableException(
        'DIRECTUS_URL no configurada en el backend',
      );
    }

    const base = this.directusUrl.endsWith('/') ? this.directusUrl : `${this.directusUrl}/`;
    const url = new URL(`assets/${fileId}`, base);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(this.directusToken ? { Authorization: `Bearer ${this.directusToken}` } : {}),
      },
    });

    if (!response.ok || !response.body) {
      throw new ServiceUnavailableException(
        `No se pudo obtener el asset de Directus (${response.status})`,
      );
    }

    return {
      stream: response.body,
      contentType: response.headers.get('content-type') || 'image/jpeg',
    };
  }

  async listItems<T>(
    collection: string,
    params: QueryParams = {},
  ): Promise<T[]> {
    const response = await this.request<T[]>(`/items/${collection}`, {
      method: 'GET',
      query: params,
    });

    return response.data;
  }

  async listItemsWithMeta<T>(
    collection: string,
    params: QueryParams = {},
  ): Promise<DirectusResponse<T[]>> {
    return this.request<T[]>(`/items/${collection}`, {
      method: 'GET',
      query: params,
    });
  }

  async createItem<TInput extends object, TOutput>(
    collection: string,
    payload: TInput,
  ): Promise<TOutput> {
    const response = await this.request<TOutput>(`/items/${collection}`, {
      method: 'POST',
      body: payload,
    });

    return response.data;
  }

  async listCollections(): Promise<Array<{ collection: string }>> {
    const response = await this.request<Array<{ collection: string }>>(
      '/collections',
      {
        method: 'GET',
      },
    );

    return response.data;
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
    const response = await this.request<{ collection: string }>(
      '/collections',
      {
        method: 'POST',
        body: collection,
      },
    );

    return response.data;
  }

  async listRoles(): Promise<Array<{ id: string; name: string }>> {
    const response = await this.request<Array<{ id: string; name: string }>>(
      '/roles',
      {
        method: 'GET',
      },
    );

    return response.data;
  }

  async createPermission(permission: {
    role: string;
    collection: string;
    action: 'create' | 'read' | 'update' | 'delete';
    fields?: string[];
    presets?: Record<string, unknown>;
    validation?: Record<string, unknown>;
  }): Promise<{ id: number }> {
    const response = await this.request<{ id: number }>('/permissions', {
      method: 'POST',
      body: permission,
    });

    return response.data;
  }

  async listPermissions(query?: QueryParams): Promise<
    Array<{
      id: number;
      role: string;
      collection: string;
      action: string;
    }>
  > {
    const response = await this.request<
      Array<{
        id: number;
        role: string;
        collection: string;
        action: string;
      }>
    >('/permissions', {
      method: 'GET',
      query,
    });

    return response.data;
  }

  async updateCollection(
    collection: string,
    data: Record<string, unknown>,
  ): Promise<{ collection: string }> {
    const response = await this.request<{ collection: string }>(
      `/collections/${collection}`,
      {
        method: 'PATCH',
        body: data,
      },
    );

    return response.data;
  }

  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PATCH';
      query?: QueryParams;
      body?: object;
    },
  ): Promise<DirectusResponse<T>> {
    if (!this.directusUrl) {
      throw new ServiceUnavailableException(
        'DIRECTUS_URL no configurada en el backend',
      );
    }

    const url = new URL(
      path,
      this.directusUrl.endsWith('/')
        ? this.directusUrl
        : `${this.directusUrl}/`,
    );

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        this.agregarQueryParam(url.searchParams, key, value);
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

    return (await response.json()) as DirectusResponse<T>;
  }

  private agregarQueryParam(
    searchParams: URLSearchParams,
    key: string,
    value: QueryValue | undefined,
  ) {
    if (typeof value === 'undefined') {
      return;
    }

    if (Array.isArray(value)) {
      if (value.every((item) => this.esPrimitivo(item))) {
        searchParams.set(key, value.map(String).join(','));
        return;
      }

      value.forEach((item, index) => {
        this.agregarQueryParam(searchParams, `${key}[${index}]`, item);
      });
      return;
    }

    if (!this.esPrimitivo(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        this.agregarQueryParam(
          searchParams,
          `${key}[${nestedKey}]`,
          nestedValue,
        );
      }
      return;
    }

    searchParams.set(key, String(value));
  }

  private esPrimitivo(value: unknown): value is Primitive {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  }
}