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

    try {
      await this.configurePermissions(collections);
    } catch (error) {
      this.logger.error('Error al configurar permisos:', error);
    }

    this.logger.log('Sincronización de colecciones completada exitosamente');
  }

  private async ensureCollectionExists(collectionDef: any): Promise<void> {
    try {
      const existingCollections = await this.directusService.listCollections();
      const exists = existingCollections.some(
        (c) => c.collection === collectionDef.collection,
      );

      if (exists) {
        this.logger.log(`Colección "${collectionDef.collection}" ya existe.`);
        return;
      }

      this.logger.log(`Creando colección "${collectionDef.collection}"...`);
      
      // Forzamos que la colección sea visible en el panel administrativo
      const payload = {
        ...collectionDef,
        meta: {
          ...collectionDef.meta,
          hidden: false, // CLAVE: Si es true, no aparece en el menú
          singleton: false,
        },
      };

      await this.directusService.createCollection(payload);
      this.logger.log(`Colección "${collectionDef.collection}" creada y visible.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) return;
      throw error;
    }
  }

  private async configurePermissions(collections: any[]): Promise<void> {
    this.logger.log('Configurando permisos...');
    try {
      const roles = await this.directusService.listRoles();
      const actions: Array<'create' | 'read' | 'update' | 'delete'> = ['create', 'read', 'update', 'delete'];

      for (const role of roles) {
        // Omitimos el rol de Admin (ya tiene todo)
        if (role.name?.toLowerCase().includes('admin')) continue;

        for (const col of collections) {
          for (const action of actions) {
            try {
              await this.directusService.createPermission({
                role: role.id,
                collection: col.collection,
                action,
                permissions: {}, // Permisos completos sin restricciones
                validation: {},
              });
            } catch (e) {
              // Ignorar si ya existe
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn('No se pudieron auto-configurar todos los permisos. Revisa manualmente en el panel.');
    }
  }

  // --- Definiciones de Colecciones ---

  private getLeadsCollection() {
    return {
      collection: process.env.DIRECTUS_COLLECTION_LEADS || 'leads',
      meta: { icon: 'contact_page', display_template: '{{nombre}}' },
      fields: [
        this.primaryKeyField(),
        { field: 'nombre', type: 'string', meta: { interface: 'input' } },
        { field: 'telefono', type: 'string', meta: { interface: 'input' } },
        { field: 'consulta', type: 'text', meta: { interface: 'input-multiline' } },
        {
          field: 'origen',
          type: 'string',
          meta: {
            interface: 'select-dropdown',
            options: {
              choices: [
                { text: 'Contacto Web', value: 'contacto_web' },
                { text: 'Redes Sociales', value: 'redes_sociales' },
              ],
            },
          },
        },
      ],
    };
  }

  private getProductosCollection() {
    return {
      collection: process.env.DIRECTUS_COLLECTION_PRODUCTOS || 'productos',
      meta: { icon: 'shopping_bag', display_template: '{{nombre}}' },
      fields: [
        this.primaryKeyField(),
        { field: 'slug', type: 'string', meta: { interface: 'input-slug' }, schema: { is_unique: true } },
        { field: 'nombre', type: 'string', meta: { interface: 'input' } },
        { field: 'marca', type: 'string', meta: { interface: 'input' } },
        { field: 'categoria', type: 'string', meta: { interface: 'input' } },
        { field: 'precioArs', type: 'integer', meta: { interface: 'input' } },
        { field: 'stock', type: 'integer', meta: { interface: 'input' } },
        { field: 'descripcion', type: 'text', meta: { interface: 'wysiwyg' } },
        { field: 'destacado', type: 'boolean', meta: { interface: 'boolean' } },
        { field: 'imagenId', type: 'string', meta: { interface: 'input', note: 'ID del archivo' } },
      ],
    };
  }

  private getPublicacionesBlogCollection() {
    return {
      collection: process.env.DIRECTUS_COLLECTION_BLOG || 'publicaciones_blog',
      meta: { icon: 'article', display_template: '{{titulo}}' },
      fields: [
        this.primaryKeyField(),
        { field: 'slug', type: 'string', meta: { interface: 'input-slug' } },
        { field: 'titulo', type: 'string', meta: { interface: 'input' } },
        { field: 'resumen', type: 'text', meta: { interface: 'input-multiline' } },
        { field: 'contenido', type: 'text', meta: { interface: 'wysiwyg' } },
        { field: 'fechaPublicacion', type: 'timestamp', meta: { interface: 'datetime' } },
      ],
    };
  }

  private getTestimoniosCollection() {
    return {
      collection: process.env.DIRECTUS_COLLECTION_TESTIMONIOS || 'testimonios',
      meta: { icon: 'reviews', display_template: '{{nombre}}' },
      fields: [
        this.primaryKeyField(),
        { field: 'nombre', type: 'string', meta: { interface: 'input' } },
        { field: 'empresa', type: 'string', meta: { interface: 'input' } },
        { field: 'mensaje', type: 'text', meta: { interface: 'input-multiline' } },
        { field: 'puntuacion', type: 'integer', meta: { interface: 'rating' } },
      ],
    };
  }

  // Helper para el campo ID que Directus requiere para que funcione el Admin
  private primaryKeyField() {
    return {
      field: 'id',
      type: 'uuid',
      meta: {
        interface: 'input',
        hidden: true,
        readonly: true,
      },
      schema: {
        is_primary_key: true,
        has_auto_increment: false,
      },
    };
  }
}