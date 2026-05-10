import { Injectable, Logger } from '@nestjs/common';
import { DirectusService } from './directus.service';

@Injectable()
export class DirectusInitializationService {
  private readonly logger = new Logger(DirectusInitializationService.name);

  constructor(private readonly directusService: DirectusService) {}

  async initializeCollections(): Promise<void> {
    this.logger.log('Iniciando sincronización de colecciones con Directus...');

    const collections = [
      this.getLeadsCollection(),
      this.getProductosCollection(),
      this.getPublicacionesBlogCollection(),
      this.getTestimoniosCollection(),
    ];

    for (const collection of collections) {
      try {
        await this.ensureCollectionExists(collection);
      } catch (error) {
        this.logger.error(
          `Error al crear/verificar colección ${collection.collection}:`,
          error,
        );
        throw error;
      }
    }

    // Configurar permisos para las colecciones
    try {
      await this.configurePermissions(collections);
    } catch (error) {
      this.logger.error(
        'Error al configurar permisos:',
        error,
      );
      throw error;
    }

    this.logger.log('Sincronización de colecciones completada exitosamente');
  }

  private async ensureCollectionExists(collectionDef: {
    collection: string;
    fields: Array<{
      field: string;
      type: string;
      meta?: Record<string, unknown>;
      schema?: Record<string, unknown>;
    }>;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const collections = await this.directusService.listCollections();
      const exists = collections.some(
        (c) => c.collection === collectionDef.collection,
      );

      if (exists) {
        this.logger.log(
          `Colección "${collectionDef.collection}" ya existe, omitiendo...`,
        );
        return;
      }

      this.logger.log(
        `Creando colección "${collectionDef.collection}"...`,
      );
      await this.directusService.createCollection(collectionDef);
      this.logger.log(
        `Colección "${collectionDef.collection}" creada exitosamente`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate')
      ) {
        this.logger.log(
          `Colección "${collectionDef.collection}" ya existe`,
        );
        return;
      }
      throw error;
    }
  }

  private async configurePermissions(
    collections: Array<{ collection: string }>,
  ): Promise<void> {
    this.logger.log('Configurando permisos para colecciones...');

    try {
      const roles = await this.directusService.listRoles();
      const actions: Array<'create' | 'read' | 'update' | 'delete'> = [
        'create',
        'read',
        'update',
        'delete',
      ];

      for (const role of roles) {
        // Obtener permisos existentes para este rol
        const existingPermissions = await this.directusService.listPermissions({
          'filter[role]': role.id,
        });

        for (const collection of collections) {
          for (const action of actions) {
            const permissionExists = existingPermissions.some(
              (p) =>
                p.role === role.id &&
                p.collection === collection.collection &&
                p.action === action,
            );

            if (!permissionExists) {
              try {
                await this.directusService.createPermission({
                  role: role.id,
                  collection: collection.collection,
                  action,
                });
                this.logger.log(
                  `Permiso "${action}" asignado para "${collection.collection}" en rol "${role.name}"`,
                );
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                if (!errorMessage.includes('already exists')) {
                  this.logger.warn(
                    `No se pudo crear permiso ${action} para ${collection.collection} en rol ${role.name}:`,
                    errorMessage,
                  );
                }
              }
            } else {
              this.logger.debug(
                `Permiso "${action}" ya existe para "${collection.collection}" en rol "${role.name}"`,
              );
            }
          }
        }
      }

      this.logger.log('Permisos configurados exitosamente');
    } catch (error) {
      this.logger.warn(
        'Advertencia al configurar permisos (puede ser normal si el token no tiene permisos de admin):',
        error instanceof Error ? error.message : String(error),
      );
      // No lanzamos error aquí porque puede ser normal que falte acceso a roles/permisos
    }
  }

  private getLeadsCollection() {
    return {
      collection: process.env.DIRECTUS_COLLECTION_LEADS || 'leads',
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: {
            hidden: true,
            readonly: true,
          },
          schema: {
            is_primary_key: true,
          },
        },
        {
          field: 'nombre',
          type: 'string',
          meta: {
            interface: 'input',
          },
          schema: {
            max_length: 255,
          },
        },
        {
          field: 'telefono',
          type: 'string',
          meta: {
            interface: 'input',
          },
          schema: {
            max_length: 20,
          },
        },
        {
          field: 'consulta',
          type: 'text',
          meta: {
            interface: 'input-multiline',
          },
        },
        {
          field: 'origen',
          type: 'string',
          meta: {
            interface: 'select-dropdown',
            options: {
              choices: [
                { text: 'Contacto Web', value: 'contacto_web' },
                { text: 'Redes Sociales', value: 'redes_sociales' },
                { text: 'Recomendación', value: 'recomendacion' },
                { text: 'Otro', value: 'otro' },
              ],
            },
          },
          schema: {
            max_length: 50,
            default_value: 'contacto_web',
          },
        },
        {
          field: 'marcaTemporal',
          type: 'timestamp',
          meta: {
            hidden: false,
            readonly: true,
          },
          schema: {
            default_value: 'now()',
          },
        },
      ],
      meta: {
        display_template: '{{nombre}} - {{telefono}}',
      },
    };
  }

  private getProductosCollection() {
    return {
      collection: process.env.DIRECTUS_COLLECTION_PRODUCTOS || 'productos',
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: {
            hidden: true,
            readonly: true,
          },
          schema: {
            is_primary_key: true,
          },
        },
        {
          field: 'slug',
          type: 'string',
          meta: {
            interface: 'input-slug',
          },
          schema: {
            max_length: 255,
            is_unique: true,
          },
        },
        {
          field: 'nombre',
          type: 'string',
          meta: {
            interface: 'input',
          },
          schema: {
            max_length: 255,
          },
        },
        {
          field: 'marca',
          type: 'string',
          meta: {
            interface: 'input',
          },
          schema: {
            max_length: 100,
          },
        },
        {
          field: 'imagenId',
          type: 'string',
          meta: {
            interface: 'input',
            note: 'ID del archivo en Directus',
          },
          schema: {
            max_length: 255,
          },
        },
        {
          field: 'imagenUrl',
          type: 'string',
          meta: {
            interface: 'input',
            readonly: true,
            note: 'URL construida automáticamente',
          },
          schema: {
            max_length: 500,
          },
        },
        {
          field: 'categoria',
          type: 'string',
          meta: {
            interface: 'input',
          },
          schema: {
            max_length: 100,
          },
        },
        {
          field: 'descripcion',
          type: 'text',
          meta: {
            interface: 'input-multiline',
          },
        },
        {
          field: 'precioArs',
          type: 'integer',
          meta: {
            interface: 'input',
            note: 'Precio en pesos argentinos',
          },
          schema: {
            default_value: 0,
          },
        },
        {
          field: 'stock',
          type: 'integer',
          meta: {
            interface: 'input',
          },
          schema: {
            default_value: 0,
          },
        },
        {
          field: 'destacado',
          type: 'boolean',
          meta: {
            interface: 'boolean',
          },
          schema: {
            default_value: false,
          },
        },
      ],
      meta: {
        display_template: '{{nombre}} - {{categoria}}',
      },
    };
  }

  private getPublicacionesBlogCollection() {
    return {
      collection: process.env.DIRECTUS_COLLECTION_BLOG || 'publicaciones_blog',
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: {
            hidden: true,
            readonly: true,
          },
          schema: {
            is_primary_key: true,
          },
        },
        {
          field: 'slug',
          type: 'string',
          meta: {
            interface: 'input-slug',
          },
          schema: {
            max_length: 255,
            is_unique: true,
          },
        },
        {
          field: 'titulo',
          type: 'string',
          meta: {
            interface: 'input',
          },
          schema: {
            max_length: 255,
          },
        },
        {
          field: 'resumen',
          type: 'text',
          meta: {
            interface: 'input-multiline',
          },
        },
        {
          field: 'fechaPublicacion',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
          },
          schema: {
            default_value: 'now()',
          },
        },
      ],
      meta: {
        display_template: '{{titulo}}',
      },
    };
  }

  private getTestimoniosCollection() {
    return {
      collection: process.env.DIRECTUS_COLLECTION_TESTIMONIOS || 'testimonios',
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: {
            hidden: true,
            readonly: true,
          },
          schema: {
            is_primary_key: true,
          },
        },
        {
          field: 'nombre',
          type: 'string',
          meta: {
            interface: 'input',
          },
          schema: {
            max_length: 255,
          },
        },
        {
          field: 'empresa',
          type: 'string',
          meta: {
            interface: 'input',
          },
          schema: {
            max_length: 255,
          },
        },
        {
          field: 'mensaje',
          type: 'text',
          meta: {
            interface: 'input-multiline',
          },
        },
        {
          field: 'puntuacion',
          type: 'integer',
          meta: {
            interface: 'select-dropdown',
            note: 'Puntuación de 1 a 5',
            options: {
              choices: [
                { text: '1 estrella', value: 1 },
                { text: '2 estrellas', value: 2 },
                { text: '3 estrellas', value: 3 },
                { text: '4 estrellas', value: 4 },
                { text: '5 estrellas', value: 5 },
              ],
            },
          },
          schema: {
            default_value: 5,
          },
        },
      ],
      meta: {
        display_template: '{{nombre}} - {{empresa}}',
      },
    };
  }
}
